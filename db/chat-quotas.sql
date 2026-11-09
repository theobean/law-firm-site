-- Install only in a dedicated quota database, as the NOLOGIN chat_quota_owner.
-- scripts/setup-chat-neon.mjs creates the owner/schema and grants runtime access.
-- Runtime connections receive only the two explicitly granted function calls.
-- The login-to-namespace binding and the initial global bucket are provisioned
-- separately; neither function can initialize a missing global abuse budget.

CREATE TABLE IF NOT EXISTS chat_quota.namespaces (
  namespace text NOT NULL CHECK (namespace ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$'),
  environment text NOT NULL CHECK (environment IN ('development', 'preview', 'production')),
  policy_version integer NOT NULL CHECK (policy_version = 1),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp()
    CHECK (pg_catalog.isfinite(created_at)),
  PRIMARY KEY (namespace, environment)
);

CREATE TABLE IF NOT EXISTS chat_quota.role_bindings (
  login_role name PRIMARY KEY,
  role_oid oid NOT NULL UNIQUE,
  namespace text NOT NULL,
  environment text NOT NULL,
  FOREIGN KEY (namespace, environment)
    REFERENCES chat_quota.namespaces(namespace, environment) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_quota.buckets (
  namespace text NOT NULL,
  environment text NOT NULL,
  scope_key text NOT NULL CHECK (
    scope_key ~ '^(global|subject:(anonymous|authenticated):[a-f0-9]{64}|network:[a-f0-9]{64})$'
  ),
  requests numeric(24,12) NOT NULL CHECK (requests >= 0 AND requests <= 60),
  tokens numeric(24,12) NOT NULL CHECK (tokens >= 0 AND tokens <= 1000000),
  updated_at timestamptz NOT NULL CHECK (pg_catalog.isfinite(updated_at)),
  day bigint NOT NULL CHECK (day >= 0),
  day_requests bigint NOT NULL CHECK (day_requests >= 0 AND day_requests <= 1000),
  day_tokens bigint NOT NULL CHECK (day_tokens >= 0 AND day_tokens <= 10000000),
  PRIMARY KEY (namespace, environment, scope_key),
  FOREIGN KEY (namespace, environment)
    REFERENCES chat_quota.namespaces(namespace, environment) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS chat_quota_buckets_prune
  ON chat_quota.buckets(namespace, environment, updated_at)
  WHERE scope_key <> 'global';

CREATE TABLE IF NOT EXISTS chat_quota.leases (
  namespace text NOT NULL,
  environment text NOT NULL,
  lease_id uuid NOT NULL,
  tier text NOT NULL CHECK (tier IN ('anonymous', 'authenticated')),
  subject text NOT NULL CHECK (subject ~ '^[a-f0-9]{64}$'),
  network text NOT NULL CHECK (network ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL CHECK (pg_catalog.isfinite(expires_at)),
  PRIMARY KEY (namespace, environment, lease_id),
  FOREIGN KEY (namespace, environment)
    REFERENCES chat_quota.namespaces(namespace, environment) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS chat_quota_leases_expiry
  ON chat_quota.leases(namespace, environment, expires_at);
CREATE INDEX IF NOT EXISTS chat_quota_leases_subject
  ON chat_quota.leases(namespace, environment, tier, subject, expires_at);
CREATE INDEX IF NOT EXISTS chat_quota_leases_network
  ON chat_quota.leases(namespace, environment, network, expires_at);

CREATE OR REPLACE FUNCTION chat_quota.reserve(
  p_environment text,
  p_tier text,
  p_subject text,
  p_network text,
  p_cost bigint,
  p_lease_id uuid
) RETURNS TABLE(allowed boolean, retry_after integer, policy_version integer)
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
PARALLEL UNSAFE
SET search_path = pg_catalog, pg_temp
SET lock_timeout = '2s'
AS $reserve$
DECLARE
  v_namespace text;
  v_environment text;
  v_policy integer;
  v_bucket chat_quota.buckets%ROWTYPE;
  v_found boolean;
  v_now timestamptz;
  v_day bigint;
  v_next_day timestamptz;
  v_keys text[];
  v_rpm integer[];
  v_tpm bigint[];
  v_rpd integer[];
  v_tpd bigint[];
  v_concurrency integer[];
  v_requests numeric[] := ARRAY[]::numeric[];
  v_tokens numeric[] := ARRAY[]::numeric[];
  v_day_requests bigint[] := ARRAY[]::bigint[];
  v_day_tokens bigint[] := ARRAY[]::bigint[];
  v_elapsed numeric;
  v_active bigint;
  v_expiry timestamptz;
  v_retry numeric := 0;
  i integer;
BEGIN
  IF p_environment IS NULL OR p_tier IS NULL OR
      p_tier NOT IN ('anonymous', 'authenticated') OR
      p_subject IS NULL OR p_subject !~ '^[a-f0-9]{64}$' OR
      p_network IS NULL OR p_network !~ '^[a-f0-9]{64}$' OR
      p_cost IS NULL OR p_cost < 1 OR p_cost > 64000 OR p_lease_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'quota_invalid_request';
  END IF;

  -- SESSION_USER remains the original login inside SECURITY DEFINER. The role
  -- OID check also prevents a dropped/recreated login inheriting an old binding.
  SELECT b.namespace, b.environment INTO v_namespace, v_environment
    FROM chat_quota.role_bindings AS b
    JOIN pg_catalog.pg_roles AS r ON r.oid = b.role_oid AND r.rolname = b.login_role
    WHERE b.login_role = SESSION_USER;
  IF NOT FOUND OR v_environment IS DISTINCT FROM p_environment THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'quota_forbidden';
  END IF;

  -- Every admission and release uses this same pre-seeded guard first. No
  -- identity-controlled key can choose a different lock or a different budget.
  SELECT n.policy_version INTO v_policy
    FROM chat_quota.namespaces AS n
    WHERE n.namespace = v_namespace AND n.environment = v_environment
    FOR UPDATE;
  IF NOT FOUND OR v_policy IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  SELECT b.* INTO v_bucket FROM chat_quota.buckets AS b
    WHERE b.namespace = v_namespace AND b.environment = v_environment AND b.scope_key = 'global'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;

  -- Read the database clock AFTER acquiring the serialization guard and global
  -- row. A transaction-start timestamp could be stale after waiting for a lock.
  v_now := pg_catalog.clock_timestamp();
  v_day := pg_catalog.floor(EXTRACT(epoch FROM v_now) / 86400)::bigint;
  v_next_day := pg_catalog.to_timestamp(((v_day + 1) * 86400)::double precision);
  IF v_bucket.updated_at > v_now OR v_bucket.day > v_day THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM chat_quota.leases AS l
    WHERE l.namespace = v_namespace AND l.environment = v_environment
      AND l.expires_at > v_now + interval '60 seconds'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  IF EXISTS (
    SELECT 1 FROM chat_quota.leases AS l
    WHERE l.namespace = v_namespace AND l.environment = v_environment AND l.lease_id = p_lease_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'quota_invalid_request';
  END IF;

  -- Bounded maintenance cannot create identity rows on a denied request. Only
  -- expired leases and subject/network buckets whose UTC-day retention ended
  -- are removed. Global state is never deleted or automatically re-created.
  WITH expired AS (
    SELECT l.lease_id FROM chat_quota.leases AS l
    WHERE l.namespace = v_namespace AND l.environment = v_environment AND l.expires_at <= v_now
    ORDER BY l.expires_at, l.lease_id LIMIT 128
  )
  DELETE FROM chat_quota.leases AS l USING expired AS e
    WHERE l.namespace = v_namespace AND l.environment = v_environment AND l.lease_id = e.lease_id;

  WITH expired AS (
    SELECT b.scope_key FROM chat_quota.buckets AS b
    WHERE b.namespace = v_namespace AND b.environment = v_environment
      AND b.scope_key <> 'global' AND b.day < v_day - 1
      AND b.updated_at < v_now - interval '24 hours'
    ORDER BY b.updated_at, b.scope_key LIMIT 128
  )
  DELETE FROM chat_quota.buckets AS b USING expired AS e
    WHERE b.namespace = v_namespace AND b.environment = v_environment AND b.scope_key = e.scope_key;

  -- These constants are the version-1 application policy. The caller cannot
  -- provide rates, ceilings, lease duration, namespace or an alternative policy.
  v_keys := ARRAY['global', 'subject:' || p_tier || ':' || p_subject, 'network:' || p_network];
  v_rpm := ARRAY[60, CASE WHEN p_tier = 'authenticated' THEN 20 ELSE 6 END, 30];
  v_tpm := ARRAY[1000000::bigint, CASE WHEN p_tier = 'authenticated' THEN 300000 ELSE 100000 END, 500000];
  v_rpd := ARRAY[1000, CASE WHEN p_tier = 'authenticated' THEN 300 ELSE 30 END, 0];
  v_tpd := ARRAY[10000000::bigint, CASE WHEN p_tier = 'authenticated' THEN 5000000 ELSE 500000 END, 5000000];
  v_concurrency := ARRAY[8, CASE WHEN p_tier = 'authenticated' THEN 2 ELSE 1 END, 3];

  -- Fixed lock order: global, subject, network, always under the namespace guard.
  FOR i IN 1..3 LOOP
    SELECT b.* INTO v_bucket FROM chat_quota.buckets AS b
      WHERE b.namespace = v_namespace AND b.environment = v_environment AND b.scope_key = v_keys[i]
      FOR UPDATE;
    v_found := FOUND;
    IF NOT v_found AND i = 1 THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
    END IF;
    v_requests[i] := v_rpm[i];
    v_tokens[i] := v_tpm[i];
    v_day_requests[i] := 0;
    v_day_tokens[i] := 0;
    IF v_found THEN
      IF v_bucket.requests IS NULL OR v_bucket.tokens IS NULL OR v_bucket.updated_at IS NULL OR
          v_bucket.day IS NULL OR v_bucket.day_requests IS NULL OR v_bucket.day_tokens IS NULL OR
          v_bucket.requests < 0 OR v_bucket.requests > v_rpm[i] OR
          v_bucket.tokens < 0 OR v_bucket.tokens > v_tpm[i] OR
          NOT pg_catalog.isfinite(v_bucket.updated_at) OR v_bucket.updated_at > v_now OR
          v_bucket.day < 0 OR v_bucket.day > v_day OR v_bucket.day_requests < 0 OR
          (v_rpd[i] > 0 AND v_bucket.day_requests > v_rpd[i]) OR
          v_bucket.day_tokens < 0 OR v_bucket.day_tokens > v_tpd[i] THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
      END IF;
      v_elapsed := GREATEST(0, EXTRACT(epoch FROM (v_now - v_bucket.updated_at)));
      v_requests[i] := LEAST(v_rpm[i], v_bucket.requests + v_elapsed * v_rpm[i] / 60);
      v_tokens[i] := LEAST(v_tpm[i], v_bucket.tokens + v_elapsed * v_tpm[i] / 60);
      IF v_bucket.day = v_day THEN
        v_day_requests[i] := v_bucket.day_requests;
        v_day_tokens[i] := v_bucket.day_tokens;
      END IF;
    END IF;

    IF v_requests[i] < 1 THEN
      v_retry := GREATEST(v_retry, (1 - v_requests[i]) * 60 / v_rpm[i]);
    END IF;
    IF v_tokens[i] < p_cost THEN
      v_retry := GREATEST(v_retry, (p_cost - v_tokens[i]) * 60 / v_tpm[i]);
    END IF;
    IF (v_rpd[i] > 0 AND v_day_requests[i] + 1 > v_rpd[i]) OR v_day_tokens[i] + p_cost > v_tpd[i] THEN
      v_retry := GREATEST(v_retry, EXTRACT(epoch FROM (v_next_day - v_now)));
    END IF;

    SELECT pg_catalog.count(*) INTO v_active FROM chat_quota.leases AS l
      WHERE l.namespace = v_namespace AND l.environment = v_environment AND l.expires_at > v_now
        AND (i = 1 OR (i = 2 AND l.tier = p_tier AND l.subject = p_subject) OR (i = 3 AND l.network = p_network));
    IF v_active >= v_concurrency[i] THEN
      SELECT l.expires_at INTO v_expiry FROM chat_quota.leases AS l
        WHERE l.namespace = v_namespace AND l.environment = v_environment AND l.expires_at > v_now
          AND (i = 1 OR (i = 2 AND l.tier = p_tier AND l.subject = p_subject) OR (i = 3 AND l.network = p_network))
        ORDER BY l.expires_at, l.lease_id OFFSET (v_active - v_concurrency[i]) LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
      END IF;
      v_retry := GREATEST(v_retry, EXTRACT(epoch FROM (v_expiry - v_now)));
    END IF;
  END LOOP;

  IF v_retry > 0 THEN
    RETURN QUERY SELECT false, GREATEST(1, LEAST(86400, pg_catalog.ceil(v_retry)::integer)), 1;
    RETURN;
  END IF;

  -- All three admission decisions precede every counter insertion/update.
  FOR i IN 1..3 LOOP
    INSERT INTO chat_quota.buckets AS b
      (namespace, environment, scope_key, requests, tokens, updated_at, day, day_requests, day_tokens)
    VALUES
      (v_namespace, v_environment, v_keys[i], v_requests[i] - 1, v_tokens[i] - p_cost,
       v_now, v_day, v_day_requests[i] + 1, v_day_tokens[i] + p_cost)
    ON CONFLICT (namespace, environment, scope_key) DO UPDATE SET
      requests = EXCLUDED.requests, tokens = EXCLUDED.tokens, updated_at = EXCLUDED.updated_at,
      day = EXCLUDED.day, day_requests = EXCLUDED.day_requests, day_tokens = EXCLUDED.day_tokens;
  END LOOP;
  INSERT INTO chat_quota.leases(namespace, environment, lease_id, tier, subject, network, expires_at)
    VALUES (v_namespace, v_environment, p_lease_id, p_tier, p_subject, p_network, v_now + interval '60 seconds');
  RETURN QUERY SELECT true, 0, 1;
END;
$reserve$;

CREATE OR REPLACE FUNCTION chat_quota.release(p_environment text, p_lease_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
PARALLEL UNSAFE
SET search_path = pg_catalog, pg_temp
SET lock_timeout = '2s'
AS $release$
DECLARE
  v_namespace text;
  v_environment text;
  v_policy integer;
  v_global chat_quota.buckets%ROWTYPE;
  v_now timestamptz;
  v_day bigint;
  v_removed integer;
BEGIN
  IF p_environment IS NULL OR p_lease_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'quota_invalid_request';
  END IF;
  SELECT b.namespace, b.environment INTO v_namespace, v_environment
    FROM chat_quota.role_bindings AS b
    JOIN pg_catalog.pg_roles AS r ON r.oid = b.role_oid AND r.rolname = b.login_role
    WHERE b.login_role = SESSION_USER;
  IF NOT FOUND OR v_environment IS DISTINCT FROM p_environment THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'quota_forbidden';
  END IF;
  SELECT n.policy_version INTO v_policy FROM chat_quota.namespaces AS n
    WHERE n.namespace = v_namespace AND n.environment = v_environment FOR UPDATE;
  IF NOT FOUND OR v_policy IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  SELECT b.* INTO v_global FROM chat_quota.buckets AS b
    WHERE b.namespace = v_namespace AND b.environment = v_environment AND b.scope_key = 'global'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  v_now := pg_catalog.clock_timestamp();
  v_day := pg_catalog.floor(EXTRACT(epoch FROM v_now) / 86400)::bigint;
  IF v_global.updated_at > v_now OR v_global.day > v_day OR
      v_global.requests IS NULL OR v_global.tokens IS NULL OR
      v_global.requests < 0 OR v_global.requests > 60 OR v_global.tokens < 0 OR v_global.tokens > 1000000 OR
      v_global.day_requests < 0 OR v_global.day_requests > 1000 OR
      v_global.day_tokens < 0 OR v_global.day_tokens > 10000000 THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  -- The UUID is a random per-request capability held only by its backend
  -- closure. Deletion cannot refund budgets or affect another namespace.
  DELETE FROM chat_quota.leases AS l
    WHERE l.namespace = v_namespace AND l.environment = v_environment AND l.lease_id = p_lease_id;
  GET DIAGNOSTICS v_removed = ROW_COUNT;
  RETURN LEAST(1, v_removed);
END;
$release$;

REVOKE ALL ON SCHEMA chat_quota FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA chat_quota FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA chat_quota FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA chat_quota FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA chat_quota REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA chat_quota REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA chat_quota REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

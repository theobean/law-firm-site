-- Stage 3: owner-only admission control upgrade, before freezing Preview.
-- Existing admission state, function identity/ownership/ACLs, counters, balances
-- and leases are preserved. New columns default existing namespaces to enabled.
-- The reserve guard is read UNDER the existing namespace row lock. Release and
-- settlement remain available for draining frozen namespaces.
-- Apply this AFTER legacy migrations 01/02; never reinstall legacy 01 afterward.
DO $quota_admission_control_install$
DECLARE
  v_before jsonb;
  v_after jsonb;
  v_owner_oid oid;
  v_function_security_before jsonb;
  v_function_security_after jsonb;
BEGIN
  SELECT r.oid INTO v_owner_oid FROM pg_catalog.pg_roles AS r WHERE r.rolname = 'chat_quota_owner';
  IF v_owner_oid IS NULL OR NOT pg_catalog.pg_has_role(SESSION_USER, v_owner_oid, 'MEMBER') THEN
    RAISE EXCEPTION 'quota_admission_migration_owner_unavailable';
  END IF;
  SET LOCAL ROLE chat_quota_owner;
  -- CREATE OR REPLACE must never create a missing function with default ACLs.
  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)'),
      ('chat_quota.release(text,uuid,bigint)'),
      ('chat_quota.release(text,uuid)')
    ) AS expected(signature)
    LEFT JOIN pg_catalog.pg_proc AS p ON p.oid = pg_catalog.to_regprocedure(expected.signature)
    WHERE p.oid IS NULL OR p.proowner IS DISTINCT FROM v_owner_oid
  ) THEN RAISE EXCEPTION 'quota_admission_migration_existing_functions_required'; END IF;
  SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) - 'prosrc' ORDER BY p.oid)
    INTO v_function_security_before FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace WHERE n.nspname = 'chat_quota';
  PERFORM pg_catalog.set_config('lock_timeout', '5s', true);
  -- Admission/release take a namespace row lock before touching any counter.
  -- Blocking those calls makes before/after row comparison deterministic.
  LOCK TABLE chat_quota.namespaces IN ACCESS EXCLUSIVE MODE;
  SELECT pg_catalog.jsonb_build_object(
    'namespaces', (SELECT pg_catalog.jsonb_agg(('{"admission_enabled":true,"admission_frozen_at":null}'::jsonb || pg_catalog.to_jsonb(x)) ORDER BY namespace, environment) FROM chat_quota.namespaces AS x),
    'bindings', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY login_role) FROM chat_quota.role_bindings AS x),
    'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, scope_key) FROM chat_quota.buckets AS x),
    'money', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.money_budgets AS x),
    'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, lease_id) FROM chat_quota.leases AS x)
  ) INTO v_before;
  ALTER TABLE chat_quota.namespaces
    DROP CONSTRAINT IF EXISTS namespaces_policy_version_check;
  ALTER TABLE chat_quota.namespaces
    ADD CONSTRAINT namespaces_policy_version_check CHECK (policy_version IN (1, 2));

-- Owner-controlled admission switch. Existing installations remain enabled;
-- newly provisioned Production namespaces start frozen until budget cutover.
ALTER TABLE chat_quota.namespaces
  ADD COLUMN IF NOT EXISTS admission_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS admission_frozen_at timestamptz;
DO $admission_columns$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint AS c
    WHERE c.conrelid = 'chat_quota.namespaces'::pg_catalog.regclass
      AND c.conname = 'chat_quota_namespace_admission_state'
  ) THEN
    ALTER TABLE chat_quota.namespaces
      ADD CONSTRAINT chat_quota_namespace_admission_state CHECK (
        (admission_enabled AND admission_frozen_at IS NULL) OR
        (NOT admission_enabled AND admission_frozen_at IS NOT NULL AND pg_catalog.isfinite(admission_frozen_at))
      );
  END IF;
END;
$admission_columns$;


  EXECUTE $reserve_ddl$
CREATE OR REPLACE FUNCTION chat_quota.reserve(
  p_environment text,
  p_tier text,
  p_subject text,
  p_network text,
  p_cost bigint,
  p_lease_id uuid,
  p_money_cost_eur_micros bigint
) RETURNS TABLE(allowed boolean, retry_after integer, policy_version integer, money_policy_version integer)
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
  v_admission_enabled boolean;
  v_bucket chat_quota.buckets%ROWTYPE;
  v_money chat_quota.money_budgets%ROWTYPE;
  v_money_reserved bigint;
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
      p_cost IS NULL OR p_cost < 1 OR p_cost > 64000 OR p_lease_id IS NULL OR
      p_money_cost_eur_micros IS NULL OR p_money_cost_eur_micros < 1 OR p_money_cost_eur_micros > 5000000 THEN
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
  SELECT n.policy_version, n.admission_enabled INTO v_policy, v_admission_enabled
    FROM chat_quota.namespaces AS n
    WHERE n.namespace = v_namespace AND n.environment = v_environment
    FOR UPDATE;
  IF NOT FOUND OR v_policy IS NULL OR v_policy NOT IN (1, 2) THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  -- Check under the same row lock used by owner freeze/activation. An older
  -- deployed caller or a call already waiting for this lock cannot bypass it.
  IF v_admission_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_admission_disabled';
  END IF;
  SELECT b.* INTO v_bucket FROM chat_quota.buckets AS b
    WHERE b.namespace = v_namespace AND b.environment = v_environment AND b.scope_key = 'global'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;

  SELECT m.* INTO v_money FROM chat_quota.money_budgets AS m
    WHERE m.namespace = v_namespace AND m.environment = v_environment
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  -- Read the database clock AFTER acquiring the guard, global and money rows.
  -- A transaction-start timestamp could be stale after waiting for a lock.
  v_now := pg_catalog.clock_timestamp();
  v_day := pg_catalog.floor(EXTRACT(epoch FROM v_now) / 86400)::bigint;
  v_next_day := pg_catalog.to_timestamp(((v_day + 1) * 86400)::double precision);
  IF v_bucket.updated_at > v_now OR v_bucket.day > v_day THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;

  IF v_money.day IS NULL OR v_money.reserved_eur_micros IS NULL OR
      v_money.day < 0 OR v_money.day > v_day OR
      v_money.reserved_eur_micros < 0 OR v_money.reserved_eur_micros > 5000000 THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  -- Yesterday's spend is logically zero only after the UTC day changes. A new
  -- day's state is persisted only when every admission scope allows this call.
  v_money_reserved := CASE WHEN v_money.day = v_day THEN v_money.reserved_eur_micros ELSE 0 END;
  IF v_money_reserved + p_money_cost_eur_micros > 5000000 THEN
    v_retry := GREATEST(v_retry, EXTRACT(epoch FROM (v_next_day - v_now)));
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

  -- The stored namespace policy selects fixed, server-owned abuse limits.
  -- Policy 1 stays identical for every namespace that has not been activated.
  -- The caller cannot provide rates, ceilings, lease duration or namespace.
  v_keys := ARRAY['global', 'subject:' || p_tier || ':' || p_subject, 'network:' || p_network];
  IF v_policy = 2 THEN
    v_rpm := ARRAY[60, CASE WHEN p_tier = 'authenticated' THEN 20 ELSE 6 END, 30];
    v_tpm := ARRAY[1000000::bigint, CASE WHEN p_tier = 'authenticated' THEN 300000 ELSE 400000 END, 1000000];
    v_rpd := ARRAY[1000, CASE WHEN p_tier = 'authenticated' THEN 300 ELSE 30 END, 0];
    v_tpd := ARRAY[10000000::bigint, CASE WHEN p_tier = 'authenticated' THEN 5000000 ELSE 2000000 END, 5000000];
    v_concurrency := ARRAY[8, CASE WHEN p_tier = 'authenticated' THEN 2 ELSE 1 END, 3];
  ELSE
    v_rpm := ARRAY[60, CASE WHEN p_tier = 'authenticated' THEN 20 ELSE 6 END, 30];
    v_tpm := ARRAY[1000000::bigint, CASE WHEN p_tier = 'authenticated' THEN 300000 ELSE 100000 END, 500000];
    v_rpd := ARRAY[1000, CASE WHEN p_tier = 'authenticated' THEN 300 ELSE 30 END, 0];
    v_tpd := ARRAY[10000000::bigint, CASE WHEN p_tier = 'authenticated' THEN 5000000 ELSE 500000 END, 5000000];
    v_concurrency := ARRAY[8, CASE WHEN p_tier = 'authenticated' THEN 2 ELSE 1 END, 3];
  END IF;

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
    RETURN QUERY SELECT false, GREATEST(1, LEAST(86400, pg_catalog.ceil(v_retry)::integer)), v_policy, 1;
    RETURN;
  END IF;

  -- Financial and all three abuse admission decisions precede every counter
  -- insertion/update. Unknown/error usage and ordinary release retain the full
  -- reservation. Only bounded settlement of this exact live lease can refund.
  UPDATE chat_quota.money_budgets AS m
    SET day = v_day, reserved_eur_micros = v_money_reserved + p_money_cost_eur_micros
    WHERE m.namespace = v_namespace AND m.environment = v_environment;
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
  INSERT INTO chat_quota.leases(namespace, environment, lease_id, tier, subject, network, expires_at,
      money_reserved_eur_micros, money_day)
    VALUES (v_namespace, v_environment, p_lease_id, p_tier, p_subject, p_network,
      v_now + interval '60 seconds', p_money_cost_eur_micros, v_day);
  RETURN QUERY SELECT true, 0, v_policy, 1;
END;
$reserve$;

$reserve_ddl$;
  EXECUTE $release_ddl$
CREATE OR REPLACE FUNCTION chat_quota.release(
  p_environment text,
  p_lease_id uuid,
  p_actual_cost_eur_micros bigint
)
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
  v_money chat_quota.money_budgets%ROWTYPE;
  v_lease chat_quota.leases%ROWTYPE;
  v_found boolean;
  v_now timestamptz;
  v_day bigint;
  v_refund bigint := 0;
  v_removed integer;
BEGIN
  IF p_environment IS NULL OR p_lease_id IS NULL OR p_actual_cost_eur_micros < 0 OR
      p_actual_cost_eur_micros > 5000000 THEN
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
  IF NOT FOUND OR v_policy IS NULL OR v_policy NOT IN (1, 2) THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  SELECT b.* INTO v_global FROM chat_quota.buckets AS b
    WHERE b.namespace = v_namespace AND b.environment = v_environment AND b.scope_key = 'global'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  SELECT m.* INTO v_money FROM chat_quota.money_budgets AS m
    WHERE m.namespace = v_namespace AND m.environment = v_environment
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  -- The random UUID is an internal capability. The login binding fixes its
  -- namespace; no caller-supplied subject, namespace or refund balance is used.
  SELECT l.* INTO v_lease FROM chat_quota.leases AS l
    WHERE l.namespace = v_namespace AND l.environment = v_environment AND l.lease_id = p_lease_id
    FOR UPDATE;
  v_found := FOUND;
  -- Use the clock only after namespace -> global -> money -> exact lease locks.
  v_now := pg_catalog.clock_timestamp();
  v_day := pg_catalog.floor(EXTRACT(epoch FROM v_now) / 86400)::bigint;
  IF v_global.updated_at IS NULL OR NOT pg_catalog.isfinite(v_global.updated_at) OR
      v_global.updated_at > v_now OR v_global.day IS NULL OR v_global.day < 0 OR v_global.day > v_day OR
      v_global.requests IS NULL OR v_global.tokens IS NULL OR
      v_global.day_requests IS NULL OR v_global.day_tokens IS NULL OR
      v_global.requests < 0 OR v_global.requests > 60 OR v_global.tokens < 0 OR v_global.tokens > 1000000 OR
      v_global.day_requests < 0 OR v_global.day_requests > 1000 OR
      v_global.day_tokens < 0 OR v_global.day_tokens > 10000000 THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  IF v_money.day IS NULL OR v_money.day < 0 OR v_money.day > v_day OR
      v_money.reserved_eur_micros IS NULL OR v_money.reserved_eur_micros < 0 OR
      v_money.reserved_eur_micros > 5000000 THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  IF NOT v_found THEN
    RETURN 0;
  END IF;
  IF v_lease.expires_at IS NULL OR NOT pg_catalog.isfinite(v_lease.expires_at) OR
      v_lease.expires_at > v_now + interval '60 seconds' OR
      (v_lease.money_reserved_eur_micros IS NULL) <> (v_lease.money_day IS NULL) OR
      (v_lease.money_reserved_eur_micros IS NOT NULL AND
        (v_lease.money_reserved_eur_micros < 1 OR v_lease.money_reserved_eur_micros > 5000000 OR
          v_lease.money_day < 0 OR v_lease.money_day > v_day)) THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  IF v_lease.money_reserved_eur_micros IS NOT NULL AND
      p_actual_cost_eur_micros > v_lease.money_reserved_eur_micros THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'quota_invalid_request';
  END IF;
  -- NULL usage, legacy NULL metadata, expiry and UTC rollover all forfeit the
  -- reservation. In particular an old request can never reduce a new day's
  -- budget. Zero is accepted only as a trusted backend no-provider settlement.
  IF p_actual_cost_eur_micros IS NOT NULL AND v_lease.money_reserved_eur_micros IS NOT NULL AND
      v_lease.expires_at > v_now AND v_lease.money_day = v_day AND v_money.day = v_day THEN
    IF v_money.reserved_eur_micros < v_lease.money_reserved_eur_micros THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
    END IF;
    v_refund := v_lease.money_reserved_eur_micros - p_actual_cost_eur_micros;
  END IF;
  -- DELETE and the bounded refund commit together once. Replays cannot refund
  -- again. No subject, network or global abuse bucket is ever refunded.
  DELETE FROM chat_quota.leases AS l
    WHERE l.namespace = v_namespace AND l.environment = v_environment AND l.lease_id = p_lease_id;
  GET DIAGNOSTICS v_removed = ROW_COUNT;
  IF v_removed <> 1 THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'quota_state_unavailable';
  END IF;
  IF v_refund > 0 THEN
    UPDATE chat_quota.money_budgets AS m
      SET reserved_eur_micros = v_money.reserved_eur_micros - v_refund
      WHERE m.namespace = v_namespace AND m.environment = v_environment;
  END IF;
  RETURN LEAST(1, v_removed);
END;
$release$;

$release_ddl$;
  SELECT pg_catalog.jsonb_build_object(
    'namespaces', (SELECT pg_catalog.jsonb_agg(('{"admission_enabled":true,"admission_frozen_at":null}'::jsonb || pg_catalog.to_jsonb(x)) ORDER BY namespace, environment) FROM chat_quota.namespaces AS x),
    'bindings', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY login_role) FROM chat_quota.role_bindings AS x),
    'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, scope_key) FROM chat_quota.buckets AS x),
    'money', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.money_budgets AS x),
    'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, lease_id) FROM chat_quota.leases AS x)
  ) INTO v_after;
  SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) - 'prosrc' ORDER BY p.oid)
    INTO v_function_security_after FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace WHERE n.nspname = 'chat_quota';
  IF v_function_security_after IS DISTINCT FROM v_function_security_before THEN
    RAISE EXCEPTION 'quota_admission_migration_function_security_changed';
  END IF;
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'quota_admission_migration_changed_existing_rows';
  END IF;
END;
$quota_admission_control_install$;

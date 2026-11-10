-- ADMIN-ONLY TEMPLATE, NOT an automatic migration. Run after stage 04 and drain.
-- Replace this ONE password placeholder only inside the private Neon SQL UI.
-- Never commit the edited query, print it, or copy it to a chat/log/local file.
-- This provisions an entirely new least-privilege role and DISABLED namespace.
-- A pre-existing role/namespace causes rollback; no existing balance is reset.
DO $provision_production_disabled$
DECLARE
  v_namespace constant text := 'law-firm-site-chat';
  v_preview_role constant name := 'chat_quota_preview';
  v_production_role constant name := 'chat_quota_production';
  v_runtime_password text := '__REPLACE_WITH_PRIVATE_RANDOM_PASSWORD__';
  v_role_oid oid;
  v_database name := pg_catalog.current_database();
  v_preview chat_quota.namespaces%ROWTYPE;
  v_now timestamptz;
  v_day bigint;
BEGIN
  IF v_runtime_password = '__REPLACE_WITH_PRIVATE_RANDOM_PASSWORD__' OR
      v_runtime_password !~ '^[a-zA-Z0-9_-]{43,128}$' THEN
    RAISE EXCEPTION 'private_random_runtime_password_required';
  END IF;
  IF NOT pg_catalog.pg_has_role(SESSION_USER, 'chat_quota_owner', 'MEMBER') THEN
    RAISE EXCEPTION 'cutover_owner_required';
  END IF;
  PERFORM pg_catalog.set_config('lock_timeout', '5s', true);
  SELECT n.* INTO v_preview FROM chat_quota.namespaces AS n
    WHERE n.namespace = v_namespace AND n.environment = 'preview' FOR UPDATE;
  v_now := pg_catalog.clock_timestamp();
  v_day := pg_catalog.floor(EXTRACT(epoch FROM v_now) / 86400)::bigint;
  IF NOT FOUND OR v_preview.admission_enabled OR v_preview.admission_frozen_at IS NULL OR
      v_preview.admission_frozen_at > v_now - interval '65 seconds' OR EXISTS (
        SELECT 1 FROM chat_quota.leases AS l WHERE l.namespace = v_namespace
          AND l.environment = 'preview' AND l.expires_at > v_now
      ) OR NOT EXISTS (
        SELECT 1 FROM chat_quota.role_bindings AS b
          JOIN pg_catalog.pg_roles AS r ON r.oid = b.role_oid AND r.rolname = b.login_role
        WHERE b.namespace = v_namespace AND b.environment = 'preview' AND b.login_role = v_preview_role
      ) THEN RAISE EXCEPTION 'cutover_preview_not_frozen_and_drained'; END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = v_production_role) OR EXISTS (
    SELECT 1 FROM chat_quota.namespaces AS n WHERE n.namespace = v_namespace AND n.environment = 'production'
  ) THEN RAISE EXCEPTION 'cutover_production_already_provisioned_no_changes'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE p.oid = pg_catalog.to_regprocedure('chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)')
      AND p.proowner = 'chat_quota_owner'::pg_catalog.regrole
      AND p.prosrc LIKE '%IF v_admission_enabled IS DISTINCT FROM true THEN%'
  ) THEN RAISE EXCEPTION 'cutover_admission_upgrade_required'; END IF;
  EXECUTE pg_catalog.format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT',
    v_production_role, v_runtime_password);
  SELECT r.oid INTO v_role_oid FROM pg_catalog.pg_roles AS r WHERE r.rolname = v_production_role;
  EXECUTE pg_catalog.format('GRANT CONNECT ON DATABASE %I TO %I', v_database, v_production_role);
  EXECUTE pg_catalog.format('ALTER ROLE %I SET statement_timeout = ''5s''', v_production_role);
  EXECUTE pg_catalog.format('ALTER ROLE %I SET lock_timeout = ''2s''', v_production_role);
  EXECUTE pg_catalog.format('ALTER ROLE %I SET idle_in_transaction_session_timeout = ''5s''', v_production_role);
  SET LOCAL ROLE chat_quota_owner;
  INSERT INTO chat_quota.namespaces(namespace, environment, policy_version, admission_enabled, admission_frozen_at)
    VALUES (v_namespace, 'production', 2, false, v_now);
  INSERT INTO chat_quota.buckets(namespace, environment, scope_key, requests, tokens, updated_at, day, day_requests, day_tokens)
    VALUES (v_namespace, 'production', 'global', 60, 1000000, v_now, v_day, 0, 0);
  INSERT INTO chat_quota.money_budgets(namespace, environment, day, reserved_eur_micros)
    VALUES (v_namespace, 'production', v_day, 0);
  INSERT INTO chat_quota.role_bindings(login_role, role_oid, namespace, environment)
    VALUES (v_production_role, v_role_oid, v_namespace, 'production');
  EXECUTE pg_catalog.format('GRANT USAGE ON SCHEMA chat_quota TO %I', v_production_role);
  EXECUTE pg_catalog.format('GRANT EXECUTE ON FUNCTION chat_quota.reserve(text,text,text,text,bigint,uuid,bigint), chat_quota.release(text,uuid), chat_quota.release(text,uuid,bigint) TO %I', v_production_role);
  RESET ROLE;
  IF pg_catalog.has_database_privilege(v_production_role, v_database, 'CREATE,TEMP') OR
      pg_catalog.has_schema_privilege(v_production_role, 'chat_quota', 'CREATE') OR EXISTS (
        SELECT 1 FROM pg_catalog.pg_auth_members AS m WHERE m.member = v_role_oid
      ) OR EXISTS (
        SELECT 1 FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
        WHERE n.nspname = 'chat_quota' AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
          AND pg_catalog.has_table_privilege(v_production_role, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      ) OR (SELECT pg_catalog.count(*) FROM pg_catalog.pg_proc AS p
        JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
        WHERE n.nspname = 'chat_quota' AND pg_catalog.has_function_privilege(v_production_role, p.oid, 'EXECUTE')) <> 3 THEN
    RAISE EXCEPTION 'cutover_runtime_privilege_verification_failed';
  END IF;
END;
$provision_production_disabled$;

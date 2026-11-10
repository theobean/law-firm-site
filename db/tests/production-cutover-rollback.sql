-- Owner-only rollback fixture; no provider calls, committed roles or spend.
-- Run AFTER migration 03. Namespace admission is exclusively locked while the
-- fixture clock replaces reserve/release; rollback restores all existing state.
-- Embedded stages are checked against their deployment files by local tests.
DO $production_cutover_fixture$
DECLARE
  v_namespace constant text := 'chat-test-production-cutover-rollback';
  v_preview_role constant name := 'chat_quota_preview_testc070ff000000000000000001';
  v_production_role constant name := 'chat_quota_production_testc070ff000000000000000001';
  v_original_role name := CURRENT_USER;
  v_login_oid oid;
  v_role_oid oid;
  v_now timestamptz;
  v_day bigint;
  v_freeze_time timestamptz;
  v_reserve_definition text;
  v_release_definition text;
  v_before jsonb;
  v_after jsonb;
  v_preview_before jsonb;
  v_preview_after jsonb;
  v_money bigint;
  v_admission record;
  v_blocked boolean;
  v_rolled_back boolean := false;
  v_sentinel_message text;
  v_freeze_sql text := $freeze_stage$-- Owner-only cutover stage: freeze the exact live Preview namespace.
-- Idempotent: a retry preserves the original freeze timestamp and all spend.
-- Release/settlement remains available; old immutable Preview deployments use
-- the same database guard and therefore cannot obtain a new reservation.
DO $freeze_preview_admission$
DECLARE
  v_namespace constant text := 'law-firm-site-chat';
  v_preview_role constant name := 'chat_quota_preview';
  v_preview chat_quota.namespaces%ROWTYPE;
  v_now timestamptz;
BEGIN
  IF NOT pg_catalog.pg_has_role(SESSION_USER, 'chat_quota_owner', 'MEMBER') THEN
    RAISE EXCEPTION 'cutover_owner_required';
  END IF;
  SET LOCAL ROLE chat_quota_owner;
  PERFORM pg_catalog.set_config('lock_timeout', '5s', true);
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE p.oid = pg_catalog.to_regprocedure('chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)')
      AND p.prosrc LIKE '%IF v_admission_enabled IS DISTINCT FROM true THEN%'
      AND p.prosrc LIKE '%n.admission_enabled INTO v_policy, v_admission_enabled%'
  ) THEN RAISE EXCEPTION 'cutover_admission_upgrade_required'; END IF;
  SELECT n.* INTO v_preview FROM chat_quota.namespaces AS n
    WHERE n.namespace = v_namespace AND n.environment = 'preview' FOR UPDATE;
  IF NOT FOUND OR v_preview.policy_version NOT IN (1, 2) OR NOT EXISTS (
    SELECT 1 FROM chat_quota.role_bindings AS b
      JOIN pg_catalog.pg_roles AS r ON r.oid = b.role_oid AND r.rolname = b.login_role
    WHERE b.namespace = v_namespace AND b.environment = 'preview' AND b.login_role = v_preview_role
  ) THEN RAISE EXCEPTION 'cutover_preview_target_unavailable'; END IF;
  -- Clock is read after the same row lock held by reserve/release. A reserve
  -- already waiting for it must observe disabled admission when it resumes.
  v_now := pg_catalog.clock_timestamp();
  IF v_preview.admission_enabled THEN
    UPDATE chat_quota.namespaces AS n
      SET admission_enabled = false, admission_frozen_at = v_now
      WHERE n.namespace = v_namespace AND n.environment = 'preview';
  ELSIF v_preview.admission_frozen_at IS NULL OR
      NOT pg_catalog.isfinite(v_preview.admission_frozen_at) OR v_preview.admission_frozen_at > v_now THEN
    RAISE EXCEPTION 'cutover_invalid_preview_freeze';
  END IF;
END;
$freeze_preview_admission$;
$freeze_stage$;
  v_provision_sql text := $provision_stage$-- ADMIN-ONLY TEMPLATE, NOT an automatic migration. Run after stage 04 and drain.
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
$provision_stage$;
  v_activate_sql text := $activate_stage$-- FINAL OWNER-ONLY ACTIVATION. Run only after all production config/gates are ready.
-- Preview stays frozen. Carry its final same-UTC-day charge into a virgin,
-- disabled Production namespace BEFORE enabling policy 2, in one transaction.
-- A retry/already-active/nonzero target FAILS without writes; never reset it.
DO $activate_production_carry_budget$
DECLARE
  v_namespace constant text := 'law-firm-site-chat';
  v_preview_role constant name := 'chat_quota_preview';
  v_production_role constant name := 'chat_quota_production';
  v_preview chat_quota.namespaces%ROWTYPE;
  v_production chat_quota.namespaces%ROWTYPE;
  v_preview_money chat_quota.money_budgets%ROWTYPE;
  v_production_money chat_quota.money_budgets%ROWTYPE;
  v_global chat_quota.buckets%ROWTYPE;
  v_now timestamptz;
  v_day bigint;
  v_carry bigint;
BEGIN
  IF NOT pg_catalog.pg_has_role(SESSION_USER, 'chat_quota_owner', 'MEMBER') THEN
    RAISE EXCEPTION 'cutover_owner_required';
  END IF;
  SET LOCAL ROLE chat_quota_owner;
  PERFORM pg_catalog.set_config('lock_timeout', '5s', true);
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE p.oid = pg_catalog.to_regprocedure('chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)')
      AND p.proowner = 'chat_quota_owner'::pg_catalog.regrole
      AND p.prosrc LIKE '%IF v_admission_enabled IS DISTINCT FROM true THEN%'
      AND p.prosrc LIKE '%IF v_policy = 2 THEN%'
  ) THEN RAISE EXCEPTION 'cutover_admission_upgrade_required'; END IF;
  SELECT n.* INTO v_preview FROM chat_quota.namespaces AS n
    WHERE n.namespace = v_namespace AND n.environment = 'preview' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cutover_preview_target_unavailable'; END IF;
  SELECT n.* INTO v_production FROM chat_quota.namespaces AS n
    WHERE n.namespace = v_namespace AND n.environment = 'production' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cutover_production_target_unavailable'; END IF;
  IF v_production.admission_enabled THEN
    RAISE EXCEPTION 'cutover_production_already_active_no_changes';
  END IF;
  -- Frozen Preview and Production admission serialize on the locked rows above.
  -- Release can finish during the drain, but not while its final balance is read.
  SELECT m.* INTO v_preview_money FROM chat_quota.money_budgets AS m
    WHERE m.namespace = v_namespace AND m.environment = 'preview' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cutover_preview_money_unavailable'; END IF;
  SELECT b.* INTO v_global FROM chat_quota.buckets AS b
    WHERE b.namespace = v_namespace AND b.environment = 'production' AND b.scope_key = 'global' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cutover_production_global_unavailable'; END IF;
  SELECT m.* INTO v_production_money FROM chat_quota.money_budgets AS m
    WHERE m.namespace = v_namespace AND m.environment = 'production' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'cutover_production_money_unavailable'; END IF;
  v_now := pg_catalog.clock_timestamp();
  v_day := pg_catalog.floor(EXTRACT(epoch FROM v_now) / 86400)::bigint;
  IF v_preview.admission_enabled OR v_preview.admission_frozen_at IS NULL OR
      v_preview.admission_frozen_at > v_now - interval '65 seconds' OR EXISTS (
        SELECT 1 FROM chat_quota.leases AS l WHERE l.namespace = v_namespace
          AND l.environment = 'preview' AND l.expires_at > v_now
      ) THEN RAISE EXCEPTION 'cutover_preview_not_frozen_and_drained'; END IF;
  IF v_production.admission_frozen_at IS NULL OR v_production.admission_frozen_at > v_now OR
      v_production.policy_version NOT IN (1, 2) OR EXISTS (
        SELECT 1 FROM chat_quota.namespaces AS n WHERE n.namespace = v_namespace
          AND n.environment NOT IN ('preview', 'production') AND n.admission_enabled
      ) THEN RAISE EXCEPTION 'cutover_unexpected_active_environment'; END IF;
  IF v_preview_money.day > v_day OR v_preview_money.day < 0 OR
      v_preview_money.reserved_eur_micros NOT BETWEEN 0 AND 5000000 OR
      v_production_money.day > v_day OR v_production_money.day < 0 OR
      v_production_money.reserved_eur_micros <> 0 OR
      v_global.requests <> 60 OR v_global.tokens <> 1000000 OR
      v_global.day_requests <> 0 OR v_global.day_tokens <> 0 OR v_global.day > v_day OR
      NOT pg_catalog.isfinite(v_global.updated_at) OR v_global.updated_at > v_now OR EXISTS (
        SELECT 1 FROM chat_quota.buckets AS b WHERE b.namespace = v_namespace
          AND b.environment = 'production' AND b.scope_key <> 'global'
      ) OR EXISTS (
        SELECT 1 FROM chat_quota.leases AS l WHERE l.namespace = v_namespace AND l.environment = 'production'
      ) THEN RAISE EXCEPTION 'cutover_production_not_virgin_no_changes'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM chat_quota.role_bindings AS b
      JOIN pg_catalog.pg_roles AS r ON r.oid = b.role_oid AND r.rolname = b.login_role
    WHERE b.namespace = v_namespace AND b.environment = 'preview' AND b.login_role = v_preview_role
  ) OR NOT EXISTS (
    SELECT 1 FROM chat_quota.role_bindings AS b
      JOIN pg_catalog.pg_roles AS r ON r.oid = b.role_oid AND r.rolname = b.login_role
    WHERE b.namespace = v_namespace AND b.environment = 'production' AND b.login_role = v_production_role
      AND r.rolcanlogin AND NOT r.rolsuper AND NOT r.rolcreatedb AND NOT r.rolcreaterole
      AND NOT r.rolreplication AND NOT r.rolbypassrls AND NOT r.rolinherit
      AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members AS m WHERE m.member = r.oid)
  ) THEN RAISE EXCEPTION 'cutover_runtime_binding_unavailable'; END IF;
  v_carry := CASE WHEN v_preview_money.day = v_day THEN v_preview_money.reserved_eur_micros ELSE 0 END;
  UPDATE chat_quota.money_budgets AS m SET day = v_day, reserved_eur_micros = v_carry
    WHERE m.namespace = v_namespace AND m.environment = 'production' AND m.reserved_eur_micros = 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'cutover_production_balance_changed'; END IF;
  UPDATE chat_quota.namespaces AS n
    SET policy_version = 2, admission_enabled = true, admission_frozen_at = NULL
    WHERE n.namespace = v_namespace AND n.environment = 'production' AND NOT n.admission_enabled;
  IF NOT FOUND THEN RAISE EXCEPTION 'cutover_production_activation_failed'; END IF;
END;
$activate_production_carry_budget$;
$activate_stage$;
BEGIN
  IF NOT pg_catalog.pg_has_role(SESSION_USER, 'chat_quota_owner', 'MEMBER') THEN RAISE EXCEPTION 'fixture_owner_required'; END IF;
  PERFORM pg_catalog.set_config('lock_timeout', '5s', true);
  LOCK TABLE chat_quota.namespaces IN ACCESS EXCLUSIVE MODE;
  SELECT oid INTO v_login_oid FROM pg_catalog.pg_roles WHERE rolname = SESSION_USER;
  IF EXISTS (SELECT 1 FROM chat_quota.role_bindings WHERE login_role = SESSION_USER OR role_oid = v_login_oid) OR
      EXISTS (SELECT 1 FROM chat_quota.namespaces WHERE namespace = v_namespace) OR
      EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname IN (v_preview_role, v_production_role)) THEN
    RAISE EXCEPTION 'fixture_target_not_empty';
  END IF;
  SELECT pg_catalog.pg_get_functiondef('chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)'::pg_catalog.regprocedure) INTO v_reserve_definition;
  SELECT pg_catalog.pg_get_functiondef('chat_quota.release(text,uuid,bigint)'::pg_catalog.regprocedure) INTO v_release_definition;
  IF v_reserve_definition NOT LIKE '%IF v_admission_enabled IS DISTINCT FROM true THEN%' THEN RAISE EXCEPTION 'fixture_admission_upgrade_required'; END IF;
  SELECT pg_catalog.jsonb_build_object(
    'namespaces', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.namespaces AS x),
    'bindings', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY login_role) FROM chat_quota.role_bindings AS x),
    'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, scope_key) FROM chat_quota.buckets AS x),
    'money', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.money_budgets AS x),
    'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, lease_id) FROM chat_quota.leases AS x),
    'functions', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid', p.oid, 'owner', p.proowner, 'acl', p.proacl, 'definition', pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.oid)
      FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace WHERE n.nspname = 'chat_quota'),
    'roles', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY oid) FROM pg_catalog.pg_roles AS r),
    'memberships', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) ORDER BY roleid, member) FROM pg_catalog.pg_auth_members AS m),
    'database_acl', (SELECT pg_catalog.to_jsonb(d.datacl) FROM pg_catalog.pg_database AS d WHERE datname = pg_catalog.current_database())
  ) INTO v_before;
  BEGIN
    -- Keep the +66-second same-day scenario away from a real UTC boundary.
    -- Only the disposable fixture clock is anchored; stage SQL keeps DB time.
    v_now := (pg_catalog.date_trunc('day', pg_catalog.clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') + interval '12 hours';
    v_day := pg_catalog.floor(EXTRACT(epoch FROM v_now) / 86400)::bigint;
    PERFORM pg_catalog.set_config('chat_quota.cutover_fixture_clock', v_now::text, true);
    SET LOCAL ROLE chat_quota_owner;
    IF (pg_catalog.length(v_reserve_definition) - pg_catalog.length(pg_catalog.replace(v_reserve_definition, 'pg_catalog.clock_timestamp()', ''))) /
        pg_catalog.length('pg_catalog.clock_timestamp()') <> 1 OR
       (pg_catalog.length(v_release_definition) - pg_catalog.length(pg_catalog.replace(v_release_definition, 'pg_catalog.clock_timestamp()', ''))) /
        pg_catalog.length('pg_catalog.clock_timestamp()') <> 1 THEN RAISE EXCEPTION 'fixture_unexpected_clock_definition'; END IF;
    EXECUTE pg_catalog.replace(v_reserve_definition, 'pg_catalog.clock_timestamp()', 'pg_catalog.current_setting(''chat_quota.cutover_fixture_clock'')::timestamptz');
    EXECUTE pg_catalog.replace(v_release_definition, 'pg_catalog.clock_timestamp()', 'pg_catalog.current_setting(''chat_quota.cutover_fixture_clock'')::timestamptz');
    RESET ROLE;
    EXECUTE pg_catalog.format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT', v_preview_role);
    SELECT oid INTO v_role_oid FROM pg_catalog.pg_roles WHERE rolname = v_preview_role;
    SET LOCAL ROLE chat_quota_owner;
    INSERT INTO chat_quota.namespaces(namespace, environment, policy_version) VALUES (v_namespace, 'preview', 2);
    INSERT INTO chat_quota.role_bindings(login_role, role_oid, namespace, environment)
      VALUES (v_preview_role, v_role_oid, v_namespace, 'preview'), (SESSION_USER, v_login_oid, v_namespace, 'preview');
    INSERT INTO chat_quota.buckets(namespace, environment, scope_key, requests, tokens, updated_at, day, day_requests, day_tokens)
      VALUES (v_namespace, 'preview', 'global', 60, 1000000, v_now, v_day, 0, 0);
    INSERT INTO chat_quota.money_budgets(namespace, environment, day, reserved_eur_micros) VALUES (v_namespace, 'preview', v_day, 4900000);
    SELECT * INTO v_admission FROM chat_quota.reserve('preview', 'anonymous', pg_catalog.repeat('a', 64), pg_catalog.repeat('c', 64),
      1::bigint, '00000000-0000-4000-8000-000000000001'::uuid, 50000::bigint);
    IF v_admission.allowed IS DISTINCT FROM true THEN RAISE EXCEPTION 'fixture_initial_admission_failed'; END IF;
    SELECT * INTO v_admission FROM chat_quota.reserve('preview', 'anonymous', pg_catalog.repeat('b', 64), pg_catalog.repeat('c', 64),
      1::bigint, '00000000-0000-4000-8000-000000000002'::uuid, 30000::bigint);
    IF v_admission.allowed IS DISTINCT FROM true THEN RAISE EXCEPTION 'fixture_second_admission_failed'; END IF;
    -- Execute the exact stage bodies with only fixture constants/clock replaced.
    v_freeze_sql := pg_catalog.replace(pg_catalog.replace(v_freeze_sql, '''law-firm-site-chat''', pg_catalog.quote_literal(v_namespace)), '''chat_quota_preview''', pg_catalog.quote_literal(v_preview_role));
    v_provision_sql := pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(v_provision_sql, '''law-firm-site-chat''', pg_catalog.quote_literal(v_namespace)), '''chat_quota_preview''', pg_catalog.quote_literal(v_preview_role)), '''chat_quota_production''', pg_catalog.quote_literal(v_production_role));
    v_activate_sql := pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(v_activate_sql, '''law-firm-site-chat''', pg_catalog.quote_literal(v_namespace)), '''chat_quota_preview''', pg_catalog.quote_literal(v_preview_role)), '''chat_quota_production''', pg_catalog.quote_literal(v_production_role));
    v_freeze_sql := pg_catalog.replace(v_freeze_sql, 'pg_catalog.clock_timestamp()', 'pg_catalog.current_setting(''chat_quota.cutover_fixture_clock'')::timestamptz');
    v_provision_sql := pg_catalog.replace(v_provision_sql, 'pg_catalog.clock_timestamp()', 'pg_catalog.current_setting(''chat_quota.cutover_fixture_clock'')::timestamptz');
    v_activate_sql := pg_catalog.replace(v_activate_sql, 'pg_catalog.clock_timestamp()', 'pg_catalog.current_setting(''chat_quota.cutover_fixture_clock'')::timestamptz');
    -- Generate only inside the rollback fixture, never emit the transient value.
    v_provision_sql := pg_catalog.replace(v_provision_sql, 'v_runtime_password text := ''__REPLACE_WITH_PRIVATE_RANDOM_PASSWORD__'';',
      'v_runtime_password text := ' || pg_catalog.quote_literal(pg_catalog.md5(pg_catalog.random()::text) || pg_catalog.md5(pg_catalog.random()::text)) || ';');
    EXECUTE v_freeze_sql;
    SELECT admission_frozen_at INTO v_freeze_time FROM chat_quota.namespaces WHERE namespace = v_namespace AND environment = 'preview';
    EXECUTE v_freeze_sql;
    IF (SELECT admission_frozen_at FROM chat_quota.namespaces WHERE namespace = v_namespace AND environment = 'preview') IS DISTINCT FROM v_freeze_time THEN RAISE EXCEPTION 'fixture_freeze_retry_changed_timestamp'; END IF;
    v_blocked := false;
    BEGIN
      PERFORM * FROM chat_quota.reserve('preview', 'anonymous', pg_catalog.repeat('a', 64), pg_catalog.repeat('c', 64), 1::bigint, '00000000-0000-4000-8000-000000000003'::uuid, 1::bigint);
    EXCEPTION WHEN SQLSTATE '55000' THEN v_blocked := SQLERRM = 'quota_admission_disabled'; END;
    IF NOT v_blocked THEN RAISE EXCEPTION 'fixture_stale_preview_caller_not_blocked'; END IF;
    SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(b) ORDER BY scope_key) INTO v_preview_before FROM chat_quota.buckets AS b WHERE namespace = v_namespace AND environment = 'preview';
    IF chat_quota.release('preview', '00000000-0000-4000-8000-000000000001'::uuid, 10000::bigint) IS DISTINCT FROM 1 OR
        chat_quota.release('preview', '00000000-0000-4000-8000-000000000002'::uuid) IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'fixture_frozen_release_or_settlement_failed'; END IF;
    SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(b) ORDER BY scope_key) INTO v_preview_after FROM chat_quota.buckets AS b WHERE namespace = v_namespace AND environment = 'preview';
    SELECT reserved_eur_micros INTO v_money FROM chat_quota.money_budgets WHERE namespace = v_namespace AND environment = 'preview';
    IF v_money <> 4940000 OR v_preview_after IS DISTINCT FROM v_preview_before THEN RAISE EXCEPTION 'fixture_frozen_settlement_or_abuse_preservation_failed'; END IF;
    RESET ROLE;
    v_blocked := false;
    BEGIN EXECUTE v_provision_sql;
    EXCEPTION WHEN OTHERS THEN v_blocked := SQLERRM = 'cutover_preview_not_frozen_and_drained'; END;
    IF NOT v_blocked THEN RAISE EXCEPTION 'fixture_early_provision_not_blocked'; END IF;
    v_now := v_now + interval '66 seconds';
    PERFORM pg_catalog.set_config('chat_quota.cutover_fixture_clock', v_now::text, true);
    EXECUTE v_provision_sql;
    SET LOCAL ROLE chat_quota_owner;
    UPDATE chat_quota.role_bindings SET environment = 'production' WHERE login_role = SESSION_USER;
    v_blocked := false;
    BEGIN
      PERFORM * FROM chat_quota.reserve('production', 'anonymous', pg_catalog.repeat('a', 64), pg_catalog.repeat('c', 64), 1::bigint, '00000000-0000-4000-8000-000000000004'::uuid, 1::bigint);
    EXCEPTION WHEN SQLSTATE '55000' THEN v_blocked := SQLERRM = 'quota_admission_disabled'; END;
    IF NOT v_blocked THEN RAISE EXCEPTION 'fixture_unactivated_production_not_blocked'; END IF;
    UPDATE chat_quota.money_budgets SET reserved_eur_micros = 7 WHERE namespace = v_namespace AND environment = 'production';
    v_blocked := false;
    BEGIN EXECUTE v_activate_sql;
    EXCEPTION WHEN OTHERS THEN v_blocked := SQLERRM = 'cutover_production_not_virgin_no_changes'; END;
    IF NOT v_blocked OR (SELECT reserved_eur_micros FROM chat_quota.money_budgets WHERE namespace = v_namespace AND environment = 'production') <> 7 THEN RAISE EXCEPTION 'fixture_nonzero_production_reset'; END IF;
    -- Resets below affect only this disposable rollback fixture.
    UPDATE chat_quota.money_budgets SET reserved_eur_micros = 0 WHERE namespace = v_namespace AND environment = 'production';
    EXECUTE v_activate_sql;
    IF (SELECT reserved_eur_micros FROM chat_quota.money_budgets WHERE namespace = v_namespace AND environment = 'production') <> 4940000 OR
       (SELECT reserved_eur_micros FROM chat_quota.money_budgets WHERE namespace = v_namespace AND environment = 'preview') <> 4940000 OR
       (SELECT admission_enabled FROM chat_quota.namespaces WHERE namespace = v_namespace AND environment = 'preview') THEN RAISE EXCEPTION 'fixture_same_day_carry_or_preview_freeze_failed'; END IF;
    SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(b) ORDER BY scope_key) INTO v_preview_after FROM chat_quota.buckets AS b WHERE namespace = v_namespace AND environment = 'preview';
    IF v_preview_after IS DISTINCT FROM v_preview_before THEN RAISE EXCEPTION 'fixture_cutover_changed_preview_counters'; END IF;
    SELECT * INTO v_admission FROM chat_quota.reserve('production', 'anonymous', pg_catalog.repeat('a', 64), pg_catalog.repeat('c', 64), 1::bigint, '00000000-0000-4000-8000-000000000005'::uuid, 60000::bigint);
    IF v_admission.allowed IS DISTINCT FROM true OR v_admission.policy_version <> 2 OR chat_quota.release('production', '00000000-0000-4000-8000-000000000005'::uuid, 60000::bigint) IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'fixture_remaining_daily_allowance_failed'; END IF;
    SELECT * INTO v_admission FROM chat_quota.reserve('production', 'anonymous', pg_catalog.repeat('b', 64), pg_catalog.repeat('c', 64), 1::bigint, '00000000-0000-4000-8000-000000000006'::uuid, 1::bigint);
    IF v_admission.allowed IS DISTINCT FROM false OR (SELECT reserved_eur_micros FROM chat_quota.money_budgets WHERE namespace = v_namespace AND environment = 'production') <> 5000000 THEN RAISE EXCEPTION 'fixture_second_five_euro_allowance_granted'; END IF;
    v_blocked := false;
    BEGIN EXECUTE v_activate_sql;
    EXCEPTION WHEN OTHERS THEN v_blocked := SQLERRM = 'cutover_production_already_active_no_changes'; END;
    IF NOT v_blocked OR (SELECT reserved_eur_micros FROM chat_quota.money_budgets WHERE namespace = v_namespace AND environment = 'production') <> 5000000 THEN RAISE EXCEPTION 'fixture_active_production_retry_reset'; END IF;
    UPDATE chat_quota.namespaces SET admission_enabled = false, admission_frozen_at = v_now WHERE namespace = v_namespace AND environment = 'production';
    v_blocked := false;
    BEGIN EXECUTE v_activate_sql;
    EXCEPTION WHEN OTHERS THEN v_blocked := SQLERRM = 'cutover_production_not_virgin_no_changes'; END;
    IF NOT v_blocked THEN RAISE EXCEPTION 'fixture_refrozen_used_target_reset'; END IF;
    DELETE FROM chat_quota.buckets WHERE namespace = v_namespace AND environment = 'production' AND scope_key <> 'global';
    UPDATE chat_quota.buckets SET requests = 60, tokens = 1000000, day_requests = 0, day_tokens = 0 WHERE namespace = v_namespace AND environment = 'production' AND scope_key = 'global';
    UPDATE chat_quota.money_budgets SET reserved_eur_micros = 0 WHERE namespace = v_namespace AND environment = 'production';
    v_now := v_now + interval '1 day';
    PERFORM pg_catalog.set_config('chat_quota.cutover_fixture_clock', v_now::text, true);
    EXECUTE v_activate_sql;
    IF (SELECT reserved_eur_micros FROM chat_quota.money_budgets WHERE namespace = v_namespace AND environment = 'production') <> 0 THEN RAISE EXCEPTION 'fixture_next_day_carry_failed'; END IF;
    RAISE EXCEPTION USING ERRCODE = 'ZX001', MESSAGE = 'production_cutover_fixture_rollback_complete';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN
    GET STACKED DIAGNOSTICS v_sentinel_message = MESSAGE_TEXT;
    IF v_sentinel_message IS DISTINCT FROM 'production_cutover_fixture_rollback_complete' THEN RAISE; END IF;
    v_rolled_back := true;
  END;
  IF NOT v_rolled_back OR CURRENT_USER IS DISTINCT FROM v_original_role THEN RAISE EXCEPTION 'fixture_rollback_not_complete'; END IF;
  SELECT pg_catalog.jsonb_build_object(
    'namespaces', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.namespaces AS x),
    'bindings', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY login_role) FROM chat_quota.role_bindings AS x),
    'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, scope_key) FROM chat_quota.buckets AS x),
    'money', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.money_budgets AS x),
    'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, lease_id) FROM chat_quota.leases AS x),
    'functions', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid', p.oid, 'owner', p.proowner, 'acl', p.proacl, 'definition', pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.oid)
      FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace WHERE n.nspname = 'chat_quota'),
    'roles', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(r) ORDER BY oid) FROM pg_catalog.pg_roles AS r),
    'memberships', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) ORDER BY roleid, member) FROM pg_catalog.pg_auth_members AS m),
    'database_acl', (SELECT pg_catalog.to_jsonb(d.datacl) FROM pg_catalog.pg_database AS d WHERE datname = pg_catalog.current_database())
  ) INTO v_after;
  IF v_after IS DISTINCT FROM v_before THEN RAISE EXCEPTION 'fixture_existing_state_roles_or_functions_changed'; END IF;
END;
$production_cutover_fixture$;

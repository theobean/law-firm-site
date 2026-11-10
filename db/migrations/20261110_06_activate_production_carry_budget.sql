-- FINAL OWNER-ONLY ACTIVATION. Run only after all production config/gates are ready.
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

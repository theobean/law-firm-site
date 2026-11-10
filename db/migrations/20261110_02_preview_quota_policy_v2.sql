-- Stage 2: apply ONLY AFTER the Preview deployment accepts policies 1 and 2.
-- This is an owner-only, idempotent activation of one exact Preview namespace.
-- No runtime privileges, Production policy, counters, money or leases change.
DO $preview_quota_policy_v2_activate$
DECLARE
  v_policy integer;
  v_before jsonb;
  v_after jsonb;
BEGIN
  SET LOCAL ROLE chat_quota_owner;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE p.oid = pg_catalog.to_regprocedure('chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)')
      AND p.prosrc LIKE '%IF v_policy = 2 THEN%'
      AND p.prosrc LIKE '%RETURN QUERY SELECT true, 0, v_policy, 1;%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc AS p
    WHERE p.oid = pg_catalog.to_regprocedure('chat_quota.release(text,uuid,bigint)')
      AND p.prosrc LIKE '%v_policy NOT IN (1, 2)%'
  ) THEN RAISE EXCEPTION 'preview_quota_policy_compatibility_upgrade_required'; END IF;
  PERFORM pg_catalog.set_config('lock_timeout', '5s', true);
  LOCK TABLE chat_quota.namespaces IN ACCESS EXCLUSIVE MODE;
  SELECT n.policy_version INTO v_policy FROM chat_quota.namespaces AS n
    WHERE n.namespace = 'law-firm-site-chat' AND n.environment = 'preview'
    FOR UPDATE;
  IF NOT FOUND OR v_policy IS NULL OR v_policy NOT IN (1, 2) OR NOT EXISTS (
    SELECT 1 FROM chat_quota.role_bindings AS b
      JOIN pg_catalog.pg_roles AS r ON r.oid = b.role_oid AND r.rolname = b.login_role
    WHERE b.namespace = 'law-firm-site-chat' AND b.environment = 'preview'
      AND b.login_role = 'chat_quota_preview'
  ) OR NOT EXISTS (
    SELECT 1 FROM chat_quota.buckets AS b
    WHERE b.namespace = 'law-firm-site-chat' AND b.environment = 'preview' AND b.scope_key = 'global'
  ) OR NOT EXISTS (
    SELECT 1 FROM chat_quota.money_budgets AS m
    WHERE m.namespace = 'law-firm-site-chat' AND m.environment = 'preview'
  ) THEN
    RAISE EXCEPTION 'preview_quota_policy_activation_target_unavailable';
  END IF;
  -- Normalize only the intended policy change when comparing every table row.
  SELECT pg_catalog.jsonb_build_object(
    'namespaces', (SELECT pg_catalog.jsonb_agg((pg_catalog.to_jsonb(x) || pg_catalog.jsonb_build_object('policy_version', CASE WHEN x.namespace = 'law-firm-site-chat' AND x.environment = 'preview' THEN 2 ELSE x.policy_version END)) ORDER BY namespace, environment) FROM chat_quota.namespaces AS x),
    'bindings', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY login_role) FROM chat_quota.role_bindings AS x),
    'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, scope_key) FROM chat_quota.buckets AS x),
    'money', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.money_budgets AS x),
    'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, lease_id) FROM chat_quota.leases AS x)
  ) INTO v_before;
  UPDATE chat_quota.namespaces AS n SET policy_version = 2
    WHERE n.namespace = 'law-firm-site-chat' AND n.environment = 'preview' AND n.policy_version = 1;
  SELECT pg_catalog.jsonb_build_object(
    'namespaces', (SELECT pg_catalog.jsonb_agg((pg_catalog.to_jsonb(x) || pg_catalog.jsonb_build_object('policy_version', CASE WHEN x.namespace = 'law-firm-site-chat' AND x.environment = 'preview' THEN 2 ELSE x.policy_version END)) ORDER BY namespace, environment) FROM chat_quota.namespaces AS x),
    'bindings', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY login_role) FROM chat_quota.role_bindings AS x),
    'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, scope_key) FROM chat_quota.buckets AS x),
    'money', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.money_budgets AS x),
    'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, lease_id) FROM chat_quota.leases AS x)
  ) INTO v_after;
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'preview_quota_policy_activation_changed_unrelated_state';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM chat_quota.namespaces AS n
    WHERE n.namespace = 'law-firm-site-chat' AND n.environment = 'preview' AND n.policy_version = 2
  ) THEN
    RAISE EXCEPTION 'preview_quota_policy_activation_failed';
  END IF;
END;
$preview_quota_policy_v2_activate$;

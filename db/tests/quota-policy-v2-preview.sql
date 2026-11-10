-- Owner-only, non-secret Preview verification; apply after stage 1.
-- All fixtures AND the controlled-clock function replacements live inside one
-- deliberately rolled-back subtransaction. No roles/grants are created.
-- The namespace table is exclusively locked before temporarily replacing the
-- two function clocks, so no concurrent runtime can observe the fixture clock.
-- Complete existing row/function-definition/owner/ACL snapshots must match.
DO $quota_policy_v2_fixture$
DECLARE
  v_namespace constant text := 'chat-test-policy-v2-rollback';
  v_environment constant text := 'preview';
  v_original_role name := CURRENT_USER;
  v_login_oid oid;
  v_before jsonb;
  v_after jsonb;
  v_fixture_before jsonb;
  v_fixture_after jsonb;
  v_reserve_definition text;
  v_release_definition text;
  v_now timestamptz;
  v_day bigint;
  v_variant text;
  v_policy integer;
  v_count integer;
  v_subject text;
  v_network text;
  v_lease_id uuid;
  v_admission record;
  v_expected_tokens bigint;
  v_actual_tokens bigint;
  v_actual_requests bigint;
  v_money bigint;
  v_rolled_back boolean := false;
  v_sentinel_message text;
  i integer;
BEGIN
  PERFORM pg_catalog.set_config('lock_timeout', '5s', true);
  LOCK TABLE chat_quota.namespaces IN ACCESS EXCLUSIVE MODE;
  SELECT r.oid INTO v_login_oid FROM pg_catalog.pg_roles AS r WHERE r.rolname = SESSION_USER;
  IF NOT FOUND OR EXISTS (
    SELECT 1 FROM chat_quota.role_bindings AS b
    WHERE b.login_role = SESSION_USER OR b.role_oid = v_login_oid
  ) THEN RAISE EXCEPTION 'fixture_session_already_bound_or_invalid'; END IF;
  IF EXISTS (SELECT 1 FROM chat_quota.namespaces AS n WHERE n.namespace = v_namespace) THEN
    RAISE EXCEPTION 'fixture_namespace_not_empty';
  END IF;
  SELECT pg_catalog.pg_get_functiondef('chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)'::pg_catalog.regprocedure)
    INTO v_reserve_definition;
  SELECT pg_catalog.pg_get_functiondef('chat_quota.release(text,uuid,bigint)'::pg_catalog.regprocedure)
    INTO v_release_definition;
  IF v_reserve_definition NOT LIKE '%IF v_policy = 2 THEN%' OR
      v_reserve_definition NOT LIKE '%RETURN QUERY SELECT true, 0, v_policy, 1;%' THEN
    RAISE EXCEPTION 'fixture_policy_v2_not_installed';
  END IF;
  SELECT pg_catalog.jsonb_build_object(
    'namespaces', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.namespaces AS x),
    'bindings', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY login_role) FROM chat_quota.role_bindings AS x),
    'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, scope_key) FROM chat_quota.buckets AS x),
    'money', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.money_budgets AS x),
    'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, lease_id) FROM chat_quota.leases AS x),
    'functions', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid', p.oid, 'owner', p.proowner,
      'acl', p.proacl, 'definition', pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.oid)
      FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
      WHERE n.nspname = 'chat_quota')
  ) INTO v_before;
  BEGIN
    SET LOCAL ROLE chat_quota_owner;
    -- This exact text replacement changes the clock only. Existing production
    -- function bodies are restored by the sentinel rollback below.
    IF (pg_catalog.length(v_reserve_definition) - pg_catalog.length(pg_catalog.replace(v_reserve_definition, 'pg_catalog.clock_timestamp()', ''))) /
        pg_catalog.length('pg_catalog.clock_timestamp()') <> 1 OR
       (pg_catalog.length(v_release_definition) - pg_catalog.length(pg_catalog.replace(v_release_definition, 'pg_catalog.clock_timestamp()', ''))) /
        pg_catalog.length('pg_catalog.clock_timestamp()') <> 1 THEN
      RAISE EXCEPTION 'fixture_unexpected_clock_definition';
    END IF;
    EXECUTE pg_catalog.replace(v_reserve_definition, 'pg_catalog.clock_timestamp()',
      'pg_catalog.current_setting(''chat_quota.fixture_clock'')::timestamptz');
    EXECUTE pg_catalog.replace(v_release_definition, 'pg_catalog.clock_timestamp()',
      'pg_catalog.current_setting(''chat_quota.fixture_clock'')::timestamptz');
    INSERT INTO chat_quota.namespaces(namespace, environment, policy_version)
      VALUES (v_namespace, v_environment, 2);
    INSERT INTO chat_quota.role_bindings(login_role, role_oid, namespace, environment)
      VALUES (SESSION_USER, v_login_oid, v_namespace, v_environment);

    FOREACH v_variant IN ARRAY ARRAY['anonymous_minute', 'single_daily', 'same_network', 'network_daily', 'global_daily',
        'legacy_minute', 'legacy_daily', 'legacy_network_minute', 'authenticated_minute', 'money'] LOOP
      -- Every reset is restricted to this newly-created, rollback-only fixture.
      DELETE FROM chat_quota.leases AS l WHERE l.namespace = v_namespace AND l.environment = v_environment;
      DELETE FROM chat_quota.buckets AS b WHERE b.namespace = v_namespace AND b.environment = v_environment;
      DELETE FROM chat_quota.money_budgets AS m WHERE m.namespace = v_namespace AND m.environment = v_environment;
      v_policy := CASE WHEN v_variant LIKE 'legacy_%' THEN 1 ELSE 2 END;
      UPDATE chat_quota.namespaces AS n SET policy_version = v_policy
        WHERE n.namespace = v_namespace AND n.environment = v_environment;
      -- Start each scenario at 00:10 UTC, and advance only the private clock.
      -- Day fields and token balances are changed only by reserve itself.
      v_now := (pg_catalog.date_trunc('day', pg_catalog.clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') + interval '10 minutes';
      v_day := pg_catalog.floor(EXTRACT(epoch FROM v_now) / 86400)::bigint;
      PERFORM pg_catalog.set_config('chat_quota.fixture_clock', v_now::text, true);
      INSERT INTO chat_quota.buckets(namespace, environment, scope_key, requests, tokens, updated_at, day, day_requests, day_tokens)
        VALUES (v_namespace, v_environment, 'global', 60, 1000000, v_now, v_day, 0, 0);
      INSERT INTO chat_quota.money_budgets(namespace, environment, day, reserved_eur_micros)
        VALUES (v_namespace, v_environment, v_day, 0);
      v_count := CASE v_variant WHEN 'anonymous_minute' THEN 6 WHEN 'single_daily' THEN 30
        WHEN 'same_network' THEN 60 WHEN 'network_daily' THEN 78 WHEN 'global_daily' THEN 156
        WHEN 'legacy_minute' THEN 1 WHEN 'legacy_daily' THEN 7 WHEN 'legacy_network_minute' THEN 7
        WHEN 'authenticated_minute' THEN 4 WHEN 'money' THEN 1 END;
      FOR i IN 1..v_count LOOP
        v_subject := pg_catalog.lpad((CASE WHEN v_variant = 'same_network' THEN ((i - 1) / 30) + 1
          WHEN v_variant IN ('network_daily', 'global_daily') THEN ((i - 1) / 30) + 1
          WHEN v_variant = 'legacy_network_minute' THEN i ELSE 1 END)::text, 64, '0');
        v_network := pg_catalog.lpad((CASE WHEN v_variant = 'global_daily' THEN ((i - 1) / 30) + 1 ELSE 999 END)::text, 64, '0');
        v_lease_id := ('00000000-0000-4000-8000-' || pg_catalog.lpad(i::text, 12, '0'))::uuid;
        SELECT * INTO v_admission FROM chat_quota.reserve(v_environment,
          CASE WHEN v_variant = 'authenticated_minute' THEN 'authenticated' ELSE 'anonymous' END,
          v_subject, v_network, CASE WHEN v_variant = 'money' THEN 1 ELSE 64000 END::bigint, v_lease_id,
          CASE WHEN v_variant = 'money' THEN 4999999 ELSE 1 END::bigint);
        IF v_admission.allowed IS DISTINCT FROM true OR v_admission.policy_version IS DISTINCT FROM v_policy OR
            v_admission.money_policy_version IS DISTINCT FROM 1 OR v_admission.retry_after IS DISTINCT FROM 0 THEN
          RAISE EXCEPTION 'fixture_expected_admission_failed: %, %', v_variant, i;
        END IF;
        IF chat_quota.release(v_environment, v_lease_id) IS DISTINCT FROM 1 THEN
          RAISE EXCEPTION 'fixture_release_failed: %, %', v_variant, i;
        END IF;
        IF v_variant IN ('single_daily', 'same_network', 'network_daily', 'global_daily', 'legacy_daily') THEN
          v_now := v_now + interval '61 seconds';
          PERFORM pg_catalog.set_config('chat_quota.fixture_clock', v_now::text, true);
        END IF;
      END LOOP;
      -- Check actual totals before boundary denial, including the important
      -- 30*64000=1.92M subject and two-user 60*64000=3.84M network cases.
      v_expected_tokens := CASE WHEN v_variant = 'money' THEN 1 ELSE v_count::bigint * 64000 END;
      SELECT b.day_tokens, b.day_requests INTO v_actual_tokens, v_actual_requests FROM chat_quota.buckets AS b
        WHERE b.namespace = v_namespace AND b.environment = v_environment AND b.scope_key = 'global';
      IF v_actual_tokens IS DISTINCT FROM v_expected_tokens OR v_actual_requests IS DISTINCT FROM v_count::bigint THEN
        RAISE EXCEPTION 'fixture_counters_wrong: %', v_variant;
      END IF;
      IF v_variant IN ('single_daily', 'same_network') THEN
        IF EXISTS (SELECT 1 FROM chat_quota.buckets AS b WHERE b.namespace = v_namespace AND b.environment = v_environment
            AND b.scope_key LIKE 'subject:%' AND (b.day_requests <> 30 OR b.day_tokens <> 1920000)) THEN
          RAISE EXCEPTION 'fixture_subject_thirty_maximum_total_failed: %', v_variant;
        END IF;
      END IF;
      -- The next request isolates each daily boundary: subject 31 stays below
      -- 2M; network 79 stays below 10M; global 157 keeps its scopes below caps.
      IF v_variant IN ('network_daily', 'global_daily') THEN
        v_subject := pg_catalog.lpad(((v_count / 30) + 1)::text, 64, '0');
      ELSIF v_variant = 'legacy_network_minute' THEN
        v_subject := pg_catalog.lpad('8', 64, '0');
      END IF;
      SELECT pg_catalog.jsonb_build_object(
        'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(b) ORDER BY scope_key) FROM chat_quota.buckets AS b WHERE b.namespace = v_namespace AND b.environment = v_environment),
        'money', (SELECT pg_catalog.to_jsonb(m) FROM chat_quota.money_budgets AS m WHERE m.namespace = v_namespace AND m.environment = v_environment),
        'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(l) ORDER BY lease_id) FROM chat_quota.leases AS l WHERE l.namespace = v_namespace AND l.environment = v_environment)
      ) INTO v_fixture_before;
      SELECT * INTO v_admission FROM chat_quota.reserve(v_environment,
        CASE WHEN v_variant = 'authenticated_minute' THEN 'authenticated' ELSE 'anonymous' END,
        v_subject, v_network, CASE WHEN v_variant = 'money' THEN 1 ELSE 64000 END::bigint,
        '00000000-0000-4000-8000-999999999999'::uuid, CASE WHEN v_variant = 'money' THEN 2 ELSE 1 END::bigint);
      SELECT pg_catalog.jsonb_build_object(
        'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(b) ORDER BY scope_key) FROM chat_quota.buckets AS b WHERE b.namespace = v_namespace AND b.environment = v_environment),
        'money', (SELECT pg_catalog.to_jsonb(m) FROM chat_quota.money_budgets AS m WHERE m.namespace = v_namespace AND m.environment = v_environment),
        'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(l) ORDER BY lease_id) FROM chat_quota.leases AS l WHERE l.namespace = v_namespace AND l.environment = v_environment)
      ) INTO v_fixture_after;
      IF v_admission.allowed IS DISTINCT FROM false OR v_admission.policy_version IS DISTINCT FROM v_policy OR
          v_admission.money_policy_version IS DISTINCT FROM 1 OR v_admission.retry_after NOT BETWEEN 1 AND 86400 OR
          v_fixture_after IS DISTINCT FROM v_fixture_before THEN
        RAISE EXCEPTION 'fixture_boundary_denial_or_atomicity_failed: %', v_variant;
      END IF;
      IF v_variant = 'money' THEN
        v_lease_id := '00000000-0000-4000-8000-888888888888'::uuid;
        SELECT * INTO v_admission FROM chat_quota.reserve(v_environment, 'anonymous', v_subject, v_network,
          1::bigint, v_lease_id, 1::bigint);
        IF v_admission.allowed IS DISTINCT FROM true OR chat_quota.release(v_environment, v_lease_id, 1::bigint) IS DISTINCT FROM 1 THEN
          RAISE EXCEPTION 'fixture_exact_five_euro_cap_failed';
        END IF;
        SELECT m.reserved_eur_micros INTO v_money FROM chat_quota.money_budgets AS m
          WHERE m.namespace = v_namespace AND m.environment = v_environment;
        IF v_money IS DISTINCT FROM 5000000 THEN RAISE EXCEPTION 'fixture_exact_money_total_failed'; END IF;
        SELECT pg_catalog.jsonb_build_object(
        'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(b) ORDER BY scope_key) FROM chat_quota.buckets AS b WHERE b.namespace = v_namespace AND b.environment = v_environment),
        'money', (SELECT pg_catalog.to_jsonb(m) FROM chat_quota.money_budgets AS m WHERE m.namespace = v_namespace AND m.environment = v_environment),
        'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(l) ORDER BY lease_id) FROM chat_quota.leases AS l WHERE l.namespace = v_namespace AND l.environment = v_environment)
      ) INTO v_fixture_before;
        SELECT * INTO v_admission FROM chat_quota.reserve(v_environment, 'anonymous', v_subject, v_network,
          1::bigint, '00000000-0000-4000-8000-777777777777'::uuid, 1::bigint);
        SELECT pg_catalog.jsonb_build_object(
        'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(b) ORDER BY scope_key) FROM chat_quota.buckets AS b WHERE b.namespace = v_namespace AND b.environment = v_environment),
        'money', (SELECT pg_catalog.to_jsonb(m) FROM chat_quota.money_budgets AS m WHERE m.namespace = v_namespace AND m.environment = v_environment),
        'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(l) ORDER BY lease_id) FROM chat_quota.leases AS l WHERE l.namespace = v_namespace AND l.environment = v_environment)
      ) INTO v_fixture_after;
        IF v_admission.allowed IS DISTINCT FROM false OR v_fixture_after IS DISTINCT FROM v_fixture_before THEN
          RAISE EXCEPTION 'fixture_full_five_euro_cap_failed';
        END IF;
      END IF;
    END LOOP;
    RAISE EXCEPTION USING ERRCODE = 'ZX001', MESSAGE = 'fixture_rollback_complete';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN
    GET STACKED DIAGNOSTICS v_sentinel_message = MESSAGE_TEXT;
    IF v_sentinel_message IS DISTINCT FROM 'fixture_rollback_complete' THEN RAISE; END IF;
    v_rolled_back := true;
  END;
  IF NOT v_rolled_back OR CURRENT_USER IS DISTINCT FROM v_original_role THEN
    RAISE EXCEPTION 'fixture_rollback_not_complete';
  END IF;
  SELECT pg_catalog.jsonb_build_object(
    'namespaces', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.namespaces AS x),
    'bindings', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY login_role) FROM chat_quota.role_bindings AS x),
    'buckets', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, scope_key) FROM chat_quota.buckets AS x),
    'money', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment) FROM chat_quota.money_budgets AS x),
    'leases', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x) ORDER BY namespace, environment, lease_id) FROM chat_quota.leases AS x),
    'functions', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid', p.oid, 'owner', p.proowner,
      'acl', p.proacl, 'definition', pg_catalog.pg_get_functiondef(p.oid)) ORDER BY p.oid)
      FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
      WHERE n.nspname = 'chat_quota')
  ) INTO v_after;
  IF v_after IS DISTINCT FROM v_before THEN RAISE EXCEPTION 'fixture_existing_state_or_functions_changed'; END IF;
END;
$quota_policy_v2_fixture$;

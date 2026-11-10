-- Owner-only cutover stage: freeze the exact live Preview namespace.
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

import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { Client, neon } from "@neondatabase/serverless";
import { CHAT_QUOTA_POLICY, QuotaError, RELEASE_CHAT_QUOTA_SQL, RESERVE_CHAT_QUOTA_SQL, reserveChatQuota } from "../src/lib/chat/quota.mjs";
import { provisionChatQuota } from "./setup-chat-neon.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const identity = (tier, subject = "subject", network = "network") => ({ tier, subjectKey: digest(subject), networkKey: digest(network) });
const denied = (error) => error instanceof QuotaError && error.code === "rate_limit" && error.status === 429;
const TEST_ROLE = /^chat_quota_preview_test([a-f0-9]{24})([ab])$/;
const TEST_NAMESPACE = /^chat-test-[a-f0-9]{24}-[ab]$/;
const RUNTIME_ROLE = /^chat_quota_preview(?:_(?:test_?)?[a-f0-9]{8,32})?$/;
const ENVIRONMENT = "preview";

function connection(url, runtime = false) {
  if (typeof url !== "string" || url.length > 8192) throw new Error("invalid_connection");
  const raw = url.trim();
  if (/\s|\p{Cc}/u.test(raw)) throw new Error("invalid_connection");
  const parsed = new URL(raw);
  const parameters = [...parsed.searchParams.keys()];
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) ||
      !/^[a-z0-9][a-z0-9.-]*\.neon\.tech$/.test(parsed.hostname) ||
      (parsed.port && parsed.port !== "5432") || !/^\/[A-Za-z0-9_][A-Za-z0-9_-]{0,62}$/.test(parsed.pathname) ||
      parsed.hash || !["require", "verify-full"].includes(parsed.searchParams.get("sslmode")) ||
      parameters.some((key) => !["sslmode", "channel_binding"].includes(key)) ||
      new Set(parameters).size !== parameters.length ||
      (parsed.searchParams.has("channel_binding") && parsed.searchParams.get("channel_binding") !== "require") ||
      !parsed.username || decodeURIComponent(parsed.password).length < 16 || /\s|\p{Cc}/u.test(decodeURIComponent(parsed.password)) ||
      (runtime && !RUNTIME_ROLE.test(decodeURIComponent(parsed.username)))) {
    throw new Error("invalid_connection");
  }
  const sql = neon(parsed.toString());
  return {
    role: decodeURIComponent(parsed.username),
    endpoint: parsed.hostname.replace(/-pooler(?=\.)/, ""),
    database: parsed.pathname,
    query: (text, params = []) => sql.query(text, params, {
      fetchOptions: { signal: AbortSignal.timeout(10000), cache: "no-store", redirect: "error" },
    }),
  };
}

function sqlState(error) {
  const candidate = error?.sqlState ?? error?.code;
  return typeof candidate === "string" && /^[A-Z0-9]{5}$/.test(candidate) ? candidate : null;
}

function safeFailure(check, cleanupFailed = false, source) {
  const error = new Error(`Neon quota integration failed at ${check}${cleanupFailed ? "; isolated fixture cleanup requires review" : ""}`);
  error.code = "neon_quota_verification_failed";
  error.check = check;
  error.cleanupFailed = cleanupFailed;
  error.sqlState = sqlState(source);
  error.primaryCheck = check;
  return error;
}

async function expectPermissionDenied(query, text, params = []) {
  try {
    await query(text, params);
  } catch (error) {
    assert.equal(error?.code, "42501", "the database must deny this operation, not fail for an unrelated reason");
    return;
  }
  assert.fail("restricted operation unexpectedly succeeded");
}

function fixtureMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== "environment,namespace,roleName" ||
      typeof value.roleName !== "string" || typeof value.namespace !== "string" || value.environment !== ENVIRONMENT) {
    throw new Error("fixture_metadata_invalid");
  }
  const match = TEST_ROLE.exec(value.roleName);
  if (!match || !TEST_NAMESPACE.test(value.namespace) || value.namespace !== `chat-test-${match[1]}-${match[2]}`) {
    throw new Error("fixture_metadata_invalid");
  }
  return Object.freeze({ roleName: value.roleName, namespace: value.namespace, environment: ENVIRONMENT });
}

const identifier = (value) => '"' + value.replaceAll('"', '""') + '"';

async function verifyFixtureDatabase(query) {
  const schema = await query(`SELECT r.rolname, r.rolcanlogin, r.rolsuper, r.rolcreatedb,
    r.rolcreaterole, r.rolreplication, r.rolbypassrls, r.rolinherit
    FROM pg_catalog.pg_namespace n JOIN pg_catalog.pg_roles r ON r.oid = n.nspowner
    WHERE n.nspname = 'chat_quota'`);
  assert.equal(schema.length, 1);
  assert.equal(schema[0].rolname, "chat_quota_owner");
  for (const flag of ["rolcanlogin", "rolsuper", "rolcreatedb", "rolcreaterole", "rolreplication", "rolbypassrls", "rolinherit"]) {
    assert.equal(schema[0][flag], false);
  }
  const unrelated = await query(`SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE left(n.nspname, 3) <> 'pg_' AND n.nspname NOT IN ('information_schema', 'chat_quota')
      AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
      AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid = 'pg_catalog.pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e')
    UNION ALL SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE left(n.nspname, 3) <> 'pg_' AND n.nspname NOT IN ('information_schema', 'chat_quota')
      AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d WHERE d.classid = 'pg_catalog.pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')
    ) AS present`);
  assert.equal(unrelated[0]?.present, false, "fixture tools require a dedicated quota database");
}

async function verifyFixtureRole(query, fixture) {
  const roles = await query(`SELECT oid::text, rolname, rolcanlogin, rolsuper, rolcreatedb,
    rolcreaterole, rolreplication, rolbypassrls, rolinherit FROM pg_catalog.pg_roles WHERE rolname = $1`, [fixture.roleName]);
  assert.ok(roles.length <= 1);
  const bindings = await query(`SELECT login_role::text, role_oid::text, namespace, environment FROM chat_quota.role_bindings
    WHERE login_role = $1 OR (namespace = $2 AND environment = $3)`, [fixture.roleName, fixture.namespace, ENVIRONMENT]);
  for (const binding of bindings) {
    assert.equal(binding.login_role, fixture.roleName);
    assert.equal(binding.namespace, fixture.namespace);
    assert.equal(binding.environment, ENVIRONMENT);
    if (roles.length) assert.equal(binding.role_oid, roles[0].oid);
  }
  if (!roles.length) return false;
  const role = roles[0];
  assert.equal(role.rolcanlogin, true);
  for (const flag of ["rolsuper", "rolcreatedb", "rolcreaterole", "rolreplication", "rolbypassrls", "rolinherit"]) assert.equal(role[flag], false);
  const rights = await query(`SELECT
    $1 <> current_user AND $1 <> 'chat_quota_owner' AS separate_role,
    has_database_privilege($1, current_database(), 'CREATE,TEMP') AS database_create,
    has_schema_privilege($1, 'public', 'CREATE') AS public_create,
    has_schema_privilege($1, 'chat_quota', 'CREATE') AS quota_create,
    EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members WHERE member = $2::oid) AS memberships,
    EXISTS (SELECT 1 FROM pg_catalog.pg_shdepend WHERE refclassid = 'pg_catalog.pg_authid'::regclass
      AND refobjid = $2::oid AND deptype = 'o') AS owns_objects,
    EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'chat_quota' AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
      AND has_table_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) AS table_access`,
  [fixture.roleName, role.oid]);
  assert.equal(rights[0]?.separate_role, true);
  for (const flag of ["database_create", "public_create", "quota_create", "memberships", "owns_objects", "table_access"]) assert.equal(rights[0][flag], false);
  return true;
}

/** Read-only orphan discovery. Only this suite's exact 24-hex + a/b role format
 * is returned, paired with its mathematically derived test namespace.
 */
export async function inspectNeonTestFixtures(adminUrl) {
  let check = "fixture_inspection";
  try {
    const admin = connection(adminUrl);
    check = "fixture_database_guard";
    await verifyFixtureDatabase(admin.query);
    const roles = await admin.query(`SELECT rolname FROM pg_catalog.pg_roles
      WHERE rolname ~ '^chat_quota_preview_test[a-f0-9]{24}[ab]$' ORDER BY rolname LIMIT 33`);
    assert.ok(roles.length <= 32, "large fixture sets require explicit review");
    const fixtures = [];
    for (const role of roles) {
      const match = TEST_ROLE.exec(role.rolname);
      const fixture = fixtureMetadata({ roleName: role.rolname, namespace: `chat-test-${match[1]}-${match[2]}`, environment: ENVIRONMENT });
      check = "fixture_role_guard";
      await verifyFixtureRole(admin.query, fixture);
      fixtures.push(fixture);
    }
    return Object.freeze(fixtures);
  } catch (error) {
    throw safeFailure(check, false, error);
  }
}

/** Cleanup requires the exact reviewed fixture list. No pattern deletion or
 * DROP OWNED is used, and the deployed runtime role/namespace cannot match.
 * Known grants are revoked by their actual owner in one native transaction.
 */
export async function cleanupNeonTestFixtures(options) {
  let check = "fixture_cleanup_input";
  let client;
  let transaction = false;
  let fixtures = [];
  const summary = { requestedFixtures: 0, cleanedNamespaces: 0, cleanedRoles: 0, productionModified: false };
  try {
    if (!options || options.designatedTestDatabase !== true || !Array.isArray(options.fixtures) ||
        options.fixtures.length < 1 || options.fixtures.length > 4 ||
        (typeof process !== "undefined" && process.env.VERCEL_ENV === "production")) throw new Error("fixture_cleanup_opt_in_required");
    fixtures = options.fixtures.map(fixtureMetadata);
    if (new Set(fixtures.map(({ roleName }) => roleName)).size !== fixtures.length ||
        new Set(fixtures.map(({ namespace }) => namespace)).size !== fixtures.length) throw new Error("duplicate_fixture");
    summary.requestedFixtures = fixtures.length;
    connection(options.adminUrl);
    check = "fixture_cleanup_connection";
    client = new Client({ connectionString: options.adminUrl.trim(), connectionTimeoutMillis: 10000, query_timeout: 20000,
      application_name: "chat-quota-fixture-cleanup" });
    client.on("error", () => {});
    await client.connect();
    await client.query("BEGIN");
    transaction = true;
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query("SELECT pg_catalog.pg_advisory_xact_lock(1717399, 1)");
    const query = async (text, params = []) => (await client.query(text, params)).rows;
    check = "fixture_database_guard";
    await verifyFixtureDatabase(query);
    const database = await query("SELECT current_database() AS name");
    assert.equal(database.length, 1);
    const existing = new Map();
    let removedNamespaces = 0;
    check = "fixture_role_guard";
    for (const fixture of fixtures) existing.set(fixture.roleName, await verifyFixtureRole(query, fixture));
    for (const fixture of fixtures) {
      const role = identifier(fixture.roleName);
      await client.query("SET LOCAL ROLE chat_quota_owner");
      check = "fixture_cleanup_namespace";
      const removed = await client.query("DELETE FROM chat_quota.namespaces WHERE namespace = $1 AND environment = $2", [fixture.namespace, ENVIRONMENT]);
      removedNamespaces += removed.rowCount;
      if (existing.get(fixture.roleName)) {
        check = "fixture_cleanup_privileges";
        await client.query(`REVOKE EXECUTE ON FUNCTION chat_quota.reserve(text, text, text, text, bigint, uuid, bigint), chat_quota.release(text, uuid) FROM ${role}`);
        await client.query(`REVOKE USAGE ON SCHEMA chat_quota FROM ${role}`);
      }
      await client.query("RESET ROLE");
      if (existing.get(fixture.roleName)) {
        await client.query(`REVOKE CONNECT ON DATABASE ${identifier(database[0].name)} FROM ${role}`);
        check = "fixture_cleanup_role";
        await client.query(`DROP ROLE ${role}`);
      }
    }
    check = "fixture_cleanup_commit";
    await client.query("COMMIT");
    transaction = false;
    summary.cleanedNamespaces = removedNamespaces;
    summary.cleanedRoles = [...existing.values()].filter(Boolean).length;
    return Object.freeze(summary);
  } catch (error) {
    if (transaction && client) {
      try { await client.query("ROLLBACK"); } catch { /* Keep raw driver details private. */ }
    }
    const failure = safeFailure(check, true, error);
    failure.fixtures = fixtures;
    failure.safeSummary = Object.freeze({ ...summary, cleanupOutcome: transaction ? "unconfirmed_or_rolled_back" : "not_started" });
    throw failure;
  } finally {
    if (client) { try { await client.end(); } catch { /* No raw driver errors. */ } }
  }
}

/** Read-only verification of the actual runtime credential. Uses catalogs and
 * zero-row probes; never reserves quota or creates schema/TEMP objects.
 * @param {string} runtimeUrl Supplied in memory; never logged or returned.
 */
export async function verifyNeonRuntimePermissions(runtimeUrl) {
  let check = "runtime_connection";
  try {
    const runtime = connection(runtimeUrl, true);
    check = "runtime_role_flags";
    const roles = await runtime.query(`SELECT current_user AS role, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls, rolreplication, rolinherit
      FROM pg_catalog.pg_roles WHERE rolname = current_user`);
    assert.equal(roles.length, 1);
    assert.equal(roles[0].role, runtime.role);
    for (const flag of ["rolsuper", "rolcreaterole", "rolcreatedb", "rolbypassrls", "rolreplication", "rolinherit"]) assert.equal(roles[0][flag], false);
    check = "runtime_admin_memberships";
    const membership = await runtime.query(`SELECT count(*)::int AS memberships FROM pg_catalog.pg_auth_members
      WHERE member = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user)`);
    assert.equal(membership[0].memberships, 0, "runtime must not inherit another database role");
    check = "runtime_schema_and_temp_permissions";
    const privileges = await runtime.query(`SELECT
      has_database_privilege(current_user, current_database(), 'CREATE') AS database_create,
      has_database_privilege(current_user, current_database(), 'TEMP') AS database_temp,
      has_schema_privilege(current_user, 'public', 'CREATE') AS public_create,
      has_schema_privilege(current_user, 'chat_quota', 'CREATE') AS quota_create,
      has_schema_privilege(current_user, 'chat_quota', 'USAGE') AS quota_usage,
      has_function_privilege(current_user, 'chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)', 'EXECUTE') AS reserve_execute,
      has_function_privilege(current_user, 'chat_quota.release(text,uuid)', 'EXECUTE') AS release_execute,
      to_regprocedure('chat_quota.reserve(text,text,text,text,bigint,uuid)') IS NULL AS legacy_reserve_absent`);
    assert.equal(privileges.length, 1);
    for (const flag of ["database_create", "database_temp", "public_create", "quota_create"]) assert.equal(privileges[0][flag], false);
    for (const flag of ["quota_usage", "reserve_execute", "release_execute", "legacy_reserve_absent"]) assert.equal(privileges[0][flag], true);
    check = "runtime_function_allowlist";
    const functions = await runtime.query(`SELECT p.proname, p.pronargs::int AS arguments FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'chat_quota' AND has_function_privilege(current_user, p.oid, 'EXECUTE') ORDER BY p.proname`);
    assert.deepEqual(functions, [{ proname: "release", arguments: 2 }, { proname: "reserve", arguments: 7 }]);
    const boundaries = await runtime.query(`SELECT p.proname, p.prosecdef,
      p.proowner <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user) AS separate_owner,
      'search_path=pg_catalog, pg_temp' = ANY(p.proconfig) AS fixed_search_path
      FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'chat_quota' AND p.proname IN ('reserve', 'release') ORDER BY p.proname`);
    assert.equal(boundaries.length, 2);
    for (const boundary of boundaries) {
      assert.equal(boundary.prosecdef, true);
      assert.equal(boundary.separate_owner, true);
      assert.equal(boundary.fixed_search_path, true);
    }
    check = "public_execute_revoked";
    const publicExecute = await runtime.query(`SELECT count(*)::int AS grants FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
      WHERE n.nspname = 'chat_quota' AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'`);
    assert.equal(publicExecute[0].grants, 0);
    check = "runtime_direct_table_access_denied";
    const tableGrants = await runtime.query(`SELECT count(*)::int AS grants FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) v(privilege)
      WHERE n.nspname = 'chat_quota' AND c.relkind IN ('r', 'p')
      AND has_table_privilege(current_user, c.oid, v.privilege)`);
    assert.equal(tableGrants[0].grants, 0);
    for (const statement of [
      "SELECT 1 FROM chat_quota.namespaces WHERE false",
      "SELECT 1 FROM chat_quota.role_bindings WHERE false",
      "SELECT 1 FROM chat_quota.buckets WHERE false",
      "SELECT 1 FROM chat_quota.leases WHERE false",
      "SELECT 1 FROM chat_quota.money_budgets WHERE false",
      "UPDATE chat_quota.buckets SET day_tokens = day_tokens WHERE false",
      "UPDATE chat_quota.money_budgets SET reserved_eur_micros = reserved_eur_micros WHERE false",
      "DELETE FROM chat_quota.money_budgets WHERE false",
      "DELETE FROM chat_quota.leases WHERE false",
    ]) await expectPermissionDenied(runtime.query, statement);
    return Object.freeze({
      roleName: runtime.role, roleFlagsRestricted: true, adminMembershipsAbsent: true,
      schemaAndTempCreationDenied: true, directTableReadsAndWritesDenied: true,
      onlyReserveAndReleaseExecutable: true, publicExecuteRevoked: true, productionModified: false,
    });
  } catch (error) {
    throw safeFailure(check, false, error);
  }
}

/** Run actual SQL, never a JS reimplementation, on explicitly opted-in isolated
 * namespaces and generated login roles. Both URLs are supplied in memory. The
 * deployed runtime URL receives only the read-only permission checks above.
 * @param {{adminUrl:string,runtimeUrl:string,designatedTestDatabase:true}} options
 */
export async function runNeonQuotaIntegration(options) {
  let check = "explicit_test_opt_in";
  let failure;
  let cleanupFailure;
  let scenariosPassed = false;
  const owned = [];
  const stats = {
    anonymousAdmitted: 0, authenticatedAdmitted: 0, sharedNetworkAdmitted: 0, globalAdmitted: 0,
    tokenSpikeBlocked: false, dailyCapsBlocked: 0, namespaceIsolationVerified: false,
    expiredLeasePruned: false, ownedReleasePreservedOtherLease: false, releaseDidNotRefundBudgets: false,
    sqlValidationFailedClosed: false, invalidStateFailedClosed: false,
    monetaryAdmitted: 0, monetaryDenialDidNotCharge: false, monetaryRolloverVerified: false,
    monetaryMissingAndFutureStateFailedClosed: false, monetaryConstraintsVerified: false,
    runtimePermissionsVerified: false, cleanedNamespaces: 0, cleanedRoles: 0,
  };
  let admin;
  const assertOwned = (scenario) => assert.ok(owned.includes(scenario) && TEST_ROLE.test(scenario.roleName) && TEST_NAMESPACE.test(scenario.namespace));
  const reset = async (scenario) => {
    assertOwned(scenario);
    await admin.query("DELETE FROM chat_quota.leases WHERE namespace = $1 AND environment = $2", [scenario.namespace, ENVIRONMENT]);
    await admin.query("DELETE FROM chat_quota.buckets WHERE namespace = $1 AND environment = $2 AND scope_key <> 'global'", [scenario.namespace, ENVIRONMENT]);
    // Runtime deliberately cannot recreate a missing global budget. Only this
    // administrative fixture reset may initialize the isolated test guard.
    await admin.query(`WITH clock AS MATERIALIZED (SELECT clock_timestamp() AS now), seeded_global AS (
      INSERT INTO chat_quota.buckets(namespace, environment, scope_key, requests, tokens, updated_at, day, day_requests, day_tokens)
      SELECT $1, $2, 'global', 60, 1000000, clock.now, floor(extract(epoch FROM clock.now) / 86400)::bigint, 0, 0 FROM clock
      ON CONFLICT (namespace, environment, scope_key) DO UPDATE SET
      requests = EXCLUDED.requests, tokens = EXCLUDED.tokens, updated_at = EXCLUDED.updated_at,
      day = EXCLUDED.day, day_requests = 0, day_tokens = 0 RETURNING namespace)
      INSERT INTO chat_quota.money_budgets(namespace, environment, day, reserved_eur_micros)
      SELECT $1, $2, floor(extract(epoch FROM clock.now) / 86400)::bigint, 0 FROM clock
      ON CONFLICT (namespace, environment) DO UPDATE SET day = EXCLUDED.day, reserved_eur_micros = 0`, [scenario.namespace, ENVIRONMENT]);
    scenario.reservations.length = 0;
  };
  const snapshots = async (scenario) => {
    assertOwned(scenario);
    const buckets = await admin.query(`SELECT scope_key, requests::text, tokens::text, updated_at::text,
      day::text, day_requests::text, day_tokens::text FROM chat_quota.buckets
      WHERE namespace = $1 AND environment = $2 ORDER BY scope_key`, [scenario.namespace, ENVIRONMENT]);
    const money = await admin.query(`SELECT day::text, reserved_eur_micros::text FROM chat_quota.money_budgets
      WHERE namespace = $1 AND environment = $2`, [scenario.namespace, ENVIRONMENT]);
    return { buckets, money };
  };
  const leases = async (scenario) => {
    assertOwned(scenario);
    return admin.query(`SELECT lease_id::text FROM chat_quota.leases
      WHERE namespace = $1 AND environment = $2 ORDER BY lease_id`, [scenario.namespace, ENVIRONMENT]);
  };
  const race = async (scenario, identities, expected) => {
    await reset(scenario);
    const results = await Promise.allSettled(identities.map((who) => scenario.reserve(who)));
    const admitted = results.filter(({ status }) => status === "fulfilled").map(({ value }) => value);
    try {
      assert.equal(admitted.length, expected, "real concurrent sessions must honor every quota scope");
      for (const outcome of results) if (outcome.status === "rejected") assert.ok(denied(outcome.reason));
    } finally {
      await Promise.all(admitted.map((lease) => lease.release()));
    }
    return admitted.length;
  };

  try {
    if (!options || options.designatedTestDatabase !== true ||
        (typeof process !== "undefined" && process.env.VERCEL_ENV === "production")) throw new Error("test_opt_in_required");
    check = "deployed_runtime_permissions";
    await verifyNeonRuntimePermissions(options.runtimeUrl);
    stats.runtimePermissionsVerified = true;
    check = "isolated_fixture_provisioning";
    admin = connection(options.adminUrl);
    const deployedRuntime = connection(options.runtimeUrl, true);
    assert.equal(admin.endpoint, deployedRuntime.endpoint, "administrator and runtime must select the same Neon endpoint");
    assert.equal(admin.database, deployedRuntime.database, "administrator and runtime must select the same dedicated database");
    const suffix = randomBytes(12).toString("hex");
    for (const label of ["a", "b"]) {
      const roleName = `chat_quota_preview_test${suffix}${label}`;
      const namespace = `chat-test-${suffix}-${label}`;
      assert.match(roleName, TEST_ROLE);
      assert.match(namespace, TEST_NAMESPACE);
      const existingRole = await admin.query("SELECT 1 AS found FROM pg_catalog.pg_roles WHERE rolname = $1", [roleName]);
      const existingNamespace = await admin.query("SELECT 1 AS found FROM chat_quota.namespaces WHERE namespace = $1 AND environment = $2", [namespace, ENVIRONMENT]);
      assert.equal(existingRole.length, 0, "a pre-existing role must never enter the cleanup ownership list");
      assert.equal(existingNamespace.length, 0, "a pre-existing namespace must never enter the cleanup ownership list");
      // Track before provisioning so cleanup can handle a partially completed
      // setup. Names are generated here, never copied from caller credentials.
      const scenario = { roleName, namespace, reservations: [] };
      owned.push(scenario);
      const configured = await provisionChatQuota({
        adminUrl: options.adminUrl, runtimePassword: randomBytes(32).toString("base64url"),
        roleName, namespace, environment: ENVIRONMENT, dedicatedDatabase: true,
      });
      assert.equal(configured.roleName, roleName);
      assert.equal(configured.namespace, namespace);
      assert.equal(configured.environment, ENVIRONMENT);
      const runtime = connection(configured.runtimeUrl, true);
      scenario.query = runtime.query;
      scenario.env = { CHAT_DATABASE_URL: configured.runtimeUrl, VERCEL_ENV: ENVIRONMENT };
      scenario.reserve = (who, cost = 1, extraEnv = {}, reservedCostEurMicros = 1000) => reserveChatQuota(who, cost, {
        env: { ...scenario.env, ...extraEnv },
        reservedCostEurMicros,
        query: async (text, params) => {
          if (text === RESERVE_CHAT_QUOTA_SQL) scenario.reservations.push({ who, cost, moneyCost: params[6], leaseId: params[5] });
          else assert.equal(text, RELEASE_CHAT_QUOTA_SQL);
          return runtime.query(text, params);
        },
      });
    }
    const [primary, other] = owned;

    check = "anonymous_concurrency";
    stats.anonymousAdmitted = await race(primary, Array.from({ length: 8 }, () => identity("anonymous")), 1);
    check = "authenticated_concurrency";
    stats.authenticatedAdmitted = await race(primary, Array.from({ length: 8 }, () => identity("authenticated")), 2);
    check = "shared_network_concurrency";
    stats.sharedNetworkAdmitted = await race(primary, Array.from({ length: 8 }, (_, index) => identity("authenticated", `subject-${index}`)), 3);
    check = "global_concurrency";
    stats.globalAdmitted = await race(primary, Array.from({ length: 12 }, (_, index) => identity("authenticated", `subject-${index}`, `network-${index}`)), 8);

    check = "monetary_concurrency";
    await reset(primary);
    const moneyRace = await Promise.allSettled(Array.from({ length: 8 }, (_, index) =>
      primary.reserve(identity("authenticated", `money-subject-${index}`, `money-network-${index}`), 1, {}, 1500000)));
    const moneyLeases = moneyRace.filter(({ status }) => status === "fulfilled").map(({ value }) => value);
    try {
      assert.equal(moneyLeases.length, 3, "parallel sessions must never reserve beyond the shared five-euro daily cap");
      for (const outcome of moneyRace) if (outcome.status === "rejected") assert.ok(denied(outcome.reason));
      assert.equal((await snapshots(primary)).money[0].reserved_eur_micros, "4500000");
      stats.monetaryAdmitted = moneyLeases.length;
      check = "monetary_denial_without_charges";
      const beforeMoneyDenial = await snapshots(primary);
      const beforeDeniedLeases = await leases(primary);
      await assert.rejects(primary.reserve(identity("authenticated", "money-denied-subject", "money-denied-network"), 1, {}, 600000),
        (error) => denied(error) && Number.isInteger(error.retryAfter) && error.retryAfter >= 1 && error.retryAfter <= 86400);
      assert.deepEqual(await snapshots(primary), beforeMoneyDenial, "money denial cannot charge request, token or money counters");
      assert.deepEqual(await leases(primary), beforeDeniedLeases, "money denial cannot create a lease");
      const exactCap = await primary.reserve(identity("authenticated", "money-final-subject", "money-final-network"), 1, {}, 500000);
      moneyLeases.push(exactCap);
      assert.equal((await snapshots(primary)).money[0].reserved_eur_micros, "5000000", "the hard cap can be filled exactly");
      stats.monetaryDenialDidNotCharge = true;
    } finally {
      const chargedMoney = (await snapshots(primary)).money;
      await Promise.all(moneyLeases.map((lease) => lease.release()));
      assert.deepEqual((await snapshots(primary)).money, chargedMoney, "releasing concurrent leases never refunds monetary reservations");
    }
    const fullMoneyBudget = await snapshots(primary);
    await assert.rejects(primary.reserve(identity("anonymous", "new-cookie-subject", "changed-vpn-network")), denied);
    assert.deepEqual(await snapshots(primary), fullMoneyBudget, "new visitors and networks cannot reset the global money budget");

    check = "monetary_utc_rollover";
    await reset(primary);
    await admin.query(`UPDATE chat_quota.money_budgets SET
      day = floor(extract(epoch FROM clock_timestamp()) / 86400)::bigint - 1, reserved_eur_micros = 5000000
      WHERE namespace = $1 AND environment = $2`, [primary.namespace, ENVIRONMENT]);
    const rollover = await primary.reserve(identity("anonymous"), 1, {}, 12345);
    await rollover.release();
    const rolloverState = await admin.query(`SELECT reserved_eur_micros::text,
      day = floor(extract(epoch FROM clock_timestamp()) / 86400)::bigint AS current_utc_day
      FROM chat_quota.money_budgets WHERE namespace = $1 AND environment = $2`, [primary.namespace, ENVIRONMENT]);
    assert.deepEqual(rolloverState, [{ reserved_eur_micros: "12345", current_utc_day: true }]);
    stats.monetaryRolloverVerified = true;

    check = "token_spike";
    await reset(primary);
    const spike = await primary.reserve(identity("anonymous"), 64000);
    await spike.release();
    const spikeBefore = await snapshots(primary);
    await assert.rejects(primary.reserve(identity("anonymous"), 64000), denied);
    assert.deepEqual(await snapshots(primary), spikeBefore, "denied spikes cannot charge any scope");
    stats.tokenSpikeBlocked = true;

    check = "daily_caps";
    for (const [tier, scope, policy, field] of [
      ["anonymous", "subject", CHAT_QUOTA_POLICY.anonymous, "day_requests"],
      ["anonymous", "subject", CHAT_QUOTA_POLICY.anonymous, "day_tokens"],
      ["authenticated", "subject", CHAT_QUOTA_POLICY.authenticated, "day_requests"],
      ["authenticated", "subject", CHAT_QUOTA_POLICY.authenticated, "day_tokens"],
      ["authenticated", "network", CHAT_QUOTA_POLICY.network, "day_tokens"],
      ["authenticated", "global", CHAT_QUOTA_POLICY.global, "day_requests"],
      ["authenticated", "global", CHAT_QUOTA_POLICY.global, "day_tokens"],
    ]) {
      await reset(primary);
      const who = identity(tier);
      const first = await primary.reserve(who);
      await first.release();
      const scopeKey = scope === "subject" ? `subject:${tier}:${who.subjectKey}` : scope === "network" ? `network:${who.networkKey}` : "global";
      const cap = field === "day_requests" ? policy.requestsPerDay : policy.tokensPerDay;
      // The column is selected from a fixed program-owned two-value list.
      assert.ok(["day_requests", "day_tokens"].includes(field));
      await admin.query(`UPDATE chat_quota.buckets SET ${field} = $3,
        requests = $4, tokens = $5, updated_at = clock_timestamp(),
        day = floor(extract(epoch FROM clock_timestamp()) / 86400)::bigint
        WHERE namespace = $1 AND environment = $2 AND scope_key = $6`,
      [primary.namespace, ENVIRONMENT, cap, policy.requestsPerMinute, policy.tokensPerMinute, scopeKey]);
      const before = await snapshots(primary);
      await assert.rejects(primary.reserve(who), (error) => denied(error) && Number.isInteger(error.retryAfter) && error.retryAfter >= 1 && error.retryAfter <= 86400);
      assert.deepEqual(await snapshots(primary), before, "daily denial cannot change other scope counters");
      stats.dailyCapsBlocked += 1;
    }

    check = "namespace_isolation";
    await reset(primary);
    await reset(other);
    const firstNamespace = await primary.reserve(identity("anonymous"), 100, { CHAT_QUOTA_NAMESPACE: other.namespace });
    const secondNamespace = await other.reserve(identity("anonymous"), 100);
    assert.equal((await leases(primary)).length, 1);
    assert.equal((await leases(other)).length, 1);
    const otherLeaseId = other.reservations[0].leaseId;
    const cannotReleaseOther = await primary.query(RELEASE_CHAT_QUOTA_SQL, [ENVIRONMENT, otherLeaseId]);
    assert.equal(cannotReleaseOther[0].released, 0);
    assert.equal((await leases(other))[0].lease_id, otherLeaseId);
    await Promise.all([firstNamespace.release(), secondNamespace.release()]);
    stats.namespaceIsolationVerified = true;

    check = "expired_leases";
    await reset(primary);
    const old = await primary.reserve(identity("anonymous"));
    const oldId = primary.reservations[0].leaseId;
    await admin.query(`UPDATE chat_quota.leases SET expires_at = clock_timestamp() - interval '1 second'
      WHERE namespace = $1 AND environment = $2 AND lease_id = $3::uuid`, [primary.namespace, ENVIRONMENT, oldId]);
    const fresh = await primary.reserve(identity("anonymous"));
    const freshId = primary.reservations[1].leaseId;
    assert.deepEqual(await leases(primary), [{ lease_id: freshId }]);
    await old.release();
    assert.deepEqual(await leases(primary), [{ lease_id: freshId }]);
    await fresh.release();
    stats.expiredLeasePruned = true;

    check = "owned_release_without_refunds";
    await reset(primary);
    const one = await primary.reserve(identity("authenticated"), 100);
    const two = await primary.reserve(identity("authenticated"), 100);
    const charged = await snapshots(primary);
    await Promise.all([one.release(), one.release()]);
    assert.deepEqual(await snapshots(primary), charged);
    assert.deepEqual(await leases(primary), [{ lease_id: primary.reservations[1].leaseId }]);
    const three = await primary.reserve(identity("authenticated"), 100);
    const chargedAgain = await snapshots(primary);
    const replay = await primary.query(RELEASE_CHAT_QUOTA_SQL, [ENVIRONMENT, primary.reservations[0].leaseId]);
    assert.equal(replay[0].released, 0);
    await one.release();
    assert.deepEqual(await snapshots(primary), chargedAgain);
    assert.equal((await leases(primary)).length, 2);
    await Promise.all([two.release(), three.release()]);
    assert.deepEqual(await leases(primary), []);
    stats.ownedReleasePreservedOtherLease = true;
    stats.releaseDidNotRefundBudgets = true;

    check = "sql_validation_and_environment_binding";
    await reset(primary);
    const validationBefore = await snapshots(primary);
    const who = identity("anonymous");
    await expectPermissionDenied(primary.query, RESERVE_CHAT_QUOTA_SQL, ["production", who.tier, who.subjectKey, who.networkKey, 1, randomUUID(), 1000]);
    await expectPermissionDenied(primary.query, RELEASE_CHAT_QUOTA_SQL, ["production", randomUUID()]);
    for (const [tier, subject, network, cost] of [
      ["admin", who.subjectKey, who.networkKey, 1], ["anonymous", "raw-private-ip", who.networkKey, 1],
      ["anonymous", who.subjectKey, "raw-private-subject", 1], ["anonymous", who.subjectKey, who.networkKey, 64001],
    ]) {
      let rejected = false;
      try { await primary.query(RESERVE_CHAT_QUOTA_SQL, [ENVIRONMENT, tier, subject, network, cost, randomUUID(), 1000]); } catch { rejected = true; }
      assert.equal(rejected, true, "SQL validation is independent of adapter validation");
    }
    for (const moneyCost of [null, 0, -1, 5000001]) {
      await assert.rejects(primary.query(RESERVE_CHAT_QUOTA_SQL,
        [ENVIRONMENT, who.tier, who.subjectKey, who.networkKey, 1, randomUUID(), moneyCost]),
      (error) => error?.code === "22023", "SQL independently rejects invalid monetary cost");
    }
    assert.deepEqual(await snapshots(primary), validationBefore);
    assert.deepEqual(await leases(primary), []);
    stats.sqlValidationFailedClosed = true;

    check = "missing_global_budget_failed_closed";
    await reset(primary);
    const seededMoney = (await snapshots(primary)).money;
    await admin.query("DELETE FROM chat_quota.buckets WHERE namespace = $1 AND environment = $2 AND scope_key = 'global'", [primary.namespace, ENVIRONMENT]);
    await assert.rejects(primary.reserve(identity("anonymous")), (error) => error instanceof QuotaError && error.status === 503);
    assert.deepEqual(await snapshots(primary), { buckets: [], money: seededMoney }, "runtime must not silently recreate an erased global budget");
    assert.deepEqual(await leases(primary), []);
    check = "future_state_failed_closed";
    await reset(primary);
    await admin.query(`UPDATE chat_quota.buckets SET updated_at = clock_timestamp() + interval '1 hour'
      WHERE namespace = $1 AND environment = $2 AND scope_key = 'global'`, [primary.namespace, ENVIRONMENT]);
    const invalidBefore = await snapshots(primary);
    await assert.rejects(primary.reserve(identity("anonymous")), (error) => error instanceof QuotaError && error.status === 503);
    assert.deepEqual(await snapshots(primary), invalidBefore);
    assert.deepEqual(await leases(primary), []);
    await reset(primary);
    const recovered = await primary.reserve(identity("anonymous"));
    await recovered.release();
    stats.invalidStateFailedClosed = true;

    check = "monetary_missing_and_future_state_failed_closed";
    for (const invalidMoneyState of ["missing", "future"]) {
      await reset(primary);
      if (invalidMoneyState === "missing") {
        await admin.query("DELETE FROM chat_quota.money_budgets WHERE namespace = $1 AND environment = $2", [primary.namespace, ENVIRONMENT]);
      } else {
        await admin.query(`UPDATE chat_quota.money_budgets SET day = floor(extract(epoch FROM clock_timestamp()) / 86400)::bigint + 1
          WHERE namespace = $1 AND environment = $2`, [primary.namespace, ENVIRONMENT]);
      }
      const invalidMoneyBefore = await snapshots(primary);
      await assert.rejects(primary.query(RESERVE_CHAT_QUOTA_SQL,
        [ENVIRONMENT, who.tier, who.subjectKey, who.networkKey, 1, randomUUID(), 1000]),
      (error) => error?.code === "55000", "runtime SQL must fail closed on missing or future monetary state");
      assert.deepEqual(await snapshots(primary), invalidMoneyBefore, "bad money state cannot be initialized or repaired by runtime");
      assert.deepEqual(await leases(primary), []);
    }
    stats.monetaryMissingAndFutureStateFailedClosed = true;
    check = "monetary_constraints";
    await reset(primary);
    for (const badReserved of [-1, 5000001]) {
      await assert.rejects(admin.query(`UPDATE chat_quota.money_budgets SET reserved_eur_micros = $3
        WHERE namespace = $1 AND environment = $2`, [primary.namespace, ENVIRONMENT, badReserved]),
      (error) => error?.code === "23514", "table constraints reject corrupt monetary counters even for fixture owners");
    }
    assert.equal((await snapshots(primary)).money[0].reserved_eur_micros, "0");
    stats.monetaryConstraintsVerified = true;
    check = "isolated_runtime_permissions";
    for (const scenario of owned) await verifyNeonRuntimePermissions(scenario.env.CHAT_DATABASE_URL);
    scenariosPassed = true;
  } catch (error) {
    failure = safeFailure(check, false, error);
  } finally {
    if (admin && owned.length) {
      try {
        for (const scenario of owned) assertOwned(scenario);
        const cleaned = await cleanupNeonTestFixtures({
          adminUrl: options.adminUrl,
          fixtures: owned.map(({ roleName, namespace }) => ({ roleName, namespace, environment: ENVIRONMENT })),
          designatedTestDatabase: true,
        });
        stats.cleanedNamespaces = cleaned.cleanedNamespaces;
        stats.cleanedRoles = cleaned.cleanedRoles;
      } catch (error) { cleanupFailure = error; }
    }
  }
  if (cleanupFailure) {
    const cleanupError = safeFailure(failure?.check ?? cleanupFailure.check ?? "isolated_fixture_cleanup", true,
      failure?.sqlState ? failure : cleanupFailure);
    cleanupError.primaryCheck = failure?.check ?? null;
    cleanupError.cleanupCheck = cleanupFailure.check ?? "isolated_fixture_cleanup";
    cleanupError.cleanupSqlState = sqlState(cleanupFailure);
    cleanupError.scenariosPassed = scenariosPassed;
    cleanupError.safeSummary = Object.freeze({ ...stats, scenariosPassed });
    cleanupError.fixtures = owned.map(({ roleName, namespace }) => ({ roleName, namespace, environment: ENVIRONMENT }));
    throw cleanupError;
  }
  if (failure) {
    failure.scenariosPassed = false;
    failure.safeSummary = Object.freeze({ ...stats, scenariosPassed: false });
    throw failure;
  }
  return Object.freeze(stats);
}

const CLI_NUMBER_STATS = Object.freeze([
  "anonymousAdmitted", "authenticatedAdmitted", "sharedNetworkAdmitted", "globalAdmitted", "dailyCapsBlocked", "monetaryAdmitted", "cleanedNamespaces", "cleanedRoles",
]);
const CLI_BOOLEAN_STATS = Object.freeze([
  "tokenSpikeBlocked", "namespaceIsolationVerified", "expiredLeasePruned", "ownedReleasePreservedOtherLease",
  "releaseDidNotRefundBudgets", "sqlValidationFailedClosed", "invalidStateFailedClosed", "runtimePermissionsVerified",
  "monetaryDenialDidNotCharge", "monetaryRolloverVerified", "monetaryMissingAndFutureStateFailedClosed", "monetaryConstraintsVerified",
]);
const CLI_CHECKS = new Set([
  "cli_arguments_invalid", "cli_production_disabled", "cli_input_required", "cli_input_timeout", "cli_input_too_large", "cli_input_invalid", "integration_failed",
  "explicit_test_opt_in", "deployed_runtime_permissions", "isolated_fixture_provisioning", "anonymous_concurrency", "authenticated_concurrency",
  "shared_network_concurrency", "global_concurrency", "token_spike", "daily_caps", "namespace_isolation", "expired_leases",
  "monetary_concurrency", "monetary_denial_without_charges", "monetary_utc_rollover", "monetary_missing_and_future_state_failed_closed", "monetary_constraints",
  "owned_release_without_refunds", "sql_validation_and_environment_binding", "missing_global_budget_failed_closed", "future_state_failed_closed",
  "isolated_runtime_permissions", "isolated_fixture_cleanup", "runtime_connection", "runtime_role_flags", "runtime_admin_memberships",
  "runtime_schema_and_temp_permissions", "runtime_function_allowlist", "public_execute_revoked", "runtime_direct_table_access_denied",
  "fixture_inspection", "fixture_cleanup_input", "fixture_cleanup_connection", "fixture_database_guard", "fixture_role_guard",
  "fixture_cleanup_namespace", "fixture_cleanup_privileges", "fixture_cleanup_role", "fixture_cleanup_commit",
]);

function cliStats(value) {
  const stats = {};
  for (const key of CLI_NUMBER_STATS) if (Number.isSafeInteger(value?.[key]) && value[key] >= 0) stats[key] = value[key];
  for (const key of CLI_BOOLEAN_STATS) if (typeof value?.[key] === "boolean") stats[key] = value[key];
  return stats;
}

function cliFailure(error) {
  const result = { status: "failed", check: CLI_CHECKS.has(error?.check) ? error.check : "integration_failed" };
  const state = sqlState(error);
  if (state) result.sqlState = state;
  if (typeof error?.cleanupFailed === "boolean") result.cleanupFailed = error.cleanupFailed;
  if (error?.primaryCheck === null || CLI_CHECKS.has(error?.primaryCheck)) result.primaryCheck = error.primaryCheck;
  if (CLI_CHECKS.has(error?.cleanupCheck)) result.cleanupCheck = error.cleanupCheck;
  if (typeof error?.scenariosPassed === "boolean") result.scenariosPassed = error.scenariosPassed;
  if (error?.safeSummary) result.safeSummary = cliStats(error.safeSummary);
  if (Array.isArray(error?.fixtures) && error.fixtures.length <= 4) {
    const fixtures = [];
    for (const value of error.fixtures) {
      try { fixtures.push(fixtureMetadata(value)); } catch { /* Reject arbitrary error metadata. */ }
    }
    if (fixtures.length) result.fixtures = fixtures;
  }
  return result;
}

function cliInputFailure(check) {
  const error = new Error("Neon integration CLI input rejected");
  error.check = check;
  return error;
}

function readCliInput() {
  if (process.stdin.isTTY) return Promise.reject(cliInputFailure("cli_input_required"));
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      process.stdin.removeListener("data", onData);
      process.stdin.removeListener("end", onEnd);
      process.stdin.removeListener("error", onError);
      if (error) {
        process.stdin.destroy();
        for (const chunk of chunks) chunk.fill(0);
        reject(error);
        return;
      }
      const combined = Buffer.concat(chunks, bytes);
      try {
        if (!bytes) throw cliInputFailure("cli_input_required");
        const decoded = new TextDecoder("utf-8", { fatal: true }).decode(combined);
        resolve(JSON.parse(decoded));
      } catch (parseError) {
        reject(parseError?.check === "cli_input_required" ? parseError : cliInputFailure("cli_input_invalid"));
      } finally {
        combined.fill(0);
        for (const chunk of chunks) chunk.fill(0);
      }
    };
    const onData = (value) => {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
      bytes += chunk.byteLength;
      if (bytes > 20 * 1024) {
        chunk.fill(0);
        finish(cliInputFailure("cli_input_too_large"));
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => finish();
    const onError = () => finish(cliInputFailure("cli_input_invalid"));
    const timer = setTimeout(() => finish(cliInputFailure("cli_input_timeout")), 10000);
    process.stdin.on("data", onData);
    process.stdin.once("end", onEnd);
    process.stdin.once("error", onError);
  });
}

function validateCliInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== "adminUrl,designatedTestDatabase,runtimeUrl" ||
      typeof value.adminUrl !== "string" || typeof value.runtimeUrl !== "string" || value.designatedTestDatabase !== true) {
    throw cliInputFailure("cli_input_invalid");
  }
  try {
    const admin = connection(value.adminUrl);
    const runtime = connection(value.runtimeUrl, true);
    if (admin.endpoint !== runtime.endpoint || admin.database !== runtime.database) throw new Error("target_mismatch");
  } catch { throw cliInputFailure("cli_input_invalid"); }
  return { adminUrl: value.adminUrl, runtimeUrl: value.runtimeUrl, designatedTestDatabase: true };
}

async function runCli() {
  const args = process.argv.slice(2);
  if (!args.length || (args.length === 1 && args[0] === "--help")) {
    console.log(JSON.stringify({ status: "usage", command: "npm run test:chat:neon -- --run",
      input: "Credential manager stdin JSON: adminUrl, runtimeUrl, designatedTestDatabase:true. No network without --run." }));
    return;
  }
  try {
    if (args.length !== 1 || args[0] !== "--run") throw cliInputFailure("cli_arguments_invalid");
    if (process.env.VERCEL_ENV === "production") throw cliInputFailure("cli_production_disabled");
    const options = validateCliInput(await readCliInput());
    const stats = await runNeonQuotaIntegration(options);
    console.log(JSON.stringify({ status: "passed", stats: cliStats(stats) }));
  } catch (error) {
    console.log(JSON.stringify(cliFailure(error)));
    process.exitCode = 1;
  }
}

if (typeof process !== "undefined" && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}

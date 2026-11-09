import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

const OWNER_ROLE = "chat_quota_owner";
const MIGRATION_URL = new URL("../db/chat-quotas.sql", import.meta.url);
const ENVIRONMENTS = new Set(["development", "preview", "production"]);
const RUNTIME_ROLE = /^chat_quota_(development|preview|production)(?:_(?:test_?)?[a-f0-9]{8,32})?$/;

function identifier(value) {
  return '"' + value.replace(/"/g, '""') + '"';
}

function literal(value) {
  return "'" + value.replace(/'/g, "''") + "'";
}

function settings(options) {
  if (!options || typeof options !== "object" || Array.isArray(options) || options.dedicatedDatabase !== true) {
    throw new Error("dedicated_quota_database_required");
  }
  const environment = options.environment ?? "preview";
  const namespace = options.namespace ?? "law-firm-site-chat";
  const roleName = options.roleName ?? "chat_quota_" + environment;
  const runtimePassword = options.runtimePassword ?? randomBytes(32).toString("base64url");
  const roleMatch = typeof roleName === "string" ? RUNTIME_ROLE.exec(roleName) : null;
  if (!ENVIRONMENTS.has(environment) || typeof namespace !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/.test(namespace) ||
      !roleMatch || roleMatch[1] !== environment ||
      typeof runtimePassword !== "string" || !/^[a-zA-Z0-9_-]{32,128}$/.test(runtimePassword) ||
      typeof options.adminUrl !== "string" || options.adminUrl.length > 8192 ||
      /\s|\p{Cc}/u.test(options.adminUrl)) {
    throw new Error("invalid_chat_quota_setup_configuration");
  }
  let adminUrl;
  try {
    adminUrl = new URL(options.adminUrl);
    const username = decodeURIComponent(adminUrl.username);
    const password = decodeURIComponent(adminUrl.password);
    const database = decodeURIComponent(adminUrl.pathname.slice(1));
    const labels = adminUrl.hostname.split(".");
    const parameters = adminUrl.searchParams;
    if (!["postgres:", "postgresql:"].includes(adminUrl.protocol) ||
        !adminUrl.hostname.endsWith(".neon.tech") || adminUrl.hostname.length > 253 ||
        labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
        !/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(username) ||
        password.length < 16 || password.length > 4096 || /\s|\p{Cc}/u.test(password) ||
        !/^[A-Za-z0-9_][A-Za-z0-9_-]{0,62}$/.test(database) ||
        adminUrl.pathname !== "/" + encodeURIComponent(database) || adminUrl.hash ||
        (adminUrl.port && adminUrl.port !== "5432") ||
        parameters.getAll("sslmode").length !== 1 ||
        !["require", "verify-full"].includes(parameters.get("sslmode") ?? "") ||
        parameters.getAll("channel_binding").length > 1 ||
        (parameters.has("channel_binding") && parameters.get("channel_binding") !== "require") ||
        [...parameters.keys()].some((key) => !["sslmode", "channel_binding"].includes(key))) {
      throw new Error("configuration");
    }
  } catch {
    throw new Error("invalid_chat_quota_setup_configuration");
  }
  return { environment, namespace, roleName, runtimePassword, adminUrl };
}

/**
 * Provision only a NEW, DEDICATED Neon quota database explicitly selected by an
 * operator. Importing this file performs no network calls. The function never
 * loads environment/credential files, prints secrets, or changes a billing plan.
 *
 * @param {{
 *   adminUrl: string,
 *   runtimePassword?: string,
 *   roleName?: string,
 *   namespace?: string,
 *   environment?: "development" | "preview" | "production",
 *   dedicatedDatabase: true
 * }} options
 * @returns {Promise<{
 *   runtimeUrl: string,
 *   roleName: string,
 *   namespace: string,
 *   environment: string,
 *   policyVersion: 1,
 *   moneyPolicyVersion: 1
 * }>} Secret-bearing result: transfer runtimeUrl to the secret manager in memory;
 * never print or serialize the result to a file, log, test output or chat.
 */
export async function provisionChatQuota(options) {
  let stage = "configuration";
  let config;
  let client;
  let transaction = false;
  try {
    config = settings(options);
    stage = "load_migration";
    const migration = await readFile(MIGRATION_URL, "utf8");
    const { Client } = await import("@neondatabase/serverless");
    stage = "connect";
    client = new Client({
      connectionString: config.adminUrl.href,
      connectionTimeoutMillis: 10000,
      query_timeout: 20000,
      application_name: "chat-quota-provision",
    });
    // Avoid a late connection error becoming an uncaught event with driver data.
    client.on("error", () => {});
    await client.connect();
    await client.query("BEGIN");
    transaction = true;
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query("SELECT pg_catalog.pg_advisory_xact_lock(1717399, 1)");

    const metadata = await client.query(
      "SELECT pg_catalog.current_database() AS database_name, CURRENT_USER AS admin_role",
    );
    if (metadata.rows.length !== 1) throw new Error("configuration");
    const databaseName = metadata.rows[0].database_name;
    const adminRole = metadata.rows[0].admin_role;

    stage = "dedicated_database_check";
    // Inspect catalog metadata only. Never read application tables or records.
    // Existing chat_quota objects support later test/environment provisioning;
    // unrelated user relations/functions make this an unsafe target database.
    const unrelated = await client.query(
      "SELECT EXISTS (" +
      "SELECT 1 FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace " +
      "WHERE pg_catalog.left(n.nspname, 3) <> 'pg_' AND n.nspname NOT IN ('information_schema', 'chat_quota') " +
      "AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f') " +
      "AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend AS d WHERE d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass " +
      "AND d.objid = c.oid AND d.deptype = 'e') " +
      "UNION ALL SELECT 1 FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace " +
      "WHERE pg_catalog.left(n.nspname, 3) <> 'pg_' AND n.nspname NOT IN ('information_schema', 'chat_quota') " +
      "AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend AS d WHERE d.classid = 'pg_catalog.pg_proc'::pg_catalog.regclass " +
      "AND d.objid = p.oid AND d.deptype = 'e')" +
      ") AS present",
    );
    if (unrelated.rows[0]?.present !== false) throw new Error("non_dedicated_database");
    const existingRuntime = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = $1", [config.roleName]);
    if (existingRuntime.rows.length) throw new Error("runtime_role_already_exists");

    stage = "owner_role";
    const owner = await client.query(
      "SELECT oid, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls, rolinherit " +
      "FROM pg_catalog.pg_roles WHERE rolname = $1",
      [OWNER_ROLE],
    );
    if (!owner.rows.length) {
      await client.query("CREATE ROLE " + identifier(OWNER_ROLE) +
        " NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT");
    } else {
      const value = owner.rows[0];
      if (["rolcanlogin", "rolsuper", "rolcreatedb", "rolcreaterole", "rolreplication", "rolbypassrls", "rolinherit"]
        .some((flag) => value[flag] !== false)) throw new Error("unsafe_owner_role");
      const memberships = await client.query("SELECT 1 FROM pg_catalog.pg_auth_members WHERE member = $1", [value.oid]);
      if (memberships.rows.length) throw new Error("unsafe_owner_role");
    }
    // This grant is only to the trusted provisioning administrator. The runtime
    // role is never a member of this owner or any other privileged role.
    await client.query("GRANT " + identifier(OWNER_ROLE) + " TO " + identifier(adminRole));
    stage = "schema";
    const schema = await client.query(
      "SELECT pg_catalog.pg_get_userbyid(nspowner) AS owner FROM pg_catalog.pg_namespace WHERE nspname = 'chat_quota'",
    );
    if (schema.rows.length && schema.rows[0].owner !== OWNER_ROLE) throw new Error("unsafe_schema_owner");
    await client.query("CREATE SCHEMA IF NOT EXISTS chat_quota AUTHORIZATION " + identifier(OWNER_ROLE));

    stage = "runtime_role";
    await client.query("CREATE ROLE " + identifier(config.roleName) +
      " LOGIN PASSWORD " + literal(config.runtimePassword) +
      " NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT");
    const runtimeRole = await client.query("SELECT oid FROM pg_catalog.pg_roles WHERE rolname = $1", [config.roleName]);
    if (runtimeRole.rows.length !== 1) throw new Error("configuration");

    // A new dedicated database is essential: PUBLIC database/schema grants are
    // revoked here. This function must never run against an existing app DB.
    stage = "database_grants";
    await client.query("REVOKE ALL ON DATABASE " + identifier(databaseName) + " FROM PUBLIC");
    await client.query("REVOKE ALL ON SCHEMA public FROM PUBLIC");
    await client.query("GRANT CONNECT ON DATABASE " + identifier(databaseName) + " TO " + identifier(config.roleName));
    await client.query("ALTER ROLE " + identifier(config.roleName) + " SET statement_timeout = '5s'");
    await client.query("ALTER ROLE " + identifier(config.roleName) + " SET lock_timeout = '2s'");
    await client.query("ALTER ROLE " + identifier(config.roleName) + " SET idle_in_transaction_session_timeout = '5s'");
    await client.query("SET LOCAL ROLE " + identifier(OWNER_ROLE));
    stage = "migration";
    await client.query(migration);

    stage = "seed_namespace";
    const seeded = await client.query(
      "INSERT INTO chat_quota.namespaces(namespace, environment, policy_version) VALUES ($1, $2, 1) " +
      "ON CONFLICT (namespace, environment) DO NOTHING RETURNING namespace",
      [config.namespace, config.environment],
    );
    if (seeded.rows.length === 1) {
      await client.query(
        "WITH clock AS MATERIALIZED (SELECT pg_catalog.clock_timestamp() AS now), seeded_global AS (" +
        "INSERT INTO chat_quota.buckets(namespace, environment, scope_key, requests, tokens, updated_at, day, day_requests, day_tokens) " +
        "SELECT $1, $2, 'global', 60, 1000000, clock.now, pg_catalog.floor(EXTRACT(epoch FROM clock.now) / 86400)::bigint, 0, 0 FROM clock RETURNING namespace) " +
        "INSERT INTO chat_quota.money_budgets(namespace, environment, day, reserved_eur_micros) " +
        "SELECT $1, $2, pg_catalog.floor(EXTRACT(epoch FROM clock.now) / 86400)::bigint, 0 FROM clock",
        [config.namespace, config.environment],
      );
    } else {
      const state = await client.query(
        "SELECT 1 FROM chat_quota.namespaces AS n JOIN chat_quota.buckets AS b " +
        "ON b.namespace = n.namespace AND b.environment = n.environment AND b.scope_key = 'global' " +
        "JOIN chat_quota.money_budgets AS m ON m.namespace = n.namespace AND m.environment = n.environment " +
        "WHERE n.namespace = $1 AND n.environment = $2 AND n.policy_version = 1 FOR UPDATE OF n, b, m",
        [config.namespace, config.environment],
      );
      if (state.rows.length !== 1) throw new Error("missing_seeded_global_state");
    }
    stage = "role_binding";
    await client.query(
      "INSERT INTO chat_quota.role_bindings(login_role, role_oid, namespace, environment) VALUES ($1, $2, $3, $4)",
      [config.roleName, runtimeRole.rows[0].oid, config.namespace, config.environment],
    );
    stage = "runtime_grants";
    await client.query("GRANT USAGE ON SCHEMA chat_quota TO " + identifier(config.roleName));
    await client.query("GRANT EXECUTE ON FUNCTION chat_quota.reserve(text, text, text, text, bigint, uuid, bigint), " +
      "chat_quota.release(text, uuid) TO " + identifier(config.roleName));
    await client.query("RESET ROLE");

    stage = "privilege_verification";
    const permissions = await client.query(
      "SELECT " +
      "pg_catalog.has_database_privilege($1, $2, 'CONNECT') AS connect, " +
      "pg_catalog.has_database_privilege($1, $2, 'CREATE,TEMP') AS database_write, " +
      "pg_catalog.has_schema_privilege($1, 'chat_quota', 'USAGE') AS schema_usage, " +
      "pg_catalog.has_schema_privilege($1, 'chat_quota', 'CREATE') AS schema_create, " +
      "pg_catalog.has_function_privilege($1, 'chat_quota.reserve(text,text,text,text,bigint,uuid,bigint)', 'EXECUTE') AS reserve, " +
      "pg_catalog.has_function_privilege($1, 'chat_quota.release(text,uuid)', 'EXECUTE') AS release, " +
      "pg_catalog.to_regprocedure('chat_quota.reserve(text,text,text,text,bigint,uuid)') IS NULL AS legacy_reserve_absent, " +
      "(SELECT pg_catalog.count(*)::integer FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace " +
      "WHERE n.nspname = 'chat_quota' AND pg_catalog.has_function_privilege($1, p.oid, 'EXECUTE')) AS executable_functions, " +
      "EXISTS (SELECT 1 FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace " +
      "WHERE n.nspname = 'chat_quota' AND c.relkind IN ('r','p','v','m','S','f') " +
      "AND pg_catalog.has_table_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) AS table_access, " +
      "EXISTS (SELECT 1 FROM pg_catalog.pg_auth_members AS m JOIN pg_catalog.pg_roles AS r ON r.oid = m.member " +
      "WHERE r.rolname = $1) AS memberships",
      [config.roleName, databaseName],
    );
    const rights = permissions.rows[0];
    if (!rights || rights.connect !== true || rights.schema_usage !== true || rights.reserve !== true ||
        rights.release !== true || rights.database_write !== false || rights.schema_create !== false ||
        rights.table_access !== false || rights.memberships !== false || rights.legacy_reserve_absent !== true ||
        rights.executable_functions !== 2) throw new Error("runtime_privilege_verification_failed");
    stage = "commit";
    await client.query("COMMIT");
    transaction = false;

    const runtimeUrl = new URL(config.adminUrl.href);
    runtimeUrl.username = config.roleName;
    runtimeUrl.password = config.runtimePassword;
    // The source query was allowlisted above. Preserve verify-full and optional
    // channel binding rather than weakening a stricter supplied TLS setting.
    return {
      runtimeUrl: runtimeUrl.href,
      roleName: config.roleName,
      namespace: config.namespace,
      environment: config.environment,
      policyVersion: 1,
      moneyPolicyVersion: 1,
    };
  } catch (error) {
    const sqlState = error && typeof error === "object" &&
      typeof error.code === "string" && /^[A-Z0-9]{5}$/.test(error.code) ? error.code : undefined;
    if (transaction && client) {
      try { await client.query("ROLLBACK"); } catch { /* Never expose driver details. */ }
    }
    // A driver error can include the owner URL, SQL or password-bearing DDL.
    // No cause/error object escapes this boundary.
    const failure = new Error("chat_quota_provisioning_failed");
    failure.stage = stage;
    if (sqlState) failure.sqlState = sqlState;
    throw failure;
  } finally {
    if (client) {
      try { await client.end(); } catch { /* Never expose driver details. */ }
    }
  }
}

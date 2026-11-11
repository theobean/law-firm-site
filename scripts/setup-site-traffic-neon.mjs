import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { Client } from "@neondatabase/serverless";

const ownerRole = "site_traffic_owner";
const writerRole = "site_traffic_writer";
const readerRole = "site_traffic_reader";
const limitedRole = "NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT";
const migrationUrls = [
  new URL("../db/site-traffic.sql", import.meta.url),
  new URL("../db/migrations/20261111_06_site_traffic_bounce.sql", import.meta.url),
  new URL("../db/migrations/20261111_07_site_traffic_sources.sql", import.meta.url),
];

function identifier(value) {
  return '"' + value.replaceAll('"', '""') + '"';
}

function ownerConnection(adminUrl) {
  if (typeof adminUrl !== "string" || /\s|\p{Cc}/u.test(adminUrl)) {
    throw new Error("invalid_owner_connection");
  }
  try {
    const url = new URL(adminUrl);
    const host = url.hostname.split(".");
    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const database = decodeURIComponent(url.pathname.slice(1));
    const options = url.searchParams;
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname.endsWith(".neon.tech") ||
      host[0].endsWith("-pooler") ||
      host.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
      !/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(username) ||
      !/^[a-zA-Z_][a-zA-Z0-9_-]{0,62}$/.test(database) ||
      !password ||
      /\s|\p{Cc}/u.test(password) ||
      url.hash ||
      (url.port && url.port !== "5432") ||
      options.getAll("sslmode").length !== 1 ||
      !["require", "verify-full"].includes(options.get("sslmode")) ||
      options.getAll("channel_binding").length > 1 ||
      (options.has("channel_binding") && options.get("channel_binding") !== "require") ||
      [...options.keys()].some(key => !["sslmode", "channel_binding"].includes(key))
    ) {
      throw new Error("configuration");
    }
    return url;
  } catch {
    throw new Error("invalid_owner_connection");
  }
}

function runtimeConnection(admin, role, password) {
  const url = new URL(admin);
  url.username = role;
  url.password = password;
  return url.href;
}

/**
 * Installs only into a separate, empty Neon database. No connections on import.
 * Return values are credentials. Move them to the secret manager without logging.
 * When requested, the file is created exclusively just before commit so an
 * ambiguous commit cannot strand the newly generated passwords.
 */
export async function provisionTrafficDatabase({ adminUrl, dedicatedDatabase, credentialsFile }) {
  if (dedicatedDatabase !== true) throw new Error("dedicated_traffic_database_required");
  const admin = ownerConnection(adminUrl);
  const writerPassword = randomBytes(32).toString("base64url");
  const readerPassword = randomBytes(32).toString("base64url");
  const credentials = {
    TRAFFIC_WRITE_DATABASE_URL: runtimeConnection(admin, writerRole, writerPassword),
    TRAFFIC_READ_DATABASE_URL: runtimeConnection(admin, readerRole, readerPassword),
  };

  let stage = "load_schema";
  let client;
  let inTransaction = false;
  try {
    const migrations = await Promise.all(migrationUrls.map(url => readFile(url, "utf8")));
    stage = "connect";
    client = new Client({
      connectionString: admin.href,
      connectionTimeoutMillis: 10000,
      query_timeout: 20000,
      application_name: "site-traffic-provision",
    });
    client.on("error", () => {});
    await client.connect();

    stage = "preflight";
    await client.query("BEGIN");
    inTransaction = true;
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query("SELECT pg_catalog.pg_advisory_xact_lock(1717399, 2)");
    const preflight = await client.query(`
      SELECT CURRENT_USER AS admin_role,
             pg_catalog.current_database() AS database_name,
             EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = ANY($1::text[])) AS roles_exist,
             EXISTS (
               SELECT 1 FROM pg_catalog.pg_namespace
               WHERE nspname NOT IN ('public', 'information_schema')
                 AND pg_catalog.left(nspname, 3) <> 'pg_'
                 AND nspname <> 'neon'
               UNION ALL
               SELECT 1
               FROM pg_catalog.pg_class AS c
               JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
               WHERE pg_catalog.left(n.nspname, 3) <> 'pg_'
                 AND n.nspname <> 'information_schema'
                 AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
                 AND NOT EXISTS (
                   SELECT 1 FROM pg_catalog.pg_depend AS d
                   WHERE d.classid = 'pg_catalog.pg_class'::regclass
                     AND d.objid = c.oid AND d.deptype = 'e'
                 )
               UNION ALL
               SELECT 1
               FROM pg_catalog.pg_proc AS p
               JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
               WHERE pg_catalog.left(n.nspname, 3) <> 'pg_'
                 AND n.nspname <> 'information_schema'
                 AND NOT EXISTS (
                   SELECT 1 FROM pg_catalog.pg_depend AS d
                   WHERE d.classid = 'pg_catalog.pg_proc'::regclass
                     AND d.objid = p.oid AND d.deptype = 'e'
                 )
             ) AS objects_exist
    `, [[ownerRole, writerRole, readerRole]]);
    const database = preflight.rows[0];
    if (!database || database.roles_exist || database.objects_exist) {
      stage = "existing_database_objects_or_roles";
      throw new Error("configuration");
    }

    stage = "roles";
    await client.query(`CREATE ROLE ${ownerRole} NOLOGIN ${limitedRole}`);
    // Neon requires the generated base64url passwords on the TLS admin connection.
    await client.query(`CREATE ROLE ${writerRole} LOGIN PASSWORD '${writerPassword}' ${limitedRole}`);
    await client.query(`CREATE ROLE ${readerRole} LOGIN PASSWORD '${readerPassword}' ${limitedRole}`);
    await client.query(`GRANT ${ownerRole} TO ${identifier(database.admin_role)}`);
    const databaseName = identifier(database.database_name);
    await client.query(`REVOKE ALL ON DATABASE ${databaseName} FROM PUBLIC`);
    await client.query("REVOKE ALL ON SCHEMA public FROM PUBLIC");
    await client.query(`GRANT CONNECT ON DATABASE ${databaseName} TO ${writerRole}, ${readerRole}`);
    for (const role of [writerRole, readerRole]) {
      await client.query(`ALTER ROLE ${role} SET statement_timeout = '5s'`);
      await client.query(`ALTER ROLE ${role} SET lock_timeout = '2s'`);
    }

    stage = "schema";
    await client.query(`CREATE SCHEMA site_traffic AUTHORIZATION ${ownerRole}`);
    await client.query(`SET LOCAL ROLE ${ownerRole}`);
    for (const migration of migrations) await client.query(migration);

    if (credentialsFile) {
      stage = "write_credentials";
      await writeFile(
        credentialsFile,
        Object.entries(credentials).map(([name, value]) => `${name}=${value}\n`).join(""),
        { encoding: "utf8", flag: "wx", mode: 0o600 },
      );
    }
    stage = "commit";
    await client.query("COMMIT");
    inTransaction = false;
    return credentials;
  } catch (error) {
    if (inTransaction) await client.query("ROLLBACK").catch(() => {});
    throw new Error(`site_traffic_provision_failed:${stage}`, { cause: error });
  } finally {
    await client?.end().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [dedicated, credentialsFile] = process.argv.slice(2);
  if (dedicated !== "--dedicated-database" || !credentialsFile || process.argv.length !== 4) {
    console.error("Usage: node scripts/setup-site-traffic-neon.mjs --dedicated-database <new private .env file>");
    process.exitCode = 1;
  } else {
    try {
      await provisionTrafficDatabase({
        adminUrl: process.env.TRAFFIC_ADMIN_DATABASE_URL,
        dedicatedDatabase: true,
        credentialsFile,
      });
      console.log("Traffic schema provisioned. Move the runtime URLs to the secret manager.");
    } catch (error) {
      // Expose our stage only, never Postgres errors or URLs.
      const message = error instanceof Error && /^(?:invalid_owner_connection|site_traffic_provision_failed:[a-z_]+)$/.test(error.message)
        ? error.message
        : "site_traffic_provision_failed";
      console.error(message);
      process.exitCode = 1;
    }
  }
}

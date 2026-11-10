import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { CHAT_QUOTA_POLICY } from "../src/lib/chat/quota.mjs";

const readSql = async (path) => (await readFile(new URL(path, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const sql = await readSql("../db/chat-quotas.sql");
const install = await readSql("../db/migrations/20261110_01_quota_policy_v2_functions.sql");
const activate = await readSql("../db/migrations/20261110_02_preview_quota_policy_v2.sql");
const reserve = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION chat_quota.reserve("), sql.indexOf("CREATE OR REPLACE FUNCTION chat_quota.release("));
const release = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION chat_quota.release("), sql.indexOf("-- Backward-compatible release keeps"));

// The staged UI migration is a second delivery path for these exact functions.
// Prevent a fresh installation and an existing database from silently diverging.
test("the staged compatibility migration installs the canonical SQL functions", () => {
  assert.equal(install.split("  EXECUTE $reserve_ddl$\n")[1]?.split("$reserve_ddl$;")[0], reserve);
  assert.equal(install.split("  EXECUTE $release_ddl$\n")[1]?.split("$release_ddl$;")[0], release);
});

test("SQL policy 2 matches the client while policy 1 retains every legacy rate", () => {
  const [, current, legacy] = reserve.match(/  IF v_policy = 2 THEN\n([\s\S]*?)  ELSE\n([\s\S]*?)  END IF;/) ?? [];
  assert.ok(current && legacy);
  const fields = { v_rpm: "requestsPerMinute", v_tpm: "tokensPerMinute", v_rpd: "requestsPerDay", v_tpd: "tokensPerDay", v_concurrency: "concurrency" };
  for (const tier of ["anonymous", "authenticated"]) {
    for (const [block, version] of [[current, 2], [legacy, 1]]) {
      const scopes = [CHAT_QUOTA_POLICY.global, CHAT_QUOTA_POLICY[tier], CHAT_QUOTA_POLICY.network].map((value) => ({ ...value }));
      if (version === 1) {
        if (tier === "anonymous") Object.assign(scopes[1], { tokensPerMinute: 100000, tokensPerDay: 500000 });
        scopes[2].tokensPerMinute = 500000;
      }
      for (const [variable, field] of Object.entries(fields)) {
        const expression = block.match(new RegExp(variable + " := ARRAY\\[([^;]+)\\];"))?.[1];
        assert.ok(expression);
        const actual = expression.replace(/CASE WHEN p_tier = 'authenticated' THEN (\d+) ELSE (\d+) END/g,
          (_all, authenticated, anonymous) => tier === "authenticated" ? authenticated : anonymous)
          .replace(/::bigint/g, "").split(",").map(Number);
        assert.deepEqual(actual, scopes.map((scope) => scope[field]), `policy ${version}, ${tier}, ${field}`);
      }
    }
  }
});

function unchangedContract(definition) {
  return definition
    .replace(/  v_keys := ARRAY\[.*?  -- Fixed lock order:/s, "  -- Fixed lock order:")
    .replace(/IF NOT FOUND OR v_policy (?:IS DISTINCT FROM 1|IS NULL OR v_policy NOT IN \(1, 2\)) THEN/g, "IF policy_is_unsupported THEN")
    .replace(/\)\), (?:1|v_policy), 1;/g, ")), POLICY, 1;")
    .replace(/RETURN QUERY SELECT true, 0, (?:1|v_policy), 1;/g, "RETURN QUERY SELECT true, 0, POLICY, 1;")
    .replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
}

test("abuse policy selection leaves the existing monetary, settlement, ownership and counter contracts intact", () => {
  // Reviewed pre-policy-2 function fingerprints, excluding only policy arrays,
  // supported version guard and the abuse version returned to the client.
  const digest = (value) => createHash("sha256").update(unchangedContract(value)).digest("hex");
  assert.equal(digest(reserve), "86f7f6548f97041f27955073264e12a9868027f31a14e13464eec4d436d899e9");
  assert.equal(digest(release), "969e29a78f9ac3508bff0d26dca24421a5385914e6c7cdaecb666ff95511a464");
});

test("compatibility installation cannot activate namespaces, create missing functions or change runtime permissions", () => {
  const outer = install.replace(/  EXECUTE \$reserve_ddl\$[\s\S]*?\$reserve_ddl\$;/, "")
    .replace(/  EXECUTE \$release_ddl\$[\s\S]*?\$release_ddl\$;/, "").replace(/--[^\n]*/g, "");
  assert.doesNotMatch(outer, /^\s*(?:UPDATE|INSERT|DELETE|TRUNCATE|GRANT|REVOKE|CREATE ROLE|ALTER ROLE)\b/im);
  assert.match(outer, /p\.oid IS NULL OR p\.proowner IS DISTINCT FROM v_owner_oid/);
  assert.match(outer, /v_function_security_after IS DISTINCT FROM v_function_security_before/);
  assert.match(outer, /v_after IS DISTINCT FROM v_before/);
  assert.match(outer, /LOCK TABLE chat_quota\.namespaces IN ACCESS EXCLUSIVE MODE/);
  assert.match(outer, /CHECK \(policy_version IN \(1, 2\)\)/);
});

test("activation changes only the exact Preview namespace version and verifies compatibility and row preservation", () => {
  const outer = activate.replace(/--[^\n]*/g, "");
  const mutations = outer.match(/^\s*(?:UPDATE|INSERT|DELETE|TRUNCATE|GRANT|REVOKE|CREATE ROLE|ALTER ROLE)\b/gim);
  assert.equal(mutations?.length, 1);
  assert.match(outer, /UPDATE chat_quota\.namespaces AS n SET policy_version = 2\s+WHERE n\.namespace = 'law-firm-site-chat' AND n\.environment = 'preview' AND n\.policy_version = 1;/);
  assert.match(outer, /preview_quota_policy_compatibility_upgrade_required/);
  assert.match(outer, /b\.login_role = 'chat_quota_preview'/);
  assert.match(outer, /v_after IS DISTINCT FROM v_before/);
});

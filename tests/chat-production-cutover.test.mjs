import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = async (path) => (await readFile(new URL(path, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const freeze = await read("../db/migrations/20261110_04_freeze_preview_admission.sql");
const provision = await read("../db/migrations/20261110_05_provision_production.template.sql");
const activate = await read("../db/migrations/20261110_06_activate_production_carry_budget.sql");
const fixture = await read("../db/tests/production-cutover-rollback.sql");

test("rollback fixture executes the exact reviewed freeze, provisioning and activation SQL", () => {
  for (const [tag, stage] of [["freeze", freeze], ["provision", provision], ["activate", activate]]) {
    assert.equal(fixture.split(`$${tag}_stage$`)[1], stage);
  }
  assert.match(fixture, /fixture_existing_state_roles_or_functions_changed/);
  assert.match(fixture, /production_cutover_fixture_rollback_complete/);
});


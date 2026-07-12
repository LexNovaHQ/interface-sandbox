import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const registryRoot = path.join(backendRoot, "references", "registry");
const bindingPath = path.join(registryRoot, "THREAT_REGISTRY_BINDINGS_v1.yaml");

const bindingDoc = yaml.load(await readFile(bindingPath, "utf8"));
const manifest = bindingDoc?.registry_binding_manifest;
assert.equal(manifest?.schema_version, "THREAT_REGISTRY_BINDINGS_v1");
assert.equal(manifest?.status, "LOCKED");
assert.equal(manifest?.status_policy?.mode, "INCLUDE_ALL_DECLARED_ROWS");
assert.equal(manifest?.status_policy?.row_filter, "NONE");
assert.equal(manifest?.status_policy?.status_field_role, "METADATA_ONLY");

const requiredRowFields = Object.freeze([
  "Threat_ID",
  "Threat_Name",
  "Archetype",
  "Surface",
  "Status",
  "Hunter_Trigger",
  "FIELD21",
  "FIELD22",
  "FIELD23"
]);

const summaries = [];
for (const [packageId, binding] of Object.entries(manifest?.packages || {})) {
  assert.equal(binding.package_id, packageId, `${packageId}: package_id mismatch`);
  assert.ok(binding.package_key_file, `${packageId}: package key file missing`);
  assert.ok(binding.threat_registry_file, `${packageId}: threat registry file missing`);

  const keyDoc = yaml.load(await readFile(path.join(registryRoot, binding.package_key_file), "utf8"));
  assert.equal(keyDoc?.registry_key?.domain_package, packageId, `${packageId}: key domain_package mismatch`);
  assert.equal(String(keyDoc?.registry_key?.version || ""), String(binding.package_key_version || ""), `${packageId}: key version mismatch`);

  const registryDoc = yaml.load(await readFile(path.join(registryRoot, binding.threat_registry_file), "utf8"));
  assert.ok(Array.isArray(registryDoc), `${packageId}: registry root must be an array`);

  const ids = new Set();
  const statusCounts = {};
  for (const row of registryDoc) {
    assert.ok(row && typeof row === "object" && !Array.isArray(row), `${packageId}: registry row must be an object`);
    for (const field of requiredRowFields) assert.notEqual(String(row[field] ?? "").trim(), "", `${packageId}:${row.Threat_ID || "missing"}: missing ${field}`);
    const threatId = String(row.Threat_ID).trim();
    assert.equal(ids.has(threatId), false, `${packageId}: duplicate Threat_ID ${threatId}`);
    ids.add(threatId);
    const status = String(row.Status).trim();
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }

  assert.equal(registryDoc.length, Number(binding.declared_row_count), `${packageId}: declared/parsed registry count mismatch`);
  assert.equal(registryDoc.length, Number(binding.routable_row_count), `${packageId}: INCLUDE_ALL_DECLARED_ROWS requires routable count to equal parsed count`);
  assert.deepEqual(statusCounts, binding.declared_status_counts || {}, `${packageId}: declared/parsed Status counts mismatch`);

  summaries.push({
    package_id: packageId,
    key_file: binding.package_key_file,
    registry_file: binding.threat_registry_file,
    parsed_rows: registryDoc.length,
    routable_rows: registryDoc.length,
    status_counts: statusCounts
  });
}

assert.deepEqual(Object.keys(manifest.packages || {}).sort(), ["ai-governance", "fintech"]);
console.log(JSON.stringify({
  check: "phase10 registry parity and status-policy preflight",
  status: "PASS",
  status_policy: manifest.status_policy,
  registries: summaries
}, null, 2));

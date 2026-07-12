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
assert.equal(manifest?.authority_model?.package_keys?.role, "TAXONOMY_VOCABULARY_AUTHORITY");
assert.equal(manifest?.authority_model?.package_keys?.executable_registry_binding_forbidden, true);
assert.equal(manifest?.authority_model?.binding_manifest?.role, "SOLE_EXECUTABLE_THREAT_REGISTRY_BINDING_AUTHORITY");
assert.equal(manifest?.authority_model?.binding_manifest?.competing_binding_authority_forbidden, true);
assert.equal(manifest?.authority_model?.field_derivation_registry?.role, "DOMAIN_AGNOSTIC_DERIVATION_MECHANICS_AUTHORITY");
assert.equal(manifest?.status_policy?.mode, "INCLUDE_ALL_DECLARED_ROWS");
assert.equal(manifest?.status_policy?.row_filter, "NONE");
assert.equal(manifest?.status_policy?.status_field_role, "METADATA_ONLY");
assert.equal(manifest?.execution_identity_contract?.version, "PHASE10_EXECUTION_IDENTITY_v2");
assert.equal(manifest?.execution_identity_contract?.global_identity_field, "registry_row_key");
assert.equal(manifest?.execution_identity_contract?.canonical_threat_id_preserved, true);
assert.equal(manifest?.execution_identity_contract?.duplicate_registry_row_key_forbidden, true);
assert.equal(manifest?.execution_identity_contract?.silent_namespacing_forbidden, true);

const requiredRowFields = Object.freeze(["Threat_ID", "Threat_Name", "Archetype", "Surface", "Status", "Hunter_Trigger", "FIELD21", "FIELD22", "FIELD23"]);
const summaries = [];
const rawIdPackages = new Map();
const executionKeys = new Set();

for (const [packageId, binding] of Object.entries(manifest?.packages || {})) {
  assert.equal(binding.package_id, packageId, `${packageId}: package_id mismatch`);
  assert.ok(binding.package_key_file, `${packageId}: package key file missing`);
  assert.ok(binding.threat_registry_file, `${packageId}: threat registry file missing`);

  const keyDoc = yaml.load(await readFile(path.join(registryRoot, binding.package_key_file), "utf8"));
  assert.equal(keyDoc?.registry_key?.domain_package, packageId, `${packageId}: key domain_package mismatch`);
  assert.equal(String(keyDoc?.registry_key?.version || ""), String(binding.package_key_version || ""), `${packageId}: key version mismatch`);
  assert.equal(Object.prototype.hasOwnProperty.call(keyDoc?.registry_key || {}, "threat_registry_binding"), false, `${packageId}: executable binding must not pollute taxonomy key`);

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
    if (!rawIdPackages.has(threatId)) rawIdPackages.set(threatId, new Set());
    rawIdPackages.get(threatId).add(packageId);
    const registryRowKey = `${packageId}::${threatId}`;
    assert.equal(executionKeys.has(registryRowKey), false, `duplicate registry_row_key ${registryRowKey}`);
    executionKeys.add(registryRowKey);
    const status = String(row.Status).trim();
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }

  assert.equal(registryDoc.length, Number(binding.declared_row_count), `${packageId}: declared/parsed registry count mismatch`);
  assert.equal(registryDoc.length, Number(binding.routable_row_count), `${packageId}: INCLUDE_ALL_DECLARED_ROWS requires routable count to equal parsed count`);
  assert.deepEqual(statusCounts, binding.declared_status_counts || {}, `${packageId}: declared/parsed Status counts mismatch`);

  summaries.push({ package_id: packageId, key_file: binding.package_key_file, registry_file: binding.threat_registry_file, parsed_rows: registryDoc.length, routable_rows: registryDoc.length, status_counts: statusCounts });
}

const collisions = [...rawIdPackages.entries()]
  .filter(([, packages]) => packages.size > 1)
  .map(([Threat_ID, packages]) => ({ Threat_ID, package_ids: [...packages].sort(), registry_row_keys: [...packages].sort().map((packageId) => `${packageId}::${Threat_ID}`) }))
  .sort((a, b) => a.Threat_ID.localeCompare(b.Threat_ID));

assert.deepEqual(Object.keys(manifest.packages || {}).sort(), ["ai-governance", "fintech"]);
assert.equal(executionKeys.size, summaries.reduce((total, row) => total + row.parsed_rows, 0));
assert.ok(collisions.some((row) => row.Threat_ID === "UNI_PRV_001"), "known cross-package Threat_ID collision must remain visible");

console.log(JSON.stringify({
  check: "phase10 registry parity and status-policy preflight",
  status: "PASS",
  binding_authority: manifest.authority_model.binding_manifest.role,
  status_policy: manifest.status_policy,
  execution_identity_version: "PHASE10_EXECUTION_IDENTITY_v2",
  global_identity_field: "registry_row_key",
  canonical_threat_id_collision_count: collisions.length,
  canonical_threat_id_collisions: collisions,
  unique_registry_row_keys: executionKeys.size,
  registries: summaries
}, null, 2));

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildActiveThreatRegistryManifest, isCurrentActiveThreatRegistryManifest } from "../src/phases/10-exposure-profile/active-threat-registry-manifest.js";
import { AGENT_IDS, M11_STATIC_ARTIFACT_NAMES, assertCanWriteArtifact, assertInternalJobCanWriteArtifact } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { getCentralPhase } from "../src/runtime/contracts/central-phase.contract.js";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..");
const registryRoot = path.join(backendRoot, "references", "registry");
const agentRoot = path.join(backendRoot, "agent-packages", "agent_5_exposure_registry");

const referencePacket = {
  files: {
    "AI_THREAT_REGISTRY.yaml": { content: await readFile(path.join(registryRoot, "AI_THREAT_REGISTRY.yaml"), "utf8") },
    "AI_Registry_Key.yml": { content: await readFile(path.join(registryRoot, "AI_Registry_Key.yml"), "utf8") }
  }
};

const output = buildActiveThreatRegistryManifest({ runId: "CO-1-CHECK", referencePacket });
const manifest = output.active_threat_registry_manifest;
assert.ok(isCurrentActiveThreatRegistryManifest(manifest));
assert.equal(manifest.expected_row_count, 98);
assert.equal(manifest.registries.length, 1);
assert.equal(manifest.registries[0].package_id, "ai-governance");
assert.equal(manifest.registries[0].routable_row_count, 98);
assert.equal(manifest.registries[0].active_row_count, 73);
assert.equal(manifest.registries[0].upcoming_row_count, 14);
assert.equal(manifest.registries[0].pending_row_count, 8);
assert.equal(manifest.registries[0].watch_row_count, 2);
assert.equal(manifest.registries[0].pending_watch_row_count, 1);
assert.equal(manifest.status_policy.mode, "INCLUDE_ALL_DECLARED_ROWS");
assert.equal(manifest.status_policy.row_filter, "NONE");
assert.match(manifest.registry_set_fingerprint, /^[a-f0-9]{64}$/);

assert.equal(M11_STATIC_ARTIFACT_NAMES[0], "active_threat_registry_manifest");
assert.doesNotThrow(() => assertCanWriteArtifact(AGENT_IDS.exposureRegistry, "active_threat_registry_manifest"));
assert.doesNotThrow(() => assertInternalJobCanWriteArtifact("M11", "active_threat_registry_manifest"));

const phase10 = getCentralPhase("EXPOSURE_PROFILE");
assert.equal(phase10.terminal_outputs[0], "active_threat_registry_manifest");

const m11 = getPipelineContract("M11");
assert.equal(m11.writes[0], "active_threat_registry_manifest");

const binding = await readFile(path.join(agentRoot, "AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml"), "utf8");
const writeOrderIndex = binding.indexOf("write_artifacts_in_order:");
const manifestIndex = binding.indexOf("  - active_threat_registry_manifest", writeOrderIndex);
const routeIndex = binding.indexOf("  - exposure_registry_route_plan", writeOrderIndex);
assert.ok(writeOrderIndex >= 0 && manifestIndex > writeOrderIndex && routeIndex > manifestIndex, "Agent 5 must write manifest before route plan");
assert.ok(binding.includes("build_active_threat_registry_manifest"));
assert.ok(binding.includes("create_or_rewrite_active_threat_registry_manifest"));

console.log(JSON.stringify({
  check: "phase10 active threat registry manifest contract",
  status: "PASS",
  expected_row_count: manifest.expected_row_count,
  expected_uni_count: manifest.expected_uni_count,
  status_counts: manifest.registries[0].status_counts,
  registry_set_fingerprint: manifest.registry_set_fingerprint
}, null, 2));

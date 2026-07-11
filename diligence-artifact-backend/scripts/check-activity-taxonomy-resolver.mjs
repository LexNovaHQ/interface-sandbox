import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { resolveActivityTaxonomy } from "../src/runtime/domain-gate/activity-taxonomy.resolver.js";

const fintechWithAi = await resolveActivityTaxonomy({
  primaryPackageId: "fintech",
  capabilityOverlayIds: ["ai-native"]
});

assert.equal(fintechWithAi.primary?.package_id, "fintech");
assert.ok(fintechWithAi.primary?.archetype_vocabulary?.length > 0, "fintech archetype vocabulary missing");
assert.ok(fintechWithAi.primary?.surface_axes?.length > 0, "fintech surface axes missing");
assert.equal(fintechWithAi.overlays.length, 1);
assert.equal(fintechWithAi.overlays[0].overlay_id, "ai-native");
assert.equal(fintechWithAi.overlays[0].package_id, "ai-governance");
assert.ok(fintechWithAi.overlays[0].archetype_vocabulary.length > 0, "AI overlay archetype vocabulary missing");
assert.ok(fintechWithAi.evidence_roots.length > 0, "evidence root union missing");
assert.ok(fintechWithAi.evidence_roots.includes("lossless_root__product_service"));

// Registry self-declarations are authoritative once present. The resolver must
// mount the declared overlay and evidence root without compatibility limitations.
assert.equal(fintechWithAi.evidence_roots.includes("lossless_root__ai_safety_transparency"), true);
assert.equal(
  fintechWithAi.limitations.includes("OVERLAY_DECLARATION_DEFERRED_COMPATIBILITY_ACTIVE:ai-native"),
  false
);
assert.equal(
  fintechWithAi.limitations.includes("ACTIVITY_EVIDENCE_ROOT_DECLARATION_DEFERRED:ai-governance"),
  false
);

const unkeyed = await resolveActivityTaxonomy({ primaryPackageId: "saas" });
assert.equal(unkeyed.primary, null);
assert.deepEqual(unkeyed.overlays, []);
assert.ok(unkeyed.evidence_roots.includes("lossless_root__product_service"));
assert.ok(unkeyed.limitations.includes("PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:saas"));

const unresolvedOverlay = await resolveActivityTaxonomy({
  primaryPackageId: "fintech",
  capabilityOverlayIds: ["missing-overlay"]
});
assert.equal(unresolvedOverlay.overlays.length, 0);
assert.ok(unresolvedOverlay.limitations.includes("OVERLAY_HAS_NO_TAXONOMY_KEY:missing-overlay"));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolverSource = await readFile(
  path.resolve(__dirname, "../src/runtime/domain-gate/activity-taxonomy.resolver.js"),
  "utf8"
);
for (const forbidden of [
  "readArtifacts",
  "phase_routing_manifest",
  "phase_route_runtime_packet",
  "readRuntimeArtifact",
  "fetch("
]) {
  assert.equal(
    resolverSource.includes(forbidden),
    false,
    `resolver must not contain routing/artifact read capability: ${forbidden}`
  );
}
assert.equal(
  resolverSource.includes("lossless_root__ai_safety_transparency"),
  false,
  "resolver must not hardcode package evidence roots"
);

console.log("Activity taxonomy resolver: PASS (registry declarations active)");

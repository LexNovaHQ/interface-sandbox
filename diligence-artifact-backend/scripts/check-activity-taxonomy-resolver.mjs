import assert from "node:assert/strict";
import { ACTIVITY_TAXONOMY_RESOLVER_STATUS, resolveActivityTaxonomy } from "../src/runtime/domain-gate/activity-taxonomy.resolver.js";

assert.equal(ACTIVITY_TAXONOMY_RESOLVER_STATUS.compatibility_fallbacks_allowed, false);
assert.equal(ACTIVITY_TAXONOMY_RESOLVER_STATUS.domain_derivation_rules_overlay_fallback_allowed, false);
assert.equal(ACTIVITY_TAXONOMY_RESOLVER_STATUS.resolver_reads_runtime_artifacts, false);
assert.equal(ACTIVITY_TAXONOMY_RESOLVER_STATUS.resolver_expands_phase2g_reads, false);
assert.equal(ACTIVITY_TAXONOMY_RESOLVER_STATUS.behavior_class_source, "behavior_class");

const fintechAi = await resolveActivityTaxonomy({ primaryPackageId: "fintech", capabilityOverlayIds: ["ai-native"] });
assert.equal(fintechAi.primary?.package_id, "fintech");
assert.ok(Array.isArray(fintechAi.primary.behavior_class_vocabulary));
assert.ok(fintechAi.primary.behavior_class_vocabulary.length > 0);
assert.equal("archetype_vocabulary" in fintechAi.primary, false);
assert.equal(fintechAi.overlays.length, 1);
assert.equal(fintechAi.overlays[0].overlay_id, "ai-native");
assert.equal(fintechAi.overlays[0].package_id, "ai-governance");
assert.ok(fintechAi.overlays[0].behavior_class_vocabulary.length > 0);
assert.equal("archetype_vocabulary" in fintechAi.overlays[0], false);
assert.ok(fintechAi.evidence_roots.includes("lossless_root__product_service"));
assert.ok(fintechAi.evidence_roots.includes("lossless_root__ai_safety_transparency"));

const saas = await resolveActivityTaxonomy({ primaryPackageId: "saas" });
assert.equal(saas.primary, null);
assert.ok(saas.limitations.includes("PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:saas"));
assert.ok(saas.evidence_roots.includes("lossless_root__product_service"));

const unresolvedOverlay = await resolveActivityTaxonomy({ primaryPackageId: "fintech", capabilityOverlayIds: ["nonexistent-overlay"] });
assert.equal(unresolvedOverlay.primary?.package_id, "fintech");
assert.equal(unresolvedOverlay.overlays.length, 0);
assert.ok(unresolvedOverlay.limitations.includes("OVERLAY_HAS_NO_TAXONOMY_KEY:nonexistent-overlay"));

console.log("Activity taxonomy resolver Behavior Class canonical: PASS");

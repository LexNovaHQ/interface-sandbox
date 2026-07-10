import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const bindingPath = path.join(root, "agent-packages", "agent_3_target_feature", "AGENT3_RUNTIME_BINDING_PACKET.yaml");
const addendumPath = path.join(root, "agent-packages", "agent_3_target_feature", "03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md");
const binding = await readFile(bindingPath, "utf8");
const addendum = await readFile(addendumPath, "utf8");

const requiredMarkers = Object.freeze([
  "runtime_contract_version: v15_phase5_package_aware_activity_profile_sync",
  "Phase 2C Activity Profile Source Index is the active locator authority for Phase 5 Activity Profile Review.",
  "activity_profile_source_index",
  "feature_candidate_inventory",
  "active_run_package_manifest",
  "package_context_authority: active_run_package_manifest",
  "package_catalog_authority: references/domain-packages/package-catalog.v0.json",
  "fixed_ai_registry_key_universal_authority_forbidden: true",
  "fixed_ai_archetype_enum_forbidden: true",
  "fixed_ai_surface_enum_forbidden: true",
  "package_label_array_fields:",
  "archetype_codes",
  "surface_context_tokens",
  "Activity Profile Review must not treat AI archetypes or AI surface tokens as universal enums."
]);

for (const marker of requiredMarkers) assert.ok(binding.includes(marker), `AGENT3_RUNTIME_BINDING_PACKET.yaml missing marker: ${marker}`);

for (const forbidden of [
  "archetype_derivation_authority: AI_REGISTRY_KEY.md §4",
  "surface_derivation_authority: AI_REGISTRY_KEY.md §7",
  "allowed_archetype_codes:",
  "allowed_surface_context_tokens:",
  "AGENT3_BINDING_AI_REGISTRY_KEY_DIRECT_AUTHORITY"
]) assert.equal(binding.includes(forbidden), false, `binding still contains fixed AI taxonomy marker: ${forbidden}`);

for (const marker of [
  "Phase 5 is now package-aware",
  "M8_FEATURE_CANDIDATE_INVENTORY = deterministic candidate universe from 2C only",
  "archetype_codes and surface_context_tokens are no longer hardcoded AI enum fields",
  "fixed universal AI archetype enum",
  "fixed universal AI surface enum"
]) assert.ok(addendum.includes(marker), `03B package-aware addendum missing marker: ${marker}`);

console.log(JSON.stringify({
  check: "activity-profile package-aware binding packet",
  status: "PASS",
  enforced_gates: [
    "AGENT3_BINDING_PHASE2C_ACTIVITY_SOURCE_INDEX_AUTHORITY",
    "AGENT3_BINDING_ACTIVE_PACKAGE_CONTEXT_REQUIRED",
    "AGENT3_BINDING_FIXED_AI_ENUMS_NOT_UNIVERSAL",
    "AGENT3_BINDING_PHASE5_PACKAGE_AWARE_ADDENDUM_PRESENT"
  ]
}, null, 2));

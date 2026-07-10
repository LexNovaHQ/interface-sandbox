import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildPhasePrompt } from "../src/prompt-loader.js";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { compileDomainDerivationArtifacts } from "../src/phases/03-domain-derivation/validators/domain-derivation.validator.js";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const m7 = PIPELINE_CONTRACTS.M7_TARGET_PROFILE;
const p2b = PIPELINE_CONTRACTS.P2B_DOMAIN_DERIVATION_SOURCE_INDEX;
const p3b = PIPELINE_CONTRACTS.P3_DOMAIN_DERIVATION_LAYER;
assert.ok(m7, "M7_TARGET_PROFILE pipeline contract missing");
assert.ok(p2b, "P2B_DOMAIN_DERIVATION_SOURCE_INDEX pipeline contract missing");
assert.ok(p3b, "P3_DOMAIN_DERIVATION_LAYER pipeline contract missing");
assert.equal(PIPELINE_CONTRACTS.P2A_TARGET_PROFILE_SOURCE_INDEX.next, "P2B_DOMAIN_DERIVATION_SOURCE_INDEX");
assert.equal(p2b.next, "P2C_ACTIVITY_PROFILE_SOURCE_INDEX");
assert.equal(PIPELINE_CONTRACTS.P2E_DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX.next, "P2G_PHASE_ROUTER");
assert.equal(PIPELINE_CONTRACTS.P2G_PHASE_ROUTER.next, "P2_INDEX_COMPILER_VALIDATION");
assert.ok(m7.reads.includes("phase_routing_manifest"), "3A pipeline reads must include 2G route manifest during compatibility cutover");
for (const readName of TARGET_PROFILE_REVIEW_CONTRACT.material_job.reads) assert.ok(m7.reads.includes(readName), `3A pipeline missing phase-owned read ${readName}`);
assert.ok(p3b.reads.includes("phase_routing_manifest"), "3B pipeline reads must include 2G route manifest during compatibility cutover");
for (const readName of DOMAIN_DERIVATION_CONTRACT.reads) assert.ok(p3b.reads.includes(readName), `3B pipeline missing phase-owned read ${readName}`);
assert.deepEqual(p3b.writes, DOMAIN_DERIVATION_CONTRACT.writes, "3B pipeline and phase-owned writes must match");
assert.ok(p3b.reads.includes("domain_derivation_source_index"), "3B must read P2B domain_derivation_source_index");
assert.equal(p3b.reads.includes("activity_profile_source_index"), false, "3B must not read activity_profile_source_index");
assert.ok(DOMAIN_DERIVATION_CONTRACT.output_contract.required_top_level_branches.includes("regulatory_overlay_derivation"), "3B output contract must include regulatory_overlay_derivation");
assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.regulatory_overlay_candidate_only, true);
assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.regulatory_overlay_compliance_conclusion_forbidden, true);

const run = { run_id: "CHECK_PHASE3_SYNC_V0", target: "example.com", target_url: "https://example.com", root_url: "https://example.com", source_mode: "public_url" };
const artifacts = Object.fromEntries(DOMAIN_DERIVATION_CONTRACT.reads.map((name) => [name, artifactFor(name)]));
const prompt = await buildPhasePrompt({
  prompt_files: DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_files,
  phase: DOMAIN_DERIVATION_CONTRACT.internal_job_id,
  run,
  artifacts,
  writes: DOMAIN_DERIVATION_CONTRACT.writes,
  references: DOMAIN_DERIVATION_CONTRACT.references
});

for (const required of [
  "<REFERENCE_PACKET>",
  "DOMAIN_PACKAGE_KEY_v0.md",
  "package-catalog.v0.json",
  "DOMAIN_DERIVATION_REGISTRY_v0.yaml",
  "DOMAIN_DERIVATION_REGISTRY_v0",
  "PRIMARY_DOMAIN_AI_GOVERNANCE",
  "PRIMARY_DOMAIN_FINTECH",
  "AI_OVERLAY_MOUNTED",
  "trigger_if",
  "exclude_if",
  "domain_derivation_source_index",
  "activity_profile_source_index is reserved",
  "regulatory_overlay_derivation",
  "catalog-gated regulatory overlay candidates",
  "<RUNTIME_PACKET>"
]) {
  assert.ok(prompt.includes(required), `3B prompt build missing registry/package/runtime content: ${required}`);
}
assert.equal(prompt.includes("- `activity_profile_source_index`\n- `target_profile`"), false, "3B active input list must not include activity_profile_source_index");

const compiled = await compileDomainDerivationArtifacts({
  run,
  artifacts,
  modelOutput: {
    domain_derivation_profile: {
      primary_domain_derivation: { evaluated_rules: [] },
      ai_mount_derivation: { evaluated_rules: [] },
      regulatory_overlay_derivation: { candidates: [] },
      fusion_candidate_derivation: { candidates: [] },
      limitation_ledger: [],
      contradiction_ledger: []
    }
  }
});

assert.ok(compiled.output.domain_derivation_profile, "3B compiler must emit domain_derivation_profile");
assert.ok(compiled.output.domain_derivation_profile.regulatory_overlay_derivation, "3B compiler must emit regulatory_overlay_derivation branch");
assert.ok(compiled.output.active_run_package_manifest, "3B compiler must emit active_run_package_manifest");
assert.equal(compiled.output.active_run_package_manifest.selection_stage, "PHASE_3B_DOMAIN_DERIVATION");
assert.equal(compiled.output.active_run_package_manifest.domain_derivation_profile_ref, "domain_derivation_profile");
assert.ok(Object.prototype.hasOwnProperty.call(compiled.output.active_run_package_manifest, "regulatory_overlays"), "manifest must include regulatory_overlays");
assert.ok(Object.prototype.hasOwnProperty.call(compiled.output.active_run_package_manifest, "regulatory_overlay_status"), "manifest must include regulatory_overlay_status");
assert.ok(Object.prototype.hasOwnProperty.call(compiled.output.active_run_package_manifest, "updated_at"), "canonical manifest helper must add updated_at");
assert.ok(Object.prototype.hasOwnProperty.call(compiled.output.active_run_package_manifest, "validation"), "canonical manifest helper must add validation block");
assert.equal(compiled.output.active_run_package_manifest.runtime_flags.dynamic_routing_enabled, false);
assert.equal(compiled.output.active_run_package_manifest.runtime_flags.field_registry_compile_enabled, false);

const validator = read("src/phases/03-domain-derivation/validators/domain-derivation.validator.js");
assert.ok(validator.includes("buildPhase3BDomainDerivationManifestUpdate"), "3B runtime validator must call canonical manifest helper");
assert.ok(validator.includes("domain_derivation_source_index"), "3B validator must require P2B source index");
assert.ok(validator.includes("regulatory_overlay_derivation"), "3B validator must normalize regulatory overlay branch");
assert.equal(validator.includes("function compileActiveRunPackageManifest({ run, artifacts, profile, validation }) {\n  const before"), false, "inline manifest brain must not be present");

console.log(JSON.stringify({ check: "phase3 sync v0", status: "PASS", enforced: ["3A_PIPELINE_READ_SYNC_WITH_P2G_COMPAT", "P2B_DOMAIN_DERIVATION_SOURCE_INDEX_RUNTIME_WIRED", "P2G_ROUTE_MANIFEST_COMPAT_READ", "3B_PIPELINE_READ_WRITE_SYNC", "3B_PROMPT_REFERENCE_BUILD", "3B_REGISTRY_VISIBLE_TO_MODEL", "3B_REGULATORY_OVERLAY_CANDIDATE_BRANCH", "3B_CANONICAL_MANIFEST_COMPILER", "RUNTIME_FLAGS_REMAIN_FALSE"] }, null, 2));

function artifactFor(name) {
  if (name.startsWith("lossless_root__")) {
    return {
      artifact_name: name,
      common_root: name.replace(/^lossless_root__/, ""),
      sources: [],
      storage_mode: "UNSAVED_EMPTY"
    };
  }
  if (name === "active_run_package_manifest") {
    return {
      artifact_name: name,
      selection_stage: "PRE_PHASE_1_DOMAIN_PREFLIGHT",
      runtime_flags: {},
      package_catalog: {
        available_regulatory_overlays: ["privacy", "gdpr", "india-dpdp", "india-it-act", "eu-ai-act", "us-state-privacy", "hipaa", "financial-services", "employment", "consumer-protection"]
      }
    };
  }
  return { artifact_name: name, status: "LOCKED" };
}

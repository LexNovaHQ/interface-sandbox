import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildPhasePrompt } from "../src/prompt-loader.js";
import { PIPELINE_CONTRACTS } from "../src/runtime/contracts/pipeline.contract.js";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { compileDomainDerivationArtifacts } from "../src/phases/03-domain-derivation/validators/domain-derivation.validator.js";
import { buildPhaseRoutingManifest } from "../src/phases/02-cartography-index/services/phase-routing-manifest.builder.js";
import { buildPhaseRouteRuntimeReadPlan } from "../src/phases/02-cartography-index/services/phase-route-runtime.reader.js";

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
assert.ok(m7.reads.includes("phase_routing_manifest"), "3A central runtime wrapper must receive the 2G manifest");
assert.ok(p3b.reads.includes("phase_routing_manifest"), "3B central runtime wrapper must receive the 2G manifest");
assert.deepEqual(p3b.writes, DOMAIN_DERIVATION_CONTRACT.writes, "3B pipeline and phase-owned writes must match");
assert.equal(TARGET_PROFILE_REVIEW_CONTRACT.route_contract.route_id, "ROUTE.PHASE3A.TARGET_PROFILE");
assert.equal(DOMAIN_DERIVATION_CONTRACT.route_contract.route_id, "ROUTE.PHASE3B.DOMAIN_DERIVATION");
assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.regulatory_overlay_candidate_only, true);
assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.regulatory_overlay_compliance_conclusion_forbidden, true);
assert.equal(DOMAIN_DERIVATION_CONTRACT.boundary_rules.profile_forensics_inputs_forbidden, true);

const routingManifest = buildPhaseRoutingManifest({ runId: "CHECK_PHASE3_SYNC_V0", artifacts: presentPhase2Artifacts() }).phase_routing_manifest;
const plan = buildPhaseRouteRuntimeReadPlan({ internalJobId: "P3_DOMAIN_DERIVATION_LAYER", phaseRoutingManifest: routingManifest });
assert.equal(plan.route_id, DOMAIN_DERIVATION_CONTRACT.route_contract.route_id);
assert.deepEqual(new Set(DOMAIN_DERIVATION_CONTRACT.reads), new Set(["phase_routing_manifest", "phase_route_runtime_packet", ...plan.artifact_reads]));
assert.equal(plan.artifact_reads.some((name) => name.includes("forensics")), false);

const run = { run_id: "CHECK_PHASE3_SYNC_V0", target: "example.com", target_url: "https://example.com", root_url: "https://example.com", source_mode: "public_url" };
const artifacts = Object.fromEntries(DOMAIN_DERIVATION_CONTRACT.reads.map((name) => [name, artifactFor(name, { routingManifest, plan })]));
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
  "`activity_profile_source_index` is reserved",
  "regulatory_overlay_derivation",
  "catalog-gated regulatory overlay candidates",
  "<RUNTIME_PACKET>",
  "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  "ROUTE.PHASE3B.DOMAIN_DERIVATION"
]) assert.ok(prompt.includes(required), `3B prompt build missing registry/package/runtime content: ${required}`);

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
assert.equal(compiled.output.domain_derivation_profile.input_scope.routing_authority, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
assert.equal(compiled.output.domain_derivation_profile.input_scope.phase_2g_route_id, "ROUTE.PHASE3B.DOMAIN_DERIVATION");
assert.ok(compiled.output.active_run_package_manifest, "3B compiler must emit active_run_package_manifest");
assert.equal(compiled.output.active_run_package_manifest.selection_stage, "PHASE_3B_DOMAIN_DERIVATION");
assert.equal(compiled.output.active_run_package_manifest.domain_derivation_profile_ref, "domain_derivation_profile");
assert.ok(Object.prototype.hasOwnProperty.call(compiled.output.active_run_package_manifest, "regulatory_overlays"), "manifest must include regulatory_overlays");
assert.equal(compiled.output.active_run_package_manifest.runtime_flags.dynamic_routing_enabled, false);
assert.equal(compiled.output.active_run_package_manifest.runtime_flags.field_registry_compile_enabled, false);

const validator = read("src/phases/03-domain-derivation/validators/domain-derivation.validator.js");
assert.ok(validator.includes("buildPhase3BDomainDerivationManifestUpdate"), "3B runtime validator must call canonical manifest helper");
assert.ok(validator.includes("P3_DOMAIN_DERIVATION_PHASE2G_ROUTING_AUTHORITY_MISSING"), "3B validator must enforce 2G authority");
assert.ok(validator.includes("profile_forensics_inputs_allowed"), "3B validator must reject forensic input packets");
assert.equal(validator.includes("function compileActiveRunPackageManifest({ run, artifacts, profile, validation }) {\n  const before"), false, "inline manifest brain must not be present");

console.log(JSON.stringify({ check: "phase3 sync v0", status: "PASS", enforced: ["3A_PHASE2G_ROUTE_DECLARED", "3B_PHASE2G_ROUTE_PLAN", "P2B_DOMAIN_DERIVATION_SOURCE_INDEX_RUNTIME_WIRED", "NO_FORENSICS_INPUT", "3B_PROMPT_REFERENCE_BUILD", "3B_REGISTRY_VISIBLE_TO_MODEL", "3B_REGULATORY_OVERLAY_CANDIDATE_BRANCH", "3B_CANONICAL_MANIFEST_COMPILER", "RUNTIME_FLAGS_REMAIN_FALSE"] }, null, 2));

function presentPhase2Artifacts() {
  return {
    target_profile_source_index: {},
    domain_derivation_source_index: {},
    activity_profile_source_index: {},
    data_privacy_navigation_index: {},
    domain_control_obligation_navigation_index: {},
    legal_cartography_index: {},
    legal_signal_derivation_profile: {}
  };
}

function artifactFor(name, { routingManifest, plan }) {
  if (name === "phase_routing_manifest") return routingManifest;
  if (name === "phase_route_runtime_packet") {
    return {
      artifact_type: "phase_route_runtime_packet",
      routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
      internal_job_id: "P3_DOMAIN_DERIVATION_LAYER",
      route_id: plan.route_id,
      bucket_id: plan.bucket_id,
      lossless_evidence_role: "PRIMARY_EVIDENCE",
      index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
      profile_forensics_inputs_allowed: false
    };
  }
  if (name.startsWith("lossless_root__")) return { artifact_name: name, common_root: name.replace(/^lossless_root__/, ""), sources: [], storage_mode: "UNSAVED_EMPTY" };
  if (name === "active_run_package_manifest") {
    return {
      artifact_name: name,
      selection_stage: "PRE_PHASE_1_DOMAIN_PREFLIGHT",
      runtime_flags: {},
      package_catalog: { available_regulatory_overlays: ["privacy", "gdpr", "india-dpdp", "india-it-act", "eu-ai-act", "us-state-privacy", "hipaa", "financial-services", "employment", "consumer-protection"] }
    };
  }
  return { artifact_name: name, status: "LOCKED" };
}

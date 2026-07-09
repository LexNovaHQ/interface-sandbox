import {
  buildAllFalseRuntimeFlags,
  DOMAIN_GATE_SELECTION_MODE,
  PASSIVE_MANIFEST_ADAPTER_MODE,
  PRE_PHASE_1_SELECTION_STAGE,
  REVIEW_OVERLAY_DEFAULT
} from "./domain-package-key.js";

export const ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME = "active_run_package_manifest";
export const PHASE_3B_DOMAIN_DERIVATION_SELECTION_STAGE = "PHASE_3B_DOMAIN_DERIVATION";

export function buildActiveRunPackageManifestV0({ run = {}, catalog, now = new Date().toISOString() } = {}) {
  return {
    artifact_name: ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME,
    version: "0.1",
    selection_mode: DOMAIN_GATE_SELECTION_MODE,
    selection_stage: PRE_PHASE_1_SELECTION_STAGE,
    run_id: run.run_id || null,
    created_at: now,
    updated_at: now,
    primary_domain_package: null,
    primary_domain_status: "PROVISIONAL",
    primary_domain_rule_id: null,
    primary_domain_evidence_basis: [],
    capability_overlays: [],
    capability_overlay_status: "PROVISIONAL",
    capability_overlay_rule_ids: [],
    ai_package_mount: "PROVISIONAL",
    ai_mount_rule_id: null,
    ai_mount_evidence_basis: [],
    ai_package_mount_only: false,
    ai_activity_lock_status: "NOT_EVALUATED",
    ai_exposure_lock_status: "NOT_EVALUATED",
    regulatory_overlays: [],
    regulatory_overlay_status: "PROVISIONAL",
    fusion_bucket_candidates: [],
    derivation_limitations: [],
    contradiction_ledger: [],
    domain_derivation_profile_ref: null,
    review_overlay: { ...REVIEW_OVERLAY_DEFAULT },
    package_catalog: {
      catalog_loaded: Boolean(catalog),
      catalog_status: catalog ? "PASS" : "FAIL",
      available_primary_domain_packages: catalog?.primary_domain_packages || [],
      available_capability_overlays: catalog?.capability_overlays || [],
      available_regulatory_overlays: catalog?.regulatory_overlays || [],
      available_review_overlays: catalog?.review_overlays || []
    },
    adapter_mode: PASSIVE_MANIFEST_ADAPTER_MODE,
    runtime_flags: buildAllFalseRuntimeFlags(),
    validation: {
      status: catalog ? "PASS" : "FAIL",
      errors: catalog ? [] : ["package catalog failed to load"],
      warnings: []
    }
  };
}

export function buildPhase3BDomainDerivationManifestUpdate({ run = {}, before = {}, domain_derivation_profile = {}, validation = {}, now = new Date().toISOString() } = {}) {
  const primary = domain_derivation_profile.primary_domain_derivation || {};
  const ai = domain_derivation_profile.ai_mount_derivation || {};
  const fusion = domain_derivation_profile.fusion_candidate_derivation || {};
  const runtimeFlags = forceAllRuntimeFlagsFalse(before.runtime_flags || {});
  const aiOverlayMounted = ai.ai_package_mount === "AI_OVERLAY_MOUNTED";
  const after = {
    ...before,
    artifact_name: ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME,
    version: before.version || "0.1",
    selection_mode: before.selection_mode || DOMAIN_GATE_SELECTION_MODE,
    selection_stage: PHASE_3B_DOMAIN_DERIVATION_SELECTION_STAGE,
    run_id: before.run_id || run.run_id || null,
    updated_at: now,
    primary_domain_package: primary.selected_package || null,
    primary_domain_status: primary.status || "REVIEW_REQUIRED",
    primary_domain_rule_id: primary.selected_rule_id || null,
    primary_domain_evidence_basis: evidenceBasis(primary.evaluated_rules),
    capability_overlays: aiOverlayMounted ? [ai.overlay_package_id || "ai-native"].filter(Boolean) : [],
    capability_overlay_status: ai.status || "NOT_VISIBLE",
    capability_overlay_rule_ids: ai.selected_rule_id ? [ai.selected_rule_id] : [],
    ai_package_mount: ai.ai_package_mount || "AI_NOT_VISIBLE",
    ai_mount_rule_id: ai.selected_rule_id || null,
    ai_mount_evidence_basis: evidenceBasis(ai.evaluated_rules),
    ai_package_mount_only: aiOverlayMounted,
    ai_activity_lock_status: aiOverlayMounted ? "DEFERRED_TO_PHASE_5" : (ai.activity_lock_status || "NOT_EVALUATED"),
    ai_exposure_lock_status: aiOverlayMounted ? "DEFERRED_TO_PHASE_9" : (ai.exposure_lock_status || "NOT_EVALUATED"),
    fusion_bucket_candidates: Array.isArray(fusion.candidates) ? fusion.candidates : [],
    derivation_limitations: Array.isArray(domain_derivation_profile.limitation_ledger) ? domain_derivation_profile.limitation_ledger : [],
    contradiction_ledger: Array.isArray(domain_derivation_profile.contradiction_ledger) ? domain_derivation_profile.contradiction_ledger : [],
    domain_derivation_profile_ref: "domain_derivation_profile",
    runtime_flags: runtimeFlags,
    validation: {
      status: validation.status === "CONTROLLED_FAILURE" ? "WARN" : "PASS",
      errors: validation.failures || [],
      warnings: validation.warnings || []
    }
  };
  return {
    active_run_package_manifest: after,
    manifest_update: {
      before_selection_stage: before.selection_stage || PRE_PHASE_1_SELECTION_STAGE,
      after_selection_stage: after.selection_stage,
      changed_fields: [
        "selection_stage",
        "primary_domain_package",
        "primary_domain_status",
        "primary_domain_rule_id",
        "capability_overlays",
        "capability_overlay_status",
        "ai_package_mount",
        "ai_mount_rule_id",
        "ai_package_mount_only",
        "ai_activity_lock_status",
        "ai_exposure_lock_status",
        "fusion_bucket_candidates",
        "domain_derivation_profile_ref"
      ],
      unchanged_runtime_flags: runtimeFlags,
      dynamic_routing_still_disabled: true
    }
  };
}

export function forceAllRuntimeFlagsFalse(existing = {}) {
  return { ...buildAllFalseRuntimeFlags(), ...Object.fromEntries(Object.keys(existing || {}).map((key) => [key, false])) };
}

function evidenceBasis(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.validator_trigger_result === true)
    .flatMap((row) => (row.evidence_anchors || []).map((anchor) => ({ rule_id: row.rule_id, source_artifact_name: anchor.source_artifact_name || anchor.artifact_name || anchor })))
    .filter((row) => row.source_artifact_name);
}

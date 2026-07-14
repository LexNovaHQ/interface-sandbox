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
    lifecycle_schema_version: "DOMAIN_PACKAGE_LIFECYCLE_v1",
    selection_mode: DOMAIN_GATE_SELECTION_MODE,
    selection_stage: PRE_PHASE_1_SELECTION_STAGE,
    run_id: run.run_id || null,
    created_at: now,
    updated_at: now,
    derived_primary_domain: null,
    primary_domain_package: null,
    primary_domain_status: "PROVISIONAL",
    primary_domain_rule_id: null,
    primary_domain_lifecycle: null,
    primary_domain_delivery_mode: null,
    primary_domain_package_mount_eligible: false,
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
    regulatory_overlay_evidence_basis: [],
    fusion_bucket_candidates: [],
    post_review_delivery_mode: "NOT_EVALUATED",
    post_review_enabled: false,
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
    activation_flags: {
      pre_phase1_domain_lock_enabled: false,
      phase3b_model_derivation_enabled: true,
      phase3b_deterministic_support_validation_enabled: true,
      downstream_package_mounting_enabled: false,
      ai_overlay_continuation_without_primary_enabled: true,
      p2g_source_routing_authority_enabled: true
    },
    validation: {
      status: catalog ? "PASS" : "FAIL",
      errors: catalog ? [] : ["package catalog failed to load"],
      reinvestigation_items: [],
      limitations: [],
      warnings: []
    }
  };
}

export function buildPhase3BDomainDerivationManifestUpdate({
  run = {},
  before = {},
  domain_derivation_profile = {},
  validation = {},
  now = new Date().toISOString()
} = {}) {
  const primary = domain_derivation_profile.primary_domain_derivation || {};
  const ai = domain_derivation_profile.ai_mount_derivation || {};
  const regulatory = domain_derivation_profile.regulatory_overlay_derivation || {};
  const fusion = domain_derivation_profile.fusion_candidate_derivation || {};
  const runtimeFlags = forceAllRuntimeFlagsFalse(before.runtime_flags || {});
  const validationAllowsContinuation = ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(validation.status);
  const derivedPrimaryDomain = validationAllowsContinuation ? primary.selected_package || null : null;
  const primaryPackageMounted = Boolean(
    validationAllowsContinuation
    && primary.selected_package
    && primary.package_mount_eligible === true
    && ["LOCKED", "LOCKED_WITH_LIMITATIONS"].includes(primary.status)
  );
  const aiOverlayMounted = Boolean(
    validationAllowsContinuation
    && ai.ai_package_mount === "AI_OVERLAY_MOUNTED"
    && ai.package_mount_eligible === true
    && validation.ai_overlay_semantically_usable === true
  );
  const aiPrimaryMounted = Boolean(primaryPackageMounted && primary.selected_package === "ai-governance");
  const regulatoryCandidates = validationAllowsContinuation && Array.isArray(regulatory.candidates) ? regulatory.candidates : [];
  const postReviewDeliveryMode = resolvePostReviewDeliveryMode({ primary, primaryPackageMounted, aiOverlayMounted });
  const postReviewEnabled = ["FULL_REVIEW_READY", "AI_OVERLAY_FULL_REVIEW_READY"].includes(postReviewDeliveryMode);

  const after = {
    ...before,
    artifact_name: ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME,
    version: before.version || "0.2.model-led-lifecycle-gated",
    lifecycle_schema_version: before.lifecycle_schema_version || "DOMAIN_PACKAGE_LIFECYCLE_v1",
    selection_mode: before.selection_mode || DOMAIN_GATE_SELECTION_MODE,
    selection_stage: PHASE_3B_DOMAIN_DERIVATION_SELECTION_STAGE,
    run_id: before.run_id || run.run_id || null,
    updated_at: now,
    derived_primary_domain: derivedPrimaryDomain,
    primary_domain_package: primaryPackageMounted ? primary.selected_package : null,
    primary_domain_status: validationAllowsContinuation ? primary.status || "LOCKED_WITH_LIMITATIONS" : "REVIEW_REQUIRED",
    primary_domain_rule_id: validationAllowsContinuation ? primary.selected_rule_id || null : null,
    primary_domain_lifecycle: validationAllowsContinuation ? primary.package_lifecycle_state || null : null,
    primary_domain_delivery_mode: validationAllowsContinuation ? primary.downstream_delivery_mode || null : null,
    primary_domain_package_mount_eligible: primaryPackageMounted,
    primary_domain_evidence_basis: validationAllowsContinuation ? evidenceBasis(primary.evaluated_rules, primary.evidence_anchors, primary.selected_rule_id) : [],
    capability_overlays: aiOverlayMounted ? [ai.overlay_package_id || "ai-native"].filter(Boolean) : [],
    capability_overlay_status: validationAllowsContinuation ? ai.status || "NOT_VISIBLE" : "NOT_VISIBLE",
    capability_overlay_rule_ids: aiOverlayMounted && ai.selected_rule_id ? [ai.selected_rule_id] : [],
    ai_package_mount: validationAllowsContinuation ? (aiPrimaryMounted ? "AI_PRIMARY" : ai.ai_package_mount || "AI_NOT_VISIBLE") : "AI_NOT_VISIBLE",
    ai_mount_rule_id: validationAllowsContinuation ? ai.selected_rule_id || null : null,
    ai_mount_evidence_basis: validationAllowsContinuation ? evidenceBasis(ai.evaluated_rules, ai.evidence_anchors, ai.selected_rule_id) : [],
    ai_package_mount_only: aiOverlayMounted,
    ai_activity_lock_status: aiOverlayMounted ? "DEFERRED_TO_PHASE_5" : (validationAllowsContinuation ? ai.activity_lock_status || "NOT_EVALUATED" : "NOT_EVALUATED"),
    ai_exposure_lock_status: aiOverlayMounted ? "DEFERRED_TO_PHASE_9" : (validationAllowsContinuation ? ai.exposure_lock_status || "NOT_EVALUATED" : "NOT_EVALUATED"),
    regulatory_overlays: regulatoryCandidates.map((candidate) => candidate.overlay_id).filter(Boolean),
    regulatory_overlay_status: validationAllowsContinuation ? regulatory.status || "NOT_VISIBLE" : "NOT_VISIBLE",
    regulatory_overlay_evidence_basis: regulatoryEvidenceBasis(regulatoryCandidates),
    fusion_bucket_candidates: primaryPackageMounted && Array.isArray(fusion.candidates) ? fusion.candidates : [],
    post_review_delivery_mode: postReviewDeliveryMode,
    post_review_enabled: postReviewEnabled,
    derivation_limitations: unique([
      ...(Array.isArray(domain_derivation_profile.limitation_ledger) ? domain_derivation_profile.limitation_ledger : []),
      ...(validation.limitations || []),
      ...(validation.reinvestigation_items || [])
    ]),
    contradiction_ledger: Array.isArray(domain_derivation_profile.contradiction_ledger) ? domain_derivation_profile.contradiction_ledger : [],
    domain_derivation_profile_ref: "domain_derivation_profile",
    runtime_flags: runtimeFlags,
    activation_flags: {
      pre_phase1_domain_lock_enabled: false,
      phase3b_model_derivation_enabled: true,
      phase3b_deterministic_support_validation_enabled: true,
      downstream_package_mounting_enabled: primaryPackageMounted || aiOverlayMounted,
      ai_overlay_continuation_without_primary_enabled: aiOverlayMounted && !primaryPackageMounted,
      p2g_source_routing_authority_enabled: true
    },
    validation: {
      status: validation.status === "CONTROLLED_FAILURE"
        ? "FAIL"
        : validation.status === "REINVESTIGATION_REQUIRED"
          ? "REINVESTIGATION_REQUIRED"
          : validation.status === "LOCKED_WITH_LIMITATIONS"
            ? "WARN"
            : "PASS",
      errors: validation.critical_failures || validation.failures || [],
      reinvestigation_items: validation.reinvestigation_items || [],
      limitations: validation.limitations || [],
      warnings: validation.warnings || [],
      derivation_authority: validation.derivation_authority || "MODEL_SEMANTIC_JUDGMENT",
      deterministic_role: validation.deterministic_role || "SUPPORT_VALIDATION_ONLY"
    }
  };

  return {
    active_run_package_manifest: after,
    manifest_update: {
      before_selection_stage: before.selection_stage || PRE_PHASE_1_SELECTION_STAGE,
      after_selection_stage: after.selection_stage,
      changed_fields: [
        "selection_stage", "derived_primary_domain", "primary_domain_package", "primary_domain_status",
        "primary_domain_rule_id", "primary_domain_lifecycle", "primary_domain_delivery_mode",
        "primary_domain_package_mount_eligible", "capability_overlays", "capability_overlay_status",
        "ai_package_mount", "ai_mount_rule_id", "ai_package_mount_only", "ai_activity_lock_status",
        "ai_exposure_lock_status", "regulatory_overlays", "regulatory_overlay_status",
        "regulatory_overlay_evidence_basis", "fusion_bucket_candidates", "post_review_delivery_mode",
        "post_review_enabled", "domain_derivation_profile_ref", "activation_flags"
      ],
      unchanged_runtime_flags: runtimeFlags,
      legacy_pre_phase1_dynamic_routing_disabled: true,
      phase3b_model_derivation_authority_active: true,
      phase3b_deterministic_support_only: true,
      phase3b_downstream_package_mounting_enabled: primaryPackageMounted || aiOverlayMounted,
      unresolved_primary_non_blocking: validation.unresolved_primary_after_reinvestigation === true
    }
  };
}

export function forceAllRuntimeFlagsFalse(existing = {}) {
  return {
    ...buildAllFalseRuntimeFlags(),
    ...Object.fromEntries(Object.keys(existing || {}).map((key) => [key, false]))
  };
}

function resolvePostReviewDeliveryMode({ primary, primaryPackageMounted, aiOverlayMounted }) {
  if (primaryPackageMounted && primary.package_lifecycle_state === "ACTIVE_E2E" && primary.downstream_delivery_mode === "FULL_REVIEW_READY") return "FULL_REVIEW_READY";
  if (primaryPackageMounted && primary.package_lifecycle_state === "ACTIVE_REPORT_ONLY") return "REPORT_ONLY";
  if (aiOverlayMounted) return "AI_OVERLAY_FULL_REVIEW_READY";
  return "UNIVERSAL_REPORT_ONLY";
}

function evidenceBasis(rows = [], directAnchors = [], selectedRuleId = null) {
  const fromRows = (Array.isArray(rows) ? rows : [])
    .filter((row) => !selectedRuleId || row?.rule_id === selectedRuleId)
    .filter((row) => row?.trigger_result_claimed === true && row?.exclude_result_claimed !== true)
    .flatMap((row) => (row.evidence_anchors || []).map((anchor) => ({
      rule_id: row.rule_id,
      source_artifact_name: anchor.source_artifact_name || anchor.artifact_name || anchor
    })));
  const direct = (Array.isArray(directAnchors) ? directAnchors : []).map((anchor) => ({
    rule_id: selectedRuleId,
    source_artifact_name: anchor.source_artifact_name || anchor.artifact_name || anchor
  }));
  return uniqueObjects([...fromRows, ...direct].filter((row) => row.source_artifact_name));
}

function regulatoryEvidenceBasis(candidates = []) {
  return (Array.isArray(candidates) ? candidates : [])
    .flatMap((candidate) => (candidate.evidence_anchors || []).map((anchor) => ({
      overlay_id: candidate.overlay_id,
      source_artifact_name: anchor.source_artifact_name || anchor.artifact_name || anchor
    })))
    .filter((row) => row.overlay_id && row.source_artifact_name);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function uniqueObjects(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

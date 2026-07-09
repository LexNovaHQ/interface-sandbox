import {
  buildAllFalseRuntimeFlags,
  DOMAIN_GATE_SELECTION_MODE,
  PASSIVE_MANIFEST_ADAPTER_MODE,
  PRE_PHASE_1_SELECTION_STAGE,
  REVIEW_OVERLAY_DEFAULT
} from "./domain-package-key.js";

export const ACTIVE_RUN_PACKAGE_MANIFEST_ARTIFACT_NAME = "active_run_package_manifest";

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
    capability_overlays: [],
    capability_overlay_status: "PROVISIONAL",
    regulatory_overlays: [],
    regulatory_overlay_status: "PROVISIONAL",
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

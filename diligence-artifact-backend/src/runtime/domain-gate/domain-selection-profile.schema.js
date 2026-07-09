import {
  DOMAIN_GATE_SELECTION_MODE,
  DOMAIN_PACKAGE_KEY_ID,
  DOMAIN_PACKAGE_KEY_VERSION,
  PRE_PHASE_1_HOOK_NAME,
  PRE_PHASE_1_SELECTION_STAGE
} from "./domain-package-key.js";

export const DOMAIN_SELECTION_PROFILE_ARTIFACT_NAME = "domain_selection_profile";
export const PRE_PHASE_1_PROFILE_STATUS = "PROVISIONAL_ONLY";

export function buildDomainSelectionProfileSchemaDefaults({ run = {}, catalog, now = new Date().toISOString() } = {}) {
  return {
    artifact_name: DOMAIN_SELECTION_PROFILE_ARTIFACT_NAME,
    version: "0.1",
    selection_mode: DOMAIN_GATE_SELECTION_MODE,
    selection_stage: PRE_PHASE_1_SELECTION_STAGE,
    hook_name: PRE_PHASE_1_HOOK_NAME,
    status: PRE_PHASE_1_PROFILE_STATUS,
    run_id: run.run_id || null,
    created_at: now,
    updated_at: now,
    target_input: {
      raw_target_url: null,
      normalized_target_url: null,
      target_host: null,
      input_validation_status: "WARN",
      input_warnings: []
    },
    package_key: {
      key_id: DOMAIN_PACKAGE_KEY_ID,
      key_version: DOMAIN_PACKAGE_KEY_VERSION,
      package_catalog_version: catalog?.version || "0.1",
      package_catalog_status: "PASS"
    },
    user_intake: {
      declared_primary_domain_raw: null,
      declared_primary_domain_normalized: null,
      product_or_company_description: null,
      jurisdiction_hint: null,
      customer_segment_hint: null,
      regulated_activity_hint: null,
      intake_completeness: "NONE"
    },
    provisional_primary_domain_candidates: [],
    provisional_capability_overlay_candidates: [],
    provisional_regulatory_overlay_candidates: [],
    discovery_hints: [],
    forbidden_actions_confirmed: {
      primary_domain_locked: false,
      capability_overlay_locked: false,
      regulatory_overlay_locked: false,
      source_discovery_narrowed: false,
      sources_excluded: false,
      dynamic_prompt_routing_enabled: false,
      field_registry_compile_enabled: false,
      qr_matrix_routing_enabled: false,
      report_template_routing_enabled: false
    },
    validation: {
      status: "PASS",
      errors: [],
      warnings: []
    },
    decision_log: [
      {
        stage: PRE_PHASE_1_SELECTION_STAGE,
        decision: "Captured provisional package context only. No package lock.",
        basis: DOMAIN_PACKAGE_KEY_ID,
        timestamp: now
      }
    ]
  };
}

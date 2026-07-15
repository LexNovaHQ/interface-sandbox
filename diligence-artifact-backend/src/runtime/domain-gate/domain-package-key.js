export const DOMAIN_PACKAGE_KEY_ID = "DOMAIN_PACKAGE_KEY_v0";
export const DOMAIN_PACKAGE_KEY_VERSION = "0.1";
export const DOMAIN_GATE_SELECTION_MODE = "domain_gate_v0";
export const PRE_PHASE_1_HOOK_NAME = "pre_phase_1_domain_preflight";
export const PRE_PHASE_1_SELECTION_STAGE = "PRE_PHASE_1";
export const PASSIVE_MANIFEST_ADAPTER_MODE = "passive_manifest";

export const DOMAIN_GATE_ARTIFACT_NAMES = Object.freeze([
  "domain_selection_profile",
  "active_run_package_manifest"
]);

export const PACKAGE_TYPES = Object.freeze([
  "primary_domain_package",
  "capability_overlay",
  "regulatory_overlay",
  "review_overlay"
]);

export const DOMAIN_SELECTION_STATUSES = Object.freeze([
  "NOT_EVALUATED",
  "PROVISIONAL",
  "CANDIDATE",
  "LOCKED",
  "LIMITED",
  "REVIEW_REQUIRED",
  "REJECTED",
  "SUPERSEDED"
]);

export const PRE_PHASE_1_ALLOWED_STATUSES = Object.freeze([
  "NOT_EVALUATED",
  "PROVISIONAL",
  "REJECTED"
]);

export const RUNTIME_FLAG_NAMES = Object.freeze([
  "dynamic_routing_enabled",
  "dynamic_prompt_routing_enabled",
  "field_registry_compile_enabled",
  "qr_matrix_routing_enabled",
  "report_template_routing_enabled",
  "assembly_template_routing_enabled"
]);

export const ACCEPTED_EVIDENCE_CLASSES = Object.freeze([
  "official_homepage_positioning",
  "official_product_page",
  "official_pricing_or_plan_page",
  "official_docs_or_api_reference",
  "official_terms_privacy_security_page",
  "official_app_or_workflow_description",
  "official_case_study",
  "public_regulatory_or_license_signal",
  "credible_third_party_profile",
  "user_intake_declaration"
]);

export const FORBIDDEN_AUTO_LOCK_EVIDENCE_CLASSES = Object.freeze([
  "generic_marketing_adjective",
  "blog_only_signal",
  "news_only_signal",
  "customer_logo_only",
  "job_posting_only",
  "investor_deck_language_only",
  "model_guess_without_source",
  "industry_assumption"
]);

export const REVIEW_OVERLAY_DEFAULT = Object.freeze({
  package_id: "qualified-review",
  package_type: "review_overlay",
  status: "LOCKED",
  reason: "Default review workflow for LexNova diligence runtime."
});

export function buildAllFalseRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAG_NAMES.map((name) => [name, false]));
}

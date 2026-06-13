#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { buildLegalStackReviewInput } from "../src/diligence/adapters/legalStackReviewInputAdapter.js";

const DEFAULT_RUNTIME_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app";
const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL || DEFAULT_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;
const stage5CachePath = process.env.STAGE5_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage5-target-feature-profile.json");
const stage6CachePath = process.env.STAGE6_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6-legal-stack-review.json");

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}
function writeJson(filePath, value) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(value, null, 2)); }
function normalizeBase(value) { const raw = String(value || "").trim(); if (!raw) return ""; const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; try { return new URL(withScheme).toString().replace(/\/+$/, ""); } catch (error) { fail("RUNTIME_URL must be valid", { received: raw, error: error.message }); } }
function readStage5Cache(filePath) { if (!fs.existsSync(filePath)) fail("Stage 5 cache missing. Run e2e:stage5:features first in the same workflow/job.", { cache_path: filePath }); const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")); if (parsed?.cache_version !== "stage5_target_feature_profile_e2e_cache_v1") fail("Bad Stage 5 cache version", { cache_version: parsed?.cache_version }); if (!parsed.source_bundle || !parsed.evidence_junction || !parsed.target_feature_profile) fail("Stage 5 cache incomplete", { keys: Object.keys(parsed || {}) }); return parsed; }
async function readJson(response) { const text = await response.text(); try { return JSON.parse(text); } catch { return { non_json_body: text.slice(0, 3000) }; } }
async function postJson(base, routePath, body) { const response = await fetch(`${base}${routePath}`, { method: "POST", headers: { "content-type": "application/json", "x-runtime-access-token": token }, body: JSON.stringify(body) }); const json = await readJson(response); if (!response.ok || json?.ok === false) fail(`Request failed: ${routePath}`, { status: response.status, body: json }); return json; }
function tokenDrift(actual, estimated) { const a = Number(actual || 0); const e = Number(estimated || 0); if (!a || !e) return null; return Number((a / e).toFixed(3)); }
function textContains(text, terms) { const lower = String(text || "").toLowerCase(); return terms.some((term) => lower.includes(term)); }
function embeddedArtifactGuard(input, review) { const text = (input.source_bundle?.evidence_buffer || []).map((record) => record.clean_text_lossless || "").join("\n\n"); const legalStack = Array.isArray(review?.legal_stack) ? review.legal_stack : []; const byType = Object.fromEntries(legalStack.map((doc) => [doc.document_type, doc])); return { has_dpa_evidence: textContains(text, ["data processing addendum", "data processing agreement", "annexure c"]), has_aup_evidence: textContains(text, ["acceptable use", "prohibited use", "usage restrictions"]), has_sla_evidence: textContains(text, ["service level agreement", "uptime", "availability commitment", "service credits", "annexure a"]), dpa_status: byType.DPA?.evidence_status || null, aup_status: byType.AUP?.evidence_status || null, sla_status: byType.SLA?.evidence_status || null, dpa_exists: byType.DPA?.exists ?? null, aup_exists: byType.AUP?.exists ?? null, sla_exists: byType.SLA?.exists ?? null }; }
function isObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function assertArray(value, label) { if (!Array.isArray(value)) fail(`${label} must be an array`, { value }); }
function assertObject(value, label) { if (!isObject(value)) fail(`${label} must be an object`, { value }); }
function assertEnum(value, allowed, label) { if (!allowed.has(value)) fail(`${label} must use a controlled value`, { value, allowed: [...allowed] }); }
function assertEnumArray(value, allowed, label) { assertArray(value, label); value.forEach((item, index) => assertEnum(item, allowed, `${label}/${index}`)); }
function assertNoForbiddenKeys(value, forbiddenKeys, basePath = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, forbiddenKeys, `${basePath}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${basePath}/${key}`;
    if (forbiddenKeys.has(key)) fail(`Forbidden key in legal_document_cartography: ${key}`, { path: childPath });
    assertNoForbiddenKeys(child, forbiddenKeys, childPath);
  }
}
function assertNoRegistryVaultReportLeakage(review) {
  const forbidden = new Set(["registry_ledger", "registry_evaluation", "final_status", "controlled_rows", "insufficient_evidence_rows", "operator_challenge", "report_data", "technical_audit_log", "assembly_route", "vault_confirmation_questions", "vault_prefill_suggestions", "vault_payload", "html", "legal_conclusion", "compliance_verdict", "recommendation", "control_gap", "threat_status", "triggered_threat_ids", "hunter_status"]);
  assertNoForbiddenKeys(review, forbidden, "");
}
const SIGNALS = new Set(["visible", "not_visible", "partial", "conflicting", "not_applicable", "unknown"]);
const CONFIDENCE = new Set(["high", "medium", "low", "unknown"]);
const FEATURE_ROLES = new Set(["core", "supporting", "contextual", "unknown"]);
const FLOW_ROLES = new Set(["primary_input", "secondary_input", "system_metadata", "generated_output", "stored_record", "third_party_transfer", "derived_data", "unknown"]);
const SUBJECT_TYPES = new Set(["website_visitor", "registered_user", "customer_admin", "customer_end_user", "developer", "employee", "contractor", "candidate", "patient", "child_or_minor", "business_contact", "unknown"]);
const DATA_CATEGORIES = new Set(["account_identity", "contact_data", "authentication_data", "prompt_text", "uploaded_file", "audio", "image_video", "generated_output", "usage_logs", "device_network_data", "payment_billing", "support_communications", "employment_hr", "financial", "health", "biometric_identifier", "child_data", "location", "public_web_data", "third_party_dataset", "unknown"]);
const DATA_ORIGINS = new Set(["data_principal_provided", "customer_provided", "third_party_provided", "public_web", "system_generated", "inferred", "unknown"]);
const COLLECTION_CONTEXTS = new Set(["website", "account_signup", "service_input", "api_input", "uploaded_document", "support", "billing", "telemetry", "third_party_import", "employee_workflow", "unknown"]);
const PROCESSING_ACTIONS = new Set(["collect", "receive", "store", "embed", "retrieve", "infer", "generate", "summarize", "translate", "classify", "score", "rank", "recommend", "route", "share", "transfer", "delete", "log", "monitor", "train_or_finetune", "unknown"]);
const PURPOSE_CATEGORIES = new Set(["service_delivery", "account_management", "security", "billing", "analytics", "support", "model_improvement", "legal_compliance", "marketing", "unknown"]);
const OUTPUT_CATEGORIES = new Set(["generated_output", "classification_score", "summary", "recommendation", "route_decision", "stored_record", "audit_log", "notification", "unknown"]);
const DPDP_ROLES = new Set(["data_fiduciary", "data_processor", "both", "not_applicable", "unknown"]);
const GDPR_ROLES = new Set(["controller", "processor", "joint_controller", "subprocessor", "both", "not_applicable", "unknown"]);
const US_ROLES = new Set(["business", "service_provider", "contractor", "third_party", "not_applicable", "unknown"]);
const CUSTOMER_ROLES = new Set(["controller_or_data_fiduciary", "processor", "business", "service_provider", "not_applicable", "unknown"]);
const THIRD_PARTY_ROLES = new Set(["processor", "subprocessor", "service_provider", "contractor", "third_party", "model_provider", "cloud_provider", "analytics_provider", "payment_provider", "not_applicable", "unknown"]);
const BASIS_TAGS = new Set(["india_entity", "india_users", "eu_users", "uk_users", "california_users", "global_users", "privacy_policy_mentions_regime", "terms_mentions_regime", "no_regime_signal", "unknown"]);
const GDPR_BASIS = new Set(["consent", "contract", "legal_obligation", "vital_interests", "public_task", "legitimate_interests", "not_visible", "not_applicable", "unknown"]);
const DPDP_BASIS = new Set(["consent", "legitimate_use", "not_visible", "not_applicable", "unknown"]);
const RIGHTS_CHANNELS = new Set(["email", "web_form", "dashboard", "mailing_address", "consent_manager", "not_visible", "unknown"]);
const RECIPIENT_CATEGORIES = new Set(["ai_model_provider", "cloud_host", "vector_database", "analytics_provider", "payment_processor", "email_provider", "authentication_provider", "support_tool", "customer_system", "government_or_legal", "unknown"]);
const REGIONS = new Set(["india", "eu_eea", "uk", "us", "canada", "global", "unknown", "not_applicable"]);
const EVIDENCE_STRENGTH = new Set(["direct", "indirect", "inferred_from_feature", "absence_after_search", "conflicting", "unknown"]);
const SIGNAL_TYPES = new Set(["personal_data", "sensitive_data", "children_data", "biometric_data", "financial_data", "health_data", "employment_data", "cross_border_transfer", "processor_chain", "subprocessor", "model_provider", "cloud_provider", "analytics_provider", "payment_provider", "training_or_finetuning", "rag", "embedding", "vector_store", "deletion", "retention", "notice", "consent", "withdrawal", "rights_channel", "security", "breach_notice", "automated_decision", "unknown"]);
function assertDataFlow(row, index) {
  const base = `data_provenance_profile.data_flow_profile/${index}`;
  assertObject(row, base);
  for (const key of ["flow_id", "feature_id", "provenance_id", "feature_role", "flow_role", "data_subject", "data_category", "processing", "role_allocation", "regime_relevance", "notice", "consent_basis", "rights", "processor_chain", "transfer_location", "retention_deletion_ai", "security_accountability", "source_trace", "confidence"]) {
    if (row[key] === undefined) fail(`${base}.${key} is required`, { row });
  }
  assertEnum(row.feature_role, FEATURE_ROLES, `${base}.feature_role`);
  assertEnum(row.flow_role, FLOW_ROLES, `${base}.flow_role`);
  assertEnum(row.confidence, CONFIDENCE, `${base}.confidence`);
  assertEnum(row.data_subject?.subject_type, SUBJECT_TYPES, `${base}.data_subject.subject_type`);
  assertEnum(row.data_subject?.minor_signal, SIGNALS, `${base}.data_subject.minor_signal`);
  assertEnum(row.data_category?.category, DATA_CATEGORIES, `${base}.data_category.category`);
  for (const key of ["personal_data_signal", "sensitive_signal_gdpr", "sensitive_signal_us", "sensitive_signal_dpdp", "biometric_signal"]) assertEnum(row.data_category?.[key], SIGNALS, `${base}.data_category.${key}`);
  assertEnum(row.processing?.data_origin, DATA_ORIGINS, `${base}.processing.data_origin`);
  assertEnum(row.processing?.collection_context, COLLECTION_CONTEXTS, `${base}.processing.collection_context`);
  assertEnumArray(row.processing?.processing_actions, PROCESSING_ACTIONS, `${base}.processing.processing_actions`);
  assertEnum(row.processing?.purpose_category, PURPOSE_CATEGORIES, `${base}.processing.purpose_category`);
  assertEnum(row.processing?.output_category, OUTPUT_CATEGORIES, `${base}.processing.output_category`);
  assertEnum(row.role_allocation?.dpdp_company_role, DPDP_ROLES, `${base}.role_allocation.dpdp_company_role`);
  assertEnum(row.role_allocation?.gdpr_company_role, GDPR_ROLES, `${base}.role_allocation.gdpr_company_role`);
  assertEnum(row.role_allocation?.us_company_role, US_ROLES, `${base}.role_allocation.us_company_role`);
  assertEnum(row.role_allocation?.customer_role, CUSTOMER_ROLES, `${base}.role_allocation.customer_role`);
  assertEnum(row.role_allocation?.third_party_role, THIRD_PARTY_ROLES, `${base}.role_allocation.third_party_role`);
  assertEnum(row.role_allocation?.role_confidence, CONFIDENCE, `${base}.role_allocation.role_confidence`);
  for (const key of ["dpdp", "gdpr", "uk_gdpr", "ccpa_cpra", "us_state_privacy"]) assertEnum(row.regime_relevance?.[key], SIGNALS, `${base}.regime_relevance.${key}`);
  assertEnumArray(row.regime_relevance?.basis_tags, BASIS_TAGS, `${base}.regime_relevance.basis_tags`);
  assertEnum(row.consent_basis?.gdpr_lawful_basis_signal, GDPR_BASIS, `${base}.consent_basis.gdpr_lawful_basis_signal`);
  assertEnum(row.consent_basis?.dpdp_basis_signal, DPDP_BASIS, `${base}.consent_basis.dpdp_basis_signal`);
  assertEnum(row.rights?.rights_channel_type, RIGHTS_CHANNELS, `${base}.rights.rights_channel_type`);
  assertEnumArray(row.processor_chain?.recipient_categories, RECIPIENT_CATEGORIES, `${base}.processor_chain.recipient_categories`);
  assertEnum(row.transfer_location?.origin_region_signal, REGIONS, `${base}.transfer_location.origin_region_signal`);
  assertEnum(row.transfer_location?.destination_region_signal, REGIONS, `${base}.transfer_location.destination_region_signal`);
  assertEnum(row.source_trace?.evidence_strength, EVIDENCE_STRENGTH, `${base}.source_trace.evidence_strength`);
}
function assertStage6BCanon(review) {
  const profile = review.data_provenance_profile;
  assertObject(profile, "data_provenance_profile");
  if (profile.data_provenance_profile_version !== "data_provenance_profile_v1") fail("data_provenance_profile_version must equal data_provenance_profile_v1", { value: profile.data_provenance_profile_version });
  assertArray(profile.data_flow_profile, "data_provenance_profile.data_flow_profile");
  assertObject(profile.profile_summary_signals, "data_provenance_profile.profile_summary_signals");
  assertArray(profile.data_profile_limitations, "data_provenance_profile.data_profile_limitations");
  assertNoForbiddenKeys(profile, new Set(["quote", "evidence_quote", "excerpt_text", "excerpt", "contradicts", "narrative", "explanation", "analysis", "legal_conclusion", "compliance_verdict", "recommendation", "control_gap", "threat_status", "triggered_threat_ids", "hunter_status", "final_status"]), "/data_provenance_profile");
  assertNoForbiddenKeys(profile, new Set(["heading_text", "section_path", "section_function", "structural_zone", "document_status", "doc_title", "document_relationship_map", "legal_document_index", "legal_document_inventory", "document_control_signal_map"]), "/data_provenance_profile");
  profile.data_flow_profile.forEach(assertDataFlow);
  for (const key of ["personal_data_visible", "sensitive_data_visible", "children_data_visible", "cross_border_visible", "subprocessor_visible", "training_or_finetuning_visible", "deletion_channel_visible", "automated_decision_visible"]) assertEnum(profile.profile_summary_signals[key], SIGNALS, `data_provenance_profile.profile_summary_signals.${key}`);
}
function assertStage6ACanon(review) {
  assertArray(review.legal_stack, "legacy legal_stack");
  assertArray(review.document_stack_redline, "legacy document_stack_redline");
  if (typeof review.document_stack_synthesis !== "string") fail("legacy document_stack_synthesis must be a string", { value: review.document_stack_synthesis });
  assertArray(review.legal_stack_assessment, "legacy legal_stack_assessment");
  assertArray(review.limitations, "legacy limitations");
  if (review.legal_stack_review_version !== "legal_stack_review_v2") fail("legal_stack_review_version must equal legal_stack_review_v2", { value: review.legal_stack_review_version });
  if (review.stage_role !== "stage7_navigation_index") fail("stage_role must equal stage7_navigation_index", { value: review.stage_role });

  const cartography = review.legal_document_cartography;
  assertObject(cartography, "legal_document_cartography");
  assertArray(cartography.legal_document_inventory, "legal_document_cartography.legal_document_inventory");
  assertArray(cartography.legal_document_index, "legal_document_cartography.legal_document_index");
  assertArray(cartography.document_relationship_map, "legal_document_cartography.document_relationship_map");
  assertArray(cartography.document_control_signal_map, "legal_document_cartography.document_control_signal_map");
  assertArray(cartography.document_mismatch_signal_map, "legal_document_cartography.document_mismatch_signal_map");
  assertObject(cartography.legal_stack_summary_signals, "legal_document_cartography.legal_stack_summary_signals");
  assertArray(cartography.legal_stack_limitations, "legal_document_cartography.legal_stack_limitations");
  assertNoForbiddenKeys(cartography, new Set(["quote", "evidence_quote", "excerpt_text", "excerpt", "contradicts", "false_belief_note", "coverage_note", "narrative", "explanation", "analysis"]), "/legal_document_cartography");

  const navigation = review.stage7_navigation_index;
  assertObject(navigation, "stage7_navigation_index");
  assertArray(navigation.feature_to_document_section_index, "stage7_navigation_index.feature_to_document_section_index");
  assertArray(navigation.control_family_index, "stage7_navigation_index.control_family_index");
  assertArray(navigation.document_source_locator_index, "stage7_navigation_index.document_source_locator_index");
  assertArray(navigation.absence_unknown_index, "stage7_navigation_index.absence_unknown_index");
  assertArray(navigation.fallback_source_packet, "stage7_navigation_index.fallback_source_packet");
  assertArray(navigation.feature_to_data_flow_index, "stage7_navigation_index.feature_to_data_flow_index");
  assertArray(navigation.data_signal_index, "stage7_navigation_index.data_signal_index");
  navigation.data_signal_index.forEach((item, index) => assertEnum(item?.signal_type, SIGNAL_TYPES, `stage7_navigation_index.data_signal_index/${index}.signal_type`));
  assertNoRegistryVaultReportLeakage(review);
}

if (!token) fail("RUNTIME_ACCESS_TOKEN is required");
const base = normalizeBase(runtimeUrl);
const cache = readStage5Cache(stage5CachePath);
console.log(JSON.stringify({ ok: true, step: "start", phase: "stage_6_legal_stack_review_e2e", cache_path: stage5CachePath, runtime_url: base }, null, 2));

const adapterResult = buildLegalStackReviewInput({ sourceBundle: cache.source_bundle, evidenceJunction: cache.evidence_junction, targetFeatureProfile: cache.target_feature_profile, runId: `stage6_legal_stack_review_input_${Date.now()}`, budget: { max_input_chars: Number(process.env.STAGE6_MAX_INPUT_CHARS || 120000), max_estimated_tokens: Number(process.env.STAGE6_MAX_ESTIMATED_TOKENS || 60000), max_single_source_chars: Number(process.env.STAGE6_MAX_SINGLE_SOURCE_CHARS || 60000), prompt_overhead_tokens: Number(process.env.STAGE6_PROMPT_OVERHEAD_TOKENS || 25000) } });
if (!adapterResult.ok) fail("Legal Stack Review input adapter failed", adapterResult);
const stage6Input = adapterResult.legal_stack_review_input;
console.log(JSON.stringify({ ok: true, step: "stage6_adapter_complete", budget_status: stage6Input.input_budget.budget_status, estimated_total_prompt_tokens: stage6Input.input_budget.estimated_total_prompt_tokens, included_sources: stage6Input.input_budget.included_sources.length, excluded_sources: stage6Input.input_budget.excluded_sources.length }, null, 2));

const legalStage = await postJson(base, "/v1/diligence/stage", { stage: "legal_stack_review", input: stage6Input, options: { pool: process.env.STAGE6_POOL || "reasoning", maxOutputTokens: Number(process.env.STAGE6_MAX_OUTPUT_TOKENS || 8192), timeoutMs: Number(process.env.STAGE6_TIMEOUT_MS || 90000) } });
const review = legalStage.legal_stack_review;
if (!review) fail("Legal Stack Review stage returned no review", legalStage);
if (!Array.isArray(review.legal_stack) || review.legal_stack.length !== 5) fail("Legal Stack Review legal_stack must contain five entries", review);
assertStage6ACanon(review);
assertStage6BCanon(review);

writeJson(stage6CachePath, { cache_version: "stage6_legal_stack_review_e2e_cache_v1", generated_at: new Date().toISOString(), source_bundle: cache.source_bundle, evidence_junction: cache.evidence_junction, company_profile: cache.company_profile, target_feature_profile: cache.target_feature_profile, legal_stack_review_stage_result: legalStage, legal_stack_review: review });

const actualPromptTokens = legalStage.model_metadata?.usage_metadata?.promptTokenCount || null;
const guard = embeddedArtifactGuard(stage6Input, review);
console.log(JSON.stringify({ ok: true, phase: "stage_6_legal_stack_review_e2e", cache_path: stage6CachePath, cache_written: true, adapter_version: stage6Input.legal_stack_review_input_version, budget_status: stage6Input.input_budget.budget_status, estimated_total_prompt_tokens: stage6Input.input_budget.estimated_total_prompt_tokens, actual_prompt_tokens: actualPromptTokens, token_estimate_drift_ratio: tokenDrift(actualPromptTokens, stage6Input.input_budget.estimated_total_prompt_tokens), included_sources: stage6Input.input_budget.included_sources.length, excluded_sources: stage6Input.input_budget.excluded_sources.length, legal_stack_review_version: review.legal_stack_review_version, stage_role: review.stage_role, legal_stack_count: review.legal_stack.length, legal_stack_statuses: Object.fromEntries(review.legal_stack.map((doc) => [doc.document_type, { exists: doc.exists, evidence_status: doc.evidence_status, document_url: doc.document_url }])), redline_count: review.document_stack_redline?.length || 0, assessment_count: review.legal_stack_assessment?.length || 0, limitation_count: review.limitations?.length || 0, legal_document_inventory_count: review.legal_document_cartography?.legal_document_inventory?.length || 0, legal_document_index_count: review.legal_document_cartography?.legal_document_index?.length || 0, document_relationship_count: review.legal_document_cartography?.document_relationship_map?.length || 0, document_control_signal_count: review.legal_document_cartography?.document_control_signal_map?.length || 0, document_mismatch_signal_count: review.legal_document_cartography?.document_mismatch_signal_map?.length || 0, data_flow_profile_count: review.data_provenance_profile?.data_flow_profile?.length || 0, data_profile_limitation_count: review.data_provenance_profile?.data_profile_limitations?.length || 0, stage7_data_flow_index_count: review.stage7_navigation_index?.feature_to_data_flow_index?.length || 0, stage7_data_signal_index_count: review.stage7_navigation_index?.data_signal_index?.length || 0, stage7_document_locator_count: review.stage7_navigation_index?.document_source_locator_index?.length || 0, embedded_artifact_guard: guard, validation_mode: legalStage.validation_mode, guardrail_validation_mode: legalStage.guardrail_validation_mode, runtime_instruction_configured: legalStage.prompt_metadata?.runtime_instruction_configured === true, model_metadata: legalStage.model_metadata || null }, null, 2));

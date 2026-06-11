import { DILIGENCE_SCHEMA_BUNDLE } from "../../functions/_generated/diligenceSchemaBundle.js";
import { validateGeneratedSchema } from "../../functions/_generated/diligenceValidatorBundle.js";

const REGISTRY_EVIDENCE_REF_FALLBACK = "EVIDENCE_REF_NOT_EMITTED_BY_MODEL: see condition basis and admitted evidence packet";
const TARGET_PROFILE_V2_PATH = "/data/schemas/companyProfile.schema.json";
const TARGET_PROFILE_V2_TOP_LEVEL_KEYS = [
  "target_profile_version",
  "identity",
  "jurisdiction",
  "business_model",
  "market_context",
  "product_baseline",
  "data_touchpoint_map",
  "vault_baseline_candidates",
  "pipeline_assumptions",
  "evidence",
  "limitations"
];
const CONFIDENCE_VALUES = new Set(["high", "medium", "low", "unknown"]);
const CANDIDATE_STATUSES = new Set(["PREFILL_READY", "CONFIRM", "UNKNOWN"]);
const TRI_STATE_VALUES = new Set(["true", "false", "unknown"]);
const ABSENCE_MARKERS = new Set(["", "unknown", "not_visible", "not visible", "not published", "not_published", "not found", "not_found", "not stated", "not_stated", "not available", "not_available", "none", "n/a", "na", "unclear"]);
const ENTITY_TYPE_FAMILIES = new Set(["india", "us", "eu_uk", "other", "unknown"]);
const MARKET_TYPES = new Set(["b2b", "b2c", "hybrid", "unknown"]);
const FEATURE_ROLES = new Set(["CORE", "SECONDARY"]);
const AUTONOMY_LEVELS = new Set(["none", "draft", "recommend", "execute", "unknown"]);
const HUMAN_REVIEW_SIGNALS = new Set(["required", "optional", "not_visible", "unknown"]);
const INT_EXT_VALUES = new Set(["internal", "external", "both", "unknown"]);
const ARCH_HINT_TYPES = new Set(["memory", "model_provider", "cloud_host", "vector_db", "subprocessor", "integration", "unknown"]);
const ARCH_HINT_DISPOSITIONS = new Set(["prefill_candidate", "confirmation_only", "ignore"]);
const DATA_ORIGINS = new Set(["user_provided", "customer_provided", "third_party_source", "public_web", "system_generated", "unknown"]);
const DATA_SUBJECTS = new Set(["user", "customer", "employee", "consumer", "developer", "child", "business_entity", "unknown"]);
const DATA_CATEGORIES = new Set(["prompt", "account", "contact", "uploaded_file", "generated_output", "audio", "text", "document", "image", "video", "code", "api_payload", "payment", "usage_log", "support", "sensitive", "unknown"]);
const ARCHETYPE_LABELS = Object.freeze({ UNI: "Universal", DOE: "The Doer", JDG: "The Judge", CMP: "The Companion", CRT: "The Creator", RDR: "The Reader", ORC: "The Orchestrator", TRN: "The Translator", SHD: "The Shield", OPT: "The Optimizer", MOV: "The Mover" });
const ARCHETYPE_MEANINGS = Object.freeze({
  UNI: "Universal AI-output/reliance behavior",
  DOE: "Acts on a user's behalf without per-action approval",
  JDG: "Consequential judgment, score, ranking, or decision about humans",
  CMP: "Companion or relational/emotional interaction",
  CRT: "Creates text, code, media, or other synthetic output",
  RDR: "Reads or ingests external, public, third-party, or customer-provided source material as functional input",
  ORC: "Routes across models, tools, agents, subprocessors, or integrations",
  TRN: "Transforms or processes audio, voice, translation, or biometric-like signal",
  SHD: "Security defense, monitoring, detection, or protection behavior",
  OPT: "Optimization of money, critical operations, or high-impact decisions",
  MOV: "Physical-world movement, control, or actuation"
});
const SURFACE_MEANINGS = Object.freeze({
  "Consumer-Public": "Public or consumer-facing use context",
  "Enterprise-Private": "Enterprise, internal, private, or customer-workspace use context",
  PII: "Personal data, account/contact/user data, or identifiable user/customer information",
  Employment: "Hiring, HR, workforce, applicant, or employee context",
  "Sensitive/Biometric": "Sensitive, special-category, biometric, voiceprint, health, or similarly sensitive data context",
  Financial: "Payments, credit, insurance, trading, financial decisions, or financial data context",
  "Content&IP": "User/customer content, generated content, uploaded documents/media/code, or IP-bearing material",
  "Safety&Physical": "Physical safety, emergency, medical, physical-world harm, or safety-critical context",
  Infrastructure: "Developer/API/system infrastructure or operational dependency context",
  Minors: "Children, minors, child-directed use, or minor data context"
});
const ALLOWED_SURFACE_TOKENS = new Set(Object.keys(SURFACE_MEANINGS));

function normalizeRegistryEvidenceRefValue(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const joined = value.map((item) => normalizeRegistryEvidenceRefValue(item)).filter((item) => item && item !== REGISTRY_EVIDENCE_REF_FALLBACK).join(", ");
    return joined || REGISTRY_EVIDENCE_REF_FALLBACK;
  }
  if (value && typeof value === "object") {
    const readable = [value.evidence_ref, value.source_id, value.source_url, value.url, value.summary, value.basis].filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()).join(" — ");
    if (readable) return readable;
    try {
      const serialized = JSON.stringify(value);
      return serialized && serialized !== "{}" ? serialized : REGISTRY_EVIDENCE_REF_FALLBACK;
    } catch {
      return REGISTRY_EVIDENCE_REF_FALLBACK;
    }
  }
  return REGISTRY_EVIDENCE_REF_FALLBACK;
}

function normalizeRegistryLedgerForSchema(schemaKey, data) {
  if (schemaKey !== "registryLedger") return data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  if (!Array.isArray(data.registry_evaluation_ledger)) return data;
  for (const entry of data.registry_evaluation_ledger) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    entry.evidence_ref = normalizeRegistryEvidenceRefValue(entry.evidence_ref);
  }
  return data;
}

function normalizeValidationError(error) {
  return { keyword: error?.keyword || "validation", instancePath: error?.instancePath || "", schemaPath: error?.schemaPath || "", message: error?.message || "schema validation error", params: error?.params || {} };
}
function error(instancePath, message, keyword = "validation", params = {}) { return { keyword, instancePath, schemaPath: "", message, params }; }
function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function hasOnlyKeys(value, keys, path, errors) { const allowed = new Set(keys); for (const key of Object.keys(value || {})) if (!allowed.has(key)) errors.push(error(`${path}/${key}`, "must NOT have additional properties", "additionalProperties", { additionalProperty: key })); for (const key of keys) if (!Object.prototype.hasOwnProperty.call(value || {}, key)) errors.push(error(path || "/", `must have required property '${key}'`, "required", { missingProperty: key })); }
function assertString(value, path, errors) { if (typeof value !== "string") errors.push(error(path, "must be string", "type")); }
function assertArray(value, path, errors) { if (!Array.isArray(value)) errors.push(error(path, "must be array", "type")); }
function assertConfidence(value, path, errors) { if (!CONFIDENCE_VALUES.has(value)) errors.push(error(path, "must be one of high, medium, low, unknown", "enum")); }
function asString(value, fallback = "") { if (typeof value === "string") return value.trim() || fallback; if (value === null || value === undefined) return fallback; if (Array.isArray(value)) return value.map((item) => asString(item, "")).filter(Boolean).join(", ") || fallback; if (typeof value === "object") { for (const key of ["value", "name", "title", "summary", "description", "basis", "claim_supported", "evidence_quote"]) if (typeof value[key] === "string" && value[key].trim()) return value[key].trim(); return fallback; } return String(value).trim() || fallback; }
function asArray(value) { if (Array.isArray(value)) return value; if (value === undefined || value === null || value === "") return []; return [value]; }
function asStringArray(value) { return asArray(value).map((item) => asString(item, "")).filter(Boolean); }
function ensureObject(value) { return isObject(value) ? value : {}; }
function normalizeToken(value) { return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_"); }
function normalizeFromSet(value, allowed, aliases = {}, fallback = "unknown") { if (value === null || value === undefined) return fallback; const raw = String(value).trim(); if (allowed.has(raw)) return raw; const lower = raw.toLowerCase(); if (allowed.has(lower)) return lower; const token = normalizeToken(raw); if (aliases[token]) return aliases[token]; if (allowed.has(token)) return token; return ABSENCE_MARKERS.has(lower) || ABSENCE_MARKERS.has(token) ? fallback : value; }

function normalizeTriStateValue(value) { if (value === true) return "true"; if (value === false) return "false"; if (value === null || value === undefined) return "unknown"; if (typeof value === "number") { if (value === 1) return "true"; if (value === 0) return "false"; } if (typeof value !== "string") return value; const normalized = value.trim().toLowerCase(); if (TRI_STATE_VALUES.has(normalized)) return normalized; if (["yes", "y", "present", "available", "published", "supported", "has", "included"].includes(normalized)) return "true"; if (["no", "n", "absent", "unavailable", "unsupported", "does not have", "not included"].includes(normalized)) return "false"; if (ABSENCE_MARKERS.has(normalized)) return "unknown"; return value; }
function normalizeConfidenceValue(value) { return normalizeFromSet(value, CONFIDENCE_VALUES, {}, "unknown"); }
function normalizeCandidateStatus(value) { return normalizeFromSet(value, CANDIDATE_STATUSES, { prefill: "PREFILL_READY", prefill_ready: "PREFILL_READY", ready: "PREFILL_READY", confirmed: "PREFILL_READY", confirm: "CONFIRM", needs_confirmation: "CONFIRM", review: "CONFIRM", unknown: "UNKNOWN", not_visible: "UNKNOWN", not_published: "UNKNOWN" }, "UNKNOWN"); }
function normalizeFeatureRole(value) { const raw = String(value || "").trim().toUpperCase(); if (FEATURE_ROLES.has(raw)) return raw; if (["PRIMARY", "MAIN"].includes(raw)) return "CORE"; if (["SUPPORTING", "DEPENDENCY", "AUXILIARY"].includes(raw)) return "SECONDARY"; return value || "SECONDARY"; }
function normalizeSurfaceToken(value) { const raw = String(value || "").trim(); if (ALLOWED_SURFACE_TOKENS.has(raw)) return raw; const lowered = raw.toLowerCase().replace(/\s+/g, ""); const aliases = { consumerpublic: "Consumer-Public", consumer_public: "Consumer-Public", enterprisprivate: "Enterprise-Private", enterpriseprivate: "Enterprise-Private", enterprise_private: "Enterprise-Private", pii: "PII", employment: "Employment", sensitivebiometric: "Sensitive/Biometric", sensitive_biometric: "Sensitive/Biometric", biometric: "Sensitive/Biometric", financial: "Financial", contentip: "Content&IP", content_ip: "Content&IP", safetyphysical: "Safety&Physical", safety_physical: "Safety&Physical", infrastructure: "Infrastructure", minors: "Minors" }; return aliases[lowered] || aliases[normalizeToken(raw)] || raw; }
function normalizeArchetypeCode(value) { const raw = String(value || "").trim().toUpperCase(); return ARCHETYPE_LABELS[raw] ? raw : raw; }

function normalizeEnumRepresentations(value) { if (Array.isArray(value)) { value.forEach((item) => normalizeEnumRepresentations(item)); return value; } if (!isObject(value)) return value; for (const [key, child] of Object.entries(value)) { if (["delivery_app_candidate", "delivery_api_candidate", "external_action_signal", "app", "api", "web"].includes(key)) { value[key] = normalizeTriStateValue(child); continue; } if (key === "confidence" || key.endsWith("_confidence")) { value[key] = normalizeConfidenceValue(child); continue; } if (key === "status") { value[key] = normalizeCandidateStatus(child); continue; } if (key === "market_type_candidate") { value[key] = normalizeFromSet(child, MARKET_TYPES, { business_to_business: "b2b", business_to_consumer: "b2c" }, "unknown"); continue; } if (key === "entity_type_family") { value[key] = normalizeFromSet(child, ENTITY_TYPE_FAMILIES, { india_private: "india", indian: "india", usa: "us", united_states: "us", uk: "eu_uk", eu: "eu_uk" }, "unknown"); continue; } if (key === "feature_role") { value[key] = normalizeFeatureRole(child); continue; } if (key === "autonomy_level") { value[key] = normalizeFromSet(child, AUTONOMY_LEVELS, {}, "unknown"); continue; } if (key === "human_review_signal") { value[key] = normalizeFromSet(child, HUMAN_REVIEW_SIGNALS, { not_visible_in_admitted_evidence: "not_visible", not_visible: "not_visible" }, "unknown"); continue; } if (key === "int_ext_classification") { value[key] = normalizeFromSet(child, INT_EXT_VALUES, {}, "unknown"); continue; } if (key === "hint_type") { value[key] = normalizeFromSet(child, ARCH_HINT_TYPES, {}, "unknown"); continue; } if (key === "disposition") { value[key] = normalizeFromSet(child, ARCH_HINT_DISPOSITIONS, { prefill: "prefill_candidate", candidate: "prefill_candidate", confirmation: "confirmation_only" }, "confirmation_only"); continue; } if (key === "data_origin") { value[key] = normalizeFromSet(child, DATA_ORIGINS, { user: "user_provided", customer: "customer_provided", third_party: "third_party_source", public: "public_web", generated: "system_generated" }, "unknown"); continue; } if (key === "data_subject") { value[key] = normalizeFromSet(child, DATA_SUBJECTS, { end_user: "user", users: "user", customers: "customer", children: "child", company: "business_entity" }, "unknown"); continue; } if (key === "data_category") { value[key] = normalizeFromSet(child, DATA_CATEGORIES, { file: "uploaded_file", files: "uploaded_file", output: "generated_output", logs: "usage_log", api: "api_payload", payload: "api_payload" }, "unknown"); continue; } normalizeEnumRepresentations(child); } return value; }

function unknownCandidate(value = "") { return { value, status: "UNKNOWN", basis: "not visible in admitted evidence", confidence: "unknown", evidence_refs: [] }; }
function normalizeCandidateLeaf(value) { if (!isObject(value)) return unknownCandidate(value ?? ""); return { value: Object.prototype.hasOwnProperty.call(value, "value") ? value.value : "", status: normalizeCandidateStatus(value.status), basis: asString(value.basis, "not visible in admitted evidence"), confidence: normalizeConfidenceValue(value.confidence), evidence_refs: asStringArray(value.evidence_refs || value.evidenceRefs || value.sources) }; }
function ensureCandidate(parent, key, fallback = "") { if (!isObject(parent[key]) || !Object.prototype.hasOwnProperty.call(parent[key], "status")) parent[key] = unknownCandidate(fallback); else parent[key] = normalizeCandidateLeaf(parent[key]); }

function normalizeFieldEvidenceRef(item, index, stage = "stage4") { if (!isObject(item)) return stage === "stage5" ? { field_path: `unknown_${index + 1}`, evidence_refs: [], basis: asString(item, "not visible in admitted evidence"), confidence: "unknown" } : { field_path: `unknown_${index + 1}`, evidence_source_id: `evidence_${index + 1}`, source_url: "", claim_supported: asString(item, ""), evidence_quote: "", confidence: "unknown" }; if (stage === "stage5") return { field_path: asString(item.field_path, `unknown_${index + 1}`), evidence_refs: asStringArray(item.evidence_refs || item.evidence_ref || item.evidence_source_id || item.source_url || item.url), basis: asString(item.basis || item.claim_supported || item.evidence_quote || item.summary, "not visible in admitted evidence"), confidence: normalizeConfidenceValue(item.confidence) }; return { field_path: asString(item.field_path, `unknown_${index + 1}`), evidence_source_id: asString(item.evidence_source_id || item.source_id || item.id, `evidence_${index + 1}`), source_url: asString(item.source_url || item.url || item.final_url, ""), claim_supported: asString(item.claim_supported || item.claim || item.basis || item.summary, ""), evidence_quote: asString(item.evidence_quote || item.quote, ""), confidence: normalizeConfidenceValue(item.confidence) }; }

function normalizeTargetProfileV2ForValidation(data) {
  if (!isObject(data)) return data;
  normalizeEnumRepresentations(data);
  data.target_profile_version = "target_profile_v2";
  data.identity = ensureObject(data.identity);
  for (const key of ["brand_name", "legal_name", "website", "domain", "entity_type", "corporate_status_signal", "operator_or_controller_signal"]) data.identity[key] = asString(data.identity[key], "");
  data.identity.trade_names = asStringArray(data.identity.trade_names);
  data.identity.entity_type_family = normalizeFromSet(data.identity.entity_type_family, ENTITY_TYPE_FAMILIES, {}, "unknown");
  data.identity.identity_confidence = normalizeConfidenceValue(data.identity.identity_confidence);
  data.jurisdiction = ensureObject(data.jurisdiction);
  for (const key of ["registered_or_notice_country", "registered_or_notice_state", "city", "full_address", "governing_law_country", "governing_law_state", "courts_or_venue", "source_basis"]) data.jurisdiction[key] = asString(data.jurisdiction[key], "");
  data.jurisdiction.confidence = normalizeConfidenceValue(data.jurisdiction.confidence);
  data.business_model = ensureObject(data.business_model);
  for (const key of ["business_category", "primary_customer_type", "sales_motion", "revenue_model_signal", "enterprise_or_self_serve_signal", "public_sector_signal"]) data.business_model[key] = asString(data.business_model[key], key === "primary_customer_type" ? "unknown" : "");
  data.business_model.market_type_candidate = normalizeFromSet(data.business_model.market_type_candidate, MARKET_TYPES, {}, "unknown");
  data.business_model.business_model_confidence = normalizeConfidenceValue(data.business_model.business_model_confidence);
  data.market_context = ensureObject(data.market_context);
  data.market_context.industry = asString(data.market_context.industry, "");
  data.market_context.target_geographies = asStringArray(data.market_context.target_geographies);
  data.market_context.target_languages = asStringArray(data.market_context.target_languages);
  data.market_context.regulated_sector_hints = asStringArray(data.market_context.regulated_sector_hints || data.market_context.regulated_sector_exposure);
  data.market_context.market_context_confidence = normalizeConfidenceValue(data.market_context.market_context_confidence);
  data.product_baseline = ensureObject(data.product_baseline);
  data.product_baseline.high_level_offering = asString(data.product_baseline.high_level_offering, "");
  data.product_baseline.primary_claim = asString(data.product_baseline.primary_claim, "");
  data.product_baseline.products = asArray(data.product_baseline.products).filter(isObject).map((item, index) => ({ name: asString(item.name || item.product_name || item.label, `product_${index + 1}`), description: asString(item.description || item.summary, "not visible in admitted evidence"), source_url: asString(item.source_url || item.url || item.final_url, ""), evidence_quote: asString(item.evidence_quote || item.quote || item.description, ""), confidence: normalizeConfidenceValue(item.confidence) }));
  data.product_baseline.delivery_app_candidate = normalizeTriStateValue(data.product_baseline.delivery_app_candidate);
  data.product_baseline.delivery_api_candidate = normalizeTriStateValue(data.product_baseline.delivery_api_candidate);
  data.product_baseline.beta_or_preview_signal = asString(data.product_baseline.beta_or_preview_signal, "not visible in admitted evidence");
  data.product_baseline.integration_candidates = asArray(data.product_baseline.integration_candidates).filter(isObject).map((item, index) => ({ name: asString(item.name || item.integration || item.label, `integration_${index + 1}`), source_url: asString(item.source_url || item.url || item.final_url, ""), evidence_quote: asString(item.evidence_quote || item.quote || item.name, ""), confidence: normalizeConfidenceValue(item.confidence) }));
  data.data_touchpoint_map = asArray(data.data_touchpoint_map).filter(isObject).map((item, index) => ({ touchpoint_id: asString(item.touchpoint_id, `DT${String(index + 1).padStart(3, "0")}`), actor: normalizeFromSet(item.actor, new Set(["end_user", "customer_admin", "enterprise_customer", "developer", "third_party", "unknown"]), { user: "end_user", customer: "enterprise_customer", admin: "customer_admin" }, "unknown"), data_subject: normalizeFromSet(item.data_subject, DATA_SUBJECTS, {}, "unknown"), data_category: normalizeFromSet(item.data_category, DATA_CATEGORIES, {}, "unknown"), collection_or_processing_context: asString(item.collection_or_processing_context || item.processing_context, "not visible in admitted evidence"), source_url: asString(item.source_url || item.url || item.final_url, ""), evidence_quote: asString(item.evidence_quote || item.quote, ""), confidence: normalizeConfidenceValue(item.confidence) }));
  data.vault_baseline_candidates = ensureObject(data.vault_baseline_candidates);
  data.vault_baseline_candidates.baseline = ensureObject(data.vault_baseline_candidates.baseline);
  for (const key of ["company", "entity_type", "address", "legal_email", "privacy_email", "products", "market", "revenue_model", "has_beta"]) ensureCandidate(data.vault_baseline_candidates.baseline, key);
  data.vault_baseline_candidates.baseline.jurisdiction = ensureObject(data.vault_baseline_candidates.baseline.jurisdiction); ensureCandidate(data.vault_baseline_candidates.baseline.jurisdiction, "country"); ensureCandidate(data.vault_baseline_candidates.baseline.jurisdiction, "state");
  data.vault_baseline_candidates.baseline.delivery = ensureObject(data.vault_baseline_candidates.baseline.delivery); ensureCandidate(data.vault_baseline_candidates.baseline.delivery, "app"); ensureCandidate(data.vault_baseline_candidates.baseline.delivery, "api");
  data.vault_baseline_candidates.baseline.integrations = ensureObject(data.vault_baseline_candidates.baseline.integrations); for (const key of ["slack", "crm", "stripe", "github", "webhooks", "none"]) ensureCandidate(data.vault_baseline_candidates.baseline.integrations, key);
  data.vault_baseline_candidates.compliance = ensureObject(data.vault_baseline_candidates.compliance); for (const key of ["processes_pii", "eu_users", "ca_users", "other_regions"]) ensureCandidate(data.vault_baseline_candidates.compliance, key);
  data.pipeline_assumptions = ensureObject(data.pipeline_assumptions); for (const key of ["for_feature_map", "for_legal_stack", "for_registry_matching", "for_vault", "assumption_warnings"]) data.pipeline_assumptions[key] = asStringArray(data.pipeline_assumptions[key]);
  data.evidence = ensureObject(data.evidence); data.evidence.field_evidence_refs = asArray(data.evidence.field_evidence_refs).map((item, index) => normalizeFieldEvidenceRef(item, index, "stage4")); data.evidence.unresolved_questions = asStringArray(data.evidence.unresolved_questions);
  data.limitations = asArray(data.limitations).map(stringifyLimitation).map((item) => String(item || "").trim()).filter(Boolean);
  return data;
}

function makeUnknownDataProvenance(feature) { return { data_origin: "unknown", data_subject: "unknown", data_category: Array.isArray(feature.input_data) && feature.input_data.some((item) => /audio/i.test(String(item))) ? "audio" : "unknown", processing_context: asString(feature.system_action || feature.feature_description, "not visible in admitted evidence"), storage_or_retention_signal: "not visible in admitted evidence", training_or_finetuning_signal: "not visible in admitted evidence", source_url: asString(feature.feature_source_url, ""), evidence_quote: asString(feature.evidence_quote, ""), confidence: "unknown" }; }
function normalizeDataProvenance(item, feature = {}) { const src = ensureObject(item); return { data_origin: normalizeFromSet(src.data_origin || src.origin, DATA_ORIGINS, {}, "unknown"), data_subject: normalizeFromSet(src.data_subject || src.subject, DATA_SUBJECTS, {}, "unknown"), data_category: normalizeFromSet(src.data_category || src.category, DATA_CATEGORIES, {}, "unknown"), processing_context: asString(src.processing_context || src.context, asString(feature.system_action || feature.feature_description, "not visible in admitted evidence")), storage_or_retention_signal: asString(src.storage_or_retention_signal || src.retention || src.storage, "not visible in admitted evidence"), training_or_finetuning_signal: asString(src.training_or_finetuning_signal || src.training || src.finetuning, "not visible in admitted evidence"), source_url: asString(src.source_url || src.url || src.final_url, asString(feature.feature_source_url, "")), evidence_quote: asString(src.evidence_quote || src.quote, asString(feature.evidence_quote, "")), confidence: normalizeConfidenceValue(src.confidence) }; }
function normalizeTargetFeatureProfileForValidation(data) {
  if (!isObject(data)) return data;
  normalizeEnumRepresentations(data);
  data.feature_profile_version = "feature_profile_v2";
  data.target_profile_ref = ensureObject(data.target_profile_ref);
  data.target_profile_ref.target_profile_version = asString(data.target_profile_ref.target_profile_version, "target_profile_v2");
  data.target_profile_ref.brand_name = asString(data.target_profile_ref.brand_name, "");
  data.target_profile_ref.legal_name = asString(data.target_profile_ref.legal_name, "");
  data.target_profile_ref.domain = asString(data.target_profile_ref.domain, "");
  data.feature_inventory = asArray(data.feature_inventory).filter(isObject).map((raw, index) => {
    const feature = { ...raw };
    feature.feature_id = asString(feature.feature_id, `F${String(index + 1).padStart(3, "0")}`);
    feature.feature_name = asString(feature.feature_name || feature.name || feature.feature, `Feature ${index + 1}`);
    feature.feature_role = normalizeFeatureRole(feature.feature_role);
    feature.commercial_function = asString(feature.commercial_function || feature.business_function || feature.outcome, "not visible in admitted evidence");
    feature.business_label_or_product_area = asString(feature.business_label_or_product_area || feature.product_area || feature.product || feature.label, "not visible in admitted evidence");
    feature.feature_description = asString(feature.feature_description || feature.description || feature.summary, "not visible in admitted evidence");
    feature.actor_or_user = asString(feature.actor_or_user || feature.actor || feature.user, "unknown");
    feature.input_data = asStringArray(feature.input_data || feature.inputs);
    feature.system_action = asString(feature.system_action || feature.action || feature.mechanism, "not visible in admitted evidence");
    feature.output_or_result = asString(feature.output_or_result || feature.output || feature.result, "not visible in admitted evidence");
    feature.autonomy_level = normalizeFromSet(feature.autonomy_level, AUTONOMY_LEVELS, {}, "unknown");
    feature.human_review_signal = normalizeFromSet(feature.human_review_signal, HUMAN_REVIEW_SIGNALS, { not_visible_in_admitted_evidence: "not_visible" }, "unknown");
    feature.external_action_signal = normalizeTriStateValue(feature.external_action_signal);
    feature.delivery_channels = ensureObject(feature.delivery_channels); for (const channel of ["app", "api", "web"]) feature.delivery_channels[channel] = normalizeTriStateValue(feature.delivery_channels[channel]);
    feature.confidence = normalizeConfidenceValue(feature.confidence);
    feature.evidence_quote = asString(feature.evidence_quote || feature.quote, "");
    feature.feature_source_url = asString(feature.feature_source_url || feature.source_url || feature.url || feature.final_url, "");
    feature.evidence_refs = asStringArray(feature.evidence_refs || feature.evidence_ref || feature.evidence_source_id || feature.feature_source_url);
    feature.linked_threat_ids = [];
    feature.data_provenance = asArray(feature.data_provenance).filter(isObject).map((item) => normalizeDataProvenance(item, feature));
    if (!feature.data_provenance.length) feature.data_provenance = [makeUnknownDataProvenance(feature)];
    feature.archetype_codes = asStringArray(feature.archetype_codes).map(normalizeArchetypeCode).filter((code) => ARCHETYPE_LABELS[code]);
    feature.archetype_labels = feature.archetype_codes.map((code) => ARCHETYPE_LABELS[code]);
    const archetypeByCode = new Map(asArray(feature.archetype_provenance).filter(isObject).map((entry) => [normalizeArchetypeCode(entry.archetype_code), entry]));
    feature.archetype_provenance = feature.archetype_codes.map((code) => { const entry = ensureObject(archetypeByCode.get(code)); return { archetype_code: code, registry_key_detection_logic: asString(entry.registry_key_detection_logic, ARCHETYPE_MEANINGS[code] || "registry key archetype meaning"), matched_feature_behavior: asString(entry.matched_feature_behavior, asString(feature.system_action || feature.feature_description, "not visible in admitted evidence")), evidence_quote: asString(entry.evidence_quote, feature.evidence_quote), source_url: asString(entry.source_url, feature.feature_source_url), confidence: normalizeConfidenceValue(entry.confidence || feature.confidence) }; });
    feature.surface_tokens = asStringArray(feature.surface_tokens).map(normalizeSurfaceToken).filter((token) => ALLOWED_SURFACE_TOKENS.has(token));
    const surfaceByToken = new Map(asArray(feature.surface_provenance).filter(isObject).map((entry) => [normalizeSurfaceToken(entry.surface_token), entry]));
    const firstProv = feature.data_provenance[0] || makeUnknownDataProvenance(feature);
    feature.surface_provenance = feature.surface_tokens.map((token) => { const entry = ensureObject(surfaceByToken.get(token)); return { surface_token: token, registry_key_surface_meaning: asString(entry.registry_key_surface_meaning, SURFACE_MEANINGS[token] || "registry key surface meaning"), matched_data_or_context: asString(entry.matched_data_or_context, `${firstProv.data_category}: ${firstProv.processing_context}`), evidence_quote: asString(entry.evidence_quote, firstProv.evidence_quote || feature.evidence_quote), source_url: asString(entry.source_url, firstProv.source_url || feature.feature_source_url), confidence: normalizeConfidenceValue(entry.confidence || firstProv.confidence || feature.confidence) }; });
    return feature;
  });
  data.product_feature_map = [];
  let provenanceCounter = 0;
  data.data_provenance_map = data.feature_inventory.flatMap((feature) => feature.data_provenance.map((item) => ({ provenance_id: `DP${String(++provenanceCounter).padStart(3, "0")}`, feature_id: feature.feature_id, ...item })));
  let surfaceCounter = 0;
  data.regulated_surface_map = data.feature_inventory.flatMap((feature) => feature.surface_tokens.map((token) => ({ surface_id: `RS${String(++surfaceCounter).padStart(3, "0")}`, feature_id: feature.feature_id, surface_token: token, int_ext_classification: "unknown", basis: (feature.surface_provenance || []).find((entry) => entry.surface_token === token)?.matched_data_or_context || "derived from feature surface provenance", confidence: normalizeConfidenceValue(feature.confidence), evidence_refs: feature.evidence_refs || [] })));
  data.architecture_hints = asArray(data.architecture_hints).filter(isObject).map((entry, index) => ({ hint_id: asString(entry.hint_id, `AH${String(index + 1).padStart(3, "0")}`), feature_id: asString(entry.feature_id, data.feature_inventory[0]?.feature_id || "F001"), hint_type: normalizeFromSet(entry.hint_type, ARCH_HINT_TYPES, {}, "unknown"), hint_value: asString(entry.hint_value, ""), disposition: normalizeFromSet(entry.disposition, ARCH_HINT_DISPOSITIONS, {}, "confirmation_only"), source_url: asString(entry.source_url || entry.url || entry.final_url, ""), evidence_quote: asString(entry.evidence_quote || entry.quote, ""), confidence: normalizeConfidenceValue(entry.confidence) }));
  data.commercial_scan = ensureObject(data.commercial_scan); data.commercial_scan.distinct_commercial_outcomes_seen = asStringArray(data.commercial_scan.distinct_commercial_outcomes_seen); data.commercial_scan.mapped_core_feature_ids = asStringArray(data.commercial_scan.mapped_core_feature_ids); data.commercial_scan.unmapped_outcomes_due_to_insufficient_detail = asStringArray(data.commercial_scan.unmapped_outcomes_due_to_insufficient_detail);
  data.vault_feature_candidates = ensureObject(data.vault_feature_candidates); data.vault_feature_candidates.baseline = ensureObject(data.vault_feature_candidates.baseline); data.vault_feature_candidates.archetypes = ensureObject(data.vault_feature_candidates.archetypes); data.vault_feature_candidates.compliance = ensureObject(data.vault_feature_candidates.compliance); delete data.vault_feature_candidates.architecture;
  data.evidence = ensureObject(data.evidence); data.evidence.field_evidence_refs = asArray(data.evidence.field_evidence_refs).map((item, index) => normalizeFieldEvidenceRef(item, index, "stage5")); data.evidence.unresolved_questions = asStringArray(data.evidence.unresolved_questions);
  data.limitations = asArray(data.limitations).map(stringifyLimitation).map((item) => String(item || "").trim()).filter(Boolean);
  return data;
}

function normalizeOutputForSchema(schemaKey, data) { if (schemaKey === "targetProfileV2") return normalizeTargetProfileV2ForValidation(data); if (schemaKey === "targetFeatureProfile") return normalizeTargetFeatureProfileForValidation(data); return normalizeRegistryLedgerForSchema(schemaKey, data); }

function validateCandidate(value, path, errors) { if (!isObject(value)) { errors.push(error(path, "must be object", "type")); return; } hasOnlyKeys(value, ["value", "status", "basis", "confidence", "evidence_refs"], path, errors); if (!CANDIDATE_STATUSES.has(value.status)) errors.push(error(`${path}/status`, "must be PREFILL_READY, CONFIRM, or UNKNOWN", "enum")); assertString(value.basis, `${path}/basis`, errors); assertConfidence(value.confidence, `${path}/confidence`, errors); assertArray(value.evidence_refs, `${path}/evidence_refs`, errors); }
function validateCandidateTree(value, path, errors) { if (!isObject(value)) { errors.push(error(path, "must be object", "type")); return; } if (Object.prototype.hasOwnProperty.call(value, "status")) { validateCandidate(value, path, errors); return; } for (const [key, child] of Object.entries(value)) validateCandidateTree(child, `${path}/${key}`, errors); }

function validateTargetProfileV2(data) {
  const errors = [];
  const normalizedData = normalizeTargetProfileV2ForValidation(data);
  if (!isObject(normalizedData)) return { ok: false, errors: [error("/", "must be object", "type")] };
  hasOnlyKeys(normalizedData, TARGET_PROFILE_V2_TOP_LEVEL_KEYS, "", errors);
  if (normalizedData.target_profile_version !== "target_profile_v2") errors.push(error("/target_profile_version", "must be target_profile_v2", "const"));
  for (const legacy of ["company_profile_version", "company_identity", "operating_profile", "downstream_assumptions"]) if (Object.prototype.hasOwnProperty.call(normalizedData, legacy)) errors.push(error(`/${legacy}`, "legacy Stage 4 key is forbidden in target_profile_v2", "forbidden"));
  if (isObject(normalizedData.identity)) { hasOnlyKeys(normalizedData.identity, ["brand_name", "legal_name", "trade_names", "website", "domain", "entity_type", "entity_type_family", "corporate_status_signal", "operator_or_controller_signal", "identity_confidence"], "/identity", errors); ["brand_name", "legal_name", "website", "domain", "entity_type", "corporate_status_signal", "operator_or_controller_signal"].forEach((key) => assertString(normalizedData.identity[key], `/identity/${key}`, errors)); assertArray(normalizedData.identity.trade_names, "/identity/trade_names", errors); if (!ENTITY_TYPE_FAMILIES.has(normalizedData.identity.entity_type_family)) errors.push(error("/identity/entity_type_family", "must be india, us, eu_uk, other, or unknown", "enum")); assertConfidence(normalizedData.identity.identity_confidence, "/identity/identity_confidence", errors); }
  if (isObject(normalizedData.jurisdiction)) { hasOnlyKeys(normalizedData.jurisdiction, ["registered_or_notice_country", "registered_or_notice_state", "city", "full_address", "governing_law_country", "governing_law_state", "courts_or_venue", "source_basis", "confidence"], "/jurisdiction", errors); ["registered_or_notice_country", "registered_or_notice_state", "city", "full_address", "governing_law_country", "governing_law_state", "courts_or_venue", "source_basis"].forEach((key) => assertString(normalizedData.jurisdiction[key], `/jurisdiction/${key}`, errors)); assertConfidence(normalizedData.jurisdiction.confidence, "/jurisdiction/confidence", errors); }
  if (isObject(normalizedData.business_model)) { hasOnlyKeys(normalizedData.business_model, ["business_category", "primary_customer_type", "market_type_candidate", "sales_motion", "revenue_model_signal", "enterprise_or_self_serve_signal", "public_sector_signal", "business_model_confidence"], "/business_model", errors); ["business_category", "primary_customer_type", "sales_motion", "revenue_model_signal", "enterprise_or_self_serve_signal", "public_sector_signal"].forEach((key) => assertString(normalizedData.business_model[key], `/business_model/${key}`, errors)); if (!MARKET_TYPES.has(normalizedData.business_model.market_type_candidate)) errors.push(error("/business_model/market_type_candidate", "must be b2b, b2c, hybrid, or unknown", "enum")); assertConfidence(normalizedData.business_model.business_model_confidence, "/business_model/business_model_confidence", errors); }
  if (isObject(normalizedData.market_context)) { hasOnlyKeys(normalizedData.market_context, ["industry", "target_geographies", "target_languages", "regulated_sector_hints", "market_context_confidence"], "/market_context", errors); assertString(normalizedData.market_context.industry, "/market_context/industry", errors); assertArray(normalizedData.market_context.target_geographies, "/market_context/target_geographies", errors); assertArray(normalizedData.market_context.target_languages, "/market_context/target_languages", errors); assertArray(normalizedData.market_context.regulated_sector_hints, "/market_context/regulated_sector_hints", errors); assertConfidence(normalizedData.market_context.market_context_confidence, "/market_context/market_context_confidence", errors); }
  if (isObject(normalizedData.product_baseline)) { hasOnlyKeys(normalizedData.product_baseline, ["high_level_offering", "primary_claim", "products", "delivery_app_candidate", "delivery_api_candidate", "beta_or_preview_signal", "integration_candidates"], "/product_baseline", errors); ["high_level_offering", "primary_claim", "beta_or_preview_signal"].forEach((key) => assertString(normalizedData.product_baseline[key], `/product_baseline/${key}`, errors)); assertArray(normalizedData.product_baseline.products, "/product_baseline/products", errors); assertArray(normalizedData.product_baseline.integration_candidates, "/product_baseline/integration_candidates", errors); if (!TRI_STATE_VALUES.has(normalizedData.product_baseline.delivery_app_candidate)) errors.push(error("/product_baseline/delivery_app_candidate", "must be true, false, or unknown", "enum")); if (!TRI_STATE_VALUES.has(normalizedData.product_baseline.delivery_api_candidate)) errors.push(error("/product_baseline/delivery_api_candidate", "must be true, false, or unknown", "enum")); }
  assertArray(normalizedData.data_touchpoint_map, "/data_touchpoint_map", errors);
  if (isObject(normalizedData.vault_baseline_candidates)) validateCandidateTree(normalizedData.vault_baseline_candidates, "/vault_baseline_candidates", errors);
  if (isObject(normalizedData.evidence)) { hasOnlyKeys(normalizedData.evidence, ["field_evidence_refs", "unresolved_questions"], "/evidence", errors); assertArray(normalizedData.evidence.field_evidence_refs, "/evidence/field_evidence_refs", errors); assertArray(normalizedData.evidence.unresolved_questions, "/evidence/unresolved_questions", errors); }
  assertArray(normalizedData.limitations, "/limitations", errors);
  return { ok: errors.length === 0, errors };
}

export function formatSchemaErrors(errors = []) { if (!errors.length) return "No schema errors."; return errors.map((error) => `${error.instancePath || "/"}: ${error.message || "schema validation error"}`).join("\n"); }
export function resolveSchemaEntry(schemaKey) { if (schemaKey === "targetProfileV2") return { schema_id: "targetProfileV2", path: TARGET_PROFILE_V2_PATH, schema: { title: "Canonical Target Profile", $id: "https://interface-sandbox.local/schemas/companyProfile.schema.json" } }; const direct = DILIGENCE_SCHEMA_BUNDLE.schemas?.[schemaKey]; if (direct) return direct; const canonicalPath = DILIGENCE_SCHEMA_BUNDLE.canonical_schema_paths?.[schemaKey]; if (!canonicalPath) return null; return Object.values(DILIGENCE_SCHEMA_BUNDLE.schemas || {}).find((entry) => entry.path === canonicalPath) || null; }
export function validateDiligenceStageOutput(schemaKey, data) { if (schemaKey === "targetProfileV2") { const result = validateTargetProfileV2(data); return { ok: result.ok, schemaKey, resolvedKey: "targetProfileV2", schema_path: TARGET_PROFILE_V2_PATH, validation_mode: "stage4_target_profile_v2_runtime_guardrail", errors: (result.errors || []).map(normalizeValidationError) }; } const schemaEntry = resolveSchemaEntry(schemaKey); if (!schemaEntry?.schema) return { ok: false, schemaKey, resolvedKey: schemaKey, validation_mode: "schema_bundle_missing", errors: [{ keyword: "schema_missing", instancePath: "", schemaPath: "", message: `Output schema not found for ${schemaKey}`, params: { schemaKey } }] }; const dataForValidation = normalizeOutputForSchema(schemaKey, data); const result = validateGeneratedSchema(schemaKey, dataForValidation); return { ok: result.ok, schemaKey: result.schemaKey || schemaKey, resolvedKey: result.resolvedKey || schemaEntry.schema_id || schemaKey, schema_path: schemaEntry.path, validation_mode: "build_time_ajv_standalone", errors: (result.errors || []).map(normalizeValidationError) }; }
export function getSchemaBundleStatus() { return { generated_at: DILIGENCE_SCHEMA_BUNDLE.generated_at, schema_count: Object.keys(DILIGENCE_SCHEMA_BUNDLE.schemas || {}).length, schema_keys: [...Object.keys(DILIGENCE_SCHEMA_BUNDLE.schemas || {}), "targetProfileV2"] }; }

import { createEmptyVaultPrefill, createVaultSuggestion, setVaultPrefill } from "./vaultCanonicalMap.js";

const asArray = (value) => Array.isArray(value) ? value : [];
const asObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asText = (value, fallback = "") => String(value ?? "").trim() || fallback;
const unique = (values = []) => [...new Set(asArray(values).map((value) => asText(value)).filter(Boolean))];

const ARCHETYPE_TO_PREFILL = Object.freeze({
  UNI: ["archetypes.is_generalist"], DOE: ["archetypes.is_doer"], ORC: ["archetypes.is_orchestrator"], CRT: ["archetypes.is_creator"], RDR: ["archetypes.is_reader"], CMP: ["archetypes.conversational_ui"], TRN: ["archetypes.sens_bio"], JDG: ["archetypes.is_judge", "archetypes.is_judge_hr", "archetypes.is_judge_legal"], OPT: ["archetypes.is_optimizer", "archetypes.sens_fin"], SHD: ["archetypes.is_shield"], MOV: ["archetypes.is_mover"]
});
const SURFACE_TO_PREFILL = Object.freeze({ PII: [["compliance.processes_pii", "yes"]], Financial: [["compliance.sens_fin", true]], Employment: [["compliance.sens_employment", true]], Minors: [["compliance.minors", true]], "Sensitive/Biometric": [["archetypes.sens_bio", true]] });
const PROVIDER_ALIASES = Object.freeze([[/azure\s*openai/i, "azure_openai", "architecture.sub_processors.azure_openai"], [/aws\s*bedrock|bedrock/i, "aws_bedrock", "architecture.sub_processors.aws_bedrock"], [/openai|gpt/i, "openai", "architecture.sub_processors.openai"], [/anthropic|claude/i, "anthropic", "architecture.sub_processors.anthropic"], [/google|gemini|vertex/i, "google_gemini", "architecture.sub_processors.google"], [/cohere/i, "cohere", "architecture.sub_processors.cohere"], [/mistral/i, "mistral", "architecture.sub_processors.mistral"], [/meta|llama/i, "meta_llama", "architecture.sub_processors.meta_llama"], [/deepseek/i, "deepseek", "architecture.sub_processors.deepseek"], [/\bxai\b|grok/i, "xai", "architecture.sub_processors.xai"]]);

function setIfPresent(prefill, path, value, basis, confidence, refs, warnings, extra = {}) {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && !value.length) return false;
  return setVaultPrefill(prefill, path, createVaultSuggestion(value, basis, confidence, refs, extra), warnings);
}
function confidenceFrom(value, fallback = "medium") { const c = String(value || "").toLowerCase(); return ["high", "medium", "low"].includes(c) ? c : fallback; }
function dataFlows(packet = {}) { const data = asObject(packet.data_provenance_profile); return asArray(data.integrated_feature_data_flow_profile || data.data_flow_profile || data.feature_data_flow_profile || data.data_flows); }

function deriveBaseline(packet, prefill, warnings) {
  const t = asObject(packet.target_profile_v2 || packet.profile_handoffs?.target_profile);
  const identity = asObject(t.identity);
  const jurisdiction = asObject(t.jurisdiction);
  const business = asObject(t.business_model);
  const product = asObject(t.product_baseline);
  const target = asObject(packet.target_profile);
  const products = unique([...asArray(product.products).map((item) => item.name || item.product_name || item.description), ...asArray(packet.feature_map).map((item) => item.business_label_or_product_area || item.feature_name)]);
  setIfPresent(prefill, "baseline.company", identity.legal_name || identity.brand_name || target.company_name, "Derived from target_profile.identity.", "high", ["target_profile.identity"], warnings);
  setIfPresent(prefill, "baseline.products", products, "Derived from target_profile.product_baseline and target_feature_profile.feature_inventory.", "high", ["target_profile.product_baseline", "target_feature_profile.feature_inventory"], warnings);
  setIfPresent(prefill, "baseline.jurisdiction.country", jurisdiction.registered_or_notice_country || jurisdiction.governing_law_country || target.jurisdiction?.country, "Derived from target_profile.jurisdiction.", confidenceFrom(jurisdiction.confidence, "medium"), ["target_profile.jurisdiction"], warnings);
  setIfPresent(prefill, "baseline.jurisdiction.state", jurisdiction.registered_or_notice_state || jurisdiction.governing_law_state || target.jurisdiction?.state, "Derived from target_profile.jurisdiction.", confidenceFrom(jurisdiction.confidence, "medium"), ["target_profile.jurisdiction"], warnings);
  setIfPresent(prefill, "baseline.market", business.market_type_candidate, "Derived from target_profile.business_model.market_type_candidate.", confidenceFrom(business.business_model_confidence, "medium"), ["target_profile.business_model"], warnings);
  setIfPresent(prefill, "baseline.revenue_model", business.revenue_model_signal, "Derived from target_profile.business_model.revenue_model_signal.", "medium", ["target_profile.business_model"], warnings);
  setIfPresent(prefill, "baseline.has_beta", /beta|preview|trial|experimental/i.test(product.beta_or_preview_signal || ""), "Derived from target_profile.product_baseline.beta_or_preview_signal.", "medium", ["target_profile.product_baseline"], warnings);
  setIfPresent(prefill, "baseline.delivery.app", product.delivery_app_candidate === "true" || asArray(packet.feature_map).some((f) => f.delivery_channels?.app === "true"), "Derived from target profile and feature delivery signals.", "medium", ["target_profile.product_baseline", "target_feature_profile.feature_inventory"], warnings);
  setIfPresent(prefill, "baseline.delivery.api", product.delivery_api_candidate === "true" || asArray(packet.feature_map).some((f) => f.delivery_channels?.api === "true"), "Derived from target profile and feature delivery signals.", "medium", ["target_profile.product_baseline", "target_feature_profile.feature_inventory"], warnings);
  setIfPresent(prefill, "baseline.delivery.web", asArray(packet.feature_map).some((f) => f.delivery_channels?.web === "true"), "Derived from target_feature_profile delivery channels.", "medium", ["target_feature_profile.feature_inventory"], warnings);
}
function deriveArchitecture(packet, prefill, warnings) {
  const featureProfile = asObject(packet.feature_profile_v2 || packet.profile_handoffs?.target_feature_profile);
  const hints = asArray(featureProfile.architecture_hints);
  const providerCodes = new Set();
  const otherProviders = [];
  for (const hint of hints) {
    const value = asText(hint.hint_value);
    if (!value) continue;
    const basis = `Derived from target_feature_profile.architecture_hints ${hint.hint_id || ""}.`;
    const refs = [hint.feature_id || hint.hint_id || "target_feature_profile.architecture_hints"];
    const confidence = confidenceFrom(hint.confidence, "medium");
    if (hint.hint_type === "memory") setIfPresent(prefill, "architecture.memory", value, basis, confidence, refs, warnings);
    if (hint.hint_type === "cloud_host") setIfPresent(prefill, "architecture.cloud_host", value, basis, confidence, refs, warnings);
    if (hint.hint_type === "vector_db") setIfPresent(prefill, "architecture.vector_db", value, basis, confidence, refs, warnings);
    if (hint.hint_type === "model_provider" || hint.hint_type === "subprocessor") {
      let matched = false;
      for (const [regex, providerCode, providerPath] of PROVIDER_ALIASES) {
        if (regex.test(value)) { providerCodes.add(providerCode); setIfPresent(prefill, providerPath, true, basis, confidence, refs, warnings); matched = true; }
      }
      if (!matched) otherProviders.push(value);
    }
  }
  if (providerCodes.size) {
    setIfPresent(prefill, "architecture.ai_provider_stack.providers", [...providerCodes], "Derived from target_feature_profile architecture provider hints.", "medium", ["target_feature_profile.architecture_hints"], warnings);
    setIfPresent(prefill, "architecture.models", providerCodes.has("self_hosted_oss") ? "selfhosted" : "thirdparty", "Derived from AI provider stack.", "medium", ["target_feature_profile.architecture_hints"], warnings);
    setIfPresent(prefill, "architecture.ai_provider_stack.hosting_model", providerCodes.has("self_hosted_oss") ? "selfhosted" : "thirdparty", "Derived from AI provider stack.", "medium", ["target_feature_profile.architecture_hints"], warnings);
  }
  if (otherProviders.length) {
    setIfPresent(prefill, "architecture.ai_provider_stack.other_providers", unique(otherProviders), "Derived from non-standard provider hints.", "medium", ["target_feature_profile.architecture_hints"], warnings);
    setIfPresent(prefill, "architecture.sub_processors.other", unique(otherProviders).join(", "), "Derived from non-standard provider hints.", "medium", ["target_feature_profile.architecture_hints"], warnings);
  }
  const docs = asArray(packet.legal_cartography?.legal_document_inventory);
  const subprocessorDoc = docs.find((doc) => /subprocessor|processor/i.test(`${doc.document_type} ${doc.document_title}`));
  if (subprocessorDoc?.source_url) {
    setIfPresent(prefill, "architecture.sub_processors.url", subprocessorDoc.source_url, "Derived from legal_cartography subprocessor/control document.", "medium", ["legal_cartography"], warnings);
    setIfPresent(prefill, "architecture.ai_provider_stack.public_provider_disclosure_url", subprocessorDoc.source_url, "Derived from legal_cartography public processor/subprocessor disclosure.", "medium", ["legal_cartography"], warnings);
  }
  const flows = dataFlows(packet);
  if (flows.some((flow) => asArray(flow?.processing?.processing_purpose).includes("model_training"))) setIfPresent(prefill, "architecture.model_improvement.customer_inputs_used_for_training", "yes", "Derived from data_provenance_profile model_training processing purpose.", "medium", ["data_provenance_profile"], warnings);
  if (flows.some((flow) => asArray(flow?.processing?.processing_purpose).includes("product_improvement"))) setIfPresent(prefill, "architecture.model_improvement.product_improvement_use", "yes", "Derived from data_provenance_profile product_improvement processing purpose.", "medium", ["data_provenance_profile"], warnings);
  if (flows.some((flow) => asArray(flow?.data_category?.category_types).includes("prompt_input"))) setIfPresent(prefill, "architecture.storage_logging.stores_prompts", "unknown", "Data provenance detected prompt input; storage remains confirmation-required.", "low", ["data_provenance_profile"], warnings);
}
function deriveArchetypes(packet, prefill, warnings) {
  const codes = new Set();
  asArray(packet.feature_map).forEach((feature) => asArray(feature.archetype_codes).forEach((code) => codes.add(String(code).toUpperCase())));
  codes.forEach((code) => (ARCHETYPE_TO_PREFILL[code] || []).forEach((path) => setIfPresent(prefill, path, true, `Derived from target_feature_profile archetype ${code}.`, "high", ["target_feature_profile.feature_inventory"], warnings)));
}
function deriveCompliance(packet, prefill, warnings) {
  const tokens = new Set();
  asArray(packet.feature_map).forEach((feature) => asArray(feature.surface_tokens).forEach((token) => tokens.add(String(token))));
  asArray(packet.feature_profile_v2?.regulated_surface_map).forEach((surface) => tokens.add(String(surface.surface_token || "")));
  tokens.forEach((token) => (SURFACE_TO_PREFILL[token] || []).forEach(([path, value]) => setIfPresent(prefill, path, value, `Derived from target_feature_profile surface ${token}.`, "high", ["target_feature_profile.regulated_surface_map"], warnings)));
  const targetRegions = asArray(packet.target_profile_v2?.market_context?.target_geographies);
  setIfPresent(prefill, "compliance.other_regions", targetRegions, "Derived from target_profile.market_context.target_geographies.", "medium", ["target_profile.market_context"], warnings);
  if (targetRegions.some((region) => /eu|europe|uk|united kingdom/i.test(region))) setIfPresent(prefill, "compliance.eu_users", true, "Derived from target geography/regime signal.", "medium", ["target_profile.market_context"], warnings);
  const flows = dataFlows(packet);
  if (flows.some((flow) => flow?.data_category?.personal_data_signal === "visible")) setIfPresent(prefill, "compliance.processes_pii", "yes", "Derived from data_provenance_profile personal data signal.", "high", ["data_provenance_profile"], warnings);
  if (flows.some((flow) => flow?.data_category?.health_data_signal === "visible")) setIfPresent(prefill, "compliance.sens_health", true, "Derived from data_provenance_profile health data signal.", "high", ["data_provenance_profile"], warnings);
  if (flows.some((flow) => flow?.data_subject?.minor_signal === "visible")) setIfPresent(prefill, "compliance.minors", true, "Derived from data_provenance_profile minor signal.", "medium", ["data_provenance_profile"], warnings);
  if (flows.some((flow) => flow?.data_subject?.employee_signal === "visible")) setIfPresent(prefill, "compliance.sens_employment", true, "Derived from data_provenance_profile employee signal.", "medium", ["data_provenance_profile"], warnings);
}

export function deriveVaultPrefillFromStage10SourcePacket(stage10SourcePacket = {}, warnings = []) {
  const prefill = createEmptyVaultPrefill();
  deriveBaseline(stage10SourcePacket, prefill, warnings);
  deriveArchitecture(stage10SourcePacket, prefill, warnings);
  deriveArchetypes(stage10SourcePacket, prefill, warnings);
  deriveCompliance(stage10SourcePacket, prefill, warnings);
  return prefill;
}

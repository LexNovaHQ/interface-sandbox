import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function readModuleObject(path, exportName) {
  const mod = await import(`${resolve(path)}?audit=${Date.now()}`);
  return mod[exportName];
}

function fail(message, detail = {}) {
  console.error(JSON.stringify({ ok: false, phase: "runtime_bundle_audit", error: message, detail }, null, 2));
  process.exit(1);
}

const promptBundlePath = "functions/_generated/diligencePromptBundle.js";
const schemaBundlePath = "functions/_generated/diligenceSchemaBundle.js";
const validatorBundlePath = "functions/_generated/diligenceValidatorBundle.js";

const promptBundle = await readModuleObject(promptBundlePath, "DILIGENCE_PROMPT_BUNDLE");
const schemaBundle = await readModuleObject(schemaBundlePath, "DILIGENCE_SCHEMA_BUNDLE");
const validatorBundle = await import(`${resolve(validatorBundlePath)}?audit=${Date.now()}`);

const stagePromptIds = promptBundle?.stage_prompt_ids || {};
const prompts = promptBundle?.prompts || {};
const schemas = schemaBundle?.schemas || {};

if (stagePromptIds.company_profile !== "company_profile") fail("company_profile prompt stage id missing", { stagePromptIds });
if (!prompts.company_profile?.text) fail("company_profile prompt missing from generated bundle", { prompt_keys: Object.keys(prompts) });
if (!schemas.companyProfile?.schema) fail("companyProfile schema missing from generated bundle", { schema_keys: Object.keys(schemas) });
if (typeof validatorBundle.validateGeneratedSchema !== "function") fail("validateGeneratedSchema export missing");

const fixture = {
  company_profile_version: "company_profile_v1",
  company_identity: {
    brand_name: "FixtureCo",
    legal_or_corporate_name: "unknown",
    website: "https://example.com",
    domain: "example.com",
    headquarters_or_origin_signal: "unknown",
    corporate_status_signal: "unknown",
    identity_confidence: "unknown"
  },
  business_model: {
    company_type: "unknown",
    primary_customer_type: "unknown",
    sales_motion: "unknown",
    revenue_model_signal: "unknown",
    enterprise_or_self_serve_signal: "unknown",
    business_model_confidence: "unknown"
  },
  market_context: {
    industry: "unknown",
    target_geographies: [],
    target_languages: [],
    regulated_sector_exposure: [],
    public_sector_or_enterprise_signal: "unknown",
    market_context_confidence: "unknown"
  },
  operating_profile: {
    high_level_offering: "unknown",
    ai_system_type: "unknown",
    deployment_model_signal: "unknown",
    user_data_touchpoints: [],
    customer_data_touchpoints: [],
    operating_profile_confidence: "unknown"
  },
  downstream_assumptions: {
    for_product_profile: [],
    for_legal_review: [],
    for_registry_matching: [],
    assumption_warnings: []
  },
  evidence: {
    primary_company_sources: [],
    supporting_company_sources: [],
    evidence_notes: [],
    unresolved_questions: []
  },
  limitations: []
};

const validation = validatorBundle.validateGeneratedSchema("companyProfile", fixture);
if (!validation.ok) fail("companyProfile generated validator rejected fixture", { errors: validation.errors });

await readFile(promptBundlePath, "utf8");
await readFile(schemaBundlePath, "utf8");
await readFile(validatorBundlePath, "utf8");

console.log(JSON.stringify({
  ok: true,
  phase: "runtime_bundle_audit",
  prompt_stage_count: Object.keys(stagePromptIds).length,
  schema_count: Object.keys(schemas).length,
  company_profile_prompt: true,
  company_profile_schema: true,
  company_profile_validator: true
}, null, 2));

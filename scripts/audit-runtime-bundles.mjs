import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function readModuleObject(path, exportName) {
  const url = pathToFileURL(resolve(path));
  url.searchParams.set("audit", String(Date.now()));
  const mod = await import(url.href);
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
const validatorBundleUrl = pathToFileURL(resolve(validatorBundlePath));
validatorBundleUrl.searchParams.set("audit", String(Date.now()));
const validatorBundle = await import(validatorBundleUrl.href);

const stagePromptIds = promptBundle?.stage_prompt_ids || {};
const prompts = promptBundle?.prompts || {};
const schemas = schemaBundle?.schemas || {};

if (stagePromptIds.company_profile !== "company_profile") fail("company_profile prompt stage id missing", { stagePromptIds });
if (!prompts.company_profile?.text) fail("company_profile prompt missing from generated bundle", { prompt_keys: Object.keys(prompts) });
if (!schemas.companyProfile?.schema) fail("companyProfile schema missing from generated bundle", { schema_keys: Object.keys(schemas) });
if (typeof validatorBundle.validateGeneratedSchema !== "function") fail("validateGeneratedSchema export missing");

function candidate(value, status = "UNKNOWN", basis = "runtime bundle audit fixture", confidence = "unknown") {
  return {
    value,
    status,
    basis,
    confidence,
    evidence_refs: []
  };
}

const fixture = {
  target_profile_version: "target_profile_v2",
  identity: {
    brand_name: "FixtureCo",
    legal_name: "unknown",
    trade_names: [],
    website: "https://example.com",
    domain: "example.com",
    entity_type: "unknown",
    entity_type_family: "unknown",
    corporate_status_signal: "unknown",
    operator_or_controller_signal: "unknown",
    identity_confidence: "unknown"
  },
  jurisdiction: {
    registered_or_notice_country: "unknown",
    registered_or_notice_state: "unknown",
    city: "unknown",
    full_address: "unknown",
    governing_law_country: "unknown",
    governing_law_state: "unknown",
    courts_or_venue: "unknown",
    source_basis: "unknown",
    confidence: "unknown"
  },
  business_model: {
    business_category: "unknown",
    primary_customer_type: "unknown",
    market_type_candidate: "unknown",
    sales_motion: "unknown",
    revenue_model_signal: "unknown",
    enterprise_or_self_serve_signal: "unknown",
    public_sector_signal: "unknown",
    business_model_confidence: "unknown"
  },
  market_context: {
    industry: "unknown",
    target_geographies: [],
    target_languages: [],
    regulated_sector_hints: [],
    market_context_confidence: "unknown"
  },
  product_baseline: {
    high_level_offering: "unknown",
    primary_claim: "unknown",
    products: [],
    delivery_app_candidate: "unknown",
    delivery_api_candidate: "unknown",
    beta_or_preview_signal: "unknown",
    integration_candidates: []
  },
  data_touchpoint_map: [],
  vault_baseline_candidates: {
    baseline: {
      company: candidate("FixtureCo"),
      entity_type: candidate("unknown"),
      address: candidate("unknown"),
      legal_email: candidate("unknown"),
      privacy_email: candidate("unknown"),
      products: candidate([]),
      jurisdiction: {
        country: candidate("unknown"),
        state: candidate("unknown")
      },
      market: candidate("unknown"),
      delivery: {
        app: candidate("unknown"),
        api: candidate("unknown")
      },
      revenue_model: candidate("unknown"),
      has_beta: candidate("unknown"),
      integrations: {
        slack: candidate(false),
        crm: candidate(false),
        stripe: candidate(false),
        github: candidate(false),
        webhooks: candidate(false),
        none: candidate(true)
      }
    },
    compliance: {
      processes_pii: candidate("unknown"),
      eu_users: candidate("unknown"),
      ca_users: candidate("unknown"),
      other_regions: candidate([])
    }
  },
  pipeline_assumptions: {
    for_feature_map: [],
    for_legal_stack: [],
    for_registry_matching: [],
    for_vault: [],
    assumption_warnings: []
  },
  evidence: {
    field_evidence_refs: [],
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

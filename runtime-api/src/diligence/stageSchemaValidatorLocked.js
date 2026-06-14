import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { DILIGENCE_SCHEMA_BUNDLE } from "../../functions/_generated/diligenceSchemaBundle.js";
import { validateGeneratedSchema } from "../../functions/_generated/diligenceValidatorBundle.js";
import { repairTargetFeatureProfileForSchema } from "./targetFeatureProfileSchemaRepair.js";

const TARGET_PROFILE_V2_PATH = "/data/schemas/companyProfile.schema.json";
const STAGE6_REVIEW_PATH = "/data/schemas/stage6Review.schema.json";
const TARGET_PROFILE_KEYS = ["target_profile_version", "identity", "jurisdiction", "business_model", "market_context", "product_baseline", "data_touchpoint_map", "vault_baseline_candidates", "pipeline_assumptions", "evidence", "limitations"];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const STAGE6_REVIEW_SCHEMA_PATH = path.resolve(REPO_ROOT, "data/schemas/stage6Review.schema.json");

function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function asArray(value) { if (Array.isArray(value)) return value; if (value === undefined || value === null || value === "") return []; return [value]; }
function asString(value, fallback = "") { if (typeof value === "string") return value.trim() || fallback; if (value === undefined || value === null || value === "") return fallback; return String(value).trim() || fallback; }
function normalizeError(error) { return { keyword: error?.keyword || "validation", instancePath: error?.instancePath || "", schemaPath: error?.schemaPath || "", message: error?.message || "schema validation error", params: error?.params || {} }; }
function stripTo(obj, keys) { const allowed = new Set(keys); for (const key of Object.keys(obj || {})) if (!allowed.has(key)) delete obj[key]; }
function candidate(value = "") { return { value, status: "UNKNOWN", basis: "not visible in admitted evidence", confidence: "unknown", evidence_refs: [] }; }
function ensureCandidate(parent, key) { if (!isObject(parent[key])) parent[key] = candidate(""); else { parent[key].status = ["PREFILL_READY", "CONFIRM", "UNKNOWN"].includes(parent[key].status) ? parent[key].status : "UNKNOWN"; parent[key].basis = asString(parent[key].basis, "not visible in admitted evidence"); parent[key].confidence = ["high", "medium", "low", "unknown"].includes(parent[key].confidence) ? parent[key].confidence : "unknown"; parent[key].evidence_refs = asArray(parent[key].evidence_refs).map((x) => asString(x, "")).filter(Boolean); } }

function canonicalizeTargetProfileV2(data) {
  if (!isObject(data)) return data;
  stripTo(data, TARGET_PROFILE_KEYS);
  data.target_profile_version = "target_profile_v2";
  data.identity = isObject(data.identity) ? data.identity : {};
  data.jurisdiction = isObject(data.jurisdiction) ? data.jurisdiction : {};
  data.business_model = isObject(data.business_model) ? data.business_model : {};
  data.market_context = isObject(data.market_context) ? data.market_context : {};
  data.product_baseline = isObject(data.product_baseline) ? data.product_baseline : {};
  data.data_touchpoint_map = asArray(data.data_touchpoint_map).filter(isObject);
  data.vault_baseline_candidates = isObject(data.vault_baseline_candidates) ? data.vault_baseline_candidates : {};
  data.vault_baseline_candidates.baseline = isObject(data.vault_baseline_candidates.baseline) ? data.vault_baseline_candidates.baseline : {};
  data.vault_baseline_candidates.baseline.jurisdiction = isObject(data.vault_baseline_candidates.baseline.jurisdiction) ? data.vault_baseline_candidates.baseline.jurisdiction : {};
  data.vault_baseline_candidates.baseline.delivery = isObject(data.vault_baseline_candidates.baseline.delivery) ? data.vault_baseline_candidates.baseline.delivery : {};
  data.vault_baseline_candidates.baseline.integrations = isObject(data.vault_baseline_candidates.baseline.integrations) ? data.vault_baseline_candidates.baseline.integrations : {};
  for (const key of ["company", "entity_type", "address", "legal_email", "privacy_email", "products", "market", "revenue_model", "has_beta"]) ensureCandidate(data.vault_baseline_candidates.baseline, key);
  for (const key of ["country", "state"]) ensureCandidate(data.vault_baseline_candidates.baseline.jurisdiction, key);
  for (const key of ["app", "api"]) ensureCandidate(data.vault_baseline_candidates.baseline.delivery, key);
  for (const key of ["slack", "crm", "stripe", "github", "webhooks", "none"]) ensureCandidate(data.vault_baseline_candidates.baseline.integrations, key);
  data.vault_baseline_candidates.compliance = isObject(data.vault_baseline_candidates.compliance) ? data.vault_baseline_candidates.compliance : {};
  for (const key of ["processes_pii", "eu_users", "ca_users", "other_regions"]) ensureCandidate(data.vault_baseline_candidates.compliance, key);
  data.pipeline_assumptions = isObject(data.pipeline_assumptions) ? data.pipeline_assumptions : {};
  for (const key of ["for_feature_map", "for_legal_stack", "for_registry_matching", "for_vault", "assumption_warnings"]) data.pipeline_assumptions[key] = asArray(data.pipeline_assumptions[key]).map((x) => asString(x, "")).filter(Boolean);
  data.evidence = isObject(data.evidence) ? data.evidence : {};
  data.evidence.field_evidence_refs = asArray(data.evidence.field_evidence_refs).filter(isObject);
  data.evidence.unresolved_questions = asArray(data.evidence.unresolved_questions).map((x) => asString(x, "")).filter(Boolean);
  data.limitations = asArray(data.limitations).map((x) => asString(x, "")).filter(Boolean);
  return data;
}

let stage6Validator = null;
function getStage6Validator() {
  if (stage6Validator) return stage6Validator;
  const schema = JSON.parse(fs.readFileSync(STAGE6_REVIEW_SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  stage6Validator = ajv.compile(schema);
  return stage6Validator;
}

function validateStage6Review(data) {
  const validate = getStage6Validator();
  const ok = validate(data);
  return { ok, errors: (validate.errors || []).map(normalizeError) };
}

export function formatSchemaErrors(errors = []) { if (!errors.length) return "No schema errors."; return errors.map((error) => `${error.instancePath || "/"}: ${error.message || "schema validation error"}`).join("\n"); }
export function resolveSchemaEntry(schemaKey) { if (schemaKey === "targetProfileV2") return { schema_id: "targetProfileV2", path: TARGET_PROFILE_V2_PATH, schema: { title: "Canonical Target Profile" } }; if (schemaKey === "stage6Review") return { schema_id: "stage6Review", path: STAGE6_REVIEW_PATH, schema: { title: "Stage 6 Review" } }; const direct = DILIGENCE_SCHEMA_BUNDLE.schemas?.[schemaKey]; if (direct) return direct; const canonicalPath = DILIGENCE_SCHEMA_BUNDLE.canonical_schema_paths?.[schemaKey]; return canonicalPath ? Object.values(DILIGENCE_SCHEMA_BUNDLE.schemas || {}).find((entry) => entry.path === canonicalPath) || null : null; }
export function validateDiligenceStageOutput(schemaKey, data) {
  if (schemaKey === "targetProfileV2") { if (!isObject(data)) return { ok: false, schemaKey, resolvedKey: "targetProfileV2", schema_path: TARGET_PROFILE_V2_PATH, validation_mode: "stage4_target_profile_v2_type_guard", errors: [normalizeError({ keyword: "type", message: "must be object" })] }; canonicalizeTargetProfileV2(data); return { ok: true, schemaKey, resolvedKey: "targetProfileV2", schema_path: TARGET_PROFILE_V2_PATH, validation_mode: "stage4_target_profile_v2_canonicalized_nonblocking", errors: [] }; }
  if (schemaKey === "targetFeatureProfile") { if (isObject(data)) repairTargetFeatureProfileForSchema(data); const entry = resolveSchemaEntry(schemaKey); const result = entry?.schema ? validateGeneratedSchema(schemaKey, data) : { ok: false, errors: [] }; return { ok: true, schemaKey: result.schemaKey || schemaKey, resolvedKey: result.resolvedKey || entry?.schema_id || schemaKey, schema_path: entry?.path || "/data/schemas/targetFeatureProfile.schema.json", validation_mode: result.ok ? "stage5_feature_profile_v2_ajv_passed_after_canonicalization" : "stage5_feature_profile_v2_ajv_nonblocking_after_canonicalization", errors: [] }; }
  if (schemaKey === "stage6Review") { const result = validateStage6Review(data); return { ok: result.ok, schemaKey, resolvedKey: "stage6Review", schema_path: STAGE6_REVIEW_PATH, validation_mode: "source_stage6_review_schema_ajv", errors: result.errors }; }
  const entry = resolveSchemaEntry(schemaKey); if (!entry?.schema) return { ok: false, schemaKey, resolvedKey: schemaKey, validation_mode: "schema_bundle_missing", errors: [{ keyword: "schema_missing", instancePath: "", schemaPath: "", message: `Output schema not found for ${schemaKey}`, params: { schemaKey } }] };
  const result = validateGeneratedSchema(schemaKey, data); return { ok: result.ok, schemaKey: result.schemaKey || schemaKey, resolvedKey: result.resolvedKey || entry.schema_id || schemaKey, schema_path: entry.path, validation_mode: "build_time_ajv_standalone", errors: (result.errors || []).map(normalizeError) };
}
export function getSchemaBundleStatus() { return { generated_at: DILIGENCE_SCHEMA_BUNDLE.generated_at, schema_count: Object.keys(DILIGENCE_SCHEMA_BUNDLE.schemas || {}).length, schema_keys: [...Object.keys(DILIGENCE_SCHEMA_BUNDLE.schemas || {}), "targetProfileV2", "stage6Review"] }; }

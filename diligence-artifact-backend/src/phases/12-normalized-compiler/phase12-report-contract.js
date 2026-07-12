import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const PHASE12_DIR = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(PHASE12_DIR, "../../..");

const FILES = Object.freeze({
  sectionSchema: path.join(PHASE12_DIR, "report-contract/REPORT_SECTION_SCHEMA.yml"),
  ownershipMatrix: path.join(PHASE12_DIR, "report-contract/REPORT_FIELD_OWNERSHIP_MATRIX.json"),
  gapRegister: path.join(PHASE12_DIR, "report-contract/UPSTREAM_REPORT_GAP_REGISTER.yml"),
  normalizerKey: path.join(BACKEND_ROOT, "references/registry/REPORT_NORMALIZER_KEY.yml"),
  coP1201Receipt: path.join(BACKEND_ROOT, "receipts/CO_P12_01_CERTIFIED.json"),
  coP1202Receipt: path.join(BACKEND_ROOT, "receipts/CO_P12_02_CERTIFIED.json")
});

export function loadPhase12ReportContract() {
  const sectionSchema = readYaml(FILES.sectionSchema).report_section_schema || {};
  const ownershipMatrix = readJson(FILES.ownershipMatrix);
  const gapRegister = readYaml(FILES.gapRegister).upstream_report_gap_register || {};
  const normalizerKey = readYaml(FILES.normalizerKey).report_normalizer_key || {};
  const receipts = {
    co_p12_01: readJson(FILES.coP1201Receipt),
    co_p12_02: readJson(FILES.coP1202Receipt)
  };
  return {
    schema_version: "phase12_report_contract.v1.co_p12_03",
    section_schema: sectionSchema,
    ownership_matrix: ownershipMatrix,
    gap_register: gapRegister,
    normalizer_key: normalizerKey,
    receipts,
    validation: validateContract({ sectionSchema, ownershipMatrix, gapRegister, normalizerKey, receipts })
  };
}

export function assertPhase12ReportContract(contract = loadPhase12ReportContract()) {
  const failures = contract.validation?.failures || [];
  if (failures.length) throw new Error(`PHASE12_REPORT_CONTRACT_INVALID:${failures.join("|")}`);
  return contract;
}

export function getSectionById(contract, sectionId) {
  return arr(contract?.section_schema?.sections).find((section) => section.section_id === sectionId) || null;
}

export function getNormalizerField(contract, fieldId) {
  return arr(contract?.normalizer_key?.fields).find((field) => field.field_id === fieldId) || null;
}

export function getOwnershipRows(contract) {
  return arr(contract?.ownership_matrix?.rows);
}

export function getActiveOwnershipRows(contract) {
  return getOwnershipRows(contract).filter((row) => row.owner_status === "OWNED");
}

export function getGapOwnershipRows(contract) {
  return getOwnershipRows(contract).filter((row) => row.owner_status === "GAP");
}

export function uniqueOwnerArtifacts(contract) {
  return [...new Set(getActiveOwnershipRows(contract).flatMap((row) => arr(row.owner_artifacts)).filter(Boolean))].sort();
}

export function artifactRoot(value, key) {
  if (value?.[key] && typeof value[key] === "object" && !Array.isArray(value[key])) return value[key];
  if (value?.artifact?.[key] && typeof value.artifact[key] === "object" && !Array.isArray(value.artifact[key])) return value.artifact[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function validateContract({ sectionSchema, ownershipMatrix, gapRegister, normalizerKey, receipts }) {
  const failures = [];
  const sections = arr(sectionSchema.sections);
  const rows = arr(ownershipMatrix.rows);
  const fields = arr(normalizerKey.fields);
  if (sectionSchema.schema_version !== "phase12_report_section_schema.v1") failures.push(`SECTION_SCHEMA_INVALID:${sectionSchema.schema_version || "missing"}`);
  if (sectionSchema.doctrine !== "Upstream phases decide. Phase 12 arranges.") failures.push("SECTION_SCHEMA_DOCTRINE_INVALID");
  if (sectionSchema.p12_model_usage !== "FORBIDDEN") failures.push("SECTION_SCHEMA_MODEL_USAGE_NOT_FORBIDDEN");
  if (sections.length !== 10) failures.push(`SECTION_SCHEMA_COUNT:${sections.length}:10`);
  if (new Set(sections.map((section) => section.section_id)).size !== sections.length) failures.push("SECTION_SCHEMA_DUPLICATE_IDS");
  if (ownershipMatrix.schema_version !== "phase12_report_field_ownership_matrix.v1") failures.push(`OWNERSHIP_MATRIX_INVALID:${ownershipMatrix.schema_version || "missing"}`);
  if (ownershipMatrix.route_contract_status !== "DEFERRED_TO_CO_P12_03") failures.push("OWNERSHIP_MATRIX_NOT_READY_FOR_CO_P12_03");
  if (rows.length !== 457) failures.push(`OWNERSHIP_ROW_COUNT:${rows.length}:457`);
  if (fields.length !== 457) failures.push(`NORMALIZER_FIELD_COUNT:${fields.length}:457`);
  if (normalizerKey.generic_humanizer_forbidden !== true) failures.push("GENERIC_HUMANIZER_NOT_FORBIDDEN");
  if (normalizerKey.title_case_fallback_forbidden !== true) failures.push("TITLE_CASE_FALLBACK_NOT_FORBIDDEN");
  if (gapRegister.summary?.active_owned_fields !== 430) failures.push(`GAP_REGISTER_ACTIVE_COUNT:${gapRegister.summary?.active_owned_fields}`);
  if (gapRegister.summary?.blocked_upstream_gap_fields !== 27) failures.push(`GAP_REGISTER_BLOCKED_COUNT:${gapRegister.summary?.blocked_upstream_gap_fields}`);
  if (receipts.co_p12_01?.status !== "PASS") failures.push("CO_P12_01_RECEIPT_NOT_PASS");
  if (receipts.co_p12_02?.status !== "PASS") failures.push("CO_P12_02_RECEIPT_NOT_PASS");
  return {
    status: failures.length ? "CONTROLLED_FAILURE" : "PASS",
    failures,
    section_count: sections.length,
    ownership_row_count: rows.length,
    normalizer_field_count: fields.length,
    active_owned_field_count: rows.filter((row) => row.owner_status === "OWNED").length,
    blocked_gap_field_count: rows.filter((row) => row.owner_status === "GAP").length
  };
}

function readYaml(file) { return yaml.load(fs.readFileSync(file, "utf8")) || {}; }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function arr(value) { return Array.isArray(value) ? value : []; }

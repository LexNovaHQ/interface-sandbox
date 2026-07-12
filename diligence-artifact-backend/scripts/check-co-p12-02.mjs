import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const parseYaml = (relative) => yaml.load(read(relative)) || {};

const fdr = parseYaml("references/registry/Diligence_Field_Derivation_Registry.yml");
const sectionDoc = parseYaml("src/phases/12-normalized-compiler/report-contract/REPORT_SECTION_SCHEMA.yml");
const normalizerDoc = parseYaml("references/registry/REPORT_NORMALIZER_KEY.yml");
const ownership = JSON.parse(read("src/phases/12-normalized-compiler/report-contract/REPORT_FIELD_OWNERSHIP_MATRIX.json"));
const gapDoc = parseYaml("src/phases/12-normalized-compiler/report-contract/UPSTREAM_REPORT_GAP_REGISTER.yml");

const fields = Array.isArray(fdr.fields) ? fdr.fields : [];
const sections = sectionDoc.report_section_schema?.sections || [];
const normalizer = normalizerDoc.report_normalizer_key || {};
const normalizerFields = normalizer.fields || [];
const ownershipRows = ownership.rows || [];
const gaps = gapDoc.upstream_report_gap_register?.gaps || [];

assert.equal(fields.length, 457);
assert.equal(new Set(fields.map((row) => row.field_id)).size, 457);
assert.equal(Number(fdr.registry?.row_count), 456);

assert.equal(sectionDoc.report_section_schema?.schema_version, "phase12_report_section_schema.v1");
assert.equal(sectionDoc.report_section_schema?.doctrine, "Upstream phases decide. Phase 12 arranges.");
assert.equal(sectionDoc.report_section_schema?.p12_model_usage, "FORBIDDEN");
assert.equal(sectionDoc.report_section_schema?.one_canonical_artifact_per_section, true);
assert.equal(sections.length, 10);
assert.deepEqual(sections.map((row) => row.section_id), ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
assert.equal(new Set(sections.map((row) => row.artifact_name)).size, 10);
assert.equal(sections.find((row) => row.section_id === "08")?.rules?.complete_exposure_and_upstream_response_required, true);
assert.equal(sections.find((row) => row.section_id === "09")?.rules?.projection_filter, "OPEN_OR_UNRESOLVED_UPSTREAM_ITEMS_ONLY");
assert.equal(sections.find((row) => row.section_id === "09")?.rules?.exposure_register_duplication_forbidden, true);

assert.equal(normalizer.schema_version, "report_normalizer_key.v1.fdr_complete");
assert.equal(normalizer.generic_humanizer_forbidden, true);
assert.equal(normalizer.title_case_fallback_forbidden, true);
assert.equal(normalizer.missing_entry_result, "NORMALIZER_KEY_ENTRY_MISSING");
assert.equal(normalizer.field_entry_count, 457);
assert.equal(normalizer.active_report_field_count, 430);
assert.equal(normalizer.upstream_gap_field_count, 27);
assert.equal(normalizerFields.length, 457);
assert.equal(ownershipRows.length, 457);

const fdrById = new Map(fields.map((row) => [row.field_id, row]));
const normalizerById = new Map(normalizerFields.map((row) => [row.field_id, row]));
const ownershipById = new Map(ownershipRows.map((row) => [row.field_id, row]));
assert.equal(normalizerById.size, 457);
assert.equal(ownershipById.size, 457);

const allowedResolvers = new Set([null, "behavior_class", "lane", "surface", "subcat", "compliance_framework", "pain_tier", "pain_depth", "velocity", "legal_status"]);
for (const [fieldId, fdrRow] of fdrById) {
  const keyRow = normalizerById.get(fieldId);
  const ownerRow = ownershipById.get(fieldId);
  assert.ok(keyRow, `normalizer missing ${fieldId}`);
  assert.ok(ownerRow, `ownership missing ${fieldId}`);
  assert.equal(keyRow.canonical_label, fdrRow.output_field, `${fieldId}:label`);
  assert.equal(keyRow.label_authority, "FDR.output_field", `${fieldId}:label authority`);
  assert.ok(allowedResolvers.has(keyRow.taxonomy_resolver ?? null), `${fieldId}:resolver`);
  assert.equal(ownerRow.output_field, fdrRow.output_field, `${fieldId}:ownership label`);
  assert.equal(ownerRow.mode, fdrRow.mode, `${fieldId}:mode`);
  if (fieldId.startsWith("DRR.") || fieldId.startsWith("FPA.")) {
    assert.equal(keyRow.report_eligibility, "UPSTREAM_GAP", fieldId);
    assert.equal(ownerRow.owner_status, "GAP", fieldId);
    assert.equal(ownerRow.source_path_binding_status, "NO_UPSTREAM_OWNER", fieldId);
  } else {
    assert.equal(keyRow.report_eligibility, "ACTIVE", fieldId);
    assert.equal(ownerRow.owner_status, "OWNED", fieldId);
    assert.equal(ownerRow.source_path_binding_status, "UNBOUND_PENDING_CO_P12_03_ROUTE_CONTRACT", fieldId);
    assert.ok(Array.isArray(ownerRow.owner_artifacts) && ownerRow.owner_artifacts.length > 0, fieldId);
  }
}

assert.equal(ownership.route_contract_status, "DEFERRED_TO_CO_P12_03");
assert.equal(ownership.p12_substantive_derivation_forbidden, true);
assert.equal(ownershipRows.filter((row) => row.owner_status === "GAP").length, 27);
assert.equal(ownershipRows.filter((row) => row.field_id.startsWith("DRR.")).length, 17);
assert.equal(ownershipRows.filter((row) => row.field_id.startsWith("FPA.")).length, 10);
assert.equal(ownershipRows.filter((row) => row.field_id.startsWith("DAP.") && !row.owner_artifacts.includes("data_provenance_profile_semantic_batch_gate")).length, 0);

const gapById = new Map(gaps.map((row) => [row.gap_id, row]));
for (const id of ["P12.GAP.FDR.ROW_COUNT", "P12.GAP.DRR.OWNER", "P12.GAP.FPA.OWNER", "P12.GAP.ROUTE_BINDINGS"]) assert.ok(gapById.has(id), id);
assert.equal(gapById.get("P12.GAP.FDR.ROW_COUNT").declared_row_count, 456);
assert.equal(gapById.get("P12.GAP.FDR.ROW_COUNT").parsed_unique_row_count, 457);
assert.equal(gapById.get("P12.GAP.DRR.OWNER").field_count, 17);
assert.equal(gapById.get("P12.GAP.FPA.OWNER").field_count, 10);
assert.equal(gapDoc.upstream_report_gap_register?.summary?.active_owned_fields, 430);
assert.equal(gapDoc.upstream_report_gap_register?.summary?.blocked_upstream_gap_fields, 27);

console.log("CO-P12-02 report schema, normalizer, ownership and gap authority: PASS");

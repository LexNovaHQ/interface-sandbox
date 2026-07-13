import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const base = path.join(root, "public/interface-diligence/diligence-system");
const fixtureSource = fs.readFileSync(path.join(base, "report-visual-fixture-data.js"), "utf8");
const fixtureHtml = fs.readFileSync(path.join(base, "report-visual-fixture.html"), "utf8");
const expectedOrder = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
const expected = Object.freeze({
  baseline: { exposureRows: 12, openReviewItems: 3, status: "PASS" },
  dense: { exposureRows: 24, openReviewItems: 12, status: "PASS" },
  limitations: { exposureRows: 12, openReviewItems: 7, status: "PASS_WITH_LIMITATION" }
});

const fingerprints = {};
for (const [scenario, contract] of Object.entries(expected)) {
  const payload = executeFixture(scenario);
  assert.equal(payload.schema_version, "renderer_payload.v14.co_p12_05", `${scenario}: schema`);
  assert.equal(payload.renderer_source, "report_manifest_clean_profiles", `${scenario}: renderer source`);
  assert.deepEqual(payload.sections.map((section) => section.section_id), expectedOrder, `${scenario}: section order`);
  assert.equal(payload.presentation_contract.table_rows_per_page, 10, `${scenario}: table page size`);
  assert.equal(payload.presentation_contract.deck_cards_per_page, 5, `${scenario}: deck page size`);
  assert.equal(payload.presentation_contract.print_full_dataset, true, `${scenario}: print full dataset`);
  assert.equal(payload.presentation_contract.activity_classification_paths.collapse_primary_and_overlay_forbidden, true, `${scenario}: activity separation`);
  assert.equal(payload.validation_status, contract.status, `${scenario}: status`);

  const exposureRows = sectionRows(payload, "08");
  assert.equal(exposureRows.length, contract.exposureRows, `${scenario}: exposure row count`);
  assert.ok(exposureRows.some((row) => row.identity?.stream_scope === "Primary Sector"), `${scenario}: primary exposure stream`);
  assert.ok(exposureRows.some((row) => row.identity?.stream_scope === "Capability Overlay"), `${scenario}: overlay exposure stream`);
  assert.ok(exposureRows.every((row) => row.presentation_order && row.identity?.material_status), `${scenario}: exposure presentation spine`);

  const openItems = findField(payload, "09", /open_review_items/i)?.value || [];
  assert.equal(openItems.length, contract.openReviewItems, `${scenario}: open review count`);
  assert.ok(openItems.every((item) => item.remaining_uncertainty && item.local_counsel_review_route), `${scenario}: open review shape`);

  const obligations = findField(payload, "06", /OBLIGATION_REGISTER/i)?.value?.rows || [];
  assert.equal(obligations.length, 3, `${scenario}: obligation fixture rows`);
  assert.deepEqual([...new Set(obligations.map((row) => row.source_scope))].sort(), ["Capability Overlay", "Primary Sector"], `${scenario}: obligation streams`);

  const legalFields = fieldsForSection(payload, "07").map((field) => field.field_id);
  for (const prefix of ["LGC.STACK.", "LGC.ART.", "LGC.NOT.", "LGC.CTRL.", "LGC.IND.", "LGC.XREF.", "LGC.ABS.", "LGC.LIM."]) {
    assert.ok(legalFields.some((fieldId) => String(fieldId).startsWith(prefix)), `${scenario}: missing ${prefix}`);
  }

  const snapshot = {
    scenario,
    status: payload.validation_status,
    section_order: payload.sections.map((section) => section.section_id),
    exposure_rows: exposureRows.map((row) => ({
      id: row.identity?.threat_id,
      stream: row.identity?.stream_scope,
      status: row.identity?.material_status,
      pain: row.presentation_order?.pain_category_label,
      subcategory: row.presentation_order?.subcategory_order
    })),
    open_review_items: openItems.map((item) => ({
      warning_type: item.warning_type,
      route: item.local_counsel_review_route
    })),
    obligation_rows: obligations.map((row) => ({
      ref: row.obligation_reference,
      source: row.source_scope,
      posture: row.control_posture_status
    }))
  };
  fingerprints[scenario] = crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

assert.notEqual(fingerprints.baseline, fingerprints.dense, "baseline and dense fixture fingerprints must differ");
assert.notEqual(fingerprints.baseline, fingerprints.limitations, "baseline and limitations fixture fingerprints must differ");
assert.notEqual(fingerprints.dense, fingerprints.limitations, "dense and limitations fixture fingerprints must differ");

for (const token of [
  "report-visual-fixture-data.js",
  "report-pagination.js",
  "report-print.js",
  "report-document-runtime.js",
  "report-sections-01-03.js",
  "report-section-04.js",
  "report-section-05.js",
  "report-sections-06-07.js",
  "report-section-08.js",
  "report-sections-09-10.js",
  "report-accessibility.js",
  "report-document.js",
  "interface-report-sections-08-10.css",
  "interface-report-responsive-accessible.css",
  "interface-report-print.css",
  "scenario=baseline",
  "scenario=dense",
  "scenario=limitations"
]) assert.ok(fixtureHtml.includes(token), `visual fixture HTML missing ${token}`);

const scriptOrder = [
  "report-visual-fixture-data.js",
  "report-pagination.js",
  "report-print.js",
  "report-document-runtime.js",
  "report-sections-01-03.js",
  "report-section-04.js",
  "report-section-05.js",
  "report-sections-06-07.js",
  "report-section-08.js",
  "report-sections-09-10.js",
  "report-accessibility.js",
  "report-document.js"
];
let previousIndex = -1;
for (const file of scriptOrder) {
  const index = fixtureHtml.indexOf(file);
  assert.ok(index > previousIndex, `visual fixture script order invalid at ${file}`);
  previousIndex = index;
}

console.log(JSON.stringify({
  check: "interface-report-visual-regression",
  status: "PASS",
  fixture_scenarios: Object.keys(expected),
  expected,
  fingerprints,
  pixel_snapshot_dependency: "NONE",
  regression_mode: "DETERMINISTIC_BROWSER_FIXTURE_PAYLOAD_AND_STRUCTURAL_CONTRACT"
}, null, 2));

function executeFixture(scenario) {
  const context = {
    window: { location: { search: `?scenario=${scenario}` } },
    URLSearchParams
  };
  vm.runInNewContext(fixtureSource, context, { filename: "report-visual-fixture-data.js" });
  return JSON.parse(JSON.stringify(context.window.InterfaceReportFixturePayload));
}

function fieldsForSection(payload, sectionId) {
  const section = payload.sections.find((entry) => entry.section_id === sectionId);
  return (section?.subsections || []).flatMap((subsection) => subsection.fields || []);
}

function findField(payload, sectionId, pattern) {
  return fieldsForSection(payload, sectionId).find((field) => pattern.test(String(field.field_id || field.label || "")));
}

function sectionRows(payload, sectionId) {
  const rows = [];
  for (const field of fieldsForSection(payload, sectionId)) {
    if (Array.isArray(field.value) && field.value.every((value) => value && typeof value === "object" && !Array.isArray(value))) {
      rows.push(...field.value);
    }
  }
  return rows;
}

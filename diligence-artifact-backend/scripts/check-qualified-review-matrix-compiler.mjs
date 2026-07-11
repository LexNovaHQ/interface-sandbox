import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildQualifiedReviewSystemArtifacts } from "../src/qualified-review-system/branch.js";
import { loadQualifiedReviewMatrix } from "../src/qualified-review-system/qualified-review-matrix-loader.js";
import { NORMALIZED_SECTION_KEYS } from "../src/phases/11-normalized-compiler/normalized-profiler-m9-section6-v4.js";
import { NORMALIZED_SECTION_ARTIFACT_NAMES } from "../src/constants.js";

const EXPECTED_QR_ARTIFACT_KEYS = ["qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber"];
const LEGACY_MAP_FILE = "qualified-review" + "-map.js";
const RETIRED_LEGAL_SIGNAL_OBJECT = "qualified_review_legal_signals";
const ALLOWED_ROOTS = new Set([...NORMALIZED_SECTION_ARTIFACT_NAMES, "PRIVATE_INPUT", "MARKET_NORM"]);

const matrix = loadQualifiedReviewMatrix();
assert.equal(matrix.questions.length, 79);
for (const row of matrix.questions) {
  for (const selector of [row.selector, row.secondary_selector].filter(Boolean)) {
    const root = String(selector).split(".")[0];
    assert.equal(ALLOWED_ROOTS.has(root), true, `${row.question_id}: bad selector root ${root}`);
    assert.equal(String(selector).includes(RETIRED_LEGAL_SIGNAL_OBJECT), false, `${row.question_id}: retired legal signal object selector`);
  }
}

const run = { run_id: "TEST-QR-MATRIX", target: "Example", root_url: "https://example.com", status: "COMPLETE" };
const normalized_report_manifest = { run_id: run.run_id, target: run.target, target_url: run.root_url, validation_status: "LOCKED", section_order: NORMALIZED_SECTION_KEYS };
const normalized_compiler_output = { normalized_report_manifest };
for (const sectionId of NORMALIZED_SECTION_KEYS) normalized_compiler_output[`normalized_section__${sectionId}`] = { section_id: sectionId, artifact_name: `normalized_section__${sectionId}`, section_title: sectionId, subsections: [] };
hydrateFixtureFromMatrix({ matrix, normalized_compiler_output });

const output = buildQualifiedReviewSystemArtifacts({ run, normalized_compiler_output, source_artifacts: { legal_signal_derivation_profile: { ignored_by_review_matrix: true } } });
const handoff = output.qualified_review_handoff;
const renderer = output.qualified_review_renderer_payload;
const questions = handoff.question_handoff.questions;
assert.equal(handoff.question_handoff_validation.status, "PASS");
assert.equal(questions.length, 79);
assert.equal(handoff.section_pages.length, 4);
assert.deepEqual(Object.keys(handoff.qr_artifacts).sort(), EXPECTED_QR_ARTIFACT_KEYS.slice().sort());
for (const key of EXPECTED_QR_ARTIFACT_KEYS) assert.ok(output[key], `standalone output missing ${key}`);
assert.equal(questions.every((q) => q.suggested_answer), true);
assert.equal(questions.filter((q) => q.prefill_source === "private_demo_assumption").length, 5);
assert.equal(questions.filter((q) => q.prefill_source === "diligence_normalized_section").length >= 70, true);
assert.equal(questions.some((q) => q.prefill_source === "backend_artifact"), false);
assert.equal(questions.some((q) => q.prefill_source === "reviewer_input"), false);
assert.equal(questions.some((q) => q.source_table_default_status === "Need to fill"), false);
assert.equal(questions.some((q) => String(q.source_dependency || "").includes(RETIRED_LEGAL_SIGNAL_OBJECT)), false);
assert.equal(renderer.questions.length, 79);
assert.equal(renderer.question_sections.length, 4);
assert.equal(renderer.render_contract.matrix_source, "qualified-review-matrix.yml");
for (const question of questions) assert.notEqual(question.source_dependency, LEGACY_MAP_FILE);
const compilerSource = readFileSync(new URL("../src/qualified-review-system/matrix-artifact-compiler.js", import.meta.url), "utf8");
assert.equal(compilerSource.includes(LEGACY_MAP_FILE), false);
assert.equal(compilerSource.includes(RETIRED_LEGAL_SIGNAL_OBJECT), false);
console.log("qualified review matrix compiler: PASS");

function hydrateFixtureFromMatrix({ matrix, normalized_compiler_output }) {
  for (const row of matrix.questions) {
    for (const selector of [row.selector, row.secondary_selector].filter(Boolean)) {
      if (!String(selector).startsWith("normalized_section__")) continue;
      const root = selector.split(".")[0];
      const sectionId = root.replace(/^normalized_section__/, "");
      const subsectionId = selector.match(/subsections\[subsection_id=([^\]]+)\]/)?.[1];
      const fieldId = selector.match(/fields\[field_id=([^\]]+)\]/)?.[1];
      if (!sectionId || !subsectionId || !fieldId) continue;
      const section = normalized_compiler_output[`normalized_section__${sectionId}`];
      const subsection = findOrCreateSubsection(section, subsectionId);
      const value = buildFixtureValue(selector, row);
      const existing = subsection.fields.find((field) => field.field_id === fieldId);
      if (existing) existing.value = mergeFixtureValue(existing.value, value);
      else subsection.fields.push({ field_id: fieldId, label: fieldId, value });
    }
  }
}
function findOrCreateSubsection(section, subsectionId) { let subsection = section.subsections.find((item) => item.subsection_id === subsectionId); if (!subsection) { subsection = { subsection_id: subsectionId, subsection_title: subsectionId, fields: [] }; section.subsections.push(subsection); } return subsection; }
function buildFixtureValue(selector, row) { const sample = sampleAnswer(row); const valuePath = selector.split(".value")[1] || ""; if (!valuePath) return sample; if (valuePath.startsWith("[*].")) return [{ [valuePath.slice(4)]: sample }]; const keys = valuePath.replace(/^\./, "").split(".").filter(Boolean); return keys.reduceRight((nested, key) => ({ [key]: nested }), sample); }
function sampleAnswer(row) { const options = Array.isArray(row.answer_options) ? row.answer_options : String(row.answer_options || "").split(",").map((value) => value.trim()).filter(Boolean); if ((row.answer_type === "dropdown" || row.answer_type === "select") && options.length) return options.includes("Yes") ? "Yes" : options[0]; return row.demo_prefill_value || "Visible public signal for checker fixture"; }
function mergeFixtureValue(left, right) { if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) ? left : right; if (left && right && typeof left === "object" && typeof right === "object") return { ...left, ...right }; return left || right; }
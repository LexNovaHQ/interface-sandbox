import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { NORMALIZED_SECTION_ARTIFACT_NAMES } from "../constants.js";

const MATRIX_URL = new URL("./matrix/qualified-review-matrix.yml", import.meta.url);
const ALLOWED_NORMALIZED_ROOTS = new Set(NORMALIZED_SECTION_ARTIFACT_NAMES);
const ALLOWED_OTHER_ROOTS = new Set(["PRIVATE_INPUT", "MARKET_NORM"]);
let cached;

export function loadQualifiedReviewMatrix() {
  if (cached) return cached;
  const envelope = JSON.parse(readFileSync(MATRIX_URL, "utf8"));
  const raw = gunzipSync(Buffer.from(envelope.payload, "base64")).toString("utf8");
  const digest = createHash("sha256").update(raw).digest("hex");
  if (envelope.matrix?.sha256 && digest !== envelope.matrix.sha256) throw new Error("QR_MATRIX_DIGEST_MISMATCH");
  const matrix = JSON.parse(raw);
  validateMatrix(matrix);
  cached = Object.freeze({ ...matrix, questions: Object.freeze(matrix.questions.map(Object.freeze)), sections: Object.freeze(matrix.sections.map(Object.freeze)) });
  return cached;
}

export function validateMatrix(matrix = {}) {
  const errors = [];
  const questions = Array.isArray(matrix.questions) ? matrix.questions : [];
  const sections = Array.isArray(matrix.sections) ? matrix.sections : [];
  if (matrix.matrix?.row_count !== 79 || questions.length !== 79) errors.push(`row_count:${questions.length}`);
  if (matrix.matrix?.section_count !== 4 || sections.length !== 4) errors.push(`section_count:${sections.length}`);
  const sectionIds = new Set(sections.map((section) => section.section_id).filter(Boolean));
  const sectionArtifacts = new Set(sections.map((section) => section.section_artifact).filter(Boolean));
  for (const required of ["qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber"]) if (!sectionArtifacts.has(required)) errors.push(`section_artifact_missing:${required}`);
  questions.forEach((row, index) => {
    const id = `QR-${String(index + 1).padStart(3, "0")}`;
    if (row.question_id !== id) errors.push(`sequence:${row.question_id}:expected_${id}`);
    if (!row.section_id || !sectionIds.has(row.section_id)) errors.push(`${id}:bad_section_id:${row.section_id || "missing"}`);
    if (!row.section_artifact || !sectionArtifacts.has(row.section_artifact)) errors.push(`${id}:bad_section_artifact:${row.section_artifact || "missing"}`);
    if (!row.selector) errors.push(`${id}:selector_missing`);
    if (!row.demo_prefill_value) errors.push(`${id}:demo_missing`);
    if (!row.lawyer_question) errors.push(`${id}:question_missing`);
    if (!row.answer_type) errors.push(`${id}:answer_type_missing`);
    for (const selector of [row.selector, row.secondary_selector].filter(Boolean)) {
      const root = selectorRoot(selector);
      if (root.startsWith("normalized_section__") && !ALLOWED_NORMALIZED_ROOTS.has(root)) errors.push(`${id}:invalid_normalized_selector_root:${root}`);
      if (!root.startsWith("normalized_section__") && !ALLOWED_OTHER_ROOTS.has(root)) errors.push(`${id}:invalid_selector_root:${root}`);
    }
  });
  if (errors.length) throw new Error(`QR_MATRIX_INVALID:${errors.join("|")}`);
  return { status: "PASS", question_count: questions.length, section_count: sections.length };
}

function selectorRoot(selector) {
  return String(selector || "").split(".")[0].trim();
}

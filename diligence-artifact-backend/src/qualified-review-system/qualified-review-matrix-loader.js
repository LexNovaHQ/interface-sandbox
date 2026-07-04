import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";

const MATRIX_URL = new URL("./matrix/qualified-review-matrix.yml", import.meta.url);
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
  questions.forEach((row, index) => {
    const id = `QR-${String(index + 1).padStart(3, "0")}`;
    if (row.question_id !== id) errors.push(`sequence:${row.question_id}:expected_${id}`);
    if (!row.selector) errors.push(`${id}:selector_missing`);
    if (!row.demo_prefill_value) errors.push(`${id}:demo_missing`);
    if (!row.lawyer_question) errors.push(`${id}:question_missing`);
    if (!row.answer_type) errors.push(`${id}:answer_type_missing`);
  });
  if (errors.length) throw new Error(`QR_MATRIX_INVALID:${errors.join("|")}`);
  return { status: "PASS", question_count: questions.length, section_count: sections.length };
}

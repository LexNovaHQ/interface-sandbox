import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderLegalExposureReport, validateRenderedLegalExposureReportHtml } from "../src/report-renderer/legalExposureReportRendererV2.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(runtimeRoot, ".runtime-e2e-cache");

const inputPath = process.env.STAGE9_REPORT_DATA_PATH || path.join(cacheDir, "stage9-report-data.json");
const htmlPath = process.env.STAGE9_HTML_REPORT_PATH || path.join(cacheDir, "legal-exposure-diligence-report.html");
const validationPath = process.env.STAGE9_HTML_VALIDATION_PATH || path.join(cacheDir, "stage9-html-render-validation.json");

const REQUIRED_SECTION_MARKERS = [
  "Matter Overview",
  "Executive Summary",
  "Target Profile",
  "Product / Activity / IP Profile",
  "Data Risk, Provenance & Controls",
  "Legal Document & Control Review",
  "Exposure Findings",
  "Implications & Remediation Path",
  "Evidence Gaps & Clarification Points",
  "Methodology, Limitations & Review Notes",
  "Forensic Appendices",
  "Appendix A — Evidence Source Index",
  "Appendix B — Feature Ledger",
  "Appendix C — Data Provenance Ledger",
  "Appendix D — Legal / Control Ledger",
  "Appendix E — Exposure Forensic Ledger",
  "Appendix F — Quality Review / Correction Trace"
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function htmlIncludesMarker(html, marker) {
  return String(html || "").includes(marker) || String(html || "").includes(escapeHtml(marker));
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required input not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function countMatches(value, pattern) {
  const matches = String(value || "").match(pattern);
  return matches ? matches.length : 0;
}

function validateRenderedHtml(html) {
  const errors = [];
  const warnings = [];
  const renderedSections = countMatches(html, /class="report-section/g);
  const tables = countMatches(html, /<table/g);
  const rendererLanguageValidation = validateRenderedLegalExposureReportHtml(html);

  if (!html || typeof html !== "string") errors.push("Renderer did not return an HTML string.");
  if (!html.includes("<!doctype html>")) errors.push("Rendered output is missing <!doctype html>.");
  for (const marker of REQUIRED_SECTION_MARKERS) {
    if (!htmlIncludesMarker(html, marker)) errors.push(`Rendered output is missing locked report section marker: ${marker}`);
  }
  if (renderedSections !== 11) errors.push(`Expected 11 locked report sections; found ${renderedSections}.`);
  if (tables < 6) warnings.push(`Rendered output has only ${tables} table(s); locked appendices may be thin.`);
  if (!html.includes("Review-Ready") && !html.includes("qualified counsel")) warnings.push("Rendered output may be missing explicit counsel-review / Review-Ready disclaimer language.");
  if (!rendererLanguageValidation.ok) errors.push(`Visible HTML language violations: ${rendererLanguageValidation.visible_language_violations.join(", ")}`);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    html_bytes: Buffer.byteLength(html, "utf8"),
    rendered_sections: renderedSections,
    tables,
    visible_language_violations: rendererLanguageValidation.visible_language_violations,
    required_section_markers: REQUIRED_SECTION_MARKERS
  };
}

console.log(JSON.stringify({ ok: true, phase: "stage_9_html_renderer_start", input_path: inputPath, html_path: htmlPath, validation_path: validationPath }, null, 2));

const stage9Artifact = readJson(inputPath);
const html = renderLegalExposureReport(stage9Artifact);
const validation = validateRenderedHtml(html);

fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
fs.writeFileSync(htmlPath, html, "utf8");
writeJson(validationPath, { ...validation, artifact_type: "stage9_html_render_validation", input_path: inputPath, html_path: htmlPath, generated_at: new Date().toISOString() });

console.log(JSON.stringify({ ok: validation.ok, phase: "stage_9_html_renderer_complete", html_path: htmlPath, validation_path: validationPath, html_bytes: validation.html_bytes, rendered_sections: validation.rendered_sections, errors: validation.errors, warnings: validation.warnings }, null, 2));

if (!validation.ok) process.exit(1);

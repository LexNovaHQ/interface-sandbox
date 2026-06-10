import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderLegalExposureReportHtml, validateRenderedHtml } from "../src/report-renderer/legalExposureReportRenderer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(runtimeRoot, ".runtime-e2e-cache");

const inputPath = process.env.STAGE9_REPORT_DATA_PATH || path.join(cacheDir, "stage9-report-data.json");
const htmlPath = process.env.STAGE9_HTML_REPORT_PATH || path.join(cacheDir, "legal-exposure-diligence-report.html");
const validationPath = process.env.STAGE9_HTML_VALIDATION_PATH || path.join(cacheDir, "stage9-html-render-validation.json");

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

console.log(JSON.stringify({
  ok: true,
  phase: "stage_9_html_renderer_start",
  input_path: inputPath,
  html_path: htmlPath,
  validation_path: validationPath,
}, null, 2));

const stage9Artifact = readJson(inputPath);
const html = renderLegalExposureReportHtml(stage9Artifact);
const validation = validateRenderedHtml(html);

fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
fs.writeFileSync(htmlPath, html, "utf8");
writeJson(validationPath, {
  ...validation,
  artifact_type: "stage9_html_render_validation",
  input_path: inputPath,
  html_path: htmlPath,
  generated_at: new Date().toISOString(),
});

console.log(JSON.stringify({
  ok: validation.ok,
  phase: "stage_9_html_renderer_complete",
  html_path: htmlPath,
  validation_path: validationPath,
  html_bytes: validation.html_bytes,
  errors: validation.errors,
}, null, 2));

if (!validation.ok) {
  process.exitCode = 1;
}

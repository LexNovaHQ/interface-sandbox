#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const outputRoot = path.resolve(process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), ".runtime-e2e-cache", "full-runtime-audit"));
const stageId = String(process.argv[2] || "").toLowerCase();

function readJson(name) {
  const filePath = path.join(outputRoot, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing audit artifact for ${stageId}: ${name}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function appendSummary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, "utf8");
  }
}

function assertIoSummaries(stageKey) {
  const input = readJson(`${stageKey}-input-summary.json`);
  const output = readJson(`${stageKey}-output-summary.json`);
  if (input.stage_id !== stageKey || input.direction !== "input") fail(`${stageKey}-input-summary.json has invalid identity.`);
  if (output.stage_id !== stageKey || output.direction !== "output") fail(`${stageKey}-output-summary.json has invalid identity.`);
  if (output.ok === false) fail(`${stageKey}-output-summary.json reports ok=false.`);
  return { input, output };
}

function pass(stageName, artifact, notes = "") {
  const line = `### ${stageName}\n\n| Status | Artifact | Notes |\n|---|---|---|\n| PASS | ${artifact} | ${notes} |\n`;
  appendSummary(line);
  console.log(`::notice title=${stageName}::PASS ${artifact} ${notes}`);
}

function fail(message) {
  throw new Error(`[${stageId}] ${message}`);
}

function assertStage1() {
  const { input, output } = assertIoSummaries("stage1");
  const artifact = readJson("01-source-discovery.json");
  const sourceCount = Number(artifact.source_count || 0);
  if (artifact.ok !== true) fail("01-source-discovery.json ok must be true.");
  if (sourceCount <= 0) fail("Stage 1 source discovery produced zero sources.");
  if (Number(output.source_count || 0) !== sourceCount) fail("Stage 1 output summary source_count does not match artifact.");
  pass("Stage 1 - Source Discovery", "stage1-input-summary.json + stage1-output-summary.json + 01-source-discovery.json", `target=${input.target_url || "unknown"}; sources=${sourceCount}`);
}

function assertStage2() {
  const { output } = assertIoSummaries("stage2");
  const artifact = readJson("02-source-capture.json");
  const records = asArray(artifact.raw_footprint?.source_records);
  if (artifact.ok !== true) fail("02-source-capture.json ok must be true.");
  if (!records.length) fail("Stage 2 source capture produced zero raw_footprint.source_records.");
  const capturedText = records.filter((record) => hasText(record.text?.clean_text_lossless));
  if (!capturedText.length) fail("Stage 2 source capture produced no clean_text_lossless records.");
  if (Number(output.records || 0) !== records.length) fail("Stage 2 output summary record count does not match artifact.");
  pass("Stage 2 - Source Capture", "stage2-input-summary.json + stage2-output-summary.json + 02-source-capture.json", `records=${records.length}; lossless=${capturedText.length}`);
}

function assertStage3() {
  const { output } = assertIoSummaries("stage3");
  const bundle = readJson("03-evidence-refiner-source-bundle.json");
  const junction = readJson("04-evidence-junction.json");
  const records = asArray(bundle.raw_footprint?.source_records);
  if (!records.length) fail("Stage 3 source bundle has zero raw_footprint.source_records.");
  if (!junction || typeof junction !== "object" || !Object.keys(junction).length) fail("Stage 3 evidence junction artifact is empty.");
  const productRecords = records.filter((record) => record.source_family === "product_family");
  const losslessProductRecords = productRecords.filter((record) => hasText(record.text?.clean_text_lossless));
  if (!losslessProductRecords.length) fail("Stage 3 did not preserve product_family clean_text_lossless for Stage 5 custody.");
  if (Number(output.product_family_lossless_records || 0) !== losslessProductRecords.length) fail("Stage 3 output summary product_family_lossless_records does not match artifact.");
  pass("Stage 3 - Evidence Refiner / Source Bundle", "stage3-input-summary.json + stage3-output-summary.json + 03/04 artifacts", `records=${records.length}; product_lossless=${losslessProductRecords.length}`);
}

function assertStage4() {
  const { output } = assertIoSummaries("stage4");
  const profile = readJson("05-target-profile.json");
  if (!profile || typeof profile !== "object" || !Object.keys(profile).length) fail("Stage 4 target profile artifact is empty.");
  const brandName = profile.identity?.brand_name || profile.identity?.legal_name || profile.company_name || "unknown";
  if (!output.brand_name && !output.domain) fail("Stage 4 output summary lacks brand/domain fields.");
  pass("Stage 4 - Company / Target Profile", "stage4-input-summary.json + stage4-output-summary.json + 05-target-profile.json", `target=${brandName}`);
}

switch (stageId) {
  case "1":
  case "stage1":
    assertStage1();
    break;
  case "2":
  case "stage2":
    assertStage2();
    break;
  case "3":
  case "stage3":
    assertStage3();
    break;
  case "4":
  case "stage4":
    assertStage4();
    break;
  default:
    fail("Usage: node scripts/assert-live-audit-stage.mjs <1|2|3|4>");
}

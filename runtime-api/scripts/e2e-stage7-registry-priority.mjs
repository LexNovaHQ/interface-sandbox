#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { buildPriorityRowPlan, mergePriorityRows, validatePriorityMerge } from "../src/diligence/priorityRowPlanner.js";

const stage6CachePath = process.env.STAGE6_E2E_CACHE_PATH || path.join(process.cwd(), ".runtime-e2e-cache", "stage6-legal-stack-review.json");
const registryPath = process.env.REGISTRY_RUNTIME_PATH || path.join(process.cwd(), "..", "data", "runtime", "registry.runtime.json");
const batchSize = Number(process.env.STAGE7_PRIORITY_BATCH_SIZE || process.env.STAGE7_BATCH_SIZE || 8);

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}

function readJsonFile(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} file missing`, { filePath });
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rowId(row, index) {
  return String(row?.Threat_ID || row?.threat_id || `ROW_${index + 1}`).trim();
}

function rowName(row) {
  return String(row?.Threat_Name || row?.threat_name || "Unnamed row").trim();
}

function normalizeRow(row, index) {
  return { ...row, Threat_ID: rowId(row, index), Threat_Name: rowName(row), _registry_index: index, _registry_position: index + 1 };
}

const cache = readJsonFile(stage6CachePath, "Stage 6 cache");
const registry = readJsonFile(registryPath, "Registry runtime");
const rows = Array.isArray(registry?.threats) ? registry.threats.map(normalizeRow) : [];
if (!rows.length) fail("Registry runtime contains no rows", { registryPath });

const plan = buildPriorityRowPlan({ rows, profile: cache.target_feature_profile, batchSize });
const merged = mergePriorityRows({ modelRows: [], deterministicRows: plan.deterministic_rows, sourceRows: rows });
const validation = validatePriorityMerge({ mergedRows: merged, sourceRows: rows });

console.log(JSON.stringify({ ok: true, phase: "stage_7_priority_planner_shell", counts: plan.counts, routing_summary: plan.routing_summary, validation }, null, 2));

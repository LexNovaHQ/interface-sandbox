#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");
const at = (filePath) => path.join(repoRoot, filePath);
const read = (filePath) => fs.readFileSync(at(filePath), "utf8");
const exists = (filePath) => fs.existsSync(at(filePath));

function fail(message, detail = null) {
  console.error(JSON.stringify({ ok: false, phase: "stage6_canon_audit", error: message, detail }, null, 2));
  process.exit(1);
}

function assert(condition, message, detail = null) {
  if (!condition) fail(message, detail);
}

function parseJson(filePath) {
  try {
    return JSON.parse(read(filePath));
  } catch (error) {
    fail(`Could not parse ${filePath}`, { error: error.message });
  }
}

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

function resolveRef(schema, ref) {
  if (!ref || typeof ref !== "string" || !ref.startsWith("#/$defs/")) return null;
  return schema.$defs?.[ref.slice("#/$defs/".length)] || null;
}

function schemaProperty(schema, propertyName) {
  const property = schema.properties?.[propertyName];
  return property?.$ref ? resolveRef(schema, property.$ref) : property;
}

const activeFiles = [
  "data/schemas/stage6Review.schema.json",
  "runtime-api/src/diligence/stage6CanonicalVocabulary.js",
  "runtime-api/src/diligence/guardrails/stage6ReviewGuardrail.js",
  "runtime-api/src/diligence/stage6aLegalCartographyBuilder.js",
  "runtime-api/src/diligence/stage6aSemanticClassificationPacketBuilder.js",
  "runtime-api/src/diligence/stage6aSemanticClassificationNormalizer.js",
  "runtime-api/src/diligence/stage6aLegalCartographyMerge.js",
  "runtime-api/src/diligence/stage6aSemanticClassificationRunner.js",
  "runtime-api/src/diligence/stage6bDataProvenanceBuilder.js",
  "runtime-api/src/diligence/stage6bSemanticPacketBuilder.js",
  "runtime-api/src/diligence/stage6bDataProvenanceNormalizer.js",
  "runtime-api/src/diligence/stage6bDataProvenanceMerge.js",
  "runtime-api/src/diligence/stage6bDataProvenanceRunner.js",
  "runtime-api/src/diligence/stage6IntegratedHandoffBuilder.js",
  "runtime-api/src/diligence/stageRunnerLocked.js",
  "runtime-api/src/diligence/stageConfigs.js",
  "runtime-api/scripts/stage6-e2e-utils.mjs",
  "runtime-api/scripts/e2e-stage6a-legal-cartography.mjs",
  "runtime-api/scripts/e2e-stage6b-data-provenance.mjs",
  "runtime-api/scripts/e2e-stage6-integrated-handoff.mjs",
  "functions/_prompts/diligence-v2/03A_LEGAL_CARTOGRAPHY.prompt.md",
  "functions/_prompts/diligence-v2/03B_DATA_PROVENANCE.prompt.md"
];

for (const file of activeFiles) assert(exists(file), "Required Stage 6 active file is missing.", { file });

const schema = parseJson("data/schemas/stage6Review.schema.json");
assert(schema.additionalProperties === false, "stage6Review schema must be closed.");
assert(schema.properties?.legal_document_cartography, "stage6Review schema missing legal_document_cartography.");
assert(schema.properties?.data_provenance_profile, "stage6Review schema missing data_provenance_profile.");
assert(schema.$defs?.dataFlowProfileItem?.additionalProperties === false, "dataFlowProfileItem must be closed.");
const stage7NavigationIndexSchema = schemaProperty(schema, "stage7_navigation_index");
assert(stage7NavigationIndexSchema?.additionalProperties === false, "stage7_navigation_index must be closed.", { resolved_ref: schema.properties?.stage7_navigation_index?.$ref || null });

const configText = read("runtime-api/src/diligence/stageConfigs.js");
assert(countOccurrences(configText, "stage6b_data_provenance:") === 1, "Stage 6B config must be registered exactly once.");
assert(configText.includes("stage6a_legal_document_cartography"), "Stage 6A config missing.");
assert(configText.includes("stage6_integrated_handoff"), "Integrated Stage 6 config missing.");

const runnerText = read("runtime-api/src/diligence/stageRunnerLocked.js");
assert(runnerText.includes("runStage6ALegalCartography"), "Stage runner does not route Stage 6A.");
assert(runnerText.includes("runStage6BDataProvenance"), "Stage runner does not route Stage 6B.");
assert(runnerText.includes("STAGE6_COMPONENT_NOT_IMPLEMENTED"), "Stage 6 component dispatch must fail explicitly for unimplemented components.");

const pkg = parseJson("runtime-api/package.json");
for (const script of [
  "audit:stage6:canon",
  "e2e:stage6a:legal-cartography",
  "e2e:stage6b:data-provenance",
  "e2e:stage6:integrated-handoff"
]) assert(pkg.scripts?.[script], "Stage 6 package script missing.", { script });
assert(pkg.dependencies?.cors === "^2.8.5", "runtime-api/package.json dependency drift: cors must match package-lock.");
assert(pkg.dependencies?.helmet === "^8.1.1", "runtime-api/package.json dependency drift: helmet must match package-lock.");

console.log(JSON.stringify({
  ok: true,
  phase: "stage6_canon_audit",
  checks: {
    schema_closed: true,
    active_files_present: true,
    stage6a_route_registered: true,
    stage6b_route_registered_once: true,
    integrated_handoff_registered: true,
    scripts_registered: true,
    runtime_dependencies_match_lockfile: true,
    stage7_navigation_index_closed: true
  }
}, null, 2));

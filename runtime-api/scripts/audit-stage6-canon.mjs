#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

function exists(filePath) {
  return fs.existsSync(path.join(repoRoot, filePath));
}

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

function findRetiredDialectHits() {
  const scannedFiles = [
    "data/schemas/stage6Review.schema.json",
    "runtime-api/src/diligence/stage6CanonicalVocabulary.js",
    "runtime-api/src/diligence/stage6bDataProvenanceBuilder.js",
    "runtime-api/src/diligence/stage6bSemanticPacketBuilder.js",
    "runtime-api/src/diligence/stage6bDataProvenanceNormalizer.js",
    "runtime-api/src/diligence/stage6bDataProvenanceMerge.js",
    "runtime-api/src/diligence/stage6bDataProvenanceRunner.js",
    "runtime-api/src/diligence/stageRunnerLocked.js",
    "runtime-api/src/diligence/stageConfigs.js",
    "functions/_prompts/diligence-v2/03B_DATA_PROVENANCE.prompt.md"
  ];
  const retiredPatterns = [
    { name: "flow_id", pattern: /\bflow_id\b/ },
    { name: "profile_summary_signals", pattern: /\bprofile_summary_signals\b/ },
    { name: "section_refs", pattern: /\bsection_refs\b/ },
    { name: "stage6aLegalCartography_schema", pattern: /\bstage6aLegalCartography\.schema\.json\b/ },
    { name: "stage6aModelOverlay_schema", pattern: /\bstage6aModelOverlay\.schema\.json\b/ },
    { name: "legalStackReview_schema", pattern: /\blegalStackReview\.schema\.json\b/ }
  ];
  const hits = [];
  for (const file of scannedFiles) {
    const text = read(file);
    for (const retired of retiredPatterns) {
      if (retired.pattern.test(text)) hits.push({ file, retired_key: retired.name });
    }
  }
  return hits;
}

const schema = parseJson("data/schemas/stage6Review.schema.json");
assert(schema.properties?.data_provenance_profile, "stage6Review schema is missing data_provenance_profile.");
assert(schema.$defs?.dataFlowProfileItem?.additionalProperties === false, "dataFlowProfileItem must be closed with additionalProperties=false.");
for (const key of ["data_subject", "data_category", "processing", "role_allocation", "regime_relevance", "notice", "consent_basis", "rights", "processor_chain", "transfer_location", "retention_deletion_ai", "security_accountability", "source_trace"]) {
  assert(schema.$defs.dataFlowProfileItem.required.includes(key), `dataFlowProfileItem is missing required block ${key}.`);
}

for (const retiredSchema of ["data/schemas/stage6aLegalCartography.schema.json", "data/schemas/stage6aModelOverlay.schema.json", "data/schemas/legalStackReview.schema.json"]) {
  assert(!exists(retiredSchema), "Retired Stage 6 schema file must not exist.", { retiredSchema });
}

for (const requiredFile of [
  "runtime-api/src/diligence/stage6bDataProvenanceBuilder.js",
  "runtime-api/src/diligence/stage6bSemanticPacketBuilder.js",
  "runtime-api/src/diligence/stage6bDataProvenanceNormalizer.js",
  "runtime-api/src/diligence/stage6bDataProvenanceMerge.js",
  "runtime-api/src/diligence/stage6bDataProvenanceRunner.js",
  "functions/_prompts/diligence-v2/03B_DATA_PROVENANCE.prompt.md"
]) {
  assert(exists(requiredFile), "Required 6B canonical file is missing.", { requiredFile });
}

const configText = read("runtime-api/src/diligence/stageConfigs.js");
assert(configText.includes("stage6b_data_provenance"), "Stage 6B config is not registered.");
const runnerText = read("runtime-api/src/diligence/stageRunnerLocked.js");
assert(runnerText.includes("runStage6BDataProvenance"), "Stage runner does not import or call the Stage 6B runner.");
assert(runnerText.includes("STAGE6_COMPONENT_NOT_IMPLEMENTED"), "Stage 6 component dispatch must fail explicitly for unimplemented components.");

const promptBundleScript = read("scripts/generate-diligence-prompt-bundle.mjs");
assert(promptBundleScript.includes("03B_DATA_PROVENANCE.prompt.md"), "Prompt bundle generator does not include 03B.");
const promptIndex = read("functions/_prompts/diligence-v2/PROMPT_INDEX.md");
assert(promptIndex.includes("stage6b_data_provenance"), "Prompt index does not include Stage 6B routing.");

const normalizerText = read("runtime-api/src/diligence/stage6bDataProvenanceNormalizer.js");
assert(normalizerText.includes("drop_data_flow_classification_unknown_ref"), "Stage 6B normalizer must reject unknown data_flow_id classifications.");
const mergeText = read("runtime-api/src/diligence/stage6bDataProvenanceMerge.js");
assert(mergeText.includes("buildStage6BFeatureToDataFlowIndex"), "Stage 6B finalizer must derive feature_to_data_flow_index.");
assert(mergeText.includes("buildStage6BDataSignalIndex"), "Stage 6B finalizer must derive data_signal_index.");

const retiredHits = findRetiredDialectHits();
assert(retiredHits.length === 0, "Retired Stage 6 dialect keys found in active files.", retiredHits);

console.log(JSON.stringify({
  ok: true,
  phase: "stage6_canon_audit",
  checks: {
    schema_closed_data_flow_profile: true,
    stage6b_route_registered: true,
    stage6b_hybrid_modules_present: true,
    retired_schema_files_absent: true,
    retired_dialect_hits: 0
  }
}, null, 2));

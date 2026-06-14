#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");

function read(filePath) { return fs.readFileSync(path.join(repoRoot, filePath), "utf8"); }
function exists(filePath) { return fs.existsSync(path.join(repoRoot, filePath)); }
function fail(message, detail = null) { console.error(JSON.stringify({ ok: false, phase: "stage6_canon_audit", error: message, detail }, null, 2)); process.exit(1); }
function assert(condition, message, detail = null) { if (!condition) fail(message, detail); }
function parseJson(filePath) { try { return JSON.parse(read(filePath)); } catch (error) { fail(`Could not parse ${filePath}`, { error: error.message }); } }
function countOccurrences(text, needle) { return text.split(needle).length - 1; }

const requiredFiles = [
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
  "runtime-api/src/diligence/stageRunnerLocked.js",
  "runtime-api/src/diligence/stageConfigs.js",
  "runtime-api/scripts/stage6-e2e-utils.mjs",
  "runtime-api/scripts/e2e-stage6a-legal-cartography.mjs",
  "runtime-api/scripts/e2e-stage6b-data-provenance.mjs",
  "runtime-api/scripts/e2e-stage6-integrated-handoff.mjs",
  "functions/_prompts/diligence-v2/03A_LEGAL_CARTOGRAPHY.prompt.md",
  "functions/_prompts/diligence-v2/03B_DATA_PROVENANCE.prompt.md"
];

const dialectScanFiles = requiredFiles.filter((file) => !file.endsWith("stage6CanonicalVocabulary.js") && !file.endsWith("stage6ReviewGuardrail.js"));

function retiredHits() {
  const patterns = [
    { name: "source_text_classification", pattern: /\bsource_text_classification\b/ },
    { name: "stage6_section_ref", pattern: /\bstage6_section_ref\b/ },
    { name: "stage6_legal_section_ref", pattern: /\bstage6_legal_section_ref\b/ },
    { name: "document_relationship_signal", pattern: /\bdocument_relationship_signal\b/ },
    { name: "feature_without_control_section", pattern: /\bfeature_without_control_section\b/ },
    { name: "stage6a_model_overlay_v1", pattern: /\bstage6a_model_overlay_v1\b/ },
    { name: "ALLOWED_ENUMS", pattern: /\bALLOWED_ENUMS\b/ },
    { name: "section_path", pattern: /\bsection_path\b/ },
    { name: "heading_text", pattern: /\bheading_text\b/ },
    { name: "heading_level", pattern: /\bheading_level\b/ },
    { name: "document_section", pattern: /\bdocument_section\b/ },
    { name: "stage6aLegalCartography_schema", pattern: /\bstage6aLegalCartography\.schema\.json\b/ },
    { name: "stage6aModelOverlay_schema", pattern: /\bstage6aModelOverlay\.schema\.json\b/ },
    { name: "legalStackReview_schema", pattern: /\blegalStackReview\.schema\.json\b/ }
  ];
  const hits = [];
  for (const file of dialectScanFiles) {
    const text = read(file);
    for (const retired of patterns) if (retired.pattern.test(text)) hits.push({ file, retired_key: retired.name });
  }
  return hits;
}

const schema = parseJson("data/schemas/stage6Review.schema.json");
assert(schema.additionalProperties === false, "stage6Review schema must be closed.");
assert(schema.properties?.legal_document_cartography, "stage6Review schema missing 6A legal_document_cartography.");
assert(schema.properties?.data_provenance_profile, "stage6Review schema missing 6B data_provenance_profile.");
assert(schema.$defs?.dataFlowProfileItem?.additionalProperties === false, "dataFlowProfileItem must be closed.");
assert(schema.properties?.stage7_navigation_index?.additionalProperties === false, "stage7_navigation_index must be closed.");
for (const retiredSchema of ["data/schemas/stage6aLegalCartography.schema.json", "data/schemas/stage6aModelOverlay.schema.json", "data/schemas/legalStackReview.schema.json"]) assert(!exists(retiredSchema), "Retired Stage 6 schema file must not exist.", { retiredSchema });
for (const requiredFile of requiredFiles) assert(exists(requiredFile), "Required Stage 6 active file is missing.", { requiredFile });

const configText = read("runtime-api/src/diligence/stageConfigs.js");
assert(countOccurrences(configText, "stage6b_data_provenance:") === 1, "Stage 6B config must be registered exactly once.");
assert(configText.includes("stage6a_legal_document_cartography"), "Stage 6A config missing.");
assert(configText.includes("stage6_integrated_handoff"), "Integrated Stage 6 config missing.");

const runnerText = read("runtime-api/src/diligence/stageRunnerLocked.js");
assert(runnerText.includes("runStage6ALegalCartography"), "Stage runner does not route Stage 6A.");
assert(runnerText.includes("runStage6BDataProvenance"), "Stage runner does not route Stage 6B.");
assert(runnerText.includes("STAGE6_COMPONENT_NOT_IMPLEMENTED"), "Stage 6 component dispatch must fail explicitly for unimplemented components.");

const guardrailText = read("runtime-api/src/diligence/guardrails/stage6ReviewGuardrail.js");
for (const code of ["STAGE6_LEGACY_FIELD_PRESENT", "STAGE6_COMPONENT_CROSS_CONTAMINATION", "STAGE6_EMPTY_6A_WITH_LEGAL_SOURCES", "STAGE6_EMPTY_6B_WITH_PROVENANCE_SEEDS", "STAGE6_MICRO_LEGAL_UNIT_PRESENT"] ) assert(guardrailText.includes(code), "Stage 6 guardrail is missing required code.", { code });

const pkg = parseJson("runtime-api/package.json");
for (const script of ["audit:stage6:canon", "e2e:stage6a:legal-cartography", "e2e:stage6b:data-provenance", "e2e:stage6:integrated-handoff"]) assert(pkg.scripts?.[script], "Stage 6 package script missing.", { script });
assert(pkg.dependencies?.cors === "^2.8.5", "runtime-api/package.json dependency drift: cors must match package-lock.");
assert(pkg.dependencies?.helmet === "^8.1.1", "runtime-api/package.json dependency drift: helmet must match package-lock.");

const workflow = read(".github/workflows/runtime-stage4-stage5-audit.yml");
for (const needle of ["Run Stage 6 Canon Audit", "Run Stage 6A Legal Cartography E2E", "Run Stage 6B Data Provenance E2E", "Run Stage 6 Integrated Handoff E2E", "runtime-stage1-stage10-audit-cache"]) assert(workflow.includes(needle), "Stage 6 workflow lane/artifact missing.", { needle });

const hits = retiredHits();
assert(hits.length === 0, "Retired Stage 6 dialect keys found in active files.", hits);

console.log(JSON.stringify({ ok: true, phase: "stage6_canon_audit", checks: { single_schema_closed: true, retired_schema_files_absent: true, guardrail_present: true, stage6a_route_registered: true, stage6b_route_registered_once: true, audit_lanes_registered: true, workflow_lanes_registered: true, runtime_dependencies_match_lockfile: true, retired_dialect_hits: 0 } }, null, 2));

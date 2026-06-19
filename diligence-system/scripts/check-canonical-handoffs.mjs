import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const REL_SCRIPT = path.relative(ROOT, __filename).replace(/\\/g, "/");

const SKIP_DIRS = new Set(["node_modules", ".runs", "audit-artifacts", ".git"]);
const ALIAS_NORMALIZER = "mechanical-output-validator.js";

const canonicalPackages = [
  "source_discovery_handoff.phase_packages.target_profile_package",
  "source_discovery_handoff.phase_packages.feature_profile_package",
  "source_discovery_handoff.phase_packages.legal_cartography_package",
  "source_discovery_handoff.phase_packages.data_provenance_package",
  "source_discovery_handoff.phase_packages.registry_support_package",
  "source_discovery_handoff.phase_packages.final_source_coverage_package"
];

const staleTerms = [
  "target_feature_package",
  "legal_governance_evidence_package",
  "legal_governance_absence_package",
  "data_provenance_packages",
  "legal_governance_lossless_evidence_package"
];

const rootLevelPackagePaths = [
  ["target", "profile", "package"],
  ["final", "source", "coverage", "package"],
  ["target", "feature", "package"],
  ["legal", "governance", "evidence", "package"],
  ["legal", "governance", "absence", "package"],
  ["data", "provenance", "packages"],
  ["legal", "governance", "lossless", "evidence", "package"]
].map((parts) => `source_discovery_handoff.${parts.join("_")}`);

const primaryOutputs = [
  "hybrid_extraction_manifest",
  "extraction_forensic_ledger",
  "source_discovery_handoff",
  "source_discovery_forensic_ledger",
  "source_discovery_trace",
  "target_profile",
  "target_profile_forensic_ledger",
  "target_profile_trace",
  "target_feature_profile",
  "feature_profile_forensic_ledger",
  "feature_function_trace",
  "legal_cartography_index",
  "legal_cartography_forensic_ledger",
  "legal_cartography_trace",
  "target_data_provenance_profile",
  "data_provenance_forensic_ledger",
  "data_provenance_trace",
  "target_exposure_profile",
  "exposure_profile_forensic_ledger",
  "registry_evaluation_trace",
  "final_output_handoff",
  "final_output_forensic_ledger",
  "final_compiler_trace"
];

const nodeSequence = ["S0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "RENDERER"];

const phaseRunnerRequirements = [
  "P1.source_discovery_handoff.phase_packages.target_profile_package",
  "P1.source_discovery_handoff.phase_packages.final_source_coverage_package",
  "P1.source_discovery_handoff.phase_packages.feature_profile_package",
  "P1.source_discovery_handoff.phase_packages.legal_cartography_package",
  "P1.source_discovery_handoff.absence_records",
  "P1.source_discovery_handoff.access_failed_sources",
  "P1.source_discovery_handoff.phase_packages.data_provenance_package",
  "P1.source_discovery_handoff.phase_packages.registry_support_package"
];

const docExpectations = {
  "08_PHASE_STACK_EXECUTION_MAP.md": [
    "requires: [source_discovery_handoff.phase_packages.target_profile_package, source_discovery_handoff.phase_packages.final_source_coverage_package]",
    "requires: [target_profile, source_discovery_handoff.phase_packages.feature_profile_package]",
    "requires: [target_profile, target_feature_profile, source_discovery_handoff.phase_packages.legal_cartography_package, source_discovery_handoff.absence_records, source_discovery_handoff.access_failed_sources]",
    "requires: [target_profile, target_feature_profile, legal_cartography_index, source_discovery_handoff.phase_packages.data_provenance_package]",
    "requires: [registry_key, ai_threat_registry, target_profile, target_feature_profile, legal_cartography_index, target_data_provenance_profile, source_discovery_handoff.phase_packages.registry_support_package]",
    "requires: [target_profile, target_feature_profile, legal_cartography_index, target_data_provenance_profile, target_exposure_profile, prior_phase_ledgers, prior_phase_limitations]",
    "requires: [final_output_handoff]"
  ],
  "09_OUTPUT_HANDOFF_CONTRACT.md": [
    "- phase_packages",
    "phase_packages:",
    "- target_profile_package",
    "- feature_profile_package",
    "- legal_cartography_package",
    "- data_provenance_package",
    "- registry_support_package",
    "- final_source_coverage_package",
    "- source_discovery_handoff.absence_records",
    "- source_discovery_handoff.access_failed_sources"
  ],
  "03_TARGET_FEATURE_PROFILE.md": ["feature_profile_package"],
  "04_LEGAL_CARTOGRAPHY_INDEX.md": [
    "legal_cartography_package",
    "source_discovery_handoff.absence_records",
    "source_discovery_handoff.access_failed_sources"
  ],
  "06_EXPOSURE_PROFILE_REGISTRY_LEDGER.md": ["registry_support_package"],
  "10_RUNTIME_AUDIT_CHECKLIST.md": ["phase_6_registry_support_package_present"]
};

const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
      continue;
    }
    if (entry.isFile()) files.push(path.join(dir, entry.name));
  }
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function isTextFile(file) {
  return /\.(css|csv|html|js|json|md|mjs|txt|ya?ml)$/i.test(file);
}

function lineNumbers(content, needle) {
  return content.split(/\r?\n/).flatMap((line, index) =>
    line.includes(needle) ? [index + 1] : []
  );
}

function pushMissing(errors, file, token) {
  errors.push({ type: "missing_required_token", file, token });
}

walk(ROOT);

const readable = files.filter(isTextFile).map((file) => ({
  path: file,
  rel: rel(file),
  content: fs.readFileSync(file, "utf8")
}));

const combinedByRel = new Map(readable.map((file) => [file.rel, file.content]));
const combinedAll = readable.map((file) => file.content).join("\n");
const errors = [];

for (const file of readable) {
  for (const term of staleTerms) {
    if (!file.content.includes(term)) continue;
    const allowed = file.rel === ALIAS_NORMALIZER || file.rel === REL_SCRIPT;
    if (!allowed) {
      errors.push({
        type: "stale_alias_outside_normalizer",
        file: file.rel,
        term,
        lines: lineNumbers(file.content, term)
      });
    }
  }

  for (const forbiddenPath of rootLevelPackagePaths) {
    if (file.content.includes(forbiddenPath)) {
      errors.push({
        type: "root_level_handoff_package_path",
        file: file.rel,
        path: forbiddenPath,
        lines: lineNumbers(file.content, forbiddenPath)
      });
    }
  }
}

for (const token of canonicalPackages) {
  if (!combinedAll.includes(token)) errors.push({ type: "missing_canonical_package_path", token });
}

for (const token of primaryOutputs) {
  if (!combinedAll.includes(token)) errors.push({ type: "missing_primary_output_name", token });
}

for (const [file, tokens] of Object.entries(docExpectations)) {
  const content = combinedByRel.get(file);
  if (!content) {
    errors.push({ type: "missing_contract_file", file });
    continue;
  }
  for (const token of tokens) {
    if (!content.includes(token)) pushMissing(errors, file, token);
  }
}

const phaseRunner = combinedByRel.get("phase-runner.js") || "";
for (const token of phaseRunnerRequirements) {
  if (!phaseRunner.includes(token)) pushMissing(errors, "phase-runner.js", token);
}
if (!phaseRunner.includes("registry_support_package: buildP6EvidencePackage(upstream)")) {
  pushMissing(errors, "phase-runner.js", "registry_support_package: buildP6EvidencePackage(upstream)");
}
if (!phaseRunner.includes("absence_records: handoff.absence_records || null")) {
  pushMissing(errors, "phase-runner.js", "absence_records: handoff.absence_records || null");
}

const runStore = combinedByRel.get("run-store.js") || "";
for (const node of nodeSequence) {
  if (!runStore.includes(`"${node}"`)) pushMissing(errors, "run-store.js", `"${node}"`);
}

const runnerSequence = [
  'S0: "P1"',
  'P1: "P2"',
  'P2: "P3"',
  'P3: "P4"',
  'P4: "P5"',
  'P5: "P6"',
  'P6: "P7"',
  'P7: "RENDERER"',
  "RENDERER: null"
];
for (const token of runnerSequence) {
  if (!phaseRunner.includes(token)) pushMissing(errors, "phase-runner.js", token);
}

const renderer = combinedByRel.get("renderer.js") || "";
if (!renderer.includes("final_output_handoff")) pushMissing(errors, "renderer.js", "final_output_handoff");
if (staleTerms.some((term) => renderer.includes(term))) {
  errors.push({ type: "renderer_contains_stale_alias" });
}

const ui = combinedByRel.get("public/diligence-ui.js") || "";
if (!ui.includes('fetch("/api/diligence/jobs"')) {
  pushMissing(errors, "public/diligence-ui.js", 'fetch("/api/diligence/jobs"');
}
if (ui.includes("/api/diligence/run")) {
  errors.push({ type: "ui_uses_legacy_run_endpoint", file: "public/diligence-ui.js" });
}

const result = {
  ok: errors.length === 0,
  checked_files: readable.length,
  skipped_dirs: [...SKIP_DIRS].filter((name) => name !== ".git"),
  canonical_packages: canonicalPackages.length,
  primary_outputs: primaryOutputs.length,
  errors
};

console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);

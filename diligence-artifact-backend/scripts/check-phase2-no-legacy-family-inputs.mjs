import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ACTIVE_PHASE2_INPUT_FILES = Object.freeze([
  "src/runtime/contracts/artifact-permissions.contract.js",
  "src/runtime/contracts/pipeline.contract.js",
  "src/runtime/contracts/central-phase.contract.js",
  "src/runtime/contracts/artifacts.contract.js",
  "src/phase-contracts.js",
  "src/phases/02-cartography-index/cartography-index.contract.js",
  "src/phases/02-cartography-index/cartography-index.runner.js",
  "src/phases/02-legal-cartography-index/legal-cartography-index.contract.js",
  "src/phases/02-legal-cartography-index/services/legal-cartography-deterministic-map.builder.js",
  "src/phases/02-legal-cartography-index/services/legal-cartography-hybrid-compiler.js",
  "src/phases/02-legal-cartography-index/orchestrators/legal-cartography-hybrid.orchestrator.js",
  "src/phases/07-data-provenance-profile/layer2-data-privacy-navigation-index-builder.js",
  "src/phases/07-data-provenance-profile/data-provenance-profile.contract.js",
  "src/phases/07-data-provenance-profile/data-provenance-profile.runner.js",
  "src/runtime/services/pipeline.service.js",
  "src/runtime/services/artifacts.service.js",
  "agent-packages/agent_2b_m9/AGENT2B_M9_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_2b_m9/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md",
  "agent-packages/agent_2b_m9/04_M9_LEGAL_CARTOGRAPHY_RUNTIME_SYNC_PATCHED.md",
  "agent-packages/agent_2b_m9/M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md",
  "agent-packages/agent_2b_m9/M9_C_REINVESTIGATION.md",
  "agent-packages/agent_2b_m9/M9_HYBRID_COMPILER_CONTRACT.md",
  "agent-packages/agent_2b_m9/00_VALIDATOR_RULES_INTEGRATED.md",
  "agent-packages/agent_2b_m9/AGENT2B_M9_PACKET_MANIFEST.json",
  "agent-packages/agent_2b_m9/AGENT2B_M9_PACKET_VALIDATION.json"
]);
const FORBIDDEN = Object.freeze(["lossless_family__", "legacy family adapter", "legacy-family", "compatibility.adapter", "CompatibilityArtifacts", "compatibility_adapter", "old family input contracts and legacy compatibility adapters", "loaded legal-governance lossless family"]);
const REQUIRED = Object.freeze(["phase1_common_roots_plus_legal_doc_artifacts", "legal_doc_inventory", "legal_doc_{DOC_TYPE}", "lossless_root__privacy_data_processing", "data_source_routes", "required_data_source_route_ids"]);
const activeText = ACTIVE_PHASE2_INPUT_FILES.map((file) => [file, fs.readFileSync(path.join(ROOT, file), "utf8")]);
for (const [file, text] of activeText) for (const marker of FORBIDDEN) assert.equal(text.includes(marker), false, `${file} contains forbidden legacy-family input marker: ${marker}`);
const combined = activeText.map(([, text]) => text).join("\n");
for (const marker of REQUIRED) assert.ok(combined.includes(marker), `active Phase 2/DPNI input contract missing required marker: ${marker}`);
console.log("Phase 2 no legacy family input validator: PASS");

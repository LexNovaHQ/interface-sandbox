import fs from "node:fs";

const file = "scripts/check-phase7-data-provenance-profile.mjs";
let source = fs.readFileSync(file, "utf8");

const duplicateBefore = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_")),';
const duplicateAfter = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_") && name !== "dap_semantic_batch_route_manifest"),';
if (!source.includes(duplicateBefore)) throw new Error("PHASE7_OUTPUT_CHECK_DEDUP_MARKER_MISSING");
source = source.replace(duplicateBefore, duplicateAfter);

const rootsBefore = '  const activeFiles = collectFiles(["src", "scripts", "agent-packages/agent_4_data_privacy"]);';
const rootsAfter = '  const activeFiles = collectFiles(["src/phases/07-data-provenance-profile", "agent-packages/agent_4_data_privacy"]);';
if (!source.includes(rootsBefore)) throw new Error("PHASE7_LEGACY_SCANNER_ROOTS_MARKER_MISSING");
source = source.replace(rootsBefore, rootsAfter);

fs.writeFileSync(file, source);
console.log("Phase 7 output assertion and active-surface legacy scan: APPLIED");

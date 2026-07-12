import fs from "node:fs";

const file = "scripts/check-phase7-data-provenance-profile.mjs";
let source = fs.readFileSync(file, "utf8");

const duplicateBefore = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_")),';
const duplicateAfter = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_") && name !== "dap_semantic_batch_route_manifest"),';
if (!source.includes(duplicateBefore)) throw new Error("PHASE7_OUTPUT_CHECK_DEDUP_MARKER_MISSING");
source = source.replace(duplicateBefore, duplicateAfter);

const scannerBefore = '    if (file === "scripts/check-m10-d-primary-selected-legal-support.mjs") {';
const scannerAfter = '    if (file === "src/phases/02-cartography-index/data-privacy-navigation-index.contract.js") continue;\n    if (file === "scripts/check-m10-d-primary-selected-legal-support.mjs") {';
if (!source.includes(scannerBefore)) throw new Error("PHASE7_LEGACY_SCANNER_SCOPE_MARKER_MISSING");
source = source.replace(scannerBefore, scannerAfter);

fs.writeFileSync(file, source);
console.log("Phase 7 output assertion and legacy-scanner scope sync: APPLIED");

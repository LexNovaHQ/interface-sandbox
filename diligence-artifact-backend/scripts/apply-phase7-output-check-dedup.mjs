import fs from "node:fs";

const file = "scripts/check-phase7-data-provenance-profile.mjs";
let source = fs.readFileSync(file, "utf8");
const before = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_")),';
const after = '...PHASE7_DAP_LAYER4_ARTIFACT_NAMES.filter((name) => name.startsWith("dap_semantic_batch_") && name !== "dap_semantic_batch_route_manifest"),';
if (!source.includes(before)) throw new Error("PHASE7_OUTPUT_CHECK_DEDUP_MARKER_MISSING");
source = source.replace(before, after);
fs.writeFileSync(file, source);
console.log("Phase 7 output assertion route-manifest dedup: APPLIED");

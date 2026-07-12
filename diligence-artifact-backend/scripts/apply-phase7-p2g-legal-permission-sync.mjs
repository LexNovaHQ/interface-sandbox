import fs from "node:fs";

const file = "src/runtime/contracts/artifact-permissions.contract.js";
let source = fs.readFileSync(file, "utf8");
const before = 'const DATA_PROVENANCE_MINIMAL_READS = Object.freeze([ART.targetProfile, ART.domainDerivationProfile, ART.activityInventory, ART.activityProfile, ...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, ART.dataPrivacyNavigationIndex, ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES, ART.dapSemanticBatchValidationPattern]);';
const after = 'const DATA_PROVENANCE_MINIMAL_READS = Object.freeze([ART.targetProfile, ART.domainDerivationProfile, ART.activityInventory, ART.activityProfile, ...DOMAIN_GATE_RUNTIME_ARTIFACT_NAMES, ART.dataPrivacyNavigationIndex, ART.legalCartographyIndex, ART.legalSignalDerivationProfile, ...PHASE7_DAP_LAYER4_ARTIFACT_NAMES, ...PHASE7_DAP_LAYER5_ARTIFACT_NAMES, ART.dapSemanticBatchValidationPattern]);';
if (!source.includes(before)) throw new Error("PHASE7_P2G_LEGAL_PERMISSION_MARKER_MISSING");
source = source.replace(before, after);
fs.writeFileSync(file, source);
console.log("Phase 7 Agent 4 routed legal permissions: APPLIED");

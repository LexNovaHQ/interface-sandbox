import fs from "node:fs";

const file = "src/runtime/contracts/artifact-permissions.contract.js";
let source = fs.readFileSync(file, "utf8");
const before = source;

const readsPattern = /const DATA_PROVENANCE_MINIMAL_READS = Object\.freeze\(\[([^\]]*)\]\);/;
const match = source.match(readsPattern);
if (!match) throw new Error("PHASE7_P2G_LEGAL_PERMISSION_MARKER_MISSING");
const body = match[1];
for (const required of ["ART.legalCartographyIndex", "ART.legalSignalDerivationProfile"]) {
  if (!body.includes(required)) {
    const replacement = `const DATA_PROVENANCE_MINIMAL_READS = Object.freeze([${required}, ${body}]);`;
    source = source.replace(readsPattern, replacement);
  }
}

const finalMatch = source.match(readsPattern);
const finalBody = finalMatch?.[1] || "";
for (const required of ["ART.legalCartographyIndex", "ART.legalSignalDerivationProfile"]) {
  if (!finalBody.includes(required)) throw new Error(`PHASE7_P2G_LEGAL_PERMISSION_REQUIRED_TOKEN_MISSING:${required}`);
}
if ((finalBody.match(/ART\.legalCartographyIndex/g) || []).length !== 1) throw new Error("PHASE7_P2G_LEGAL_PERMISSION_DUPLICATE:legalCartographyIndex");
if ((finalBody.match(/ART\.legalSignalDerivationProfile/g) || []).length !== 1) throw new Error("PHASE7_P2G_LEGAL_PERMISSION_DUPLICATE:legalSignalDerivationProfile");

if (source !== before) {
  fs.writeFileSync(file, source);
  console.log("Phase 7 Agent 4 routed legal permissions: APPLIED");
} else {
  console.log("Phase 7 Agent 4 routed legal permissions: ALREADY_SYNCED");
}

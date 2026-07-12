import fs from "node:fs";

import "./apply-phase6-behavior-forensics-sync.mjs";
import "./apply-phase7-p2g-legal-permission-sync.mjs";
import "./apply-phase7-output-check-dedup.mjs";
import "./apply-phase7-registry-metadata-scope-sync.mjs";
import "./apply-phase1-8-phase2g-boundary-sync.mjs";

fs.rmSync("scripts/apply-phase1-8-phase2g-boundary-sync.mjs", { force: true });

console.log("CO-P12-05 required upstream repairs: APPLIED");

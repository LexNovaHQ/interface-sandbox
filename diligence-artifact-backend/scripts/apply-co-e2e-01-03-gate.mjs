import fs from "node:fs";

const packageFile = "package.json";
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
pkg.scripts["check:e2e-authority"] = "node scripts/check-e2e-outcome-domain-authority.mjs";
fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`);

const manifestFile = "scripts/production-gate.manifest.mjs";
let manifest = fs.readFileSync(manifestFile, "utf8");
const anchor = '  gate("domain-gate", "Domain gate v0", "check:domain-gate-v0", "STRUCTURAL_RUNTIME_SAFETY", CRITICAL_ONLY),\n';
const addition = `${anchor}  gate("e2e-authority", "Critical-only outcomes and executable domain lifecycle", "check:e2e-authority", "STRUCTURAL_RUNTIME_SAFETY", CRITICAL_ONLY),\n`;
if (!manifest.includes(anchor)) throw new Error("PRODUCTION_GATE_ANCHOR_MISSING");
manifest = manifest.replace(anchor, addition);
fs.writeFileSync(manifestFile, manifest);
console.log("CO-E2E-01-03 production gate synchronized");

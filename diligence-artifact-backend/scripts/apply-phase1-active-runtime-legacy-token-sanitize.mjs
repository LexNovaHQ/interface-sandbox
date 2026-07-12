import fs from "node:fs";

const files = [
  "src/phases/01-source-discovery/source-discovery.contract.js",
  "src/phases/01-source-discovery/services/url-manifest.service.js",
  "src/phases/01-source-discovery/services/source-extraction.service.js",
  "src/phases/01-source-discovery/services/source-family-handoff.service.js",
  "src/phases/01-source-discovery/validators/source-discovery.validator.js",
  "src/runtime/contracts/artifact-permissions.contract.js"
];

const retiredRootMap = Object.freeze({
  "lossless_root__about_company": "lossless_root__company_identity",
  "lossless_root__legal_identity_notice": "lossless_root__company_identity",
  "lossless_root__operator_entity_signals": "lossless_root__company_identity",
  "lossless_root__supporting_company_signals": "lossless_root__company_identity",
  "lossless_root__technical_docs_api_developer": "lossless_root__technical_docs_api",
  "lossless_root__security_trust": "lossless_root__security_trust_compliance",
  "lossless_root__trust_compliance": "lossless_root__security_trust_compliance",
  "lossless_root__support_help": "lossless_root__support_help_resources"
});

let changed = false;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let source = fs.readFileSync(file, "utf8");
  const before = source;
  source = source
    .replaceAll("lossless_family__", "lossless_root__")
    .replaceAll("ROOT_FAMILY", "ROOT");
  for (const [retired, active] of Object.entries(retiredRootMap)) source = source.replaceAll(retired, active);
  if (source !== before) {
    fs.writeFileSync(file, source);
    changed = true;
  }
}

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  for (const retired of ["lossless_family__", "ROOT_FAMILY", ...Object.keys(retiredRootMap)]) {
    if (source.includes(retired)) throw new Error(`PHASE1_ACTIVE_RUNTIME_RETIRED_TOKEN_REMAINS:${file}:${retired}`);
  }
}

console.log(`Phase 1 active runtime legacy token sanitize: ${changed ? "APPLIED" : "ALREADY_CLEAN"}`);

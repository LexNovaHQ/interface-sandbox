import fs from "node:fs";

const files = [
  "src/phases/01-source-discovery/source-discovery.contract.js",
  "src/phases/01-source-discovery/services/url-manifest.service.js",
  "src/phases/01-source-discovery/services/source-extraction.service.js",
  "src/phases/01-source-discovery/services/source-family-handoff.service.js",
  "src/phases/01-source-discovery/validators/source-discovery.validator.js",
  "src/runtime/contracts/artifact-permissions.contract.js"
];

let changed = false;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let source = fs.readFileSync(file, "utf8");
  const before = source;
  source = source
    .replaceAll("lossless_family__", "lossless_root__")
    .replaceAll("ROOT_FAMILY", "ROOT");
  if (source !== before) {
    fs.writeFileSync(file, source);
    changed = true;
  }
}

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  for (const retired of ["lossless_family__", "ROOT_FAMILY"]) {
    if (source.includes(retired)) throw new Error(`PHASE1_ACTIVE_RUNTIME_RETIRED_TOKEN_REMAINS:${file}:${retired}`);
  }
}

console.log(`Phase 1 active runtime legacy token sanitize: ${changed ? "APPLIED" : "ALREADY_CLEAN"}`);

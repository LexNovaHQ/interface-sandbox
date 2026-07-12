import fs from "node:fs";

const file = "src/phases/07-data-provenance-profile/dap-registry-derivation-rule-compiler.js";
let source = fs.readFileSync(file, "utf8");
const before = '  if (metadata.declared_row_count && metadata.declared_row_count !== 427) errors.push("registry_declared_row_count_not_427");';
const after = '  if (metadata.declared_row_count && metadata.declared_row_count < expectedCount) errors.push(`registry_declared_row_count_below_dap_scope:${metadata.declared_row_count}:${expectedCount}`);';
if (source.includes(before)) {
  source = source.replace(before, after);
  fs.writeFileSync(file, source);
  console.log("Phase 7 registry metadata validation scoped to DAP ownership: APPLIED");
} else if (source.includes(after)) {
  console.log("Phase 7 registry metadata validation scoped to DAP ownership: ALREADY_SYNCED");
} else {
  throw new Error("PHASE7_REGISTRY_METADATA_SCOPE_MARKER_MISSING");
}

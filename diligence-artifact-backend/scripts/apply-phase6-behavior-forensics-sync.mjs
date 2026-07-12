import fs from "node:fs";

const file = "src/phases/_shared/forensics/profile-forensics.shared.js";
let source = fs.readFileSync(file, "utf8");
const before = source;
source = source
  .replaceAll("M8_DETERMINISTIC_FORENSIC_TRACE_CONTRACT_V2_SPLIT_TAXONOMY", "M8_DETERMINISTIC_FORENSIC_TRACE_CONTRACT_V3_BEHAVIOR_CLASS")
  .replaceAll("package_scoped_archetype_codes", "package_scoped_behavior_class_codes")
  .replaceAll("archetype_derivation_ledger", "behavior_class_derivation_ledger")
  .replaceAll("archetype_derivation_basis", "behavior_class_derivation_basis")
  .replaceAll("archetype_codes", "behavior_class_codes");
if (source === before) throw new Error("PHASE6_BEHAVIOR_CLASS_FORENSIC_SYNC_NO_CHANGES");
for (const retired of ["archetype_codes", "archetype_derivation_basis", "package_scoped_archetype_codes", "archetype_derivation_ledger"]) {
  if (source.includes(retired)) throw new Error(`PHASE6_BEHAVIOR_CLASS_FORENSIC_SYNC_RETIRED_TOKEN:${retired}`);
}
for (const required of ["behavior_class_codes", "behavior_class_derivation_basis", "package_scoped_behavior_class_codes", "behavior_class_derivation_ledger"]) {
  if (!source.includes(required)) throw new Error(`PHASE6_BEHAVIOR_CLASS_FORENSIC_SYNC_REQUIRED_TOKEN_MISSING:${required}`);
}
fs.writeFileSync(file, source);
console.log("Phase 6 deterministic forensic Behavior Class sync: APPLIED");

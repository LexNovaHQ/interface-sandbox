export const PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS = Object.freeze({
  SEMANTIC_LED: 103,
  SEMANTIC_LED_WITH_DETERMINISTIC_SUPPORT: 36,
  DETERMINISTIC_FINAL: 11
});

export const PHASE7_DAP_SEMANTIC_BATCH_PLAN = Object.freeze([
  batch(1, ["EXEC"], 8),
  batch(2, ["LIM"], 9),
  batch(3, ["PARTY"], 8),
  batch(4, ["ROLE"], 8),
  batch(5, ["FLOW"], 10),
  batch(6, ["OBJ"], 9),
  batch(7, ["AUTH"], 8),
  batch(8, ["CTRL"], 9),
  batch(9, ["CONTACT", "CM"], 12),
  batch(10, ["VEND"], 9),
  batch(11, ["LOC"], 8),
  batch(12, ["RET"], 8),
  batch(13, ["SEC"], 8),
  batch(14, ["SENS"], 8),
  batch(15, ["DOM"], 8),
  batch(16, ["READY"], 12),
  batch(17, ["REQ"], 8)
]);

const SEMANTIC_LED_FAMILIES = new Set(["EXEC", "PARTY", "ROLE", "FLOW", "OBJ", "AUTH", "SENS", "DOM", "READY"]);
const HYBRID_FAMILIES = new Set(["LIM", "CTRL", "CONTACT", "CM", "VEND", "LOC", "RET", "SEC", "REQ"]);
const DETERMINISTIC_FINAL_FIELDS = new Set([
  "DAP.CONTACT.001", "DAP.CONTACT.002", "DAP.CONTACT.004",
  "DAP.CM.002", "DAP.CM.005", "DAP.CM.006",
  "DAP.VEND.001", "DAP.VEND.006",
  "DAP.LOC.001", "DAP.RET.008", "DAP.SEC.001"
]);
const SEMANTIC_FIELD_OVERRIDES = new Set(["DAP.CM.001", "DAP.REQ.004", "DAP.REQ.006", "DAP.REQ.008"]);
const HYBRID_FIELD_OVERRIDES = new Set([
  "DAP.VEND.007", "DAP.LOC.006",
  "DAP.RET.001", "DAP.RET.002", "DAP.RET.003", "DAP.RET.005",
  "DAP.SEC.005", "DAP.SEC.006"
]);

export function getPhase7StrategicDerivationForField(fieldId = "") {
  const family = String(fieldId).split(".")[1] || "UNROUTED";
  let primary = "SEMANTIC_LED";
  if (DETERMINISTIC_FINAL_FIELDS.has(fieldId)) primary = "DETERMINISTIC_FINAL";
  else if (SEMANTIC_FIELD_OVERRIDES.has(fieldId) || SEMANTIC_LED_FAMILIES.has(family)) primary = "SEMANTIC_LED";
  else if (HYBRID_FIELD_OVERRIDES.has(fieldId) || HYBRID_FAMILIES.has(family)) primary = "SEMANTIC_LED_WITH_DETERMINISTIC_SUPPORT";
  return Object.freeze({
    family_section_18: family,
    primary_derivation: primary,
    deterministic_support_required: true,
    semantic_reasoning_required: primary !== "DETERMINISTIC_FINAL",
    deterministic_final_allowed: primary === "DETERMINISTIC_FINAL",
    batch_id: batchForFamily(family)?.batch_id || "UNROUTED_BATCH",
    batch_artifact_name: batchForFamily(family)?.artifact_name || "unrouted_batch_artifact"
  });
}

export function buildPhase7StrategicDerivationMatrixArtifact(materialRules = []) {
  const rows = materialRules.map((row) => Object.freeze({ ...row, strategic_derivation: getPhase7StrategicDerivationForField(row.field_id) }));
  return Object.freeze({
    artifact_type: "dap_strategic_derivation_matrix",
    manifest_version: "phase7_layer1_strategic_derivation_matrix_v3",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_1_DAP_REGISTRY_AND_STRATEGIC_DERIVATION_MATRIX",
    architecture_rule: "SEMANTIC_LED_WITH_DETERMINISTIC_NAVIGATION_SUPPORT",
    counts: PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS,
    semantic_batch_plan: PHASE7_DAP_SEMANTIC_BATCH_PLAN,
    rows: Object.freeze(rows),
    validation_quality_control_result: validatePhase7StrategicDerivationMatrix(rows)
  });
}

export function validatePhase7StrategicDerivationMatrix(rows = []) {
  const counts = rows.reduce((acc, row) => {
    const label = row.strategic_derivation?.primary_derivation || getPhase7StrategicDerivationForField(row.field_id).primary_derivation;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const errors = [];
  if (rows.length !== 150) errors.push(`strategic_matrix_row_count_not_150:${rows.length}`);
  for (const [label, expected] of Object.entries(PHASE7_DAP_STRATEGIC_DERIVATION_COUNTS)) {
    if ((counts[label] || 0) !== expected) errors.push(`strategic_count_mismatch:${label}:${counts[label] || 0}:${expected}`);
  }
  return Object.freeze({ status: errors.length ? "REPAIR_REQUIRED" : "PASS", counts: Object.freeze(counts), errors: Object.freeze(errors) });
}

function batch(order, families, field_count) {
  const slug = families.map((family) => family.toLowerCase()).join("_");
  return Object.freeze({ batch_id: `DAP-SEM-BATCH-${String(order).padStart(2, "0")}`, families: Object.freeze(families), field_count, artifact_name: `dap_semantic_batch_${slug}_artifact` });
}
function batchForFamily(family) {
  return PHASE7_DAP_SEMANTIC_BATCH_PLAN.find((batchRow) => batchRow.families.includes(family));
}

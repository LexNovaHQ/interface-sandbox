export const PHASE7_PREFILL_STATUSES = Object.freeze([
  "PREFILL_DERIVED_DIRECT",
  "PREFILL_DERIVED_CROSS_ROUTE",
  "PREFILL_LIMITATION_DERIVED",
  "PREFILL_MISSING_PROOF_DERIVED",
  "MODEL_PACKET_REQUIRED",
  "NOT_VISIBLE_AFTER_TARGETED_SCAN",
  "SOURCE_NOT_ROUTED_BY_M6",
  "NAVIGATION_DEFECT_REPAIR_REQUIRED",
  "REQUIRES_PRIVATE_CONFIRMATION"
]);

export function selectPhase7PrefillStatus({ rule, routeIds = [], atomIds = [], activityJoinIds = [] } = {}) {
  const family = rule?.registry_family || "";
  if (family === "DAP.EXEC" || family === "DAP.READY") return "MODEL_PACKET_REQUIRED";
  if (family === "DAP.LIM") return routeIds.length || atomIds.length || activityJoinIds.length ? "PREFILL_LIMITATION_DERIVED" : "REQUIRES_PRIVATE_CONFIRMATION";
  if (family === "DAP.REQ") return routeIds.length || atomIds.length || activityJoinIds.length ? "PREFILL_MISSING_PROOF_DERIVED" : "REQUIRES_PRIVATE_CONFIRMATION";
  if (rule?.deterministic_prefill_eligible && atomIds.length) return routeIds.length > atomIds.length ? "PREFILL_DERIVED_CROSS_ROUTE" : "PREFILL_DERIVED_DIRECT";
  if (rule?.deterministic_prefill_eligible && routeIds.length) return "PREFILL_DERIVED_CROSS_ROUTE";
  if (activityJoinIds.length && atomIds.length) return "PREFILL_DERIVED_CROSS_ROUTE";
  if (routeIds.length || atomIds.length || activityJoinIds.length) return "MODEL_PACKET_REQUIRED";
  return "NAVIGATION_DEFECT_REPAIR_REQUIRED";
}

export function phase7ModelRequiredForPrefillStatus(status) {
  return status === "MODEL_PACKET_REQUIRED";
}

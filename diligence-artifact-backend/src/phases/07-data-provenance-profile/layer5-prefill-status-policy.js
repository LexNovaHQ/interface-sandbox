export const PHASE7_PREFILL_STATUSES = Object.freeze([
  "PREFILL_DERIVED_DIRECT",
  "PREFILL_DERIVED_CROSS_ROUTE",
  "PREFILL_LIMITATION_DERIVED",
  "PREFILL_MISSING_PROOF_DERIVED",
  "MODEL_PACKET_REQUIRED",
  "NOT_VISIBLE_AFTER_TARGETED_SCAN",
  "SOURCE_NOT_ROUTED_BY_M6",
  "REINVESTIGATION_REQUIRED",
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
  return "REINVESTIGATION_REQUIRED";
}

export function phase7PrefillReinvestigationMetadata({ status, rule } = {}) {
  if (status !== "REINVESTIGATION_REQUIRED") return null;
  return Object.freeze({
    status: "REINVESTIGATION_REQUIRED",
    reinvestigation_owner_phase: "CARTOGRAPHY_INDEX",
    reinvestigation_scope: rule?.field_id || rule?.registry_family || "DAP_FIELD_PREFILL",
    reinvestigation_reason_code: "NO_NAVIGABLE_ROUTE_OR_EVIDENCE_ATOM",
    attempt_limit: 2,
    blocking: false
  });
}

export function phase7ModelRequiredForPrefillStatus(status) {
  return status === "MODEL_PACKET_REQUIRED";
}

export const PHASE7_FORBIDDEN_UNKNOWN_STATUSES = Object.freeze(["UNKNOWN", "NOT_FOUND", "N/A", "NA", "NO_DATA", "UNVERIFIED", "INSUFFICIENT", "CANNOT_TELL"]);

export const PHASE7_CONTROLLED_NAVIGATION_STATUSES = Object.freeze([
  "DERIVED_DIRECT",
  "DERIVED_CROSS_ROUTE",
  "DERIVED_WITH_LIMITATION",
  "NOT_VISIBLE_AFTER_TARGETED_SCAN",
  "SOURCE_NOT_ROUTED_BY_M6",
  "SOURCE_PRESENT_BUT_ACCESS_FAILED",
  "SOURCE_PRESENT_BUT_TEXT_FAILED",
  "DOCUMENT_TYPE_PRESENT_BUT_FIELD_SIGNAL_ABSENT",
  "CONFLICTING_PUBLIC_SIGNALS",
  "NOT_APPLICABLE_WITH_BASIS",
  "REQUIRES_PRIVATE_CONFIRMATION",
  "NAVIGATION_DEFECT_REPAIR_REQUIRED",
  "UPSTREAM_SOURCE_REPAIR_REQUIRED",
  "PINPOINT_NAVIGATION_READY"
]);

export function assertNoForbiddenUnknownStatus(value, context = "status") {
  const normalized = String(value || "").trim().toUpperCase();
  if (PHASE7_FORBIDDEN_UNKNOWN_STATUSES.includes(normalized)) throw new Error(`PHASE7_FORBIDDEN_UNKNOWN_STATUS:${context}:${normalized}`);
  return true;
}

export function controlledStatusForRoute(row = {}) {
  const access = String(row.access_status || "").toUpperCase();
  const text = String(row.text_status || "").toUpperCase();
  if (access.includes("FAILED") || access.includes("GATED") || access.includes("BROKEN")) return "SOURCE_PRESENT_BUT_ACCESS_FAILED";
  if (text.includes("FAILED") || text.includes("EMPTY") || text.includes("SNIPPET")) return "SOURCE_PRESENT_BUT_TEXT_FAILED";
  if (row.route_status === "NOT_ROUTED") return "SOURCE_NOT_ROUTED_BY_M6";
  if (row.cross_route_rescue_allowed) return "PINPOINT_NAVIGATION_READY";
  return "DOCUMENT_TYPE_PRESENT_BUT_FIELD_SIGNAL_ABSENT";
}

export function controlledStatusForFamilyCoverage({ primaryRoutes = [], secondaryRoutes = [], mandatory = true } = {}) {
  if (primaryRoutes.length) return "PINPOINT_NAVIGATION_READY";
  if (secondaryRoutes.length) return "DERIVED_CROSS_ROUTE";
  return mandatory ? "UPSTREAM_SOURCE_REPAIR_REQUIRED" : "SOURCE_NOT_ROUTED_BY_M6";
}

export function navigationMustPrecedeUnknown(familyRow = {}) {
  return Object.freeze({
    registry_family: familyRow.registry_family,
    mandatory_before_unresolved: familyRow.mandatory_before_unresolved !== false,
    forbidden_shortcut_statuses: PHASE7_FORBIDDEN_UNKNOWN_STATUSES,
    valid_unresolved_statuses: PHASE7_CONTROLLED_NAVIGATION_STATUSES.filter((status) => !["DERIVED_DIRECT", "DERIVED_CROSS_ROUTE", "DERIVED_WITH_LIMITATION", "PINPOINT_NAVIGATION_READY"].includes(status))
  });
}

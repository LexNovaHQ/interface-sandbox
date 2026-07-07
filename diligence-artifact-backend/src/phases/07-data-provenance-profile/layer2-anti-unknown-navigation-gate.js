import { PHASE7_FORBIDDEN_UNKNOWN_STATUSES, PHASE7_CONTROLLED_NAVIGATION_STATUSES } from "./layer2-anti-unknown-protocol.js";

const FORBIDDEN_PAYLOAD_KEYS = Object.freeze(["excerpt", "excerpts", "raw_text", "clean_text", "content", "body", "html", "markdown", "text"]);

export function validatePhase7Layer2NavigationGate(inventory) {
  const errors = [];
  if (!inventory || inventory.artifact_type !== "dap_source_navigation_inventory") errors.push("inventory_missing_or_wrong_type");
  const routes = inventory?.admitted_source_route_inventory || [];
  const coverage = inventory?.dap_family_source_coverage_matrix || [];
  const obligations = inventory?.registry_family_route_obligation_matrix || [];
  if (!Array.isArray(routes)) errors.push("routes_not_array");
  if (!Array.isArray(coverage)) errors.push("coverage_not_array");
  if (!Array.isArray(obligations)) errors.push("obligations_not_array");

  for (const route of routes) {
    for (const key of FORBIDDEN_PAYLOAD_KEYS) if (Object.prototype.hasOwnProperty.call(route, key)) errors.push(`forbidden_payload_key:${route.route_id}:${key}`);
    if (route.excerpt_allowed !== false) errors.push(`excerpt_not_disabled:${route.route_id}`);
    if (route.full_document_read_allowed !== false) errors.push(`full_document_read_not_disabled:${route.route_id}`);
    if (!route.pinpoint_locator || typeof route.pinpoint_locator !== "object") errors.push(`missing_pinpoint_locator:${route.route_id}`);
    if (route.legal_cartography_locator_required && !route.legal_cartography_locator_present) errors.push(`legal_locator_missing:${route.route_id}`);
    if (!route.anti_unknown_effect || !PHASE7_CONTROLLED_NAVIGATION_STATUSES.includes(route.anti_unknown_effect)) errors.push(`bad_anti_unknown_effect:${route.route_id}:${route.anti_unknown_effect}`);
    assertNoForbiddenPayloadDeep(route, `route:${route.route_id}`, errors);
  }

  for (const row of coverage) {
    if (PHASE7_FORBIDDEN_UNKNOWN_STATUSES.includes(String(row.family_navigation_status || "").toUpperCase())) errors.push(`forbidden_family_status:${row.registry_family}`);
    if (!PHASE7_CONTROLLED_NAVIGATION_STATUSES.includes(row.family_navigation_status)) errors.push(`bad_family_status:${row.registry_family}:${row.family_navigation_status}`);
    if (row.mandatory_before_unresolved && row.family_navigation_status === "SOURCE_NOT_ROUTED_BY_M6") errors.push(`mandatory_family_not_routed_without_repair:${row.registry_family}`);
  }

  const contactCoverage = coverage.find((row) => row.registry_family === "DAP.CONTACT");
  const cmCoverage = coverage.find((row) => row.registry_family === "DAP.CM");
  const directSignalRoutes = routes.filter((route) => route.document_type === "direct_legal_signal_profile");
  if (directSignalRoutes.length && contactCoverage && !contactCoverage.primary_route_ids.some((id) => directSignalRoutes.some((route) => route.route_id === id))) errors.push("direct_legal_signal_not_wired_to_contact");
  if (directSignalRoutes.length && cmCoverage && !cmCoverage.primary_route_ids.some((id) => directSignalRoutes.some((route) => route.route_id === id))) errors.push("direct_legal_signal_not_wired_to_cm");

  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    checked_routes: routes.length,
    checked_families: coverage.length,
    no_excerpts: !errors.some((error) => error.includes("excerpt") || error.includes("forbidden_payload_key")),
    legal_family_pinpoint_enforced: !errors.some((error) => error.includes("legal_locator_missing")),
    anti_unknown_controlled: !errors.some((error) => error.includes("UNKNOWN") || error.includes("bad_family_status") || error.includes("bad_anti_unknown")),
    errors
  });
}

function assertNoForbiddenPayloadDeep(value, path, errors) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoForbiddenPayloadDeep(item, `${path}[${index}]`, errors));
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PAYLOAD_KEYS.includes(key)) errors.push(`forbidden_nested_payload_key:${path}.${key}`);
    if (child && typeof child === "object") assertNoForbiddenPayloadDeep(child, `${path}.${key}`, errors);
  }
}

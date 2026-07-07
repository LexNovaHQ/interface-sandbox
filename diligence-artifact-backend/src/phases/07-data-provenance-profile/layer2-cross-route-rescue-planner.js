import { getPhase7RouteRuleForFamily } from "./layer2-dap-family-route-obligation-matrix.js";

const RESCUE_DOC_TYPES = Object.freeze({
  "DAP.PARTY": ["terms", "product_activity_context", "docs_api_data_flow"],
  "DAP.ROLE": ["terms", "upstream_target_profile", "security_trust"],
  "DAP.OBJ": ["product_activity_context", "docs_api_data_flow"],
  "DAP.FLOW": ["docs_api_data_flow", "privacy_notice"],
  "DAP.AUTH": ["help_rights_request", "product_activity_context", "docs_api_data_flow"],
  "DAP.CTRL": ["terms", "dpa", "help_rights_request"],
  "DAP.CONTACT": ["terms", "help_rights_request", "legal_navigation_ref"],
  "DAP.CM": ["help_rights_request", "cookie_tracking_notice", "product_activity_context"],
  "DAP.VEND": ["security_trust", "terms", "privacy_notice"],
  "DAP.LOC": ["privacy_notice", "docs_api_data_flow", "security_trust"],
  "DAP.RET": ["help_rights_request", "security_trust", "docs_api_data_flow"],
  "DAP.SEC": ["privacy_notice", "dpa"],
  "DAP.DOM": ["privacy_notice", "security_trust", "docs_api_data_flow"],
  "DAP.SENS": ["docs_api_data_flow", "terms", "upstream_activity_profile"],
  "DAP.READY": ["legal_navigation_ref", "dap_source_navigation_inventory"],
  "DAP.REQ": ["anti_unknown_navigation_gate_result"],
  "DAP.LIM": ["source_absence_access_failure_ledger", "upstream_activity_profile", "upstream_target_profile"]
});

export function buildPhase7CrossRouteRescuePlan({ obligationMatrix = [], routeInventory = [] } = {}) {
  return obligationMatrix.map((obligation) => {
    const rule = getPhase7RouteRuleForFamily(obligation.registry_family);
    const primary = routeInventory.filter((route) => rule.primary_required_document_types.includes(route.document_type));
    const rescueTypes = RESCUE_DOC_TYPES[obligation.registry_family] || rule.secondary_allowed_document_types || [];
    const rescue = routeInventory.filter((route) => rescueTypes.includes(route.document_type));
    return Object.freeze({
      registry_family: obligation.registry_family,
      primary_route_ids: primary.map((route) => route.route_id),
      rescue_route_ids: rescue.map((route) => route.route_id),
      rescue_document_types: Object.freeze(rescueTypes),
      rescue_available: primary.length === 0 && rescue.length > 0,
      rescue_status: primary.length ? "PRIMARY_PINPOINT_READY" : rescue.length ? "CROSS_ROUTE_RESCUE_READY" : "NO_RESCUE_ROUTE_AVAILABLE"
    });
  });
}

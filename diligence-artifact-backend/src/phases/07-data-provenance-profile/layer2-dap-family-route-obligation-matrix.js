import { navigationMustPrecedeUnknown } from "./layer2-anti-unknown-protocol.js";

const FAMILY_ROUTE_RULES = Object.freeze({
  "DAP.EXEC": route(["completed_field_base"], ["dap_source_navigation_inventory"], false),
  "DAP.PARTY": route(["upstream_activity_profile", "upstream_target_profile", "privacy_notice"], ["terms", "product_activity_context", "docs_api_data_flow"], true),
  "DAP.ROLE": route(["dpa", "privacy_notice", "terms", "legal_navigation_ref"], ["upstream_target_profile", "security_trust"], true),
  "DAP.OBJ": route(["upstream_activity_profile", "docs_api_data_flow", "privacy_notice"], ["product_activity_context"], true),
  "DAP.FLOW": route(["upstream_activity_profile", "docs_api_data_flow", "product_activity_context"], ["privacy_notice"], true),
  "DAP.AUTH": route(["privacy_notice", "terms", "dpa"], ["help_rights_request", "product_activity_context", "docs_api_data_flow"], true),
  "DAP.CTRL": route(["privacy_notice", "help_rights_request", "cookie_tracking_notice"], ["terms", "dpa"], true),
  "DAP.CONTACT": route(["direct_legal_signal_profile", "privacy_notice", "legal_navigation_ref"], ["terms", "help_rights_request"], true),
  "DAP.CM": route(["direct_legal_signal_profile", "cookie_tracking_notice", "privacy_notice"], ["help_rights_request", "product_activity_context"], true),
  "DAP.VEND": route(["subprocessor_list", "dpa", "privacy_notice"], ["security_trust", "terms"], true),
  "DAP.LOC": route(["dpa", "subprocessor_list", "security_trust"], ["privacy_notice", "docs_api_data_flow"], true),
  "DAP.RET": route(["privacy_notice", "dpa", "retention_deletion_export"], ["help_rights_request", "security_trust", "docs_api_data_flow"], true),
  "DAP.SEC": route(["security_trust", "incident_breach_security", "dpa"], ["privacy_notice"], true),
  "DAP.DOM": route(["ai_policy", "docs_api_data_flow", "product_activity_context"], ["privacy_notice", "security_trust"], true),
  "DAP.SENS": route(["privacy_notice", "product_activity_context", "upstream_activity_profile"], ["docs_api_data_flow", "terms"], true),
  "DAP.READY": route(["completed_field_base", "legal_navigation_ref"], ["dap_source_navigation_inventory"], false),
  "DAP.REQ": route(["all_unresolved_field_statuses"], ["anti_unknown_navigation_gate_result"], false),
  "DAP.LIM": route(["source_absence_access_failure_ledger", "upstream_target_profile", "upstream_activity_profile"], ["anti_unknown_navigation_gate_result"], false)
});

export function buildPhase7DapFamilyRouteObligationMatrix({ dapRegistryManifest } = {}) {
  const families = unique((dapRegistryManifest?.material_rules || []).map((row) => row.registry_family)).filter(Boolean);
  return families.map((family) => {
    const rule = FAMILY_ROUTE_RULES[family] || route([], [], true);
    return Object.freeze({
      registry_family: family,
      material_section_ids: unique((dapRegistryManifest?.material_rules || []).filter((row) => row.registry_family === family).map((row) => row.material_section_id)),
      primary_required_document_types: rule.primary_required_document_types,
      secondary_allowed_document_types: rule.secondary_allowed_document_types,
      mandatory_before_unresolved: rule.mandatory_before_unresolved,
      fallback_allowed: rule.secondary_allowed_document_types.length > 0,
      anti_unknown_obligation: navigationMustPrecedeUnknown({ registry_family: family, mandatory_before_unresolved: rule.mandatory_before_unresolved })
    });
  });
}

export function getPhase7RouteRuleForFamily(family) {
  return FAMILY_ROUTE_RULES[family] || route([], [], true);
}

function route(primary, secondary, mandatory) {
  return Object.freeze({ primary_required_document_types: Object.freeze(primary), secondary_allowed_document_types: Object.freeze(secondary), mandatory_before_unresolved: mandatory });
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

const REQUIRED_REGISTRY_COLUMNS = Object.freeze([
  "field_id",
  "profile_section",
  "field_family",
  "output_field",
  "covers",
  "mode",
  "source_basis",
  "conditions",
  "trigger_outcome",
  "exclude_fallback",
  "forbidden_inference",
  "lock_status"
]);

export const PHASE7_EXPECTED_DAP_FIELD_COUNT = 150;
export const PHASE7_REGISTRY_SOURCE_PATH = "references/registry/FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml";

export const PHASE7_DAP_MATERIAL_SECTION_MATRIX = Object.freeze([
  section("DAP-01", "Data & Privacy Executive Posture", "executive_provenance_posture", ["DAP.EXEC"], 8),
  section("DAP-02", "Source Coverage & Public-Footprint Boundary", "public_footprint_boundary", ["DAP.LIM.001", "DAP.LIM.002"], 2),
  section("DAP-03", "Parties, Roles & Relationship Map", "affected_party_and_role_map", ["DAP.PARTY", "DAP.ROLE"], 16),
  section("DAP-04", "Activity-Level Data Flow Map", "activity_flow", ["DAP.FLOW"], 10),
  section("DAP-05", "Data / Content / Asset Category Map", "object_and_data_classification", ["DAP.OBJ"], 9),
  section("DAP-06", "Purpose, Authorization, Notice & User Control Map", "purpose_authorization_notice_control", ["DAP.AUTH", "DAP.CTRL"], 17),
  section("DAP-07", "Privacy Contact, DPO, Grievance & Rights Route Map", "contact_route_map", ["DAP.CONTACT"], 5),
  section("DAP-08", "India Consent Manager Readiness Map", "consent_manager_readiness", ["DAP.CM"], 7),
  section("DAP-09", "Vendor, Processor, Subprocessor & Partner Chain", "vendor_processor_chain", ["DAP.VEND"], 9),
  section("DAP-10", "Cross-Border Transfer, Custody, Residency & Safeguards", "transfer_location_custody", ["DAP.LOC"], 8),
  section("DAP-11", "Retention, Deletion, Return, Export, Portability & Logs", "retention_deletion_lifecycle", ["DAP.RET"], 8),
  section("DAP-12", "Security, Access, Audit, Incident & Governance Controls", "security_incident_controls", ["DAP.SEC"], 8),
  section("DAP-13", "Sensitive, Children, Biometric, Health, Employment, Financial & High-Risk Context", "sensitive_high_risk_context", ["DAP.SENS"], 8),
  section("DAP-14", "AI / Domain-Specific Lifecycle Map", "domain_ai_lifecycle", ["DAP.DOM"], 8),
  section("DAP-15", "DPDP / GDPR / CCPA-CPRA Readiness Matrix", "regulatory_readiness_matrix", ["DAP.READY"], 12),
  section("DAP-16", "Missing Proof & Local Counsel Review Queue", "missing_proof_queue", ["DAP.REQ"], 8),
  section("DAP-17", "Limitations and Downstream Effect", "operational_limitations", ["DAP.LIM.003", "DAP.LIM.004", "DAP.LIM.005", "DAP.LIM.006", "DAP.LIM.007", "DAP.LIM.008", "DAP.LIM.009"], 7)
]);

export const PHASE7_MODEL_PACKET_MATRIX = Object.freeze({
  PACKET_A_PARTIES_ROLES_OBJECTS_FLOW: Object.freeze({ sections: ["DAP-03", "DAP-04", "DAP-05"], families: ["DAP.PARTY", "DAP.ROLE", "DAP.FLOW", "DAP.OBJ"] }),
  PACKET_B_PURPOSE_NOTICE_CONTACT_CONSENT: Object.freeze({ sections: ["DAP-06", "DAP-07", "DAP-08"], families: ["DAP.AUTH", "DAP.CTRL", "DAP.CONTACT", "DAP.CM"] }),
  PACKET_C_VENDORS_TRANSFERS_RETENTION: Object.freeze({ sections: ["DAP-09", "DAP-10", "DAP-11"], families: ["DAP.VEND", "DAP.LOC", "DAP.RET"] }),
  PACKET_D_SECURITY_SENSITIVE_AI_LIFECYCLE: Object.freeze({ sections: ["DAP-12", "DAP-13", "DAP-14"], families: ["DAP.SEC", "DAP.SENS", "DAP.DOM"] }),
  PACKET_E_REGULATORY_READINESS: Object.freeze({ sections: ["DAP-15"], families: ["DAP.READY"] }),
  PACKET_F_EXECUTIVE_SYNTHESIS: Object.freeze({ sections: ["DAP-01"], families: ["DAP.EXEC"] }),
  DETERMINISTIC_REQ_LIM: Object.freeze({ sections: ["DAP-02", "DAP-16", "DAP-17"], families: ["DAP.REQ", "DAP.LIM"] })
});

export function compilePhase7DapRegistryDerivationRules(registryText, options = {}) {
  if (!registryText || typeof registryText !== "string") throw new Error("PHASE7_DAP_REGISTRY_TEXT_REQUIRED");
  const expectedCount = Number(options.expected_dap_field_count || PHASE7_EXPECTED_DAP_FIELD_COUNT);
  const metadata = parseRegistryMetadata(registryText);
  const registryRows = parseRegistryRows(registryText);
  const dapRows = registryRows.filter((row) => row.field_id.startsWith("DAP."));
  const materialRules = dapRows.map(enrichDapRule);
  const sectionCounts = countBy(materialRules, (row) => row.material_section_id);
  const familyCounts = countBy(materialRules, (row) => row.registry_family);
  const packetCounts = countBy(materialRules, (row) => row.model_packet_family);
  const requiredRuleCoverage = materialRules.map((row) => ({
    field_id: row.field_id,
    has_mode: Boolean(row.mode),
    has_source_basis: Boolean(row.source_basis),
    has_conditions: Boolean(row.conditions),
    has_trigger_outcome: Boolean(row.trigger_outcome),
    has_exclude_fallback: Boolean(row.exclude_fallback),
    has_forbidden_inference: Boolean(row.forbidden_inference),
    has_lock_status: row.lock_status === "LOCKED"
  }));
  const validation = validateCompiledRules({ metadata, materialRules, sectionCounts, requiredRuleCoverage, expectedCount });
  return Object.freeze({
    artifact_type: "dap_registry_manifest",
    manifest_version: "phase7_dap_registry_manifest_v1_layer1_derivation_rules",
    phase_id: "DATA_PROVENANCE_PROFILE",
    layer_id: "LAYER_1_DAP_REGISTRY_DERIVATION_RULE_COMPILER",
    registry_source_path: PHASE7_REGISTRY_SOURCE_PATH,
    registry_metadata: metadata,
    expected_dap_field_count: expectedCount,
    actual_dap_field_count: materialRules.length,
    material_section_count: PHASE7_DAP_MATERIAL_SECTION_MATRIX.length,
    model_packet_count: Object.keys(PHASE7_MODEL_PACKET_MATRIX).length,
    required_registry_columns: REQUIRED_REGISTRY_COLUMNS,
    material_section_matrix: PHASE7_DAP_MATERIAL_SECTION_MATRIX,
    model_packet_matrix: PHASE7_MODEL_PACKET_MATRIX,
    section_counts: sectionCounts,
    registry_family_counts: familyCounts,
    model_packet_counts: packetCounts,
    material_rules: materialRules,
    required_rule_coverage: requiredRuleCoverage,
    validation_quality_control_result: validation
  });
}

export function validatePhase7DapRegistryManifest(manifest) {
  if (!manifest || typeof manifest !== "object") return fail("manifest_not_object");
  if (manifest.artifact_type !== "dap_registry_manifest") return fail("wrong_artifact_type");
  if (manifest.actual_dap_field_count !== PHASE7_EXPECTED_DAP_FIELD_COUNT) return fail("wrong_dap_field_count");
  if (!Array.isArray(manifest.material_rules) || manifest.material_rules.length !== PHASE7_EXPECTED_DAP_FIELD_COUNT) return fail("material_rules_missing_or_wrong_count");
  return validateCompiledRules({
    metadata: manifest.registry_metadata || {},
    materialRules: manifest.material_rules,
    sectionCounts: manifest.section_counts || {},
    requiredRuleCoverage: manifest.required_rule_coverage || [],
    expectedCount: PHASE7_EXPECTED_DAP_FIELD_COUNT
  });
}

function section(section_id, section_title, subsection_id, registry_keys, expected_count) {
  return Object.freeze({ section_id, section_title, subsection_id, registry_keys: Object.freeze(registry_keys), expected_count });
}

function parseRegistryMetadata(text) {
  return Object.freeze({
    name: scalarAfter(text, /^\s*name:\s*(.+)$/m),
    version: scalarAfter(text, /^\s*version:\s*(.+)$/m),
    declared_row_count: Number(scalarAfter(text, /^\s*row_count:\s*(\d+)$/m) || 0),
    locked: scalarAfter(text, /^\s*locked:\s*(.+)$/m) === "true",
    declared_columns: REQUIRED_REGISTRY_COLUMNS
  });
}

function parseRegistryRows(text) {
  return text.split(/\n-\s+field_id:\s+/).slice(1).map((block) => {
    const firstBreak = block.indexOf("\n");
    const fieldId = clean(firstBreak === -1 ? block : block.slice(0, firstBreak));
    const body = firstBreak === -1 ? "" : block.slice(firstBreak + 1);
    return Object.freeze({
      field_id: fieldId,
      profile_section: getYamlField(body, "profile_section"),
      field_family: getYamlField(body, "field_family"),
      output_field: getYamlField(body, "output_field"),
      covers: getYamlField(body, "covers"),
      mode: getYamlField(body, "mode"),
      source_basis: getYamlField(body, "source_basis"),
      conditions: getYamlField(body, "conditions"),
      trigger_outcome: getYamlField(body, "trigger_outcome"),
      exclude_fallback: getYamlField(body, "exclude_fallback"),
      forbidden_inference: getYamlField(body, "forbidden_inference"),
      lock_status: getYamlField(body, "lock_status")
    });
  });
}

function enrichDapRule(row) {
  const route = routeForDapField(row.field_id);
  const registryFamily = row.field_id.split(".").slice(0, 2).join(".");
  return Object.freeze({
    ...row,
    registry_family: registryFamily,
    material_section_id: route.section_id,
    material_section_title: route.section_title,
    material_subsection_id: route.subsection_id,
    material_field_key: `${row.field_id}:${row.output_field}`,
    derivation_rule_compiled: true,
    deterministic_prefill_eligible: deterministicPrefillEligible({ ...row, registry_family: registryFamily }),
    model_packet_family: modelPacketFor({ field_id: row.field_id, registry_family: registryFamily }),
    evidence_atom_requirements: evidenceAtomRequirementsFor(registryFamily),
    limitation_trigger: limitationTriggerFor(row),
    missing_proof_trigger: missingProofTriggerFor(row),
    legal_firewall: Object.freeze({
      readiness_only: registryFamily === "DAP.READY" || registryFamily === "DAP.CM",
      no_compliance_conclusion: true,
      no_legal_applicability_conclusion: true,
      no_transfer_legality_conclusion: true,
      no_lawful_basis_sufficiency_conclusion: true,
      no_security_adequacy_conclusion: true,
      no_m11_exposure_or_threat_logic: true
    })
  });
}

function routeForDapField(fieldId) {
  const exact = PHASE7_DAP_MATERIAL_SECTION_MATRIX.find((sectionRow) => sectionRow.registry_keys.includes(fieldId));
  if (exact) return exact;
  const family = fieldId.split(".").slice(0, 2).join(".");
  const byFamily = PHASE7_DAP_MATERIAL_SECTION_MATRIX.find((sectionRow) => sectionRow.registry_keys.includes(family));
  if (!byFamily) throw new Error(`PHASE7_DAP_FIELD_UNROUTED:${fieldId}`);
  return byFamily;
}

function modelPacketFor({ field_id, registry_family }) {
  if (registry_family === "DAP.REQ" || registry_family === "DAP.LIM") return "DETERMINISTIC_REQ_LIM";
  return Object.entries(PHASE7_MODEL_PACKET_MATRIX).find(([, packet]) => packet.families.includes(registry_family))?.[0] || `UNROUTED_PACKET:${field_id}`;
}

function deterministicPrefillEligible(row) {
  if (["DAP.EXEC", "DAP.READY"].includes(row.registry_family)) return false;
  if (["DAP.REQ", "DAP.LIM"].includes(row.registry_family)) return true;
  if (/EXTRACT|LIMITATION/i.test(row.mode || "")) return true;
  return ["DAP.CONTACT", "DAP.CM", "DAP.VEND", "DAP.LOC", "DAP.RET", "DAP.SEC"].includes(row.registry_family);
}

function evidenceAtomRequirementsFor(family) {
  const common = ["source_artifact", "source_family", "source_url_or_route", "document_type", "excerpt_or_value", "anti_unknown_status"];
  const byFamily = {
    "DAP.EXEC": ["completed_field_base", "priority_gaps", "downstream_effects"],
    "DAP.PARTY": ["party_label", "relationship_phrase", "activity_reference"],
    "DAP.ROLE": ["role_phrase", "contractual_context", "ambiguity_signal"],
    "DAP.OBJ": ["data_or_object_label", "origin_signal", "transformation_signal"],
    "DAP.FLOW": ["activity_reference", "input_signal", "processing_step", "output_signal", "destination_signal"],
    "DAP.AUTH": ["purpose_phrase", "authorization_phrase", "instruction_or_consent_signal"],
    "DAP.CTRL": ["notice_route", "control_route", "withdrawal_or_rights_route"],
    "DAP.CONTACT": ["privacy_contact", "grievance_contact", "dpo_or_privacy_officer_route"],
    "DAP.CM": ["consent_manager_signal", "consent_flow_route", "withdrawal_or_revocation_route"],
    "DAP.VEND": ["external_party_name", "service_function", "subprocessor_or_partner_context"],
    "DAP.LOC": ["country_or_region", "transfer_phrase", "storage_or_residency_phrase", "safeguard_phrase"],
    "DAP.RET": ["retention_period", "deletion_route", "export_or_return_route", "backup_or_log_retention"],
    "DAP.SEC": ["security_control", "access_control", "audit_logging", "incident_or_breach_route"],
    "DAP.DOM": ["ai_or_domain_lifecycle_signal", "model_provider", "training_or_logging_signal"],
    "DAP.SENS": ["sensitive_or_high_risk_signal", "affected_population", "source_context"],
    "DAP.READY": ["completed_field_base", "regime_label", "review_category", "evidence_gap"],
    "DAP.REQ": ["unresolved_field", "requested_evidence", "downstream_effect"],
    "DAP.LIM": ["limitation_source", "affected_field_family", "downstream_effect"]
  };
  return Object.freeze([...(byFamily[family] || []), ...common]);
}

function limitationTriggerFor(row) {
  if (row.field_id.startsWith("DAP.LIM.")) return "FIELD_IS_LIMITATION_ROW";
  if (/LIMITATION|partial|thin|missing|ambiguity|conflict|fallback/i.test(`${row.mode} ${row.trigger_outcome} ${row.exclude_fallback}`)) return "WHEN_SUPPORT_IS_PARTIAL_THIN_MISSING_CONFLICTED_OR_FALLBACK_ONLY";
  return "WHEN_FIELD_STATUS_IS_NOT_FULLY_DERIVED";
}

function missingProofTriggerFor(row) {
  if (row.field_id.startsWith("DAP.REQ.")) return "FIELD_IS_MISSING_PROOF_ROW";
  if (/missing proof|missing|access|not visible|not searched|conflict|confirmation|required/i.test(`${row.output_field} ${row.conditions} ${row.trigger_outcome}`)) return "WHEN_REQUIRED_EVIDENCE_IS_MISSING_NOT_VISIBLE_ACCESS_FAILED_CONFLICTED_OR_REQUIRES_CONFIRMATION";
  return "WHEN_FIELD_STATUS_REQUIRES_QUALIFIED_REVIEW_OR_LOCAL_COUNSEL_CONFIRMATION";
}

function validateCompiledRules({ metadata, materialRules, sectionCounts, requiredRuleCoverage, expectedCount }) {
  const errors = [];
  if (metadata.declared_row_count && metadata.declared_row_count !== 427) errors.push("registry_declared_row_count_not_427");
  if (metadata.locked !== true) errors.push("registry_not_locked");
  if (!Array.isArray(materialRules) || materialRules.length !== expectedCount) errors.push(`dap_field_count_expected_${expectedCount}_actual_${materialRules?.length || 0}`);
  for (const sectionRow of PHASE7_DAP_MATERIAL_SECTION_MATRIX) {
    if ((sectionCounts[sectionRow.section_id] || 0) !== sectionRow.expected_count) errors.push(`section_count_mismatch:${sectionRow.section_id}:${sectionCounts[sectionRow.section_id] || 0}:${sectionRow.expected_count}`);
  }
  const missingCoverage = requiredRuleCoverage.filter((row) => !row.has_mode || !row.has_source_basis || !row.has_conditions || !row.has_trigger_outcome || !row.has_exclude_fallback || !row.has_forbidden_inference || !row.has_lock_status);
  if (missingCoverage.length) errors.push(`derivation_rule_fields_missing:${missingCoverage.map((row) => row.field_id).join(",")}`);
  const unrouted = materialRules.filter((row) => String(row.model_packet_family || "").startsWith("UNROUTED_PACKET"));
  if (unrouted.length) errors.push(`unrouted_model_packet:${unrouted.map((row) => row.field_id).join(",")}`);
  return Object.freeze({
    status: errors.length ? "REPAIR_REQUIRED" : "PASS",
    expected_dap_field_count: expectedCount,
    actual_dap_field_count: materialRules?.length || 0,
    expected_section_count: PHASE7_DAP_MATERIAL_SECTION_MATRIX.length,
    all_derivation_rules_compiled: errors.length === 0,
    errors
  });
}

function getYamlField(body, key) {
  const match = body.match(new RegExp(`^\\s{2}${key}:\\s*([^\\n]*(?:\\n\\s{4}[^\\n]*)*)`, "m"));
  if (!match) return "";
  return clean(match[1]).replace(/^null$/i, "");
}

function scalarAfter(text, regex) {
  const match = text.match(regex);
  return match ? clean(match[1]) : "";
}

function countBy(rows, keyFn) {
  return Object.freeze(rows.reduce((acc, row) => {
    const key = keyFn(row) || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}));
}

function fail(reason) {
  return Object.freeze({ status: "REPAIR_REQUIRED", errors: [reason] });
}

function clean(value) {
  return String(value ?? "").replace(/\n\s+/g, " ").trim();
}

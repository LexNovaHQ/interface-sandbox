import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FDR_PATH = path.join(ROOT, "references/registry/Diligence_Field_Derivation_Registry.yml");
const OUTPUTS = Object.freeze({
  sectionSchema: path.join(ROOT, "src/phases/12-normalized-compiler/report-contract/REPORT_SECTION_SCHEMA.yml"),
  normalizerKey: path.join(ROOT, "references/registry/REPORT_NORMALIZER_KEY.yml"),
  ownershipMatrix: path.join(ROOT, "src/phases/12-normalized-compiler/report-contract/REPORT_FIELD_OWNERSHIP_MATRIX.json"),
  gapRegister: path.join(ROOT, "src/phases/12-normalized-compiler/report-contract/UPSTREAM_REPORT_GAP_REGISTER.yml")
});
const CHECK_ONLY = process.argv.includes("--check");
const EXPECTED_PARSED_ROWS = 457;
const EXPECTED_GAP_ROWS = 27;

const SECTION_SCHEMA = Object.freeze([
  section("01", "matter_review_boundary", "Matter Overview & Review Boundary", [
    subsection("01.01", "matter_identity", "Matter Identity"),
    subsection("01.02", "reviewed_source_scope", "Reviewed Target and Source Scope"),
    subsection("01.03", "mounted_sector_context", "Primary Sector and Mounted Context"),
    subsection("01.04", "phase11_gate_status", "Final Operator-Challenge Gate"),
    subsection("01.05", "reliance_boundary", "Public-Footprint and Reliance Boundary"),
    subsection("01.06", "review_ready_notice", "Review-Ready Draft and Local Counsel Notice")
  ], {
    field_role: "CONTROL_METADATA_AND_DETERMINISTIC_SUMMARY_ONLY",
    allowed_summary_prefixes: ["TP", "DD"],
    substantive_field_creation_forbidden: true
  }),
  section("02", "executive_legal_risk_overview", "Executive Legal Risk Overview", [
    subsection("02.01", "target_sector_snapshot", "Target and Sector Snapshot"),
    subsection("02.02", "exposure_status_distribution", "Exposure Status Distribution"),
    subsection("02.03", "pain_tier_distribution", "Pain Tier Distribution"),
    subsection("02.04", "pain_depth_distribution", "Pain Depth Distribution"),
    subsection("02.05", "highest_upstream_priorities", "Highest Upstream-Owned Review Priorities"),
    subsection("02.06", "carried_phase11_warnings", "Carried Phase 11 Warnings")
  ], {
    field_role: "DETERMINISTIC_ROLLUP_OF_UPSTREAM_VALUES",
    primary_fdr_prefixes: ["LEP"],
    final_assessment_owner_required: true,
    compiler_priority_derivation_forbidden: true
  }),
  section("03", "target_entity_sector_profile", "Target, Entity & Sector Profile", [
    subsection("03.01", "target_identity", "Target Identity"),
    subsection("03.02", "entity_and_jurisdiction", "Entity and Jurisdiction Signals"),
    subsection("03.03", "business_context", "Business Context"),
    subsection("03.04", "product_service_wrapper", "Product and Service Wrapper"),
    subsection("03.05", "primary_sector", "Primary Sector"),
    subsection("03.06", "capability_overlays", "Capability Overlays"),
    subsection("03.07", "regulatory_context_overlays", "Regulatory Context Overlays"),
    subsection("03.08", "profile_limitations", "Profile Limitations")
  ], { primary_fdr_prefixes: ["TP", "DD"] }),
  section("04", "product_activity_architecture", "Product & Activity Architecture", [
    subsection("04.01", "activity_inventory", "Activity Inventory"),
    subsection("04.02", "activity_mechanics", "Activity Mechanics"),
    subsection("04.03", "behavior_classification", "Behavior Class Classification"),
    subsection("04.04", "surface_context", "Surface and Context Classification"),
    subsection("04.05", "commercial_availability", "Commercial Availability and Deployment Posture"),
    subsection("04.06", "taxonomy_provenance", "Taxonomy Provenance"),
    subsection("04.07", "activity_limitations", "Activity Limitations")
  ], { primary_fdr_prefixes: ["PA"] }),
  section("05", "data_provenance_privacy_architecture", "Data Provenance & Privacy Architecture", [
    subsection("05.01", "provenance_executive_map", "Provenance Executive Map"),
    subsection("05.02", "parties_and_roles", "Parties, Roles and Affected Persons"),
    subsection("05.03", "objects_and_flows", "Objects, Data, Assets and Flows"),
    subsection("05.04", "purpose_authorization_controls", "Purpose, Authorization, Notice and User Controls"),
    subsection("05.05", "vendor_processor_chain", "Vendor, Processor and Partner Chain"),
    subsection("05.06", "location_transfer_custody", "Location, Transfer and Custody"),
    subsection("05.07", "retention_deletion_return", "Retention, Deletion, Return and Portability"),
    subsection("05.08", "security_incident_governance", "Security, Access, Incident and Governance Controls"),
    subsection("05.09", "sensitive_contexts", "Sensitive and High-Risk Contexts"),
    subsection("05.10", "regulatory_readiness", "Regulatory Readiness"),
    subsection("05.11", "contacts_consent_manager", "Privacy Contacts and Consent Manager Readiness"),
    subsection("05.12", "missing_proof", "Missing Proof and Diligence Requests"),
    subsection("05.13", "provenance_limitations", "Provenance Limitations")
  ], { primary_fdr_prefixes: ["DAP"] }),
  section("06", "sector_control_obligations", "Sector-Specific Control Obligations", [
    subsection("06.01", "obligation_inventory", "Obligation Inventory"),
    subsection("06.02", "obligation_linkage", "Target, Activity and Authority Linkage"),
    subsection("06.03", "expected_controls", "Expected Operational Controls"),
    subsection("06.04", "visible_control_posture", "Visible Control Posture"),
    subsection("06.05", "obligation_evidence", "Obligation Evidence"),
    subsection("06.06", "obligation_limitations", "Obligation Limitations")
  ], {
    primary_fdr_prefixes: ["DCO"],
    legal_applicability_conclusion_forbidden: true
  }),
  section("07", "legal_governance_architecture", "Legal & Governance Architecture", [
    subsection("07.01", "document_stack", "Legal Document Stack"),
    subsection("07.02", "artifact_inventory", "Artifact Inventory and Coverage"),
    subsection("07.03", "notice_contact_map", "Notice and Contact Map"),
    subsection("07.04", "control_language", "Control-Language Locations"),
    subsection("07.05", "liability_indemnity", "Liability and Indemnity Controls"),
    subsection("07.06", "service_support", "Service-Level and Support Commitments"),
    subsection("07.07", "cross_document_references", "Cross-Document References"),
    subsection("07.08", "missing_artifacts", "Missing or Inaccessible Artifacts"),
    subsection("07.09", "legal_limitations", "Legal Cartography Limitations")
  ], { primary_fdr_prefixes: ["LGC"] }),
  section("08", "exposure_register", "Exposure Register", [
    subsection("08.01", "exposure_summary", "Exposure Summary"),
    subsection("08.02", "triggered_exposures", "Triggered Exposures"),
    subsection("08.03", "controlled_exposures", "Controlled Exposures"),
    subsection("08.04", "severity_enforcement", "Severity and Enforcement Posture"),
    subsection("08.05", "legal_pain_impact", "Legal Pain and Business Impact"),
    subsection("08.06", "control_exclusion_basis", "Control, Exclusion and False-Positive Basis"),
    subsection("08.07", "response_and_review_route", "Response, Remediation and Review Route"),
    subsection("08.08", "exposure_limitations", "Exposure Limitations")
  ], {
    primary_fdr_prefixes: ["LEP"],
    complete_exposure_and_upstream_response_required: true,
    open_handoff_items_only_forbidden: true
  }),
  section("09", "open_review_items_handoff", "Open Review Items & Handoff Plan", [
    subsection("09.01", "unresolved_material_items", "Unresolved Material Items"),
    subsection("09.02", "confirmatory_evidence_requests", "Confirmatory Evidence Requests"),
    subsection("09.03", "open_control_questions", "Open Control and Diligence Questions"),
    subsection("09.04", "carried_warnings", "Carried Warnings and Limitations"),
    subsection("09.05", "local_counsel_routes", "Local Counsel and Specialist Review Routes")
  ], {
    projection_filter: "OPEN_OR_UNRESOLVED_UPSTREAM_ITEMS_ONLY",
    exposure_register_duplication_forbidden: true,
    compiler_question_creation_forbidden: true,
    compiler_route_creation_forbidden: true
  }),
  section("10", "methodology_limitations_annexure", "Methodology, Limitations & Technical Annexure Index", [
    subsection("10.01", "methodology", "Methodology"),
    subsection("10.02", "evidence_boundary", "Evidence and Public-Footprint Boundary"),
    subsection("10.03", "artifact_custody", "Artifact Custody"),
    subsection("10.04", "consolidated_limitations", "Consolidated Upstream Limitations"),
    subsection("10.05", "phase11_warning_ledger", "Phase 11 Warning Projection"),
    subsection("10.06", "technical_annexure_index", "Technical Annexure Index"),
    subsection("10.07", "review_ready_disclaimer", "Review-Ready Draft and Local Counsel Mandate")
  ], {
    field_role: "CONTROL_METADATA_LIMITATIONS_AND_REFERENCE_INDEX",
    forensic_artifacts_reference_only: true,
    forensic_substantive_consumption_forbidden: true
  })
]);

const PROFILE_OWNERS = Object.freeze({
  "Target Profile": owner(3, ["target_profile"], "03"),
  "Domain Derivation Profile": owner(3, ["domain_derivation_profile"], "03"),
  "Product / Activity Profile": owner(5, ["target_feature_profile"], "04"),
  "Data / Asset Provenance Profile": owner(7, [], "05"),
  "Domain Control Obligation Profile": owner(8, ["domain_control_obligation_profile"], "06"),
  "Legal / Governance Cartography Profile": owner(2, ["legal_cartography_index", "legal_signal_derivation_profile"], "07"),
  "Legal Exposure Profile": owner(10, ["exposure_registry_controlled_profile", "exposure_registry_triggered_profile"], "08"),
  "Document Redline & Remediation Matrix": gapOwner("UPSTREAM_REMEDIATION_OWNER_NOT_IMPLEMENTED"),
  "Final Assessment": gapOwner("UPSTREAM_FINAL_ASSESSMENT_OWNER_NOT_IMPLEMENTED")
});

const DAP_BATCH_ARTIFACTS = Object.freeze({
  EXEC: "dap_semantic_batch_exec_artifact",
  LIM: "dap_semantic_batch_lim_artifact",
  PARTY: "dap_semantic_batch_party_artifact",
  ROLE: "dap_semantic_batch_role_artifact",
  FLOW: "dap_semantic_batch_flow_artifact",
  OBJ: "dap_semantic_batch_obj_artifact",
  AUTH: "dap_semantic_batch_auth_artifact",
  CTRL: "dap_semantic_batch_ctrl_artifact",
  CM: "dap_semantic_batch_contact_cm_artifact",
  CONTACT: "dap_semantic_batch_contact_cm_artifact",
  VEND: "dap_semantic_batch_vend_artifact",
  LOC: "dap_semantic_batch_loc_artifact",
  RET: "dap_semantic_batch_ret_artifact",
  SEC: "dap_semantic_batch_sec_artifact",
  SENS: "dap_semantic_batch_sens_artifact",
  DOM: "dap_semantic_batch_dom_artifact",
  READY: "dap_semantic_batch_ready_artifact",
  REQ: "dap_semantic_batch_req_artifact"
});

const TAXONOMY_RESOLVERS = Object.freeze({
  behavior_class: resolver("mounted_registry_key.behavior_class.codes", ["code", "normalized_name"]),
  lane: resolver("mounted_registry_key.lane.codes", ["code", "normalized_name"]),
  surface: resolver("mounted_registry_key.surface.tokens", ["token", "normalized_name"]),
  subcat: resolver("mounted_registry_key.subcat.codes", ["code", "normalized_name"]),
  compliance_framework: resolver("mounted_registry_key.compliance_framework.tokens", ["token", "normalized_name"]),
  pain_tier: resolver("mounted_registry_key.severity.pain_tier.codes", ["tier", "pain_category", "normalized_name"]),
  pain_depth: resolver("mounted_registry_key.severity.pain_depth.codes", ["value", "normalized_name"]),
  velocity: resolver("mounted_registry_key.severity.velocity.codes", ["value", "normalized_name"]),
  legal_status: resolver("mounted_registry_key.severity.status.codes", ["value", "normalized_name"])
});

const parsed = yaml.load(fs.readFileSync(FDR_PATH, "utf8")) || {};
const fields = Array.isArray(parsed.fields) ? parsed.fields : [];
assertFdr(fields, parsed.registry || {});

const entries = fields.map(buildEntry);
const activeEntries = entries.filter((entry) => entry.report_eligibility === "ACTIVE");
const gapEntries = entries.filter((entry) => entry.report_eligibility === "UPSTREAM_GAP");
if (gapEntries.length !== EXPECTED_GAP_ROWS) throw new Error(`CO_P12_02_GAP_COUNT_MISMATCH:${gapEntries.length}:${EXPECTED_GAP_ROWS}`);

const sectionSchemaDocument = {
  report_section_schema: {
    schema_version: "phase12_report_section_schema.v1",
    status: "LOCKED",
    doctrine: "Upstream phases decide. Phase 12 arranges.",
    public_terminology: {
      domain: "Sector",
      primary_domain_package: "Primary Sector",
      domain_derivation_profile: "Sector Classification Profile",
      capability_overlays: "Capability Overlays",
      regulatory_overlays: "Regulatory Context Overlays",
      domain_control_obligation_profile: "Sector-Specific Control Obligations"
    },
    section_count: SECTION_SCHEMA.length,
    one_canonical_artifact_per_section: true,
    renderer_semantic_merge_forbidden: true,
    p12_model_usage: "FORBIDDEN",
    p12_new_substantive_fields_forbidden: true,
    sections: SECTION_SCHEMA
  }
};

const normalizerDocument = {
  report_normalizer_key: {
    schema_version: "report_normalizer_key.v1.fdr_complete",
    status: "LOCKED",
    authority_order: [
      "Diligence_Field_Derivation_Registry.yml for field identity and canonical label",
      "mounted package Registry Key for domain-specific value normalized_name",
      "upstream material profile artifact for substantive value",
      "REPORT_SECTION_SCHEMA.yml for placement and order"
    ],
    fdr_source: "references/registry/Diligence_Field_Derivation_Registry.yml",
    fdr_version: String(parsed.registry?.version || ""),
    fdr_declared_row_count: Number(parsed.registry?.row_count || 0),
    fdr_parsed_unique_row_count: fields.length,
    field_entry_count: entries.length,
    active_report_field_count: activeEntries.length,
    upstream_gap_field_count: gapEntries.length,
    generic_humanizer_forbidden: true,
    title_case_fallback_forbidden: true,
    missing_entry_result: "NORMALIZER_KEY_ENTRY_MISSING",
    value_mutation_forbidden: true,
    compiler_authored_limitations_questions_priorities_routes_forbidden: true,
    taxonomy_value_resolvers: TAXONOMY_RESOLVERS,
    fields: entries.map((entry) => ({
      field_id: entry.field_id,
      canonical_label: entry.output_field,
      canonical_short_label: entry.output_field,
      report_importance: entry.report_importance,
      report_eligibility: entry.report_eligibility,
      primary_report_section: entry.primary_report_section,
      secondary_projection_sections: entry.secondary_projection_sections,
      presentation: entry.presentation,
      label_authority: "FDR.output_field",
      value_authority: entry.value_authority,
      taxonomy_resolver: entry.taxonomy_resolver,
      empty_value_policy: entry.empty_value_policy,
      evidence_policy: entry.evidence_policy,
      limitation_policy: entry.limitation_policy
    }))
  }
};

const ownershipDocument = {
  schema_version: "phase12_report_field_ownership_matrix.v1",
  status: "LOCKED",
  fdr_source: "references/registry/Diligence_Field_Derivation_Registry.yml",
  fdr_declared_row_count: Number(parsed.registry?.row_count || 0),
  fdr_parsed_unique_row_count: fields.length,
  route_contract_status: "DEFERRED_TO_CO_P12_03",
  p12_substantive_derivation_forbidden: true,
  rows: entries.map((entry) => ({
    field_id: entry.field_id,
    profile_section: entry.profile_section,
    field_family: entry.field_family,
    output_field: entry.output_field,
    mode: entry.mode,
    owner_phase: entry.owner_phase,
    owner_artifacts: entry.owner_artifacts,
    owner_status: entry.owner_status,
    owner_gap_code: entry.owner_gap_code,
    primary_report_section: entry.primary_report_section,
    secondary_projection_sections: entry.secondary_projection_sections,
    source_path_binding_status: entry.source_path_binding_status,
    source_path_binding_authority: entry.source_path_binding_authority
  }))
};

const gapDocument = {
  upstream_report_gap_register: {
    schema_version: "upstream_report_gap_register.v1.co_p12_02",
    status: "LOCKED",
    blocking_rule: "Phase 12 must not derive, repair or synthesize a field whose upstream owner is absent.",
    gaps: [
      {
        gap_id: "P12.GAP.FDR.ROW_COUNT",
        type: "REGISTRY_METADATA_MISMATCH",
        declared_row_count: Number(parsed.registry?.row_count || 0),
        parsed_unique_row_count: fields.length,
        treatment: "Use all unique locked parsed rows; amend FDR metadata separately. No row may be dropped."
      },
      {
        gap_id: "P12.GAP.DRR.OWNER",
        type: "UPSTREAM_OWNER_MISSING",
        field_prefix: "DRR",
        field_count: gapEntries.filter((entry) => entry.field_id.startsWith("DRR.")).length,
        affected_field_ids: gapEntries.filter((entry) => entry.field_id.startsWith("DRR.")).map((entry) => entry.field_id),
        treatment: "BLOCK_FROM_REPORT_UNTIL_EXPLICIT_UPSTREAM_REMEDIATION_OWNER_EXISTS",
        p12_derivation_forbidden: true
      },
      {
        gap_id: "P12.GAP.FPA.OWNER",
        type: "UPSTREAM_OWNER_MISSING",
        field_prefix: "FPA",
        field_count: gapEntries.filter((entry) => entry.field_id.startsWith("FPA.")).length,
        affected_field_ids: gapEntries.filter((entry) => entry.field_id.startsWith("FPA.")).map((entry) => entry.field_id),
        treatment: "BLOCK_FROM_REPORT_UNTIL_PHASE11_OR_AN_EXPLICIT_FINAL_ASSESSMENT_OWNER_EMITS_THE_FIELDS",
        p12_derivation_forbidden: true
      },
      {
        gap_id: "P12.GAP.ROUTE_BINDINGS",
        type: "SOURCE_PATH_BINDING_NOT_YET_FROZEN",
        affected_active_field_count: activeEntries.length,
        treatment: "CO_P12_03 must bind each active field to an exact material artifact path before compiler cutover.",
        current_change_order_may_not_guess_paths: true
      }
    ],
    summary: {
      active_owned_fields: activeEntries.length,
      blocked_upstream_gap_fields: gapEntries.length,
      total_fdr_fields: entries.length
    }
  }
};

const documents = new Map([
  [OUTPUTS.sectionSchema, dumpYaml(sectionSchemaDocument)],
  [OUTPUTS.normalizerKey, dumpYaml(normalizerDocument)],
  [OUTPUTS.ownershipMatrix, `${JSON.stringify(ownershipDocument, null, 2)}\n`],
  [OUTPUTS.gapRegister, dumpYaml(gapDocument)]
]);

for (const [file, content] of documents) {
  if (CHECK_ONLY) {
    if (!fs.existsSync(file)) throw new Error(`CO_P12_02_GENERATED_FILE_MISSING:${path.relative(ROOT, file)}`);
    const existing = fs.readFileSync(file, "utf8");
    if (existing !== content) throw new Error(`CO_P12_02_GENERATED_FILE_DRIFT:${path.relative(ROOT, file)}`);
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

console.log(JSON.stringify({
  status: CHECK_ONLY ? "CHECK_PASS" : "BUILT",
  parsed_fdr_rows: fields.length,
  active_report_fields: activeEntries.length,
  upstream_gap_fields: gapEntries.length,
  outputs: [...documents.keys()].map((file) => path.relative(ROOT, file))
}, null, 2));

function buildEntry(row) {
  const ownerConfig = PROFILE_OWNERS[row.profile_section];
  if (!ownerConfig) throw new Error(`CO_P12_02_PROFILE_SECTION_UNMAPPED:${row.profile_section}:${row.field_id}`);
  const prefix = String(row.field_id || "").split(".")[0];
  const ownerArtifacts = prefix === "DAP" ? resolveDapArtifacts(row.field_id) : [...ownerConfig.artifacts];
  const reportEligibility = ownerConfig.status === "GAP" ? "UPSTREAM_GAP" : "ACTIVE";
  const importance = deriveImportance(row, reportEligibility);
  return {
    field_id: String(row.field_id),
    profile_section: String(row.profile_section),
    field_family: String(row.field_family),
    output_field: String(row.output_field),
    mode: String(row.mode),
    lock_status: String(row.lock_status),
    owner_phase: ownerConfig.phase,
    owner_artifacts: ownerArtifacts,
    owner_status: ownerConfig.status,
    owner_gap_code: ownerConfig.gapCode,
    report_eligibility: reportEligibility,
    report_importance: importance,
    primary_report_section: ownerConfig.section,
    secondary_projection_sections: deriveSecondarySections(row, reportEligibility),
    presentation: derivePresentation(row, importance),
    value_authority: reportEligibility === "ACTIVE" ? "UPSTREAM_MATERIAL_PROFILE_VALUE" : "NO_VALUE_AUTHORITY_OWNER_MISSING",
    taxonomy_resolver: deriveTaxonomyResolver(row),
    empty_value_policy: deriveEmptyPolicy(row, reportEligibility),
    evidence_policy: deriveEvidencePolicy(row),
    limitation_policy: deriveLimitationPolicy(row),
    source_path_binding_status: reportEligibility === "ACTIVE" ? "UNBOUND_PENDING_CO_P12_03_ROUTE_CONTRACT" : "NO_UPSTREAM_OWNER",
    source_path_binding_authority: reportEligibility === "ACTIVE" ? "CO_P12_03_EXACT_ROUTE_CONTRACT" : "NONE"
  };
}

function deriveImportance(row, eligibility) {
  if (eligibility === "UPSTREAM_GAP") return "GAP";
  const text = `${row.field_family} ${row.output_field} ${row.mode}`.toLowerCase();
  if (/limitation|missing proof|uncertainty|required confirmation|diligence request|counsel review/.test(text)) return "LIMITATION";
  if (/executive|summary|overall|highest-priority|primary .*issue|assessment header|posture/.test(text)) return "TOP";
  if (/evidence quote|source url|artifact id|confidence|taxonomy provenance/.test(text)) return "ANNEXURE";
  return "MATERIAL";
}

function deriveSecondarySections(row, eligibility) {
  if (eligibility === "UPSTREAM_GAP") return [];
  const text = `${row.field_family} ${row.output_field} ${row.mode}`.toLowerCase();
  const sections = [];
  if (/limitation|missing proof|required confirmation|diligence request|review route|counsel/.test(text)) sections.push("09");
  if (/limitation|evidence|source|confidence|provenance|methodology/.test(text)) sections.push("10");
  return [...new Set(sections)];
}

function derivePresentation(row, importance) {
  if (importance === "GAP") return "BLOCKED_NOT_RENDERABLE";
  if (importance === "TOP") return "SUMMARY_OR_CALLOUT";
  if (importance === "LIMITATION") return "LIMITATION_ITEM";
  if (importance === "ANNEXURE") return "TECHNICAL_ANNEXURE_OR_REFERENCE";
  if (/COUNT/.test(String(row.mode))) return "DETERMINISTIC_COUNT";
  return "FIELD_OR_ROW";
}

function deriveTaxonomyResolver(row) {
  const text = `${row.field_id} ${row.field_family} ${row.output_field}`.toLowerCase();
  if (/behavior/.test(text)) return "behavior_class";
  if (/\blane\b/.test(text)) return "lane";
  if (/surface/.test(text)) return "surface";
  if (/subcat|subcategory/.test(text)) return "subcat";
  if (/compliance framework/.test(text)) return "compliance_framework";
  if (/pain tier|pain category/.test(text)) return "pain_tier";
  if (/pain depth/.test(text)) return "pain_depth";
  if (/velocity/.test(text)) return "velocity";
  if (String(row.field_id).startsWith("LEP.REG") && /status/.test(text)) return "legal_status";
  return null;
}

function deriveEmptyPolicy(row, eligibility) {
  if (eligibility === "UPSTREAM_GAP") return "BLOCKED_OWNER_MISSING";
  if (String(row.mode).includes("LIMITATION")) return "PRESERVE_UPSTREAM_EMPTY_OR_NO_LIMITATION_STATE";
  return "PRESERVE_UPSTREAM_VALUE_OR_EXPLICIT_UPSTREAM_LIMITATION";
}

function deriveEvidencePolicy(row) {
  const text = `${row.field_family} ${row.output_field}`.toLowerCase();
  if (/evidence|source|provenance/.test(text)) return "PRESERVE_UPSTREAM_REFERENCE_WITHOUT_COPYING_RAW_EVIDENCE";
  return "NO_NEW_EVIDENCE_DERIVATION_IN_PHASE12";
}

function deriveLimitationPolicy(row) {
  const text = `${row.field_family} ${row.output_field} ${row.mode}`.toLowerCase();
  if (/limitation|missing proof|uncertainty|required confirmation|diligence request/.test(text)) return "CARRY_UPSTREAM_ONLY";
  return "MAY_NOT_CREATE_LIMITATION";
}

function resolveDapArtifacts(fieldId) {
  const token = String(fieldId).split(".")[1];
  const artifact = DAP_BATCH_ARTIFACTS[token];
  if (!artifact) throw new Error(`CO_P12_02_DAP_BATCH_UNMAPPED:${fieldId}:${token}`);
  return [artifact, "data_provenance_profile_semantic_batch_gate"];
}

function assertFdr(rows, metadata) {
  if (rows.length !== EXPECTED_PARSED_ROWS) throw new Error(`CO_P12_02_FDR_PARSED_ROW_COUNT:${rows.length}:${EXPECTED_PARSED_ROWS}`);
  const ids = rows.map((row) => String(row.field_id || ""));
  if (new Set(ids).size !== ids.length) throw new Error("CO_P12_02_FDR_DUPLICATE_FIELD_ID");
  if (ids.some((id) => !id)) throw new Error("CO_P12_02_FDR_FIELD_ID_MISSING");
  if (rows.some((row) => row.lock_status !== "LOCKED")) throw new Error("CO_P12_02_FDR_UNLOCKED_ROW");
  if (Number(metadata.row_count || 0) === rows.length) throw new Error("CO_P12_02_EXPECTED_FDR_METADATA_GAP_NOT_PRESENT");
}

function section(id, key, title, subsections, rules = {}) {
  return { section_id: id, artifact_name: `report_section__${id}_${key}`, section_key: key, title, subsections, rules };
}
function subsection(id, key, title) { return { subsection_id: id, subsection_key: key, title }; }
function owner(phase, artifacts, sectionId) { return { phase, artifacts, section: sectionId, status: "OWNED", gapCode: null }; }
function gapOwner(gapCode) { return { phase: null, artifacts: [], section: null, status: "GAP", gapCode }; }
function resolver(pathValue, keys) { return { authority_path: pathValue, allowed_lookup_keys: keys, missing_code_result: "REGISTRY_KEY_NORMALIZED_NAME_MISSING" }; }
function dumpYaml(value) { return yaml.dump(value, { noRefs: true, lineWidth: 140, sortKeys: false, quotingType: '"', forceQuotes: false }); }

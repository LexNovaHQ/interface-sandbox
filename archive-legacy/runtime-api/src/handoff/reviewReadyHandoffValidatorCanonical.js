import { VAULT_GROUPS, isAllowedVaultPath } from "./vaultCanonicalMap.js";

const REQUIRED_PROFILE_HANDOFFS = Object.freeze(["target_profile", "target_feature_profile", "legal_cartography", "data_provenance_profile", "exposure_profile", "stage8_quality_control_ledger"]);
const REQUIRED_FUNCTIONAL_SECTIONS = Object.freeze(["company_jurisdiction_contacts", "product_delivery_commercial_model", "ai_functionality_autonomy_user_reliance", "data_users_regulated_surfaces", "technical_architecture_ai_supply_chain_integrations", "contracting_output_customer_commitments", "operational_controls_human_review_incident_handling", "document_assembly_instructions", "counsel_review_localisation"]);
const REQUIRED_ASSEMBLY_FIELDS = Object.freeze(["handoff_meta", "stage10_source_packet", "functional_intake_vault", "vault_payload", "target_profile", "feature_map", "threat_findings", "legal_document_status", "vault_prefill_suggestions", "vault_confirmation_questions", "assembly_handoff_intake", "warnings"]);
const REQUIRED_ENVELOPE_FIELDS = Object.freeze(["handoff_id", "run_id", "source_engine", "target_engine", "payload_type", "status", "created_at", "updated_at", "payload_ref", "summary", "warnings"]);
const RETIRED_STAGE10_KEYS = Object.freeze(["legal_stack_review", "legal_stack_control_review", "legal_stack", "document_stack_status", "document_stack_redline", "legal_stack_assessment", "supporting_registry_rows", "stage6_review"]);

const asArray = (value) => Array.isArray(value) ? value : [];
const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const isIsoDate = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));

function countPrefillFields(prefill) { return Object.values(prefill || {}).reduce((sum, group) => sum + Object.keys(group || {}).length, 0); }
function containsRetiredKey(value, path = "$", hits = []) {
  if (!value || typeof value !== "object") return hits;
  if (Array.isArray(value)) { value.forEach((item, index) => containsRetiredKey(item, `${path}[${index}]`, hits)); return hits; }
  for (const [key, child] of Object.entries(value)) {
    if (RETIRED_STAGE10_KEYS.includes(key)) hits.push(`${path}.${key}`);
    containsRetiredKey(child, `${path}.${key}`, hits);
  }
  return hits;
}

function validateProfileHandoffs(packet, errors) {
  if (!isObject(packet.profile_handoffs)) { errors.push("stage10_source_packet.profile_handoffs must be an object."); return; }
  REQUIRED_PROFILE_HANDOFFS.forEach((field) => { if (!isObject(packet.profile_handoffs[field])) errors.push(`stage10_source_packet.profile_handoffs.${field} must be an object.`); });
  if (!Array.isArray(packet.profile_handoffs.exposure_profile?.registry_ledger)) errors.push("stage10_source_packet.profile_handoffs.exposure_profile.registry_ledger must be an array.");
}

function validateStage10SourcePacket(packet, errors) {
  if (!isObject(packet)) { errors.push("stage10_source_packet must be an object."); return; }
  if (packet.stage10_source_packet_version !== "stage10_source_packet_v2") errors.push("stage10_source_packet_version must be stage10_source_packet_v2.");
  if (packet.source_mode !== "profile_handoff_remap_v1") errors.push("stage10_source_packet.source_mode must be profile_handoff_remap_v1.");
  validateProfileHandoffs(packet, errors);
  ["stage9_report_summary", "source_trace", "target_profile", "target_profile_summary", "legal_cartography", "data_provenance_profile", "exposure_profile", "stage8_quality_control_ledger"].forEach((field) => { if (!isObject(packet[field])) errors.push(`stage10_source_packet.${field} must be an object.`); });
  if (!Array.isArray(packet.feature_map)) errors.push("stage10_source_packet.feature_map must be an array.");
  if (!Array.isArray(packet.threat_findings)) errors.push("stage10_source_packet.threat_findings must be an array.");
  if (!Array.isArray(packet.legal_document_status)) errors.push("stage10_source_packet.legal_document_status must be an array.");
  if (!packet.target_profile?.company_name || packet.target_profile.company_name === "Unknown target") errors.push("stage10_source_packet.target_profile.company_name must be populated from the canonical target_profile handoff.");
  const refs = asArray(packet.source_trace?.source_stage_refs);
  REQUIRED_PROFILE_HANDOFFS.forEach((field) => { if (!refs.includes(field)) errors.push(`stage10_source_packet.source_trace.source_stage_refs missing canonical profile ref: ${field}`); });
  if (refs.includes("stage6_review")) errors.push("stage10_source_packet.source_trace.source_stage_refs must not include retired stage6_review.");
}

function validatePrefill(prefill, errors) {
  if (!isObject(prefill)) { errors.push("vault_prefill_suggestions must be an object."); return; }
  VAULT_GROUPS.forEach((group) => { if (!isObject(prefill[group])) errors.push(`vault_prefill_suggestions.${group} must be an object.`); });
  Object.keys(prefill).forEach((group) => { if (!VAULT_GROUPS.includes(group)) errors.push(`vault_prefill_suggestions contains non-canonical group: ${group}`); });
  VAULT_GROUPS.forEach((group) => Object.entries(prefill[group] || {}).forEach(([localPath, suggestion]) => {
    const fieldPath = `${group}.${localPath}`;
    if (!isAllowedVaultPath(fieldPath)) errors.push(`Invalid Vault prefill field path: ${fieldPath}`);
    if (!isObject(suggestion)) { errors.push(`Vault suggestion at ${fieldPath} must be an object.`); return; }
    ["value", "basis", "confidence", "source_finding_ids"].forEach((key) => { if (!(key in suggestion)) errors.push(`Vault suggestion at ${fieldPath} missing ${key}.`); });
    if (!Array.isArray(suggestion.source_finding_ids)) errors.push(`Vault suggestion at ${fieldPath} source_finding_ids must be an array.`);
  }));
}

function validateQuestions(questions, errors) {
  if (!Array.isArray(questions)) { errors.push("vault_confirmation_questions must be an array."); return; }
  questions.forEach((question, index) => {
    if (!isObject(question)) { errors.push(`vault_confirmation_questions[${index}] must be an object.`); return; }
    ["section_key", "question_key", "question", "answer_type", "vault_match", "vault_paths", "assembly_paths", "priority", "required_for", "prefill_status"].forEach((key) => { if (!(key in question)) errors.push(`vault_confirmation_questions[${index}] missing ${key}.`); });
    if (!Array.isArray(question.vault_paths)) errors.push(`vault_confirmation_questions[${index}].vault_paths must be an array.`);
    asArray(question.vault_paths).forEach((path) => { if (!isAllowedVaultPath(path)) errors.push(`vault_confirmation_questions[${index}] has invalid Vault field path: ${path}`); });
    if (!Array.isArray(question.assembly_paths)) errors.push(`vault_confirmation_questions[${index}].assembly_paths must be an array.`);
  });
}

function validateFunctionalSections(functionalSections, questions, errors) {
  if (!isObject(functionalSections)) { errors.push("functional_sections must be an object."); return; }
  REQUIRED_FUNCTIONAL_SECTIONS.forEach((sectionKey) => {
    const section = functionalSections[sectionKey];
    if (!isObject(section)) { errors.push(`functional_sections missing section: ${sectionKey}`); return; }
    ["section_key", "section_label", "section_role", "completion_status", "questions"].forEach((field) => { if (!(field in section)) errors.push(`functional_sections.${sectionKey} missing ${field}.`); });
    if (!Array.isArray(section.questions)) errors.push(`functional_sections.${sectionKey}.questions must be an array.`);
    const groupedCount = asArray(section.questions).length;
    const sourceCount = asArray(questions).filter((question) => question.section_key === sectionKey).length;
    if (groupedCount !== sourceCount) errors.push(`functional_sections.${sectionKey} question count mismatch: section=${groupedCount}, questions=${sourceCount}.`);
  });
}

function validateFunctionalIntakeVault(vault, errors) {
  if (!isObject(vault)) { errors.push("functional_intake_vault must be an object."); return; }
  if (vault.vault_schema_version !== "functional_assembly_intake_vault_v1") errors.push("functional_intake_vault.vault_schema_version must be functional_assembly_intake_vault_v1.");
  if (vault.intake_mode !== "diligence_to_assembly") errors.push("functional_intake_vault.intake_mode must be diligence_to_assembly.");
  if (!isIsoDate(vault.submittedAt)) errors.push("functional_intake_vault.submittedAt must be ISO date-time.");
  validateQuestions(vault.vault_confirmation_questions, errors);
  validatePrefill(vault.vault_prefill_suggestions, errors);
  validateFunctionalSections(vault.functional_sections, vault.vault_confirmation_questions, errors);
}

function validateAssemblyHandoff(assemblyHandoff, errors) {
  if (!isObject(assemblyHandoff)) { errors.push("assembly_handoff must be an object."); return; }
  REQUIRED_ASSEMBLY_FIELDS.forEach((field) => { if (!(field in assemblyHandoff)) errors.push(`assembly_handoff missing required field: ${field}`); });
  const meta = assemblyHandoff.handoff_meta || {};
  if (meta.source_engine !== "diligence") errors.push("assembly_handoff.handoff_meta.source_engine must be diligence.");
  if (meta.target_engine !== "assembly") errors.push("assembly_handoff.handoff_meta.target_engine must be assembly.");
  if (meta.compiler_schema !== "stage9_report_v2") errors.push("assembly_handoff.handoff_meta.compiler_schema must be stage9_report_v2.");
  if (meta.assembler_contract !== "STAGE10_FUNCTIONAL_ASSEMBLY_INTAKE_VAULT_v1") errors.push("assembly_handoff.handoff_meta.assembler_contract must be STAGE10_FUNCTIONAL_ASSEMBLY_INTAKE_VAULT_v1.");
  validateStage10SourcePacket(assemblyHandoff.stage10_source_packet, errors);
  validateFunctionalIntakeVault(assemblyHandoff.functional_intake_vault, errors);
  validatePrefill(assemblyHandoff.vault_prefill_suggestions, errors);
  validateQuestions(assemblyHandoff.vault_confirmation_questions, errors);
}

function validateEnvelope(envelope, errors) {
  if (!isObject(envelope)) { errors.push("handoff_envelope must be an object."); return; }
  REQUIRED_ENVELOPE_FIELDS.forEach((field) => { if (!(field in envelope)) errors.push(`handoff_envelope missing required field: ${field}`); });
  if (envelope.source_engine !== "diligence") errors.push("handoff_envelope.source_engine must be diligence.");
  if (envelope.target_engine !== "assembly") errors.push("handoff_envelope.target_engine must be assembly.");
  if (envelope.payload_type !== "functional_assembly_intake_vault") errors.push("handoff_envelope.payload_type must be functional_assembly_intake_vault.");
}

function validateAgainstSourcePacket(result, errors) {
  const packet = result.stage10_source_packet || result.assembly_handoff?.stage10_source_packet;
  const handoff = result.assembly_handoff || {};
  if (!packet) return;
  if (asArray(packet.feature_map).length > 0 && asArray(handoff.feature_map).length !== asArray(packet.feature_map).length) errors.push("Stage 10 lost canonical feature_map rows from source packet.");
  if (asArray(packet.legal_document_status).length > 0 && asArray(handoff.legal_document_status).length !== asArray(packet.legal_document_status).length) errors.push("Stage 10 lost legal_document_status rows from legal_cartography.");
  if (asArray(packet.threat_findings).length > 0 && asArray(handoff.threat_findings).length !== asArray(packet.threat_findings).length) errors.push("Stage 10 lost threat_findings rows from Stage 9/exposure profile.");
  if (countPrefillFields(handoff.vault_prefill_suggestions) === 0) errors.push("Stage 10 derived no Vault prefill fields from canonical source packet.");
}

export function validateReviewReadyHandoff(result) {
  const errors = [];
  const warnings = [];
  if (!isObject(result)) return { ok: false, errors: ["Stage 10 handoff result must be an object."], warnings };
  if (result.ok !== true) errors.push("Stage 10 result ok must be true.");
  if (result.node !== "node5b_deterministic_backend_assembler_v2") errors.push("Stage 10 result node must be node5b_deterministic_backend_assembler_v2.");
  if (!result.run_id) errors.push("Stage 10 result run_id is required.");
  if (!isObject(result.functional_intake_vault)) errors.push("result.functional_intake_vault is required.");
  if (!isObject(result.vault_payload)) errors.push("result.vault_payload is required.");
  validateStage10SourcePacket(result.stage10_source_packet, errors);
  validateFunctionalIntakeVault(result.functional_intake_vault, errors);
  validateAssemblyHandoff(result.assembly_handoff, errors);
  validateEnvelope(result.handoff_envelope, errors);
  validateAgainstSourcePacket(result, errors);
  if (!isObject(result.persistence_plan)) errors.push("persistence_plan must be an object.");
  else {
    if (result.persistence_plan.payload_collection !== "interface_handoff_payloads") errors.push("persistence_plan.payload_collection must be interface_handoff_payloads.");
    if (result.persistence_plan.envelope_collection !== "interface_handoffs") errors.push("persistence_plan.envelope_collection must be interface_handoffs.");
    if (!result.persistence_plan.payload_ref) errors.push("persistence_plan.payload_ref is required.");
  }
  if (result.handoff_envelope?.payload_ref && result.persistence_plan?.payload_ref && result.handoff_envelope.payload_ref !== result.persistence_plan.payload_ref) errors.push("handoff_envelope.payload_ref must match persistence_plan.payload_ref.");
  containsRetiredKey({ result: { assembly_handoff: result.assembly_handoff, functional_intake_vault: result.functional_intake_vault, vault_payload: result.vault_payload } }).forEach((hit) => errors.push(`Retired Stage 10 field present: ${hit}`));
  if (!Object.values(result.assembly_handoff?.vault_prefill_suggestions || {}).some((group) => Object.keys(group || {}).length > 0)) warnings.push("No Vault prefill suggestions were derived from Stage 10 source packet.");
  return { ok: errors.length === 0, errors, warnings };
}

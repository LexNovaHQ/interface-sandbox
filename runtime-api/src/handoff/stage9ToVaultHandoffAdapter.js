import { buildStage10SourcePacket } from "./stage10SourcePacketBuilder.js";
import { deriveVaultPrefillFromStage10SourcePacket } from "./vaultPrefillFromStage9Locked.js";
import { buildFunctionalSections, deriveVaultQuestionsFromStage10SourcePacket } from "./vaultQuestionsFromStage9.js";
import { createEmptyVaultPayload, normalizeVaultFieldPath } from "./vaultCanonicalMap.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  const randomPart = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${randomPart}`;
}

function setDeep(target, dottedPath, value) {
  const parts = String(dottedPath || "").split(".").filter(Boolean);
  let cursor = target;
  while (parts.length > 1) {
    const key = parts.shift();
    if (!cursor[key] || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  }
  if (parts.length) cursor[parts[0]] = value;
}

function applyPrefillToPayload(vaultPayload, prefill = {}) {
  for (const [group, entries] of Object.entries(prefill || {})) {
    for (const [localPath, suggestion] of Object.entries(entries || {})) {
      const fieldPath = normalizeVaultFieldPath(`${group}.${localPath}`);
      setDeep(vaultPayload, fieldPath, suggestion?.value);
    }
  }
  return vaultPayload;
}

function documentRoutesFromFindings(packet = {}) {
  const routes = new Set();
  const text = JSON.stringify({ findings: packet.threat_findings, legal_document_status: packet.legal_document_status, remediation_path: packet.remediation_path, evidence_gaps: packet.evidence_gaps }).toLowerCase();
  if (/terms|tos|liability|warranty|consumer|contract/.test(text)) routes.add("tos");
  if (/privacy|personal data|pii|processor|deletion|retention|rights/.test(text)) routes.add("privacy_policy");
  if (/dpa|processor|subprocessor|transfer|customer data/.test(text)) routes.add("dpa");
  if (/acceptable use|prohibited|misuse|abuse|fraud/.test(text)) routes.add("aup");
  if (/sla|uptime|availability|service credit|support/.test(text)) routes.add("sla");
  if (/agent|autonomous|human review|workflow|tool/.test(text)) routes.add("ai_agent_terms");
  if (/ip|output ownership|copyright|content|training data/.test(text)) routes.add("ip_output_terms");
  if (/subprocessor/.test(text)) routes.add("subprocessor_schedule");
  if (/decision|human review|handover|appeal/.test(text)) routes.add("human_review_protocol");
  if (/security|incident|audit log|safeguard/.test(text)) routes.add("security_addendum");
  if (/api|developer|sdk|rate limit/.test(text)) routes.add("api_terms");
  if (!routes.size) ["tos", "privacy_policy", "counsel_issue_list"].forEach((route) => routes.add(route));
  return [...routes];
}

function hasAnyQuestion(questions, sectionKey) {
  return questions.some((question) => question.section_key === sectionKey);
}

function selectedPackage(packet = {}) {
  const docs = documentRoutesFromFindings(packet);
  if (docs.includes("ai_agent_terms") || docs.includes("human_review_protocol")) return "full_ai_legal_architecture_pack";
  if (docs.includes("dpa") || docs.includes("privacy_policy")) return "privacy_dpa_pack";
  if (docs.includes("ip_output_terms") || docs.includes("api_terms")) return "ai_terms_pack";
  return "full_ai_legal_architecture_pack";
}

function buildAssemblyHandoffIntake(packet = {}, questions = []) {
  const gaps = asArray(packet.evidence_gaps?.open_information_requests || packet.evidence_gaps?.open_information_request_list);
  const docs = documentRoutesFromFindings(packet);
  const targetRegions = asArray(packet.target_profile_v2?.market_context?.target_geographies);
  const primaryJurisdiction = asText(packet.target_profile_v2?.jurisdiction?.registered_or_notice_country || packet.target_profile_v2?.jurisdiction?.governing_law_country || packet.target_profile?.jurisdiction?.country, "unknown");
  return {
    package_selection: { selected_package: selectedPackage(packet), custom_package_description: "" },
    document_routes: {
      selected_documents: docs,
      missing_document_policy: asArray(packet.legal_document_status).length ? "treat_as_drafting_target" : "ask_client_first",
      existing_document_treatment: asArray(packet.legal_document_status).some((doc) => doc.document_status === "visible" || doc.access_status === "ingested") ? "hybrid" : "draft_fresh",
      other_document_description: ""
    },
    drafting_preferences: {
      style: packet.target_profile_v2?.business_model?.market_type_candidate === "b2c" ? "consumer" : "enterprise_saas",
      risk_posture: asArray(packet.threat_findings).length ? "conservative_legal_review_heavy" : "balanced",
      counsel_notes: true,
      jurisdiction_placeholders: true,
      preserve_brand_language: false,
      bracket_unresolved_gaps: gaps.length > 0,
      custom_notes: hasAnyQuestion(questions, "contracting_output_customer_commitments") ? "Confirm commercial and liability posture before final assembly." : ""
    },
    output_options: { review_ready_drafts: true, issue_list_for_counsel: true, counsel_checklist: true, executive_summary: true, machine_readable_exports: true },
    localisation: { target_regions: targetRegions, primary_jurisdiction: primaryJurisdiction, governing_law_instruction: "counsel_to_decide", courts_or_venue_instruction: "", localisation_notes: "Review-Ready Drafts require local counsel review before use." },
    local_counsel_review: { local_counsel_review_required: true, priority_points: asArray(packet.threat_findings).slice(0, 10).map((finding) => `${finding.finding_id}: ${finding.finding_title}`), counsel_templates_available: false, counsel_template_notes: "" },
    operational_controls: { human_approval_required_for: [], audit_logging: "unknown", escalation_owner: "", incident_response_or_shutdown: "", customer_notice_for_ai_use: "unknown", fallback_or_shutdown_rules: "" },
    source_materials: { client_templates_available: false, existing_docs_urls: asArray(packet.source_materials?.existing_docs_urls), template_notes: "" },
    unresolved_gap_policy: { treatment: gaps.length ? "bracket_in_drafts" : "counsel_notes_only", notes: gaps.length ? `${gaps.length} open information request(s) should remain bracketed or confirmed before final use.` : "No open information requests were surfaced by Stage 9." },
    assembly_warnings: asArray(packet.source_trace?.mapping_warnings)
  };
}

function createHandoffEnvelope({ runId, payloadRef, summary, warnings }) {
  const timestamp = nowIso();
  return { handoff_id: createId("handoff"), run_id: runId, source_engine: "diligence", target_engine: "assembly", payload_type: "functional_assembly_intake_vault", status: "draft", created_at: timestamp, updated_at: timestamp, payload_ref: payloadRef, summary, warnings: Array.isArray(warnings) ? warnings : [String(warnings)] };
}

function createSummary(packet, questions) {
  return `Functional Assembly Intake Vault for ${packet.target_profile?.company_name || "Unknown target"} / ${packet.target_profile?.product_name || "product"} (${questions.length} intake question${questions.length === 1 ? "" : "s"}).`;
}

export function assembleStage10VaultHandoff(stage9ReportDataOrInput, options = {}) {
  const input = stage9ReportDataOrInput?.stage9ReportData || stage9ReportDataOrInput?.stage9_report_data || stage9ReportDataOrInput || {};
  const stage10SourcePacket = stage9ReportDataOrInput?.stage10SourcePacket || options.stage10SourcePacket || buildStage10SourcePacket({
    stage9ReportData: input,
    stage6Cache: stage9ReportDataOrInput?.stage6Cache || options.stage6Cache || {},
    stage7Artifact: stage9ReportDataOrInput?.stage7Artifact || options.stage7Artifact || {},
    stage8Ledger: stage9ReportDataOrInput?.stage8Ledger || options.stage8Ledger || {},
    runId: options.runId
  });

  const warnings = asArray(stage10SourcePacket.source_trace?.mapping_warnings);
  const runId = options.runId || stage10SourcePacket.run_id;
  const createdAt = options.createdAt || nowIso();
  const vault_prefill_suggestions = deriveVaultPrefillFromStage10SourcePacket(stage10SourcePacket, warnings);
  const vault_confirmation_questions = deriveVaultQuestionsFromStage10SourcePacket(stage10SourcePacket);
  const functional_sections = buildFunctionalSections(vault_confirmation_questions);
  const vault_payload = applyPrefillToPayload(createEmptyVaultPayload({ status: "needs_confirmation", submittedAt: createdAt }), vault_prefill_suggestions);
  vault_payload.status = vault_confirmation_questions.some((question) => ["needs_confirmation", "manual_only", "unknown"].includes(question.prefill_status)) ? "needs_confirmation" : "prefill_ready";
  vault_payload.submittedAt = createdAt;
  const assembly_handoff_intake = buildAssemblyHandoffIntake(stage10SourcePacket, vault_confirmation_questions);

  const functional_intake_vault = { vault_schema_version: "functional_assembly_intake_vault_v1", intake_mode: "diligence_to_assembly", functional_sections, vault_payload, vault_prefill_suggestions, vault_confirmation_questions, assembly_handoff_intake, source_trace: { ...stage10SourcePacket.source_trace, mapping_warnings: warnings }, status: vault_payload.status, submittedAt: createdAt };
  const assembly_handoff = { handoff_meta: { run_id: runId, created_at: createdAt, source_engine: "diligence", target_engine: "assembly", compiler_schema: "stage9_report_v2", assembler_contract: "STAGE10_FUNCTIONAL_ASSEMBLY_INTAKE_VAULT_v1", canonical_output_shape: "functional_assembly_intake_vault" }, stage10_source_packet: stage10SourcePacket, functional_intake_vault, vault_payload, target_profile: stage10SourcePacket.target_profile, feature_map: stage10SourcePacket.feature_map, threat_findings: stage10SourcePacket.threat_findings, legal_document_status: stage10SourcePacket.legal_document_status, vault_prefill_suggestions, vault_confirmation_questions, assembly_handoff_intake, warnings };
  const pendingPayloadRef = options.payloadRef || "interface_handoff_payloads/pending";
  const handoff_envelope = createHandoffEnvelope({ runId, payloadRef: pendingPayloadRef, summary: createSummary(stage10SourcePacket, vault_confirmation_questions), warnings });
  const payload_ref = pendingPayloadRef === "interface_handoff_payloads/pending" ? `interface_handoff_payloads/${handoff_envelope.handoff_id}` : pendingPayloadRef;

  return { ok: true, stage: "10", node: "node5b_deterministic_backend_assembler_v2", run_id: runId, stage10_source_packet: stage10SourcePacket, functional_intake_vault, vault_payload, vault_prefill_suggestions, vault_confirmation_questions, assembly_handoff, handoff_envelope: { ...handoff_envelope, payload_ref }, persistence_plan: { payload_collection: "interface_handoff_payloads", envelope_collection: "interface_handoffs", stage_output_path: `interface_runs/${runId}/stage_outputs/stage_10_functional_assembly_intake_vault`, payload_ref }, warnings };
}

import { isAllowedVaultPath, normalizeVaultFieldPath } from "./vaultCanonicalMap.js";

export const FUNCTIONAL_SECTION_DEFS = Object.freeze({
  company_jurisdiction_contacts: { label: "Company, Jurisdiction & Contacts", role: "Confirm the legal target, notice details, jurisdiction, and regional posture." },
  product_delivery_commercial_model: { label: "Product, Delivery & Commercial Model", role: "Confirm product scope, delivery channels, integrations, customer model, and commercial posture." },
  ai_functionality_autonomy_user_reliance: { label: "AI Functionality, Autonomy & User Reliance", role: "Confirm the product's AI behavior, autonomy, human review, and reliance surfaces." },
  data_users_regulated_surfaces: { label: "Data, Users & Regulated Surfaces", role: "Confirm personal/sensitive data, users, regions, and regulated data surfaces." },
  technical_architecture_ai_supply_chain_integrations: { label: "Technical Architecture, AI Supply Chain & Integrations", role: "Confirm AI providers, upstream subprocessors, downstream integrations, hosting, logging, security, and API configuration." },
  contracting_output_customer_commitments: { label: "Contracting, Output Ownership & Customer Commitments", role: "Confirm commercial commitments, output ownership, SLA, reliance threshold, and customer-facing legal posture." },
  operational_controls_human_review_incident_handling: { label: "Operational Controls, Human Review & Incident Handling", role: "Confirm human approval gates, logging, escalation, incident response, and fallback/shutdown rules." },
  document_assembly_instructions: { label: "Document Assembly Instructions", role: "Confirm package, document routes, drafting mode, style, and output options for final assembly." },
  counsel_review_localisation: { label: "Counsel Review & Localisation", role: "Confirm jurisdictional treatment, local counsel review queue, source materials, and unresolved gap policy." }
});

const AI_PROVIDER_OPTIONS = Object.freeze(["openai", "anthropic", "google_gemini", "cohere", "mistral", "meta_llama", "deepseek", "xai", "azure_openai", "aws_bedrock", "self_hosted_oss", "other", "unknown"]);
function asArray(value) { return Array.isArray(value) ? value : []; }
function asText(value, fallback = "") { const text = String(value ?? "").trim(); return text || fallback; }
function unique(values = []) { return [...new Set(asArray(values).map((value) => asText(value)).filter(Boolean))]; }
function validPaths(paths = []) { return unique(paths.map(normalizeVaultFieldPath)).filter(isAllowedVaultPath); }

function createQuestion({ sectionKey, questionKey, question, answerType = "text", options = [], vaultMatch = "none", vaultPaths = [], assemblyPaths = [], priority = "medium", requiredFor = [], prefillStatus = "needs_confirmation", matchNotes = "", whyItMatters = "", sourceContext = "", evidenceRefs = [], relatedFindingIds = [], relatedDocumentRoutes = [], relatedDataFlowIds = [], allowedValues = [] }) {
  return {
    section_key: sectionKey,
    section_label: FUNCTIONAL_SECTION_DEFS[sectionKey]?.label || sectionKey,
    question_key: questionKey,
    question,
    answer_type: answerType,
    options,
    vault_match: vaultMatch,
    vault_paths: validPaths(vaultPaths),
    assembly_paths: unique(assemblyPaths),
    priority,
    required_for: unique(requiredFor),
    prefill_status: prefillStatus,
    match_notes: matchNotes,
    why_it_matters: whyItMatters,
    source_context: sourceContext,
    evidence_refs: unique(evidenceRefs),
    related_finding_ids: unique(relatedFindingIds),
    related_document_routes: unique(relatedDocumentRoutes),
    related_data_flow_ids: unique(relatedDataFlowIds),
    allowed_values: allowedValues
  };
}

function addQuestion(questions, question) {
  const key = `${question.section_key}.${question.question_key}`;
  if (questions.some((existing) => `${existing.section_key}.${existing.question_key}` === key)) return;
  questions.push(question);
}

function sectionWarningsFor(sectionKey, questions = []) {
  const sectionQuestions = questions.filter((q) => q.section_key === sectionKey);
  const manualOnly = sectionQuestions.filter((q) => q.prefill_status === "manual_only").length;
  const partial = sectionQuestions.filter((q) => q.vault_match === "partial").length;
  return [
    manualOnly ? `${manualOnly} question(s) require manual input because they are not provable from diligence evidence.` : "",
    partial ? `${partial} question(s) map partially to Vault payload and also feed Assembly instructions.` : ""
  ].filter(Boolean);
}

export function buildFunctionalSections(questions = []) {
  return Object.fromEntries(Object.entries(FUNCTIONAL_SECTION_DEFS).map(([sectionKey, def]) => {
    const sectionQuestions = questions.filter((question) => question.section_key === sectionKey);
    const unanswered = sectionQuestions.filter((question) => ["needs_confirmation", "manual_only", "unknown"].includes(question.prefill_status)).length;
    return [sectionKey, {
      section_key: sectionKey,
      section_label: def.label,
      section_role: def.role,
      completion_status: unanswered ? "needs_confirmation" : "complete",
      prefill_summary: sectionQuestions.length ? `${sectionQuestions.length} intake question(s), ${unanswered} requiring confirmation/manual input.` : "No questions generated for this section.",
      questions: sectionQuestions,
      section_warnings: sectionWarningsFor(sectionKey, sectionQuestions)
    }];
  }));
}

function addCoreCompanyQuestions(packet, questions) {
  addQuestion(questions, createQuestion({ sectionKey: "company_jurisdiction_contacts", questionKey: "confirm_company_name", question: "Please confirm the legal company name that should appear in the documents.", answerType: "text", vaultMatch: "perfect", vaultPaths: ["baseline.company"], priority: "critical", requiredFor: ["Matter profile", "Terms", "Privacy Policy", "DPA"], prefillStatus: packet.target_profile?.company_name && packet.target_profile.company_name !== "Unknown target" ? "prefilled" : "manual_only", sourceContext: "Mapped from target_profile_v2.identity." }));
  addQuestion(questions, createQuestion({ sectionKey: "company_jurisdiction_contacts", questionKey: "confirm_jurisdiction", question: "Please confirm primary legal jurisdiction and state/province, if applicable.", answerType: "object", vaultMatch: "perfect", vaultPaths: ["baseline.jurisdiction.country", "baseline.jurisdiction.state"], assemblyPaths: ["assembly_handoff_intake.localisation.primary_jurisdiction"], priority: "critical", requiredFor: ["Local counsel review", "Governing law placeholders"], prefillStatus: packet.target_profile?.jurisdiction?.country ? "needs_confirmation" : "manual_only", sourceContext: "Mapped from target_profile_v2.jurisdiction." }));
  addQuestion(questions, createQuestion({ sectionKey: "company_jurisdiction_contacts", questionKey: "governing_law_and_venue", question: "Should governing law and courts/venue be selected now, bracketed, or left for local counsel?", answerType: "single_select", options: ["selected", "bracketed", "counsel_to_decide", "unknown"], vaultMatch: "none", assemblyPaths: ["assembly_handoff_intake.localisation.governing_law_instruction", "assembly_handoff_intake.localisation.courts_or_venue_instruction"], priority: "high", requiredFor: ["Localisation", "Counsel review"], prefillStatus: "needs_confirmation", sourceContext: "Diligence may detect jurisdiction signals but cannot choose counsel-specific venue language." }));
}

function addProductQuestions(packet, questions) {
  addQuestion(questions, createQuestion({ sectionKey: "product_delivery_commercial_model", questionKey: "confirm_products_and_delivery", question: "Please confirm product names and delivery channels: web, app, mobile, API.", answerType: "object", vaultMatch: "perfect", vaultPaths: ["baseline.products", "baseline.delivery.web", "baseline.delivery.app", "baseline.delivery.mobile", "baseline.delivery.api"], priority: "critical", requiredFor: ["Document scope", "Service description", "API terms"], prefillStatus: asArray(packet.feature_map).length ? "needs_confirmation" : "manual_only", sourceContext: "Mapped from target_profile_v2.product_baseline and feature_profile_v2.feature_inventory." }));
  addQuestion(questions, createQuestion({ sectionKey: "product_delivery_commercial_model", questionKey: "confirm_market_and_revenue", question: "Please confirm whether the product is B2B, B2C, or hybrid, and the revenue model.", answerType: "object", vaultMatch: "perfect", vaultPaths: ["baseline.market", "baseline.revenue_model"], priority: "high", requiredFor: ["Terms", "Commercial model", "Liability route"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from target_profile_v2.business_model." }));
  addQuestion(questions, createQuestion({ sectionKey: "product_delivery_commercial_model", questionKey: "confirm_integrations", question: "Which downstream systems can the product connect to?", answerType: "multi_select", options: ["slack", "crm", "stripe", "github", "webhooks", "email", "calendar", "ticketing", "hris", "payment_billing", "database", "custom_api", "none", "other"], vaultMatch: "perfect", vaultPaths: ["baseline.integrations.slack", "baseline.integrations.crm", "baseline.integrations.stripe", "baseline.integrations.github", "baseline.integrations.webhooks", "baseline.integrations.email", "baseline.integrations.calendar", "baseline.integrations.ticketing", "baseline.integrations.hris", "baseline.integrations.payment_billing", "baseline.integrations.database", "baseline.integrations.custom_api", "baseline.integrations.none", "baseline.integrations.other"], assemblyPaths: ["assembly_handoff_intake.operational_controls.human_approval_required_for"], priority: "high", requiredFor: ["AUP", "API terms", "Agent governance", "Liability controls"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from product_baseline.integration_candidates and Stage 5 architecture hints." }));
}

function addAiFunctionQuestions(packet, questions) {
  addQuestion(questions, createQuestion({ sectionKey: "ai_functionality_autonomy_user_reliance", questionKey: "confirm_ai_archetypes", question: "Please confirm which AI functionality applies: actions, orchestration, content generation, document/data reading, conversational UI, decision support, security, optimization, or physical-world control.", answerType: "multi_select", options: ["doer", "orchestrator", "creator", "reader", "conversational_ui", "judge", "optimizer", "shield", "mover", "generalist"], vaultMatch: "perfect", vaultPaths: ["archetypes.is_doer", "archetypes.is_orchestrator", "archetypes.is_creator", "archetypes.is_reader", "archetypes.conversational_ui", "archetypes.is_judge", "archetypes.is_optimizer", "archetypes.is_shield", "archetypes.is_mover", "archetypes.is_generalist"], assemblyPaths: ["assembly_handoff_intake.document_routes.selected_documents"], priority: "critical", requiredFor: ["AI terms", "AUP", "Human review protocol"], prefillStatus: asArray(packet.feature_map).some((f) => asArray(f.archetype_codes).length) ? "needs_confirmation" : "manual_only", sourceContext: "Mapped from feature_profile_v2.feature_inventory.archetype_codes." }));
  addQuestion(questions, createQuestion({ sectionKey: "ai_functionality_autonomy_user_reliance", questionKey: "human_review_and_reliance", question: "Which outputs or actions require human review before reliance, send, transaction, decision, or customer-facing use?", answerType: "repeatable_table", vaultMatch: "none", assemblyPaths: ["assembly_handoff_intake.operational_controls.human_approval_required_for"], priority: "critical", requiredFor: ["Human Review Protocol", "AI/Agent Terms", "Liability limits"], prefillStatus: "manual_only", sourceContext: "Stage 5 can detect human-review signals, but actual approval gates require client confirmation." }));
}

function addDataQuestions(packet, questions) {
  addQuestion(questions, createQuestion({ sectionKey: "data_users_regulated_surfaces", questionKey: "confirm_personal_and_sensitive_data", question: "Please confirm personal data, sensitive data, minors, employee, health, financial, and vulnerable-user surfaces.", answerType: "object", vaultMatch: "perfect", vaultPaths: ["compliance.processes_pii", "compliance.sens_health", "compliance.sens_fin", "compliance.sens_employment", "compliance.minors", "compliance.distress", "compliance.standard_adults"], assemblyPaths: ["assembly_handoff_intake.document_routes.selected_documents"], priority: "critical", requiredFor: ["Privacy Policy", "DPA", "DPIA memo", "Sensitive data clauses"], prefillStatus: asArray(packet.stage6_review?.data_provenance_profile?.data_flow_profile).length ? "needs_confirmation" : "manual_only", sourceContext: "Mapped from Stage 6B data_provenance_profile." }));
  addQuestion(questions, createQuestion({ sectionKey: "data_users_regulated_surfaces", questionKey: "confirm_regions_and_transfers", question: "Please confirm EU/UK, California, India, and other user/customer regions, plus any cross-border transfers.", answerType: "multi_select", vaultMatch: "perfect", vaultPaths: ["compliance.eu_users", "compliance.ca_users", "compliance.other_regions"], assemblyPaths: ["assembly_handoff_intake.localisation.target_regions"], priority: "high", requiredFor: ["Privacy Policy", "DPA", "Local counsel review"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from target_profile_v2.market_context and Stage 6B transfer/regime signals." }));
}

function addTechnicalQuestions(packet, questions) {
  addQuestion(questions, createQuestion({ sectionKey: "technical_architecture_ai_supply_chain_integrations", questionKey: "ai_provider_stack", question: "Which AI/model providers are used?", answerType: "multi_select", options: AI_PROVIDER_OPTIONS, vaultMatch: "partial", vaultPaths: ["architecture.ai_provider_stack.providers", "architecture.sub_processors.openai", "architecture.sub_processors.anthropic", "architecture.sub_processors.google", "architecture.sub_processors.cohere", "architecture.sub_processors.mistral", "architecture.sub_processors.azure_openai", "architecture.sub_processors.aws_bedrock", "architecture.sub_processors.meta_llama", "architecture.sub_processors.deepseek", "architecture.sub_processors.xai", "architecture.sub_processors.other"], assemblyPaths: ["assembly_handoff_intake.document_routes.selected_documents", "assembly_handoff_intake.source_materials.existing_docs_urls"], priority: "critical", requiredFor: ["DPA", "Subprocessor Schedule", "AI Terms", "Privacy Policy"], prefillStatus: "needs_confirmation", matchNotes: "User-facing provider stack maps to provider array plus compatibility flags.", sourceContext: "Mapped from Stage 5 architecture hints and Stage 6B processor chain." }));
  addQuestion(questions, createQuestion({ sectionKey: "technical_architecture_ai_supply_chain_integrations", questionKey: "model_memory_improvement", question: "Is the system stateless, RAG/retrieval-based, fine-tuned, or mixed, and are customer inputs used for training/evaluation/product improvement?", answerType: "object", vaultMatch: "perfect", vaultPaths: ["architecture.memory", "architecture.model_improvement.customer_inputs_used_for_training", "architecture.model_improvement.customer_inputs_used_for_evaluation", "architecture.model_improvement.product_improvement_use", "architecture.model_improvement.opt_out_available"], assemblyPaths: ["assembly_handoff_intake.document_routes.selected_documents"], priority: "critical", requiredFor: ["Privacy Policy", "DPA", "AI Terms", "IP/output terms"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from feature_profile_v2.data_provenance_map and Stage 6B processing purpose." }));
  addQuestion(questions, createQuestion({ sectionKey: "technical_architecture_ai_supply_chain_integrations", questionKey: "upstream_subprocessors", question: "List upstream technical providers/subprocessors that process customer or user data, and provide the public subprocessor URL if available.", answerType: "repeatable_table", vaultMatch: "partial", vaultPaths: ["architecture.sub_processors.url", "architecture.ai_provider_stack.public_provider_disclosure_url"], assemblyPaths: ["assembly_handoff_intake.document_routes.selected_documents", "assembly_handoff_intake.source_materials.existing_docs_urls"], priority: "critical", requiredFor: ["DPA", "Subprocessor Schedule", "Cross-border transfer review"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from Stage 6A subprocessor documents and Stage 6B processor chain." }));
  addQuestion(questions, createQuestion({ sectionKey: "technical_architecture_ai_supply_chain_integrations", questionKey: "downstream_external_actions", question: "Can the product send messages, update systems, trigger workflows, initiate payments/bookings, or otherwise act in downstream systems?", answerType: "repeatable_table", vaultMatch: "partial", vaultPaths: ["baseline.integrations.slack", "baseline.integrations.crm", "baseline.integrations.stripe", "baseline.integrations.github", "baseline.integrations.webhooks", "baseline.integrations.custom_api"], assemblyPaths: ["assembly_handoff_intake.operational_controls.human_approval_required_for"], priority: "critical", requiredFor: ["Agent Governance Terms", "AUP", "Liability controls"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from Stage 5 external_action_signal, autonomy_level, integrations, and DOE/LIA findings." }));
  addQuestion(questions, createQuestion({ sectionKey: "technical_architecture_ai_supply_chain_integrations", questionKey: "hosting_logging_security_api", question: "Please confirm hosting, hosting regions, deployment model, storage/logging, encryption, trust/status page, API/SDK availability, rate limits, and customer-configurable tools.", answerType: "object", vaultMatch: "perfect", vaultPaths: ["architecture.cloud_host", "architecture.hosting_regions", "architecture.deployment_model", "architecture.storage_logging.stores_prompts", "architecture.storage_logging.stores_uploaded_files", "architecture.storage_logging.stores_generated_outputs", "architecture.storage_logging.conversation_history", "architecture.storage_logging.audit_logs", "architecture.security_controls.encryption_at_rest", "architecture.security_controls.encryption_in_transit", "architecture.security_controls.status_or_trust_url", "architecture.api_developer_config.api_or_sdk_available", "architecture.api_developer_config.rate_limits_or_usage_limits", "architecture.api_developer_config.customer_configurable_tools"], assemblyPaths: ["assembly_handoff_intake.document_routes.selected_documents"], priority: "high", requiredFor: ["Security Addendum", "API Terms", "DPA", "SLA"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from Stage 5 architecture hints, Stage 6A trust/security docs, and Stage 6B security/accountability signals." }));
}

function addContractAndOpsQuestions(packet, questions) {
  addQuestion(questions, createQuestion({ sectionKey: "contracting_output_customer_commitments", questionKey: "output_ownership_sla_reliance", question: "Please confirm output ownership, SLA position, ACV/contract value, and reliance threshold.", answerType: "object", vaultMatch: "perfect", vaultPaths: ["baseline.output_ownership", "baseline.sla_type", "baseline.acv", "baseline.reliance_threshold"], assemblyPaths: ["assembly_handoff_intake.drafting_preferences.risk_posture", "assembly_handoff_intake.document_routes.selected_documents"], priority: "high", requiredFor: ["Terms", "SLA", "IP/output terms", "Liability controls"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from Stage 6A control families and Stage 9 remediation findings." }));
  addQuestion(questions, createQuestion({ sectionKey: "operational_controls_human_review_incident_handling", questionKey: "operational_controls", question: "Please confirm human approval gates, audit logging, escalation owner, incident response/shutdown rules, customer AI notice, and fallback rules.", answerType: "object", vaultMatch: "partial", vaultPaths: ["architecture.storage_logging.audit_logs"], assemblyPaths: ["assembly_handoff_intake.operational_controls.human_approval_required_for", "assembly_handoff_intake.operational_controls.audit_logging", "assembly_handoff_intake.operational_controls.escalation_owner", "assembly_handoff_intake.operational_controls.incident_response_or_shutdown", "assembly_handoff_intake.operational_controls.customer_notice_for_ai_use", "assembly_handoff_intake.operational_controls.fallback_or_shutdown_rules"], priority: "critical", requiredFor: ["Human Review Protocol", "Internal AI SOP", "AI/Agent Terms"], prefillStatus: "manual_only", sourceContext: "Diligence can identify risk surfaces; operating controls require client confirmation." }));
  addQuestion(questions, createQuestion({ sectionKey: "operational_controls_human_review_incident_handling", questionKey: "agentic_limits", question: "Please confirm agent session cap, period cap, retry limit, and loop threshold.", answerType: "object", vaultMatch: "perfect", vaultPaths: ["archetypes.agent_limits.session_cap", "archetypes.agent_limits.period_cap", "archetypes.agent_limits.retry_limit", "archetypes.agent_limits.loop_threshold"], assemblyPaths: ["assembly_handoff_intake.operational_controls.human_approval_required_for"], priority: "critical", requiredFor: ["Agent Governance Terms", "Operational control schedule"], prefillStatus: "manual_only", sourceContext: "Agent limits are usually internal controls and should not be inferred from public evidence." }));
}

function addAssemblyQuestions(packet, questions) {
  const findings = asArray(packet.threat_findings);
  const gaps = asArray(packet.evidence_gaps?.open_information_requests || packet.evidence_gaps?.open_information_request_list);
  addQuestion(questions, createQuestion({ sectionKey: "document_assembly_instructions", questionKey: "package_and_documents", question: "Which package and documents should Final Assembly generate or update?", answerType: "object", vaultMatch: "none", assemblyPaths: ["assembly_handoff_intake.package_selection.selected_package", "assembly_handoff_intake.document_routes.selected_documents", "assembly_handoff_intake.document_routes.missing_document_policy", "assembly_handoff_intake.document_routes.existing_document_treatment"], priority: "critical", requiredFor: ["Final Assembly"], prefillStatus: findings.length ? "needs_confirmation" : "manual_only", sourceContext: "Mapped from Stage 9 remediation path, legal document review, and exposure findings." }));
  addQuestion(questions, createQuestion({ sectionKey: "document_assembly_instructions", questionKey: "drafting_preferences_and_outputs", question: "Please confirm drafting style, risk posture, counsel notes, jurisdiction placeholders, brand-language preservation, unresolved-gap bracketing, and output options.", answerType: "object", vaultMatch: "none", assemblyPaths: ["assembly_handoff_intake.drafting_preferences", "assembly_handoff_intake.output_options", "assembly_handoff_intake.unresolved_gap_policy"], priority: "high", requiredFor: ["Final Assembly"], prefillStatus: "needs_confirmation", sourceContext: "Mapped from Stage 9 remediation and evidence gaps." }));
  addQuestion(questions, createQuestion({ sectionKey: "counsel_review_localisation", questionKey: "counsel_review_localisation", question: "Please confirm target regions, primary jurisdiction, governing-law handling, local counsel priority points, existing templates, existing document URLs, and unresolved-gap treatment.", answerType: "object", vaultMatch: "none", assemblyPaths: ["assembly_handoff_intake.localisation", "assembly_handoff_intake.local_counsel_review", "assembly_handoff_intake.source_materials", "assembly_handoff_intake.unresolved_gap_policy"], priority: "critical", requiredFor: ["Local counsel review", "Final Assembly"], prefillStatus: gaps.length ? "needs_confirmation" : "manual_only", sourceContext: "Mapped from Stage 4 jurisdiction, Stage 6 document inventory, Stage 9 gaps, and remediation route." }));
}

export function deriveVaultQuestionsFromStage10SourcePacket(stage10SourcePacket = {}) {
  const questions = [];
  addCoreCompanyQuestions(stage10SourcePacket, questions);
  addProductQuestions(stage10SourcePacket, questions);
  addAiFunctionQuestions(stage10SourcePacket, questions);
  addDataQuestions(stage10SourcePacket, questions);
  addTechnicalQuestions(stage10SourcePacket, questions);
  addContractAndOpsQuestions(stage10SourcePacket, questions);
  addAssemblyQuestions(stage10SourcePacket, questions);
  return questions;
}

export function deriveVaultQuestionsFromStage9(stage9OrPacket) {
  return deriveVaultQuestionsFromStage10SourcePacket(stage9OrPacket);
}

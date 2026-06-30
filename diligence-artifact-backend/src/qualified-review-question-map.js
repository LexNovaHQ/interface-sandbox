const C = "CERT" + "-In";
const CY = "cy" + "ber";
const BREACH = "bre" + "ach";

const DOCS = Object.freeze({
  tos: ["DOC_AI_A_TOS"],
  pp: ["DOC_AI_A_PP"],
  dpa: ["DOC_AI_A_DPA"],
  aup: ["DOC_AI_A_AUP"],
  agt: ["DOC_AI_A_AGT"],
  sla: ["DOC_AI_A_SLA"],
  pbk: ["DOC_AI_A_PBK"],
  scan: ["DOC_AI_B__SCAN"],
  hnd: ["DOC_AI_B_HND"],
  ip: ["DOC_AI_B_IP"],
  sop: ["DOC_AI_B_SOP"],
  dpia: ["DOC_AI_B_DPIA"],
  bpbk: ["DOC_AI_B_PBK"]
});

const SECTION_META = Object.freeze([
  ["entity_commercial", "Entity, Notices & Commercial Posture", "Confirm the contracting identity, market posture, and commercial settings used for review-ready draft preparation."],
  ["technology_infrastructure", "Technology & Infrastructure", "Confirm the technical stack, model infrastructure, memory layer, hosting, and subprocessors."],
  ["ai_capability", "AI Capability Review", "Confirm what the product actually does so the correct AI clauses, limits, and controls can be routed."],
  ["privacy_sensitive_use", "Privacy & Sensitive Use Baseline", "Confirm personal-data processing, regional exposure, and sensitive-use contexts."],
  ["india_privacy_cyber", "India Privacy & Cyber Readiness", "Confirm India-specific privacy, transfer, child, event, logging, and governance readiness."],
]);

const Q = Object.freeze([
  q(1,"entity_commercial","company_legal_name","What is the full legal name of the company or operator?","hybrid",["target_profile"],["legal_entity_name","brand_name"],[...DOCS.tos,...DOCS.pp,...DOCS.dpa]),
  q(2,"entity_commercial","entity_type","What type of entity is the operator?","hybrid",["target_profile"],["entity_type"],[...DOCS.tos,...DOCS.dpa]),
  q(3,"entity_commercial","registered_business_address","What address should be used for notices and contract documents?","hybrid",["target_profile","legal_cartography_index"],["registered_notice_country","registered_notice_state","registered_address"],[...DOCS.tos,...DOCS.pp,...DOCS.dpa]),
  q(4,"entity_commercial","legal_notice_email","What email address should receive legal notices?","hybrid",["legal_cartography_index","target_profile"],["legal_notice_email","notice_email"],[...DOCS.tos,...DOCS.dpa]),
  q(5,"entity_commercial","privacy_contact_email","What email address should receive privacy or data protection requests?","hybrid",["data_provenance_profile","legal_cartography_index"],["privacy_governance_contact_accountability_signals","privacy_contact_email"],[...DOCS.pp,...DOCS.dpa]),
  q(6,"entity_commercial","products_services","What products, services, APIs, platforms, or tools are being covered?","public_prefilled",["target_feature_profile","target_profile"],["feature_inventory","product_inventory","high_level_offering"],[...DOCS.tos,...DOCS.pp,...DOCS.dpa,...DOCS.agt]),
  q(7,"entity_commercial","governing_jurisdiction","What governing law and venue should apply to the documents?","hybrid",["target_profile","legal_cartography_index"],["governing_law_country","governing_law_state","courts_venue"],[...DOCS.tos,...DOCS.dpa]),
  q(8,"entity_commercial","market_exposure","Which customer or user markets are in scope?","hybrid",["target_profile","integrated_dap_report"],["market_type_candidate","law_regulatory_readiness_matrix","india_market_scope_signal"],[...DOCS.tos,...DOCS.pp,...DOCS.dpa]),
  q(9,"entity_commercial","app_web_delivery","Is the product delivered through a website, dashboard, mobile app, or hosted platform?","public_prefilled",["target_profile","target_feature_profile"],["app_platform_delivery_signal","delivery_channel"],[...DOCS.tos,...DOCS.pp]),
  q(10,"entity_commercial","api_programmatic_delivery","Is the product delivered through an API, SDK, integration, or developer interface?","public_prefilled",["target_profile","target_feature_profile"],["api_programmatic_delivery_signal","delivery_channel"],[...DOCS.tos,...DOCS.dpa,...DOCS.agt]),
  q(11,"entity_commercial","revenue_model","How does the product make money?","manual_private",["target_profile"],["pricing","revenue_model"],[...DOCS.tos],{market:"Early-stage SaaS products commonly use subscription, usage-based, seat-based, API-credit, pilot, or enterprise-contract pricing. Confirm the model before liability, billing, refund, and suspension terms are drafted."}),
  q(12,"entity_commercial","acv_liability_reference","What contract value or pricing level should guide liability caps?","manual_private",[],[],[...DOCS.tos,...DOCS.dpa],{market:"A common SaaS approach is to tie the ordinary liability cap to fees paid over a defined period. Higher-risk exclusions may need separate treatment. This is a commercial/legal judgment, not a public-source fact."}),
  q(13,"entity_commercial","beta_free_tier_posture","Is the product in beta, pilot, free trial, freemium, or paid production use?","hybrid",["target_profile","target_feature_profile"],["pricing","beta","trial"],[...DOCS.tos,...DOCS.sla],{market:"Beta or pilot products usually need stronger disclaimers, narrower support commitments, and lower reliance language than paid production products."}),
  q(14,"entity_commercial","output_ownership_posture","Who should own or control the outputs generated through the product?","manual_private",["legal_cartography_index"],["ownership","output"],[...DOCS.tos,...DOCS.ip],{market:"Many AI SaaS terms assign customer ownership of submitted inputs and customer-facing outputs, while preserving provider ownership of the platform, models, templates, system prompts, and improvements."}),
  q(15,"entity_commercial","sla_posture","Will the company offer uptime, support, response-time, or service-level commitments?","manual_private",["target_profile"],["sla","support"],[...DOCS.sla,...DOCS.tos],{market:"Many early-stage products avoid hard uptime credits unless enterprise customers require them. A softer support-response commitment is often safer than a strict service-credit regime."}),
  q(16,"entity_commercial","integrations","What third-party systems, tools, APIs, or platforms does the product integrate with?","hybrid",["target_feature_profile","data_provenance_profile"],["integrations","vendor_subprocessor_partner_inventory"],[...DOCS.tos,...DOCS.dpa,...DOCS.agt]),
  q(17,"entity_commercial","reliance_threshold","Can customers rely on product output for decisions, transactions, legal/commercial action, or operational execution?","manual_private",["target_feature_profile","exposure_registry_triggered_profile"],["reliance","decision","action"],[...DOCS.tos,...DOCS.agt,...DOCS.aup],{market:"If customers may rely on outputs for consequential decisions, the documents usually need stronger disclaimers, human-review language, prohibited-use terms, and narrower warranties."}),

  q(18,"technology_infrastructure","ai_memory_architecture","Does the system retain user inputs, chat history, workspace memory, embeddings, or long-term context?","hybrid",["data_provenance_profile","integrated_dap_report"],["embeddings_vector_memory_controls","prompt_output_logging_telemetry_controls"],[...DOCS.pp,...DOCS.dpa,...DOCS.scan]),
  q(19,"technology_infrastructure","model_infrastructure","What AI models, model providers, or model-hosting arrangements are used?","hybrid",["data_provenance_profile","target_feature_profile"],["ai_model_provider_processing_chain","model_provider"],[...DOCS.dpa,...DOCS.tos,...DOCS.scan]),
  q(20,"technology_infrastructure","named_ai_subprocessors","Which AI vendors, subprocessors, or infrastructure providers process customer or user data?","hybrid",["data_provenance_profile"],["vendor_subprocessor_partner_inventory","ai_model_provider_processing_chain"],[...DOCS.dpa,...DOCS.pp]),
  q(21,"technology_infrastructure","subprocessor_list_url","Is there a public or internal subprocessor list that should be referenced?","hybrid",["legal_cartography_index","data_provenance_profile"],["subprocessor","vendor_subprocessor_partner_inventory"],[...DOCS.dpa,...DOCS.pp]),
  q(22,"technology_infrastructure","cloud_host","Where is the product hosted or where is customer data stored?","hybrid",["data_provenance_profile"],["cross_border_transfer_location_custody","storage_location"],[...DOCS.dpa,...DOCS.pp,...DOCS.sop]),
  q(23,"technology_infrastructure","vector_retrieval_layer","Does the system use a vector database, embedding store, retrieval layer, or document memory system?","hybrid",["data_provenance_profile","target_feature_profile"],["embeddings_vector_memory_controls","retrieval"],[...DOCS.pp,...DOCS.dpa,...DOCS.scan]),

  q(24,"ai_capability","doer_capability","Can the system take actions for the user or operate tools on the user’s behalf?","hybrid",["target_feature_profile","exposure_registry_triggered_profile"],["doer","external_action_signal"],[...DOCS.agt,...DOCS.tos,...DOCS.aup]),
  q(25,"ai_capability","orchestrator_capability","Can the system coordinate multiple tools, agents, APIs, workflows, or external systems?","hybrid",["target_feature_profile"],["orchestrator","workflow"],[...DOCS.agt,...DOCS.sop]),
  q(26,"ai_capability","agent_session_cap","What limit applies to one agent session or task run?","manual_private",[],[],[...DOCS.agt],{market:"Agentic systems usually need a per-session task boundary, timeout, or operation limit so the system cannot run beyond the user’s intended authorization."}),
  q(27,"ai_capability","agent_period_cap","What time-period or usage cap applies to agentic activity?","manual_private",[],[],[...DOCS.agt,...DOCS.sla],{market:"For agentic products, many teams set daily, monthly, workspace, or plan-based limits to manage cost, safety, and authorization boundaries."}),
  q(28,"ai_capability","retry_limit","What retry or re-execution limit applies when an action fails?","manual_private",[],[],[...DOCS.agt,...DOCS.sop],{market:"A retry cap helps prevent duplicate actions, accidental repeated submissions, cost spikes, and unbounded automation loops."}),
  q(29,"ai_capability","loop_threshold","What guardrail stops repeated loops, runaway execution, or excessive tool calls?","manual_private",[],[],[...DOCS.agt,...DOCS.sop],{market:"Common controls include max tool calls, max elapsed time, max repeated failure count, or forced human confirmation before continuing."}),
  q(30,"ai_capability","creator_capability","Does the system create text, images, code, documents, plans, recommendations, or other outputs?","hybrid",["target_feature_profile"],["creator","output_result"],[...DOCS.tos,...DOCS.aup,...DOCS.ip]),
  q(31,"ai_capability","reader_ingestion_capability","Does the system read, ingest, summarize, classify, or extract from external files, websites, emails, documents, or datasets?","hybrid",["target_feature_profile","data_provenance_profile"],["reader","collection_sources_and_activity_data_flows"],[...DOCS.pp,...DOCS.dpa,...DOCS.tos]),
  q(32,"ai_capability","companion_capability","Is the product positioned as an assistant, companion, coach, advisor, support agent, or conversational system?","hybrid",["target_feature_profile"],["companion","assistant"],[...DOCS.tos,...DOCS.aup]),
  q(33,"ai_capability","biometric_translator_capability","Does the product process biometric, voice, image, translation, transcription, or identity-related signals?","hybrid",["target_feature_profile","data_provenance_profile"],["biometric","translation","transcription","sensitive_special_category_signals"],[...DOCS.pp,...DOCS.dpa,...DOCS.dpia]),
  q(34,"ai_capability","judge_capability","Does the system score, rank, approve, reject, evaluate, assess, or make judgment-like outputs?","hybrid",["target_feature_profile","data_provenance_profile"],["judge","automated_decision_profiling_human_review_signal"],[...DOCS.tos,...DOCS.aup,...DOCS.dpia]),
  q(35,"ai_capability","optimizer_capability","Does the system optimize workflows, pricing, targeting, allocation, performance, or business outcomes?","hybrid",["target_feature_profile"],["optimizer"],[...DOCS.tos,...DOCS.aup]),
  q(36,"ai_capability","shield_capability","Does the system detect risk, fraud, abuse, policy violations, safety issues, or compliance issues?","hybrid",["target_feature_profile","exposure_registry_triggered_profile"],["shield","risk","fraud"],[...DOCS.aup,...DOCS.sop]),
  q(37,"ai_capability","mover_capability","Does the system move, transmit, export, sync, route, or transfer data between systems?","hybrid",["target_feature_profile","data_provenance_profile"],["mover","transfer_direction"],[...DOCS.dpa,...DOCS.agt,...DOCS.pp]),
  q(38,"ai_capability","generalist_capability","Is the system a broad-purpose AI assistant rather than a narrow single-purpose tool?","hybrid",["target_feature_profile"],["generalist","high_level_offering"],[...DOCS.tos,...DOCS.aup]),

  q(39,"privacy_sensitive_use","personal_data_processing","Does the product process personal data or personal information?","hybrid",["data_provenance_profile","integrated_dap_report"],["data_categories","india_personal_data_processing_signal"],[...DOCS.pp,...DOCS.dpa]),
  q(40,"privacy_sensitive_use","eu_uk_exposure","Are EU or UK users, customers, employees, or data subjects in scope?","manual_private",["data_provenance_profile"],["law_regulatory_readiness_matrix"],[...DOCS.pp,...DOCS.dpa],{market:"EU/UK exposure usually affects privacy notice detail, DPA terms, transfer wording, data subject rights, and controller/processor role analysis."}),
  q(41,"privacy_sensitive_use","california_exposure","Are California users, customers, employees, or consumers in scope?","manual_private",["data_provenance_profile"],["law_regulatory_readiness_matrix"],[...DOCS.pp],{market:"California exposure may affect privacy notice categories, rights language, sale/share assessments, retention disclosures, and consumer request workflows."}),
  q(42,"privacy_sensitive_use","other_regional_exposure","Are any other privacy, consumer, sectoral, or cross-border regimes likely to matter?","manual_private",["data_provenance_profile"],["law_regulatory_readiness_matrix"],[...DOCS.pp,...DOCS.dpa],{market:"Products with cross-border users often need a jurisdiction matrix rather than a single privacy-law assumption."}),
  q(43,"privacy_sensitive_use","health_medical_biometric_context","Does the product process health, medical, wellness, clinical, biometric, or similar sensitive data?","hybrid",["data_provenance_profile","target_feature_profile"],["sensitive_special_category_signals","biometric"],[...DOCS.pp,...DOCS.dpa,...DOCS.dpia]),
  q(44,"privacy_sensitive_use","financial_data_use","Does the product process financial data or support financial decisions, payments, lending, credit, fraud, or risk analysis?","hybrid",["data_provenance_profile","target_feature_profile"],["financial","sensitive_special_category_signals"],[...DOCS.pp,...DOCS.dpa,...DOCS.dpia]),
  q(45,"privacy_sensitive_use","employment_hr_context","Does the product process employee, contractor, applicant, HR, workplace, or monitoring data?","hybrid",["data_provenance_profile","target_feature_profile"],["employment","workplace"],[...DOCS.hnd,...DOCS.scan,...DOCS.dpia]),
  q(46,"privacy_sensitive_use","children_minors","Could children or minors use the product or be affected by it?","hybrid",["data_provenance_profile","integrated_dap_report"],["children_minors_signal","india_children_under_18_signal"],[...DOCS.pp,...DOCS.aup,...DOCS.dpia]),
  q(47,"privacy_sensitive_use","distress_vulnerable_users","Could the product be used by or affect vulnerable, distressed, dependent, or high-risk users?","manual_private",["data_provenance_profile"],["sensitive_special_category_signals"],[...DOCS.aup,...DOCS.dpia],{market:"High-risk or vulnerable-user contexts usually require stronger disclaimers, escalation paths, restricted uses, and human-review controls."}),

  q(48,"india_privacy_cyber","indian_users","Does the product serve, target, or allow users located in India?","hybrid",["integrated_dap_report","extended_dap_india_readiness_profile"],["india_market_scope_signal"],[...DOCS.pp,...DOCS.dpa,...DOCS.tos]),
  q(49,"india_privacy_cyber","indian_operations","Does the company have Indian operations, employees, contractors, support teams, infrastructure, or an Indian entity?","hybrid",["extended_dap_india_readiness_profile"],["india_operations_signal"],[...DOCS.sop,...DOCS.dpa,...DOCS.hnd]),
  q(50,"india_privacy_cyber","india_exclusion","Does the company intentionally exclude India from the product, terms, or supported territories?","hybrid",["extended_dap_india_readiness_profile"],["india_exclusion_or_no_exclusion_signal"],[...DOCS.tos,...DOCS.pp]),
  q(51,"india_privacy_cyber","indian_personal_data","Does the product process personal data of individuals located in India?","hybrid",["extended_dap_india_readiness_profile","integrated_dap_report"],["india_personal_data_processing_signal"],[...DOCS.pp,...DOCS.dpa]),
  q(52,"india_privacy_cyber","dpdp_role_mapping","For Indian personal data, is the company acting as Data Fiduciary, Data Processor, both, or is the role unclear?","hybrid",["extended_dap_india_readiness_profile"],["india_role_mapping_candidate"],[...DOCS.dpa,...DOCS.pp]),
  q(53,"india_privacy_cyber","dpdp_notice_availability","Is there a privacy notice or policy that can support India-facing notice obligations?","hybrid",["extended_dap_india_readiness_profile"],["india_dpdp_notice_surface_signal"],[...DOCS.pp]),
  q(54,"india_privacy_cyber","purpose_linked_consent_authorization","Are purposes for processing Indian personal data clearly stated and linked to consent, authorization, contract, or user instruction?","hybrid",["extended_dap_india_readiness_profile"],["india_purpose_specificity_signal","india_consent_authorization_signal"],[...DOCS.pp,...DOCS.dpa]),
  q(55,"india_privacy_cyber","withdrawal_route","Is there a visible route for users to withdraw consent, revoke authorization, opt out, or disable processing?","hybrid",["extended_dap_india_readiness_profile"],["india_withdrawal_revocation_signal"],[...DOCS.pp]),
  q(56,"india_privacy_cyber","grievance_contact","Is there a visible grievance, privacy, or complaint contact for Indian users?","hybrid",["extended_dap_india_readiness_profile"],["india_grievance_contact_signal"],[...DOCS.pp,...DOCS.dpa]),
  q(57,"india_privacy_cyber","consent_manager_support","Does the product support, reference, or need to support Consent Manager flows?","manual_private",["extended_dap_india_readiness_profile"],["india_consent_manager_public_signal"],[...DOCS.pp],{market:"If the product materially relies on consent for Indian personal data, confirm whether Consent Manager flows are relevant to the user journey or operating model."}),
  q(58,"india_privacy_cyber","children_under_18_india","Could Indian users under 18 use the product or be affected by its processing?","hybrid",["extended_dap_india_readiness_profile"],["india_children_under_18_signal"],[...DOCS.pp,...DOCS.aup,...DOCS.dpia]),
  q(59,"india_privacy_cyber","verifiable_parental_consent","If Indian children may be involved, is there a route for verifiable parental or guardian consent?","hybrid",["extended_dap_india_readiness_profile"],["india_child_consent_route_signal"],[...DOCS.pp,...DOCS.dpia]),
  q(60,"india_privacy_cyber","child_tracking_profiling","Does the product track, profile, monitor, rank, or personalize experiences for children or minors?","hybrid",["extended_dap_india_readiness_profile"],["india_child_tracking_or_ads_signal"],[...DOCS.pp,...DOCS.aup,...DOCS.dpia]),
  q(61,"india_privacy_cyber","targeted_ads_children","Does the product show, enable, or support targeted advertising to children or minors?","manual_private",["extended_dap_india_readiness_profile"],["india_child_tracking_or_ads_signal"],[...DOCS.pp,...DOCS.aup],{market:"If children may be users, advertising and personalization choices should be confirmed explicitly, not inferred from general marketing language."}),
  q(62,"india_privacy_cyber","transfer_outside_india","Is Indian personal data stored, accessed, hosted, or transferred outside India?","hybrid",["extended_dap_india_readiness_profile"],["india_cross_border_transfer_signal"],[...DOCS.pp,...DOCS.dpa]),
  q(63,"india_privacy_cyber","restricted_territory_screening","Is there a process to screen whether transfers are restricted, prohibited, or blocked for specific territories?","manual_private",["extended_dap_india_readiness_profile"],["india_restricted_territory_screening_gap"],[...DOCS.dpa,...DOCS.sop],{market:"Transfer screening is usually an internal process. Public policies rarely prove it, so treat this as a confirmation question."}),
  q(64,"india_privacy_cyber","india_vendor_transfer_map","Is there a vendor, subprocessor, or transfer map for Indian personal data?","hybrid",["extended_dap_india_readiness_profile"],["india_vendor_transfer_map_signal"],[...DOCS.dpa,...DOCS.pp]),
  q(65,"india_privacy_cyber","cert_in_applicability",`Could ${C} ${CY} event reporting obligations apply to the company, product, infrastructure, or Indian operations?`,"manual_private",["extended_dap_india_readiness_profile"],["india_cert_in_reporting_signal"],[...DOCS.sop,...DOCS.dpa],{market:`If India infrastructure, users, operations, or service delivery are in scope, ${C} applicability should be screened by counsel and operations owners.`}),
  q(66,"india_privacy_cyber","cert_in_point_of_contact",`Who is the internal point of contact for ${C} or India ${CY} event escalation?`,"manual_private",["extended_dap_india_readiness_profile"],["india_cert_in_poc_public_signal"],[...DOCS.sop],{market:"Companies normally nominate an internal owner for regulatory or incident escalation even if the public policy does not name that person."}),
  q(67,"india_privacy_cyber","six_hour_reporting_workflow",`Is there a workflow to assess and escalate reportable ${CY} events within the India reporting window?`,"manual_private",["extended_dap_india_readiness_profile"],["india_six_hour_reporting_workflow_signal"],[...DOCS.sop,...DOCS.dpa],{market:"For time-sensitive reporting regimes, the document pack should reflect internal triage, escalation, evidence preservation, and approval responsibility."}),
  q(68,"india_privacy_cyber","log_retention_180_days","Are system, access, audit, or network logs retained for at least 180 days where required?","manual_private",["extended_dap_india_readiness_profile"],["india_180_day_log_signal"],[...DOCS.sop,...DOCS.dpa],{market:"Log retention is usually an operational fact. Do not rely on public security pages unless retention duration is expressly stated."}),
  q(69,"india_privacy_cyber","logs_accessible_for_india","Can relevant logs be accessed, produced, or preserved for India-related legal, security, or regulatory requests?","manual_private",["extended_dap_india_readiness_profile"],["india_logs_accessible_in_india_signal"],[...DOCS.sop,...DOCS.dpa],{market:"Teams should confirm who can retrieve logs, how quickly, where logs are stored, and whether vendor dependencies affect access."}),
  q(70,"india_privacy_cyber","security_policy","Is there a written security policy or public security posture covering personal data?","hybrid",["extended_dap_india_readiness_profile","data_provenance_profile"],["india_security_policy_signal","security_access_controls"],[...DOCS.dpa,...DOCS.pp,...DOCS.sop]),
  q(71,"india_privacy_cyber","access_controls","Are access controls, role-based permissions, least privilege, or admin controls documented?","hybrid",["extended_dap_india_readiness_profile","data_provenance_profile"],["india_access_control_signal","security_access_controls"],[...DOCS.dpa,...DOCS.sop]),
  q(72,"india_privacy_cyber","vendor_security_terms","Do vendor, processor, or subprocessor terms include security obligations?","hybrid",["extended_dap_india_readiness_profile","data_provenance_profile"],["india_vendor_security_terms_signal","processor_subprocessor_governance_controls"],[...DOCS.dpa]),
  q(73,"india_privacy_cyber","incident_response","Is there an incident response process covering privacy, security, breach, or cyber events?","hybrid",["extended_dap_india_readiness_profile","data_provenance_profile"],["india_incident_response_signal","breach_incident_readiness"],[...DOCS.sop,...DOCS.dpa]),
  q(74,"india_privacy_cyber","audit_trail","Are audit trails, access logs, or monitoring records maintained?","hybrid",["extended_dap_india_readiness_profile"],["india_audit_trail_signal"],[...DOCS.sop,...DOCS.dpa]),
  q(75,"india_privacy_cyber","data_protection_procedure","Is there a documented privacy, security, or data protection procedure for handling personal data?","hybrid",["extended_dap_india_readiness_profile"],["india_data_protection_procedure_signal"],[...DOCS.sop,...DOCS.dpa,...DOCS.dpia]),
  q(76,"india_privacy_cyber","large_scale_indian_data","Could the company process Indian personal data at a scale that may require heightened governance review?","manual_private",["extended_dap_india_readiness_profile"],["india_large_scale_data_gap"],[...DOCS.dpia,...DOCS.dpa],{market:"Scale is rarely provable from public pages. Confirm user counts, volume, sensitivity, and business criticality before deciding whether enhanced governance is needed."}),
  q(77,"india_privacy_cyber","sensitive_high_risk_india_context","Does Indian personal data involve sensitive, vulnerable, high-risk, financial, health, employment, biometric, child, or decision-impacting contexts?","hybrid",["extended_dap_india_readiness_profile","data_provenance_profile"],["india_sensitive_high_risk_context_signal","sensitive_special_category_signals"],[...DOCS.dpia,...DOCS.pp,...DOCS.dpa]),
  q(78,"india_privacy_cyber","india_dpo_responsible_officer_route","Is there a DPO, privacy officer, grievance officer, or responsible person for India privacy escalation?","manual_private",["extended_dap_india_readiness_profile"],["india_dpo_route_signal"],[...DOCS.pp,...DOCS.dpa,...DOCS.sop],{market:"Even where a formal title is not confirmed, the operating pack should identify a responsible person or escalation route for privacy requests."}),
  q(79,"india_privacy_cyber","independent_audit_dpia_process","Is there an independent audit, DPIA, risk assessment, or similar governance process for high-risk India data processing?","manual_private",["extended_dap_india_readiness_profile"],["india_dpia_audit_signal","india_sdf_missing_proof"],[...DOCS.dpia,...DOCS.sop],{market:"High-risk or large-scale processing often needs a documented assessment workflow, ownership, evidence trail, and periodic review cadence."})
]);

export function buildQualifiedReviewQuestionHandoff({ run = {}, artifacts = {} } = {}) {
  const evidence = buildEvidenceIndex(artifacts);
  const questions = Q.map((question) => buildQuestion(question, evidence));
  return {
    handoff_type: "qualified_review_question_handoff",
    handoff_version: "qualified_review_question_handoff_v1",
    public_label: "Qualified Review",
    run_id: run.run_id || "UNKNOWN_RUN",
    question_count: questions.length,
    section_count: SECTION_META.length,
    ui_mode: "SECTION_BY_SECTION_WIZARD",
    progress_rail: SECTION_META.map(([id, title, description], index) => ({ section_index: index + 1, section_id: id, section_title: title, description, question_count: questions.filter((q) => q.section_id === id).length, completion_rule: "All required questions must be confirmed, edited and confirmed, marked not applicable, or resolved as manual-required before draft preparation." })),
    questions,
    section_pages: SECTION_META.map(([id, title, description], index) => ({ section_index: index + 1, section_id: id, section_title: title, description, questions: questions.filter((q) => q.section_id === id) })),
    final_review_gate: {
      public_label: "Final Review & Draft Preparation Gate",
      proceed_button_label: "Proceed to Draft Preparation",
      forbidden_button_labels: ["Generate legal documents", "Download JSON"],
      requires_zero_assembly_blockers: true,
      requires_confirmation_before_assembly: true,
      review_ready_disclaimer: "Answers support Review-Ready Draft preparation only. Local counsel review remains required before client-facing legal use."
    },
    status_counts: countBy(questions, (q) => q.prefill_status),
    assembly_blocker_count: questions.filter((q) => q.assembly_blocker).length
  };
}

function q(n, section, field, question, type, artifacts, fields, docs, options = {}) { return { n, id: `QR-${String(n).padStart(3,"0")}`, section, field, question, type, artifacts, fields, docs, options }; }
function buildQuestion(q, evidence) {
  const hits = lookupEvidence(q, evidence);
  const prefill = prefillStatus(q, hits);
  return {
    question_id: q.id,
    question_number: q.n,
    section_id: q.section,
    section_title: sectionTitle(q.section),
    field_key: q.field,
    public_question_label: q.question,
    field_type: q.type,
    prefill_status: prefill,
    suggested_answer: hits[0]?.summary || "",
    evidence_sources: hits,
    confidence_limitation: limitationFor(prefill, q.type),
    editable: true,
    required_for_assembly: true,
    assembly_blocker: prefill === "Manual answer required" || prefill === "Needs confirmation",
    document_impact: q.docs,
    helper_text: helperFor(q),
    market_norm_helper: q.options.market || marketNormFor(q),
    final_confirmed_answer: "",
    reviewer_note: "",
    review_status: "not_started",
    vault_push_policy: {
      push_to_qualified_review_on_click: true,
      public_prefill_is_not_final: true,
      preserve_original_evidence: true,
      confirmed_answer_overrides_prefill_for_draft_preparation: true
    }
  };
}

function buildEvidenceIndex(artifacts) {
  const rows = [];
  for (const [artifactName, artifact] of Object.entries(artifacts || {})) flatten(rows, artifactName, artifactName, unwrap(artifact, artifactName));
  return rows;
}
function lookupEvidence(q, rows) {
  const fields = new Set((q.fields || []).map((x) => String(x).toLowerCase()));
  const names = new Set((q.artifacts || []).map((x) => String(x)));
  const hits = rows.filter((row) => names.has(row.artifact_name) && ([...fields].some((f) => row.path.toLowerCase().includes(f) || row.text.toLowerCase().includes(f)) || row.path.toLowerCase().includes(q.field.toLowerCase()))).slice(0, 4);
  return hits.map((row) => ({ source_artifact: row.artifact_name, source_path: row.path, summary: row.excerpt, evidence_ref: row.path }));
}
function prefillStatus(q, hits) { if (q.type === "manual_private") return hits.length ? "Needs confirmation" : "Manual answer required"; if (!hits.length) return "Manual answer required"; const joined = JSON.stringify(hits).toLowerCase(); if (joined.includes("unclear") || joined.includes("limited") || joined.includes("not visible") || joined.includes("missing")) return "Needs confirmation"; return "Prefilled from public source"; }
function limitationFor(status, type) { if (status === "Prefilled from public source") return "Public-source signal found. Reviewer must still confirm before draft preparation."; if (status === "Needs confirmation") return "Public-source signal is incomplete, weak, or requires private confirmation."; if (type === "manual_private") return "This is a private commercial or operational fact and should not be inferred from public sources."; return "No reliable public-source answer found."; }
function helperFor(q) { return `Used in Qualified Review to confirm ${q.field.replace(/_/g," ")} before Review-Ready Draft preparation. This answer affects: ${q.docs.join(", ")}.`; }
function marketNormFor(q) { return q.type === "manual_private" ? "No public-source default should be assumed. Ask the reviewer or client to confirm the operating position before draft preparation." : ""; }
function sectionTitle(id) { return (SECTION_META.find((row) => row[0] === id) || [id, id])[1]; }
function unwrap(v, key) { return v?.[key] && typeof v[key] === "object" ? v[key] : v || {}; }
function flatten(rows, artifactName, path, value) { if (value == null) return; if (["string", "number", "boolean"].includes(typeof value)) { const text = String(value); rows.push({ artifact_name: artifactName, path, text, excerpt: excerpt(text) }); return; } if (Array.isArray(value)) return value.slice(0, 250).forEach((item, i) => flatten(rows, artifactName, `${path}[${i}]`, item)); if (typeof value === "object") return Object.entries(value).slice(0, 250).forEach(([k, child]) => flatten(rows, artifactName, `${path}.${k}`, child)); }
function excerpt(value) { const s = String(value || "").replace(/\s+/g," ").trim(); return s.length > 260 ? `${s.slice(0,257)}...` : s; }
function countBy(items, fn) { return items.reduce((acc, item) => { const key = fn(item); acc[key] = (acc[key] || 0) + 1; return acc; }, {}); }

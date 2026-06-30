import { asArray, safeObject, safeText } from "./report-safe-language.js";

export const QUALIFIED_REVIEW_QUESTION_MAP_VERSION = "qualified_review_question_map_v2_locked_vault_plus_india";

export const VAULT_PAYLOAD_GROUPS = Object.freeze(["baseline", "architecture", "archetypes", "compliance", "india_privacy_cyber"]);

export const QUALIFIED_REVIEW_SECTIONS = Object.freeze([
  { section_id: "entity_commercial", title: "Entity, Notices & Commercial Posture", count: 17 },
  { section_id: "technology_infrastructure", title: "Technology Stack, AI Memory & Infrastructure", count: 6 },
  { section_id: "ai_capability", title: "AI Capability & Product Behavior", count: 15 },
  { section_id: "privacy_sensitive_use", title: "Privacy, Sensitive Use & Market Exposure Baseline", count: 9 },
  { section_id: "india_privacy_cyber", title: "India Privacy & Cyber Readiness", count: 32 }
]);

const VAULT_PUSH_POLICY = Object.freeze({
  push_to_qualified_review_on_click: true,
  public_prefill_is_not_final: true,
  preserve_original_evidence: true,
  confirmed_answer_overrides_prefill_for_draft_preparation: true
});

const DEMO_DISCLAIMER_TEXT = "Demo market suggestion — not found in public-source diligence. Confirm or replace before draft preparation.";

const QUESTIONS = Object.freeze([
  q(1,"entity_commercial","company_legal_name","baseline.company","Company legal name","short_answer","Prefill / confirm",["target_profile.target_identity.legal_name","target_profile.target_identity.brand_name"],["TOS party identity","notice block","review-ready draft variables"],"Confirm the legal entity name that should appear in the draft stack.","Typical market practice is to use the registered contracting entity, not only the product brand."),
  q(2,"entity_commercial","entity_type","baseline.entity_type","Entity type","short_answer","Need to fill",["target_profile.target_identity.entity_type","target_profile.jurisdiction_notice.entity_form"],["TOS party identity"],"Confirm the legal form of the contracting entity.","Examples: corporation, LLC, LLP, private limited company, sole proprietorship."),
  q(3,"entity_commercial","registered_business_address","baseline.address","Registered / business address","long_answer","Need to fill",["target_profile.target_identity.registered_address","legal_cartography_index.legal_notice.address"],["notice block","privacy notice contact block"],"Confirm the official notice or business address for the draft stack.","Use the address used for legal notices or contracting records, not a generic support address."),
  q(4,"entity_commercial","legal_notice_email","baseline.legal_email","Legal notice email","short_answer","Need to fill",["legal_cartography_index.control_language_locator.legal_notice_email","target_profile.contact.legal_email"],["notice clause"],"Confirm the email address for legal notices.","Market norm is a monitored legal, contracts, or notices inbox."),
  q(5,"entity_commercial","privacy_contact_email","baseline.privacy_email","Privacy contact email","short_answer","Need to fill",["legal_cartography_index.document_coverage_index.privacy_notice.contact","data_provenance_profile.notice_rights.privacy_contact"],["privacy notice","DPA notices"],"Confirm the privacy contact that should receive privacy-rights and data-processing requests.","Market norm is privacy@, dpo@, legal@, or a dedicated webform."),
  q(6,"entity_commercial","products_services","baseline.products","Products / services covered","select","Prefill / confirm",["target_profile.product_service_wrapper.products","target_feature_profile.activities","source_discovery_handoff.product_sources"],["TOS §1.14","Schedule A"],"Confirm the product or service family covered by the draft stack.","Include only products in scope for this review; exclude unrelated lines."),
  q(7,"entity_commercial","jurisdiction_country","baseline.jurisdiction.country","Governing country / local law baseline","short_answer","Prefill / confirm",["target_profile.jurisdiction_notice.country","legal_cartography_index.control_language_locator.governing_law"],["TOS §7.5"],"Confirm the country used for headquarters, local law, or primary contracting context.","Use the legal operating country where the contract posture is anchored."),
  q(8,"entity_commercial","jurisdiction_state_forum","baseline.jurisdiction.state","State / forum / court reference","short_answer","Need to fill",["legal_cartography_index.control_language_locator.forum","legal_cartography_index.control_language_locator.governing_law"],["TOS §14"],"Confirm the state, courts, arbitration seat, or forum reference for disputes.","Market norm is to align governing law and forum where possible."),
  q(9,"entity_commercial","market_exposure","baseline.market","Market exposure","dropdown","Prefill / confirm",["target_profile.business_context.market_scope","integrated_dap_report.territorial_scope"],["EXT.08/09 consumer protections"],"Confirm whether the product is B2B, B2C, or hybrid.","Public positioning can suggest this, but final classification should match actual customers.", ["b2b","b2c","hybrid"]),
  q(10,"entity_commercial","delivery_app","baseline.delivery.app","App / web delivery","dropdown","Prefill / confirm",["target_feature_profile.delivery_channels.web_app","target_feature_profile.activities.delivery_mode"],["GUI delivery"],"Confirm whether users access the product through an app or web interface.","Answer yes when the product has a customer-facing GUI or dashboard.", ["yes","no"]),
  q(11,"entity_commercial","delivery_api","baseline.delivery.api","API / programmatic delivery","dropdown","Prefill / confirm",["target_feature_profile.delivery_channels.api","target_feature_profile.integrations.api_docs"],["TOS §2.5","AGT §8.5"],"Confirm whether the product exposes API, SDK, webhook, or programmatic access.","API delivery changes acceptable-use and integration terms.", ["yes","no"]),
  q(12,"entity_commercial","revenue_model","baseline.revenue_model","Revenue model","short_answer","Need to fill",["target_profile.business_context.revenue_model","source_discovery_handoff.pricing_sources"],["commercial assumptions"],"Confirm the revenue model used for the customer relationship.","Examples: subscription, usage-based, enterprise contract, free beta, marketplace, professional services."),
  q(13,"entity_commercial","acv_liability_reference","baseline.acv","ACV / liability reference point","short_answer","Need to fill",["legal_cartography_index.control_language_locator.liability_cap","legal_cartography_index.control_language_locator.fees_paid_cap"],["TOS §9.1"],"Confirm the monetary reference used for liability caps.","Typical SaaS liability reference is fees paid in the prior 12 months or a fixed monetary floor."),
  q(14,"entity_commercial","beta_free_tier_posture","baseline.has_beta","Beta / free-tier posture","dropdown","Prefill / confirm",["legal_cartography_index.control_language_locator.beta_preview_terms","source_discovery_handoff.pricing_sources"],["TOS §2.6","Schedule B"],"Confirm whether beta, trial, free, preview, or experimental terms apply.","Beta/free posture usually needs stronger warranty and availability limits.", ["yes","no"]),
  q(15,"entity_commercial","output_ownership_posture","baseline.output_ownership","Output ownership posture","dropdown","Need to fill",["legal_cartography_index.control_language_locator.output_ownership","legal_cartography_index.control_language_locator.ip_terms"],["TOS §6.2"],"Confirm the ownership or license posture for AI or product outputs.","Use the commercial position actually intended for customers.", ["full","limited","none"]),
  q(16,"entity_commercial","sla_posture","baseline.sla_type","SLA posture","dropdown","Need to fill",["legal_cartography_index.document_coverage_index.sla","legal_cartography_index.control_language_locator.service_levels"],["DOC_SLA routing"],"Confirm whether no SLA, standard SLA, or custom SLA should apply.","No SLA omits the SLA document; standard injects the SLA; custom leaves bespoke blanks.", ["no","standard","custom"]),
  q(17,"entity_commercial","reliance_threshold","baseline.reliance_threshold","Reliance threshold","short_answer","Need to fill",["legal_cartography_index.control_language_locator.no_reliance","exposure_registry_triggered_profile.reliance_related_rows"],["TOS §5.4"],"Confirm any financial or decision-reliance threshold to use in disclaimers.","Typical market thresholds are fixed dollar values or plan-based limits."),

  q(18,"technology_infrastructure","ai_memory_architecture","architecture.memory","AI memory architecture","dropdown","Need to fill",["target_feature_profile.ai_memory_profile","data_provenance_profile.ai_processing_chain.memory","integrated_dap_report.ai_processing_chain"],["DPA §4","TOS §6.1(c)"],"Confirm whether the system is RAG/retrieval, stateless, or fine-tuning based.","Public footprint rarely proves internal memory design; confirm actual architecture.", ["rag","stateless","finetuning"]),
  q(19,"technology_infrastructure","model_infrastructure","architecture.models","Model infrastructure","dropdown","Need to fill",["target_feature_profile.model_provider_profile","data_provenance_profile.vendor_model_processing","integrated_dap_report.ai_processing_chain.model_infrastructure"],["TOS §1.2","TOS §8.5","TOS §8.7"],"Confirm whether models are self-hosted or provided by third parties.","Third-party model use affects subprocessor and model-provider clauses.", ["selfhosted","thirdparty"]),
  q(20,"technology_infrastructure","named_ai_subprocessors","architecture.sub_processors","Named AI subprocessors","select","Prefill / confirm",["legal_cartography_index.document_coverage_index.subprocessors","data_provenance_profile.vendor_subprocessor_map","integrated_dap_report.contracts_vendors_subprocessors"],["DPA §5.2"],"Confirm the AI subprocessors or model providers used.","Public providers may be visible, but internal provider mix must be confirmed.", ["openai","anthropic","google","cohere","mistral","other","none"]),
  q(21,"technology_infrastructure","subprocessor_list_url","architecture.sub_processors.url","Subprocessor list URL","short_answer","Prefill / confirm",["legal_cartography_index.document_coverage_index.subprocessor_url","source_discovery_handoff.legal_sources.subprocessor_page"],["DPA §5.2"],"Confirm the live URL for the subprocessor list.","Use a stable legal or trust-center URL where customers can review subprocessors."),
  q(22,"technology_infrastructure","cloud_host","architecture.cloud_host","Cloud host","short_answer","Need to fill",["data_provenance_profile.infrastructure.cloud_host","data_provenance_profile.vendor_subprocessor_map.hosting_provider"],["DPA Schedule C"],"Confirm the cloud hosting provider or infrastructure host.","Common examples: AWS, GCP, Azure, Vercel, Cloudflare; confirm actual infrastructure host."),
  q(23,"technology_infrastructure","vector_database_retrieval_layer","architecture.vector_db","Vector database / retrieval layer","short_answer","Need to fill",["target_feature_profile.rag_retrieval_profile","data_provenance_profile.ai_processing_chain.vector_store","data_provenance_profile.flow_profile.embeddings"],["DPA Schedule C"],"Confirm the vector database or retrieval layer, if any.","Common examples: Pinecone, Weaviate, Qdrant, pgvector, custom retrieval layer."),

  q(24,"ai_capability","capability_doer","archetypes.is_doer","Doer capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.DOER","exposure_registry_triggered_profile.DOER"],["TOS §2.7","DOC_AGT"],"Confirm whether the product can perform tasks or actions for users.","Doer capability routes the agentic terms addendum.", ["yes","no"]),
  q(25,"ai_capability","capability_orchestrator","archetypes.is_orchestrator","Orchestrator capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.ORCHESTRATOR","exposure_registry_triggered_profile.ORCHESTRATOR"],["AGT §3.5"],"Confirm whether the product coordinates tools, workflows, agents, or services.","Orchestration creates additional control-boundary language.", ["yes","no"]),
  q(26,"ai_capability","agent_session_cap","archetypes.agent_limits.session_cap","Agent session cap","short_answer","Need to fill",["target_feature_profile.agentic_controls.session_cap","challenge_gate.agentic_limits.session_cap"],["AGT §4.1"],"Confirm the maximum actions or operations allowed in one agent session.","Common agentic controls use per-session action caps; confirm actual cap or mark not applicable."),
  q(27,"ai_capability","agent_period_cap","archetypes.agent_limits.period_cap","Agent period cap","short_answer","Need to fill",["target_feature_profile.agentic_controls.period_cap","challenge_gate.agentic_limits.period_cap"],["AGT §4.2"],"Confirm the maximum actions or operations allowed per period.","Common controls cap daily, monthly, or billing-period actions."),
  q(28,"ai_capability","agent_retry_limit","archetypes.agent_limits.retry_limit","Retry limit","short_answer","Need to fill",["target_feature_profile.agentic_controls.retry_limit","challenge_gate.agentic_limits.retry_limit"],["AGT §6.2"],"Confirm the retry limit for failed or uncertain agent actions.","Retry limits reduce loop and runaway execution risk."),
  q(29,"ai_capability","agent_loop_threshold","archetypes.agent_limits.loop_threshold","Loop threshold","short_answer","Need to fill",["target_feature_profile.agentic_controls.loop_threshold","challenge_gate.agentic_limits.loop_threshold"],["AGT §6.3","Schedule C"],"Confirm the loop threshold or escalation rule for repetitive agent behavior.","Loop thresholds should trigger stop, review, or escalation."),
  q(30,"ai_capability","capability_creator","archetypes.is_creator","Creator capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.CREATOR","target_feature_profile.output_profile","exposure_registry_triggered_profile.CREATOR"],["TOS §4.1","TOS §6.2"],"Confirm whether the product generates, transforms, or creates content.","Creator capability affects output ownership and content responsibility language.", ["yes","no"]),
  q(31,"ai_capability","capability_reader_ingestion","archetypes.is_reader","Reader / ingestion capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.READER","data_provenance_profile.collection_ingestion_profile","exposure_registry_triggered_profile.READER"],["TOS §4.1(e)"],"Confirm whether the product reads, ingests, scrapes, or extracts from external/user sources.","Reader capability affects unauthorized scraping and source-use disclaimers.", ["yes","no"]),
  q(32,"ai_capability","capability_companion","archetypes.conversational_ui","Companion / conversational UI capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.COMPANION","target_feature_profile.user_interaction_profile","exposure_registry_triggered_profile.COMPANION"],["TOS §3.4","AUP §3.5"],"Confirm whether the product provides conversational or companion-like interaction.","Companion routes conversational UI and vulnerable/minor-user controls.", ["yes","no"]),
  q(33,"ai_capability","capability_biometric_translator","archetypes.sens_bio","Biometric / translator capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.BIOMETRIC_TRANSLATOR","data_provenance_profile.sensitive_data_profile.biometric"],["AUP §3.6"],"Confirm whether biometric, voice, image, translation, or identity-adjacent capability is in scope.","Biometric signals route pass-through prohibitions and sensitive-use warnings.", ["yes","no"]),
  q(34,"ai_capability","capability_judge","archetypes.is_judge","Judge capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.JUDGE","target_feature_profile.decision_support_profile","exposure_registry_triggered_profile.JUDGE"],["TOS §5.6","AUP §3.4","AUP §3.3"],"Confirm whether the product ranks, scores, decides, recommends, or evaluates people or outcomes.","Judge fan-out also sets HR/legal judge flags where applicable.", ["yes","no"]),
  q(35,"ai_capability","capability_optimizer","archetypes.is_optimizer","Optimizer capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.OPTIMIZER","target_feature_profile.optimization_profile"],["AUP §3.2"],"Confirm whether the product optimizes financial, operational, or performance outcomes.","Optimizer fan-out can also set financial-sensitive routing.", ["yes","no"]),
  q(36,"ai_capability","capability_shield","archetypes.is_shield","Shield capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.SHIELD","target_feature_profile.safety_security_profile"],["AGT §7.1"],"Confirm whether the product detects, blocks, protects, monitors, or flags risk.","Shield capability affects false-negative and immutable-log language.", ["yes","no"]),
  q(37,"ai_capability","capability_mover","archetypes.is_mover","Mover capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.MOVER","target_feature_profile.action_execution_profile"],["TOS §2.4"],"Confirm whether the product moves money, files, messages, data, workflows, or other assets.","Mover capability routes strict product-liability waiver language.", ["yes","no"]),
  q(38,"ai_capability","capability_generalist","archetypes.is_generalist","Generalist capability","dropdown","Prefill / confirm",["target_feature_profile.archetype_profile.GENERALIST","target_feature_profile.activities"],["baseline hallucination waivers"],"Confirm whether the product is a general-purpose AI or broad assistant.","Generalist capability routes baseline hallucination and no-reliance waivers.", ["yes","no"]),

  q(39,"privacy_sensitive_use","personal_data_processing","compliance.processes_pii","Personal data processing","dropdown","Prefill / confirm",["data_provenance_profile.personal_data_processing_signal","data_provenance_profile.data_categories","integrated_dap_report.data_categories_sensitivity_profile"],["DOC_DPA","DOC_PP"],"Confirm whether the product processes personal data.","If yes, DPA and privacy-policy routing should remain active.", ["yes","no"]),
  q(40,"privacy_sensitive_use","eu_uk_exposure","compliance.eu_users","EU / UK exposure","dropdown","Prefill / confirm",["target_profile.business_context.market_scope.eu_uk","data_provenance_profile.territorial_scope.eu_uk","integrated_dap_report.territorial_scope"],["DPA §6.2-6.4","SCCs"],"Confirm whether EU or UK users, customers, or data subjects are in scope.","EU/UK exposure routes SCC and GDPR/UK GDPR mechanics.", ["yes","no"]),
  q(41,"privacy_sensitive_use","california_exposure","compliance.ca_users","California exposure","dropdown","Prefill / confirm",["target_profile.business_context.market_scope.california","data_provenance_profile.territorial_scope.california","integrated_dap_report.territorial_scope"],["DPA §13.x CCPA"],"Confirm whether California users, customers, or consumers are in scope.","California exposure routes service-provider / CCPA terms.", ["yes","no"]),
  q(42,"privacy_sensitive_use","other_regional_exposure","compliance.other_regions","Other regional exposure","short_answer","Need to fill",["target_profile.business_context.market_scope.other_regions","data_provenance_profile.territorial_scope","integrated_dap_report.territorial_scope"],["regional review flag"],"Confirm other regions that should be considered for the draft stack.","Examples: Canada, Australia, Singapore, UAE, Brazil, India, or global."),
  q(43,"privacy_sensitive_use","health_medical_biometric_context","compliance.sens_health","Health / medical / biometric context","select","Prefill / confirm",["data_provenance_profile.sensitive_data_profile.health","data_provenance_profile.sensitive_data_profile.biometric","target_feature_profile.regulated_context_profile"],["AUP §3.1","AUP §3.6"],"Confirm whether health, medical, wellness, biometric, or identity-sensitive context is in scope.","Sensitive-use flags route stricter AUP and disclaimer language.", ["health","medical","wellness","biometric","none"]),
  q(44,"privacy_sensitive_use","financial_data_financial_use","compliance.sens_fin","Financial data / financial use","dropdown","Prefill / confirm",["data_provenance_profile.sensitive_data_profile.financial","target_feature_profile.regulated_context_profile.financial","exposure_registry_triggered_profile.financial_risk_rows"],["AUP §3.2"],"Confirm whether financial data or financial decision context is in scope.","Financial-sensitive use routes AUP financial-surface language.", ["yes","no"]),
  q(45,"privacy_sensitive_use","employment_hr_context","compliance.sens_employment","Employment / HR context","dropdown","Prefill / confirm",["data_provenance_profile.sensitive_data_profile.employee","target_feature_profile.regulated_context_profile.employment"],["AUP §3.4"],"Confirm whether employment, hiring, workforce, or HR use is in scope.","Employment-sensitive use routes bias-audit and HR caution language.", ["yes","no"]),
  q(46,"privacy_sensitive_use","children_minors","compliance.minors","Children / minors","dropdown","Prefill / confirm",["data_provenance_profile.sensitive_data_profile.children","extended_dap_india_readiness_profile.india_children_under_18_signal","integrated_dap_report.children_tracking_profile"],["AUP §3.5"],"Confirm whether children or minors may use or be affected by the product.","Minor-user exposure changes AUP and child-safety routing.", ["yes","no"]),
  q(47,"privacy_sensitive_use","distress_vulnerable_users","compliance.distress","Distress / vulnerable users","dropdown","Need to fill",["data_provenance_profile.sensitive_data_profile.vulnerable_users","target_feature_profile.user_context_profile.distress"],["TOS §5.5"],"Confirm whether the product is used by distressed, vulnerable, dependent, or high-risk users.","This field is usually operational and must be confirmed by the reviewer.", ["yes","no"]),

  q(48,"india_privacy_cyber","indian_users","india_privacy_cyber.indian_users","Indian users","dropdown","Prefill / confirm",["extended_dap_india_readiness_profile.india_market_scope_signal","integrated_dap_report.report_boundary_source_coverage.india_scope"],["DPDP applicability screen"],"Confirm whether Indian users, customers, employees, or data principals are in scope.","Public market signals can suggest India exposure, but customer reality controls.", ["yes","no"]),
  q(49,"india_privacy_cyber","indian_operations","india_privacy_cyber.indian_operations","Indian operations","dropdown","Prefill / confirm",["extended_dap_india_readiness_profile.india_operations_signal","integrated_dap_report.territorial_scope.india_operations"],["DPDP / CERT-In operational scope"],"Confirm whether operations, support, hosting, staff, vendors, or service delivery touch India.","Indian operations may affect cyber and privacy readiness.", ["yes","no"]),
  q(50,"india_privacy_cyber","india_exclusion","india_privacy_cyber.india_exclusion","India exclusion","dropdown","Prefill / confirm",["extended_dap_india_readiness_profile.india_exclusion_or_no_exclusion_signal","legal_cartography_index.control_language_locator.territorial_exclusion"],["India carveout / limitation note"],"Confirm whether India is expressly excluded, limited, or not addressed.","India exclusions should be explicit if relied on.", ["excluded","not_excluded","unclear"]),
  q(51,"india_privacy_cyber","indian_personal_data","india_privacy_cyber.indian_personal_data","Indian personal data","dropdown","Prefill / confirm",["extended_dap_india_readiness_profile.india_personal_data_processing_signal","extended_dap_india_readiness_profile.india_data_principal_population_signal"],["DPDP personal data scope"],"Confirm whether Indian personal data is processed.","DPDP readiness depends on data-principal and processing scope.", ["yes","no"]),
  q(52,"india_privacy_cyber","dpdp_role_mapping","india_privacy_cyber.dpdp_role_mapping","DPDP role mapping","short_answer","Need to fill",["extended_dap_india_readiness_profile.india_role_mapping_candidate","integrated_dap_report.data_relationship_role_map.india_role"],["Data Fiduciary / Processor role"],"Confirm the India DPDP role mapping for the reviewed activity.","Examples: Data Fiduciary, Data Processor, mixed role, or unclear pending counsel review."),
  q(53,"india_privacy_cyber","dpdp_notice_availability","india_privacy_cyber.dpdp_notice_availability","DPDP notice availability","dropdown","Prefill / confirm",["extended_dap_india_readiness_profile.india_dpdp_notice_surface_signal","integrated_dap_report.notice_consent_rights_accountability"],["notice readiness"],"Confirm whether India/DPDP-ready notice language is available.","Public privacy notices may not be DPDP-specific even when privacy notices exist.", ["yes","no","unclear"]),
  q(54,"india_privacy_cyber","purpose_linked_consent_authorization","india_privacy_cyber.purpose_linked_consent_authorization","Purpose-linked consent / authorization","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_consent_authorization_signal","extended_dap_india_readiness_profile.india_purpose_specificity_signal"],["consent / lawful basis note"],"Confirm how purpose-linked authorization, consent, or customer instruction is handled for India data.","Describe the actual consent or authorization workflow rather than relying on generic privacy wording."),
  q(55,"india_privacy_cyber","withdrawal_route","india_privacy_cyber.withdrawal_route","Withdrawal route","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_withdrawal_revocation_signal","integrated_dap_report.notice_consent_rights_accountability.withdrawal"],["Data Principal rights workflow"],"Confirm how withdrawal, revocation, or opt-out requests are received and executed.","A market-standard route includes intake, identity check, routing owner, and completion timeline."),
  q(56,"india_privacy_cyber","grievance_contact","india_privacy_cyber.grievance_contact","Grievance contact","short_answer","Need to fill",["extended_dap_india_readiness_profile.india_grievance_contact_signal","integrated_dap_report.notice_consent_rights_accountability.grievance"],["grievance officer/contact"],"Confirm the India grievance contact, officer route, or escalation mailbox.","Use a monitored mailbox or designated responsible person where available."),
  q(57,"india_privacy_cyber","consent_manager_support","india_privacy_cyber.consent_manager_support","Consent Manager support","dropdown","Need to fill",["extended_dap_india_readiness_profile.india_consent_manager_public_signal"],["Consent Manager support note"],"Confirm whether Consent Manager support is relevant or planned.","Usually this is not publicly established and should be confirmed manually.", ["yes","no","not_applicable"]),
  q(58,"india_privacy_cyber","children_under_18","india_privacy_cyber.children_under_18","Children under 18","dropdown","Prefill / confirm",["extended_dap_india_readiness_profile.india_children_under_18_signal","integrated_dap_report.children_tracking_profile"],["children data screen"],"Confirm whether children under 18 may use or be affected by the product in India.","India treats children as under 18 for DPDP purposes.", ["yes","no"]),
  q(59,"india_privacy_cyber","verifiable_parental_consent","india_privacy_cyber.verifiable_parental_consent","Verifiable parental consent","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_child_consent_route_signal"],["child consent workflow"],"Confirm the verifiable parental consent route if children are in scope.","Describe how parental consent is obtained, verified, stored, and withdrawn."),
  q(60,"india_privacy_cyber","child_tracking_profiling","india_privacy_cyber.child_tracking_profiling","Child tracking / profiling","dropdown","Prefill / confirm",["extended_dap_india_readiness_profile.india_child_tracking_or_ads_signal","integrated_dap_report.cookies_tracking_marketing_profiling"],["child profiling restriction"],"Confirm whether child tracking, behavioral monitoring, profiling, or targeted personalization occurs.","This should be treated conservatively if children are in scope.", ["yes","no"]),
  q(61,"india_privacy_cyber","targeted_ads_to_children","india_privacy_cyber.targeted_ads_to_children","Targeted ads to children","dropdown","Need to fill",["extended_dap_india_readiness_profile.india_child_tracking_or_ads_signal","integrated_dap_report.cookies_tracking_marketing_profiling.child_ads"],["child targeted-ad restriction"],"Confirm whether targeted advertising to children occurs or is technically prevented.","Usually private confirmation is required even if public policy is silent.", ["yes","no","not_applicable"]),
  q(62,"india_privacy_cyber","transfer_outside_india","india_privacy_cyber.transfer_outside_india","Transfer outside India","dropdown","Prefill / confirm",["extended_dap_india_readiness_profile.india_cross_border_transfer_signal","integrated_dap_report.location_cross_border_transfer_retention"],["transfer assumption"],"Confirm whether Indian personal data may be transferred outside India.","Hosting, support, and subprocessors can create transfer pathways.", ["yes","no","unclear"]),
  q(63,"india_privacy_cyber","restricted_territory_screening","india_privacy_cyber.restricted_territory_screening","Restricted-territory screening","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_restricted_territory_screening_gap"],["India transfer limitation"],"Confirm whether restricted-territory screening or transfer controls are used.","Describe the control if present; otherwise mark not established or not applicable."),
  q(64,"india_privacy_cyber","india_vendor_transfer_map","india_privacy_cyber.india_vendor_transfer_map","India vendor transfer map","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_vendor_transfer_map_signal","integrated_dap_report.contracts_vendors_subprocessors"],["vendor/subprocessor transfer review"],"Confirm the vendor and subprocessor pathway for India data transfers.","Summarize hosting, AI processors, analytics, support access, and cross-border vendors."),
  q(65,"india_privacy_cyber","cert_in_applicable","india_privacy_cyber.cert_in_applicable","CERT-In applicable","dropdown","Need to fill",["extended_dap_india_readiness_profile.india_cert_in_reporting_signal","integrated_dap_report.security_access_incident_cert_in_readiness"],["CERT-In applicability"],"Confirm whether CERT-In incident reporting expectations are relevant.","Applicability usually requires counsel or security owner confirmation.", ["yes","no","unclear"]),
  q(66,"india_privacy_cyber","cert_in_point_of_contact","india_privacy_cyber.cert_in_point_of_contact","CERT-In point of contact","short_answer","Need to fill",["extended_dap_india_readiness_profile.india_cert_in_poc_public_signal","extended_dap_india_readiness_profile.india_cert_in_missing_proof"],["CERT-In escalation contact"],"Confirm the person, function, or mailbox responsible for CERT-In escalation.","A monitored security/legal escalation route is preferred."),
  q(67,"india_privacy_cyber","six_hour_reporting_workflow","india_privacy_cyber.six_hour_reporting_workflow","Six-hour reporting workflow","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_six_hour_reporting_workflow_signal","integrated_dap_report.security_access_incident_cert_in_readiness"],["CERT-In six-hour workflow"],"Confirm whether incident triage can identify CERT-In reportable events and escalate within six hours.","Describe detection, triage, legal/security decisioning, and report submission owner."),
  q(68,"india_privacy_cyber","one_eighty_day_log_retention","india_privacy_cyber.one_eighty_day_log_retention","180-day log retention","dropdown","Need to fill",["extended_dap_india_readiness_profile.india_180_day_log_signal","extended_dap_india_readiness_profile.india_log_retention_signal"],["CERT-In log retention"],"Confirm whether required logs are retained for at least 180 days where applicable.","This is usually internal security-policy information.", ["yes","no","unclear"]),
  q(69,"india_privacy_cyber","logs_accessible_for_india","india_privacy_cyber.logs_accessible_for_india","Logs accessible for India","dropdown","Need to fill",["extended_dap_india_readiness_profile.india_logs_accessible_in_india_signal"],["CERT-In log accessibility"],"Confirm whether relevant logs can be accessed and produced for India incident response.","Confirm operational accessibility, not only retention in principle.", ["yes","no","unclear"]),
  q(70,"india_privacy_cyber","security_policy","india_privacy_cyber.security_policy","Security policy","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_security_policy_signal","integrated_dap_report.security_access_incident_cert_in_readiness.security_policy"],["security policy reference"],"Confirm the security policy or control document relevant to India readiness.","Summarize the applicable security policy, trust center, or internal control source."),
  q(71,"india_privacy_cyber","access_controls","india_privacy_cyber.access_controls","Access controls","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_access_control_signal","data_provenance_profile.security_controls.access_control"],["access control readiness"],"Confirm access controls for systems handling India personal data or security logs.","Describe role-based access, admin controls, logging, and approval mechanisms."),
  q(72,"india_privacy_cyber","vendor_security_terms","india_privacy_cyber.vendor_security_terms","Vendor security terms","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_vendor_security_terms_signal","integrated_dap_report.contracts_vendors_subprocessors.vendor_security"],["vendor security controls"],"Confirm vendor security obligations relevant to India data and incident readiness.","Summarize contractual security, breach notice, audit, and subprocessor obligations."),
  q(73,"india_privacy_cyber","incident_response","india_privacy_cyber.incident_response","Incident response","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_incident_response_signal","integrated_dap_report.security_access_incident_cert_in_readiness.incident_response"],["incident response process"],"Confirm the incident response process relevant to India privacy/cyber readiness.","Include owner, timeline, triage criteria, notification workflow, and evidence retention."),
  q(74,"india_privacy_cyber","audit_trail","india_privacy_cyber.audit_trail","Audit trail","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_audit_trail_signal","data_provenance_profile.security_controls.audit_logging"],["audit/log trail readiness"],"Confirm audit trail and logging controls for relevant systems.","Describe what is logged, retention period, access, and review cadence."),
  q(75,"india_privacy_cyber","data_protection_procedure","india_privacy_cyber.data_protection_procedure","Data protection procedure","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_data_protection_procedure_signal","integrated_dap_report.governance_readiness_matrix"],["DPDP governance procedure"],"Confirm the internal data protection procedure relevant to DPDP readiness.","Summarize governance owner, rights handling, deletion, notices, and accountability controls."),
  q(76,"india_privacy_cyber","large_scale_indian_data","india_privacy_cyber.large_scale_indian_data","Large-scale Indian data","dropdown","Need to fill",["extended_dap_india_readiness_profile.india_large_scale_data_gap","extended_dap_india_readiness_profile.india_sdf_screen_signal"],["Significant Data Fiduciary screen"],"Confirm whether large-scale Indian personal data processing may be in scope.","This is a screening question, not a legal conclusion.", ["yes","no","unclear"]),
  q(77,"india_privacy_cyber","sensitive_high_risk_india_context","india_privacy_cyber.sensitive_high_risk_india_context","Sensitive or high-risk India context","select","Prefill / confirm",["extended_dap_india_readiness_profile.india_sensitive_high_risk_context_signal","integrated_dap_report.governance_readiness_matrix.high_risk_context"],["high-risk India review"],"Confirm sensitive or high-risk India contexts that may affect readiness.","Use this to flag health, finance, employment, children, biometrics, or public-safety contexts.", ["health","financial","employment","children","biometric","public_safety","none"]),
  q(78,"india_privacy_cyber","india_dpo_responsible_officer_route","india_privacy_cyber.india_dpo_responsible_officer_route","India DPO / responsible officer route","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_dpo_route_signal","extended_dap_india_readiness_profile.india_sdf_missing_proof"],["DPO / responsible officer route"],"Confirm the DPO, responsible officer, or internal accountable owner route for India readiness.","For demo purposes, describe the accountable function if a formal DPO is not appointed."),
  q(79,"india_privacy_cyber","independent_audit_dpia_process","india_privacy_cyber.independent_audit_dpia_process","Independent audit / DPIA process","long_answer","Need to fill",["extended_dap_india_readiness_profile.india_dpia_audit_signal","integrated_dap_report.governance_readiness_matrix.dpia_audit"],["DPIA / audit readiness"],"Confirm whether independent audit, DPIA, or risk assessment process exists or is planned.","Summarize process owner, trigger, cadence, scope, and evidence source.")
]);

export const QUALIFIED_REVIEW_QUESTIONS = Object.freeze(QUESTIONS);

export function buildQualifiedReviewQuestionHandoff({ run = {}, artifacts = {} } = {}) {
  const artifactBag = safeObject(artifacts);
  const questions = QUALIFIED_REVIEW_QUESTIONS.map((question) => materializeQuestion({ question, artifacts: artifactBag }));
  const sectionPages = QUALIFIED_REVIEW_SECTIONS.map((section, index) => {
    const sectionQuestions = questions.filter((question) => question.section_id === section.section_id);
    const prefilled = sectionQuestions.filter((question) => question.prefill_status === "Prefill / confirm").length;
    return {
      step: index + 1,
      section_id: section.section_id,
      section_title: section.title,
      questions: sectionQuestions,
      question_ids: sectionQuestions.map((question) => question.question_id),
      question_count: sectionQuestions.length,
      prefilled_count: prefilled,
      need_to_fill_count: sectionQuestions.length - prefilled,
      editable: true
    };
  });
  return {
    handoff_type: "qualified_review_question_handoff",
    handoff_version: "qualified_review_question_handoff_v2_locked_vault_plus_india",
    map_version: QUALIFIED_REVIEW_QUESTION_MAP_VERSION,
    run_id: safeText(run.run_id, "UNKNOWN_RUN"),
    ui_mode: "SECTION_BY_SECTION_WIZARD",
    vault_payload_groups: [...VAULT_PAYLOAD_GROUPS],
    question_count: questions.length,
    sections: QUALIFIED_REVIEW_SECTIONS.map(({ section_id, title, count }) => ({ section_id, title, count })),
    progress_rail: sectionPages.map((page) => ({ step: page.step, section_id: page.section_id, label: page.section_title, question_count: page.question_count, status: page.need_to_fill_count === 0 ? "READY_FOR_REVIEW" : "NEEDS_CONFIRMATION" })),
    section_pages: sectionPages,
    questions,
    final_review_gate: {
      requires_zero_assembly_blockers: true,
      requires_confirmation_before_assembly: true,
      demo_market_suggestions_are_not_confirmed_facts: true,
      missing_backend_fields_do_not_block_qualified_review: true
    },
    demo_disclaimer_text: DEMO_DISCLAIMER_TEXT,
    warnings: questions.flatMap((question) => question.warnings)
  };
}

function q(questionNumber, sectionId, fieldKey, vaultPath, label, answerType, defaultStatus, mappings, docImpact, helperText, marketNormHelper, options = []) {
  return Object.freeze({
    question_id: `QR-${String(questionNumber).padStart(3, "0")}`,
    question_number: questionNumber,
    section_id: sectionId,
    section_title: sectionTitle(sectionId),
    field_key: fieldKey,
    vault_path: vaultPath,
    draft_prep_path: vaultPath,
    public_question_label: label,
    answer_type: answerType,
    allowed_options: Object.freeze(options),
    backend_field_mappings: Object.freeze(mappings),
    default_prefill_status: defaultStatus,
    editable: true,
    required_for_assembly: true,
    assembly_blocker: true,
    document_impact: Object.freeze(docImpact),
    helper_text: helperText,
    market_norm_helper: marketNormHelper,
    review_status: "Needs confirmation",
    vault_push_policy: VAULT_PUSH_POLICY
  });
}

function materializeQuestion({ question, artifacts }) {
  const evidenceSources = resolveEvidenceSources({ mappings: question.backend_field_mappings, artifacts });
  const hasBackendEvidence = evidenceSources.length > 0;
  const status = hasBackendEvidence && question.default_prefill_status === "Prefill / confirm" ? "Prefill / confirm" : "Need to fill";
  const suggestionSource = hasBackendEvidence ? "backend_artifact" : "market_norm_demo";
  return {
    ...question,
    prefill_status: status,
    suggestion_source: suggestionSource,
    suggested_answer: hasBackendEvidence ? deriveSuggestedAnswer(evidenceSources) : "",
    demo_market_suggestion: hasBackendEvidence ? "" : question.market_norm_helper,
    demo_disclaimer: !hasBackendEvidence,
    demo_disclaimer_text: hasBackendEvidence ? "" : DEMO_DISCLAIMER_TEXT,
    evidence_sources: evidenceSources,
    source_artifacts: unique(evidenceSources.map((source) => source.artifact_name)),
    source_field_hints: [...question.backend_field_mappings],
    warnings: hasBackendEvidence ? [] : [`${question.question_id}: Need to fill; demo market suggestion only`]
  };
}

function resolveEvidenceSources({ mappings, artifacts }) {
  const hits = [];
  for (const mapping of asArray(mappings)) {
    const [artifactName, ...pathParts] = String(mapping || "").split(".");
    const artifact = artifacts[artifactName];
    if (!hasMeaningfulArtifact(artifact)) continue;
    const value = pathParts.length ? getByPath(artifact, pathParts) : artifact;
    if (!hasMeaningfulArtifact(value)) continue;
    hits.push({ artifact_name: artifactName, field_path: mapping, value });
  }
  return hits;
}

function deriveSuggestedAnswer(evidenceSources) {
  const first = evidenceSources[0]?.value;
  if (first === undefined || first === null) return "";
  if (typeof first === "string" || typeof first === "number" || typeof first === "boolean") return String(first);
  if (Array.isArray(first)) return first.map((item) => safeText(item, "")).filter(Boolean).join(", ");
  return safeText(first.value || first.answer || first.label || first.name || "", "");
}

function getByPath(value, pathParts) {
  let cursor = value;
  for (const part of pathParts) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function hasMeaningfulArtifact(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(String(value).trim());
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sectionTitle(sectionId) {
  return QUALIFIED_REVIEW_SECTIONS.find((section) => section.section_id === sectionId)?.title || sectionId;
}

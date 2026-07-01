// Qualified Review canonical map derived from the locked 79Q reverse-engineering matrix.
// Field-driven prefill model: answer_prefill_mapping is separate from evidence_source_mapping.
// Do not add, remove, reorder, or rename rows without updating QUALIFIED_REVIEW_LOCKED_COUNTS.

export const QUALIFIED_REVIEW_MAP_VERSION = "qualified_review_map_v3_field_mapped_prefill_split";

export const QUALIFIED_REVIEW_DEMO_DISCLAIMER_TEXT = "";

export const QUALIFIED_REVIEW_REVIEWER_ACTION = "Confirm, review, or fill before draft preparation";

export const QUALIFIED_REVIEW_SECTION_MAP = Object.freeze([
  {
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_slug": "entity_notices_commercial_posture",
    "section_title": "Entity, Notices & Commercial Posture",
    "question_count": 17
  },
  {
    "section_id": "technology_infrastructure",
    "section_number": 2,
    "section_slug": "technology_stack_ai_memory_infrastructure",
    "section_title": "Technology Stack, AI Memory & Infrastructure",
    "question_count": 6
  },
  {
    "section_id": "ai_capability",
    "section_number": 3,
    "section_slug": "ai_capability_product_behavior",
    "section_title": "AI Capability & Product Behavior",
    "question_count": 15
  },
  {
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_slug": "privacy_sensitive_use_market_exposure",
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "question_count": 9
  },
  {
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_slug": "india_privacy_cyber_readiness",
    "section_title": "India Privacy & Cyber Readiness",
    "question_count": 32
  }
]);

export const QUALIFIED_REVIEW_LOCKED_COUNTS = Object.freeze({
  "question_count": 79,
  "section_counts": {
    "entity_commercial": 17,
    "technology_infrastructure": 6,
    "ai_capability": 15,
    "privacy_sensitive_use": 9,
    "india_privacy_cyber": 32
  },
  "answer_type_counts": {
    "short_answer": 19,
    "long_answer": 30,
    "dropdown": 26,
    "select": 4
  },
  "source_table_status_counts": {
    "Prefill / confirm": 41,
    "Review / complete": 33,
    "Need to fill": 5
  },
  "prefill_strength_counts": {
    "FULL": 41,
    "PARTIAL": 33,
    "NONE": 5
  },
  "prefill_source_counts": {
    "backend_artifact": 74,
    "reviewer_input": 5
  },
  "evidence_status_counts": {
    "DILIGENCE_FIELD_MAPPED_FULL": 41,
    "DILIGENCE_FIELD_MAPPED_PARTIAL": 33,
    "NO_DIRECT_DILIGENCE_FIELD": 5
  },
  "vault_payload_row_count": 47,
  "india_privacy_cyber_row_count": 32,
  "field_mapped_full_row_count": 41,
  "field_mapped_partial_row_count": 33,
  "reviewer_input_row_count": 5,
  "backend_prefill_row_count": 74,
  "demo_prefill_row_count": 0
});

export const QUALIFIED_REVIEW_MAP = Object.freeze([
  {
    "question_id": "QR-001",
    "question_number": 1,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "company_legal_name",
    "lawyer_question": "What legal name should appear as the provider/operator in the draft stack?",
    "public_question_label": "What legal name should appear as the provider/operator in the draft stack?",
    "canonical_path": "baseline.company",
    "vault_payload_path": "baseline.company",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.target_identity.legal_entity_name"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "If absent, ask for registered legal name, not brand name.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS",
      "DOC_DPA",
      "DOC_PP",
      "DOC_AGT",
      "DOC_SLA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_profile.target_identity.legal_entity_name"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "target_profile.target_identity.legal_entity_name",
      "target_profile.target_identity.legal_name",
      "target_profile.target_identity.brand_name",
      "legal_cartography_index.legal_notice.entity_name"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-002",
    "question_number": 2,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "entity_type",
    "lawyer_question": "What is the operator’s entity type?",
    "public_question_label": "What is the operator’s entity type?",
    "canonical_path": "baseline.entity_type",
    "vault_payload_path": "baseline.entity_type",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.target_identity.entity_type"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Common examples: Delaware C-Corp, LLC, private limited company, sole proprietor.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS",
      "DOC_DPA",
      "DOC_AGT",
      "Engagement Letter"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_profile.target_identity.entity_type"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "target_profile.target_identity.entity_type",
      "target_profile.jurisdiction_notice.entity_form"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-003",
    "question_number": 3,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "registered_business_address",
    "lawyer_question": "What address should be used for notices and party details?",
    "public_question_label": "What address should be used for notices and party details?",
    "canonical_path": "baseline.address",
    "vault_payload_path": "baseline.address",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.jurisdiction_notice.registered_notice_location"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Use formal registered/business notice address, not support address unless same. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS",
      "DOC_DPA",
      "DOC_PP",
      "DOC_AGT"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_profile.jurisdiction_notice.registered_notice_location"
    ],
    "answer_extractor": "profile_summary",
    "evidence_source_mapping": [
      "target_profile.jurisdiction_notice.registered_notice_location",
      "target_profile.target_identity.registered_address",
      "legal_cartography_index.legal_notice.address"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-004",
    "question_number": 4,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "legal_notice_email",
    "lawyer_question": "What email address should receive contractual/legal notices?",
    "public_question_label": "What email address should receive contractual/legal notices?",
    "canonical_path": "baseline.legal_email",
    "vault_payload_path": "baseline.legal_email",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.privacy_governance_contact_accountability_signals[0]",
      "legal_cartography_index.control_language_locator[CONTACT_ROUTES]"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Common pattern: `legal@company.com` or founder/legal ops mailbox.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS notice clause",
      "DOC_DPA notices"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.privacy_governance_contact_accountability_signals[0]",
      "legal_cartography_index.control_language_locator[CONTACT_ROUTES]"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "data_provenance_profile.privacy_governance_contact_accountability_signals[0]",
      "legal_cartography_index.control_language_locator[CONTACT_ROUTES]",
      "legal_cartography_index.control_language_locator.legal_notice_email",
      "target_profile.contact.legal_email"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-005",
    "question_number": 5,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "privacy_contact_email",
    "lawyer_question": "What email address should receive privacy and data protection requests?",
    "public_question_label": "What email address should receive privacy and data protection requests?",
    "canonical_path": "baseline.privacy_email",
    "vault_payload_path": "baseline.privacy_email",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.privacy_governance_contact_accountability_signals[0]"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Common pattern: `privacy@company.com`, `dpo@company.com`, or support/privacy mailbox.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.privacy_governance_contact_accountability_signals[0]"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "data_provenance_profile.privacy_governance_contact_accountability_signals[0]",
      "legal_cartography_index.document_coverage_index.privacy_notice.contact",
      "data_provenance_profile.privacy_governance_contact_accountability_signals"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-006",
    "question_number": 6,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "products_services",
    "lawyer_question": "Which products, services, APIs, platforms, or tools are covered?",
    "public_question_label": "Which products, services, APIs, platforms, or tools are covered?",
    "canonical_path": "baseline.products",
    "vault_payload_path": "baseline.products",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.product_service_wrapper.product_service_wrapper_names",
      "target_feature_profile.activities[*].product_service_wrapper"
    ],
    "answer_type": "select",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "If absent, reviewer lists product names and one-line descriptions.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS Schedule A",
      "DOC_DPA processing schedule",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_profile.product_service_wrapper.product_service_wrapper_names",
      "target_feature_profile.activities[*].product_service_wrapper"
    ],
    "answer_extractor": "product_service_names",
    "evidence_source_mapping": [
      "target_profile.product_service_wrapper.product_service_wrapper_names",
      "target_feature_profile.activities[*].product_service_wrapper",
      "target_profile.product_service_wrapper.products",
      "target_feature_profile.activities",
      "source_discovery_handoff.product_sources"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-007",
    "question_number": 7,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "jurisdiction_country",
    "lawyer_question": "Which country’s law should govern the draft stack?",
    "public_question_label": "Which country’s law should govern the draft stack?",
    "canonical_path": "baseline.jurisdiction.country",
    "vault_payload_path": "baseline.jurisdiction.country",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.jurisdiction_notice.governing_law",
      "target_profile.jurisdiction_notice.registered_notice_location"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Market norm: choose provider home jurisdiction or main commercial contracting jurisdiction. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS governing law",
      "DOC_PBK_A"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_profile.jurisdiction_notice.governing_law",
      "target_profile.jurisdiction_notice.registered_notice_location"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "target_profile.jurisdiction_notice.governing_law",
      "target_profile.jurisdiction_notice.registered_notice_location",
      "target_profile.jurisdiction_notice.country",
      "legal_cartography_index.control_language_locator.governing_law"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-008",
    "question_number": 8,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "jurisdiction_state_forum",
    "lawyer_question": "Which state/province/forum or dispute venue should apply?",
    "public_question_label": "Which state/province/forum or dispute venue should apply?",
    "canonical_path": "baseline.jurisdiction.state",
    "vault_payload_path": "baseline.jurisdiction.state",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.jurisdiction_notice.courts_venue"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "For US SaaS, common forums include Delaware, New York, California, Texas. Confirm with counsel. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS dispute resolution",
      "DOC_PBK_A"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_profile.jurisdiction_notice.courts_venue"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "target_profile.jurisdiction_notice.courts_venue",
      "legal_cartography_index.control_language_locator.forum",
      "legal_cartography_index.control_language_locator.dispute_resolution"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-009",
    "question_number": 9,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "market_exposure",
    "lawyer_question": "Is the product primarily B2B, B2C, or hybrid?",
    "public_question_label": "Is the product primarily B2B, B2C, or hybrid?",
    "canonical_path": "baseline.market",
    "vault_payload_path": "baseline.market",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.business_context.market_type_candidate"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "B2B",
      "B2C",
      "Hybrid",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: B2B, B2C, Hybrid, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS",
      "DOC_PP",
      "DOC_AUP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_profile.business_context.market_type_candidate"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "target_profile.business_context.market_type_candidate",
      "target_profile.business_context.market_scope",
      "integrated_dap_report.report_boundary_source_coverage"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-010",
    "question_number": 10,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "delivery_app",
    "lawyer_question": "Is the service delivered through a web app, dashboard, mobile app, or hosted interface?",
    "public_question_label": "Is the service delivered through a web app, dashboard, mobile app, or hosted interface?",
    "canonical_path": "baseline.delivery.app",
    "vault_payload_path": "baseline.delivery.app",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.product_service_wrapper.delivery_model_signals"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS service description"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_profile.product_service_wrapper.delivery_model_signals"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "target_profile.product_service_wrapper.delivery_model_signals",
      "target_feature_profile.delivery_channels.web_app",
      "target_feature_profile.activities.delivery_mode",
      "source_discovery_handoff.product_sources"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-011",
    "question_number": 11,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "delivery_api",
    "lawyer_question": "Is the service delivered through an API, SDK, webhook, integration, or developer interface?",
    "public_question_label": "Is the service delivered through an API, SDK, webhook, integration, or developer interface?",
    "canonical_path": "baseline.delivery.api",
    "vault_payload_path": "baseline.delivery.api",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_profile.product_service_wrapper.delivery_model_signals",
      "lossless_family__D4_DOCS_API_DATA_FLOW.sources[*]"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS API terms",
      "DOC_AGT"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_profile.product_service_wrapper.delivery_model_signals",
      "lossless_family__D4_DOCS_API_DATA_FLOW.sources[*]"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "target_profile.product_service_wrapper.delivery_model_signals",
      "lossless_family__D4_DOCS_API_DATA_FLOW.sources[*]",
      "target_feature_profile.delivery_channels.api",
      "target_feature_profile.integrations.api_docs",
      "source_discovery_handoff.data_sources"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-012",
    "question_number": 12,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "revenue_model",
    "lawyer_question": "What is the commercial revenue model?",
    "public_question_label": "What is the commercial revenue model?",
    "canonical_path": "baseline.revenue_model",
    "vault_payload_path": "baseline.revenue_model",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "lossless_family__P5_ENTERPRISE_PRICING.sources[0].lossless_text"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Examples: subscription, usage-based, seat-based, enterprise license, freemium, services + SaaS.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS payment terms",
      "DOC_SLA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "lossless_family__P5_ENTERPRISE_PRICING.sources[0].lossless_text"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "lossless_family__P5_ENTERPRISE_PRICING.sources[0].lossless_text",
      "target_profile.business_context.revenue_model",
      "source_discovery_handoff.pricing_sources"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-013",
    "question_number": 13,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "acv_liability_reference",
    "lawyer_question": "What contract value or pricing level should guide liability caps?",
    "public_question_label": "What contract value or pricing level should guide liability caps?",
    "canonical_path": "baseline.acv",
    "vault_payload_path": "baseline.acv",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "legal_cartography_index.document_structure_index[Section 10: Limitation of Liability]",
      "lossless_family__L1_CORE_TERMS_PRIVACY Terms §10"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo suggestion: common SaaS cap is fees paid in prior 12 months; confirm actual position. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS liability cap",
      "DOC_PBK_A"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "legal_cartography_index.document_structure_index[Section 10: Limitation of Liability]",
      "lossless_family__L1_CORE_TERMS_PRIVACY Terms §10"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "legal_cartography_index.document_structure_index[Section 10: Limitation of Liability]",
      "lossless_family__L1_CORE_TERMS_PRIVACY Terms §10",
      "legal_cartography_index.control_language_locator.liability_cap",
      "legal_cartography_index.control_language_locator.fees_paid_cap",
      "target_profile.commercial_terms"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-014",
    "question_number": 14,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "beta_free_tier_posture",
    "lawyer_question": "Is the product in beta, pilot, free trial, freemium, or paid production use?",
    "public_question_label": "Is the product in beta, pilot, free trial, freemium, or paid production use?",
    "canonical_path": "baseline.has_beta",
    "vault_payload_path": "baseline.has_beta",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "lossless_family__P5_ENTERPRISE_PRICING.sources[0].lossless_text"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Production",
      "Beta/Pilot",
      "Free trial",
      "Freemium",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Production, Beta/Pilot, Free trial, Freemium, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS beta waiver",
      "DOC_AUP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "lossless_family__P5_ENTERPRISE_PRICING.sources[0].lossless_text"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "lossless_family__P5_ENTERPRISE_PRICING.sources[0].lossless_text",
      "legal_cartography_index.control_language_locator.beta_preview_terms",
      "source_discovery_handoff.pricing_sources"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-015",
    "question_number": 15,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "output_ownership_posture",
    "lawyer_question": "What ownership position should apply to AI outputs?",
    "public_question_label": "What ownership position should apply to AI outputs?",
    "canonical_path": "baseline.output_ownership",
    "vault_payload_path": "baseline.output_ownership",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "legal_cartography_index.document_structure_index[Your Content and Output; 3.1 Ownership of Your Content]",
      "data_provenance_profile.generated_output_and_derived_data_treatment"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Full customer ownership, limited license, provider retains, mixed/unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS IP/output clause",
      "DOC_IP",
      "DOC_SOP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "legal_cartography_index.document_structure_index[Your Content and Output; 3.1 Ownership of Your Content]",
      "data_provenance_profile.generated_output_and_derived_data_treatment"
    ],
    "answer_extractor": "profile_summary",
    "evidence_source_mapping": [
      "legal_cartography_index.document_structure_index[Your Content and Output; 3.1 Ownership of Your Content]",
      "data_provenance_profile.generated_output_and_derived_data_treatment",
      "legal_cartography_index.control_language_locator.output_ownership",
      "legal_cartography_index.control_language_locator.ip_terms",
      "target_feature_profile.output_profile"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-016",
    "question_number": 16,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "sla_posture",
    "lawyer_question": "Will the company offer no SLA, a standard SLA, or a custom SLA?",
    "public_question_label": "Will the company offer no SLA, a standard SLA, or a custom SLA?",
    "canonical_path": "baseline.sla_type",
    "vault_payload_path": "baseline.sla_type",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure A: SLA]",
      "legal_cartography_index.document_coverage_index[Annexure B: Support Services]"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "No SLA",
      "Standard SLA",
      "Custom SLA",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: No SLA, Standard SLA, Custom SLA, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_SLA",
      "DOC_TOS"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure A: SLA]",
      "legal_cartography_index.document_coverage_index[Annexure B: Support Services]"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure A: SLA]",
      "legal_cartography_index.document_coverage_index[Annexure B: Support Services]",
      "legal_cartography_index.document_coverage_index.sla",
      "legal_cartography_index.control_language_locator.service_levels"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-017",
    "question_number": 17,
    "section_id": "entity_commercial",
    "section_number": 1,
    "section_title": "Entity, Notices & Commercial Posture",
    "field_key": "reliance_threshold",
    "lawyer_question": "Can users rely on the output for decisions, actions, transactions, or professional judgment?",
    "public_question_label": "Can users rely on the output for decisions, actions, transactions, or professional judgment?",
    "canonical_path": "baseline.reliance_threshold",
    "vault_payload_path": "baseline.reliance_threshold",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "legal_cartography_index.control_language_locator[WARRANTY/DISCLAIMER/NO_RELIANCE candidates]",
      "data_provenance_profile.automated_decision_profiling_human_review_signal"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo suggestion: most AI SaaS should position output as assistive unless explicitly reviewed. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS reliance disclaimer",
      "DOC_AUP",
      "DOC_PBK_A"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "baseline",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "legal_cartography_index.control_language_locator[WARRANTY/DISCLAIMER/NO_RELIANCE candidates]",
      "data_provenance_profile.automated_decision_profiling_human_review_signal"
    ],
    "answer_extractor": "profile_summary",
    "evidence_source_mapping": [
      "legal_cartography_index.control_language_locator[WARRANTY/DISCLAIMER/NO_RELIANCE candidates]",
      "data_provenance_profile.automated_decision_profiling_human_review_signal",
      "legal_cartography_index.control_language_locator.no_reliance",
      "legal_cartography_index.control_language_locator.disclaimers",
      "exposure_registry.reliance_related_rows"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-018",
    "question_number": 18,
    "section_id": "technology_infrastructure",
    "section_number": 2,
    "section_title": "Technology Stack, AI Memory & Infrastructure",
    "field_key": "ai_memory_architecture",
    "lawyer_question": "Does the system retain user inputs, chat history, workspace memory, embeddings, or long-term context?",
    "public_question_label": "Does the system retain user inputs, chat history, workspace memory, embeddings, or long-term context?",
    "canonical_path": "architecture.memory",
    "vault_payload_path": "architecture.memory",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.prompt_output_logging_telemetry_controls",
      "data_provenance_profile.embeddings_vector_memory_controls",
      "data_provenance_profile.ai_training_finetuning_model_improvement_controls"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: None, Session-only, Account/workspace memory, Vector/embedding memory, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP",
      "DOC_TOS"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "architecture",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "data_provenance_profile.prompt_output_logging_telemetry_controls",
      "data_provenance_profile.embeddings_vector_memory_controls",
      "data_provenance_profile.ai_training_finetuning_model_improvement_controls"
    ],
    "answer_extractor": "profile_summary",
    "evidence_source_mapping": [
      "data_provenance_profile.prompt_output_logging_telemetry_controls",
      "data_provenance_profile.embeddings_vector_memory_controls",
      "data_provenance_profile.ai_training_finetuning_model_improvement_controls",
      "target_feature_profile.ai_memory_profile",
      "integrated_dap_report.ai_processing_chain_model_data_controls"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-019",
    "question_number": 19,
    "section_id": "technology_infrastructure",
    "section_number": 2,
    "section_title": "Technology Stack, AI Memory & Infrastructure",
    "field_key": "model_infrastructure",
    "lawyer_question": "Which AI model infrastructure or model providers power the service?",
    "public_question_label": "Which AI model infrastructure or model providers power the service?",
    "canonical_path": "architecture.models",
    "vault_payload_path": "architecture.models",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.ai_model_provider_processing_chain",
      "target_profile.business_context.business_category"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: OpenAI, Anthropic, Google/Gemini, Open source/self-hosted, Multiple, Other.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS AI disclosure",
      "DOC_DPA subprocessors"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "architecture",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.ai_model_provider_processing_chain",
      "target_profile.business_context.business_category"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "data_provenance_profile.ai_model_provider_processing_chain",
      "target_profile.business_context.business_category",
      "target_feature_profile.model_provider_profile",
      "integrated_dap_report.ai_processing_chain_model_data_controls"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-020",
    "question_number": 20,
    "section_id": "technology_infrastructure",
    "section_number": 2,
    "section_title": "Technology Stack, AI Memory & Infrastructure",
    "field_key": "named_ai_subprocessors",
    "lawyer_question": "Which AI vendors, subprocessors, or infrastructure providers process customer/user data?",
    "public_question_label": "Which AI vendors, subprocessors, or infrastructure providers process customer/user data?",
    "canonical_path": "architecture.sub_processors.*",
    "vault_payload_path": "architecture.sub_processors.*",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.vendor_subprocessor_partner_inventory[0]"
    ],
    "answer_type": "select",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "If missing, ask reviewer to list all actual processors and AI vendors.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "architecture",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.vendor_subprocessor_partner_inventory[0]"
    ],
    "answer_extractor": "vendor_subprocessor_names",
    "evidence_source_mapping": [
      "data_provenance_profile.vendor_subprocessor_partner_inventory[0]",
      "legal_cartography_index.document_coverage_index.subprocessors",
      "data_provenance_profile.vendor_subprocessor_partner_inventory",
      "integrated_dap_report.contracts_vendors_subprocessors"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-021",
    "question_number": 21,
    "section_id": "technology_infrastructure",
    "section_number": 2,
    "section_title": "Technology Stack, AI Memory & Infrastructure",
    "field_key": "subprocessor_list_url",
    "lawyer_question": "Is there a public or internal subprocessor list URL?",
    "public_question_label": "Is there a public or internal subprocessor list URL?",
    "canonical_path": "architecture.sub_processors.url",
    "vault_payload_path": "architecture.sub_processors.url",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "legal_cartography_index.document_coverage_index[artifact_class=SUBPROCESSOR_LIST].source"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "If none, leave blank or mark no public list. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA subprocessor clause"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "architecture",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "legal_cartography_index.document_coverage_index[artifact_class=SUBPROCESSOR_LIST].source"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "legal_cartography_index.document_coverage_index[artifact_class=SUBPROCESSOR_LIST].source",
      "legal_cartography_index.document_coverage_index.subprocessor_url",
      "source_discovery_handoff.legal_sources.subprocessor_page"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-022",
    "question_number": 22,
    "section_id": "technology_infrastructure",
    "section_number": 2,
    "section_title": "Technology Stack, AI Memory & Infrastructure",
    "field_key": "cloud_host",
    "lawyer_question": "Where is the product hosted or where is customer data stored?",
    "public_question_label": "Where is the product hosted or where is customer data stored?",
    "canonical_path": "architecture.cloud_host",
    "vault_payload_path": "architecture.cloud_host",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.vendor_subprocessor_partner_inventory",
      "data_provenance_profile.cross_border_transfer_location_custody"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo examples: AWS, GCP, Azure, Vercel, Cloudflare, self-hosted.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA Schedule C",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "architecture",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.vendor_subprocessor_partner_inventory",
      "data_provenance_profile.cross_border_transfer_location_custody"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "data_provenance_profile.vendor_subprocessor_partner_inventory",
      "data_provenance_profile.cross_border_transfer_location_custody",
      "source_discovery_handoff.data_sources"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-023",
    "question_number": 23,
    "section_id": "technology_infrastructure",
    "section_number": 2,
    "section_title": "Technology Stack, AI Memory & Infrastructure",
    "field_key": "vector_database_retrieval_layer",
    "lawyer_question": "Does the system use a vector database, embedding store, RAG layer, or document memory system?",
    "public_question_label": "Does the system use a vector database, embedding store, RAG layer, or document memory system?",
    "canonical_path": "architecture.vector_db",
    "vault_payload_path": "architecture.vector_db",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.embeddings_vector_memory_controls",
      "target_feature_profile.activities[0].mechanics_proof"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo examples: Pinecone, Weaviate, Qdrant, pgvector, custom retrieval layer, none.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP",
      "DOC_TOS"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "architecture",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.embeddings_vector_memory_controls",
      "target_feature_profile.activities[0].mechanics_proof"
    ],
    "answer_extractor": "profile_summary",
    "evidence_source_mapping": [
      "data_provenance_profile.embeddings_vector_memory_controls",
      "target_feature_profile.activities[0].mechanics_proof",
      "target_feature_profile.rag_retrieval_profile",
      "data_provenance_profile.ai_training_finetuning_model_improvement_controls"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-024",
    "question_number": 24,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_doer",
    "lawyer_question": "Can the system take actions for the user or operate tools on the user’s behalf?",
    "public_question_label": "Can the system take actions for the user or operate tools on the user’s behalf?",
    "canonical_path": "archetypes.is_doer",
    "vault_payload_path": "archetypes.is_doer",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains DOE",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=DOE]"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AGT",
      "DOC_TOS"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains DOE",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=DOE]"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains DOE",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=DOE]",
      "target_feature_profile.archetype_profile.DOER",
      "exposure_registry.triggered_rows.DOER"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-025",
    "question_number": 25,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_orchestrator",
    "lawyer_question": "Can the system coordinate tools, APIs, agents, workflows, or external systems?",
    "public_question_label": "Can the system coordinate tools, APIs, agents, workflows, or external systems?",
    "canonical_path": "archetypes.is_orchestrator",
    "vault_payload_path": "archetypes.is_orchestrator",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains ORC",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=ORC]"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AGT"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains ORC",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=ORC]"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains ORC",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=ORC]",
      "target_feature_profile.archetype_profile.ORCHESTRATOR",
      "exposure_registry.triggered_rows.ORCHESTRATOR"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-026",
    "question_number": 26,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "agent_session_cap",
    "lawyer_question": "What limit applies to one autonomous agent session or task run?",
    "public_question_label": "What limit applies to one autonomous agent session or task run?",
    "canonical_path": "archetypes.agent_limits.session_cap",
    "vault_payload_path": "archetypes.agent_limits.session_cap",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Need to fill",
    "backend_prefill_available": false,
    "prefill_source": "reviewer_input",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "reviewer_input_required",
    "ui_badge": "Reviewer input required",
    "evidence_status": "NO_DIRECT_DILIGENCE_FIELD",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo suggestion: set a per-session action cap, e.g. number of actions/API calls before pause. No direct diligence field currently answers this question.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AGT Schedule C"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Fill before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "NONE",
    "answer_prefill_mapping": [],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "target_feature_profile.agentic_controls.session_cap",
      "challenge_gate.agentic_limits"
    ],
    "field_mapping_locked_class": "NO_DIRECT_DILIGENCE_FIELD"
  },
  {
    "question_id": "QR-027",
    "question_number": 27,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "agent_period_cap",
    "lawyer_question": "What time-period or usage cap applies to agentic activity?",
    "public_question_label": "What time-period or usage cap applies to agentic activity?",
    "canonical_path": "archetypes.agent_limits.period_cap",
    "vault_payload_path": "archetypes.agent_limits.period_cap",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Need to fill",
    "backend_prefill_available": false,
    "prefill_source": "reviewer_input",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "reviewer_input_required",
    "ui_badge": "Reviewer input required",
    "evidence_status": "NO_DIRECT_DILIGENCE_FIELD",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo suggestion: set daily/monthly action, spend, or transaction thresholds. No direct diligence field currently answers this question.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AGT Schedule C"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Fill before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "NONE",
    "answer_prefill_mapping": [],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "target_feature_profile.agentic_controls.period_cap",
      "challenge_gate.agentic_limits"
    ],
    "field_mapping_locked_class": "NO_DIRECT_DILIGENCE_FIELD"
  },
  {
    "question_id": "QR-028",
    "question_number": 28,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "agent_retry_limit",
    "lawyer_question": "What retry limit applies when an agent action fails?",
    "public_question_label": "What retry limit applies when an agent action fails?",
    "canonical_path": "archetypes.agent_limits.retry_limit",
    "vault_payload_path": "archetypes.agent_limits.retry_limit",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Need to fill",
    "backend_prefill_available": false,
    "prefill_source": "reviewer_input",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "reviewer_input_required",
    "ui_badge": "Reviewer input required",
    "evidence_status": "NO_DIRECT_DILIGENCE_FIELD",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo suggestion: limit retries to avoid retry storms; common default is low single digits. No direct diligence field currently answers this question.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AGT retry storm clause"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Fill before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "NONE",
    "answer_prefill_mapping": [],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "target_feature_profile.agentic_controls.retry_limit",
      "challenge_gate.agentic_limits"
    ],
    "field_mapping_locked_class": "NO_DIRECT_DILIGENCE_FIELD"
  },
  {
    "question_id": "QR-029",
    "question_number": 29,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "agent_loop_threshold",
    "lawyer_question": "What guardrail stops loops, runaway execution, or excessive tool calls?",
    "public_question_label": "What guardrail stops loops, runaway execution, or excessive tool calls?",
    "canonical_path": "archetypes.agent_limits.loop_threshold",
    "vault_payload_path": "archetypes.agent_limits.loop_threshold",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Need to fill",
    "backend_prefill_available": false,
    "prefill_source": "reviewer_input",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "reviewer_input_required",
    "ui_badge": "Reviewer input required",
    "evidence_status": "NO_DIRECT_DILIGENCE_FIELD",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo suggestion: define a loop/circuit breaker threshold before automatic pause. No direct diligence field currently answers this question.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AGT kill switch / circuit breaker"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Fill before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "NONE",
    "answer_prefill_mapping": [],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "target_feature_profile.agentic_controls.loop_threshold",
      "challenge_gate.agentic_limits"
    ],
    "field_mapping_locked_class": "NO_DIRECT_DILIGENCE_FIELD"
  },
  {
    "question_id": "QR-030",
    "question_number": 30,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_creator",
    "lawyer_question": "Does the system create text, images, code, documents, plans, recommendations, or other outputs?",
    "public_question_label": "Does the system create text, images, code, documents, plans, recommendations, or other outputs?",
    "canonical_path": "archetypes.is_creator",
    "vault_payload_path": "archetypes.is_creator",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains CRT",
      "exposure_registry_controlled_profile.controlled_rows[Archetype=CRT]"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS output terms",
      "DOC_IP",
      "DOC_SOP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains CRT",
      "exposure_registry_controlled_profile.controlled_rows[Archetype=CRT]"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains CRT",
      "exposure_registry_controlled_profile.controlled_rows[Archetype=CRT]",
      "target_feature_profile.archetype_profile.CREATOR",
      "target_feature_profile.output_profile",
      "exposure_registry.triggered_rows.CREATOR"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-031",
    "question_number": 31,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_reader_ingestion",
    "lawyer_question": "Does the system read, ingest, classify, summarize, or extract from external sources or uploaded files?",
    "public_question_label": "Does the system read, ingest, classify, summarize, or extract from external sources or uploaded files?",
    "canonical_path": "archetypes.is_reader",
    "vault_payload_path": "archetypes.is_reader",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains RDR",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=RDR]"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains RDR",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=RDR]"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains RDR",
      "exposure_registry_triggered_profile.triggered_rows[Archetype=RDR]",
      "target_feature_profile.archetype_profile.READER",
      "data_provenance_profile.collection_sources_activity_data_flows",
      "exposure_registry.triggered_rows.READER"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-032",
    "question_number": 32,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_companion",
    "lawyer_question": "Is the product positioned as an assistant, companion, coach, advisor, support agent, or conversational system?",
    "public_question_label": "Is the product positioned as an assistant, companion, coach, advisor, support agent, or conversational system?",
    "canonical_path": "archetypes.is_companion",
    "vault_payload_path": "archetypes.is_companion",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].activity_feature_name",
      "target_feature_profile.activities[*].archetype_codes"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_TOS"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].activity_feature_name",
      "target_feature_profile.activities[*].archetype_codes"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].activity_feature_name",
      "target_feature_profile.activities[*].archetype_codes",
      "target_feature_profile.archetype_profile.COMPANION",
      "target_feature_profile.user_interaction_profile",
      "exposure_registry.triggered_rows.COMPANION"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-033",
    "question_number": 33,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_biometric_translator",
    "lawyer_question": "Does the product process biometric, voice, image, translation, transcription, or identity-related signals?",
    "public_question_label": "Does the product process biometric, voice, image, translation, transcription, or identity-related signals?",
    "canonical_path": "archetypes.sens_bio",
    "vault_payload_path": "archetypes.sens_bio",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains TRN",
      "data_provenance_profile.sensitive_special_category_signals",
      "exposure_registry_controlled_profile.controlled_rows[Archetype=TRN]"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_DPA",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains TRN",
      "data_provenance_profile.sensitive_special_category_signals",
      "exposure_registry_controlled_profile.controlled_rows[Archetype=TRN]"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes contains TRN",
      "data_provenance_profile.sensitive_special_category_signals",
      "exposure_registry_controlled_profile.controlled_rows[Archetype=TRN]",
      "target_feature_profile.archetype_profile.BIOMETRIC_TRANSLATOR"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-034",
    "question_number": 34,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_judge",
    "lawyer_question": "Does the system score, rank, approve, reject, evaluate, assess, or make judgment-like outputs?",
    "public_question_label": "Does the system score, rank, approve, reject, evaluate, assess, or make judgment-like outputs?",
    "canonical_path": "archetypes.is_judge",
    "vault_payload_path": "archetypes.is_judge",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes",
      "data_provenance_profile.automated_decision_profiling_human_review_signal"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. HITL becomes downstream effect, not Vault field. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes",
      "data_provenance_profile.automated_decision_profiling_human_review_signal"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes",
      "data_provenance_profile.automated_decision_profiling_human_review_signal",
      "target_feature_profile.archetype_profile.JUDGE",
      "target_feature_profile.decision_support_profile",
      "exposure_registry.triggered_rows.JUDGE"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-035",
    "question_number": 35,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_optimizer",
    "lawyer_question": "Does the system optimize workflows, pricing, targeting, allocation, performance, or business outcomes?",
    "public_question_label": "Does the system optimize workflows, pricing, targeting, allocation, performance, or business outcomes?",
    "canonical_path": "archetypes.is_optimizer",
    "vault_payload_path": "archetypes.is_optimizer",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes",
      "target_feature_profile.archetype_profile.OPTIMIZER",
      "target_feature_profile.optimization_profile",
      "exposure_registry.triggered_rows.OPTIMIZER"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-036",
    "question_number": 36,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_shield",
    "lawyer_question": "Does the system detect risk, fraud, abuse, policy violations, security events, or compliance issues?",
    "public_question_label": "Does the system detect risk, fraud, abuse, policy violations, security events, or compliance issues?",
    "canonical_path": "archetypes.is_shield",
    "vault_payload_path": "archetypes.is_shield",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes",
      "data_provenance_profile.security_access_controls"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes",
      "data_provenance_profile.security_access_controls"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes",
      "data_provenance_profile.security_access_controls",
      "target_feature_profile.archetype_profile.SHIELD",
      "target_feature_profile.safety_security_profile",
      "exposure_registry.triggered_rows.SHIELD"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-037",
    "question_number": 37,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_mover",
    "lawyer_question": "Does the system move, transmit, export, sync, route, or transfer data between systems?",
    "public_question_label": "Does the system move, transmit, export, sync, route, or transfer data between systems?",
    "canonical_path": "archetypes.is_mover",
    "vault_payload_path": "archetypes.is_mover",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].external_internal_action_signal",
      "data_provenance_profile.cross_border_transfer_location_custody"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AGT",
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].external_internal_action_signal",
      "data_provenance_profile.cross_border_transfer_location_custody"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].external_internal_action_signal",
      "data_provenance_profile.cross_border_transfer_location_custody",
      "target_feature_profile.archetype_profile.MOVER",
      "target_feature_profile.action_execution_profile",
      "exposure_registry.triggered_rows.MOVER"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-038",
    "question_number": 38,
    "section_id": "ai_capability",
    "section_number": 3,
    "section_title": "AI Capability & Product Behavior",
    "field_key": "capability_generalist",
    "lawyer_question": "Is the system a broad-purpose AI assistant rather than a narrow single-purpose tool?",
    "public_question_label": "Is the system a broad-purpose AI assistant rather than a narrow single-purpose tool?",
    "canonical_path": "archetypes.is_generalist",
    "vault_payload_path": "archetypes.is_generalist",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS",
      "DOC_AUP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "archetypes",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[*].archetype_codes"
    ],
    "answer_extractor": "archetype_capability_summary",
    "evidence_source_mapping": [
      "target_feature_profile.activities[*].archetype_codes",
      "target_feature_profile.archetype_profile.GENERALIST",
      "target_feature_profile.activities",
      "exposure_registry.triggered_rows.GENERALIST"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-039",
    "question_number": 39,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "personal_data_processing",
    "lawyer_question": "Does the product process personal data or personal information?",
    "public_question_label": "Does the product process personal data or personal information?",
    "canonical_path": "compliance.processes_pii",
    "vault_payload_path": "compliance.processes_pii",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.data_categories",
      "data_provenance_profile.individuals_and_relationships"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.data_categories",
      "data_provenance_profile.individuals_and_relationships"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "data_provenance_profile.data_categories",
      "data_provenance_profile.individuals_and_relationships",
      "integrated_dap_report.data_categories_sensitivity_profile"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-040",
    "question_number": 40,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "eu_uk_exposure",
    "lawyer_question": "Are EU or UK users, customers, employees, or data subjects in scope?",
    "public_question_label": "Are EU or UK users, customers, employees, or data subjects in scope?",
    "canonical_path": "compliance.eu_users",
    "vault_payload_path": "compliance.eu_users",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure A: EEA/UK/Swiss Supplemental Notice]",
      "data_provenance_profile.law_regulatory_readiness_matrix"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA SCCs",
      "DOC_PP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure A: EEA/UK/Swiss Supplemental Notice]",
      "data_provenance_profile.law_regulatory_readiness_matrix"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure A: EEA/UK/Swiss Supplemental Notice]",
      "data_provenance_profile.law_regulatory_readiness_matrix",
      "target_profile.business_context.market_scope.eu_uk",
      "integrated_dap_report.governance_readiness_matrix"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-041",
    "question_number": 41,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "california_exposure",
    "lawyer_question": "Are California users, customers, employees, or consumers in scope?",
    "public_question_label": "Are California users, customers, employees, or consumers in scope?",
    "canonical_path": "compliance.ca_users",
    "vault_payload_path": "compliance.ca_users",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure B: California CCPA/CPRA Notice]",
      "data_provenance_profile.law_regulatory_readiness_matrix"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA CCPA/CPRA",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure B: California CCPA/CPRA Notice]",
      "data_provenance_profile.law_regulatory_readiness_matrix"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "legal_cartography_index.document_coverage_index[Annexure B: California CCPA/CPRA Notice]",
      "data_provenance_profile.law_regulatory_readiness_matrix",
      "target_profile.business_context.market_scope.california",
      "integrated_dap_report.governance_readiness_matrix"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-042",
    "question_number": 42,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "other_regional_exposure",
    "lawyer_question": "What other privacy, consumer, sectoral, or cross-border regimes may matter?",
    "public_question_label": "What other privacy, consumer, sectoral, or cross-border regimes may matter?",
    "canonical_path": "compliance.other_regions",
    "vault_payload_path": "compliance.other_regions",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.law_regulatory_readiness_matrix",
      "target_profile.business_context.regulated_sector_hints"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo examples: Canada, Australia, Singapore, Brazil, sector-specific regimes. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "data_provenance_profile.law_regulatory_readiness_matrix",
      "target_profile.business_context.regulated_sector_hints"
    ],
    "answer_extractor": "profile_text",
    "evidence_source_mapping": [
      "data_provenance_profile.law_regulatory_readiness_matrix",
      "target_profile.business_context.regulated_sector_hints",
      "target_profile.business_context.market_scope.other_regions",
      "integrated_dap_report.governance_readiness_matrix"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-043",
    "question_number": 43,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "health_medical_biometric_context",
    "lawyer_question": "Does the product process health, medical, wellness, clinical, biometric, or similar sensitive data?",
    "public_question_label": "Does the product process health, medical, wellness, clinical, biometric, or similar sensitive data?",
    "canonical_path": "compliance.sens_health + archetypes.sens_bio",
    "vault_payload_path": "compliance.sens_health` + `archetypes.sens_bio",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.sensitive_special_category_signals"
    ],
    "answer_type": "select",
    "answer_options": [
      "Health",
      "Medical",
      "Wellness",
      "Biometric",
      "None",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Health, Medical, Wellness, Biometric, None, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_DPA",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.sensitive_special_category_signals"
    ],
    "answer_extractor": "select_from_profile_signal",
    "evidence_source_mapping": [
      "data_provenance_profile.sensitive_special_category_signals",
      "target_feature_profile.regulated_context_profile",
      "exposure_registry.BIO/health rows"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-044",
    "question_number": 44,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "financial_data_financial_use",
    "lawyer_question": "Does the product process financial data or support financial decisions, payments, lending, credit, fraud, or risk analysis?",
    "public_question_label": "Does the product process financial data or support financial decisions, payments, lending, credit, fraud, or risk analysis?",
    "canonical_path": "compliance.sens_fin",
    "vault_payload_path": "compliance.sens_fin",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.sensitive_special_category_signals"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.sensitive_special_category_signals"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "data_provenance_profile.sensitive_special_category_signals",
      "target_feature_profile.regulated_context_profile.financial",
      "exposure_registry.financial_risk_rows"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-045",
    "question_number": 45,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "employment_hr_context",
    "lawyer_question": "Does the product process employee, contractor, applicant, HR, workplace, or monitoring data?",
    "public_question_label": "Does the product process employee, contractor, applicant, HR, workplace, or monitoring data?",
    "canonical_path": "compliance.sens_employment",
    "vault_payload_path": "compliance.sens_employment",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "target_feature_profile.activities[1].data_content_object_touched",
      "data_provenance_profile.individuals_and_relationships"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_HND",
      "DOC_SCAN",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "target_feature_profile.activities[1].data_content_object_touched",
      "data_provenance_profile.individuals_and_relationships"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "target_feature_profile.activities[1].data_content_object_touched",
      "data_provenance_profile.individuals_and_relationships",
      "target_feature_profile.regulated_context_profile.employment",
      "exposure_registry.employment_risk_rows"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-046",
    "question_number": 46,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "children_minors",
    "lawyer_question": "Could children or minors use the product or be affected by it?",
    "public_question_label": "Could children or minors use the product or be affected by it?",
    "canonical_path": "compliance.minors",
    "vault_payload_path": "compliance.minors",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [
      "data_provenance_profile.children_minors_signal"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_PP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "data_provenance_profile.children_minors_signal"
    ],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "data_provenance_profile.children_minors_signal",
      "extended_dap_india_readiness_profile.india_children_under_18_signal",
      "integrated_dap_report.children_tracking_profile"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-047",
    "question_number": 47,
    "section_id": "privacy_sensitive_use",
    "section_number": 4,
    "section_title": "Privacy, Sensitive Use & Market Exposure Baseline",
    "field_key": "distress_vulnerable_users",
    "lawyer_question": "Could the product affect vulnerable, distressed, dependent, or high-risk users?",
    "public_question_label": "Could the product affect vulnerable, distressed, dependent, or high-risk users?",
    "canonical_path": "compliance.distress",
    "vault_payload_path": "compliance.distress",
    "qualified_review_path": null,
    "path_type": "literal_vault_payload",
    "writes_to_vault_payload": true,
    "writes_to_india_privacy_cyber": false,
    "backend_prefill_mapping": [],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Need to fill",
    "backend_prefill_available": false,
    "prefill_source": "reviewer_input",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "reviewer_input_required",
    "ui_badge": "Reviewer input required",
    "evidence_status": "NO_DIRECT_DILIGENCE_FIELD",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. If yes, stronger AUP/HITL language required. No direct diligence field currently answers this question.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_AUP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Fill before draft preparation",
    "vault_payload_group": "compliance",
    "prefill_strength": "NONE",
    "answer_prefill_mapping": [],
    "answer_extractor": "dropdown_from_profile_signal",
    "evidence_source_mapping": [
      "data_provenance_profile.sensitive_special_category_signals",
      "target_feature_profile.user_context_profile.distress",
      "exposure_registry.vulnerable_user_rows"
    ],
    "field_mapping_locked_class": "NO_DIRECT_DILIGENCE_FIELD"
  },
  {
    "question_id": "QR-048",
    "question_number": 48,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "indian_users",
    "lawyer_question": "Does the product serve, target, or allow users located in India?",
    "public_question_label": "Does the product serve, target, or allow users located in India?",
    "canonical_path": "qualified_review.india_privacy_cyber.indian_users",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.indian_users",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_market_scope_signal].value_summary"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_DPA",
      "India readiness note"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_market_scope_signal].value_summary"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_market_scope_signal].value_summary",
      "extended_dap_india_readiness_profile.india_market_scope_signal",
      "integrated_dap_report.report_boundary_source_coverage.india_scope"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-049",
    "question_number": 49,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "indian_operations",
    "lawyer_question": "Does the company have Indian operations, employees, contractors, support teams, infrastructure, or an Indian entity?",
    "public_question_label": "Does the company have Indian operations, employees, contractors, support teams, infrastructure, or an Indian entity?",
    "canonical_path": "qualified_review.india_privacy_cyber.indian_operations",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.indian_operations",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_operations_signal].value_summary"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP",
      "DOC_SOP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_operations_signal].value_summary"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_operations_signal].value_summary",
      "extended_dap_india_readiness_profile.india_operations_signal",
      "integrated_dap_report.territorial_scope.india_operations"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-050",
    "question_number": 50,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "india_exclusion",
    "lawyer_question": "Does the company intentionally exclude India from the product, terms, or supported territories?",
    "public_question_label": "Does the company intentionally exclude India from the product, terms, or supported territories?",
    "canonical_path": "qualified_review.india_privacy_cyber.india_exclusion",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.india_exclusion",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_exclusion_or_no_exclusion_signal].value_summary"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Silent/unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Silent/unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_TOS",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_exclusion_or_no_exclusion_signal].value_summary"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_exclusion_or_no_exclusion_signal].value_summary",
      "extended_dap_india_readiness_profile.india_exclusion_or_no_exclusion_signal",
      "legal_cartography_index.control_language_locator.territorial_exclusion"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-051",
    "question_number": 51,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "indian_personal_data",
    "lawyer_question": "Does the product process personal data of individuals located in India?",
    "public_question_label": "Does the product process personal data of individuals located in India?",
    "canonical_path": "qualified_review.india_privacy_cyber.indian_personal_data",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.indian_personal_data",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_personal_data_processing_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_data_principal_population_signal].value_summary"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_personal_data_processing_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_data_principal_population_signal].value_summary"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_personal_data_processing_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_data_principal_population_signal].value_summary",
      "extended_dap_india_readiness_profile.india_personal_data_processing_signal",
      "extended_dap_india_readiness_profile.india_data_principal_population_signal"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-052",
    "question_number": 52,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "dpdp_role_mapping",
    "lawyer_question": "For Indian personal data, what is the company’s likely role?",
    "public_question_label": "For Indian personal data, what is the company’s likely role?",
    "canonical_path": "qualified_review.india_privacy_cyber.dpdp_role_mapping",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.dpdp_role_mapping",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_role_mapping_candidate].value_summary",
      "data_provenance_profile.role_relationship_readiness"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo examples: Data Fiduciary, Data Processor, both, unclear. Confirm with counsel. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_role_mapping_candidate].value_summary",
      "data_provenance_profile.role_relationship_readiness"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_role_mapping_candidate].value_summary",
      "data_provenance_profile.role_relationship_readiness",
      "extended_dap_india_readiness_profile.india_role_mapping_candidate",
      "integrated_dap_report.data_relationship_role_map.india_role"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-053",
    "question_number": 53,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "dpdp_notice_availability",
    "lawyer_question": "Is there a privacy notice or policy that can support India-facing notice obligations?",
    "public_question_label": "Is there a privacy notice or policy that can support India-facing notice obligations?",
    "canonical_path": "qualified_review.india_privacy_cyber.dpdp_notice_availability",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.dpdp_notice_availability",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpdp_notice_surface_signal].value_summary",
      "data_provenance_profile.privacy_notice_visibility"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Partial",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Partial, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpdp_notice_surface_signal].value_summary",
      "data_provenance_profile.privacy_notice_visibility"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpdp_notice_surface_signal].value_summary",
      "data_provenance_profile.privacy_notice_visibility",
      "extended_dap_india_readiness_profile.india_dpdp_notice_surface_signal",
      "integrated_dap_report.notice_consent_rights_accountability"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-054",
    "question_number": 54,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "purpose_linked_consent_authorization",
    "lawyer_question": "How are India-facing processing purposes linked to consent, authorization, contract, or user instruction?",
    "public_question_label": "How are India-facing processing purposes linked to consent, authorization, contract, or user instruction?",
    "canonical_path": "qualified_review.india_privacy_cyber.purpose_linked_consent_authorization",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.purpose_linked_consent_authorization",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_consent_authorization_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_purpose_specificity_signal].value_summary",
      "data_provenance_profile.purpose_use_signals"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe purposes and legal/contractual basis in plain terms.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_consent_authorization_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_purpose_specificity_signal].value_summary",
      "data_provenance_profile.purpose_use_signals"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_consent_authorization_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_purpose_specificity_signal].value_summary",
      "data_provenance_profile.purpose_use_signals",
      "extended_dap_india_readiness_profile.india_consent_authorization_signal",
      "extended_dap_india_readiness_profile.india_purpose_specificity_signal"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-055",
    "question_number": 55,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "withdrawal_route",
    "lawyer_question": "What route exists for users to withdraw consent, revoke authorization, opt out, or disable processing?",
    "public_question_label": "What route exists for users to withdraw consent, revoke authorization, opt out, or disable processing?",
    "canonical_path": "qualified_review.india_privacy_cyber.withdrawal_route",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.withdrawal_route",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_withdrawal_revocation_signal].value_summary",
      "data_provenance_profile.consent_withdrawal_controls",
      "data_provenance_profile.rights_request_routes"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe account setting, email route, support ticket, or manual process.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_withdrawal_revocation_signal].value_summary",
      "data_provenance_profile.consent_withdrawal_controls",
      "data_provenance_profile.rights_request_routes"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_withdrawal_revocation_signal].value_summary",
      "data_provenance_profile.consent_withdrawal_controls",
      "data_provenance_profile.rights_request_routes",
      "extended_dap_india_readiness_profile.india_withdrawal_revocation_signal",
      "integrated_dap_report.notice_consent_rights_accountability.withdrawal"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-056",
    "question_number": 56,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "grievance_contact",
    "lawyer_question": "Who or what mailbox handles India privacy grievances, complaints, or requests?",
    "public_question_label": "Who or what mailbox handles India privacy grievances, complaints, or requests?",
    "canonical_path": "qualified_review.india_privacy_cyber.grievance_contact",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.grievance_contact",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_grievance_contact_signal].value_summary",
      "data_provenance_profile.privacy_governance_contact_accountability_signals"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo examples: privacy email, grievance officer, DPO, legal contact.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_grievance_contact_signal].value_summary",
      "data_provenance_profile.privacy_governance_contact_accountability_signals"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_grievance_contact_signal].value_summary",
      "data_provenance_profile.privacy_governance_contact_accountability_signals",
      "extended_dap_india_readiness_profile.india_grievance_contact_signal",
      "integrated_dap_report.notice_consent_rights_accountability.grievance"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-057",
    "question_number": 57,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "consent_manager_support",
    "lawyer_question": "Does the product support, reference, or need Consent Manager flows?",
    "public_question_label": "Does the product support, reference, or need Consent Manager flows?",
    "canonical_path": "qualified_review.india_privacy_cyber.consent_manager_support",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.consent_manager_support",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_consent_manager_public_signal].value_summary"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Not applicable",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Not applicable, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_consent_manager_public_signal].value_summary"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_consent_manager_public_signal].value_summary",
      "extended_dap_india_readiness_profile.india_consent_manager_public_signal"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-058",
    "question_number": 58,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "children_under_18",
    "lawyer_question": "Could Indian users under 18 use the product or be affected by the processing?",
    "public_question_label": "Could Indian users under 18 use the product or be affected by the processing?",
    "canonical_path": "qualified_review.india_privacy_cyber.children_under_18",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.children_under_18",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_children_under_18_signal].value_summary",
      "data_provenance_profile.children_minors_signal"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_AUP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_children_under_18_signal].value_summary",
      "data_provenance_profile.children_minors_signal"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_children_under_18_signal].value_summary",
      "data_provenance_profile.children_minors_signal",
      "extended_dap_india_readiness_profile.india_children_under_18_signal",
      "integrated_dap_report.children_tracking_profile"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-059",
    "question_number": 59,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "verifiable_parental_consent",
    "lawyer_question": "If Indian children may be involved, what route exists for verifiable parental or guardian consent?",
    "public_question_label": "If Indian children may be involved, what route exists for verifiable parental or guardian consent?",
    "canonical_path": "qualified_review.india_privacy_cyber.verifiable_parental_consent",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.verifiable_parental_consent",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_consent_route_signal].value_summary",
      "data_provenance_profile.children_minors_signal"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe age-gate, guardian consent, school/admin approval, or mark N/A. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_AUP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_consent_route_signal].value_summary",
      "data_provenance_profile.children_minors_signal"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_consent_route_signal].value_summary",
      "data_provenance_profile.children_minors_signal",
      "extended_dap_india_readiness_profile.india_child_consent_route_signal"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-060",
    "question_number": 60,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "child_tracking_profiling",
    "lawyer_question": "Does the product track, profile, monitor, rank, or personalize experiences for children or minors?",
    "public_question_label": "Does the product track, profile, monitor, rank, or personalize experiences for children or minors?",
    "canonical_path": "qualified_review.india_privacy_cyber.child_tracking_profiling",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.child_tracking_profiling",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_tracking_or_ads_signal].value_summary",
      "data_provenance_profile.children_minors_signal"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_AUP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_tracking_or_ads_signal].value_summary",
      "data_provenance_profile.children_minors_signal"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_tracking_or_ads_signal].value_summary",
      "data_provenance_profile.children_minors_signal",
      "extended_dap_india_readiness_profile.india_child_tracking_or_ads_signal",
      "integrated_dap_report.cookies_tracking_marketing_profiling"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-061",
    "question_number": 61,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "targeted_ads_to_children",
    "lawyer_question": "Does the product show, enable, or support targeted advertising to children or minors?",
    "public_question_label": "Does the product show, enable, or support targeted advertising to children or minors?",
    "canonical_path": "qualified_review.india_privacy_cyber.targeted_ads_to_children",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.targeted_ads_to_children",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_tracking_or_ads_signal].value_summary",
      "data_provenance_profile.cookies_tracking_marketing_controls"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Not applicable",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Not applicable, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_AUP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_tracking_or_ads_signal].value_summary",
      "data_provenance_profile.cookies_tracking_marketing_controls"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_child_tracking_or_ads_signal].value_summary",
      "data_provenance_profile.cookies_tracking_marketing_controls",
      "extended_dap_india_readiness_profile.india_child_tracking_or_ads_signal",
      "integrated_dap_report.cookies_tracking_marketing_profiling.child_ads"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-062",
    "question_number": 62,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "transfer_outside_india",
    "lawyer_question": "Is Indian personal data stored, accessed, hosted, or transferred outside India?",
    "public_question_label": "Is Indian personal data stored, accessed, hosted, or transferred outside India?",
    "canonical_path": "qualified_review.india_privacy_cyber.transfer_outside_india",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.transfer_outside_india",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cross_border_transfer_signal].value_summary",
      "data_provenance_profile.cross_border_transfer_location_custody"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cross_border_transfer_signal].value_summary",
      "data_provenance_profile.cross_border_transfer_location_custody"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cross_border_transfer_signal].value_summary",
      "data_provenance_profile.cross_border_transfer_location_custody",
      "extended_dap_india_readiness_profile.india_cross_border_transfer_signal",
      "integrated_dap_report.location_cross_border_transfer_retention"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-063",
    "question_number": 63,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "restricted_territory_screening",
    "lawyer_question": "What process screens whether India-related transfers are restricted, prohibited, or blocked for specific territories?",
    "public_question_label": "What process screens whether India-related transfers are restricted, prohibited, or blocked for specific territories?",
    "canonical_path": "qualified_review.india_privacy_cyber.restricted_territory_screening",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.restricted_territory_screening",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_restricted_territory_screening_gap].value_summary"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe legal/compliance screen or mark no process. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_restricted_territory_screening_gap].value_summary"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_restricted_territory_screening_gap].value_summary",
      "extended_dap_india_readiness_profile.india_restricted_territory_screening_gap"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-064",
    "question_number": 64,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "india_vendor_transfer_map",
    "lawyer_question": "What vendor, subprocessor, or transfer map applies to Indian personal data?",
    "public_question_label": "What vendor, subprocessor, or transfer map applies to Indian personal data?",
    "canonical_path": "qualified_review.india_privacy_cyber.india_vendor_transfer_map",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.india_vendor_transfer_map",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_vendor_transfer_map_signal].value_summary",
      "data_provenance_profile.vendor_subprocessor_partner_inventory",
      "data_provenance_profile.cross_border_transfer_location_custody"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: list vendor, function, country/location, and data category.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA Schedule C"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_vendor_transfer_map_signal].value_summary",
      "data_provenance_profile.vendor_subprocessor_partner_inventory",
      "data_provenance_profile.cross_border_transfer_location_custody"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_vendor_transfer_map_signal].value_summary",
      "data_provenance_profile.vendor_subprocessor_partner_inventory",
      "data_provenance_profile.cross_border_transfer_location_custody",
      "extended_dap_india_readiness_profile.india_vendor_transfer_map_signal",
      "integrated_dap_report.contracts_vendors_subprocessors"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-065",
    "question_number": 65,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "cert_in_applicable",
    "lawyer_question": "Could Indian cyber incident reporting obligations apply to the company, product, infrastructure, or Indian operations?",
    "public_question_label": "Could Indian cyber incident reporting obligations apply to the company, product, infrastructure, or Indian operations?",
    "canonical_path": "qualified_review.india_privacy_cyber.cert_in_applicable",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.cert_in_applicable",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_reporting_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_breach_notification_signal].value_summary"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Confirm with counsel/technical team. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_SOP",
      "DOC_DPIA",
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_reporting_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_breach_notification_signal].value_summary"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_reporting_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_breach_notification_signal].value_summary",
      "extended_dap_india_readiness_profile.india_cert_in_reporting_signal",
      "integrated_dap_report.security_access_incident_cert_in_readiness"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-066",
    "question_number": 66,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "cert_in_point_of_contact",
    "lawyer_question": "Who is the internal point of contact for India cyber incident escalation?",
    "public_question_label": "Who is the internal point of contact for India cyber incident escalation?",
    "canonical_path": "qualified_review.india_privacy_cyber.cert_in_point_of_contact",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.cert_in_point_of_contact",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_poc_public_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_missing_proof].value_summary"
    ],
    "answer_type": "short_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo examples: security lead, CTO, privacy lead, legal ops contact. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_SOP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_poc_public_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_missing_proof].value_summary"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_poc_public_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_cert_in_missing_proof].value_summary",
      "extended_dap_india_readiness_profile.india_cert_in_poc_public_signal",
      "extended_dap_india_readiness_profile.india_cert_in_missing_proof"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-067",
    "question_number": 67,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "six_hour_reporting_workflow",
    "lawyer_question": "What workflow assesses and escalates reportable cyber incidents within the India reporting window?",
    "public_question_label": "What workflow assesses and escalates reportable cyber incidents within the India reporting window?",
    "canonical_path": "qualified_review.india_privacy_cyber.six_hour_reporting_workflow",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.six_hour_reporting_workflow",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_six_hour_reporting_workflow_signal].value_summary",
      "data_provenance_profile.breach_incident_readiness"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe detection, triage, legal review, escalation, regulator-reporting owner. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_SOP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_six_hour_reporting_workflow_signal].value_summary",
      "data_provenance_profile.breach_incident_readiness"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_six_hour_reporting_workflow_signal].value_summary",
      "data_provenance_profile.breach_incident_readiness",
      "extended_dap_india_readiness_profile.india_six_hour_reporting_workflow_signal",
      "integrated_dap_report.security_access_incident_cert_in_readiness"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-068",
    "question_number": 68,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "one_eighty_day_log_retention",
    "lawyer_question": "Are system, security, audit, or network logs retained for at least 180 days where required?",
    "public_question_label": "Are system, security, audit, or network logs retained for at least 180 days where required?",
    "canonical_path": "qualified_review.india_privacy_cyber.one_eighty_day_log_retention",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.one_eighty_day_log_retention",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_180_day_log_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_log_retention_signal].value_summary",
      "data_provenance_profile.prompt_output_logging_telemetry_controls"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Partial",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Partial, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_SOP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_180_day_log_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_log_retention_signal].value_summary",
      "data_provenance_profile.prompt_output_logging_telemetry_controls"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_180_day_log_signal].value_summary",
      "extended_dap_india_readiness_profile.fields[field_id=india_log_retention_signal].value_summary",
      "data_provenance_profile.prompt_output_logging_telemetry_controls",
      "extended_dap_india_readiness_profile.india_180_day_log_signal",
      "extended_dap_india_readiness_profile.india_log_retention_signal"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-069",
    "question_number": 69,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "logs_accessible_for_india",
    "lawyer_question": "Can relevant logs be accessed, preserved, or produced for India-related cyber or regulatory requests?",
    "public_question_label": "Can relevant logs be accessed, preserved, or produced for India-related cyber or regulatory requests?",
    "canonical_path": "qualified_review.india_privacy_cyber.logs_accessible_for_india",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.logs_accessible_for_india",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_logs_accessible_in_india_signal].value_summary",
      "data_provenance_profile.security_access_controls"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Partial",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Partial, Unclear. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_SOP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_logs_accessible_in_india_signal].value_summary",
      "data_provenance_profile.security_access_controls"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_logs_accessible_in_india_signal].value_summary",
      "data_provenance_profile.security_access_controls",
      "extended_dap_india_readiness_profile.india_logs_accessible_in_india_signal"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-070",
    "question_number": 70,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "security_policy",
    "lawyer_question": "Is there a written security policy or public security posture covering personal data?",
    "public_question_label": "Is there a written security policy or public security posture covering personal data?",
    "canonical_path": "qualified_review.india_privacy_cyber.security_policy",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.security_policy",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_security_policy_signal].value_summary",
      "data_provenance_profile.security_access_controls",
      "data_provenance_profile.privacy_accountability_documentation_signals"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: summarize security policy, trust center, SOC2/ISO, or mark none.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_security_policy_signal].value_summary",
      "data_provenance_profile.security_access_controls",
      "data_provenance_profile.privacy_accountability_documentation_signals"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_security_policy_signal].value_summary",
      "data_provenance_profile.security_access_controls",
      "data_provenance_profile.privacy_accountability_documentation_signals",
      "extended_dap_india_readiness_profile.india_security_policy_signal",
      "integrated_dap_report.security_access_incident_cert_in_readiness.security_policy"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-071",
    "question_number": 71,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "access_controls",
    "lawyer_question": "What access controls, role-based permissions, least privilege, or admin controls apply?",
    "public_question_label": "What access controls, role-based permissions, least privilege, or admin controls apply?",
    "canonical_path": "qualified_review.india_privacy_cyber.access_controls",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.access_controls",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_access_control_signal].value_summary",
      "data_provenance_profile.security_access_controls"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe RBAC, MFA, admin access, approval, logging.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_SOP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_access_control_signal].value_summary",
      "data_provenance_profile.security_access_controls"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_access_control_signal].value_summary",
      "data_provenance_profile.security_access_controls",
      "extended_dap_india_readiness_profile.india_access_control_signal"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-072",
    "question_number": 72,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "vendor_security_terms",
    "lawyer_question": "Do vendor, processor, or subprocessor terms include security obligations?",
    "public_question_label": "Do vendor, processor, or subprocessor terms include security obligations?",
    "canonical_path": "qualified_review.india_privacy_cyber.vendor_security_terms",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.vendor_security_terms",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_vendor_security_terms_signal].value_summary",
      "data_provenance_profile.processor_subprocessor_governance_controls"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: confirm vendor security addendum, DPA, audit rights, breach notice. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_vendor_security_terms_signal].value_summary",
      "data_provenance_profile.processor_subprocessor_governance_controls"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_vendor_security_terms_signal].value_summary",
      "data_provenance_profile.processor_subprocessor_governance_controls",
      "extended_dap_india_readiness_profile.india_vendor_security_terms_signal",
      "integrated_dap_report.contracts_vendors_subprocessors.vendor_security"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-073",
    "question_number": 73,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "incident_response",
    "lawyer_question": "What incident response process covers privacy, security, breach, or cyber events?",
    "public_question_label": "What incident response process covers privacy, security, breach, or cyber events?",
    "canonical_path": "qualified_review.india_privacy_cyber.incident_response",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.incident_response",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_incident_response_signal].value_summary",
      "data_provenance_profile.breach_incident_readiness"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe triage, containment, notice, escalation, owner, timelines.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_SOP",
      "DOC_DPA",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_incident_response_signal].value_summary",
      "data_provenance_profile.breach_incident_readiness"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_incident_response_signal].value_summary",
      "data_provenance_profile.breach_incident_readiness",
      "extended_dap_india_readiness_profile.india_incident_response_signal",
      "integrated_dap_report.security_access_incident_cert_in_readiness.incident_response"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-074",
    "question_number": 74,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "audit_trail",
    "lawyer_question": "What audit trails, access logs, or monitoring records are maintained?",
    "public_question_label": "What audit trails, access logs, or monitoring records are maintained?",
    "canonical_path": "qualified_review.india_privacy_cyber.audit_trail",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.audit_trail",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_audit_trail_signal].value_summary",
      "data_provenance_profile.security_access_controls",
      "data_provenance_profile.prompt_output_logging_telemetry_controls"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe admin logs, access logs, model logs, security monitoring. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_SOP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_audit_trail_signal].value_summary",
      "data_provenance_profile.security_access_controls",
      "data_provenance_profile.prompt_output_logging_telemetry_controls"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_audit_trail_signal].value_summary",
      "data_provenance_profile.security_access_controls",
      "data_provenance_profile.prompt_output_logging_telemetry_controls",
      "extended_dap_india_readiness_profile.india_audit_trail_signal"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-075",
    "question_number": 75,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "data_protection_procedure",
    "lawyer_question": "What documented privacy, security, or data protection procedure governs personal data handling?",
    "public_question_label": "What documented privacy, security, or data protection procedure governs personal data handling?",
    "canonical_path": "qualified_review.india_privacy_cyber.data_protection_procedure",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.data_protection_procedure",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_data_protection_procedure_signal].value_summary",
      "data_provenance_profile.privacy_accountability_documentation_signals"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe internal procedure, owner, review cadence, escalation path. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPA",
      "DOC_PP",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_data_protection_procedure_signal].value_summary",
      "data_provenance_profile.privacy_accountability_documentation_signals"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_data_protection_procedure_signal].value_summary",
      "data_provenance_profile.privacy_accountability_documentation_signals",
      "extended_dap_india_readiness_profile.india_data_protection_procedure_signal",
      "integrated_dap_report.governance_readiness_matrix"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-076",
    "question_number": 76,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "large_scale_indian_data",
    "lawyer_question": "Could the company process Indian personal data at a scale requiring heightened governance review?",
    "public_question_label": "Could the company process Indian personal data at a scale requiring heightened governance review?",
    "canonical_path": "qualified_review.india_privacy_cyber.large_scale_indian_data",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.large_scale_indian_data",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_large_scale_data_gap].value_summary",
      "target_feature_profile.activities[1].data_content_object_touched"
    ],
    "answer_type": "dropdown",
    "answer_options": [
      "Yes",
      "No",
      "Unclear"
    ],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Yes, No, Unclear. Confirm actual volume and user base. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPIA",
      "India readiness note"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_large_scale_data_gap].value_summary",
      "target_feature_profile.activities[1].data_content_object_touched"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_large_scale_data_gap].value_summary",
      "target_feature_profile.activities[1].data_content_object_touched",
      "extended_dap_india_readiness_profile.india_large_scale_data_gap",
      "extended_dap_india_readiness_profile.india_sdf_screen_signal"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-077",
    "question_number": 77,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "sensitive_high_risk_india_context",
    "lawyer_question": "Does Indian personal data involve sensitive, vulnerable, high-risk, financial, health, employment, biometric, child, or decision-impacting contexts?",
    "public_question_label": "Does Indian personal data involve sensitive, vulnerable, high-risk, financial, health, employment, biometric, child, or decision-impacting contexts?",
    "canonical_path": "qualified_review.india_privacy_cyber.sensitive_high_risk_india_context",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.sensitive_high_risk_india_context",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_sensitive_high_risk_context_signal].value_summary",
      "data_provenance_profile.sensitive_special_category_signals",
      "target_profile.business_context.regulated_sector_hints"
    ],
    "answer_type": "select",
    "answer_options": [
      "Health",
      "financial",
      "employment",
      "biometric",
      "child",
      "decision-impacting",
      "vulnerable users",
      "none"
    ],
    "source_table_default_status": "Prefill / confirm",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence field prefill — confirm",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_FULL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Options: Health, financial, employment, biometric, child, decision-impacting, vulnerable users, none.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPIA",
      "DOC_AUP",
      "DOC_DPA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Confirm or edit before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "FULL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_sensitive_high_risk_context_signal].value_summary",
      "data_provenance_profile.sensitive_special_category_signals",
      "target_profile.business_context.regulated_sector_hints"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_sensitive_high_risk_context_signal].value_summary",
      "data_provenance_profile.sensitive_special_category_signals",
      "target_profile.business_context.regulated_sector_hints",
      "extended_dap_india_readiness_profile.india_sensitive_high_risk_context_signal",
      "integrated_dap_report.governance_readiness_matrix.high_risk_context"
    ],
    "field_mapping_locked_class": "SAFE_PREFILL"
  },
  {
    "question_id": "QR-078",
    "question_number": 78,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "india_dpo_responsible_officer_route",
    "lawyer_question": "Who is responsible for India privacy escalation, DPO-style review, or grievance coordination?",
    "public_question_label": "Who is responsible for India privacy escalation, DPO-style review, or grievance coordination?",
    "canonical_path": "qualified_review.india_privacy_cyber.india_dpo_responsible_officer_route",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.india_dpo_responsible_officer_route",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpo_route_signal].value_summary",
      "data_provenance_profile.privacy_governance_contact_accountability_signals"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: identify privacy lead, DPO, grievance officer, legal/security owner, or mark none. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_PP",
      "DOC_DPA",
      "DOC_DPIA"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpo_route_signal].value_summary",
      "data_provenance_profile.privacy_governance_contact_accountability_signals"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpo_route_signal].value_summary",
      "data_provenance_profile.privacy_governance_contact_accountability_signals",
      "extended_dap_india_readiness_profile.india_dpo_route_signal",
      "extended_dap_india_readiness_profile.india_sdf_missing_proof"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  },
  {
    "question_id": "QR-079",
    "question_number": 79,
    "section_id": "india_privacy_cyber",
    "section_number": 5,
    "section_title": "India Privacy & Cyber Readiness",
    "field_key": "independent_audit_dpia_process",
    "lawyer_question": "Is there an independent audit, DPIA, risk assessment, or similar governance process for high-risk India data processing?",
    "public_question_label": "Is there an independent audit, DPIA, risk assessment, or similar governance process for high-risk India data processing?",
    "canonical_path": "qualified_review.india_privacy_cyber.independent_audit_dpia_process",
    "vault_payload_path": null,
    "qualified_review_path": "qualified_review.india_privacy_cyber.independent_audit_dpia_process",
    "path_type": "qualified_review_india_privacy_cyber",
    "writes_to_vault_payload": false,
    "writes_to_india_privacy_cyber": true,
    "backend_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpia_audit_signal].value_summary",
      "data_provenance_profile.privacy_accountability_documentation_signals"
    ],
    "answer_type": "long_answer",
    "answer_options": [],
    "source_table_default_status": "Review / complete",
    "backend_prefill_available": true,
    "prefill_source": "backend_artifact",
    "initial_answer_value": null,
    "initial_answer_value_strategy": "field_extraction_at_runtime",
    "ui_badge": "Diligence signal — review / complete",
    "evidence_status": "DILIGENCE_FIELD_MAPPED_PARTIAL",
    "demo_prefill_value": null,
    "demo_disclaimer_required": false,
    "demo_disclaimer_text": null,
    "helper_text": "Demo helper: describe DPIA, audit, assessment owner, cadence, or mark not yet implemented. Review and complete: diligence fields partially support this answer.",
    "demo_market_suggestion": null,
    "document_impact": [
      "DOC_DPIA",
      "DOC_SOP"
    ],
    "editable": true,
    "required_for_draft_preparation": true,
    "final_gate_required": true,
    "reviewer_action": "Review and complete before draft preparation",
    "vault_payload_group": null,
    "prefill_strength": "PARTIAL",
    "answer_prefill_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpia_audit_signal].value_summary",
      "data_provenance_profile.privacy_accountability_documentation_signals"
    ],
    "answer_extractor": "india_field_value_summary",
    "evidence_source_mapping": [
      "extended_dap_india_readiness_profile.fields[field_id=india_dpia_audit_signal].value_summary",
      "data_provenance_profile.privacy_accountability_documentation_signals",
      "extended_dap_india_readiness_profile.india_dpia_audit_signal",
      "integrated_dap_report.governance_readiness_matrix.dpia_audit"
    ],
    "field_mapping_locked_class": "REVIEW_NEEDED_FROM_ARTIFACT"
  }
]);

export const QUALIFIED_REVIEW_QUESTIONS = QUALIFIED_REVIEW_MAP;

export function getQualifiedReviewQuestionById(questionId) {
  return QUALIFIED_REVIEW_MAP.find((question) => question.question_id === questionId) || null;
}

export function getQualifiedReviewQuestionsBySection(sectionId) {
  return QUALIFIED_REVIEW_MAP.filter((question) => question.section_id === sectionId);
}

export function getQualifiedReviewQuestionByFieldKey(fieldKey) {
  return QUALIFIED_REVIEW_MAP.find((question) => question.field_key === fieldKey) || null;
}

export function assertQualifiedReviewMapIntegrity(map = QUALIFIED_REVIEW_MAP) {
  const errors = [];
  const questions = Array.isArray(map) ? map : [];
  const countBy = (selector) => questions.reduce((acc, question) => {
    const key = selector(question);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  if (questions.length !== QUALIFIED_REVIEW_LOCKED_COUNTS.question_count) errors.push(`question_count:${questions.length}`);

  const checkCounts = (label, actual, expected) => {
    for (const [key, value] of Object.entries(expected)) {
      if ((actual[key] || 0) !== value) errors.push(`${label}:${key}:${actual[key] || 0}:expected_${value}`);
    }
  };

  checkCounts("section_count", countBy((question) => question.section_id), QUALIFIED_REVIEW_LOCKED_COUNTS.section_counts);
  checkCounts("answer_type_count", countBy((question) => question.answer_type), QUALIFIED_REVIEW_LOCKED_COUNTS.answer_type_counts);
  checkCounts("status_count", countBy((question) => question.source_table_default_status), QUALIFIED_REVIEW_LOCKED_COUNTS.source_table_status_counts);
  checkCounts("prefill_strength_count", countBy((question) => question.prefill_strength), QUALIFIED_REVIEW_LOCKED_COUNTS.prefill_strength_counts);
  checkCounts("prefill_source_count", countBy((question) => question.prefill_source), QUALIFIED_REVIEW_LOCKED_COUNTS.prefill_source_counts);
  checkCounts("evidence_status_count", countBy((question) => question.evidence_status), QUALIFIED_REVIEW_LOCKED_COUNTS.evidence_status_counts);

  questions.forEach((question, index) => {
    const expectedId = `QR-${String(index + 1).padStart(3, "0")}`;
    if (question.question_id !== expectedId) errors.push(`sequence:${question.question_id}:expected_${expectedId}`);
    if (!["FULL", "PARTIAL", "NONE"].includes(question.prefill_strength)) errors.push(`${expectedId}:bad_prefill_strength`);
    if (!Array.isArray(question.answer_prefill_mapping)) errors.push(`${expectedId}:answer_prefill_mapping_not_array`);
    if (!Array.isArray(question.evidence_source_mapping)) errors.push(`${expectedId}:evidence_source_mapping_not_array`);
    if (question.prefill_strength === "NONE" && question.answer_prefill_mapping.length !== 0) errors.push(`${expectedId}:none_must_not_have_answer_mapping`);
    if (question.prefill_strength !== "NONE" && question.answer_prefill_mapping.length === 0) errors.push(`${expectedId}:field_mapped_row_missing_answer_mapping`);
    if (question.editable !== true) errors.push(`${expectedId}:editable_must_be_true`);
    if (question.required_for_draft_preparation !== true) errors.push(`${expectedId}:required_for_draft_preparation_must_be_true`);
    if (!Array.isArray(question.document_impact) || question.document_impact.length === 0) errors.push(`${expectedId}:document_impact_missing`);
    if (question.section_id === "india_privacy_cyber" && question.writes_to_vault_payload !== false) errors.push(`${expectedId}:india_row_must_not_write_to_vault_payload`);
    if (question.prefill_source === "reviewer_input" && question.prefill_strength !== "NONE") errors.push(`${expectedId}:reviewer_input_only_for_none`);
    if (question.prefill_source === "backend_artifact" && question.prefill_strength === "NONE") errors.push(`${expectedId}:backend_artifact_cannot_be_none`);
    if (/^Review source artifacts:/i.test(String(question.initial_answer_value || ""))) errors.push(`${expectedId}:source_placeholder_initial_answer`);
    if (/^Review source artifacts:/i.test(String(question.demo_prefill_value || ""))) errors.push(`${expectedId}:source_placeholder_demo_answer`);
  });

  return {
    status: errors.length ? "FAIL" : "PASS",
    errors
  };
}

const integrity = assertQualifiedReviewMapIntegrity();
if (integrity.status !== "PASS") {
  throw new Error(`QUALIFIED_REVIEW_MAP_INTEGRITY_FAIL:${integrity.errors.join("|")}`);
}

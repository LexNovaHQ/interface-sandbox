import { STAGE6B_LEGAL_DATA_FINDING_RULES, STAGE6B_RUNTIME_VERSION } from './6b.dictionary.js';

export const STAGE6B_PROMPT_VERSION = 'stage6b_legal_governance_data_provenance_prompt_v2';

export function buildStage6BPrompt({ stage6bInput = {}, legalUnitPackets = [], dictionary = STAGE6B_LEGAL_DATA_FINDING_RULES } = {}) {
  return `You are Stage 6B in the LexNova diligence runtime.

ROLE
Extract legal/governance-derived data provenance findings from legal/governance source evidence.

PRIMARY SOURCE
Your only primary evidence is the legal/governance lossless source family, represented to you through legal-unit-specific verbatim windows. Each window is an exact substring of clean_text_lossless and includes source_id, offsets, source_sha256, and verbatim_text.

SECONDARY REFERENCES ONLY
You may use target_profile, target_feature_profile, and legal_cartography only as reference/context. You must not use Stage 5 feature/data rows as the row spine. You must not wait for Stage 5 data rows. You must not classify only Stage 5 rows.

FORBIDDEN
- no_new_data_flow_rows: true is forbidden.
- Do not seed rows from Stage 5 data_provenance.
- Do not use metadata, source URL, title, or index as evidence.
- Do not create final integrated data_provenance_profile.
- Do not compare product-observed behavior to legal declarations; Stage 6C does that.
- Do not drop a legal/governance finding merely because it was not present in target_feature_profile.

JOB
For the supplied legal-unit windows, extract what the legal/governance documents say about:
- data collected
- data processed
- AI/model provider treatment
- prompts / inputs / outputs
- embeddings / RAG / vector storage if disclosed
- training / fine-tuning / model improvement
- retention / deletion / erasure
- subprocessors / vendors / processors / service providers
- international transfers / SCCs / cross-border processing
- security / breach / incident handling
- controller / processor role
- automated decisioning / profiling
- sensitive data / minors / children
- rights / notice / consent

OUTPUT JSON ONLY
Return this shape:
{
  "stage6b_output_version": "${STAGE6B_RUNTIME_VERSION}",
  "legal_governance_data_provenance_profile": {
    "profile_version": "legal_governance_data_provenance_profile_v1",
    "legal_data_findings": [
      {
        "legal_data_finding_id": "LGDP_001",
        "finding_type": "DATA_COLLECTION_DISCLOSURE",
        "data_category": "personal_data",
        "data_subject": "data_subject",
        "declared_action": "what the legal/governance source says",
        "processing_context": "service_delivery",
        "ai_or_model_treatment": "NOT_EVIDENCED or evidenced statement",
        "retention_or_deletion_signal": "NOT_EVIDENCED or evidenced statement",
        "subprocessor_or_transfer_signal": "NOT_EVIDENCED or evidenced statement",
        "controller_processor_role": "NOT_EVIDENCED or evidenced statement",
        "source_basis": "LEGAL_GOVERNANCE_SOURCE",
        "legal_unit_refs": ["LUNIT_0001"],
        "source_window_refs": ["SRC_LG_001#6A#LUNIT_0001"],
        "explicitness": "EXPLICIT",
        "confidence": "HIGH"
      }
    ]
  },
  "limitations": []
}

CONTROLLED FINDING RULES
${JSON.stringify(dictionary, null, 2)}

LEGAL UNIT PACKETS
${JSON.stringify(legalUnitPackets, null, 2)}

REFERENCE CONTEXT ONLY
${JSON.stringify({
  target_profile: stage6bInput.reference?.target_profile || {},
  target_feature_profile_reference: stage6bInput.reference?.target_feature_profile ? { present: true } : { present: false },
  legal_cartography_summary: {
    legal_document_count: stage6bInput.reference?.legal_cartography?.legal_document_inventory?.length || 0,
    legal_unit_count: stage6bInput.reference?.legal_cartography?.legal_unit_map?.length || 0
  }
}, null, 2)}
`;
}

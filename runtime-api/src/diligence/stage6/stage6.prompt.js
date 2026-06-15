import {
  STAGE6_CONTROL_FAMILY,
  STAGE6B_FINDING_TYPE,
  STAGE6C_ALIGNMENT_STATUS,
  STAGE6_FIELD_DERIVATION_RULES
} from './stage6.dictionary.js';

export const STAGE6_PROMPT_VERSION = 'stage6_canonical_prompt_spine_v1';

export function buildStage6DoctrineBlock() {
  return [
    'STAGE 6 CANONICAL DOCTRINE',
    '',
    'Primary evidence for Stage 6A and Stage 6B is the legal/governance full lossless source family.',
    'Primary evidence is represented by clean_text_lossless and exact verbatim source windows derived from it.',
    'Metadata, indexes, target_profile, target_feature_profile, URLs, titles, and refs are reference or navigation only.',
    'Never treat Stage 5 product/data rows as the canonical row spine for Stage 6B.',
    'Never use no_new_data_flow_rows in Stage 6B.',
    'Never drop legal/governance data findings because they were not present in Stage 5.',
    'Stage 6A maps the legal source.',
    'Stage 6B extracts the legal/governance data story.',
    'Stage 6C reconciles the legal story with product-observed behavior.',
    'Stage 7 must receive legal/governance source plus legal_cartography as primary evidence.'
  ].join('\n');
}

export function buildStage6EvidenceInstructionBlock() {
  return [
    'EVIDENCE RULES',
    '',
    'Use only source windows whose verbatim_text is an exact substring of clean_text_lossless.',
    'Every substantive finding must cite source_window_refs.',
    'If evidence is absent, use NOT_EVIDENCED or UNKNOWN according to the field contract.',
    'Do not infer data processing, AI treatment, transfer, retention, or security obligations from product labels alone.',
    'Do not cite metadata, URLs, titles, indexes, or upstream profile rows as evidence.',
    'If the provided windows are insufficient, request reinvestigation/expanded windows rather than fabricating findings.'
  ].join('\n');
}

export function buildStage6ACommonPrompt({ legalUnits = [], reference = {} } = {}) {
  return {
    prompt_version: `${STAGE6_PROMPT_VERSION}:6A`,
    stage: '6A',
    task: 'legal_cartography',
    doctrine: buildStage6DoctrineBlock(),
    evidence_rules: buildStage6EvidenceInstructionBlock(),
    allowed_control_families: Object.values(STAGE6_CONTROL_FAMILY),
    derivation_rules: STAGE6_FIELD_DERIVATION_RULES.stage6a,
    legal_units,
    reference_only: reference,
    output_contract: {
      stage6a_output_version: 'stage6a_legal_cartography_v2',
      legal_document_inventory: 'array',
      legal_unit_map: 'array',
      legal_control_map: 'array',
      legal_source_window_ledger: 'array',
      validation: 'object',
      forensic_log: 'object'
    },
    required_behavior: [
      'Classify legal units from the provided verbatim windows.',
      'Return UNKNOWN for fields that are not evidenced.',
      'Mark low-confidence boundaries/classifications for reinvestigation.',
      'Do not compact or rewrite source text.',
      'Do not create source windows; runtime creates windows.'
    ]
  };
}

export function buildStage6BCommonPrompt({ legalUnits = [], legalCartography = {}, targetProfile = {}, targetFeatureProfile = {} } = {}) {
  return {
    prompt_version: `${STAGE6_PROMPT_VERSION}:6B`,
    stage: '6B',
    task: 'legal_governance_data_provenance_extraction',
    doctrine: buildStage6DoctrineBlock(),
    evidence_rules: buildStage6EvidenceInstructionBlock(),
    allowed_finding_types: Object.values(STAGE6B_FINDING_TYPE),
    derivation_rules: STAGE6_FIELD_DERIVATION_RULES.stage6b,
    legal_units: legalUnits,
    reference_only: {
      target_profile: targetProfile,
      target_feature_profile: targetFeatureProfile,
      legal_cartography: legalCartography
    },
    forbidden_behavior: [
      'Do not use Stage 5 data_provenance rows as the canonical row spine.',
      'Do not use no_new_data_flow_rows.',
      'Do not drop a legal/governance data finding because Stage 5 did not seed it.',
      'Do not integrate product-observed behavior with legal declarations; Stage 6C does that.',
      'Do not emit final integrated data_provenance_profile.'
    ],
    output_contract: {
      stage6b_output_version: 'stage6b_legal_governance_data_provenance_v2',
      legal_governance_data_provenance_profile: {
        legal_data_findings: 'array'
      },
      source_window_ledger: 'array',
      validation: 'object',
      forensic_log: 'object'
    },
    required_behavior: [
      'Extract legal/governance-derived data provenance findings whenever legal source text supports them.',
      'Every finding must cite legal_unit_refs and source_window_refs.',
      'Use NOT_EVIDENCED when a data dimension is not present in legal/governance source.',
      'Request reinvestigation if relevant legal units appear under-read.'
    ]
  };
}

export function buildStage6CCommonPrompt({ productObservedProfile = {}, legalGovernanceProfile = {}, sourceCustody = {} } = {}) {
  return {
    prompt_version: `${STAGE6_PROMPT_VERSION}:6C`,
    stage: '6C',
    task: 'data_provenance_integration',
    doctrine: buildStage6DoctrineBlock(),
    evidence_rules: buildStage6EvidenceInstructionBlock(),
    allowed_alignment_statuses: Object.values(STAGE6C_ALIGNMENT_STATUS),
    derivation_rules: STAGE6_FIELD_DERIVATION_RULES.stage6c,
    product_observed_profile: productObservedProfile,
    legal_governance_profile: legalGovernanceProfile,
    source_custody: sourceCustody,
    forbidden_behavior: [
      'Do not create new legal findings.',
      'Do not create new product feature facts.',
      'Do not overwrite Stage 6B legal findings.',
      'Do not overwrite Stage 5 product-observed facts.',
      'Do not cite metadata or index refs as evidence.'
    ],
    output_contract: {
      stage6c_output_version: 'stage6c_integrated_data_provenance_profile_v1',
      data_provenance_profile: {
        integrated_data_flows: 'array',
        unmatched_product_observed_flows: 'array',
        unmatched_legal_governance_controls: 'array',
        conflicts: 'array',
        limitations: 'array'
      },
      validation: 'object',
      forensic_log: 'object'
    },
    required_behavior: [
      'Create integration/alignment rows only.',
      'Use controlled alignment statuses.',
      'If alignment is weak, request reinvestigation for the affected pair.',
      'Do not invent missing source facts.'
    ]
  };
}

export function buildStage6ReinvestigationPrompt({ stage, reason, affected_refs = [], requested_actions = [], context = {} } = {}) {
  return {
    prompt_version: `${STAGE6_PROMPT_VERSION}:reinvestigation`,
    stage,
    task: 'stage6_reinvestigation',
    doctrine: buildStage6DoctrineBlock(),
    evidence_rules: buildStage6EvidenceInstructionBlock(),
    reason,
    affected_refs,
    requested_actions,
    context,
    required_behavior: [
      'Reinvestigate only the affected units/rows/pairs.',
      'Use expanded or split verbatim windows supplied by runtime.',
      'Do not create findings without source_window_refs.',
      'Return unresolved only after evidence has been checked.'
    ]
  };
}

import { buildStage6DoctrineBlock, buildStage6EvidenceInstructionBlock } from '../stage6.prompt.js';
import {
  STAGE6A_DOCUMENT_TYPE_KEYWORDS,
  STAGE6A_FIELD_DERIVATION,
  STAGE6A_LEGAL_UNIT_CLASSIFIERS,
  STAGE6A_RUNTIME_VERSION
} from './6a.dictionary.js';

export const STAGE6A_PROMPT_VERSION = 'stage6a_legal_cartography_prompt_v2';

export function buildStage6ALegalCartographyPrompt({ legalUnitWindows = [], legalDocumentInventory = [], reference = {} } = {}) {
  return {
    prompt_version: STAGE6A_PROMPT_VERSION,
    stage: '6A',
    task: 'legal_cartography',
    doctrine: buildStage6DoctrineBlock(),
    evidence_rules: buildStage6EvidenceInstructionBlock(),
    stage_output_version: STAGE6A_RUNTIME_VERSION,
    legal_document_inventory: legalDocumentInventory,
    legal_unit_windows: legalUnitWindows,
    reference_only: reference,
    dictionary: {
      document_type_keywords: STAGE6A_DOCUMENT_TYPE_KEYWORDS,
      legal_unit_classifiers: STAGE6A_LEGAL_UNIT_CLASSIFIERS,
      field_derivation: STAGE6A_FIELD_DERIVATION
    },
    instructions: [
      'Map each legal-unit-specific verbatim window into legal cartography fields.',
      'Do not rewrite, summarize, compact, or normalize any source text.',
      'Do not create new source windows. Runtime owns source windows.',
      'Do not use metadata as evidence.',
      'Use UNKNOWN when a field is not evidenced.',
      'Mark legal units for reinvestigation if boundary or classification is weak.',
      'Every legal_control_map row must cite a legal_unit_id and source_window_ref.'
    ],
    output_contract: {
      stage6a_output_version: STAGE6A_RUNTIME_VERSION,
      legal_cartography: {
        legal_document_inventory: 'array',
        legal_unit_map: 'array',
        legal_control_map: 'array',
        legal_source_window_ledger: 'array'
      },
      validation: 'object',
      forensic_log: 'object'
    }
  };
}

export function buildStage6AReinvestigationPrompt({ affectedLegalUnits = [], reason = '', requestedActions = [], reference = {} } = {}) {
  return {
    prompt_version: `${STAGE6A_PROMPT_VERSION}:reinvestigation`,
    stage: '6A',
    task: 'legal_cartography_reinvestigation',
    doctrine: buildStage6DoctrineBlock(),
    evidence_rules: buildStage6EvidenceInstructionBlock(),
    reason,
    requested_actions: requestedActions,
    affected_legal_units: affectedLegalUnits,
    reference_only: reference,
    instructions: [
      'Re-evaluate only affected legal units.',
      'Use only supplied verbatim source windows.',
      'If the window is too broad, request split; do not summarize.',
      'If the window is too narrow, request expansion; do not infer missing text.',
      'Return UNKNOWN rather than inventing legal meaning.'
    ]
  };
}

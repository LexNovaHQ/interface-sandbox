#!/usr/bin/env node
import { computeSourceSha256 } from '../src/diligence/stage6/stage6.runtime.js';
import { runStage6ALegalCartography } from '../src/diligence/stage6/6a/6a.runtime.js';
import { STAGE6A_STRUCTURAL_MARKER_TYPE } from '../src/diligence/stage6/6a/6a.dictionary.js';

const phase = 'stage6a_structural_coverage_e2e';

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, phase, error: message, details }, null, 2));
  process.exit(1);
}

const cleanTextLossless = `PRIVACY POLICY

1. Information We Collect
We collect personal data, user inputs, prompts, audio, voice, documents, files, metadata, and logs to provide the service.

2. How We Use Information
We process personal data and customer content to provide, secure, maintain, and improve the services.

SCHEDULE 1: Processing Details
Categories of data include user content, prompts, outputs, audio files, documents, account data, and usage logs.
Purpose of processing is service delivery, support, security, and account administration.

ANNEX A: Subprocessors
| Subprocessor | Purpose | Location |
| Model Provider | AI model processing | United States |
| Cloud Provider | Hosting and storage | Global |

APPENDIX 1: Technical and Organizational Measures
Encryption, access controls, audit logging, vulnerability management, and incident response are maintained.

EXHIBIT B: Transfer Details
International transfers may occur subject to standard contractual clauses and other safeguards.

RETENTION SCHEDULE
We retain data for as long as necessary and delete or anonymize it when no longer required.
`;

const canonicalInput = {
  stage6_input_version: 'stage6_legal_governance_input_v1',
  target_ref: { target_id: 'fixture_company' },
  primary_evidence: {
    family_id: 'legal_governance',
    family_label: 'Legal / Governance Source Family',
    sources: [
      {
        source_id: 'SRC_LG_001',
        source_url: 'https://example.com/privacy',
        source_title: 'Privacy Policy',
        source_family: 'legal_governance',
        clean_text_lossless: cleanTextLossless,
        source_sha256: computeSourceSha256(cleanTextLossless),
        lossless_policy: {
          full_text_lossless: true,
          summarized: false,
          compressed: false,
          truncated: false,
          normalized: false
        }
      }
    ]
  },
  reference: {
    target_profile: {},
    target_feature_profile: {},
    metadata_sidecar: [],
    navigation_sidecar: []
  }
};

const result = await runStage6ALegalCartography({
  canonicalInput,
  maxLegalUnitChars: 12000,
  maxReinvestigationAttempts: 0
});

const cartography = result.legal_cartography || {};
const units = cartography.legal_unit_map || [];
const windows = cartography.legal_source_window_ledger || [];
const coverage = cartography.structural_coverage_inventory || [];
const markerTypes = new Set(units.map((unit) => unit.legal_unit_marker_type));

for (const required of [
  STAGE6A_STRUCTURAL_MARKER_TYPE.SCHEDULE,
  STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEX,
  STAGE6A_STRUCTURAL_MARKER_TYPE.APPENDIX,
  STAGE6A_STRUCTURAL_MARKER_TYPE.EXHIBIT,
  STAGE6A_STRUCTURAL_MARKER_TYPE.RETENTION_SCHEDULE
]) {
  if (!markerTypes.has(required)) fail(`Missing required structural marker ${required}`, { markerTypes: [...markerTypes], units });
}

if (!units.some((unit) => unit.is_schedule_or_annexure)) fail('No schedule/annexure/appendix/exhibit unit marked is_schedule_or_annexure', { units });
if (!units.some((unit) => unit.is_table_or_list_unit)) fail('No table/list unit detected from subprocessor table', { units });
if (!cartography.table_list_inventory?.length) fail('table_list_inventory is empty', { table_list_inventory: cartography.table_list_inventory });

for (const window of windows) {
  const expected = cleanTextLossless.slice(window.char_start, window.char_end);
  if (expected !== window.verbatim_text) fail('Window is not exact clean_text_lossless substring', { window });
  if (window.source_sha256 !== computeSourceSha256(cleanTextLossless)) fail('Window source_sha256 mismatch', { window });
}

const missingCoverage = coverage.filter((row) => row.status === 'PRESENT_BUT_MISSING_UNIT');
if (missingCoverage.length) fail('Structural coverage inventory has missing units', { missingCoverage, coverage });

console.log(JSON.stringify({
  ok: true,
  phase,
  unit_count: units.length,
  window_count: windows.length,
  marker_types: [...markerTypes],
  table_list_count: cartography.table_list_inventory.length,
  validation_status: result.validation?.status,
  reinvestigation_requested: result.validation?.reinvestigation_requested === true
}, null, 2));

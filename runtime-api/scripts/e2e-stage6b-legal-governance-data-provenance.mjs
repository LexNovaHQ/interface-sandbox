import assert from 'node:assert/strict';

import { buildStage6CanonicalInput } from '../src/diligence/stage6/stage6.runtime.js';
import { runStage6ALegalCartography } from '../src/diligence/stage6/6a/6a.runtime.js';
import { runStage6BLegalGovernanceDataProvenance } from '../src/diligence/stage6/6b/6b.runtime.js';

const legalText = `Privacy Policy

1. Information We Collect
We collect personal information, user input, prompts, audio, documents, files, usage logs, device metadata, and customer content when you use the Services.

2. How We Use Information
We process personal data and customer data to provide, operate, maintain, secure, and improve the Services. We use user-provided content and prompts to return outputs requested by users.

3. AI Model and Output Treatment
Our Services may use artificial intelligence, machine learning models, model providers, prompts, inputs, outputs, embeddings, vector retrieval, and retrieval augmented generation to provide product functionality. We do not use customer content to train or fine-tune foundation models unless expressly agreed with the customer.

4. Retention and Deletion
We retain personal data only as long as necessary to provide the Services and comply with legal obligations. Customers may request deletion or erasure of personal data subject to applicable law.

5. Subprocessors and Service Providers
We use subprocessors, vendors, processors, service providers, and third-party service providers to host, secure, support, and process customer data on our behalf.

6. International Transfers
Personal data may be transferred internationally, including outside your country. Where required, we rely on Standard Contractual Clauses and other transfer safeguards.

7. Security and Breach
We maintain technical and organisational measures, encryption, access controls, confidentiality controls, incident response, and breach notification processes to protect personal data against unauthorized access.

8. Controller and Processor Roles
For customer content processed on behalf of a customer, we act as a processor. For account and website visitor information, we may act as a controller.

9. Automated Decisioning and Sensitive Data
We do not use solely automated decision-making that produces legal effects. The Services are not directed to children or minors and users must not submit sensitive personal data unless permitted by contract.

10. Rights, Notice, and Consent
Data subjects may access, correct, delete, object, opt out, or withdraw consent where applicable.

ANNEX A - Subprocessor Table
Subprocessor | Purpose | Data
Cloud Host | Hosting | customer data and logs
AI Provider | Model service | prompts, inputs, and outputs

SCHEDULE 1 - Processing Details
Processing includes service delivery, product functionality, security monitoring, support, analytics, and legal compliance.

APPENDIX 1 - Technical and Organisational Measures
Measures include encryption, access controls, audit logs, role-based permissions, and incident management.
`;

const canonicalInput = buildStage6CanonicalInput({
  targetRef: { domain: 'example.ai' },
  targetProfile: { company_name: 'Example AI' },
  targetFeatureProfile: {
    feature_inventory: [],
    data_provenance_map: []
  },
  sourceBundle: {
    raw_footprint: {
      source_records: [
      {
        evidence_source_id: 'SRC_LG_001',
        url: 'https://example.ai/privacy',
        title: 'Privacy Policy',
        source_family: 'legal_governance',
        text: {
          clean_text_lossless: legalText
        }
      }
    ]
    }
  }
});

const stage6a = await runStage6ALegalCartography({
  canonicalInput,
  maxLegalUnitChars: 3000,
  maxReinvestigationAttempts: 0
});

assert.ok(stage6a.legal_cartography.legal_unit_map.length > 0, '6A must create legal units before 6B');
assert.ok(stage6a.legal_cartography.legal_source_window_ledger.length > 0, '6A must create legal windows before 6B');

const stage6b = await runStage6BLegalGovernanceDataProvenance({
  canonicalInput,
  stage6aOutput: stage6a,
  maxReinvestigationAttempts: 0
});

assert.equal(stage6b.forensic_log.stage5_used_as_row_spine, false, '6B must not use Stage 5 as row spine');
assert.equal(stage6b.forensic_log.no_new_data_flow_rows, false, '6B must allow new legal/governance findings');
assert.equal(stage6b.forensic_log.legal_governance_source_derived_rows, true, '6B rows must be legal/governance source-derived');

const findings = stage6b.legal_governance_data_provenance_profile.legal_data_findings;
assert.ok(findings.length >= 8, `expected at least 8 legal/governance data findings, got ${findings.length}`);

const findingTypes = new Set(findings.map((finding) => finding.finding_type));
for (const expectedType of [
  'DATA_COLLECTION_DISCLOSURE',
  'DATA_PROCESSING_DISCLOSURE',
  'AI_MODEL_PROVIDER_TREATMENT',
  'PROMPT_INPUT_OUTPUT_TREATMENT',
  'TRAINING_FINE_TUNING_DISCLOSURE',
  'RETENTION_DELETION_DISCLOSURE',
  'SUBPROCESSOR_DISCLOSURE',
  'INTERNATIONAL_TRANSFER_DISCLOSURE',
  'SECURITY_BREACH_DISCLOSURE',
  'CONTROLLER_PROCESSOR_ROLE_DISCLOSURE',
  'AUTOMATED_DECISIONING_DISCLOSURE',
  'SENSITIVE_MINOR_DATA_DISCLOSURE',
  'RIGHTS_NOTICE_CONSENT_DISCLOSURE'
]) {
  assert.ok(findingTypes.has(expectedType), `missing expected 6B finding type ${expectedType}`);
}

for (const finding of findings) {
  assert.equal(finding.source_basis, 'LEGAL_GOVERNANCE_SOURCE', `finding ${finding.legal_data_finding_id} must use legal/governance source basis`);
  assert.ok(finding.legal_unit_refs.length > 0, `finding ${finding.legal_data_finding_id} must cite legal units`);
  assert.ok(finding.source_window_refs.length > 0, `finding ${finding.legal_data_finding_id} must cite source windows`);
  assert.equal(finding.row_creation_basis, 'LEGAL_GOVERNANCE_SOURCE_DERIVED_FINDING', `finding ${finding.legal_data_finding_id} must not be Stage 5 seeded`);
}

for (const coverage of stage6b.legal_governance_data_provenance_profile.coverage_summary) {
  assert.notEqual(coverage.status, 'PRESENT_BUT_NO_FINDING', `coverage trigger ${coverage.trigger} was not extracted`);
}

console.log(JSON.stringify({
  ok: true,
  stage: 'stage6b_legal_governance_data_provenance_e2e',
  legal_unit_count: stage6a.legal_cartography.legal_unit_map.length,
  legal_window_count: stage6a.legal_cartography.legal_source_window_ledger.length,
  legal_data_finding_count: findings.length,
  finding_types: [...findingTypes]
}, null, 2));

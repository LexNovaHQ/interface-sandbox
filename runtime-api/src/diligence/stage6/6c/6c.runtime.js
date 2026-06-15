import {
  asArray,
  asObject,
  asText,
  createReinvestigationRequest,
  runBoundedReinvestigationLoop
} from '../stage6.runtime.js';
import {
  STAGE6_CONTRACT_ERROR_CODE,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';
import { validate6bTo6cHandoff } from '../validators/validate6bTo6cHandoff.js';
import {
  STAGE6C_ALIGNMENT_STATUS,
  STAGE6C_ALLOWED_ALIGNMENT_STATUSES,
  STAGE6C_PROFILE_VERSION,
  STAGE6C_RUNTIME_VERSION,
  overlapScore
} from './6c.dictionary.js';

function nonEmpty(value) {
  if (Array.isArray(value)) return value.length ? value : null;
  if (value && typeof value === 'object') return Object.keys(value).length ? value : null;
  return value || null;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const found = nonEmpty(value);
    if (found) return found;
  }
  return null;
}

function collectRefs(row = {}) {
  const refs = [];
  const add = (value) => {
    for (const item of asArray(value)) if (item && !refs.includes(item)) refs.push(item);
  };
  add(row.source_window_refs);
  add(row.evidence_window_refs);
  add(row.product_source_window_refs);
  add(row.source_window_ref ? [row.source_window_ref] : []);
  add(row.evidence_refs);
  add(row.field_evidence_refs);
  return refs;
}

function stableId(prefix, index) {
  return `${prefix}_${String(index + 1).padStart(4, '0')}`;
}

function textForProductRow(row = {}) {
  return [
    row.feature_name,
    row.function_name,
    row.core_product_name,
    row.feature_role,
    row.commercial_function,
    row.actor_or_user,
    asArray(row.input_data).join(' '),
    row.system_action,
    row.output_or_result,
    asArray(row.delivery_channels).join(' '),
    asArray(row.data_categories).join(' '),
    row.data_category,
    row.processing_context
  ].filter(Boolean).join(' ');
}

function textForLegalFinding(row = {}) {
  return [
    row.finding_type,
    row.data_category,
    row.data_subject,
    row.declared_action,
    row.processing_context,
    row.ai_or_model_treatment,
    row.retention_or_deletion_signal,
    row.subprocessor_or_transfer_signal,
    row.controller_processor_role,
    asArray(row.matched_terms).join(' ')
  ].filter(Boolean).join(' ');
}

function extractFeatureRecords(productObservedProfile = {}) {
  return firstNonEmpty(
    productObservedProfile.complete_feature_records,
    productObservedProfile.target_feature_profile?.complete_feature_records,
    productObservedProfile.target_feature_profile?.feature_inventory,
    productObservedProfile.target_feature_profile?.features,
    productObservedProfile.feature_inventory,
    productObservedProfile.features
  ) || [];
}

function extractTouchpoints(productObservedProfile = {}) {
  return firstNonEmpty(
    productObservedProfile.product_data_touchpoints,
    productObservedProfile.target_feature_profile?.product_data_touchpoints,
    productObservedProfile.target_feature_profile?.data_touchpoints,
    productObservedProfile.target_feature_profile?.data_provenance_map,
    productObservedProfile.target_feature_profile?.data_provenance,
    productObservedProfile.data_touchpoints,
    productObservedProfile.data_provenance_map,
    productObservedProfile.data_provenance
  ) || [];
}

export function collectProductObservedFlows(stage6cInput = {}) {
  const productObservedProfile = asObject(stage6cInput.product_observed_profile);
  const featureRecords = asArray(extractFeatureRecords(productObservedProfile));
  const touchpoints = asArray(extractTouchpoints(productObservedProfile));
  const flows = [];

  for (const feature of featureRecords) {
    const featureRef = asText(feature.feature_id || feature.function_id || feature.id || stableId('FEATURE', flows.length));
    const featureTouchpoints = asArray(feature.data_touchpoints || feature.data_provenance || feature.input_data);
    if (featureTouchpoints.length) {
      featureTouchpoints.forEach((touchpoint, index) => {
        const touchpointObj = typeof touchpoint === 'object' ? touchpoint : { data_category: String(touchpoint) };
        flows.push({
          product_flow_id: touchpointObj.touchpoint_id || `${featureRef}#PTOUCH_${String(index + 1).padStart(3, '0')}`,
          product_observed_ref: featureRef,
          feature_id: featureRef,
          core_product_name: feature.core_product_name || feature.product_name || '',
          data_category: touchpointObj.data_category || touchpointObj.category || 'UNKNOWN',
          data_subject: touchpointObj.data_subject || touchpointObj.subject || 'UNKNOWN',
          product_observed_action: touchpointObj.processing_context || touchpointObj.system_action || feature.system_action || feature.output_or_result || 'product source describes data-touchpoint behavior',
          source_window_refs: [...new Set([...collectRefs(feature), ...collectRefs(touchpointObj)])],
          source_basis: 'STAGE5_PRODUCT_OBSERVED_PROFILE',
          text_basis: `${textForProductRow(feature)} ${textForProductRow(touchpointObj)}`.trim()
        });
      });
      continue;
    }
    const textBasis = textForProductRow(feature);
    if (!textBasis) continue;
    flows.push({
      product_flow_id: featureRef,
      product_observed_ref: featureRef,
      feature_id: featureRef,
      core_product_name: feature.core_product_name || feature.product_name || '',
      data_category: asArray(feature.input_data).join(', ') || feature.data_category || 'UNKNOWN',
      data_subject: feature.actor_or_user || 'UNKNOWN',
      product_observed_action: feature.system_action || feature.output_or_result || feature.feature_role || 'product source describes feature behavior',
      source_window_refs: collectRefs(feature),
      source_basis: 'STAGE5_PRODUCT_OBSERVED_PROFILE',
      text_basis: textBasis
    });
  }

  for (const touchpoint of touchpoints) {
    const row = typeof touchpoint === 'object' ? touchpoint : { data_category: String(touchpoint) };
    const ref = asText(row.touchpoint_id || row.feature_id || row.function_id || stableId('PTOUCH', flows.length));
    if (flows.some((flow) => flow.product_flow_id === ref)) continue;
    flows.push({
      product_flow_id: ref,
      product_observed_ref: row.feature_id || row.function_id || ref,
      feature_id: row.feature_id || row.function_id || '',
      core_product_name: row.core_product_name || row.product_name || '',
      data_category: row.data_category || row.category || 'UNKNOWN',
      data_subject: row.data_subject || row.subject || 'UNKNOWN',
      product_observed_action: row.processing_context || row.system_action || row.action || 'product source describes data-touchpoint behavior',
      source_window_refs: collectRefs(row),
      source_basis: 'STAGE5_PRODUCT_OBSERVED_PROFILE',
      text_basis: textForProductRow(row)
    });
  }

  return flows;
}

export function collectLegalGovernanceFindings(stage6cInput = {}) {
  const profile = asObject(stage6cInput.legal_governance_profile?.legal_governance_data_provenance_profile);
  return asArray(profile.legal_data_findings).map((finding, index) => ({
    legal_flow_id: finding.legal_data_finding_id || stableId('LGDP', index),
    legal_governance_ref: finding.legal_data_finding_id || stableId('LGDP', index),
    finding_type: finding.finding_type || 'UNKNOWN',
    data_category: finding.data_category || 'UNKNOWN',
    data_subject: finding.data_subject || 'UNKNOWN',
    legal_declared_action: finding.declared_action || 'legal/governance source describes data handling',
    processing_context: finding.processing_context || 'UNKNOWN',
    ai_or_model_treatment: finding.ai_or_model_treatment || 'NOT_EVIDENCED',
    retention_or_deletion_signal: finding.retention_or_deletion_signal || 'NOT_EVIDENCED',
    subprocessor_or_transfer_signal: finding.subprocessor_or_transfer_signal || 'NOT_EVIDENCED',
    legal_unit_refs: asArray(finding.legal_unit_refs),
    source_window_refs: asArray(finding.source_window_refs),
    source_basis: finding.source_basis,
    text_basis: textForLegalFinding(finding),
    raw: finding
  }));
}

function pairScore(productFlow = {}, legalFinding = {}) {
  let score = 0;
  const reasons = [];
  if (productFlow.data_category && legalFinding.data_category && productFlow.data_category !== 'UNKNOWN' && productFlow.data_category === legalFinding.data_category) {
    score += 4;
    reasons.push('matching_data_category');
  }
  const overlap = overlapScore(productFlow.text_basis, legalFinding.text_basis);
  if (overlap >= 3) {
    score += 3;
    reasons.push('shared_material_terms');
  } else if (overlap > 0) {
    score += 1;
    reasons.push('weak_text_overlap');
  }
  if (/ai|model|prompt|output|embedding|rag|training/i.test(productFlow.text_basis) && /AI_MODEL|PROMPT|EMBEDDING|TRAINING|model|prompt|output/i.test(`${legalFinding.finding_type} ${legalFinding.text_basis}`)) {
    score += 3;
    reasons.push('ai_model_context_alignment');
  }
  if (productFlow.product_observed_action && legalFinding.processing_context && overlapScore(productFlow.product_observed_action, legalFinding.processing_context) > 0) {
    score += 2;
    reasons.push('processing_context_overlap');
  }
  return { score, reasons };
}

function chooseAlignmentStatus(productFlow = null, legalFinding = null, score = 0) {
  if (productFlow && legalFinding && score >= 4) return STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW;
  if (productFlow && legalFinding) return STAGE6C_ALIGNMENT_STATUS.INSUFFICIENT_EVIDENCE_TO_ALIGN;
  if (productFlow) return STAGE6C_ALIGNMENT_STATUS.PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT;
  if (legalFinding) return STAGE6C_ALIGNMENT_STATUS.LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW;
  return STAGE6C_ALIGNMENT_STATUS.INSUFFICIENT_EVIDENCE_TO_ALIGN;
}

function buildIntegrationRow({ productFlow = null, legalFinding = null, score = 0, reasons = [], index = 0 } = {}) {
  const alignmentStatus = chooseAlignmentStatus(productFlow, legalFinding, score);
  return {
    integrated_data_flow_id: stableId('DPF', index),
    alignment_status: alignmentStatus,
    product_observed_refs: productFlow ? [productFlow.product_observed_ref || productFlow.product_flow_id].filter(Boolean) : [],
    legal_governance_refs: legalFinding ? [legalFinding.legal_governance_ref || legalFinding.legal_flow_id].filter(Boolean) : [],
    product_flow_id: productFlow?.product_flow_id || '',
    legal_data_finding_id: legalFinding?.legal_flow_id || '',
    data_category: productFlow?.data_category && productFlow.data_category !== 'UNKNOWN' ? productFlow.data_category : (legalFinding?.data_category || 'UNKNOWN'),
    product_observed_action: productFlow?.product_observed_action || 'NOT_APPLICABLE',
    legal_declared_action: legalFinding?.legal_declared_action || 'NOT_EVIDENCED',
    alignment_reason: reasons.length
      ? `Alignment basis: ${reasons.join(', ')}.`
      : alignmentStatus === STAGE6C_ALIGNMENT_STATUS.PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT
        ? 'Product-observed data behavior has no matching legal/governance finding.'
        : alignmentStatus === STAGE6C_ALIGNMENT_STATUS.LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW
          ? 'Legal/governance data disclosure has no matching product-observed flow.'
          : 'Insufficient shared evidence to align product and legal rows.',
    confidence: score >= 6 ? 'HIGH' : score >= 4 ? 'MEDIUM' : score > 0 ? 'LOW' : 'INSUFFICIENT',
    product_source_window_refs: productFlow?.source_window_refs || [],
    legal_source_window_refs: legalFinding?.source_window_refs || [],
    integration_basis: 'STAGE6C_INTEGRATION_ONLY_NO_NEW_SOURCE_FACTS'
  };
}

export function buildStage6CIntegratedDataProvenanceProfile(stage6cInput = {}) {
  const productFlows = collectProductObservedFlows(stage6cInput);
  const legalFindings = collectLegalGovernanceFindings(stage6cInput);
  const usedLegal = new Set();
  const rows = [];

  for (const productFlow of productFlows) {
    let best = null;
    for (const legalFinding of legalFindings) {
      if (usedLegal.has(legalFinding.legal_flow_id)) continue;
      const scored = pairScore(productFlow, legalFinding);
      if (!best || scored.score > best.score) best = { legalFinding, ...scored };
    }
    if (best && best.score > 0) {
      usedLegal.add(best.legalFinding.legal_flow_id);
      rows.push(buildIntegrationRow({ productFlow, legalFinding: best.legalFinding, score: best.score, reasons: best.reasons, index: rows.length }));
    } else {
      rows.push(buildIntegrationRow({ productFlow, index: rows.length }));
    }
  }

  for (const legalFinding of legalFindings) {
    if (!usedLegal.has(legalFinding.legal_flow_id)) rows.push(buildIntegrationRow({ legalFinding, index: rows.length }));
  }

  const unmatchedProduct = rows.filter((row) => row.alignment_status === STAGE6C_ALIGNMENT_STATUS.PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT);
  const unmatchedLegal = rows.filter((row) => row.alignment_status === STAGE6C_ALIGNMENT_STATUS.LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW);
  const conflicts = rows.filter((row) => row.alignment_status === STAGE6C_ALIGNMENT_STATUS.CONFLICT_PRODUCT_VS_LEGAL_DISCLOSURE);

  return {
    ok: true,
    stage6c_output_version: STAGE6C_RUNTIME_VERSION,
    data_provenance_profile: {
      profile_version: STAGE6C_PROFILE_VERSION,
      integrated_data_flows: rows,
      alignment_summary: {
        product_observed_flow_count: productFlows.length,
        legal_governance_finding_count: legalFindings.length,
        integrated_data_flow_count: rows.length,
        matched_count: rows.filter((row) => row.alignment_status === STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW).length,
        product_silent_count: unmatchedProduct.length,
        legal_without_product_count: unmatchedLegal.length,
        insufficient_alignment_count: rows.filter((row) => row.alignment_status === STAGE6C_ALIGNMENT_STATUS.INSUFFICIENT_EVIDENCE_TO_ALIGN).length
      },
      unmatched_product_observed_flows: unmatchedProduct,
      unmatched_legal_governance_controls: unmatchedLegal,
      conflicts,
      limitations: productFlows.length ? [] : ['Stage 6C did not receive product-observed Stage 5 data behavior; legal-only integration rows may be incomplete.']
    },
    product_observed_flows: productFlows,
    legal_governance_findings: legalFindings,
    validation: {},
    forensic_log: {
      stage6c_may_create_new_source_facts: false,
      allowed_new_rows: 'integration_alignment_rows_only',
      product_flow_count: productFlows.length,
      legal_finding_count: legalFindings.length,
      integration_row_count: rows.length
    }
  };
}

function ledgerIds(windows = []) {
  return new Set(asArray(windows).map((window) => window.window_id || window));
}

export function validateStage6CIntegratedDataProvenance(stage6cOutput = {}, { stage6cInput = {} } = {}) {
  const profile = asObject(stage6cOutput.data_provenance_profile);
  const rows = asArray(profile.integrated_data_flows);
  const productFlows = asArray(stage6cOutput.product_observed_flows);
  const legalFindings = asArray(stage6cOutput.legal_governance_findings);
  const productRefIds = new Set(productFlows.flatMap((flow) => [flow.product_flow_id, flow.product_observed_ref, flow.feature_id].filter(Boolean)));
  const legalRefIds = new Set(legalFindings.flatMap((finding) => [finding.legal_flow_id, finding.legal_governance_ref].filter(Boolean)));
  const legalWindowIds = ledgerIds(stage6cInput.source_custody?.legal_source_window_ledger);
  const productWindowIds = ledgerIds(stage6cInput.source_custody?.product_source_window_ledger);
  const violations = [];
  const reinvestigationRequests = [];

  if (!profile.profile_version) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: '6C output missing data_provenance_profile.profile_version.' });
  if (!rows.length && (productFlows.length || legalFindings.length)) {
    reinvestigationRequests.push(createReinvestigationRequest({
      stage: '6C',
      reason: '6C received product/legal inputs but produced no integrated_data_flows.',
      requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_ALIGNMENT_FOR_PAIR],
      affected_refs: []
    }));
  }

  for (const row of rows) {
    if (!row.integrated_data_flow_id) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: '6C integration row missing integrated_data_flow_id.' });
    if (!STAGE6C_ALLOWED_ALIGNMENT_STATUSES.includes(row.alignment_status)) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: `6C row ${row.integrated_data_flow_id || '<missing>'} has uncontrolled alignment_status.` });
    }
    const productRefs = asArray(row.product_observed_refs);
    const legalRefs = asArray(row.legal_governance_refs);
    if ([STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW, STAGE6C_ALIGNMENT_STATUS.CONFLICT_PRODUCT_VS_LEGAL_DISCLOSURE].includes(row.alignment_status)) {
      if (!productRefs.length || !legalRefs.length) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: `6C ${row.alignment_status} row ${row.integrated_data_flow_id} must have both product and legal refs.` });
    }
    if (row.alignment_status === STAGE6C_ALIGNMENT_STATUS.PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT && !productRefs.length) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: `6C product-silent row ${row.integrated_data_flow_id} missing product refs.` });
    }
    if (row.alignment_status === STAGE6C_ALIGNMENT_STATUS.LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW && !legalRefs.length) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: `6C legal-only row ${row.integrated_data_flow_id} missing legal refs.` });
    }
    for (const ref of productRefs) {
      if (productRefIds.size && !productRefIds.has(ref)) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: `6C row ${row.integrated_data_flow_id} references unknown product ref ${ref}.` });
    }
    for (const ref of legalRefs) {
      if (!legalRefIds.has(ref)) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: `6C row ${row.integrated_data_flow_id} references unknown legal ref ${ref}.` });
    }
    for (const ref of asArray(row.legal_source_window_refs)) {
      if (!legalWindowIds.has(ref)) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.DATA_PROVENANCE_INTEGRATION_HANDOFF_VIOLATION, message: `6C row ${row.integrated_data_flow_id} references unknown legal source window ${ref}.` });
    }
    for (const ref of asArray(row.product_source_window_refs)) {
      if (productWindowIds.size && !productWindowIds.has(ref)) {
        reinvestigationRequests.push(createReinvestigationRequest({
          stage: '6C',
          reason: `6C row ${row.integrated_data_flow_id} references a product source window not present in product custody ledger.`,
          requested_actions: [STAGE6_REINVESTIGATION_ACTION.REQUEST_UPSTREAM_SOURCE_REPAIR],
          affected_refs: [ref]
        }));
      }
    }
    if (row.alignment_status === STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW && row.confidence === 'LOW') {
      reinvestigationRequests.push(createReinvestigationRequest({
        stage: '6C',
        reason: `6C matched row ${row.integrated_data_flow_id} has weak alignment confidence.`,
        requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_ALIGNMENT_FOR_PAIR],
        affected_refs: [...productRefs, ...legalRefs]
      }));
    }
  }

  if (violations.length) return { ok: false, status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION, violations, reinvestigation_requests: reinvestigationRequests };
  if (reinvestigationRequests.length) return { ok: false, status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED, violations: [], reinvestigation_requests: reinvestigationRequests };
  return { ok: true, status: STAGE6_VALIDATION_STATUS.PASS, integrated_data_flow_count: rows.length };
}

export async function runStage6CDataProvenanceIntegration({ stage6cInput = {}, canonicalStage6Input = {}, stage6aOutput = {}, stage6bOutput = {}, targetFeatureProfile = null, maxReinvestigationAttempts = 1 } = {}) {
  const hasProvidedStage6cInput = Boolean(stage6cInput && Object.keys(asObject(stage6cInput)).length);
  const handoffValidation = validate6bTo6cHandoff({
    canonicalStage6Input,
    stage6aOutput,
    stage6bOutput,
    targetFeatureProfile,
    proposedStage6cInput: hasProvidedStage6cInput ? stage6cInput : null
  });
  const effectiveStage6cInput = hasProvidedStage6cInput ? stage6cInput : handoffValidation.stage6c_input;

  if (handoffValidation.status === STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION) {
    return {
      ok: false,
      stage6c_output_version: STAGE6C_RUNTIME_VERSION,
      status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
      validation: { handoff: handoffValidation },
      forensic_log: { reason: '6C cannot run until 6B→6C handoff is contract-valid.' }
    };
  }

  const initialOutput = buildStage6CIntegratedDataProvenanceProfile(effectiveStage6cInput);
  const loopResult = await runBoundedReinvestigationLoop({
    initialResult: initialOutput,
    maxAttempts: maxReinvestigationAttempts,
    context: { stage: '6C' },
    validate: async (candidate) => validateStage6CIntegratedDataProvenance(candidate, { stage6cInput: effectiveStage6cInput }),
    reinvestigate: async (candidate, { validation }) => ({
      ...candidate,
      validation: {
        ...candidate.validation,
        reinvestigation_requested: true,
        reinvestigation_requests: validation.reinvestigation_requests || []
      },
      forensic_log: {
        ...candidate.forensic_log,
        reinvestigation_note: '6C records exact alignment reinvestigation requests; semantic pairwise alignment can be plugged in without changing source-fact boundaries.'
      }
    })
  });

  return {
    ...loopResult.result,
    validation: {
      ...loopResult.result.validation,
      handoff: handoffValidation,
      status: loopResult.status,
      attempts: loopResult.attempts
    }
  };
}

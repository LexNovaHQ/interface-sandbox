import {
  STAGE6_REGIONS,
  STAGE6_RECIPIENT_CATEGORIES,
  normalizeStage6Enum,
  uniqueStage6Values
} from "./stage6CanonicalVocabulary.js";

function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function compact(value = "") { return String(value || "").replace(/\s+/g, " ").trim(); }
function lower(value = "") { return compact(value).toLowerCase(); }

export function normalizeStage6BSourceRef(value = "") {
  const text = compact(value);
  if (!text) return "";
  return text.split("#")[0].trim();
}

export function stage6BSourceRecordRef(record = {}, index = 0) {
  return compact(record.source_record_ref || record.evidence_source_id || record.source_id || record.id) || `SRC_${String(index + 1).padStart(3, "0")}`;
}

function sourceFamily(record = {}) {
  return lower(record.source_family || record.family || record.source_type || record.type || record.source_bucket);
}

function sourceText(record = {}) {
  return compact(record.clean_text_lossless || record.text?.clean_text_lossless || record.normalized_text || record.clean_text || record.text || record.body || record.extracted_text || "");
}

function allSourceRecords(input = {}) {
  const records = [];
  for (const source of [
    input?.source_bundle?.raw_footprint?.source_records,
    input?.source_bundle?.evidence_buffer,
    input?.source_bundle?.artifact_inventory
  ]) {
    for (const record of arr(source)) records.push(record);
  }
  const out = [];
  const seen = new Set();
  records.forEach((record, index) => {
    const ref = stage6BSourceRecordRef(record, index);
    const key = normalizeStage6BSourceRef(ref) || compact(record.source_url || record.url || record.final_url);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ ...record, source_record_ref: ref });
  });
  return out;
}

export function stage6BLegalGovernanceSourceRecords(input = {}) {
  return allSourceRecords(input).filter((record) => ["legal_profile", "governance_profile"].includes(sourceFamily(record)));
}

function allLegalText(input = {}) {
  return stage6BLegalGovernanceSourceRecords(input).map(sourceText).join("\n\n");
}

function legalUnits(input = {}) {
  const cartography = obj(input.legal_document_cartography || input.stage6a_review?.legal_document_cartography);
  return arr(cartography.legal_document_index);
}

function controlRows(input = {}) {
  const cartography = obj(input.legal_document_cartography || input.stage6a_review?.legal_document_cartography);
  return arr(cartography.document_control_signal_map);
}

function refsFor(input = {}, controls = [], sectionFunctions = []) {
  const controlSet = new Set(controls);
  const functionSet = new Set(sectionFunctions);
  const refs = [];
  for (const unit of legalUnits(input)) {
    const unitControls = arr(unit.control_families_detected);
    if (unitControls.some((item) => controlSet.has(item)) || functionSet.has(unit.section_function)) refs.push(unit.legal_unit_id);
  }
  for (const row of controlRows(input)) if (controlSet.has(row.control_family) && row.legal_unit_id) refs.push(row.legal_unit_id);
  return uniqueStage6Values(refs);
}

function signal(condition) { return condition ? "visible" : "unknown"; }
function partial(condition) { return condition ? "partial" : "unknown"; }
function regionsFromText(text = "") {
  const t = lower(text);
  const regions = [];
  if (/india|bengaluru|bangalore|mumbai|delhi/.test(t)) regions.push("india");
  if (/united states|\bus\b|usa|california/.test(t)) regions.push("us");
  if (/european union|\beu\b|europe/.test(t)) regions.push("eu");
  if (/united kingdom|\buk\b/.test(t)) regions.push("uk");
  if (/global|cross.border|international/.test(t)) regions.push("global");
  return uniqueStage6Values(regions.length ? regions : ["unknown"]).map((item) => normalizeStage6Enum(item, STAGE6_REGIONS));
}
function recipientCategories(text = "") {
  const t = lower(text);
  const out = [];
  if (/subprocessor|sub.processor|third.party service provider|vendor/.test(t)) out.push("support_provider");
  if (/cloud|hosting|infrastructure|aws|azure|gcp/.test(t)) out.push("cloud_provider");
  if (/model provider|ai provider|llm/.test(t)) out.push("model_provider");
  if (/payment|billing|processor/.test(t)) out.push("payment_provider");
  if (/analytics|telemetry/.test(t)) out.push("analytics_provider");
  if (/security|soc 2|iso 27001/.test(t)) out.push("security_provider");
  return uniqueStage6Values(out.length ? out : ["unknown"]).map((item) => normalizeStage6Enum(item, STAGE6_RECIPIENT_CATEGORIES));
}

export function buildStage6BLegalGovernancePrefill(input = {}) {
  const text = allLegalText(input);
  const t = lower(text);
  const privacyRefs = refsFor(input, ["privacy_notice", "data_collection", "data_use", "data_sharing"], ["privacy_notice", "data_processing_terms"]);
  const rightsRefs = refsFor(input, ["data_subject_rights", "consent_withdrawal", "grievance_channel", "deletion"], ["rights_request_terms", "retention_deletion_terms", "grievance_page"]);
  const processorRefs = refsFor(input, ["subprocessor_disclosure", "model_provider_disclosure", "data_sharing"], ["subprocessor_terms", "data_processing_terms"]);
  const transferRefs = refsFor(input, ["cross_border_transfer"], ["cross_border_transfer_terms"]);
  const securityRefs = refsFor(input, ["security_safeguards", "breach_notice"], ["security_terms", "breach_terms"]);
  const aiRefs = refsFor(input, ["training_or_finetuning", "automated_decision", "ai_disclosure", "hitl_mandate"], ["ai_disclosure", "automated_decision_terms"]);

  const privacyVisible = /privacy policy|personal data|personal information|data fiduciary|data protection|collect/.test(t) || privacyRefs.length > 0;
  const rightsVisible = /access|correction|delete|deletion|erasure|withdraw|grievance|complaint|nomination|opt.out|data principal rights|rights/.test(t) || rightsRefs.length > 0;
  const securityVisible = /encrypt|encryption|access control|least privilege|soc\s*2|iso\s*27001|audit|incident|breach|security/.test(t) || securityRefs.length > 0;
  const transferVisible = /cross.border|transfer|data residency|residency|locali[sz]ation|india|region/.test(t) || transferRefs.length > 0;
  const processorVisible = /subprocessor|processor|service provider|third.party|vendor|dpa|data processing addendum/.test(t) || processorRefs.length > 0;
  const trainingVisible = /train|training|fine.tun|model improvement|opt.out|do not train|not used to train|exclude/.test(t) || aiRefs.length > 0;
  const automatedVisible = /automated decision|human review|human intervention|significant decision|hitl/.test(t) || aiRefs.length > 0;

  return {
    prefill_version: "stage6b_legal_governance_prefill_v1",
    source_firewall: {
      lossless_source_families_used: ["legal_profile", "governance_profile"],
      product_sources_used_as_lossless_control_evidence: false
    },
    source_count: stage6BLegalGovernanceSourceRecords(input).length,
    legal_unit_ref_count: legalUnits(input).length,
    refs: { privacyRefs, rightsRefs, processorRefs, transferRefs, securityRefs, aiRefs },
    signals: {
      privacy_notice_signal: signal(privacyVisible),
      ai_notice_signal: partial(/ai|model|automated|voice|synthetic|training/.test(t)),
      subprocessor_notice_signal: signal(processorVisible),
      consent_signal: partial(/consent|agree|permission/.test(t)),
      contract_signal: partial(/terms|agreement|contract|eula|subscription|service/.test(t)),
      withdrawal_signal: signal(/withdraw/.test(t)),
      rights_signal: signal(rightsVisible),
      deletion_signal: signal(/delete|deletion|erasure|retention/.test(t) || rightsRefs.length > 0),
      opt_out_signal: signal(/opt.out|do not train|not used to train|exclude/.test(t)),
      grievance_signal: signal(/grievance|complaint|contact|dpo|data protection officer/.test(t)),
      subprocessor_list_visible: signal(processorVisible),
      cross_border_signal: partial(/cross.border|transfer|international|outside/.test(t)),
      data_residency_signal: signal(/data residency|residency|locali[sz]ation|india/.test(t)),
      transfer_basis_signal: partial(/transfer|standard contractual|adequacy|requested by customer/.test(t)),
      retention_period_visible: partial(/retention|retain|storage period|delete/.test(t)),
      training_opt_out_visible: signal(trainingVisible),
      fine_tuning_prohibition_signal: partial(/do not train|not used to train|exclude|opt.out|without opt.in|consent/.test(t)),
      automated_decision_signal: partial(automatedVisible),
      encryption_signal: signal(/encrypt|encryption/.test(t)),
      access_control_signal: signal(/access control|least privilege|role.based|authorization/.test(t)),
      audit_log_signal: partial(/audit|log|monitor/.test(t)),
      breach_notice_signal: partial(/breach|incident/.test(t)),
      dpo_or_contact_signal: signal(/dpo|data protection officer|grievance|privacy@|legal@|contact/.test(t))
    },
    regions_visible: regionsFromText(t),
    recipient_categories: recipientCategories(t)
  };
}

function chooseSignal(current, candidate) {
  if (!current || current === "unknown") return candidate || current || "unknown";
  if (current === "not_visible" && ["visible", "partial"].includes(candidate)) return candidate;
  if (current === "partial" && candidate === "visible") return "visible";
  return current;
}
function chooseArray(current = [], candidate = []) {
  const merged = uniqueStage6Values([...arr(current), ...arr(candidate)].filter(Boolean));
  return merged.length ? merged : current;
}

export function applyStage6BLegalGovernancePrefill(row = {}, prefill = {}) {
  const signals = obj(prefill.signals);
  const refs = obj(prefill.refs);
  const copy = structuredClone(row);
  copy.notice = {
    ...obj(copy.notice),
    privacy_notice_signal: chooseSignal(copy.notice?.privacy_notice_signal, signals.privacy_notice_signal),
    ai_notice_signal: chooseSignal(copy.notice?.ai_notice_signal, signals.ai_notice_signal),
    subprocessor_notice_signal: chooseSignal(copy.notice?.subprocessor_notice_signal, signals.subprocessor_notice_signal),
    notice_legal_unit_refs: chooseArray(copy.notice?.notice_legal_unit_refs, refs.privacyRefs),
    confidence: copy.notice?.confidence === "unknown" && refs.privacyRefs?.length ? "medium" : copy.notice?.confidence
  };
  copy.consent_basis = {
    ...obj(copy.consent_basis),
    consent_signal: chooseSignal(copy.consent_basis?.consent_signal, signals.consent_signal),
    contract_signal: chooseSignal(copy.consent_basis?.contract_signal, signals.contract_signal),
    withdrawal_signal: chooseSignal(copy.consent_basis?.withdrawal_signal, signals.withdrawal_signal),
    basis_legal_unit_refs: chooseArray(copy.consent_basis?.basis_legal_unit_refs, refs.privacyRefs),
    confidence: copy.consent_basis?.confidence === "unknown" && refs.privacyRefs?.length ? "medium" : copy.consent_basis?.confidence
  };
  copy.rights = {
    ...obj(copy.rights),
    access_right_signal: chooseSignal(copy.rights?.access_right_signal, signals.rights_signal),
    correction_right_signal: chooseSignal(copy.rights?.correction_right_signal, signals.rights_signal),
    deletion_right_signal: chooseSignal(copy.rights?.deletion_right_signal, signals.deletion_signal),
    opt_out_signal: chooseSignal(copy.rights?.opt_out_signal, signals.opt_out_signal),
    withdrawal_right_signal: chooseSignal(copy.rights?.withdrawal_right_signal, signals.withdrawal_signal),
    grievance_signal: chooseSignal(copy.rights?.grievance_signal, signals.grievance_signal),
    rights_legal_unit_refs: chooseArray(copy.rights?.rights_legal_unit_refs, refs.rightsRefs),
    confidence: copy.rights?.confidence === "unknown" && refs.rightsRefs?.length ? "medium" : copy.rights?.confidence
  };
  copy.processor_chain = {
    ...obj(copy.processor_chain),
    subprocessor_list_visible: chooseSignal(copy.processor_chain?.subprocessor_list_visible, signals.subprocessor_list_visible),
    recipient_categories: chooseArray(copy.processor_chain?.recipient_categories, prefill.recipient_categories),
    processor_legal_unit_refs: chooseArray(copy.processor_chain?.processor_legal_unit_refs, refs.processorRefs),
    confidence: copy.processor_chain?.confidence === "unknown" && refs.processorRefs?.length ? "medium" : copy.processor_chain?.confidence
  };
  copy.transfer_location = {
    ...obj(copy.transfer_location),
    cross_border_signal: chooseSignal(copy.transfer_location?.cross_border_signal, signals.cross_border_signal),
    regions_visible: chooseArray(copy.transfer_location?.regions_visible, prefill.regions_visible),
    transfer_basis_signal: chooseSignal(copy.transfer_location?.transfer_basis_signal, signals.transfer_basis_signal),
    data_residency_signal: chooseSignal(copy.transfer_location?.data_residency_signal, signals.data_residency_signal),
    location_legal_unit_refs: chooseArray(copy.transfer_location?.location_legal_unit_refs, refs.transferRefs),
    confidence: copy.transfer_location?.confidence === "unknown" && refs.transferRefs?.length ? "medium" : copy.transfer_location?.confidence
  };
  copy.retention_deletion_ai = {
    ...obj(copy.retention_deletion_ai),
    retention_period_visible: chooseSignal(copy.retention_deletion_ai?.retention_period_visible, signals.retention_period_visible),
    deletion_channel_visible: chooseSignal(copy.retention_deletion_ai?.deletion_channel_visible, signals.deletion_signal),
    training_opt_out_visible: chooseSignal(copy.retention_deletion_ai?.training_opt_out_visible, signals.training_opt_out_visible),
    fine_tuning_prohibition_signal: chooseSignal(copy.retention_deletion_ai?.fine_tuning_prohibition_signal, signals.fine_tuning_prohibition_signal),
    ai_architecture_legal_unit_refs: chooseArray(copy.retention_deletion_ai?.ai_architecture_legal_unit_refs, refs.aiRefs),
    confidence: copy.retention_deletion_ai?.confidence === "unknown" && refs.aiRefs?.length ? "medium" : copy.retention_deletion_ai?.confidence
  };
  copy.security_accountability = {
    ...obj(copy.security_accountability),
    encryption_signal: chooseSignal(copy.security_accountability?.encryption_signal, signals.encryption_signal),
    access_control_signal: chooseSignal(copy.security_accountability?.access_control_signal, signals.access_control_signal),
    audit_log_signal: chooseSignal(copy.security_accountability?.audit_log_signal, signals.audit_log_signal),
    breach_notice_signal: chooseSignal(copy.security_accountability?.breach_notice_signal, signals.breach_notice_signal),
    dpo_or_contact_signal: chooseSignal(copy.security_accountability?.dpo_or_contact_signal, signals.dpo_or_contact_signal),
    security_legal_unit_refs: chooseArray(copy.security_accountability?.security_legal_unit_refs, refs.securityRefs),
    confidence: copy.security_accountability?.confidence === "unknown" && refs.securityRefs?.length ? "medium" : copy.security_accountability?.confidence
  };
  copy.source_trace = {
    ...obj(copy.source_trace),
    legal_unit_refs: chooseArray(copy.source_trace?.legal_unit_refs, [
      ...arr(copy.notice?.notice_legal_unit_refs),
      ...arr(copy.rights?.rights_legal_unit_refs),
      ...arr(copy.processor_chain?.processor_legal_unit_refs),
      ...arr(copy.transfer_location?.location_legal_unit_refs),
      ...arr(copy.retention_deletion_ai?.ai_architecture_legal_unit_refs),
      ...arr(copy.security_accountability?.security_legal_unit_refs)
    ]),
    basis_codes: chooseArray(copy.source_trace?.basis_codes, prefill.legal_unit_ref_count ? ["stage6_legal_unit_ref", "direct_policy_signal"] : [])
  };
  return copy;
}

export const stage6bLegalGovernancePrefillInternals = { allSourceRecords, sourceFamily, sourceText, refsFor, regionsFromText, recipientCategories, chooseSignal, chooseArray };

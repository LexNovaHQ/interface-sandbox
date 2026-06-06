const DISCLAIMER = "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.";

const STATUS_VALUES = Object.freeze([
  "TRIGGERED",
  "CONTROLLED",
  "NOT_TRIGGERED",
  "NOT_APPLICABLE",
  "INSUFFICIENT_EVIDENCE"
]);

const SAFE_VAULT_FIELDS = new Set([
  "baseline.company",
  "baseline.entity_type",
  "baseline.address",
  "baseline.legal_email",
  "baseline.privacy_email",
  "baseline.products",
  "baseline.jurisdiction.country",
  "baseline.jurisdiction.state",
  "baseline.market",
  "baseline.delivery.app",
  "baseline.delivery.api",
  "baseline.revenue_model",
  "baseline.acv",
  "baseline.has_beta",
  "baseline.output_ownership",
  "baseline.sla_type",
  "baseline.integrations.slack",
  "baseline.integrations.crm",
  "baseline.integrations.stripe",
  "baseline.integrations.github",
  "baseline.integrations.webhooks",
  "architecture.memory",
  "architecture.models",
  "architecture.sub_processors.openai",
  "architecture.sub_processors.anthropic",
  "architecture.sub_processors.google",
  "architecture.sub_processors.cohere",
  "architecture.sub_processors.mistral",
  "architecture.sub_processors.url",
  "architecture.cloud_host",
  "architecture.vector_db",
  "archetypes.is_generalist",
  "archetypes.is_doer",
  "archetypes.is_orchestrator",
  "archetypes.is_creator",
  "archetypes.is_reader",
  "archetypes.conversational_ui",
  "archetypes.sens_bio",
  "archetypes.is_judge",
  "archetypes.is_judge_hr",
  "archetypes.is_judge_legal",
  "archetypes.is_optimizer",
  "archetypes.sens_fin",
  "archetypes.is_shield",
  "archetypes.is_mover",
  "archetypes.agent_limits.session_cap",
  "archetypes.agent_limits.period_cap",
  "archetypes.agent_limits.retry_limit",
  "archetypes.agent_limits.loop_threshold",
  "compliance.processes_pii",
  "compliance.eu_users",
  "compliance.ca_users",
  "compliance.sens_health",
  "compliance.sens_fin",
  "compliance.sens_employment",
  "compliance.minors",
  "compliance.distress"
]);

function clone(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function uniqueStrings(values) {
  return [...new Set(asArray(values).map((value) => asString(value)).filter(Boolean))];
}

function splitTokens(value) {
  if (Array.isArray(value)) return uniqueStrings(value);
  return String(value || "")
    .split(/[;,|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStatus(row) {
  const status = asString(row?.final_status || row?.status || row?.Status || "INSUFFICIENT_EVIDENCE").toUpperCase();
  return STATUS_VALUES.includes(status) ? status : "INSUFFICIENT_EVIDENCE";
}

function getThreatId(row) {
  return asString(row?.threat_id || row?.Threat_ID || row?.id || "UNKNOWN_THREAT");
}

function getThreatName(row) {
  return asString(row?.threat_name || row?.Threat_Name || row?.name || getThreatId(row));
}

function getDocumentRoutes(row) {
  return uniqueStrings(row?.document_routes || row?.redline_route || row?.document_route || []);
}

function getFeatureRefs(row) {
  return uniqueStrings(row?.feature_refs || row?.linked_feature_ids || row?.feature_ref || row?.linked_feature || []);
}

function getRegistryPayload(row) {
  const payload = asObject(row?.registry_payload);
  return {
    legal_pain: asString(payload.legal_pain || row?.legal_pain || row?.Legal_Pain),
    fp_mechanism: asString(payload.fp_mechanism || row?.fp_mechanism || row?.FP_Mechanism),
    fp_impact: asString(payload.fp_impact || row?.fp_impact || row?.FP_Impact),
    lex_nova_fix: asString(payload.lex_nova_fix || row?.lex_nova_fix || row?.Lex_Nova_Fix)
  };
}

function getFindingId(index) {
  return `FIND-${String(index + 1).padStart(3, "0")}`;
}

function getFeatureRef(feature, index) {
  return asString(feature?.feature_ref || feature?.feature_id || feature?.id || `FEATURE-${String(index + 1).padStart(3, "0")}`);
}

function getFeatureName(feature, fallbackRef) {
  return asString(feature?.feature_name || feature?.name || feature?.title || fallbackRef);
}

function findMatchingFinding(findings, threatId) {
  return asArray(findings).find((finding) => asString(finding?.threat_id) === threatId) || null;
}

function findMatchingRow(rows, threatId) {
  return asArray(rows).find((row) => getThreatId(row) === threatId) || null;
}

function normalizeAuthority(row, finding = {}) {
  const existing = asObject(finding.authority);
  return {
    IN: asString(existing.IN || row?.authority?.IN || row?.Authority_IN || row?.authority_in || "UNKNOWN"),
    EU: asString(existing.EU || row?.authority?.EU || row?.Authority_EU || row?.authority_eu || "UNKNOWN"),
    US: asString(existing.US || row?.authority?.US || row?.Authority_US || row?.authority_us || "UNKNOWN")
  };
}

function normalizeEvidence(row, finding = {}) {
  const evidence = asObject(finding.evidence || row?.evidence);
  return {
    source_url: asString(evidence.source_url || row?.source_url || row?.evidence_ref || "manual_text"),
    artifact_class: asString(evidence.artifact_class || row?.artifact_class || "other"),
    proof_citation: asString(evidence.proof_citation || row?.evidence_ref || row?.reasoning_summary || "Public-footprint evidence basis supplied by prior stages."),
    evidence_mode: asString(evidence.evidence_mode || row?.evidence_mode || "INFERENCE_FROM_ADMITTED_EVIDENCE"),
    source_hash: asString(evidence.source_hash || row?.source_hash || ""),
    extracted_excerpt: asString(evidence.extracted_excerpt || row?.extracted_excerpt || row?.reasoning_summary || "")
  };
}

function normalizeTriggerEvaluation(row, finding = {}) {
  const trigger = asObject(finding.trigger_evaluation);
  return {
    conditions_passed: uniqueStrings(trigger.conditions_passed || row?.conditions_passed || []),
    conditions_failed: uniqueStrings(trigger.conditions_failed || row?.conditions_failed || []),
    trigger_if_result: Boolean(trigger.trigger_if_result ?? row?.trigger_if_result ?? normalizeStatus(row) === "TRIGGERED"),
    exclude_if_result: Boolean(trigger.exclude_if_result ?? row?.exclude_if_result ?? false),
    exclude_if_basis: asString(trigger.exclude_if_basis || row?.exclude_if_basis || "")
  };
}

function normalizeFinding(finding, row, index) {
  const status = normalizeStatus(row || finding);
  const threatId = asString(finding?.threat_id || getThreatId(row));
  const documentRoutes = getDocumentRoutes(finding).length ? getDocumentRoutes(finding) : getDocumentRoutes(row);
  const registryPayload = getRegistryPayload({ ...asObject(row), registry_payload: finding?.registry_payload || row?.registry_payload });

  return {
    finding_id: asString(finding?.finding_id || getFindingId(index)),
    threat_id: threatId,
    threat_name: asString(finding?.threat_name || getThreatName(row)),
    status: "TRIGGERED",
    pain_tier: asString(finding?.pain_tier || row?.pain_tier || row?.Pain_Tier || "UNKNOWN"),
    pain_category: asString(finding?.pain_category || row?.pain_category || row?.Pain_Category || "UNKNOWN"),
    pain_depth: asString(finding?.pain_depth || row?.pain_depth || row?.Pain_Depth || "UNKNOWN"),
    lane: asString(finding?.lane || row?.lane || row?.Lane || "UNKNOWN"),
    archetype: asString(finding?.archetype || row?.archetype || row?.Archetype || "UNKNOWN"),
    surface_tokens: uniqueStrings(finding?.surface_tokens || splitTokens(row?.surface || row?.Surface)),
    subcat: asString(finding?.subcat || row?.subcat || row?.Subcat || "UNKNOWN"),
    authority: normalizeAuthority(row, finding),
    linked_feature_ids: uniqueStrings(finding?.linked_feature_ids || getFeatureRefs(row)),
    evidence: normalizeEvidence(row, finding),
    trigger_evaluation: normalizeTriggerEvaluation(row, finding),
    registry_payload: registryPayload,
    redline_route: uniqueStrings(finding?.redline_route || []),
    document_routes: documentRoutes,
    vault_dependencies: uniqueStrings(finding?.vault_dependencies || []).filter((field) => SAFE_VAULT_FIELDS.has(field)),
    finding_memo_note: asString(finding?.finding_memo_note || "Compiler-normalized from post-challenge ledger without adding legal advice.")
  };
}

function normalizeControlledRow(row, existing = {}) {
  return {
    ...asObject(existing),
    threat_id: asString(existing.threat_id || getThreatId(row)),
    threat_name: asString(existing.threat_name || getThreatName(row)),
    status: "CONTROLLED",
    linked_feature_ids: uniqueStrings(existing.linked_feature_ids || getFeatureRefs(row)),
    control_basis: asString(existing.control_basis || row?.control_basis || row?.reasoning_summary || "Explicit public control identified in prior-stage ledger."),
    evidence_ref: asString(existing.evidence_ref || row?.evidence_ref || ""),
    reasoning_summary: asString(existing.reasoning_summary || row?.reasoning_summary || "Controlled based on prior-stage public-footprint evaluation."),
    document_routes: uniqueStrings(existing.document_routes || getDocumentRoutes(row)),
    technical_note: asString(existing.technical_note || "Compiler-normalized controlled row.")
  };
}

function normalizeInsufficientRow(row, existing = {}) {
  return {
    ...asObject(existing),
    threat_id: asString(existing.threat_id || getThreatId(row)),
    threat_name: asString(existing.threat_name || getThreatName(row)),
    status: "INSUFFICIENT_EVIDENCE",
    linked_feature_ids: uniqueStrings(existing.linked_feature_ids || getFeatureRefs(row)),
    missing_evidence: asString(existing.missing_evidence || row?.missing_evidence || "Public evidence was insufficient to confirm this threat condition."),
    evidence_ref: asString(existing.evidence_ref || row?.evidence_ref || ""),
    reasoning_summary: asString(existing.reasoning_summary || row?.reasoning_summary || "Insufficient evidence based on prior-stage public-footprint evaluation."),
    recommended_follow_up: asString(existing.recommended_follow_up || "Confirm with client and local counsel before relying on this point."),
    technical_note: asString(existing.technical_note || "Compiler-normalized insufficient evidence row.")
  };
}

function normalizeFindings(output, ledgerRows) {
  const existingFindings = asArray(output.findings);
  const triggeredRows = asArray(ledgerRows).filter((row) => normalizeStatus(row) === "TRIGGERED");
  const byThreat = new Map(existingFindings.map((finding) => [asString(finding?.threat_id), finding]));

  output.findings = triggeredRows.map((row, index) => normalizeFinding(byThreat.get(getThreatId(row)) || {}, row, index));

  const controlledByThreat = new Map(asArray(output.controlled_rows).map((row) => [asString(row?.threat_id), row]));
  output.controlled_rows = asArray(ledgerRows)
    .filter((row) => normalizeStatus(row) === "CONTROLLED")
    .map((row) => normalizeControlledRow(row, controlledByThreat.get(getThreatId(row))));

  const insufficientByThreat = new Map(asArray(output.insufficient_evidence_rows).map((row) => [asString(row?.threat_id), row]));
  output.insufficient_evidence_rows = asArray(ledgerRows)
    .filter((row) => normalizeStatus(row) === "INSUFFICIENT_EVIDENCE")
    .map((row) => normalizeInsufficientRow(row, insufficientByThreat.get(getThreatId(row))));
}

function countBy(rows, getter) {
  return asArray(rows).reduce((acc, row) => {
    const key = asString(getter(row), "UNKNOWN");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function normalizeThreatSummary(output, ledgerRows, operatorGate) {
  const statusCounts = STATUS_VALUES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  asArray(ledgerRows).forEach((row) => {
    statusCounts[normalizeStatus(row)] += 1;
  });

  output.threat_registry_summary = {
    ...asObject(output.threat_registry_summary),
    registry_count_loaded: asArray(ledgerRows).length,
    registry_count_evaluated: asArray(ledgerRows).length,
    status_counts: statusCounts,
    counts_by_pain_tier: countBy(ledgerRows, (row) => row?.pain_tier || row?.Pain_Tier),
    counts_by_pain_category: countBy(ledgerRows, (row) => row?.pain_category || row?.Pain_Category),
    counts_by_archetype: countBy(ledgerRows, (row) => row?.archetype || row?.Archetype),
    counts_by_surface: countBy(ledgerRows, (row) => row?.surface || row?.Surface),
    counts_by_lane: countBy(ledgerRows, (row) => row?.lane || row?.Lane),
    operator_challenge_result: asString(operatorGate?.result || output.threat_registry_summary?.operator_challenge_result || "UNKNOWN"),
    reopened_count: Number(output.threat_registry_summary?.reopened_count || 0),
    warnings: uniqueStrings(output.threat_registry_summary?.warnings || [])
  };
}

function collectFeatureRows(output, ledgerRows) {
  const features = asArray(output.product_feature_map);
  const map = new Map();

  features.forEach((feature, index) => {
    const featureRef = getFeatureRef(feature, index);
    map.set(featureRef, {
      feature_ref: featureRef,
      feature_name: getFeatureName(feature, featureRef),
      archetype_codes: uniqueStrings(feature?.archetype_codes || feature?.archetype_code || feature?.archetype || []),
      surface_tokens: uniqueStrings(feature?.surface_tokens || splitTokens(feature?.surface || feature?.surfaces)),
      triggered_threat_ids: [],
      controlled_threat_ids: [],
      insufficient_evidence_threat_ids: [],
      not_triggered_threat_ids: [],
      not_applicable_threat_ids: [],
      document_routes: [],
      summary: asString(feature?.summary || feature?.description || `Feature matrix row for ${featureRef}.`)
    });
  });

  asArray(ledgerRows).forEach((row) => {
    const threatId = getThreatId(row);
    const status = normalizeStatus(row);
    const refs = getFeatureRefs(row);
    const targetRefs = refs.length ? refs : ["GLOBAL"];

    targetRefs.forEach((ref) => {
      if (!map.has(ref)) {
        map.set(ref, {
          feature_ref: ref,
          feature_name: ref,
          archetype_codes: uniqueStrings(row?.archetype_codes || row?.archetype || row?.Archetype || []),
          surface_tokens: uniqueStrings(row?.surface_tokens || splitTokens(row?.surface || row?.Surface)),
          triggered_threat_ids: [],
          controlled_threat_ids: [],
          insufficient_evidence_threat_ids: [],
          not_triggered_threat_ids: [],
          not_applicable_threat_ids: [],
          document_routes: [],
          summary: `Feature matrix row for ${ref}.`
        });
      }

      const matrixRow = map.get(ref);
      if (status === "TRIGGERED") matrixRow.triggered_threat_ids.push(threatId);
      if (status === "CONTROLLED") matrixRow.controlled_threat_ids.push(threatId);
      if (status === "INSUFFICIENT_EVIDENCE") matrixRow.insufficient_evidence_threat_ids.push(threatId);
      if (status === "NOT_TRIGGERED") matrixRow.not_triggered_threat_ids.push(threatId);
      if (status === "NOT_APPLICABLE") matrixRow.not_applicable_threat_ids.push(threatId);
      matrixRow.document_routes = uniqueStrings([...matrixRow.document_routes, ...getDocumentRoutes(row)]);
    });
  });

  asArray(output.feature_to_threat_matrix).forEach((row) => {
    const ref = asString(row?.feature_ref);
    if (!ref) return;
    const current = map.get(ref) || {};
    map.set(ref, {
      ...current,
      ...asObject(row),
      feature_ref: ref,
      feature_name: asString(row?.feature_name || current.feature_name || ref),
      archetype_codes: uniqueStrings(row?.archetype_codes || current.archetype_codes || []),
      surface_tokens: uniqueStrings(row?.surface_tokens || current.surface_tokens || []),
      triggered_threat_ids: uniqueStrings(row?.triggered_threat_ids || current.triggered_threat_ids || []),
      controlled_threat_ids: uniqueStrings(row?.controlled_threat_ids || current.controlled_threat_ids || []),
      insufficient_evidence_threat_ids: uniqueStrings(row?.insufficient_evidence_threat_ids || current.insufficient_evidence_threat_ids || []),
      not_triggered_threat_ids: uniqueStrings(row?.not_triggered_threat_ids || current.not_triggered_threat_ids || []),
      not_applicable_threat_ids: uniqueStrings(row?.not_applicable_threat_ids || current.not_applicable_threat_ids || []),
      document_routes: uniqueStrings(row?.document_routes || current.document_routes || []),
      summary: asString(row?.summary || current.summary || `Feature matrix row for ${ref}.`)
    });
  });

  return [...map.values()].map((row) => ({
    ...row,
    archetype_codes: uniqueStrings(row.archetype_codes),
    surface_tokens: uniqueStrings(row.surface_tokens),
    triggered_threat_ids: uniqueStrings(row.triggered_threat_ids),
    controlled_threat_ids: uniqueStrings(row.controlled_threat_ids),
    insufficient_evidence_threat_ids: uniqueStrings(row.insufficient_evidence_threat_ids),
    not_triggered_threat_ids: uniqueStrings(row.not_triggered_threat_ids),
    not_applicable_threat_ids: uniqueStrings(row.not_applicable_threat_ids),
    document_routes: uniqueStrings(row.document_routes)
  }));
}

function normalizeReportData(output, input) {
  const reportData = asObject(output.report_data);
  const executive = asObject(reportData.executive_report);
  const forensic = asObject(reportData.full_forensic_record);

  const findings = asArray(output.findings);
  const triggeredSchedule = findings.map((finding) => ({
    threat_id: finding.threat_id,
    threat_name: finding.threat_name,
    pain_category: asString(finding.pain_category, "UNKNOWN"),
    archetype: asString(finding.archetype, "UNKNOWN"),
    linked_feature: asString(finding.linked_feature_ids?.[0], "UNKNOWN"),
    document_route: asString(finding.document_routes?.[0], "LOCAL_COUNSEL_REVIEW"),
    short_issue: asString(finding.finding_memo_note || finding.registry_payload?.legal_pain || finding.threat_name)
  }));

  const materialHighlights = findings.slice(0, 5).map((finding) => ({
    finding_id: finding.finding_id,
    threat_id: finding.threat_id,
    headline: finding.threat_name,
    basis: finding.evidence?.proof_citation || "Public-footprint basis from prior-stage ledger.",
    impact: finding.registry_payload?.fp_impact || "Review required before relying on this output.",
    recommended_fix: finding.registry_payload?.lex_nova_fix || "Local counsel review required."
  }));

  output.report_data = {
    executive_report: {
      cover_and_reliance: asObject(executive.cover_and_reliance),
      scope_and_methodology: asObject(executive.scope_and_methodology),
      subject_profile: asObject(executive.subject_profile),
      risk_posture_summary: asObject(executive.risk_posture_summary),
      material_highlights: asArray(executive.material_highlights).length ? executive.material_highlights : materialHighlights,
      triggered_findings_schedule: triggeredSchedule,
      document_stack_verdict: asObject(executive.document_stack_verdict),
      recommended_route: asObject(executive.recommended_route)
    },
    full_forensic_record: {
      source_review: asObject(forensic.source_review || input?.source_bundle?.source_review),
      artifact_inventory: asArray(forensic.artifact_inventory).length ? forensic.artifact_inventory : asArray(input?.source_bundle?.artifact_inventory),
      product_feature_map: asArray(output.product_feature_map),
      feature_to_threat_matrix: asArray(output.feature_to_threat_matrix),
      document_stack_redline: asArray(output.document_stack_redline),
      triggered_findings: findings,
      controlled_rows: asArray(output.controlled_rows),
      insufficient_evidence_rows: asArray(output.insufficient_evidence_rows),
      assembly_route: asObject(output.assembly_route),
      technical_audit_log: asArray(output.technical_audit_log)
    }
  };
}

function normalizeAuditLog(output, ledgerRows, operatorGate) {
  const existing = asArray(output.technical_audit_log).map((entry) => ({
    ...asObject(entry),
    entry_type: asString(entry?.entry_type || "COMPILER_WARNING"),
    message: asString(entry?.message || "Compiler audit entry."),
    severity: ["INFO", "WARNING", "ERROR"].includes(asString(entry?.severity).toUpperCase()) ? asString(entry.severity).toUpperCase() : "INFO"
  }));

  const rowEntries = asArray(ledgerRows).map((row) => ({
    entry_type: "LEDGER_ROW",
    threat_id: getThreatId(row),
    status: normalizeStatus(row),
    message: `Compiler accounted for ${getThreatId(row)} as ${normalizeStatus(row)}.`,
    source_ref: asString(row?.evidence_ref || row?.source_ref || ""),
    severity: "INFO"
  }));

  const opEntry = {
    entry_type: "OPERATOR_CHALLENGE",
    status: asString(operatorGate?.result || "UNKNOWN"),
    message: "Operator Challenge result carried into compiler normalization.",
    source_ref: "operator_challenge_gate",
    severity: "INFO"
  };

  output.technical_audit_log = [...existing, ...rowEntries, opEntry];
}

function normalizeThreatFindings(output) {
  output.threat_findings = asArray(output.findings).map((finding) => ({
    finding_id: finding.finding_id,
    threat_id: finding.threat_id,
    threat_name: finding.threat_name,
    linked_feature_ids: uniqueStrings(finding.linked_feature_ids),
    document_routes: uniqueStrings(finding.document_routes),
    vault_dependencies: uniqueStrings(finding.vault_dependencies).filter((field) => SAFE_VAULT_FIELDS.has(field)),
    severity: asString(finding.pain_tier || finding.pain_depth || "UNKNOWN"),
    status: "TRIGGERED"
  }));
}

function normalizeVaultQuestions(output) {
  output.vault_confirmation_questions = asArray(output.vault_confirmation_questions)
    .filter((question) => SAFE_VAULT_FIELDS.has(asString(question?.field_path)))
    .map((question) => ({
      field_path: asString(question.field_path),
      question: asString(question.question || `Please confirm ${question.field_path}.`),
      why_it_matters: asString(question.why_it_matters || "Required for Assembly routing."),
      source_finding_ids: uniqueStrings(question.source_finding_ids || []),
      priority: ["HIGH", "MEDIUM", "LOW"].includes(asString(question.priority).toUpperCase()) ? asString(question.priority).toUpperCase() : "MEDIUM"
    }));
}

function normalizeAssemblyRoute(output) {
  output.assembly_route = {
    ...asObject(output.assembly_route),
    recommended_package: asString(output.assembly_route?.recommended_package || "INSUFFICIENT_PUBLIC_EVIDENCE"),
    document_routes: uniqueStrings(output.assembly_route?.document_routes || []),
    route_reasoning: asString(output.assembly_route?.route_reasoning || "Compiler-normalized route based on public-footprint evidence."),
    local_counsel_review_required: output.assembly_route?.local_counsel_review_required === false ? false : true,
    vault_confirmation_question_count: asArray(output.vault_confirmation_questions).length,
    backend_assembler_note: asString(output.assembly_route?.backend_assembler_note || "Node 5B must derive vault_prefill_suggestions and assembly_handoff deterministically from this compiler output and the Vault.js Canonical Map.")
  };
}

export function normalizeFinalCompilerOutput(modelOutput = {}, input = {}) {
  const output = asObject(clone(modelOutput));
  const ledgerRows = asArray(input.registry_evaluation_ledger);
  const operatorGate = asObject(input.operator_challenge_gate);

  output.diligence_run = {
    ...asObject(output.diligence_run),
    run_id: asString(output.diligence_run?.run_id || input.run_id || "unknown-run"),
    source_mode: asString(output.diligence_run?.source_mode || input.source_mode || "text"),
    compiler_status: asString(output.diligence_run?.compiler_status || "completed")
  };

  output.source_bundle_summary = asObject(output.source_bundle_summary);
  output.target_profile = asObject(output.target_profile || input.target_feature_profile?.target_profile);
  output.primary_product = asObject(output.primary_product || input.target_feature_profile?.primary_product);
  output.product_feature_map = asArray(output.product_feature_map).length ? output.product_feature_map : asArray(input.target_feature_profile?.product_feature_map);
  output.legal_stack = asArray(output.legal_stack).length ? output.legal_stack : asArray(input.legal_stack_review?.legal_stack);
  output.document_stack_redline = asArray(output.document_stack_redline).length ? output.document_stack_redline : asArray(input.legal_stack_review?.document_stack_redline);

  normalizeFindings(output, ledgerRows);
  normalizeThreatSummary(output, ledgerRows, operatorGate);
  output.feature_to_threat_matrix = collectFeatureRows(output, ledgerRows);
  normalizeAssemblyRoute(output);
  normalizeAuditLog(output, ledgerRows, operatorGate);
  normalizeThreatFindings(output);
  normalizeVaultQuestions(output);
  normalizeReportData(output, input);

  output.disclaimer = DISCLAIMER;

  return output;
}

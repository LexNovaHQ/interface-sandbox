import { createHash } from "node:crypto";

export const OPERATOR_CHALLENGE_INVENTORY_VERSION = "operator_challenge_inventory.v1";
export const OPERATOR_CHALLENGE_LAYER1_VERSION = "PHASE11_LAYER1_DETERMINISTIC_CROSS_PHASE_INVENTORY_v1";

const FORENSIC_INPUTS = Object.freeze([
  "target_profile_forensics",
  "target_feature_profile_forensics",
  "dap_forensics_profile",
  "exposure_registry_profile_forensics"
]);

const REQUIRED_SUBSTRATE = Object.freeze([
  "target_profile",
  "domain_derivation_profile",
  "target_feature_profile",
  "domain_control_obligation_profile",
  "active_threat_registry_manifest",
  "exposure_registry_route_plan",
  "exposure_registry_workpad_98",
  "exposure_registry_controlled_profile",
  "exposure_registry_triggered_profile",
  "data_provenance_profile_semantic_batch_gate"
]);

const MATERIAL_STATUSES = new Set([
  "TRIGGERED",
  "CONTROLLED_BY_VISIBLE_CONTROL",
  "CONTROLLED_BY_EXCLUSION",
  "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"
]);

export function buildOperatorChallengeInventory({ artifacts = {}, run = {} } = {}) {
  const substrate = buildSubstrateLedger(artifacts);
  const target = unwrap(artifacts.target_profile, "target_profile");
  const domain = unwrap(artifacts.domain_derivation_profile, "domain_derivation_profile");
  const activity = unwrap(artifacts.target_feature_profile, "target_feature_profile");
  const obligation = unwrap(artifacts.domain_control_obligation_profile, "domain_control_obligation_profile");
  const manifest = unwrap(artifacts.active_threat_registry_manifest, "active_threat_registry_manifest");
  const route = unwrap(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan");
  const workpad = unwrap(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98");
  const controlled = unwrap(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile");
  const triggered = unwrap(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile");

  const activities = extractActivities(activity);
  const obligations = extractObligations(obligation);
  const dataFields = extractDataFields(artifacts);
  const routeRows = asArray(route.route_rows).map(normalizeExposureRow);
  const workpadRows = asArray(workpad.registry_rows).map(normalizeExposureRow);
  const controlledRows = asArray(controlled.controlled_rows).map(normalizeExposureRow);
  const triggeredRows = asArray(triggered.triggered_rows).map(normalizeExposureRow);

  const crossLinks = buildCrossLinks({ activities, obligations, dataFields, exposureRows: workpadRows });
  const candidates = [];
  addSubstrateCandidates(candidates, substrate);
  addCustodyCandidates(candidates, { manifest, routeRows, workpadRows, controlledRows, triggeredRows });
  addActivityCoverageCandidates(candidates, { activities, routeRows });
  addDataCoverageCandidates(candidates, { dataFields, crossLinks });
  addObligationExposureCandidates(candidates, { obligations, workpadRows, crossLinks });
  addExposureQualityCandidates(candidates, workpadRows);
  addLimitationClusterCandidates(candidates, workpadRows);

  const normalizedCandidates = candidates
    .map((row, index) => ({
      challenge_candidate_id: `OCI-${String(index + 1).padStart(4, "0")}`,
      ...row,
      semantic_adjudication_required: row.candidate_class !== "CRITICAL_SUBSTRATE_CANDIDATE",
      layer1_is_final_conclusion: false
    }))
    .sort(candidateSort);

  const inventoryMaterial = {
    run_id: String(run.run_id || ""),
    target: run.target || run.root_url || run.target_url || null,
    primary_package: manifest.primary_package || null,
    mounted_packages: asArray(manifest.mounted_packages),
    phase10_execution_fingerprint: manifest.phase10_execution_fingerprint || null,
    substrate,
    profile_summaries: {
      target_profile_present: Boolean(Object.keys(target).length),
      domain_profile_present: Boolean(Object.keys(domain).length),
      activity_count: activities.length,
      data_field_count: dataFields.length,
      obligation_count: obligations.length,
      route_row_count: routeRows.length,
      workpad_row_count: workpadRows.length,
      controlled_row_count: controlledRows.length,
      triggered_row_count: triggeredRows.length
    },
    cross_phase_links: crossLinks,
    challenge_candidates: normalizedCandidates
  };

  const criticalCandidateCount = normalizedCandidates.filter((row) => row.candidate_class === "CRITICAL_SUBSTRATE_CANDIDATE").length;
  const materialCandidateCount = normalizedCandidates.filter((row) => row.candidate_class === "MATERIAL_FIELD_CANDIDATE").length;
  const advisoryCandidateCount = normalizedCandidates.filter((row) => row.candidate_class === "ADVISORY_CANDIDATE").length;

  return {
    operator_challenge_inventory: {
      schema_version: OPERATOR_CHALLENGE_INVENTORY_VERSION,
      layer_version: OPERATOR_CHALLENGE_LAYER1_VERSION,
      generated_by: "phase11_layer1_deterministic_cross_phase_inventory",
      generated_at: new Date().toISOString(),
      run_id: inventoryMaterial.run_id,
      target: inventoryMaterial.target,
      delivery_mode: "DERIVED_ONLY",
      forensic_inputs_used: false,
      creates_new_findings: false,
      rewrites_upstream_artifacts: false,
      final_adjudication_performed: false,
      reinvestigation_attempted: false,
      inventory_status: criticalCandidateCount ? "CRITICAL_SUBSTRATE_CANDIDATE_PRESENT" : "READY_FOR_SEMANTIC_CHALLENGE",
      critical_candidate_count: criticalCandidateCount,
      material_candidate_count: materialCandidateCount,
      advisory_candidate_count: advisoryCandidateCount,
      candidate_count: normalizedCandidates.length,
      inventory_fingerprint: sha256(canonicalize(inventoryMaterial)),
      ...inventoryMaterial,
      next_required_layer: "PHASE11_LAYER2_SEMANTIC_ADVERSARIAL_CHALLENGE"
    }
  };
}

function buildSubstrateLedger(artifacts) {
  const required = REQUIRED_SUBSTRATE.map((artifactName) => ({
    artifact_name: artifactName,
    present: Boolean(artifacts[artifactName]),
    accepted_status: acceptedStatus(statusOf(artifacts[artifactName])),
    observed_status: statusOf(artifacts[artifactName])
  }));
  const forbidden = FORENSIC_INPUTS.map((artifactName) => ({ artifact_name: artifactName, delivered: Object.prototype.hasOwnProperty.call(artifacts, artifactName) }));
  return {
    required_artifacts: required,
    missing_required_artifacts: required.filter((row) => !row.present).map((row) => row.artifact_name),
    unusable_required_artifacts: required.filter((row) => row.present && !row.accepted_status).map((row) => row.artifact_name),
    forbidden_forensic_inputs: forbidden.filter((row) => row.delivered).map((row) => row.artifact_name),
    status: required.every((row) => row.present && row.accepted_status) && forbidden.every((row) => !row.delivered) ? "PASS" : "CRITICAL_CANDIDATE"
  };
}

function addSubstrateCandidates(target, substrate) {
  for (const artifactName of substrate.missing_required_artifacts) target.push(candidate({
    candidate_class: "CRITICAL_SUBSTRATE_CANDIDATE",
    challenge_type: "REQUIRED_ARTIFACT_MISSING",
    affected_artifacts: [artifactName],
    affected_field_paths: [artifactName],
    contradiction_statement: `Required Phase 11 challenge substrate is missing: ${artifactName}`,
    deterministic_basis: ["required substrate manifest"],
    proposed_owner: ownerForArtifact(artifactName),
    proposed_reinvestigation_scope: "FULL_ARTIFACT_RECONSTRUCTION",
    criticality_reason: "Phase 11 cannot establish a trustworthy derived-only challenge substrate."
  }));
  for (const artifactName of substrate.unusable_required_artifacts) target.push(candidate({
    candidate_class: "CRITICAL_SUBSTRATE_CANDIDATE",
    challenge_type: "REQUIRED_ARTIFACT_UNUSABLE",
    affected_artifacts: [artifactName],
    affected_field_paths: [artifactName],
    contradiction_statement: `Required Phase 11 challenge substrate is not in an accepted state: ${artifactName}`,
    deterministic_basis: ["artifact lock/status ledger"],
    proposed_owner: ownerForArtifact(artifactName),
    proposed_reinvestigation_scope: "ARTIFACT_LOCK_OR_STRUCTURE",
    criticality_reason: "Continuing may produce a materially false cross-phase challenge."
  }));
  for (const artifactName of substrate.forbidden_forensic_inputs) target.push(candidate({
    candidate_class: "CRITICAL_SUBSTRATE_CANDIDATE",
    challenge_type: "FORENSIC_INPUT_BOUNDARY_BREACH",
    affected_artifacts: [artifactName],
    affected_field_paths: [artifactName],
    contradiction_statement: `Forbidden forensic artifact was delivered into Phase 11: ${artifactName}`,
    deterministic_basis: ["Phase 2G derived-only routing contract"],
    proposed_owner: "PHASE_2G_ROUTING",
    proposed_reinvestigation_scope: "ROUTE_PACKET_CUSTODY",
    criticality_reason: "The challenge would be contaminated by prohibited forensic inputs."
  }));
}

function addCustodyCandidates(target, { manifest, routeRows, workpadRows, controlledRows, triggeredRows }) {
  const expected = Number(manifest.expected_registry_row_key_count || manifest.expected_row_count || 0);
  for (const [label, rows] of [["route", routeRows], ["workpad", workpadRows]]) {
    const keys = rows.map((row) => row.registry_row_key).filter(Boolean);
    if (!expected || rows.length !== expected || new Set(keys).size !== expected) target.push(candidate({
      candidate_class: "CRITICAL_SUBSTRATE_CANDIDATE",
      challenge_type: "PHASE10_COMPOUND_CUSTODY_MISMATCH",
      affected_artifacts: [label === "route" ? "exposure_registry_route_plan" : "exposure_registry_workpad_98", "active_threat_registry_manifest"],
      affected_field_paths: [`${label}.registry_row_key`, "active_threat_registry_manifest.expected_registry_row_key_count"],
      contradiction_statement: `${label} compound-key custody does not reconcile to the active threat registry manifest.`,
      deterministic_basis: [`expected=${expected}`, `observed=${rows.length}`, `unique=${new Set(keys).size}`],
      proposed_owner: "PHASE_10_EXPOSURE_PROFILE",
      proposed_reinvestigation_scope: "COMPOUND_IDENTITY_RECONCILIATION",
      criticality_reason: "Cross-phase challenge cannot safely identify exposure rows."
    }));
  }
  const controlledKeys = new Set(controlledRows.map((row) => row.registry_row_key));
  const triggeredKeys = new Set(triggeredRows.map((row) => row.registry_row_key));
  for (const key of controlledKeys) if (triggeredKeys.has(key)) target.push(candidate({
    candidate_class: "CRITICAL_SUBSTRATE_CANDIDATE",
    challenge_type: "PHASE10_PROFILE_OVERLAP",
    affected_artifacts: ["exposure_registry_controlled_profile", "exposure_registry_triggered_profile"],
    affected_registry_row_keys: [key],
    affected_field_paths: ["controlled_rows[]", "triggered_rows[]"],
    contradiction_statement: `The same compound exposure row appears in both controlled and triggered profiles: ${key}`,
    deterministic_basis: ["compound-key profile membership"],
    proposed_owner: "PHASE_10_EXPOSURE_PROFILE",
    proposed_reinvestigation_scope: "FINAL_PROFILE_PROJECTION",
    criticality_reason: "The client-facing exposure conclusion would be internally contradictory."
  }));
}

function addActivityCoverageCandidates(target, { activities, routeRows }) {
  const linked = new Set(routeRows.flatMap((row) => row.matched_activity_references));
  for (const activity of activities) {
    if (!activity.activity_id || linked.has(activity.activity_id)) continue;
    target.push(candidate({
      candidate_class: "MATERIAL_FIELD_CANDIDATE",
      challenge_type: "ACTIVE_ACTIVITY_WITHOUT_EXPOSURE_LINK",
      affected_artifacts: ["target_feature_profile", "exposure_registry_route_plan"],
      affected_activity_ids: [activity.activity_id],
      affected_field_paths: [activity.field_path, "exposure_registry_route_plan.route_rows[].matched_activity_references"],
      contradiction_statement: `Active Phase 5 activity has no deterministic Phase 10 exposure linkage: ${activity.activity_id}`,
      deterministic_basis: activity.classification_tokens,
      proposed_owner: "PHASE_5_OR_PHASE_10",
      proposed_reinvestigation_scope: "ACTIVITY_CLASSIFICATION_OR_ROUTE_LINK",
      criticality_reason: null
    }));
  }
}

function addDataCoverageCandidates(target, { dataFields, crossLinks }) {
  const linkedData = new Set(crossLinks.data_practice_to_exposure.flatMap((row) => row.data_field_ids));
  for (const field of dataFields) {
    if (!field.material || linkedData.has(field.field_id)) continue;
    target.push(candidate({
      candidate_class: "MATERIAL_FIELD_CANDIDATE",
      challenge_type: "MATERIAL_DATA_PRACTICE_WITHOUT_EXPOSURE_LINK",
      affected_artifacts: [field.artifact_name, "exposure_registry_workpad_98"],
      affected_data_field_ids: [field.field_id],
      affected_field_paths: [field.field_path],
      contradiction_statement: `Material Phase 7 data-practice field has no deterministic exposure linkage: ${field.field_id}`,
      deterministic_basis: field.tokens,
      proposed_owner: "PHASE_7_OR_PHASE_10",
      proposed_reinvestigation_scope: "DATA_FIELD_OR_EXPOSURE_LINKAGE",
      criticality_reason: null
    }));
  }
}

function addObligationExposureCandidates(target, { obligations, workpadRows, crossLinks }) {
  const byObligation = new Map(crossLinks.obligation_to_exposure.flatMap((link) => link.obligation_ids.map((id) => [id, link])));
  for (const obligation of obligations) {
    const posture = obligation.control_posture_status;
    if (!new Set(["NOT_VISIBLE", "UNRESOLVED", "PARTIAL"]).has(posture)) continue;
    const link = byObligation.get(obligation.obligation_id);
    if (!link) {
      target.push(candidate({
        candidate_class: "MATERIAL_FIELD_CANDIDATE",
        challenge_type: "UNRESOLVED_OBLIGATION_WITHOUT_EXPOSURE_LINK",
        affected_artifacts: ["domain_control_obligation_profile", "exposure_registry_workpad_98"],
        affected_obligation_ids: [obligation.obligation_id],
        affected_field_paths: [obligation.field_path],
        contradiction_statement: `Unresolved or incomplete domain obligation has no deterministic exposure linkage: ${obligation.obligation_id}`,
        deterministic_basis: obligation.tokens,
        proposed_owner: "PHASE_8_OR_PHASE_10",
        proposed_reinvestigation_scope: "OBLIGATION_POSTURE_OR_EXPOSURE_LINKAGE",
        criticality_reason: null
      }));
      continue;
    }
    const linkedRows = workpadRows.filter((row) => link.registry_row_keys.includes(row.registry_row_key));
    for (const row of linkedRows) if (new Set(["CONTROLLED_BY_VISIBLE_CONTROL", "CONTROLLED_BY_EXCLUSION"]).has(row.final_material_status)) target.push(candidate({
      candidate_class: "MATERIAL_FIELD_CANDIDATE",
      challenge_type: "UNRESOLVED_OBLIGATION_VS_CONTROLLED_EXPOSURE",
      affected_artifacts: ["domain_control_obligation_profile", "exposure_registry_workpad_98"],
      affected_obligation_ids: [obligation.obligation_id],
      affected_registry_row_keys: [row.registry_row_key],
      affected_field_paths: [obligation.field_path, `exposure_registry_workpad_98.registry_rows[${row.registry_row_key}].final_material_status`],
      contradiction_statement: `Obligation ${obligation.obligation_id} remains ${posture} while linked exposure ${row.registry_row_key} is ${row.final_material_status}.`,
      deterministic_basis: link.match_tokens,
      proposed_owner: "PHASE_8_AND_PHASE_10",
      proposed_reinvestigation_scope: "CONTROL_POSTURE_AND_EXPOSURE_STATUS_BASIS",
      criticality_reason: null
    }));
  }
}

function addExposureQualityCandidates(target, rows) {
  for (const row of rows) {
    if (!MATERIAL_STATUSES.has(row.final_material_status)) continue;
    if (row.final_material_status === "TRIGGERED" && !row.review_route) target.push(exposureCandidate(row, "TRIGGERED_EXPOSURE_WITHOUT_REVIEW_ROUTE", "review_route", "Triggered exposure has no review route."));
    if (!row.remediation) target.push(exposureCandidate(row, "MATERIAL_EXPOSURE_WITHOUT_REMEDIATION", "remediation", "Material exposure has no remediation direction."));
    if (row.final_material_status === "CONTROLLED_BY_VISIBLE_CONTROL" && (!row.control_exclusion_evaluation || !row.evidence_source_basis)) target.push(exposureCandidate(row, "VISIBLE_CONTROL_WITHOUT_COMPLETE_SUPPORT", "control_exclusion_evaluation", "Visible-control conclusion lacks complete control/evidence support."));
    if (row.final_material_status === "CONTROLLED_BY_EXCLUSION" && !row.control_exclusion_evaluation) target.push(exposureCandidate(row, "EXCLUSION_WITHOUT_EXCLUSION_BASIS", "control_exclusion_evaluation", "Exclusion conclusion lacks an explicit exclusion basis."));
  }
}

function addLimitationClusterCandidates(target, rows) {
  const limited = rows.filter((row) => row.row_limitations.length > 0);
  if (limited.length < 3) return;
  const byPackage = groupBy(limited, (row) => row.package_id || "unknown");
  for (const [packageId, packageRows] of Object.entries(byPackage)) {
    if (packageRows.length < 3) continue;
    target.push(candidate({
      candidate_class: "ADVISORY_CANDIDATE",
      challenge_type: "MATERIAL_LIMITATION_CLUSTER",
      affected_artifacts: ["exposure_registry_workpad_98"],
      affected_registry_row_keys: packageRows.map((row) => row.registry_row_key),
      affected_field_paths: packageRows.map((row) => `exposure_registry_workpad_98.registry_rows[${row.registry_row_key}].row_limitations`),
      contradiction_statement: `${packageRows.length} material exposure rows in package ${packageId} carry limitations that may collectively affect report confidence.`,
      deterministic_basis: unique(packageRows.flatMap((row) => row.row_limitations)),
      proposed_owner: "PHASE_10_OR_COMPILER_PRESENTATION_ONLY",
      proposed_reinvestigation_scope: "LIMITATION_CLUSTER_REVIEW",
      criticality_reason: null
    }));
  }
}

function buildCrossLinks({ activities, obligations, dataFields, exposureRows }) {
  return {
    activity_to_exposure: linkEntities(activities, exposureRows, "activity_id", "registry_row_key"),
    data_practice_to_exposure: linkEntities(dataFields, exposureRows, "field_id", "registry_row_key").map((row) => ({ data_field_ids: row.left_ids, registry_row_keys: row.right_ids, match_tokens: row.match_tokens })),
    obligation_to_exposure: linkEntities(obligations, exposureRows, "obligation_id", "registry_row_key").map((row) => ({ obligation_ids: row.left_ids, registry_row_keys: row.right_ids, match_tokens: row.match_tokens }))
  };
}

function linkEntities(leftRows, rightRows, leftIdField, rightIdField) {
  const links = [];
  for (const left of leftRows) for (const right of rightRows) {
    const match = intersection(left.tokens || left.classification_tokens, right.tokens);
    if (!match.length) continue;
    links.push({ left_ids: [left[leftIdField]], right_ids: [right[rightIdField]], match_tokens: match });
  }
  return mergeLinks(links);
}

function mergeLinks(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.left_ids[0]}::${row.right_ids[0]}`;
    const current = map.get(key) || { left_ids: [], right_ids: [], match_tokens: [] };
    current.left_ids = unique([...current.left_ids, ...row.left_ids]);
    current.right_ids = unique([...current.right_ids, ...row.right_ids]);
    current.match_tokens = unique([...current.match_tokens, ...row.match_tokens]);
    map.set(key, current);
  }
  return [...map.values()];
}

function extractActivities(profile) {
  return asArray(profile.activities).map((row, index) => {
    const primary = row.primary_classification || {};
    const overlays = asArray(row.overlay_classifications);
    const activityId = string(row.activity_id || row.feature_id || row.id || `activity-${index + 1}`);
    const tokens = tokensFrom([activityId, row.activity_name, row.feature_name, row.description, primary.package_id, primary.archetype_codes, primary.surface_context_tokens, overlays]);
    return { activity_id: activityId, field_path: `target_feature_profile.activities[${index}]`, classification_tokens: tokens, tokens };
  });
}

function extractObligations(profile) {
  return asArray(profile.obligations).map((row, index) => ({
    obligation_id: string(row.obligation_id || row.id || `obligation-${index + 1}`),
    control_posture_status: string(row.control_posture_status || row.status).toUpperCase(),
    field_path: `domain_control_obligation_profile.obligations[${index}]`,
    tokens: tokensFrom([row.obligation_id, row.obligation_name, row.obligation, row.matched_behavior_codes, row.matched_surface_tokens, row.authority_dependency, row.regulatory_overlay_refs, row.control_posture_status])
  }));
}

function extractDataFields(artifacts) {
  const fields = [];
  for (const [artifactName, artifact] of Object.entries(artifacts)) {
    if (!artifactName.startsWith("dap_") || artifactName.includes("forensics")) continue;
    walk(unwrap(artifact, artifactName), artifactName, (value, path) => {
      if (!isPlainObject(value)) return;
      const fieldId = string(value.field_id || value.Field_ID || value.id || value.field_key);
      if (!fieldId) return;
      const status = string(value.status || value.derivation_status || value.value_status).toUpperCase();
      fields.push({
        field_id: `${artifactName}::${fieldId}`,
        artifact_name: artifactName,
        field_path: `${artifactName}.${path}`,
        material: !new Set(["NOT_APPLICABLE", "EMPTY", "UNRESOLVED_NON_MATERIAL"]).has(status),
        tokens: tokensFrom([fieldId, value.field_name, value.label, value.value, value.summary, value.category, value.status])
      });
    });
  }
  return dedupeBy(fields, (row) => row.field_id);
}

function normalizeExposureRow(row = {}) {
  const material = row.material_projection || row;
  const spine = row.deterministic_registry_spine || row.registry_row || {};
  const threatId = string(row.Threat_ID || material.Threat_ID || spine.Threat_ID);
  const packageId = string(row.package_id || material.package_id || spine.package_id);
  return {
    registry_row_key: string(row.registry_row_key || `${packageId}::${threatId}`),
    Threat_ID: threatId,
    package_id: packageId,
    stream_id: string(row.stream_id || material.stream_id),
    stream_type: string(row.stream_type || material.stream_type),
    final_material_status: string(row.final_material_status || row.evaluation_status || material.evaluation_status).toUpperCase(),
    review_route: string(material.review_route || row.review_route),
    remediation: string(material.remediation || row.remediation),
    control_exclusion_evaluation: string(material.control_exclusion_evaluation || row.control_exclusion_evaluation),
    evidence_source_basis: string(material.evidence_source_basis || row.evidence_source_basis),
    row_limitations: asArray(material.row_limitations || row.row_limitations).map(string).filter(Boolean),
    matched_activity_references: asArray(row.matched_activity_references).map(string).filter(Boolean),
    tokens: tokensFrom([threatId, material.Threat_Name, material.Archetype, material.Subcategory, material.Surface, material.Legal_Pain, material.authority_anchors, spine, row.route_reason])
  };
}

function exposureCandidate(row, challengeType, field, statement) {
  return candidate({
    candidate_class: "MATERIAL_FIELD_CANDIDATE",
    challenge_type: challengeType,
    affected_artifacts: ["exposure_registry_workpad_98"],
    affected_registry_row_keys: [row.registry_row_key],
    affected_field_paths: [`exposure_registry_workpad_98.registry_rows[${row.registry_row_key}].${field}`],
    contradiction_statement: `${statement} Row: ${row.registry_row_key}`,
    deterministic_basis: [row.final_material_status],
    proposed_owner: "PHASE_10_EXPOSURE_PROFILE",
    proposed_reinvestigation_scope: `FIELD:${field}`,
    criticality_reason: null
  });
}

function candidate(value) {
  return {
    candidate_class: value.candidate_class,
    challenge_type: value.challenge_type,
    affected_artifacts: unique(value.affected_artifacts),
    affected_field_paths: unique(value.affected_field_paths),
    affected_registry_row_keys: unique(value.affected_registry_row_keys),
    affected_activity_ids: unique(value.affected_activity_ids),
    affected_data_field_ids: unique(value.affected_data_field_ids),
    affected_obligation_ids: unique(value.affected_obligation_ids),
    contradiction_statement: value.contradiction_statement,
    deterministic_basis: unique(value.deterministic_basis),
    proposed_owner: value.proposed_owner,
    proposed_reinvestigation_scope: value.proposed_reinvestigation_scope,
    criticality_reason: value.criticality_reason || null
  };
}

function candidateSort(a, b) {
  const weight = { CRITICAL_SUBSTRATE_CANDIDATE: 0, MATERIAL_FIELD_CANDIDATE: 1, ADVISORY_CANDIDATE: 2 };
  return (weight[a.candidate_class] ?? 9) - (weight[b.candidate_class] ?? 9) || a.challenge_type.localeCompare(b.challenge_type) || a.contradiction_statement.localeCompare(b.contradiction_statement);
}

function ownerForArtifact(name) {
  if (name.includes("domain_derivation")) return "PHASE_3_DOMAIN_DERIVATION";
  if (name.includes("feature") || name.includes("activity")) return "PHASE_5_ACTIVITY_PROFILE";
  if (name.startsWith("dap_") || name.includes("data_provenance")) return "PHASE_7_DATA_PROVENANCE";
  if (name.includes("domain_control_obligation")) return "PHASE_8_DOMAIN_CONTROL_OBLIGATION";
  if (name.includes("exposure") || name.includes("threat_registry")) return "PHASE_10_EXPOSURE_PROFILE";
  return "PHASE_11_CHALLENGE_SUBSTRATE";
}

function acceptedStatus(value) {
  return new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE", "PASS", "PASS_WITH_LIMITATION", "PASS_WITH_LIMITATIONS"]).has(string(value).toUpperCase());
}

function statusOf(value) {
  const root = unwrapKnown(value);
  return string(value?.lock_status || root?.lock_status || root?.status || root?.validation_status || "LOCKED").toUpperCase();
}

function walk(value, path, visitor, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  visitor(value, path);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}[${index}]`, visitor, seen));
  else for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key, visitor, seen);
}

function tokensFrom(value) {
  return unique(flatten(value).flatMap((item) => string(item).toLowerCase().split(/[^a-z0-9]+/)).filter((token) => token.length >= 3 && !STOPWORDS.has(token)));
}

const STOPWORDS = new Set(["the", "and", "for", "with", "from", "that", "this", "into", "only", "true", "false", "null", "unknown", "active", "status"]);

function flatten(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (isPlainObject(value)) return Object.entries(value).flatMap(([key, item]) => [key, ...flatten(item)]);
  return [value];
}

function intersection(left, right) {
  const rightSet = new Set(asArray(right));
  return unique(asArray(left).filter((value) => rightSet.has(value)));
}

function groupBy(rows, keyFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    (acc[key] ||= []).push(row);
    return acc;
  }, {});
}

function dedupeBy(rows, keyFn) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = keyFn(row);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isPlainObject(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

function sha256(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function unwrapKnown(value) { if (!isPlainObject(value)) return value; const keys = Object.keys(value); return keys.length === 1 && isPlainObject(value[keys[0]]) ? value[keys[0]] : value; }
function asArray(value) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
function unique(value = []) { return [...new Set(asArray(value).flat(Infinity).map(string).filter(Boolean))]; }
function string(value) { return String(value ?? "").trim(); }
function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

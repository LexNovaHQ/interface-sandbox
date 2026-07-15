import { createHash } from "node:crypto";

export const OPERATOR_CHALLENGE_INVENTORY_VERSION = "operator_challenge_inventory.v1";
export const OPERATOR_CHALLENGE_LAYER1_VERSION = "PHASE11_LAYER1_DETERMINISTIC_CROSS_PHASE_INVENTORY_v1";

const REQUIRED = Object.freeze([
  "target_profile", "domain_derivation_profile", "target_feature_profile",
  "domain_control_obligation_profile", "active_threat_registry_manifest",
  "exposure_registry_route_plan", "exposure_registry_workpad_98",
  "exposure_registry_controlled_profile", "exposure_registry_triggered_profile",
  "data_provenance_profile_semantic_batch_gate"
]);
const FORENSICS = Object.freeze(["target_profile_forensics", "target_feature_profile_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics"]);
const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE", "PASS", "PASS_WITH_LIMITATION", "PASS_WITH_LIMITATIONS"]);
const MATERIAL = new Set(["TRIGGERED", "CONTROLLED_BY_VISIBLE_CONTROL", "CONTROLLED_BY_EXCLUSION", "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"]);
const UNRESOLVED_POSTURES = new Set(["NOT_VISIBLE", "UNRESOLVED", "PARTIAL"]);
const CONTROLLED_ASSERTIONS = new Set(["CONTROLLED_BY_VISIBLE_CONTROL", "CONTROLLED_BY_EXCLUSION"]);
const STOP = new Set(["the", "and", "for", "with", "from", "that", "this", "into", "only", "true", "false", "null", "unknown", "active", "status"]);

export function buildOperatorChallengeInventory({ artifacts = {}, run = {} } = {}) {
  const manifest = unwrap(artifacts.active_threat_registry_manifest, "active_threat_registry_manifest");
  const routeRows = rows(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan", "route_rows").map(exposureRow);
  const workpadRows = rows(artifacts.exposure_registry_workpad_98, "exposure_registry_workpad_98", "registry_rows").map(exposureRow);
  const controlledRows = rows(artifacts.exposure_registry_controlled_profile, "exposure_registry_controlled_profile", "controlled_rows").map(exposureRow);
  const triggeredRows = rows(artifacts.exposure_registry_triggered_profile, "exposure_registry_triggered_profile", "triggered_rows").map(exposureRow);
  const activities = extractActivities(unwrap(artifacts.target_feature_profile, "target_feature_profile"));
  const obligations = extractObligations(unwrap(artifacts.domain_control_obligation_profile, "domain_control_obligation_profile"));
  const dataFields = extractDataFields(artifacts);
  const substrate = substrateLedger(artifacts);
  const links = {
    activity_to_exposure: linksFor(activities, workpadRows, "activity_id"),
    data_practice_to_exposure: linksFor(dataFields, workpadRows, "field_id"),
    obligation_to_exposure: linksFor(obligations, workpadRows, "obligation_id")
  };

  const candidates = [];
  addSubstrateCandidates(candidates, substrate);
  addCustodyCandidates(candidates, { manifest, routeRows, workpadRows, controlledRows, triggeredRows });
  addActivityCandidates(candidates, activities, routeRows);
  addDataCandidates(candidates, dataFields, links.data_practice_to_exposure);
  addObligationCandidates(candidates, obligations, workpadRows, links.obligation_to_exposure);
  addExposureCandidates(candidates, workpadRows);
  addLimitationCandidates(candidates, workpadRows);

  const sorted = candidates.sort(candidateSort).map((row, index) => ({
    challenge_candidate_id: `OCI-${String(index + 1).padStart(4, "0")}`,
    ...row,
    semantic_adjudication_required: row.candidate_class !== "CRITICAL_SUBSTRATE_CANDIDATE",
    layer1_is_final_conclusion: false
  }));
  const material = {
    run_id: string(run.run_id),
    target: run.target || run.root_url || run.target_url || null,
    primary_package: manifest.primary_package || null,
    mounted_packages: array(manifest.mounted_packages),
    phase10_execution_fingerprint: manifest.phase10_execution_fingerprint || null,
    substrate,
    profile_summaries: {
      target_profile_present: Boolean(Object.keys(unwrap(artifacts.target_profile, "target_profile")).length),
      domain_profile_present: Boolean(Object.keys(unwrap(artifacts.domain_derivation_profile, "domain_derivation_profile")).length),
      activity_count: activities.length,
      data_field_count: dataFields.length,
      obligation_count: obligations.length,
      route_row_count: routeRows.length,
      workpad_row_count: workpadRows.length,
      controlled_row_count: controlledRows.length,
      triggered_row_count: triggeredRows.length
    },
    cross_phase_links: links,
    challenge_candidates: sorted
  };
  const counts = countBy(sorted, (row) => row.candidate_class);
  return { operator_challenge_inventory: {
    schema_version: OPERATOR_CHALLENGE_INVENTORY_VERSION,
    layer_version: OPERATOR_CHALLENGE_LAYER1_VERSION,
    generated_by: "phase11_layer1_deterministic_cross_phase_inventory",
    generated_at: new Date().toISOString(),
    delivery_mode: "DERIVED_ONLY",
    forensic_inputs_used: false,
    creates_new_findings: false,
    rewrites_upstream_artifacts: false,
    final_adjudication_performed: false,
    reinvestigation_attempted: false,
    inventory_status: (counts.CRITICAL_SUBSTRATE_CANDIDATE || 0) ? "CRITICAL_SUBSTRATE_CANDIDATE_PRESENT" : "READY_FOR_SEMANTIC_CHALLENGE",
    critical_candidate_count: counts.CRITICAL_SUBSTRATE_CANDIDATE || 0,
    material_candidate_count: counts.MATERIAL_FIELD_CANDIDATE || 0,
    advisory_candidate_count: counts.ADVISORY_CANDIDATE || 0,
    candidate_count: sorted.length,
    inventory_fingerprint: sha(material),
    ...material,
    next_required_layer: "PHASE11_LAYER2_SEMANTIC_ADVERSARIAL_CHALLENGE"
  } };
}

function substrateLedger(artifacts) {
  const required = REQUIRED.map((name) => ({ artifact_name: name, present: Boolean(artifacts[name]), observed_status: statusOf(artifacts[name]), accepted_status: ACCEPTED.has(statusOf(artifacts[name])) }));
  const forbidden = FORENSICS.filter((name) => Object.prototype.hasOwnProperty.call(artifacts, name));
  return {
    required_artifacts: required,
    missing_required_artifacts: required.filter((row) => !row.present).map((row) => row.artifact_name),
    unusable_required_artifacts: required.filter((row) => row.present && !row.accepted_status).map((row) => row.artifact_name),
    forbidden_forensic_inputs: forbidden,
    status: required.every((row) => row.present && row.accepted_status) && !forbidden.length ? "PASS" : "CRITICAL_CANDIDATE"
  };
}

function addSubstrateCandidates(out, substrate) {
  for (const name of substrate.missing_required_artifacts) out.push(makeCandidate("CRITICAL_SUBSTRATE_CANDIDATE", "REQUIRED_ARTIFACT_MISSING", [name], [name], `Required challenge substrate is missing: ${name}`, ["required substrate manifest"], owner(name), "FULL_ARTIFACT_RECONSTRUCTION", "A trustworthy derived-only challenge substrate cannot be established."));
  for (const name of substrate.unusable_required_artifacts) out.push(makeCandidate("CRITICAL_SUBSTRATE_CANDIDATE", "REQUIRED_ARTIFACT_UNUSABLE", [name], [name], `Required challenge substrate is not accepted: ${name}`, ["artifact lock/status ledger"], owner(name), "ARTIFACT_LOCK_OR_STRUCTURE", "Continuing may produce a materially false challenge."));
  for (const name of substrate.forbidden_forensic_inputs) out.push(makeCandidate("CRITICAL_SUBSTRATE_CANDIDATE", "FORENSIC_INPUT_BOUNDARY_BREACH", [name], [name], `Forbidden forensic input was delivered: ${name}`, ["Phase 2G derived-only contract"], "PHASE_2G_ROUTING", "ROUTE_PACKET_CUSTODY", "The challenge substrate is contaminated by a prohibited input."));
}

function addCustodyCandidates(out, { manifest, routeRows, workpadRows, controlledRows, triggeredRows }) {
  const expected = Number(manifest.expected_registry_row_key_count || manifest.expected_row_count || 0);
  for (const [label, artifactName, list] of [["route", "exposure_registry_route_plan", routeRows], ["workpad", "exposure_registry_workpad_98", workpadRows]]) {
    const keys = list.map((row) => row.registry_row_key).filter(Boolean);
    if (!expected || list.length !== expected || new Set(keys).size !== expected) out.push(makeCandidate("CRITICAL_SUBSTRATE_CANDIDATE", "PHASE10_COMPOUND_CUSTODY_MISMATCH", [artifactName, "active_threat_registry_manifest"], [`${label}.registry_row_key`, "active_threat_registry_manifest.expected_registry_row_key_count"], `${label} compound-key custody does not reconcile to the active manifest.`, [`expected=${expected}`, `observed=${list.length}`, `unique=${new Set(keys).size}`], "PHASE_10_EXPOSURE_PROFILE", "COMPOUND_IDENTITY_RECONCILIATION", "Exposure rows cannot be safely identified."));
  }
  const controlled = new Set(controlledRows.map(keyOf));
  const triggered = new Set(triggeredRows.map(keyOf));
  for (const key of controlled) if (triggered.has(key)) out.push({ ...makeCandidate("CRITICAL_SUBSTRATE_CANDIDATE", "PHASE10_PROFILE_OVERLAP", ["exposure_registry_controlled_profile", "exposure_registry_triggered_profile"], ["controlled_rows[]", "triggered_rows[]"], `Compound row appears in both profiles: ${key}`, ["compound-key profile membership"], "PHASE_10_EXPOSURE_PROFILE", "FINAL_PROFILE_PROJECTION", "The client-facing conclusion is internally contradictory."), affected_registry_row_keys: [key] });
}

function addActivityCandidates(out, activities, routeRows) {
  const linked = new Set(routeRows.flatMap((row) => row.matched_activity_references));
  for (const activity of activities) if (activity.activity_id && !linked.has(activity.activity_id)) out.push({ ...makeCandidate("MATERIAL_FIELD_CANDIDATE", "ACTIVE_ACTIVITY_WITHOUT_EXPOSURE_LINK", ["target_feature_profile", "exposure_registry_route_plan"], [activity.field_path, "exposure_registry_route_plan.route_rows[].matched_activity_references"], `Active Phase 5 activity has no deterministic exposure link: ${activity.activity_id}`, activity.tokens, "PHASE_5_OR_PHASE_10", "ACTIVITY_CLASSIFICATION_OR_ROUTE_LINK"), affected_activity_ids: [activity.activity_id] });
}

function addDataCandidates(out, fields, links) {
  const linked = new Set(links.flatMap((row) => row.left_ids));
  for (const field of fields) if (field.material && !linked.has(field.field_id)) out.push({ ...makeCandidate("MATERIAL_FIELD_CANDIDATE", "MATERIAL_DATA_PRACTICE_WITHOUT_EXPOSURE_LINK", [field.artifact_name, "exposure_registry_workpad_98"], [field.field_path], `Material Phase 7 field has no deterministic exposure link: ${field.field_id}`, field.tokens, "PHASE_7_OR_PHASE_10", "DATA_FIELD_OR_EXPOSURE_LINKAGE"), affected_data_field_ids: [field.field_id] });
}

function addObligationCandidates(out, obligations, workpadRows, links) {
  for (const obligation of obligations) {
    if (!UNRESOLVED_POSTURES.has(obligation.control_posture_status)) continue;
    const matching = links.filter((link) => link.left_ids.includes(obligation.obligation_id));
    const registryKeys = unique(matching.flatMap((link) => link.right_ids));
    const matchTokens = unique(matching.flatMap((link) => link.match_tokens));
    if (!registryKeys.length) {
      out.push({ ...makeCandidate("MATERIAL_FIELD_CANDIDATE", "UNRESOLVED_OBLIGATION_WITHOUT_EXPOSURE_LINK", ["domain_control_obligation_profile", "exposure_registry_workpad_98"], [obligation.field_path], `Unresolved obligation has no deterministic exposure link: ${obligation.obligation_id}`, obligation.tokens, "PHASE_8_OR_PHASE_10", "OBLIGATION_POSTURE_OR_EXPOSURE_LINKAGE"), affected_obligation_ids: [obligation.obligation_id] });
      continue;
    }
    for (const row of workpadRows.filter((item) => registryKeys.includes(item.registry_row_key) && CONTROLLED_ASSERTIONS.has(item.final_material_status))) out.push({
      ...makeCandidate("MATERIAL_FIELD_CANDIDATE", "UNRESOLVED_OBLIGATION_VS_CONTROLLED_EXPOSURE", ["domain_control_obligation_profile", "exposure_registry_workpad_98"], [obligation.field_path, `exposure_registry_workpad_98.registry_rows[${row.registry_row_key}].final_material_status`], `Obligation ${obligation.obligation_id} remains ${obligation.control_posture_status} while linked exposure ${row.registry_row_key} is ${row.final_material_status}.`, matchTokens, "PHASE_8_AND_PHASE_10", "CONTROL_POSTURE_AND_EXPOSURE_STATUS_BASIS"),
      affected_obligation_ids: [obligation.obligation_id], affected_registry_row_keys: [row.registry_row_key]
    });
  }
}

function addExposureCandidates(out, workpadRows) {
  for (const row of workpadRows) {
    if (!MATERIAL.has(row.final_material_status)) continue;
    if (row.final_material_status === "TRIGGERED" && !row.review_route) out.push(exposureCandidate(row, "TRIGGERED_EXPOSURE_WITHOUT_REVIEW_ROUTE", "review_route", "Triggered exposure has no review route."));
    if (!row.remediation) out.push(exposureCandidate(row, "MATERIAL_EXPOSURE_WITHOUT_REMEDIATION", "remediation", "Material exposure has no remediation direction."));
    if (row.final_material_status === "CONTROLLED_BY_VISIBLE_CONTROL" && (!row.control_exclusion_evaluation || !row.evidence_source_basis)) out.push(exposureCandidate(row, "VISIBLE_CONTROL_WITHOUT_COMPLETE_SUPPORT", "control_exclusion_evaluation", "Visible-control conclusion lacks complete support."));
    if (row.final_material_status === "CONTROLLED_BY_EXCLUSION" && !row.control_exclusion_evaluation) out.push(exposureCandidate(row, "EXCLUSION_WITHOUT_EXCLUSION_BASIS", "control_exclusion_evaluation", "Exclusion conclusion lacks an explicit exclusion basis."));
  }
}

function addLimitationCandidates(out, workpadRows) {
  const groups = groupBy(workpadRows.filter((row) => row.row_limitations.length), (row) => row.package_id || "unknown");
  for (const [packageId, list] of Object.entries(groups)) if (list.length >= 3) out.push({ ...makeCandidate("ADVISORY_CANDIDATE", "MATERIAL_LIMITATION_CLUSTER", ["exposure_registry_workpad_98"], list.map((row) => `exposure_registry_workpad_98.registry_rows[${row.registry_row_key}].row_limitations`), `${list.length} material exposure rows in package ${packageId} carry limitations that may collectively affect report confidence.`, unique(list.flatMap((row) => row.row_limitations)), "PHASE_10_OR_COMPILER_PRESENTATION_ONLY", "LIMITATION_CLUSTER_REVIEW"), affected_registry_row_keys: list.map(keyOf) });
}

function linksFor(left, right, idField) {
  const output = [];
  for (const lhs of left) for (const rhs of right) {
    const matches = intersection(lhs.tokens, rhs.tokens);
    if (matches.length) output.push({ left_ids: [lhs[idField]], right_ids: [rhs.registry_row_key], match_tokens: matches });
  }
  return output;
}

function extractActivities(profile) {
  return array(profile.activities).map((row, index) => ({
    activity_id: string(row.activity_id || row.feature_id || row.id || `activity-${index + 1}`),
    field_path: `target_feature_profile.activities[${index}]`,
    tokens: tokens([row.activity_id, row.activity_name, row.feature_name, row.description, row.primary_classification, row.overlay_classifications])
  }));
}

function extractObligations(profile) {
  return array(profile.obligations).map((row, index) => ({
    obligation_id: string(row.obligation_id || row.id || `obligation-${index + 1}`),
    control_posture_status: string(row.control_posture_status || row.status).toUpperCase(),
    field_path: `domain_control_obligation_profile.obligations[${index}]`,
    tokens: tokens([row.obligation_id, row.obligation_name, row.obligation, row.matched_behavior_codes, row.matched_surface_tokens, row.authority_dependency, row.regulatory_overlay_refs])
  }));
}

function extractDataFields(artifacts) {
  const output = [];
  for (const [artifactName, artifact] of Object.entries(artifacts)) {
    if (!artifactName.startsWith("dap_") || artifactName.includes("forensics")) continue;
    walk(unwrap(artifact, artifactName), artifactName, (value, path) => {
      if (!plain(value)) return;
      const id = string(value.field_id || value.Field_ID || value.id || value.field_key);
      if (!id) return;
      const status = string(value.status || value.derivation_status || value.value_status).toUpperCase();
      output.push({ field_id: `${artifactName}::${id}`, artifact_name: artifactName, field_path: `${artifactName}.${path}`, material: !new Set(["NOT_APPLICABLE", "EMPTY", "UNRESOLVED_NON_MATERIAL"]).has(status), tokens: tokens([id, value.field_name, value.label, value.value, value.summary, value.category]) });
    });
  }
  return dedupe(output, (row) => row.field_id);
}

function exposureRow(row = {}) {
  const material = row.material_projection || row;
  const spine = row.deterministic_registry_spine || row.registry_row || {};
  const threatId = string(row.Threat_ID || material.Threat_ID || spine.Threat_ID);
  const packageId = string(row.package_id || material.package_id || spine.package_id);
  return {
    registry_row_key: string(row.registry_row_key || `${packageId}::${threatId}`), Threat_ID: threatId, package_id: packageId,
    final_material_status: string(row.final_material_status || row.evaluation_status || material.evaluation_status).toUpperCase(),
    review_route: string(material.review_route || row.review_route), remediation: string(material.remediation || row.remediation),
    control_exclusion_evaluation: string(material.control_exclusion_evaluation || row.control_exclusion_evaluation), evidence_source_basis: string(material.evidence_source_basis || row.evidence_source_basis),
    row_limitations: array(material.row_limitations || row.row_limitations).map(string).filter(Boolean), matched_activity_references: array(row.matched_activity_references).map(string).filter(Boolean),
    tokens: tokens([threatId, material.Threat_Name, material.Archetype, material.Subcategory, material.Surface, material.Legal_Pain, material.authority_anchors, spine, row.route_reason])
  };
}

function exposureCandidate(row, type, field, statement) { return { ...makeCandidate("MATERIAL_FIELD_CANDIDATE", type, ["exposure_registry_workpad_98"], [`exposure_registry_workpad_98.registry_rows[${row.registry_row_key}].${field}`], `${statement} Row: ${row.registry_row_key}`, [row.final_material_status], "PHASE_10_EXPOSURE_PROFILE", `FIELD:${field}`), affected_registry_row_keys: [row.registry_row_key] }; }
function makeCandidate(candidate_class, challenge_type, affected_artifacts, affected_field_paths, contradiction_statement, deterministic_basis, proposed_owner, proposed_reinvestigation_scope, criticality_reason = null) { return { candidate_class, challenge_type, affected_artifacts: unique(affected_artifacts), affected_field_paths: unique(affected_field_paths), affected_registry_row_keys: [], affected_activity_ids: [], affected_data_field_ids: [], affected_obligation_ids: [], contradiction_statement, deterministic_basis: unique(deterministic_basis), proposed_owner, proposed_reinvestigation_scope, criticality_reason }; }
function candidateSort(a, b) { const rank = { CRITICAL_SUBSTRATE_CANDIDATE: 0, MATERIAL_FIELD_CANDIDATE: 1, ADVISORY_CANDIDATE: 2 }; return (rank[a.candidate_class] ?? 9) - (rank[b.candidate_class] ?? 9) || a.challenge_type.localeCompare(b.challenge_type) || a.contradiction_statement.localeCompare(b.contradiction_statement); }
function owner(name) { if (name.includes("domain_derivation")) return "PHASE_3_DOMAIN_DERIVATION"; if (name.includes("feature")) return "PHASE_5_ACTIVITY_PROFILE"; if (name.startsWith("dap_") || name.includes("data_provenance")) return "PHASE_7_DATA_PROVENANCE"; if (name.includes("domain_control_obligation")) return "PHASE_8_DOMAIN_CONTROL_OBLIGATION"; if (name.includes("exposure") || name.includes("threat_registry")) return "PHASE_10_EXPOSURE_PROFILE"; return "PHASE_11_CHALLENGE_SUBSTRATE"; }
function rows(artifact, root, field) { return array(unwrap(artifact, root)?.[field]); }
function statusOf(value) { const root = unwrapKnown(value); return string(value?.lock_status || root?.lock_status || root?.status || root?.validation_status || "LOCKED").toUpperCase(); }
function tokens(value) { return unique(flatten(value).flatMap((item) => string(item).toLowerCase().split(/[^a-z0-9]+/)).filter((token) => token.length >= 3 && !STOP.has(token))); }
function flatten(value) { if (value == null) return []; if (Array.isArray(value)) return value.flatMap(flatten); if (plain(value)) return Object.entries(value).flatMap(([key, item]) => [key, ...flatten(item)]); return [value]; }
function intersection(left, right) { const set = new Set(array(right)); return unique(array(left).filter((value) => set.has(value))); }
function walk(value, path, visitor, seen = new Set()) { if (!value || typeof value !== "object" || seen.has(value)) return; seen.add(value); visitor(value, path); if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}[${index}]`, visitor, seen)); else for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key, visitor, seen); }
function groupBy(list, fn) { return list.reduce((acc, row) => { (acc[fn(row)] ||= []).push(row); return acc; }, {}); }
function countBy(list, fn) { return list.reduce((acc, row) => { const key = fn(row); acc[key] = (acc[key] || 0) + 1; return acc; }, {}); }
function dedupe(list, fn) { const seen = new Set(); return list.filter((row) => { const key = fn(row); if (!key || seen.has(key)) return false; seen.add(key); return true; }); }
function canonical(value) { if (Array.isArray(value)) return value.map(canonical); if (plain(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])); return value; }
function sha(value) { return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
function keyOf(row) { return string(row.registry_row_key); }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value || {}; }
function unwrapKnown(value) { if (!plain(value)) return value; const keys = Object.keys(value); return keys.length === 1 && plain(value[keys[0]]) ? value[keys[0]] : value; }
function array(value) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
function unique(value = []) { return [...new Set(array(value).flat(Infinity).map(string).filter(Boolean))]; }
function string(value) { return String(value ?? "").trim(); }
function plain(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

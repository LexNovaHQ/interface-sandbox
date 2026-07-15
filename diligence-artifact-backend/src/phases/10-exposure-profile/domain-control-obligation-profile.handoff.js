import {
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS,
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
  DOMAIN_CONTROL_OBLIGATION_M11_HANDOFF_FIELDS,
  assertAcceptedDomainControlObligationHandoffStatus
} from "../08-domain-control-obligation-profile/domain-control-obligation-downstream-handoff.contract.js";

const SOURCE_ARTIFACT = "domain_control_obligation_profile";

export const M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF_STATUS = Object.freeze({
  handoff: "phase8-domain-control-obligation-to-m11",
  handoff_version: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
  consumer: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.exposure,
  context_only: true,
  threat_creation_allowed: false,
  threat_routing_allowed: false,
  registry_replacement_allowed: false,
  phase8_control_is_m11_control_proof: false,
  phase8_authority_dependency_is_legal_applicability: false
});

export function buildM11DomainControlObligationHandoff({
  domainControlObligationProfile,
  sourceLockStatus = "LOCKED",
  activeThreatRows = []
} = {}) {
  const lockStatus = assertAcceptedDomainControlObligationHandoffStatus(sourceLockStatus);
  const profile = unwrapArtifact(domainControlObligationProfile, SOURCE_ARTIFACT);
  assertProfile(profile);

  const obligations = profile.obligations.map((row) => pick(row, DOMAIN_CONTROL_OBLIGATION_M11_HANDOFF_FIELDS));
  const links = normalizeArray(activeThreatRows).filter(isPlainObject).map((threatRow) => linkThreatRow(threatRow, obligations));
  const linkedObligationIds = new Set(links.flatMap((row) => row.obligation_contexts.map((item) => item.obligation_id)));
  const unlinkedObligationIds = obligations
    .map((row) => normalizeId(row.obligation_id))
    .filter((id) => id && !linkedObligationIds.has(id));

  const limitations = uniqueStrings([
    ...(profile.profile_level_limitations || []),
    ...(activeThreatRows.length ? [] : ["M11_ACTIVE_THREAT_BATCH_NOT_SUPPLIED_FOR_CONTEXT_LINKING"]),
    ...(unlinkedObligationIds.length ? [`PHASE8_OBLIGATIONS_WITHOUT_EXACT_M11_CONTEXT_LINK:${unlinkedObligationIds.length}`] : [])
  ]);

  return deepFreeze({
    handoff_type: "m11_domain_control_obligation_context",
    handoff_version: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
    source_artifact: SOURCE_ARTIFACT,
    source_schema_version: normalizeId(profile.schema_version),
    source_lock_status: lockStatus,
    context_role: "DERIVED_CONTEXT_ONLY_NOT_TRIGGER_OR_CONTROL_PROOF",
    profile_summary: summarizeProfile(obligations),
    obligation_context_rows: obligations,
    active_threat_context_links: links,
    unlinked_obligation_ids: unlinkedObligationIds,
    handoff_limitations: limitations,
    usage_boundary: Object.freeze({
      may_create_threat_rows: false,
      may_change_route_plan: false,
      may_change_batch_membership: false,
      may_replace_hunter_trigger: false,
      may_replace_primary_m11_evidence: false,
      may_treat_visible_phase8_control_as_automatic_exposure_control: false,
      may_use_authority_dependency_as_applicability_conclusion: false,
      may_use_regulatory_overlay_ref_as_jurisdiction_conclusion: false,
      m11_must_validate_control_against_its_own_primary_evidence: true,
      m11_output_schema_unchanged: true
    })
  });
}

function linkThreatRow(threatRow, obligations) {
  const threatId = normalizeId(threatRow.Threat_ID || threatRow.threat_id);
  const threatAuthority = uniqueStrings([
    threatRow.authority_anchors,
    threatRow.Authority_IN,
    threatRow.Authority_EU,
    threatRow.Authority_US
  ]);
  const threatBehavior = uniqueStrings([threatRow.Archetype, threatRow.Subcategory]);
  const threatSurface = uniqueStrings([threatRow.Surface]);

  const obligationContexts = [];
  for (const obligation of obligations) {
    const authorityMatches = intersection(threatAuthority, obligation.authority_dependency);
    const behaviorMatches = intersection(threatBehavior, obligation.matched_behavior_codes);
    const surfaceMatches = intersection(threatSurface, obligation.matched_surface_tokens);
    if (!authorityMatches.length && !behaviorMatches.length && !surfaceMatches.length) continue;

    obligationContexts.push({
      ...clonePlain(obligation),
      context_link_basis: {
        authority_token_matches: authorityMatches,
        behavior_token_matches: behaviorMatches,
        surface_token_matches: surfaceMatches,
        exact_token_match_only: true,
        context_link_is_not_exposure_trigger: true
      }
    });
  }

  return {
    Threat_ID: threatId,
    obligation_contexts: obligationContexts,
    matched_obligation_ids: obligationContexts.map((row) => row.obligation_id),
    link_status: obligationContexts.length ? "CONTEXT_LINKED" : "NO_EXACT_CONTEXT_LINK",
    route_or_status_changed: false
  };
}

function summarizeProfile(rows) {
  const summary = {
    obligation_count: rows.length,
    visible_control_count: 0,
    partial_control_count: 0,
    not_visible_control_count: 0,
    unresolved_control_count: 0,
    missing_proof_row_count: 0,
    limited_row_count: 0,
    regulatory_overlay_reference_count: 0
  };

  for (const row of rows) {
    if (row.control_posture_status === "VISIBLE") summary.visible_control_count += 1;
    if (row.control_posture_status === "PARTIAL") summary.partial_control_count += 1;
    if (row.control_posture_status === "NOT_VISIBLE") summary.not_visible_control_count += 1;
    if (row.control_posture_status === "UNRESOLVED") summary.unresolved_control_count += 1;
    if (normalizeArray(row.missing_proof).length) summary.missing_proof_row_count += 1;
    if (normalizeArray(row.limitation).length) summary.limited_row_count += 1;
    summary.regulatory_overlay_reference_count += normalizeArray(row.regulatory_overlay_refs).length;
  }

  return summary;
}

function assertProfile(profile) {
  if (!isPlainObject(profile)) throw new Error("M11_DOMAIN_CONTROL_OBLIGATION_PROFILE_MISSING");
  if (profile.artifact_type !== SOURCE_ARTIFACT) throw new Error(`M11_DOMAIN_CONTROL_OBLIGATION_ARTIFACT_TYPE_MISMATCH:${profile.artifact_type || "missing"}`);
  if (!Array.isArray(profile.obligations)) throw new Error("M11_DOMAIN_CONTROL_OBLIGATION_ROWS_MISSING");
  if (Number(profile.obligation_count) !== profile.obligations.length) throw new Error("M11_DOMAIN_CONTROL_OBLIGATION_COUNT_MISMATCH");
}

function pick(value, fields) {
  return Object.fromEntries(fields.map((field) => [field, clonePlain(value?.[field]) ]));
}

function intersection(left, right) {
  const rightSet = new Set(uniqueStrings(right).map(normalizeToken));
  return uniqueStrings(left).filter((value) => rightSet.has(normalizeToken(value)));
}

function unwrapArtifact(value, artifactName) {
  if (isPlainObject(value?.[artifactName])) return value[artifactName];
  if (value?.artifact_type === artifactName) return value;
  if (isPlainObject(value?.artifact)) return unwrapArtifact(value.artifact, artifactName);
  return value || {};
}

function clonePlain(value) {
  if (Array.isArray(value)) return value.map(clonePlain);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clonePlain(item)]));
  return value;
}

function normalizeArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function uniqueStrings(value) {
  return [...new Set(normalizeArray(value).flat(Infinity).map(normalizeId).filter(Boolean))];
}

function normalizeToken(value) {
  return normalizeId(value).toUpperCase();
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

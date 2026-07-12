export const PHASE11_OWNER_ADJUDICATION_VERSION = "phase11_owner_adjudication.v1";

export const PHASE11_OWNER_LABELS = Object.freeze({
  PHASE_3_DOMAIN_DERIVATION: "PHASE_3_DOMAIN_DERIVATION",
  PHASE_5_ACTIVITY_PROFILE: "PHASE_5_ACTIVITY_PROFILE",
  PHASE_7_DATA_PROVENANCE: "PHASE_7_DATA_PROVENANCE",
  PHASE_8_DOMAIN_CONTROL_OBLIGATION: "PHASE_8_DOMAIN_CONTROL_OBLIGATION",
  PHASE_10_EXPOSURE_PROFILE: "PHASE_10_EXPOSURE_PROFILE",
  PHASE_2G_ROUTING: "PHASE_2G_ROUTING",
  COMPILER_PRESENTATION_ONLY: "COMPILER_PRESENTATION_ONLY",
  PHASE_11_OPERATOR_CHALLENGE_REVIEW: "PHASE_11_OPERATOR_CHALLENGE_REVIEW"
});

const OWNER_PATTERNS = Object.freeze([
  [PHASE11_OWNER_LABELS.PHASE_3_DOMAIN_DERIVATION, /PHASE[_\s-]*3|DOMAIN_DERIVATION|domain_derivation_profile/i],
  [PHASE11_OWNER_LABELS.PHASE_5_ACTIVITY_PROFILE, /PHASE[_\s-]*5|ACTIVITY_PROFILE|FEATURE_PROFILE|target_feature_profile/i],
  [PHASE11_OWNER_LABELS.PHASE_7_DATA_PROVENANCE, /PHASE[_\s-]*7|DATA_PROVENANCE|DAP|dap_/i],
  [PHASE11_OWNER_LABELS.PHASE_8_DOMAIN_CONTROL_OBLIGATION, /PHASE[_\s-]*8|DOMAIN_CONTROL_OBLIGATION|OBLIGATION|domain_control_obligation_profile/i],
  [PHASE11_OWNER_LABELS.PHASE_10_EXPOSURE_PROFILE, /PHASE[_\s-]*10|EXPOSURE|M11|exposure_registry/i],
  [PHASE11_OWNER_LABELS.PHASE_2G_ROUTING, /PHASE[_\s-]*2G|ROUTING|phase_routing_manifest/i],
  [PHASE11_OWNER_LABELS.COMPILER_PRESENTATION_ONLY, /COMPILER|RENDERER|REPORT/i]
]);

const ARTIFACT_OWNER = Object.freeze({
  domain_derivation_profile: PHASE11_OWNER_LABELS.PHASE_3_DOMAIN_DERIVATION,
  target_feature_profile: PHASE11_OWNER_LABELS.PHASE_5_ACTIVITY_PROFILE,
  feature_candidate_inventory: PHASE11_OWNER_LABELS.PHASE_5_ACTIVITY_PROFILE,
  dap_semantic_batch_validation_manifest: PHASE11_OWNER_LABELS.PHASE_7_DATA_PROVENANCE,
  data_provenance_profile_semantic_batch_gate: PHASE11_OWNER_LABELS.PHASE_7_DATA_PROVENANCE,
  domain_control_obligation_profile: PHASE11_OWNER_LABELS.PHASE_8_DOMAIN_CONTROL_OBLIGATION,
  domain_control_obligation_candidate_inventory: PHASE11_OWNER_LABELS.PHASE_8_DOMAIN_CONTROL_OBLIGATION,
  exposure_registry_workpad_98: PHASE11_OWNER_LABELS.PHASE_10_EXPOSURE_PROFILE,
  exposure_registry_controlled_profile: PHASE11_OWNER_LABELS.PHASE_10_EXPOSURE_PROFILE,
  exposure_registry_triggered_profile: PHASE11_OWNER_LABELS.PHASE_10_EXPOSURE_PROFILE,
  exposure_registry_profile_forensics: PHASE11_OWNER_LABELS.PHASE_10_EXPOSURE_PROFILE
});

export function resolvePhase11Owner({ candidate = {}, semantic = {}, priorAttempts = [] } = {}) {
  const proposedText = `${candidate.proposed_owner || ""} ${semantic.proposed_owner || ""}`;
  const textOwners = ownersFromText(proposedText);
  const artifactOwners = ownersFromArtifacts(candidate.affected_artifacts);
  const fieldOwners = ownersFromFields(candidate.affected_field_paths);
  const candidateOwners = unique([...artifactOwners, ...fieldOwners, ...textOwners]);
  const relation = /\bAND\b|_AND_|\+/i.test(proposedText) ? "AND" : /\bOR\b|_OR_|\//i.test(proposedText) ? "OR" : candidateOwners.length > 1 ? "OR" : "SINGLE";
  const owner = choosePrimaryOwner({ candidateOwners, artifactOwners, fieldOwners, priorAttempts });
  return Object.freeze({
    schema_version: PHASE11_OWNER_ADJUDICATION_VERSION,
    owner,
    owner_relation: relation,
    owner_candidates: candidateOwners,
    primary_owner_basis: basisFor(owner, { artifactOwners, fieldOwners, textOwners }),
    alternate_owner_basis: candidateOwners.filter((item) => item !== owner).map((item) => ({ owner: item, basis: basisFor(item, { artifactOwners, fieldOwners, textOwners }) })),
    deterministic_owner_selection: true,
    substring_order_owner_selection_forbidden: true
  });
}

function choosePrimaryOwner({ candidateOwners, artifactOwners, fieldOwners, priorAttempts }) {
  const attemptedOwners = new Set((priorAttempts || []).map((row) => row.owning_phase).filter(Boolean));
  const owner = firstUnattempted([...fieldOwners, ...artifactOwners, ...candidateOwners], attemptedOwners);
  return owner || candidateOwners[0] || PHASE11_OWNER_LABELS.PHASE_11_OPERATOR_CHALLENGE_REVIEW;
}
function firstUnattempted(owners, attempted) {
  for (const owner of unique(owners)) if (!attempted.has(owner)) return owner;
  return unique(owners)[0] || "";
}
function basisFor(owner, { artifactOwners, fieldOwners, textOwners }) {
  const basis = [];
  if (artifactOwners.includes(owner)) basis.push("affected_artifact_owner");
  if (fieldOwners.includes(owner)) basis.push("affected_field_path_owner");
  if (textOwners.includes(owner)) basis.push("semantic_or_candidate_owner_text");
  return basis;
}
function ownersFromArtifacts(value) {
  const out = [];
  for (const artifact of array(value)) {
    const text = String(artifact || "");
    if (ARTIFACT_OWNER[text]) out.push(ARTIFACT_OWNER[text]);
    else if (/^dap_semantic_batch_/i.test(text)) out.push(PHASE11_OWNER_LABELS.PHASE_7_DATA_PROVENANCE);
    else if (/^exposure_registry_batch/i.test(text)) out.push(PHASE11_OWNER_LABELS.PHASE_10_EXPOSURE_PROFILE);
  }
  return unique(out);
}
function ownersFromFields(value) { return ownersFromText(array(value).join(" ")); }
function ownersFromText(value) {
  const text = String(value || "");
  const out = [];
  for (const [owner, pattern] of OWNER_PATTERNS) if (pattern.test(text)) out.push(owner);
  return unique(out);
}
function array(value) { return Array.isArray(value) ? value : []; }
function unique(value) { return [...new Set((value || []).filter(Boolean).map(String))]; }

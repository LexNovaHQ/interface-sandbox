import {
  FEATURE_CANDIDATE_FIELDS,
  SEMANTIC_PROPOSAL_FIELDS,
  SEMANTIC_PROPOSED_CANDIDATE_FIELDS,
  SEMANTIC_SUPPORT_ACTIONS,
  SEMANTIC_SUPPORT_RECEIPT_FIELDS,
  SEMANTIC_SUPPORT_STATUSES
} from "../activity-profile.constants.js";

const POINTER_FIELDS = Object.freeze([
  "source_artifact", "source_id", "source_root", "route_class", "route_code",
  "locator_id", "unit_id", "source_pointer", "unit_pointer"
]);

export const SEMANTIC_CANDIDATE_SUPPORT_REJECTION_CODES = Object.freeze({
  UNSUPPORTED_SEMANTIC_ACTION: "UNSUPPORTED_SEMANTIC_ACTION",
  UNKNOWN_TARGET_CANDIDATE: "UNKNOWN_TARGET_CANDIDATE",
  UNROUTED_SOURCE_POINTER: "UNROUTED_SOURCE_POINTER",
  UNINDEXED_SOURCE_POINTER: "UNINDEXED_SOURCE_POINTER",
  UNAUTHORIZED_SOURCE_ROOT: "UNAUTHORIZED_SOURCE_ROOT",
  EVIDENCE_TEXT_FORBIDDEN: "EVIDENCE_TEXT_FORBIDDEN",
  PACKAGE_TAXONOMY_FORBIDDEN: "PACKAGE_TAXONOMY_FORBIDDEN",
  CONFIDENCE_FIELD_FORBIDDEN: "CONFIDENCE_FIELD_FORBIDDEN",
  LEGAL_ANALYSIS_FORBIDDEN: "LEGAL_ANALYSIS_FORBIDDEN",
  UNGROUNDED_PROPOSED_CANDIDATE: "UNGROUNDED_PROPOSED_CANDIDATE",
  DUPLICATE_PROPOSAL_ID: "DUPLICATE_PROPOSAL_ID",
  MALFORMED_PROPOSAL: "MALFORMED_PROPOSAL"
});
const R = SEMANTIC_CANDIDATE_SUPPORT_REJECTION_CODES;
const URL = /^https?:\/\//i;
const EVIDENCE_KEYS = new Set(["excerpt","quote","text","body","content","markdown","html","lossless_text","clean_text","mechanics_proof","evidence_summary","activity_candidate_summary","archetype_proof","surface_proof_and_routing_limits"]);
const TAXONOMY_KEYS = new Set(["package_id","overlay_id","taxonomy","taxonomy_code","behavior_class","archetype","archetype_code","archetype_codes","archetype_derivation_basis","surface","surface_token","surface_context_tokens","surface_derivation_basis","primary_classification","overlay_classifications","compliance_framework","lane"]);
const LEGAL_KEYS = new Set(["legal_analysis","regulatory_analysis","legal_conclusion","regulatory_conclusion","compliance_conclusion","legal_pain","authority","authorities","statute","statutes","case_law","case_name","liability_analysis","applicability_analysis"]);
const CONFIDENCE_KEY = /(^|_)(confidence|probability|certainty|score)(_|$)/i;

export function validateSemanticCandidateSupportProposal({ proposal, deterministicBaseline, routedArtifactNames = [], indexLocatorRows = [], indexMappedUnitIds = [], permittedEvidenceRoots = [] } = {}) {
  const errors = [];
  const baseline = unwrap(deterministicBaseline);
  const ids = new Set(rows(baseline.candidates).map((c) => c.candidate_id));
  const authority = pointerAuthority({ baseline, routedArtifactNames, indexLocatorRows, indexMappedUnitIds, permittedEvidenceRoots });
  if (!plain(proposal) || !exactKeys(proposal, SEMANTIC_PROPOSAL_FIELDS)) errors.push(R.MALFORMED_PROPOSAL);
  errors.push(...forbiddenCodes(proposal));
  const p = normalizeProposal(proposal);
  if (!p.proposal_id || !Array.isArray(proposal?.target_candidate_ids) || !Array.isArray(proposal?.proposed_candidates) || !Array.isArray(proposal?.source_pointers)) errors.push(R.MALFORMED_PROPOSAL);
  if (!SEMANTIC_SUPPORT_ACTIONS.includes(p.action)) errors.push(R.UNSUPPORTED_SEMANTIC_ACTION);
  if (!shapeOk(p)) errors.push(R.MALFORMED_PROPOSAL);
  for (const id of p.target_candidate_ids) if (!ids.has(id)) errors.push(R.UNKNOWN_TARGET_CANDIDATE);
  for (const c of p.proposed_candidates) if (!plain(c) || !exactKeys(c, SEMANTIC_PROPOSED_CANDIDATE_FIELDS) || !candidateValuesOk(c)) errors.push(R.MALFORMED_PROPOSAL);
  if (!p.source_pointers.length) errors.push(R.UNGROUNDED_PROPOSED_CANDIDATE);
  for (const pointer of p.source_pointers) errors.push(...validatePointer(pointer, authority));
  const roots = new Set(p.source_pointers.map((x) => x.source_root));
  const routes = new Set(p.source_pointers.map((x) => x.route_class));
  for (const c of p.proposed_candidates) if (!roots.has(c.source_root) || !routes.has(c.activity_route_class)) errors.push(R.UNGROUNDED_PROPOSED_CANDIDATE);
  if (p.action === "RENAME_CANDIDATE" && p.target_candidate_ids.length === 1 && p.proposed_candidates.length === 1) {
    const current = rows(baseline.candidates).find((c) => c.candidate_id === p.target_candidate_ids[0]);
    const next = p.proposed_candidates[0];
    if (current && (next.candidate_type !== current.candidate_type || next.activity_route_class !== current.activity_route_class || next.capability_key !== current.capability_key || next.source_root !== current.source_root)) errors.push(R.MALFORMED_PROPOSAL);
  }
  const rejection_codes = Object.freeze(unique(errors));
  return Object.freeze({
    status: rejection_codes.length ? "REJECTED" : "ACCEPTED",
    proposal_id: str(proposal?.proposal_id) || null,
    rejection_codes,
    normalized_proposal: rejection_codes.length ? null : p
  });
}

export function reconcileSemanticCandidateSupport({ deterministicBaseline, proposals, semanticProposalInput, routedArtifactNames = [], indexLocatorRows = [], indexMappedUnitIds = [], permittedEvidenceRoots = [] } = {}) {
  const baseline = unwrap(deterministicBaseline);
  const list = proposalPacket(proposals ?? semanticProposalInput);
  const counts = proposalIdCounts(list);
  const rejected = [];
  const valid = [];
  for (const raw of [...list].sort(compareProposals)) {
    const id = str(raw?.proposal_id) || null;
    if (id && counts.get(id) > 1) { rejected.push(rejection(id, [R.DUPLICATE_PROPOSAL_ID])); continue; }
    const v = validateSemanticCandidateSupportProposal({ proposal: raw, deterministicBaseline: baseline, routedArtifactNames, indexLocatorRows, indexMappedUnitIds, permittedEvidenceRoots });
    if (v.status === "ACCEPTED") valid.push(v.normalized_proposal);
    else rejected.push(rejection(v.proposal_id, v.rejection_codes));
  }
  const state = new Map(rows(baseline.candidates).map((c) => [c.candidate_id, cloneCandidate(c)]));
  const accepted = [];
  let changed = false;
  for (const p of valid) {
    if (p.target_candidate_ids.some((id) => !state.has(id))) { rejected.push(rejection(p.proposal_id, [R.UNKNOWN_TARGET_CANDIDATE])); continue; }
    const result = apply(p, state);
    if (!result.applied) { rejected.push(rejection(p.proposal_id, [R.MALFORMED_PROPOSAL])); continue; }
    accepted.push(p.proposal_id); changed ||= result.changed;
  }
  const candidates = finalize([...state.values()]);
  const baseInventory = Object.freeze({
    ...baseline,
    canonical_candidate_count: candidates.length,
    candidates: Object.freeze(candidates),
    canonicalization_index: Object.freeze(candidates.map((c) => Object.freeze({ candidate_id: c.candidate_id, canonical_feature_key: c.canonical_feature_key, merged_raw_hit_ids: c.merged_raw_hit_ids }))),
    dedup_summary: Object.freeze({
      merged_duplicate_count: rows(baseline.dedup_index).length,
      parent_child_overlap_count: rows(baseline.parent_child_overlap_index).length
    })
  });
  const receipt = buildSemanticSupportReceipt({ deterministicBaseline: baseline, proposalCount: list.length, acceptedProposalIds: accepted, rejectedProposals: rejected, finalInventory: baseInventory, changesApplied: changed });
  const inventory = Object.freeze({ ...baseInventory, semantic_support_receipt: receipt });
  return Object.freeze({ inventory, receipt, accepted_proposal_ids: receipt.accepted_proposal_ids, rejected_proposals: receipt.rejected_proposals });
}

export function buildSemanticSupportReceipt({ deterministicBaseline, proposalCount = 0, acceptedProposalIds = [], rejectedProposals = [], finalInventory, changesApplied = false, limitations = [] } = {}) {
  const accepted = unique(acceptedProposalIds);
  const rejected = Object.freeze(arr(rejectedProposals).map((x) => rejection(x?.proposal_id, x?.rejection_codes || x?.reasons || [R.MALFORMED_PROPOSAL])));
  const count = Math.max(Number(proposalCount) || 0, accepted.length + rejected.length);
  const status = changesApplied && accepted.length ? "APPLIED" : count === 0 || accepted.length ? "NO_CHANGES" : "OUTPUT_REJECTED";
  return receipt({
    attempted: true,
    status,
    deterministic_baseline_count: rows(unwrap(deterministicBaseline).candidates).length,
    proposal_count: count,
    accepted_count: accepted.length,
    rejected_count: rejected.length,
    accepted_proposal_ids: accepted,
    rejected_proposals: rejected,
    final_candidate_count: rows(unwrap(finalInventory).candidates).length,
    limitations: unique([...arr(limitations), ...(rejected.length && accepted.length ? ["SEMANTIC_SUPPORT_PARTIAL_REJECTION"] : []), ...(rejected.length && !accepted.length ? ["SEMANTIC_SUPPORT_OUTPUT_REJECTED"] : [])])
  });
}

export function buildSemanticSupportUnavailableReceipt({ deterministicBaseline, limitation = "SEMANTIC_SUPPORT_PROVIDER_UNAVAILABLE" } = {}) {
  const count = rows(unwrap(deterministicBaseline).candidates).length;
  return receipt({ attempted: true, status: "UNAVAILABLE", deterministic_baseline_count: count, proposal_count: 0, accepted_count: 0, rejected_count: 0, accepted_proposal_ids: [], rejected_proposals: [], final_candidate_count: count, limitations: unique([limitation]) });
}

function apply(p, state) {
  if (p.action === "REJECT_CANDIDATE") { state.delete(p.target_candidate_ids[0]); return { applied: true, changed: true }; }
  if (p.action === "RENAME_CANDIDATE") {
    const id = p.target_candidate_ids[0], current = state.get(id), next = p.proposed_candidates[0];
    const changed = current.candidate_name !== next.candidate_name;
    state.set(id, { ...current, candidate_name: next.candidate_name, candidate_status: changed ? "SEMANTICALLY_RECONCILED_CANDIDATE" : current.candidate_status, source_pointers: pointerUnion(current.source_pointers, p.source_pointers) });
    return { applied: true, changed };
  }
  if (p.action === "RECOVER_CANDIDATE") {
    p.proposed_candidates.forEach((c, i) => state.set(`SEM.${p.proposal_id}.${i + 1}`, fromProposal(c, p.source_pointers)));
    return { applied: true, changed: true };
  }
  if (p.action === "MERGE_CANDIDATES") {
    const targets = p.target_candidate_ids.map((id) => state.get(id));
    p.target_candidate_ids.forEach((id) => state.delete(id));
    state.set(`SEM.${p.proposal_id}.1`, fromProposal(p.proposed_candidates[0], pointerUnion(targets.flatMap((c) => c.source_pointers), p.source_pointers), targets.flatMap((c) => c.merged_raw_hit_ids)));
    return { applied: true, changed: true };
  }
  if (p.action === "SPLIT_CANDIDATE") {
    const current = state.get(p.target_candidate_ids[0]); state.delete(p.target_candidate_ids[0]);
    p.proposed_candidates.forEach((c, i) => state.set(`SEM.${p.proposal_id}.${i + 1}`, fromProposal(c, pointerUnion(current.source_pointers, p.source_pointers), current.merged_raw_hit_ids)));
    return { applied: true, changed: true };
  }
  return { applied: false, changed: false };
}

function fromProposal(c, pointers, rawIds = []) {
  return {
    candidate_id: "",
    canonical_feature_key: key(c.activity_route_class, c.capability_key),
    candidate_name: c.candidate_name,
    candidate_type: c.candidate_type,
    candidate_status: "SEMANTICALLY_RECONCILED_CANDIDATE",
    activity_route_class: c.activity_route_class,
    capability_key: slug(c.capability_key),
    source_root: c.source_root,
    evidence_grounded: true,
    mandatory_profile_treatment: "PACKAGE_AWARE_ACTIVITY_REVIEW_OR_LIMITATION",
    merged_raw_hit_ids: Object.freeze(unique(rawIds)),
    source_pointers: pointerUnion(pointers)
  };
}

function finalize(input) {
  const byKey = new Map();
  for (const raw of input) {
    const c = { ...raw, canonical_feature_key: key(raw.activity_route_class, raw.capability_key), capability_key: slug(raw.capability_key), evidence_grounded: true, merged_raw_hit_ids: Object.freeze(unique(raw.merged_raw_hit_ids)), source_pointers: pointerUnion(raw.source_pointers) };
    if (!byKey.has(c.canonical_feature_key)) byKey.set(c.canonical_feature_key, c);
    else {
      const old = byKey.get(c.canonical_feature_key);
      byKey.set(c.canonical_feature_key, { ...old, candidate_name: [old.candidate_name, c.candidate_name].sort()[0], candidate_status: "SEMANTICALLY_RECONCILED_CANDIDATE", merged_raw_hit_ids: Object.freeze(unique([...old.merged_raw_hit_ids, ...c.merged_raw_hit_ids])), source_pointers: pointerUnion(old.source_pointers, c.source_pointers) });
    }
  }
  return [...byKey.values()].sort((a, b) => a.canonical_feature_key.localeCompare(b.canonical_feature_key) || a.candidate_name.localeCompare(b.candidate_name)).map((c, i) => Object.freeze(Object.fromEntries(FEATURE_CANDIDATE_FIELDS.map((field) => [field, field === "candidate_id" ? `FC.${String(i + 1).padStart(3, "0")}` : c[field]]))));
}

function pointerAuthority({ baseline, routedArtifactNames, indexLocatorRows, indexMappedUnitIds, permittedEvidenceRoots }) {
  const baselinePointers = [...rows(baseline.raw_feature_hit_index).map((x) => x?.source_pointer), ...rows(baseline.context_pointer_index), ...rows(baseline.candidates).flatMap((x) => rows(x.source_pointers))].filter(plain);
  const locatorPointers = arr(indexLocatorRows).map(locatorPointer).filter(plain);
  const pointers = locatorPointers.length ? locatorPointers : baselinePointers;
  const artifacts = unique(routedArtifactNames), units = unique(indexMappedUnitIds), roots = unique(permittedEvidenceRoots);
  return {
    artifacts: new Set(artifacts.length ? artifacts : unique(pointers.map((p) => p.source_artifact))),
    units: new Set(units.length ? units : unique(pointers.map((p) => p.unit_id))),
    roots: new Set(roots.length ? roots : unique([...arr(baseline?.deterministic_baseline_metadata?.evidence_roots_opened), ...pointers.map((p) => p.source_root)])),
    fingerprints: new Set(pointers.map(fingerprint))
  };
}

function validatePointer(pointer, authority) {
  if (!plain(pointer) || !exactKeys(pointer, POINTER_FIELDS)) return [R.MALFORMED_PROPOSAL];
  const errors = [];
  if (!pointer.source_artifact || !pointer.source_root || !pointer.route_class || !pointer.route_code || !pointer.locator_id || !pointer.unit_id) errors.push(R.MALFORMED_PROPOSAL);
  if (!authority.roots.has(pointer.source_root)) errors.push(R.UNAUTHORIZED_SOURCE_ROOT);
  if (!authority.artifacts.has(pointer.source_artifact)) errors.push(R.UNROUTED_SOURCE_POINTER);
  if (!authority.units.has(pointer.unit_id) || !authority.fingerprints.has(fingerprint(pointer))) errors.push(R.UNINDEXED_SOURCE_POINTER);
  return unique(errors);
}

function forbiddenCodes(value) {
  const out = new Set();
  walk(value, (k, v) => {
    const key = String(k || "").toLowerCase();
    if (EVIDENCE_KEYS.has(key)) out.add(R.EVIDENCE_TEXT_FORBIDDEN);
    if (TAXONOMY_KEYS.has(key)) out.add(R.PACKAGE_TAXONOMY_FORBIDDEN);
    if (LEGAL_KEYS.has(key)) out.add(R.LEGAL_ANALYSIS_FORBIDDEN);
    if (CONFIDENCE_KEY.test(key)) out.add(R.CONFIDENCE_FIELD_FORBIDDEN);
    if (typeof v === "string" && URL.test(v) && !["source_pointer", "unit_pointer"].includes(key)) out.add(R.UNROUTED_SOURCE_POINTER);
  });
  return [...out];
}

function normalizeProposal(p) {
  return Object.freeze({
    proposal_id: str(p?.proposal_id), action: str(p?.action).toUpperCase(),
    target_candidate_ids: Object.freeze(unique(p?.target_candidate_ids)),
    proposed_candidates: Object.freeze(arr(p?.proposed_candidates).map((c) => Object.freeze({ candidate_name: str(c?.candidate_name), candidate_type: str(c?.candidate_type), activity_route_class: str(c?.activity_route_class), capability_key: slug(c?.capability_key), source_root: str(c?.source_root) }))),
    source_pointers: Object.freeze(arr(p?.source_pointers).map((x) => Object.freeze({ source_artifact: str(x?.source_artifact), source_id: str(x?.source_id), source_root: str(x?.source_root), route_class: str(x?.route_class), route_code: str(x?.route_code), locator_id: str(x?.locator_id), unit_id: str(x?.unit_id), source_pointer: pointerValue(x?.source_pointer), unit_pointer: pointerValue(x?.unit_pointer) })))
  });
}

function shapeOk(p) {
  const t = p.target_candidate_ids.length, c = p.proposed_candidates.length;
  if (p.action === "RECOVER_CANDIDATE") return t === 0 && c >= 1;
  if (p.action === "MERGE_CANDIDATES") return t >= 2 && c === 1;
  if (p.action === "SPLIT_CANDIDATE") return t === 1 && c >= 2;
  if (p.action === "RENAME_CANDIDATE") return t === 1 && c === 1;
  if (p.action === "REJECT_CANDIDATE") return t === 1 && c === 0;
  return false;
}
function candidateValuesOk(c) { return SEMANTIC_PROPOSED_CANDIDATE_FIELDS.every((f) => { const v = str(c[f]); return v && v.length <= 200 && !URL.test(v); }); }
function locatorPointer(x) { return plain(x) ? { source_artifact: str(x.source_artifact), source_id: str(x.source_id), source_root: str(x.source_root || x.common_root), route_class: str(x.route_class), route_code: str(x.route_code), locator_id: str(x.locator_id), unit_id: str(x.unit_id), source_pointer: pointerValue(x.source_pointer), unit_pointer: pointerValue(x.unit_pointer) } : null; }
function fingerprint(x) { return POINTER_FIELDS.map((f) => scalar(x?.[f])).join("|"); }
function pointerUnion(...groups) { const map = new Map(); for (const x of groups.flat(Infinity).filter(plain)) map.set(fingerprint(x), Object.freeze(locatorPointer(x))); return Object.freeze([...map.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([,v]) => v)); }
function cloneCandidate(c) { return { ...c, merged_raw_hit_ids: Object.freeze(unique(c.merged_raw_hit_ids)), source_pointers: pointerUnion(c.source_pointers) }; }
function proposalPacket(x) { if (Array.isArray(x)) return x; if (Array.isArray(x?.proposals)) return x.proposals; if (Array.isArray(x?.semantic_candidate_support_proposals)) return x.semantic_candidate_support_proposals; return x == null ? [] : [x]; }
function proposalIdCounts(list) { const m = new Map(); for (const p of list) { const id = str(p?.proposal_id); if (id) m.set(id, (m.get(id) || 0) + 1); } return m; }
function compareProposals(a,b) { return str(a?.proposal_id).localeCompare(str(b?.proposal_id)) || stable(a).localeCompare(stable(b)); }
function rejection(id,codes) { return Object.freeze({ proposal_id: id || null, rejection_codes: Object.freeze(unique(codes)) }); }
function receipt(x) { if (!SEMANTIC_SUPPORT_STATUSES.includes(x.status)) throw new Error(`INVALID_SEMANTIC_SUPPORT_STATUS:${x.status || "missing"}`); const n = { ...x, accepted_proposal_ids: Object.freeze(unique(x.accepted_proposal_ids)), rejected_proposals: Object.freeze(arr(x.rejected_proposals)), limitations: Object.freeze(unique(x.limitations)) }; return Object.freeze(Object.fromEntries(SEMANTIC_SUPPORT_RECEIPT_FIELDS.map((f) => [f, n[f]]))); }
function unwrap(x) { if (plain(x?.feature_candidate_inventory)) return x.feature_candidate_inventory; if (plain(x?.inventory)) return x.inventory; return plain(x) ? x : {}; }
function exactKeys(x, expected) { return plain(x) && JSON.stringify(Object.keys(x).sort()) === JSON.stringify([...expected].sort()); }
function rows(x) { return Array.isArray(x) ? x : []; }
function arr(x) { return Array.isArray(x) ? x : x == null ? [] : [x]; }
function unique(x) { return [...new Set(arr(x).flat(Infinity).map(str).filter(Boolean))]; }
function str(x) { return typeof x === "string" ? x.trim().slice(0,500) : ""; }
function slug(x) { return str(x).toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").replace(/-{2,}/g,"-"); }
function key(route,capability) { return `${str(route)}::${slug(capability)}`; }
function pointerValue(x) { return x == null ? null : ["string","number","boolean"].includes(typeof x) ? x : stable(x); }
function scalar(x) { return x == null ? "" : typeof x === "object" ? stable(x) : String(x); }
function stable(x) { if (Array.isArray(x)) return `[${x.map(stable).join(",")}]`; if (plain(x)) return `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${stable(x[k])}`).join(",")}}`; return JSON.stringify(x); }
function walk(x, visit, seen = new Set()) { if (!x || typeof x !== "object" || seen.has(x)) return; seen.add(x); if (Array.isArray(x)) return x.forEach((v,i) => { visit(String(i),v); walk(v,visit,seen); }); for (const [k,v] of Object.entries(x)) { visit(k,v); walk(v,visit,seen); } }
function plain(x) { return Boolean(x) && typeof x === "object" && !Array.isArray(x); }

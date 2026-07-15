import {
  FEATURE_CANDIDATE_FIELDS,
  SEMANTIC_PROPOSAL_FIELDS,
  SEMANTIC_PROPOSED_CANDIDATE_FIELDS,
  SEMANTIC_SUPPORT_ACTIONS,
  SEMANTIC_SUPPORT_RECEIPT_FIELDS,
  SEMANTIC_SUPPORT_STATUSES
} from "../activity-profile.constants.js";

const SEMANTIC_PACKET_TOP_LEVEL_KEY = "semantic_candidate_support_proposal";
const SEMANTIC_PACKET_FIELDS = Object.freeze([
  "proposal_version",
  "proposals",
  "limitations"
]);

const POINTER_FIELDS = Object.freeze([
  "source_artifact",
  "source_id",
  "source_root",
  "route_class",
  "route_code",
  "locator_id",
  "unit_id",
  "source_pointer",
  "unit_pointer"
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
const EVIDENCE_KEYS = new Set([
  "excerpt",
  "quote",
  "text",
  "body",
  "content",
  "markdown",
  "html",
  "lossless_text",
  "clean_text",
  "mechanics_proof",
  "evidence_summary",
  "activity_candidate_summary",
  "archetype_proof",
  "surface_proof_and_routing_limits"
]);
const TAXONOMY_KEYS = new Set([
  "package_id",
  "overlay_id",
  "taxonomy",
  "taxonomy_code",
  "behavior_class",
  "archetype",
  "archetype_code",
  "archetype_codes",
  "archetype_derivation_basis",
  "surface",
  "surface_token",
  "surface_context_tokens",
  "surface_derivation_basis",
  "primary_classification",
  "overlay_classifications",
  "compliance_framework",
  "lane"
]);
const LEGAL_KEYS = new Set([
  "legal_analysis",
  "regulatory_analysis",
  "legal_conclusion",
  "regulatory_conclusion",
  "compliance_conclusion",
  "legal_pain",
  "authority",
  "authorities",
  "statute",
  "statutes",
  "case_law",
  "case_name",
  "liability_analysis",
  "applicability_analysis"
]);
const CONFIDENCE_KEY = /(^|_)(confidence|probability|certainty|score)(_|$)/i;

export function validateSemanticCandidateSupportProposal({
  proposal,
  deterministicBaseline,
  routedArtifactNames = [],
  indexLocatorRows = [],
  indexMappedUnitIds = [],
  permittedEvidenceRoots = []
} = {}) {
  const errors = [];
  const baseline = unwrapInventory(deterministicBaseline);
  const ids = new Set(rows(baseline.candidates).map((candidate) => candidate.candidate_id));
  const authority = pointerAuthority({
    baseline,
    routedArtifactNames,
    indexLocatorRows,
    indexMappedUnitIds,
    permittedEvidenceRoots
  });

  if (!plain(proposal) || !exactKeys(proposal, SEMANTIC_PROPOSAL_FIELDS)) {
    errors.push(R.MALFORMED_PROPOSAL);
  }

  errors.push(...forbiddenCodes(proposal));

  const normalized = normalizeProposal(proposal);
  if (!normalized.proposal_id || !Array.isArray(proposal?.target_candidate_ids) || !Array.isArray(proposal?.proposed_candidates) || !Array.isArray(proposal?.source_pointers)) {
    errors.push(R.MALFORMED_PROPOSAL);
  }
  if (!SEMANTIC_SUPPORT_ACTIONS.includes(normalized.action)) {
    errors.push(R.UNSUPPORTED_SEMANTIC_ACTION);
  }
  if (!shapeOk(normalized)) {
    errors.push(R.MALFORMED_PROPOSAL);
  }

  for (const id of normalized.target_candidate_ids) {
    if (!ids.has(id)) errors.push(R.UNKNOWN_TARGET_CANDIDATE);
  }

  for (const candidate of normalized.proposed_candidates) {
    if (!plain(candidate) || !exactKeys(candidate, SEMANTIC_PROPOSED_CANDIDATE_FIELDS) || !candidateValuesOk(candidate)) {
      errors.push(R.MALFORMED_PROPOSAL);
    }
  }

  if (!normalized.source_pointers.length && normalized.action !== "REJECT_CANDIDATE") {
    errors.push(R.UNGROUNDED_PROPOSED_CANDIDATE);
  }

  for (const pointer of normalized.source_pointers) {
    errors.push(...validatePointer(pointer, authority));
  }

  const pointerRoots = new Set(normalized.source_pointers.map((pointer) => pointer.source_root));
  const pointerRoutes = new Set(normalized.source_pointers.map((pointer) => pointer.route_class));
  for (const candidate of normalized.proposed_candidates) {
    if (!pointerRoots.has(candidate.source_root) || !pointerRoutes.has(candidate.activity_route_class)) {
      errors.push(R.UNGROUNDED_PROPOSED_CANDIDATE);
    }
  }

  if (normalized.action === "RENAME_CANDIDATE" && normalized.target_candidate_ids.length === 1 && normalized.proposed_candidates.length === 1) {
    const current = rows(baseline.candidates).find((candidate) => candidate.candidate_id === normalized.target_candidate_ids[0]);
    const next = normalized.proposed_candidates[0];
    if (current && (
      next.candidate_type !== current.candidate_type ||
      next.activity_route_class !== current.activity_route_class ||
      next.capability_key !== current.capability_key ||
      next.source_root !== current.source_root
    )) {
      errors.push(R.MALFORMED_PROPOSAL);
    }
  }

  const rejection_codes = Object.freeze(unique(errors));
  return Object.freeze({
    status: rejection_codes.length ? "REJECTED" : "ACCEPTED",
    proposal_id: str(proposal?.proposal_id) || null,
    action: str(proposal?.action).toUpperCase() || null,
    rejection_codes,
    pointer_identifiers: pointerIdentifiers(proposal?.source_pointers),
    normalized_proposal: rejection_codes.length ? null : normalized
  });
}

export function reconcileSemanticCandidateSupport({
  deterministicBaseline,
  semanticProposalInput,
  routedArtifactNames = [],
  indexLocatorRows = [],
  indexMappedUnitIds = [],
  permittedEvidenceRoots = []
} = {}) {
  const baseline = unwrapInventory(deterministicBaseline);
  const parsed = parseSemanticProposalPacket(semanticProposalInput);

  if (parsed.status !== "ACCEPTED") {
    const receipt = buildSemanticSupportReceipt({
      deterministicBaseline: baseline,
      proposalCount: 1,
      acceptedProposalIds: [],
      rejectedProposals: [
        rejection({
          proposal_id: null,
          action: null,
          rejection_codes: parsed.rejection_codes,
          pointer_identifiers: []
        })
      ],
      finalInventory: baseline,
      changesApplied: false,
      limitations: ["SEMANTIC_SUPPORT_PACKET_REJECTED"]
    });
    return Object.freeze({
      inventory: Object.freeze({ ...baseline, semantic_support_receipt: receipt }),
      receipt,
      accepted_proposal_ids: receipt.accepted_proposal_ids,
      rejected_proposals: receipt.rejected_proposals
    });
  }

  const proposalList = parsed.packet.proposals;
  const proposalCounts = proposalIdCounts(proposalList);
  const rejected = [];
  const valid = [];

  for (const rawProposal of [...proposalList].sort(compareProposals)) {
    const proposalId = str(rawProposal?.proposal_id) || null;
    if (proposalId && proposalCounts.get(proposalId) > 1) {
      rejected.push(rejection({
        proposal_id: proposalId,
        action: str(rawProposal?.action).toUpperCase() || null,
        rejection_codes: [R.DUPLICATE_PROPOSAL_ID],
        pointer_identifiers: pointerIdentifiers(rawProposal?.source_pointers)
      }));
      continue;
    }

    const validation = validateSemanticCandidateSupportProposal({
      proposal: rawProposal,
      deterministicBaseline: baseline,
      routedArtifactNames,
      indexLocatorRows,
      indexMappedUnitIds,
      permittedEvidenceRoots
    });

    if (validation.status === "ACCEPTED") {
      valid.push(validation.normalized_proposal);
    } else {
      rejected.push(rejection(validation));
    }
  }

  const state = new Map(rows(baseline.candidates).map((candidate) => [candidate.candidate_id, cloneCandidate(candidate)]));
  const acceptedProposalIds = [];
  let changed = false;

  for (const proposal of valid) {
    if (proposal.target_candidate_ids.some((id) => !state.has(id))) {
      rejected.push(rejection({
        proposal_id: proposal.proposal_id,
        action: proposal.action,
        rejection_codes: [R.UNKNOWN_TARGET_CANDIDATE],
        pointer_identifiers: pointerIdentifiers(proposal.source_pointers)
      }));
      continue;
    }

    const result = applyProposal(proposal, state);
    if (!result.applied) {
      rejected.push(rejection({
        proposal_id: proposal.proposal_id,
        action: proposal.action,
        rejection_codes: [R.MALFORMED_PROPOSAL],
        pointer_identifiers: pointerIdentifiers(proposal.source_pointers)
      }));
      continue;
    }

    acceptedProposalIds.push(proposal.proposal_id);
    changed ||= result.changed;
  }

  const candidates = finalizeCandidates([...state.values()]);
  const baseInventory = Object.freeze({
    ...baseline,
    canonical_candidate_count: candidates.length,
    candidates: Object.freeze(candidates),
    canonicalization_index: Object.freeze(candidates.map((candidate) => Object.freeze({
      candidate_id: candidate.candidate_id,
      canonical_feature_key: candidate.canonical_feature_key,
      merged_raw_hit_ids: candidate.merged_raw_hit_ids
    }))),
    dedup_summary: Object.freeze({
      ...(baseline.dedup_summary || {}),
      semantic_reconciliation_applied: changed === true
    })
  });

  const receipt = buildSemanticSupportReceipt({
    deterministicBaseline: baseline,
    proposalCount: proposalList.length,
    acceptedProposalIds,
    rejectedProposals: rejected,
    finalInventory: baseInventory,
    changesApplied: changed,
    limitations: parsed.packet.limitations
  });
  const inventory = Object.freeze({ ...baseInventory, semantic_support_receipt: receipt });

  return Object.freeze({
    inventory,
    receipt,
    accepted_proposal_ids: receipt.accepted_proposal_ids,
    rejected_proposals: receipt.rejected_proposals
  });
}

export function buildSemanticSupportReceipt({
  deterministicBaseline,
  proposalCount = 0,
  acceptedProposalIds = [],
  rejectedProposals = [],
  finalInventory,
  changesApplied = false,
  limitations = []
} = {}) {
  const accepted = unique(acceptedProposalIds);
  const rejected = Object.freeze(rows(rejectedProposals).map((entry) => rejection(entry)));
  const count = Math.max(Number(proposalCount) || 0, accepted.length + rejected.length);
  const status = changesApplied && accepted.length
    ? "APPLIED"
    : count === 0 || accepted.length
      ? "NO_CHANGES"
      : "OUTPUT_REJECTED";

  return receipt({
    attempted: true,
    status,
    deterministic_baseline_count: rows(unwrapInventory(deterministicBaseline).candidates).length,
    proposal_count: count,
    accepted_count: accepted.length,
    rejected_count: rejected.length,
    accepted_proposal_ids: accepted,
    rejected_proposals: rejected,
    final_candidate_count: rows(unwrapInventory(finalInventory).candidates).length,
    limitations: unique([
      ...rows(limitations),
      ...(rejected.length && accepted.length ? ["SEMANTIC_SUPPORT_PARTIAL_REJECTION"] : []),
      ...(rejected.length && !accepted.length ? ["SEMANTIC_SUPPORT_OUTPUT_REJECTED"] : [])
    ])
  });
}

export function buildSemanticSupportUnavailableReceipt({
  deterministicBaseline,
  limitation = "SEMANTIC_SUPPORT_PROVIDER_UNAVAILABLE"
} = {}) {
  const count = rows(unwrapInventory(deterministicBaseline).candidates).length;
  return receipt({
    attempted: true,
    status: "UNAVAILABLE",
    deterministic_baseline_count: count,
    proposal_count: 0,
    accepted_count: 0,
    rejected_count: 0,
    accepted_proposal_ids: [],
    rejected_proposals: [],
    final_candidate_count: count,
    limitations: unique([limitation])
  });
}

function parseSemanticProposalPacket(input) {
  if (!plain(input) || !exactKeys(input, [SEMANTIC_PACKET_TOP_LEVEL_KEY])) {
    return packetRejected([R.MALFORMED_PROPOSAL]);
  }

  const packet = input[SEMANTIC_PACKET_TOP_LEVEL_KEY];
  const errors = [];

  if (!plain(packet) || !exactKeys(packet, SEMANTIC_PACKET_FIELDS)) {
    errors.push(R.MALFORMED_PROPOSAL);
  }
  if (!(typeof packet?.proposal_version === "string" && packet.proposal_version.trim())) {
    errors.push(R.MALFORMED_PROPOSAL);
  }
  if (!Array.isArray(packet?.proposals)) {
    errors.push(R.MALFORMED_PROPOSAL);
  }
  if (!Array.isArray(packet?.limitations)) {
    errors.push(R.MALFORMED_PROPOSAL);
  }

  errors.push(...forbiddenCodes(packet));

  if (errors.length) {
    return packetRejected(errors);
  }

  return Object.freeze({
    status: "ACCEPTED",
    packet: Object.freeze({
      proposal_version: packet.proposal_version.trim(),
      proposals: Object.freeze(packet.proposals),
      limitations: Object.freeze(unique(packet.limitations))
    }),
    rejection_codes: Object.freeze([])
  });
}

function packetRejected(codes) {
  return Object.freeze({
    status: "REJECTED",
    packet: null,
    rejection_codes: Object.freeze(unique(codes))
  });
}

function applyProposal(proposal, state) {
  if (proposal.action === "REJECT_CANDIDATE") {
    state.delete(proposal.target_candidate_ids[0]);
    return { applied: true, changed: true };
  }

  if (proposal.action === "RENAME_CANDIDATE") {
    const id = proposal.target_candidate_ids[0];
    const current = state.get(id);
    const next = proposal.proposed_candidates[0];
    const changed = current.candidate_name !== next.candidate_name;
    state.set(id, {
      ...current,
      candidate_name: next.candidate_name,
      candidate_status: changed ? "SEMANTICALLY_RECONCILED_CANDIDATE" : current.candidate_status,
      source_pointers: pointerUnion(current.source_pointers, proposal.source_pointers)
    });
    return { applied: true, changed };
  }

  if (proposal.action === "RECOVER_CANDIDATE") {
    proposal.proposed_candidates.forEach((candidate, index) => {
      state.set(`SEM.${proposal.proposal_id}.${index + 1}`, fromProposal(candidate, proposal.source_pointers));
    });
    return { applied: true, changed: true };
  }

  if (proposal.action === "MERGE_CANDIDATES") {
    const targets = proposal.target_candidate_ids.map((id) => state.get(id));
    proposal.target_candidate_ids.forEach((id) => state.delete(id));
    state.set(
      `SEM.${proposal.proposal_id}.1`,
      fromProposal(
        proposal.proposed_candidates[0],
        pointerUnion(targets.flatMap((candidate) => candidate.source_pointers), proposal.source_pointers),
        targets.flatMap((candidate) => candidate.merged_raw_hit_ids)
      )
    );
    return { applied: true, changed: true };
  }

  if (proposal.action === "SPLIT_CANDIDATE") {
    const current = state.get(proposal.target_candidate_ids[0]);
    state.delete(proposal.target_candidate_ids[0]);
    proposal.proposed_candidates.forEach((candidate, index) => {
      state.set(
        `SEM.${proposal.proposal_id}.${index + 1}`,
        fromProposal(candidate, pointerUnion(current.source_pointers, proposal.source_pointers), current.merged_raw_hit_ids)
      );
    });
    return { applied: true, changed: true };
  }

  return { applied: false, changed: false };
}

function fromProposal(candidate, pointers, rawIds = []) {
  return {
    candidate_id: "",
    canonical_feature_key: canonicalKey(candidate.activity_route_class, candidate.capability_key),
    candidate_name: candidate.candidate_name,
    candidate_type: candidate.candidate_type,
    candidate_status: "SEMANTICALLY_RECONCILED_CANDIDATE",
    activity_route_class: candidate.activity_route_class,
    capability_key: slug(candidate.capability_key),
    source_root: candidate.source_root,
    evidence_grounded: true,
    mandatory_profile_treatment: "PACKAGE_AWARE_ACTIVITY_REVIEW_OR_LIMITATION",
    merged_raw_hit_ids: Object.freeze(unique(rawIds)),
    source_pointers: pointerUnion(pointers)
  };
}

function finalizeCandidates(input) {
  const byKey = new Map();

  for (const rawCandidate of input) {
    const candidate = {
      ...rawCandidate,
      canonical_feature_key: canonicalKey(rawCandidate.activity_route_class, rawCandidate.capability_key),
      capability_key: slug(rawCandidate.capability_key),
      evidence_grounded: true,
      merged_raw_hit_ids: Object.freeze(unique(rawCandidate.merged_raw_hit_ids)),
      source_pointers: pointerUnion(rawCandidate.source_pointers)
    };

    if (!byKey.has(candidate.canonical_feature_key)) {
      byKey.set(candidate.canonical_feature_key, candidate);
    } else {
      const existing = byKey.get(candidate.canonical_feature_key);
      byKey.set(candidate.canonical_feature_key, {
        ...existing,
        candidate_name: [existing.candidate_name, candidate.candidate_name].sort()[0],
        candidate_status: "SEMANTICALLY_RECONCILED_CANDIDATE",
        merged_raw_hit_ids: Object.freeze(unique([...existing.merged_raw_hit_ids, ...candidate.merged_raw_hit_ids])),
        source_pointers: pointerUnion(existing.source_pointers, candidate.source_pointers)
      });
    }
  }

  return [...byKey.values()]
    .sort((a, b) => a.canonical_feature_key.localeCompare(b.canonical_feature_key) || a.candidate_name.localeCompare(b.candidate_name))
    .map((candidate, index) => Object.freeze(Object.fromEntries(
      FEATURE_CANDIDATE_FIELDS.map((field) => [
        field,
        field === "candidate_id" ? `FC.${String(index + 1).padStart(3, "0")}` : candidate[field]
      ])
    )));
}

function pointerAuthority({
  baseline,
  routedArtifactNames,
  indexLocatorRows,
  indexMappedUnitIds,
  permittedEvidenceRoots
}) {
  const baselinePointers = [
    ...rows(baseline.raw_feature_hit_index).map((entry) => entry?.source_pointer),
    ...rows(baseline.context_pointer_index),
    ...rows(baseline.candidates).flatMap((entry) => rows(entry.source_pointers))
  ].filter(plain);

  const locatorPointers = rows(indexLocatorRows).map(locatorPointer).filter(plain);
  const pointers = locatorPointers.length ? locatorPointers : baselinePointers;
  const artifacts = unique(routedArtifactNames);
  const units = unique(indexMappedUnitIds);
  const roots = unique(permittedEvidenceRoots);

  return {
    artifacts: new Set(artifacts.length ? artifacts : unique(pointers.map((pointer) => pointer.source_artifact))),
    units: new Set(units.length ? units : unique(pointers.map((pointer) => pointer.unit_id))),
    roots: new Set(roots.length ? roots : unique([
      ...rows(baseline?.deterministic_baseline_metadata?.evidence_roots_opened),
      ...pointers.map((pointer) => pointer.source_root)
    ])),
    fingerprints: new Set(pointers.map(fingerprint))
  };
}

function validatePointer(pointer, authority) {
  if (!plain(pointer) || !exactKeys(pointer, POINTER_FIELDS)) return [R.MALFORMED_PROPOSAL];

  const errors = [];
  if (!pointer.source_artifact || !pointer.source_root || !pointer.route_class || !pointer.route_code || !pointer.locator_id || !pointer.unit_id) {
    errors.push(R.MALFORMED_PROPOSAL);
  }
  if (!authority.roots.has(pointer.source_root)) errors.push(R.UNAUTHORIZED_SOURCE_ROOT);
  if (!authority.artifacts.has(pointer.source_artifact)) errors.push(R.UNROUTED_SOURCE_POINTER);
  if (!authority.units.has(pointer.unit_id) || !authority.fingerprints.has(fingerprint(pointer))) errors.push(R.UNINDEXED_SOURCE_POINTER);
  return unique(errors);
}

function forbiddenCodes(value) {
  const out = new Set();
  walk(value, (keyRaw, valueRaw) => {
    const key = String(keyRaw || "").toLowerCase();
    if (EVIDENCE_KEYS.has(key)) out.add(R.EVIDENCE_TEXT_FORBIDDEN);
    if (TAXONOMY_KEYS.has(key)) out.add(R.PACKAGE_TAXONOMY_FORBIDDEN);
    if (LEGAL_KEYS.has(key)) out.add(R.LEGAL_ANALYSIS_FORBIDDEN);
    if (CONFIDENCE_KEY.test(key)) out.add(R.CONFIDENCE_FIELD_FORBIDDEN);
    if (typeof valueRaw === "string" && URL.test(valueRaw) && !["source_pointer", "unit_pointer"].includes(key)) {
      out.add(R.UNROUTED_SOURCE_POINTER);
    }
  });
  return [...out];
}

function normalizeProposal(proposal) {
  return Object.freeze({
    proposal_id: str(proposal?.proposal_id),
    action: str(proposal?.action).toUpperCase(),
    target_candidate_ids: Object.freeze(unique(proposal?.target_candidate_ids)),
    proposed_candidates: Object.freeze(rows(proposal?.proposed_candidates).map((candidate) => Object.freeze({
      candidate_name: str(candidate?.candidate_name),
      candidate_type: str(candidate?.candidate_type),
      activity_route_class: str(candidate?.activity_route_class),
      capability_key: slug(candidate?.capability_key),
      source_root: str(candidate?.source_root)
    }))),
    source_pointers: Object.freeze(rows(proposal?.source_pointers).map((pointer) => Object.freeze({
      source_artifact: str(pointer?.source_artifact),
      source_id: str(pointer?.source_id),
      source_root: str(pointer?.source_root),
      route_class: str(pointer?.route_class),
      route_code: str(pointer?.route_code),
      locator_id: str(pointer?.locator_id),
      unit_id: str(pointer?.unit_id),
      source_pointer: pointerValue(pointer?.source_pointer),
      unit_pointer: pointerValue(pointer?.unit_pointer)
    })))
  });
}

function shapeOk(proposal) {
  const targetCount = proposal.target_candidate_ids.length;
  const candidateCount = proposal.proposed_candidates.length;
  if (proposal.action === "RECOVER_CANDIDATE") return targetCount === 0 && candidateCount >= 1;
  if (proposal.action === "MERGE_CANDIDATES") return targetCount >= 2 && candidateCount === 1;
  if (proposal.action === "SPLIT_CANDIDATE") return targetCount === 1 && candidateCount >= 2;
  if (proposal.action === "RENAME_CANDIDATE") return targetCount === 1 && candidateCount === 1;
  if (proposal.action === "REJECT_CANDIDATE") return targetCount === 1 && candidateCount === 0;
  return false;
}

function candidateValuesOk(candidate) {
  return SEMANTIC_PROPOSED_CANDIDATE_FIELDS.every((field) => {
    const value = str(candidate[field]);
    return value && value.length <= 200 && !URL.test(value);
  });
}

function locatorPointer(value) {
  return plain(value)
    ? {
        source_artifact: str(value.source_artifact),
        source_id: str(value.source_id),
        source_root: str(value.source_root || value.common_root),
        route_class: str(value.route_class),
        route_code: str(value.route_code),
        locator_id: str(value.locator_id),
        unit_id: str(value.unit_id),
        source_pointer: pointerValue(value.source_pointer),
        unit_pointer: pointerValue(value.unit_pointer)
      }
    : null;
}

function pointerIdentifiers(value) {
  return Object.freeze(rows(value).map((pointer) => Object.freeze({
    source_artifact: str(pointer?.source_artifact),
    source_root: str(pointer?.source_root),
    locator_id: str(pointer?.locator_id),
    unit_id: str(pointer?.unit_id)
  })));
}

function fingerprint(value) {
  return POINTER_FIELDS.map((field) => scalar(value?.[field])).join("|");
}

function pointerUnion(...groups) {
  const map = new Map();
  for (const pointer of groups.flat(Infinity).filter(plain)) {
    map.set(fingerprint(pointer), Object.freeze(locatorPointer(pointer)));
  }
  return Object.freeze([...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value));
}

function cloneCandidate(candidate) {
  return {
    ...candidate,
    merged_raw_hit_ids: Object.freeze(unique(candidate.merged_raw_hit_ids)),
    source_pointers: pointerUnion(candidate.source_pointers)
  };
}

function proposalIdCounts(list) {
  const counts = new Map();
  for (const proposal of rows(list)) {
    const id = str(proposal?.proposal_id);
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

function compareProposals(a, b) {
  return str(a?.proposal_id).localeCompare(str(b?.proposal_id)) || stable(a).localeCompare(stable(b));
}

function rejection(input) {
  return Object.freeze({
    proposal_id: input?.proposal_id || null,
    action: input?.action || null,
    rejection_codes: Object.freeze(unique(input?.rejection_codes || input?.reasons || [R.MALFORMED_PROPOSAL])),
    pointer_identifiers: Object.freeze(rows(input?.pointer_identifiers))
  });
}

function receipt(input) {
  if (!SEMANTIC_SUPPORT_STATUSES.includes(input.status)) {
    throw new Error(`INVALID_SEMANTIC_SUPPORT_STATUS:${input.status || "missing"}`);
  }
  const normalized = {
    ...input,
    accepted_proposal_ids: Object.freeze(unique(input.accepted_proposal_ids)),
    rejected_proposals: Object.freeze(rows(input.rejected_proposals)),
    limitations: Object.freeze(unique(input.limitations))
  };
  return Object.freeze(Object.fromEntries(SEMANTIC_SUPPORT_RECEIPT_FIELDS.map((field) => [field, normalized[field]])));
}

function unwrapInventory(input) {
  if (plain(input?.feature_candidate_inventory)) return input.feature_candidate_inventory;
  if (plain(input?.inventory)) return input.inventory;
  return plain(input) ? input : {};
}

function exactKeys(input, expected) {
  return plain(input) && JSON.stringify(Object.keys(input).sort()) === JSON.stringify([...expected].sort());
}

function rows(input) {
  return Array.isArray(input) ? input : [];
}

function unique(input) {
  return [...new Set(rows(input).flat(Infinity).map(str).filter(Boolean))];
}

function str(input) {
  return typeof input === "string" ? input.trim().slice(0, 500) : "";
}

function slug(input) {
  return str(input)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function canonicalKey(route, capability) {
  return `${str(route)}::${slug(capability)}`;
}

function pointerValue(input) {
  return input == null ? null : ["string", "number", "boolean"].includes(typeof input) ? input : stable(input);
}

function scalar(input) {
  return input == null ? "" : typeof input === "object" ? stable(input) : String(input);
}

function stable(input) {
  if (Array.isArray(input)) return `[${input.map(stable).join(",")}]`;
  if (plain(input)) {
    return `{${Object.keys(input).sort().map((key) => `${JSON.stringify(key)}:${stable(input[key])}`).join(",")}}`;
  }
  return JSON.stringify(input);
}

function walk(input, visit, seen = new Set()) {
  if (!input || typeof input !== "object" || seen.has(input)) return;
  seen.add(input);
  if (Array.isArray(input)) {
    input.forEach((value, index) => {
      visit(String(index), value);
      walk(value, visit, seen);
    });
    return;
  }
  for (const [key, value] of Object.entries(input)) {
    visit(key, value);
    walk(value, visit, seen);
  }
}

function plain(input) {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

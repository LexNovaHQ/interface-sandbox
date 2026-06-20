// s0-source-dedupe.js
// Candidate and content dedupe helpers for S0.

import { routeStrength } from "./s0-source-classifier.js";

export function dedupeCandidatesByUrl({ candidates, addDedupeRecord }) {
  const seen = new Map();

  for (const candidate of candidates) {
    if (["DEFERRED", "REJECTED", "DEDUPED"].includes(candidate.final_status)) continue;

    const key = normalizeCandidateKey(candidate.canonical_url || candidate.candidate_url);
    if (!key) continue;

    const prior = seen.get(key);
    if (!prior) {
      seen.set(key, candidate);
      continue;
    }

    const canonical = strongerCandidate(prior, candidate);
    const suppressed = canonical === prior ? candidate : prior;
    seen.set(key, canonical);

    suppressed.fetch_decision = "DEFER";
    suppressed.fetch_decision_reason = "duplicate candidate URL/canonical route";
    suppressed.final_status = "DEDUPED";

    addDedupeRecord({
      dedupe_type: "URL_NORMALIZATION",
      canonical_candidate_source_id: canonical.candidate_source_id,
      suppressed_candidate_source_ids: [suppressed.candidate_source_id],
      dedupe_basis: ["normalized URL", "tracking-param stripped URL", "known-path equivalence"]
    });
  }
}

export function dedupeArtifactsByContent({ artifacts, candidates, addDedupeRecord }) {
  const seen = new Map();
  const kept = [];
  const keptIds = new Set();

  for (const artifact of artifacts) {
    const key = artifact.normalized_text_hash || artifact.content_hash;
    const prior = seen.get(key);

    if (!prior) {
      seen.set(key, artifact);
      kept.push(artifact);
      keptIds.add(artifact.lossless_artifact_id);
      markCandidateStatus(candidates, artifact.candidate_source_id, "ACCEPTED_LOSSLESS");
      continue;
    }

    markCandidateStatus(candidates, artifact.candidate_source_id, "DEDUPED");

    addDedupeRecord({
      dedupe_type: "CONTENT_HASH",
      canonical_candidate_source_id: prior.candidate_source_id,
      suppressed_candidate_source_ids: [artifact.candidate_source_id],
      dedupe_basis: ["content hash", "normalized text hash"]
    });
  }

  return { kept, keptIds };
}

export function buildNearDuplicateClusters(artifacts) {
  const groups = new Map();

  for (const artifact of artifacts) {
    const key = `${artifact.source_family}:${artifact.source_subfamily}`;
    if (!groups.has(key)) groups.set(key, []);

    groups.get(key).push({
      candidate_source_id: artifact.candidate_source_id,
      source_url: artifact.source_url,
      source_family: artifact.source_family,
      source_subfamily: artifact.source_subfamily,
      normalized_text_hash: artifact.normalized_text_hash,
      first_800_chars: String(artifact.clean_text || "").slice(0, 800)
    });
  }

  return [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({ key, items }));
}

export function applyNearDuplicateReview({ review, candidates, addDedupeRecord }) {
  for (const item of asArray(review?.dedupe_review)) {
    if (!["DEFER_NEAR_DUPLICATE", "DEFER_REPETITIVE_TEMPLATE", "DEFER_LOW_INCREMENTAL_VALUE"].includes(item.decision)) {
      continue;
    }

    const candidate = candidates.find((row) => row.candidate_source_id === item.candidate_source_id);
    if (!candidate) continue;

    candidate.final_status = "DEDUPED";
    candidate.fetch_decision = "DEFER";
    candidate.fetch_decision_reason = item.decision;

    addDedupeRecord({
      dedupe_type: "MODEL_NEAR_DUPLICATE_REVIEW",
      canonical_candidate_source_id: item.canonical_candidate_source_id || "",
      suppressed_candidate_source_ids: [candidate.candidate_source_id],
      dedupe_basis: [item.decision, item.reason || "model near-duplicate review"],
      model_review_ref: "S0_NEAR_DUPLICATE_REVIEW"
    });
  }
}

export function syncInventoryRefs({ inventory, keptLosslessIds }) {
  for (const row of inventory) {
    if (row.lossless_artifact_ref && !keptLosslessIds.has(row.lossless_artifact_ref)) {
      row.warning = [row.warning, "lossless artifact deduped/suppressed"].filter(Boolean).join(" | ");
      row.lossless_artifact_ref = "";
    }
  }
}

function strongerCandidate(a, b) {
  return routeStrength(a.route_source) <= routeStrength(b.route_source) ? a : b;
}

function normalizeCandidateKey(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = parsed.hash && parsed.hash.startsWith("#/") ? parsed.hash : "";
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, "")}${parsed.hash}`;
  } catch {
    return String(url || "").toLowerCase();
  }
}

function markCandidateStatus(candidates, candidateId, status) {
  const candidate = candidates.find((row) => row.candidate_source_id === candidateId);
  if (candidate) candidate.final_status = status;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

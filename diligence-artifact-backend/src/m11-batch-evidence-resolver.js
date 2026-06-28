const LEGAL_GOVERNANCE_ARTIFACTS = Object.freeze([
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE"
]);

const MAX_EXCERPTS_PER_BATCH = 18;
const MAX_EXCERPT_CHARS = 1400;
const MAX_KEYWORDS_PER_ROW = 30;

export function buildCompactM11BatchPacket({ batchPacket, upstreamArtifacts = {} }) {
  const packet = batchPacket?.m11_batch_packet || batchPacket || {};
  const legalEvidenceBundle = buildLegalGovernanceEvidenceBundle({ packet, upstreamArtifacts });

  return {
    ...packet,
    backend_full_lossless_evidence_access_policy: {
      full_legal_governance_lossless_package_read_permission: true,
      navigation_layer: "legal_cartography_index",
      prompt_injection_policy: "selected_excerpts_only",
      insufficiency_rule: "If selected excerpts are insufficient, return a controlled limitation and identify the missing evidence route in row_limitations; do not fabricate."
    },
    backend_full_lossless_evidence_access_manifest: buildFullEvidenceAccessManifest(upstreamArtifacts),
    legal_governance_evidence_bundle: legalEvidenceBundle
  };
}

function buildFullEvidenceAccessManifest(upstreamArtifacts = {}) {
  return LEGAL_GOVERNANCE_ARTIFACTS.map((artifactName) => ({
    artifact_name: artifactName,
    available_to_backend: Boolean(upstreamArtifacts[artifactName]),
    access_mode: "backend_selective_read_by_legal_cartography_navigation"
  }));
}

function buildLegalGovernanceEvidenceBundle({ packet, upstreamArtifacts }) {
  const registryRows = asArray(packet.registry_rows);
  const keywords = buildBatchKeywords(registryRows);
  const excerpts = [];

  for (const artifactName of LEGAL_GOVERNANCE_ARTIFACTS) {
    const source = upstreamArtifacts[artifactName];
    if (!source) continue;
    const sourceText = stringifyForSearch(source);
    if (!sourceText.trim()) continue;

    const selected = selectExcerpts({ sourceText, artifactName, keywords, limitRemaining: MAX_EXCERPTS_PER_BATCH - excerpts.length });
    excerpts.push(...selected);
    if (excerpts.length >= MAX_EXCERPTS_PER_BATCH) break;
  }

  return {
    selection_method: "keyword_window_from_active_registry_rows_and_m9_cartography_selection",
    selected_excerpt_count: excerpts.length,
    excerpts,
    limitations: excerpts.length
      ? []
      : ["No targeted legal/governance excerpt matched active batch keywords. Backend full lossless package remains available by legal-cartography navigation, but model must treat missing excerpts as a limitation and must not invent evidence."]
  };
}

function selectExcerpts({ sourceText, artifactName, keywords, limitRemaining }) {
  const excerpts = [];
  const lower = sourceText.toLowerCase();
  const usedWindows = [];

  for (const keyword of keywords) {
    if (excerpts.length >= limitRemaining) break;
    const index = lower.indexOf(keyword);
    if (index < 0) continue;
    const start = Math.max(0, index - Math.floor(MAX_EXCERPT_CHARS / 2));
    const end = Math.min(sourceText.length, start + MAX_EXCERPT_CHARS);
    if (usedWindows.some((window) => Math.abs(window.start - start) < 350)) continue;
    usedWindows.push({ start, end });
    excerpts.push({
      artifact_name: artifactName,
      match_keyword: keyword,
      char_start: start,
      char_end: end,
      excerpt: sourceText.slice(start, end)
    });
  }

  return excerpts;
}

function buildBatchKeywords(registryRows) {
  const raw = [];
  for (const row of registryRows) {
    raw.push(
      row.Threat_ID,
      row.Threat_Name,
      row.Surface,
      row.FP_Mechanism,
      row.Lex_Nova_Fix,
      row.Legal_Pain,
      ...asArray(row.m9_legal_cartography_selection).map((item) => JSON.stringify(item))
    );
  }

  return unique(raw.join(" ").toLowerCase().split(/[^a-z0-9_§.-]+/).filter((word) => word.length >= 4).slice(0, registryRows.length * MAX_KEYWORDS_PER_ROW));
}

function stringifyForSearch(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value || "");
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(items) {
  return [...new Set(asArray(items).filter(Boolean))];
}

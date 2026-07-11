const LEGAL_GOVERNANCE_ROOT_ARTIFACTS = Object.freeze([
  "lossless_root__company_identity",
  "lossless_root__contact_notice",
  "lossless_root__privacy_data_processing",
  "lossless_root__security_trust_compliance",
  "lossless_root__data_governance_controls",
  "lossless_root__ai_safety_transparency",
  "lossless_root__regulatory_licensing_status",
  "lossless_root__grievance_complaints"
]);

const LEGAL_DOC_ARTIFACT_PATTERN = /^legal_doc_[a-z0-9]+(?:_[a-z0-9]+)*(?:__[a-z0-9-]+)?$/;
const LEGAL_ROOT_PART_PATTERN = /^lossless_root__(company_identity|contact_notice|privacy_data_processing|security_trust_compliance|data_governance_controls|ai_safety_transparency|regulatory_licensing_status|grievance_complaints)__part_\d{3}$/;
const MAX_FULL_LOSSLESS_UNITS_PER_BATCH = 24;
const MAX_KEYWORDS_PER_ROW = 30;
const TEXT_FIELD_NAMES = new Set(["lossless_text", "clean_text", "raw_text", "text", "content", "body", "markdown"]);

export function buildCompactM11BatchPacket({ batchPacket, upstreamArtifacts = {} }) {
  const packet = batchPacket?.m11_batch_packet || batchPacket || {};
  const evidenceArtifactNames = routedPrimaryEvidenceArtifactNames(upstreamArtifacts);
  const legalEvidenceBundle = buildLegalGovernanceEvidenceBundle({ packet, upstreamArtifacts, evidenceArtifactNames });

  return {
    ...packet,
    backend_full_lossless_evidence_access_policy: {
      full_legal_governance_lossless_package_read_permission: true,
      routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
      route_id: "ROUTE.PHASE9.EXPOSURE_PROFILE",
      navigation_layer: "legal_cartography_index",
      evidence_role: "PRIMARY_EVIDENCE",
      evidence_selection_policy: "index_navigation_into_routed_primary_lossless_evidence",
      index_gap_policy: "When M9 has no usable pointer for a row, navigate to the closest relevant unit inside the same 2F primary evidence bucket and record the index gap. This is not fallback evidence.",
      direct_lossless_fallback_framing_forbidden: true,
      insufficiency_rule: "If the routed primary evidence units remain insufficient, set status_inputs.public_evidence_limitation to yes or partial and record a row-specific limitation. Backend derives the final material status."
    },
    backend_full_lossless_evidence_access_manifest: buildFullEvidenceAccessManifest(upstreamArtifacts, evidenceArtifactNames),
    legal_governance_evidence_bundle: legalEvidenceBundle
  };
}

function routedPrimaryEvidenceArtifactNames(upstreamArtifacts = {}) {
  return Object.keys(upstreamArtifacts)
    .filter((artifactName) => LEGAL_GOVERNANCE_ROOT_ARTIFACTS.includes(artifactName) || LEGAL_ROOT_PART_PATTERN.test(artifactName) || LEGAL_DOC_ARTIFACT_PATTERN.test(artifactName))
    .sort();
}

function buildFullEvidenceAccessManifest(upstreamArtifacts = {}, evidenceArtifactNames = routedPrimaryEvidenceArtifactNames(upstreamArtifacts)) {
  const expectedRoots = LEGAL_GOVERNANCE_ROOT_ARTIFACTS.map((artifactName) => ({
    artifact_name: artifactName,
    available_to_backend: Boolean(upstreamArtifacts[artifactName]),
    evidence_role: "PRIMARY_EVIDENCE",
    access_mode: "m9_index_navigation_to_routed_lossless_root"
  }));
  const dynamic = evidenceArtifactNames
    .filter((artifactName) => !LEGAL_GOVERNANCE_ROOT_ARTIFACTS.includes(artifactName))
    .map((artifactName) => ({
      artifact_name: artifactName,
      available_to_backend: true,
      evidence_role: "PRIMARY_EVIDENCE",
      access_mode: LEGAL_DOC_ARTIFACT_PATTERN.test(artifactName) ? "m9_index_navigation_to_independent_legal_document" : "m9_index_navigation_to_routed_lossless_root_shard"
    }));
  return [...expectedRoots, ...dynamic];
}

function buildLegalGovernanceEvidenceBundle({ packet, upstreamArtifacts, evidenceArtifactNames }) {
  const registryRows = asArray(packet.registry_rows);
  const allUnits = buildLosslessUnitIndex(upstreamArtifacts, evidenceArtifactNames);
  const selected = [];
  const selectedKeys = new Set();
  const rowBindings = [];
  const limitations = [];

  for (const row of registryRows) {
    const threatId = String(row.Threat_ID || "").trim();
    const m9Rows = asArray(row.m9_legal_cartography_selection);
    const indexPinpointed = selectUnitsForRow({ row, m9Rows, allUnits, indexPointersRequired: true });
    const indexGapNavigation = indexPinpointed.length ? [] : selectUnitsForRow({ row, m9Rows: [], allUnits, indexPointersRequired: false });
    const rowUnits = [...indexPinpointed, ...indexGapNavigation];

    if (!m9Rows.length) {
      limitations.push({
        Threat_ID: threatId,
        code: "M9_INDEX_GAP_NEAREST_PRIMARY_EVIDENCE_NAVIGATION_USED",
        message: "M9 did not expose a usable pointer for this row. The backend navigated to the closest relevant unit inside the same routed 2F primary evidence bucket and recorded the index gap."
      });
    }

    if (!rowUnits.length) {
      limitations.push({
        Threat_ID: threatId,
        code: "NO_RELEVANT_ROUTED_PRIMARY_EVIDENCE_UNIT_FOUND",
        message: "No relevant unit was found inside the routed 2F primary evidence bucket. M11 must carry public evidence limitation through status_inputs and row_limitations; backend derives the final material status."
      });
    }

    rowBindings.push({
      Threat_ID: threatId,
      m9_rows_available: m9Rows.length,
      selection_policy: indexPinpointed.length ? "M9_INDEX_PINPOINTED_PRIMARY_EVIDENCE" : "INDEX_GAP_NEAREST_ROUTED_PRIMARY_EVIDENCE",
      direct_lossless_fallback_used: false,
      selected_unit_ids: rowUnits.map((unit) => unit.unit_id)
    });

    for (const unit of rowUnits) {
      if (selected.length >= MAX_FULL_LOSSLESS_UNITS_PER_BATCH) break;
      if (selectedKeys.has(unit.unit_id)) continue;
      selectedKeys.add(unit.unit_id);
      selected.push(unit);
    }
  }

  return {
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: "ROUTE.PHASE9.EXPOSURE_PROFILE",
    evidence_role: "PRIMARY_EVIDENCE",
    selection_method: "m9_index_navigation_into_routed_primary_evidence_with_recorded_index_gap_navigation",
    direct_lossless_fallback_used: false,
    selected_lossless_unit_count: selected.length,
    lossless_units: selected,
    row_bindings: rowBindings,
    limitations
  };
}

function buildLosslessUnitIndex(upstreamArtifacts = {}, evidenceArtifactNames = routedPrimaryEvidenceArtifactNames(upstreamArtifacts)) {
  const units = [];
  for (const artifactName of evidenceArtifactNames) {
    const source = upstreamArtifacts[artifactName];
    if (!source) continue;
    units.push(...extractTextUnits({ artifactName, value: source }));
  }
  return units;
}

function extractTextUnits({ artifactName, value, path = artifactName, inherited = {} }) {
  const units = [];
  if (!value) return units;

  if (typeof value === "string") {
    units.push(...splitIntoFullLosslessUnits({ artifactName, path, text: value, inherited }));
    return units;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => units.push(...extractTextUnits({ artifactName, value: item, path: `${path}[${index}]`, inherited })));
    return units;
  }

  if (typeof value !== "object") return units;

  const nextInherited = {
    ...inherited,
    source_url: value.canonical_url || value.url || value.source_url || value.source || inherited.source_url || "",
    route_type: value.route_type || value.common_root || value.doc_type || inherited.route_type || "",
    document_title: value.title || value.document_title || value.document_or_artifact || value.policy_name || value.doc_type || inherited.document_title || ""
  };

  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" && TEXT_FIELD_NAMES.has(key) && item.trim().length > 40) {
      units.push(...splitIntoFullLosslessUnits({ artifactName, path: `${path}.${key}`, text: item, inherited: nextInherited }));
    } else if (item && typeof item === "object") {
      units.push(...extractTextUnits({ artifactName, value: item, path: `${path}.${key}`, inherited: nextInherited }));
    }
  }

  return units;
}

function splitIntoFullLosslessUnits({ artifactName, path, text, inherited }) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  return splitByLegalHeadings(normalized).map((block, index) => ({
    unit_id: `${artifactName}::${path}::unit_${String(index + 1).padStart(3, "0")}`,
    artifact_name: artifactName,
    source_url: inherited.source_url || "",
    route_type: inherited.route_type || "",
    document_title: inherited.document_title || "",
    path,
    unit_index: index + 1,
    unit_selection_type: "FULL_PRIMARY_EVIDENCE_SECTION_OR_PART",
    heading: inferHeading(block),
    text: block,
    search_text: [artifactName, inherited.source_url, inherited.document_title, inherited.route_type, block].join(" ").toLowerCase()
  }));
}

function splitByLegalHeadings(text) {
  const lines = String(text || "").split("\n");
  const sections = [];
  let current = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (isLegalHeading(trimmed) && current.join("\n").trim().length > 0) {
      sections.push(current.join("\n").trim());
      current = [];
    }
    current.push(line);
  }

  if (current.join("\n").trim().length > 0) sections.push(current.join("\n").trim());
  return sections.length <= 1 ? splitByParagraphParts(text) : sections;
}

function splitByParagraphParts(text) {
  const paragraphs = String(text || "").split(/\n\s*\n+/).map((part) => part.trim()).filter(Boolean);
  if (paragraphs.length <= 1) return [String(text || "").trim()].filter(Boolean);

  const parts = [];
  let current = [];
  let currentLength = 0;
  for (const paragraph of paragraphs) {
    if (currentLength > 0 && currentLength + paragraph.length > 6000) {
      parts.push(current.join("\n\n"));
      current = [];
      currentLength = 0;
    }
    current.push(paragraph);
    currentLength += paragraph.length;
  }
  if (current.length) parts.push(current.join("\n\n"));
  return parts;
}

function isLegalHeading(line) {
  if (!line || line.length > 160) return false;
  return /^(section\s+\d+|\d+\.\s+|\d+\s+[A-Z][A-Za-z ]{3,}|annexure\s+[A-Z]|schedule\s+[A-Z0-9]|exhibit\s+[A-Z0-9]|[A-Z][A-Z0-9 &/()\-]{8,})\b/i.test(line);
}

function inferHeading(text) {
  const first = String(text || "").split("\n").map((line) => line.trim()).find(Boolean) || "";
  return first.slice(0, 180);
}

function selectUnitsForRow({ row, m9Rows, allUnits, indexPointersRequired }) {
  if (!allUnits.length) return [];
  const rowKeywords = buildRowKeywords(row);
  const m9Keywords = buildM9Keywords(m9Rows);
  const keywords = unique([...(indexPointersRequired ? m9Keywords : []), ...rowKeywords]).slice(0, MAX_KEYWORDS_PER_ROW);
  if (!keywords.length) return [];

  return allUnits
    .map((unit) => ({ unit, score: scoreUnit(unit, keywords, indexPointersRequired ? m9Keywords : []) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, indexPointersRequired ? 4 : 2)
    .map((entry) => stripSearchText(entry.unit));
}

function scoreUnit(unit, keywords, m9Keywords) {
  const text = unit.search_text || "";
  let score = 0;
  for (const keyword of keywords) if (text.includes(keyword)) score += 1;
  for (const keyword of m9Keywords) if (text.includes(keyword)) score += 2;
  return score;
}

function stripSearchText(unit) { const { search_text, ...rest } = unit; return rest; }
function buildRowKeywords(row = {}) { const raw = [row.Threat_ID, row.Threat_Name, row.Surface, row.FP_Mechanism, row.Lex_Nova_Fix, row.Legal_Pain, row.Hunter_Trigger].filter(Boolean).join(" ").toLowerCase(); return raw.split(/[^a-z0-9_\u00a7.-]+/).filter((word) => word.length >= 4).slice(0, MAX_KEYWORDS_PER_ROW); }
function buildM9Keywords(m9Rows) { return unique(asArray(m9Rows).map((row) => JSON.stringify(row)).join(" ").toLowerCase().split(/[^a-z0-9_\u00a7.-]+/).filter((word) => word.length >= 4)).slice(0, MAX_KEYWORDS_PER_ROW); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function unique(items) { return [...new Set(asArray(items).filter(Boolean))]; }

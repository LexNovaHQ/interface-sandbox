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
const MAX_KEYWORDS_PER_ROW = 40;
const TEXT_FIELD_NAMES = new Set(["lossless_text", "clean_text", "raw_text", "text", "content", "body", "markdown"]);

export function buildCompactM11BatchPacket({ batchPacket, upstreamArtifacts = {} }) {
  const packet = batchPacket?.m11_batch_packet || batchPacket || {};
  const evidenceArtifactNames = routedPrimaryEvidenceArtifactNames(upstreamArtifacts);
  return {
    ...packet,
    backend_full_lossless_evidence_access_policy: {
      full_legal_governance_lossless_package_read_permission: true,
      routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
      route_id: "ROUTE.PHASE10.EXPOSURE_PROFILE",
      navigation_layer: "legal_cartography_index",
      evidence_role: "PRIMARY_EVIDENCE",
      evidence_selection_policy: "index_navigation_into_routed_primary_lossless_evidence",
      index_gap_policy: "Navigate to the closest relevant unit inside the same 2F primary evidence bucket and record the index gap. This remains primary-evidence navigation, not fallback evidence.",
      direct_lossless_fallback_framing_forbidden: true
    },
    backend_full_lossless_evidence_access_manifest: buildFullEvidenceAccessManifest(upstreamArtifacts, evidenceArtifactNames),
    legal_governance_evidence_bundle: buildLegalGovernanceEvidenceBundle({ packet, upstreamArtifacts, evidenceArtifactNames })
  };
}

function routedPrimaryEvidenceArtifactNames(upstreamArtifacts = {}) {
  return Object.keys(upstreamArtifacts)
    .filter((name) => LEGAL_GOVERNANCE_ROOT_ARTIFACTS.includes(name) || LEGAL_ROOT_PART_PATTERN.test(name) || LEGAL_DOC_ARTIFACT_PATTERN.test(name))
    .sort();
}

function buildFullEvidenceAccessManifest(upstreamArtifacts, names) {
  const expected = LEGAL_GOVERNANCE_ROOT_ARTIFACTS.map((artifactName) => ({
    artifact_name: artifactName,
    available_to_backend: Boolean(upstreamArtifacts[artifactName]),
    evidence_role: "PRIMARY_EVIDENCE",
    access_mode: "m9_index_navigation_to_routed_lossless_root"
  }));
  const dynamic = names.filter((name) => !LEGAL_GOVERNANCE_ROOT_ARTIFACTS.includes(name)).map((artifactName) => ({
    artifact_name: artifactName,
    available_to_backend: true,
    evidence_role: "PRIMARY_EVIDENCE",
    access_mode: LEGAL_DOC_ARTIFACT_PATTERN.test(artifactName) ? "m9_index_navigation_to_independent_legal_document" : "m9_index_navigation_to_routed_lossless_root_shard"
  }));
  return [...expected, ...dynamic];
}

function buildLegalGovernanceEvidenceBundle({ packet, upstreamArtifacts, evidenceArtifactNames }) {
  const registryRows = asArray(packet.registry_rows);
  const allUnits = buildLosslessUnitIndex(upstreamArtifacts, evidenceArtifactNames);
  const legalIndexRows = flattenLegalCartographyIndex(upstreamArtifacts.legal_cartography_index);
  const selected = [];
  const selectedKeys = new Set();
  const rowBindings = [];
  const limitations = [];

  for (const row of registryRows) {
    const threatId = String(row.Threat_ID || row.deterministic_registry_spine?.Threat_ID || "").trim();
    const rowKeywords = buildRowKeywords(row);
    const suppliedM9 = asArray(row.m9_legal_cartography_selection);
    const derivedM9 = suppliedM9.length ? suppliedM9 : selectLegalIndexRows(legalIndexRows, rowKeywords);
    const pinpointed = selectUnitsForRow({ row, m9Rows: derivedM9, allUnits, indexPointersRequired: true });
    const sameBucketNavigation = pinpointed.length ? [] : selectUnitsForRow({ row, m9Rows: [], allUnits, indexPointersRequired: false });
    const rowUnits = [...pinpointed, ...sameBucketNavigation];

    if (!derivedM9.length) limitations.push({
      registry_row_key: row.registry_row_key || row.deterministic_registry_spine?.registry_row_key || "",
      Threat_ID: threatId,
      code: "M9_INDEX_GAP_NEAREST_PRIMARY_EVIDENCE_NAVIGATION_USED",
      message: "No usable legal-cartography pointer matched this row. The backend navigated within the same routed 2F primary evidence bucket and recorded the gap."
    });
    if (!rowUnits.length) limitations.push({
      registry_row_key: row.registry_row_key || row.deterministic_registry_spine?.registry_row_key || "",
      Threat_ID: threatId,
      code: "NO_RELEVANT_ROUTED_PRIMARY_EVIDENCE_UNIT_FOUND",
      message: "No relevant unit was found inside the routed 2F primary evidence bucket. The model must carry a public-evidence limitation."
    });

    rowBindings.push({
      registry_row_key: row.registry_row_key || row.deterministic_registry_spine?.registry_row_key || "",
      package_id: row.package_id || row.deterministic_registry_spine?.package_id || "",
      stream_id: row.stream_id || row.deterministic_registry_spine?.stream_id || "",
      Threat_ID: threatId,
      m9_rows_available: derivedM9.length,
      m9_selection_source: suppliedM9.length ? "ROUTE_ROW_SUPPLIED" : "DERIVED_FROM_SAVED_LEGAL_CARTOGRAPHY_INDEX",
      selection_policy: pinpointed.length ? "M9_INDEX_PINPOINTED_PRIMARY_EVIDENCE" : "INDEX_GAP_NEAREST_ROUTED_PRIMARY_EVIDENCE",
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
    route_id: "ROUTE.PHASE10.EXPOSURE_PROFILE",
    evidence_role: "PRIMARY_EVIDENCE",
    selection_method: "saved_m9_index_navigation_with_recorded_same_bucket_index_gap_navigation",
    direct_lossless_fallback_used: false,
    selected_lossless_unit_count: selected.length,
    lossless_units: selected,
    row_bindings: rowBindings,
    limitations
  };
}

function flattenLegalCartographyIndex(value) {
  const root = unwrap(value, "legal_cartography_index");
  const rows = [];
  walk(root, "legal_cartography_index", (path, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const serialized = JSON.stringify(item);
    if (serialized.length < 10) return;
    rows.push({ path, item, search_text: serialized.toLowerCase() });
  });
  return rows;
}

function selectLegalIndexRows(rows, keywords) {
  if (!rows.length || !keywords.length) return [];
  return rows.map((row) => ({ row, score: scoreText(row.search_text, keywords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => ({ index_path: entry.row.path, index_entry: entry.row.item }));
}

function buildLosslessUnitIndex(upstreamArtifacts, evidenceArtifactNames) {
  const units = [];
  for (const artifactName of evidenceArtifactNames) {
    const source = upstreamArtifacts[artifactName];
    if (source) units.push(...extractTextUnits({ artifactName, value: source }));
  }
  return units;
}

function extractTextUnits({ artifactName, value, path = artifactName, inherited = {} }) {
  const units = [];
  if (!value) return units;
  if (typeof value === "string") return splitIntoFullLosslessUnits({ artifactName, path, text: value, inherited });
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
    if (typeof item === "string" && TEXT_FIELD_NAMES.has(key) && item.trim().length > 40) units.push(...splitIntoFullLosslessUnits({ artifactName, path: `${path}.${key}`, text: item, inherited: nextInherited }));
    else if (item && typeof item === "object") units.push(...extractTextUnits({ artifactName, value: item, path: `${path}.${key}`, inherited: nextInherited }));
  }
  return units;
}

function splitIntoFullLosslessUnits({ artifactName, path, text, inherited }) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  return splitByParagraphParts(normalized).map((block, index) => ({
    unit_id: `${artifactName}::${path}::unit_${String(index + 1).padStart(3, "0")}`,
    artifact_name: artifactName,
    source_url: inherited.source_url || "",
    route_type: inherited.route_type || "",
    document_title: inherited.document_title || "",
    path,
    unit_index: index + 1,
    unit_selection_type: "FULL_PRIMARY_EVIDENCE_SECTION_OR_PART",
    heading: block.split("\n").find((line) => line.trim())?.trim().slice(0, 180) || "",
    text: block,
    search_text: [artifactName, inherited.source_url, inherited.document_title, inherited.route_type, block].join(" ").toLowerCase()
  }));
}

function splitByParagraphParts(text) {
  const paragraphs = String(text || "").split(/\n\s*\n+/).map((part) => part.trim()).filter(Boolean);
  if (paragraphs.length <= 1) return [String(text || "").trim()].filter(Boolean);
  const parts = [];
  let current = [];
  let size = 0;
  for (const paragraph of paragraphs) {
    if (size > 0 && size + paragraph.length > 6000) { parts.push(current.join("\n\n")); current = []; size = 0; }
    current.push(paragraph); size += paragraph.length;
  }
  if (current.length) parts.push(current.join("\n\n"));
  return parts;
}

function selectUnitsForRow({ row, m9Rows, allUnits, indexPointersRequired }) {
  const rowKeywords = buildRowKeywords(row);
  const m9Keywords = buildM9Keywords(m9Rows);
  const keywords = unique([...(indexPointersRequired ? m9Keywords : []), ...rowKeywords]).slice(0, MAX_KEYWORDS_PER_ROW);
  if (!keywords.length) return [];
  return allUnits.map((unit) => ({ unit, score: scoreUnit(unit, keywords, indexPointersRequired ? m9Keywords : []) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, indexPointersRequired ? 4 : 2)
    .map((entry) => stripSearchText(entry.unit));
}

function buildRowKeywords(row = {}) {
  const spine = row.deterministic_registry_spine || {};
  const raw = [
    row.Threat_ID, row.Threat_Name, row.Archetype, row.Subcategory, row.Surface,
    spine.Threat_ID, spine.Threat_Name, spine.Archetype, spine.Subcategory, spine.Surface,
    spine.Legal_Pain, spine.base_fp_mechanism, spine.Hunter_Trigger,
    ...(spine.authority_anchors || []), ...(row.matched_activity_references || [])
  ].filter(Boolean).join(" ").toLowerCase();
  return unique(raw.split(/[^a-z0-9_\u00a7.-]+/).filter((word) => word.length >= 4)).slice(0, MAX_KEYWORDS_PER_ROW);
}
function buildM9Keywords(rows) { return unique(JSON.stringify(rows || []).toLowerCase().split(/[^a-z0-9_\u00a7.-]+/).filter((word) => word.length >= 4)).slice(0, MAX_KEYWORDS_PER_ROW); }
function scoreUnit(unit, keywords, m9Keywords) { let score = scoreText(unit.search_text || "", keywords); for (const keyword of m9Keywords) if ((unit.search_text || "").includes(keyword)) score += 2; return score; }
function scoreText(text, keywords) { let score = 0; for (const keyword of keywords) if (String(text || "").includes(keyword)) score += 1; return score; }
function stripSearchText(unit) { const { search_text, ...rest } = unit; return rest; }
function walk(value, path, visitor) {
  if (!value || typeof value !== "object") return;
  visitor(path, value);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}[${index}]`, visitor));
  else for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`, visitor);
}
function unwrap(value, key) { return value?.[key] && typeof value[key] === "object" ? value[key] : value || {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function unique(items) { return [...new Set(asArray(items).filter(Boolean))]; }

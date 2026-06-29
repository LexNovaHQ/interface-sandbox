const LEGAL_GOVERNANCE_FAMILY_ARTIFACTS = Object.freeze([
  "lossless_family__L1_CORE_TERMS_PRIVACY",
  "lossless_family__L2_B2B_CONTRACTING",
  "lossless_family__L3_AI_USAGE_GOVERNANCE",
  "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  "lossless_family__L5_LEGAL_HUB_HOSTED",
  "lossless_family__L6_ENTITY_NOTICE"
]);

const MAX_SECTIONS_PER_SOURCE = 120;
const MAX_REFERENCES_PER_SOURCE = 50;

export const M9_DETERMINISTIC_ARTIFACT_NAME = "legal_cartography_deterministic_map";

export function buildM9DeterministicMap({ run = {}, artifacts = {} } = {}) {
  const sourceDiscovery = unwrapArtifact(artifacts.source_discovery_handoff);
  const runId = run.run_id || sourceDiscovery?.run_id || findRunId(artifacts) || "UNKNOWN_RUN";
  const targetUrl = run.target_url || sourceDiscovery?.target_url || "";

  const documentMap = [];
  const sectionMap = [];
  const embeddedUnitMap = [];
  const referencedDocumentMap = [];
  const missingSourceMap = [];
  const sourceArtifactsRead = [];
  const qualityRepairQueue = [];

  for (const artifactName of LEGAL_GOVERNANCE_FAMILY_ARTIFACTS) {
    const family = unwrapArtifact(artifacts[artifactName]);
    sourceArtifactsRead.push(readSummaryForFamily({ artifactName, family }));
    ingestFamily({
      artifactName,
      family,
      documentMap,
      sectionMap,
      embeddedUnitMap,
      referencedDocumentMap,
      missingSourceMap,
      qualityRepairQueue
    });
  }

  ingestSourceDiscoveryLegalAbsences({
    sourceDiscovery,
    missingSourceMap,
    qualityRepairQueue
  });

  const mapStatus = resolveMapStatus({ documentMap, sourceArtifactsRead, qualityRepairQueue });

  return {
    [M9_DETERMINISTIC_ARTIFACT_NAME]: {
      run_id: runId,
      target_url: targetUrl,
      generated_by: "m9_hybrid_deterministic_layer",
      schema_version: "M9_DETERMINISTIC_LEGAL_MAP_v1",
      model_used: false,
      artifact_role: "M9 factual navigation map. This is not legal evidence and does not replace lossless source text.",
      source_text_policy: {
        lossless_artifacts_remain_source_of_truth: true,
        full_legal_text_copied_into_map: false,
        full_control_text_copied_into_map: false,
        downstream_must_use_navigation_pointers_to_read_lossless_text: true
      },
      source_artifacts_read: sourceArtifactsRead,
      document_map: documentMap,
      section_map: sectionMap,
      embedded_unit_map: embeddedUnitMap,
      referenced_document_map: referencedDocumentMap,
      missing_source_map: dedupeRows(missingSourceMap, (row) => [row.missing_or_limited_item, row.expected_location, row.search_basis].join("|")),
      quality_repair_queue: dedupeRows(qualityRepairQueue, (row) => [row.repair_type, row.scope, row.pointer || row.document_id || row.source_artifact].join("|")),
      downstream_rules: {
        m9_deterministic_layer_only: true,
        legal_advice_forbidden: true,
        compliance_conclusions_forbidden: true,
        sufficiency_conclusions_forbidden: true,
        enforceability_assessments_forbidden: true,
        risk_conclusions_forbidden: true,
        registry_evaluation_forbidden: true,
        no_new_url_discovery: true,
        no_new_extraction: true,
        use_only_loaded_legal_corpus: true,
        map_not_parallel_evidence: true,
        semantic_labels_pending: true,
        reinvestigation_before_blocking: true
      },
      status: mapStatus,
      lock_status: mapStatus
    }
  };
}

function ingestFamily({ artifactName, family, documentMap, sectionMap, embeddedUnitMap, referencedDocumentMap, missingSourceMap, qualityRepairQueue }) {
  if (!family || typeof family !== "object") {
    missingSourceMap.push(missingFamilyRow({ artifactName, reason: "Artifact not available to deterministic M9 layer." }));
    qualityRepairQueue.push(repairRow({
      repair_type: "MISSING_SOURCE_ARTIFACT",
      scope: artifactName,
      source_artifact: artifactName,
      reason: "Legal/governance lossless family artifact was not supplied."
    }));
    return;
  }

  const sources = asArray(family.sources);
  const missing = asArray(family.missing_limited_primary_sources);
  const rejected = asArray(family.rejected_sources);
  const manifestOnly = asArray(family.manifest_only_sources);
  const metadataOnly = asArray(family.metadata_only_sources);

  for (const source of sources) {
    ingestSource({ artifactName, family, source, documentMap, sectionMap, embeddedUnitMap, referencedDocumentMap, qualityRepairQueue });
  }

  for (const row of missing) {
    missingSourceMap.push(missingRowFromSource({ artifactName, row, status: "STANDALONE_SOURCE_ABSENT" }));
  }

  for (const row of rejected) {
    missingSourceMap.push(missingRowFromSource({ artifactName, row, status: "SOURCE_REJECTED_OR_FAILED" }));
  }

  for (const row of manifestOnly) {
    missingSourceMap.push(missingRowFromSource({ artifactName, row, status: "REFERENCED_BUT_NOT_FETCHED" }));
  }

  for (const row of metadataOnly) {
    missingSourceMap.push(missingRowFromSource({ artifactName, row, status: "UNKNOWN_NOT_SEARCHED" }));
  }
}

function ingestSource({ artifactName, family, source, documentMap, sectionMap, embeddedUnitMap, referencedDocumentMap, qualityRepairQueue }) {
  const text = String(source?.lossless_text || "");
  const sourceId = source.source_id || `${family.root_family || artifactName}.SRC.${String(documentMap.length + 1).padStart(3, "0")}`;
  const documentId = makeId(sourceId);
  const title = deriveDocumentTitle({ source, text });
  const artifactClass = inferArtifactClass({ source, title, text });
  const sourceUrl = source.final_url || source.url || source.canonical_url || "";

  documentMap.push({
    document_id: documentId,
    document_or_artifact: title,
    artifact_class: artifactClass,
    lossless_artifact_name: artifactName,
    root_family: source.root_family || family.root_family || family.artifact_name || stripLosslessPrefix(artifactName),
    source: sourceUrl,
    source_url: sourceUrl,
    canonical_url: source.canonical_url || source.url || "",
    source_type: "URL",
    source_corpus_status: "FOUND_AS_PRIMARY_SOURCE",
    status: "FOUND_INDEXED",
    route_type: source.route_type || "",
    document_role: source.tier_reason || source.materiality || family.purpose || "Loaded legal/governance source.",
    text_pointer: {
      lossless_artifact_name: artifactName,
      source_id: sourceId,
      text_field: "lossless_text",
      sha256: source.sha256 || "",
      char_count: text.length
    },
    limitation: text ? "" : "Loaded source has no lossless_text available to deterministic M9."
  });

  if (!text) {
    qualityRepairQueue.push(repairRow({
      repair_type: "MISSING_LOSSLESS_TEXT",
      scope: "document",
      document_id: documentId,
      source_artifact: artifactName,
      pointer: sourceId,
      reason: "Source row exists but lossless_text is empty."
    }));
    return;
  }

  const sections = extractSectionPointers({ artifactName, source, sourceId, documentId, title, text });
  if (!sections.length) {
    qualityRepairQueue.push(repairRow({
      repair_type: "SECTION_MAP_THIN",
      scope: "document",
      document_id: documentId,
      source_artifact: artifactName,
      pointer: sourceId,
      reason: "Deterministic heading scan found no section boundaries; fallback whole-document pointer should be used downstream."
    }));
    sectionMap.push(fallbackWholeDocumentSection({ artifactName, source, sourceId, documentId, title, text }));
  } else {
    sectionMap.push(...sections);
  }

  for (const section of sections) {
    if (isEmbeddedLegalUnit(section)) embeddedUnitMap.push(embeddedRowFromSection(section));
  }

  const references = extractReferencedUrls({ text, sourceUrl, sourceId, artifactName, title });
  referencedDocumentMap.push(...references);
}

function extractSectionPointers({ artifactName, source, sourceId, documentId, title, text }) {
  const lines = splitLinesWithOffsets(text);
  const headingIndexes = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (looksLikeHeading(line.text, i)) headingIndexes.push(i);
    if (headingIndexes.length >= MAX_SECTIONS_PER_SOURCE) break;
  }

  if (!headingIndexes.length) return [];

  const rows = [];
  for (let i = 0; i < headingIndexes.length; i += 1) {
    const startLine = lines[headingIndexes[i]];
    const nextLine = headingIndexes[i + 1] !== undefined ? lines[headingIndexes[i + 1]] : null;
    const charStart = startLine.start;
    const charEnd = nextLine ? Math.max(charStart, nextLine.start - 1) : text.length;
    const heading = cleanHeading(startLine.text) || `Section ${String(i + 1).padStart(3, "0")}`;
    const sectionId = `${makeId(sourceId)}.SEC.${String(i + 1).padStart(3, "0")}`;

    rows.push({
      section_id: sectionId,
      document_id: makeId(documentId),
      host_document: title,
      internal_unit: heading,
      unit_type: inferUnitType(heading),
      relationship_to_host: "HOSTS_UNIT",
      apparent_function: "DETERMINISTIC_UNLABELED_SEMANTIC_LAYER_PENDING",
      lossless_artifact_name: artifactName,
      source: source.final_url || source.url || source.canonical_url || "",
      source_type: "URL",
      source_corpus_status: "FOUND_AS_PRIMARY_SOURCE",
      status: "FOUND_INDEXED",
      heading_path: [title, heading],
      navigation_pointer: {
        lossless_artifact_name: artifactName,
        source_id: sourceId,
        text_field: "lossless_text",
        line_start: startLine.line_number,
        line_end: nextLine ? Math.max(startLine.line_number, nextLine.line_number - 1) : lines.length,
        char_start: charStart,
        char_end: charEnd,
        char_count: Math.max(0, charEnd - charStart)
      },
      limitation: "Semantic topic/control labels pending M9 semantic layer."
    });
  }

  return rows;
}

function fallbackWholeDocumentSection({ artifactName, source, sourceId, documentId, title, text }) {
  return {
    section_id: `${makeId(sourceId)}.SEC.000`,
    document_id: makeId(documentId),
    host_document: title,
    internal_unit: "Whole document fallback pointer",
    unit_type: "DOCUMENT_BODY",
    relationship_to_host: "HOSTS_UNIT",
    apparent_function: "DETERMINISTIC_FALLBACK_SEMANTIC_LAYER_PENDING",
    lossless_artifact_name: artifactName,
    source: source.final_url || source.url || source.canonical_url || "",
    source_type: "URL",
    source_corpus_status: "FOUND_AS_PRIMARY_SOURCE",
    status: "FOUND_THIN",
    heading_path: [title],
    navigation_pointer: {
      lossless_artifact_name: artifactName,
      source_id: sourceId,
      text_field: "lossless_text",
      line_start: 1,
      line_end: splitLinesWithOffsets(text).length,
      char_start: 0,
      char_end: text.length,
      char_count: text.length
    },
    limitation: "No deterministic section boundary found; downstream may read the full source through this pointer."
  };
}

function extractReferencedUrls({ text, sourceUrl, sourceId, artifactName, title }) {
  const rows = [];
  const seen = new Set();
  const regex = /https?:\/\/[^\s)\]"'<>]+/gi;
  let match;
  while ((match = regex.exec(text)) && rows.length < MAX_REFERENCES_PER_SOURCE) {
    const url = stripTrailingPunctuation(match[0]);
    if (!url || url === sourceUrl || seen.has(url)) continue;
    seen.add(url);
    rows.push({
      reference_id: `${makeId(sourceId)}.REF.${String(rows.length + 1).padStart(3, "0")}`,
      referring_document: title,
      referenced_document_or_policy: inferNameFromUrl(url),
      source_or_reference: url,
      relationship: "REFERENCED_IN_LOSSLESS_TEXT",
      lossless_artifact_name: artifactName,
      source_type: "REFERENCED_URL",
      source_corpus_status: "REFERENCED_BUT_NOT_FETCHED",
      artifact_class: inferArtifactClass({ source: { url }, title: inferNameFromUrl(url), text: "" }),
      status: "REFERENCED_BUT_NOT_FETCHED",
      navigation_pointer: {
        lossless_artifact_name: artifactName,
        source_id: sourceId,
        text_field: "lossless_text",
        char_start: match.index,
        char_end: match.index + match[0].length
      },
      limitation: "Reference detected inside loaded legal corpus; deterministic M9 does not fetch new URLs."
    });
  }
  return rows;
}

function ingestSourceDiscoveryLegalAbsences({ sourceDiscovery, missingSourceMap, qualityRepairQueue }) {
  const families = sourceDiscovery?.bucket_family_index?.legal_governance_profile_urls?.families;
  if (!families || typeof families !== "object") return;

  for (const [familyCode, family] of Object.entries(families)) {
    for (const absent of asArray(family?.failed_absent)) {
      missingSourceMap.push({
        missing_id: `M6.${makeId(familyCode)}.ABS.${String(missingSourceMap.length + 1).padStart(3, "0")}`,
        missing_or_limited_item: absent.missing || familyCode,
        expected_location: familyCode,
        source_artifact: family.file || `lossless_family__${familyCode}`,
        search_basis: attemptedPaths(absent),
        source_type: "ABSENT_FAMILY",
        source_corpus_status: "STANDALONE_SOURCE_ABSENT",
        artifact_class: inferArtifactClass({ source: { route_type: familyCode }, title: familyCode, text: "" }),
        status: "STANDALONE_SOURCE_ABSENT",
        limitation: "Absence carried from source discovery targeted probe; deterministic M9 does not fetch new URLs."
      });
    }
  }

  if (!Object.keys(families).length) {
    qualityRepairQueue.push(repairRow({
      repair_type: "LEGAL_DISCOVERY_INDEX_EMPTY",
      scope: "source_discovery_handoff",
      reason: "source_discovery_handoff has no legal_governance_profile_urls families."
    }));
  }
}

function readSummaryForFamily({ artifactName, family }) {
  const unwrapped = family && typeof family === "object" ? family : {};
  return {
    artifact_name: artifactName,
    supplied: Boolean(family),
    root_family: unwrapped.root_family || stripLosslessPrefix(artifactName),
    sources_count: asArray(unwrapped.sources).length,
    missing_limited_count: asArray(unwrapped.missing_limited_primary_sources).length,
    rejected_count: asArray(unwrapped.rejected_sources).length,
    manifest_only_count: asArray(unwrapped.manifest_only_sources).length,
    metadata_only_count: asArray(unwrapped.metadata_only_sources).length
  };
}

function missingFamilyRow({ artifactName, reason }) {
  return {
    missing_id: `${makeId(artifactName)}.ABS.000`,
    missing_or_limited_item: stripLosslessPrefix(artifactName),
    expected_location: artifactName,
    source_artifact: artifactName,
    search_basis: "Artifact not supplied to M9 deterministic layer.",
    source_type: "ABSENT_FAMILY",
    source_corpus_status: "UNKNOWN_NOT_SEARCHED",
    artifact_class: "UNKNOWN_LEGAL_ARTIFACT",
    status: "UNKNOWN_NOT_SEARCHED",
    limitation: reason
  };
}

function missingRowFromSource({ artifactName, row, status }) {
  const name = row.missing || row.document_or_artifact || row.url || row.canonical_url || row.route_type || row.source_id || "Unknown legal/governance item";
  return {
    missing_id: `${makeId(artifactName)}.ABS.${makeId(String(name)).slice(0, 48)}`,
    missing_or_limited_item: String(name),
    expected_location: row.expected_location || row.route_type || stripLosslessPrefix(artifactName),
    source_artifact: artifactName,
    search_basis: attemptedPaths(row),
    source_type: status === "REFERENCED_BUT_NOT_FETCHED" ? "REFERENCED_URL" : "ABSENT_FAMILY",
    source_corpus_status: status,
    artifact_class: inferArtifactClass({ source: row, title: String(name), text: "" }),
    status,
    limitation: row.limitation || row.reason || row.error || row.status || "Carried from loaded legal/governance source family metadata."
  };
}

function repairRow({ repair_type, scope, source_artifact = "", document_id = "", pointer = "", reason }) {
  return {
    repair_type,
    scope,
    source_artifact,
    document_id,
    pointer,
    reason,
    blocking: false,
    recommended_action: "Route to M9 reinvestigation if this affects downstream navigation; otherwise carry limitation."
  };
}

function embeddedRowFromSection(section) {
  return {
    embedded_unit_id: section.section_id,
    host_document: section.host_document,
    internal_unit: section.internal_unit,
    unit_type: section.unit_type,
    relationship_to_host: "EMBEDDED_OR_INTERNAL_LEGAL_UNIT",
    lossless_artifact_name: section.lossless_artifact_name,
    source: section.source,
    source_type: "EMBEDDED_UNIT",
    source_corpus_status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
    status: "FOUND_EMBEDDED_IN_LEGAL_CORPUS",
    navigation_pointer: section.navigation_pointer,
    limitation: "Deterministically detected embedded/internal legal unit; semantic confirmation pending."
  };
}

function looksLikeHeading(rawLine, index) {
  const line = cleanHeading(rawLine);
  if (!line) return false;
  if (index <= 2 && line.length <= 140) return true;
  if (line.length > 180) return false;
  if (wordCount(line) > 18) return false;
  if (/^(\d+(\.\d+)*|[A-Z]\.|[IVX]+\.|\([a-z0-9]+\))\s+\S+/i.test(line)) return true;
  if (/^(annexure|schedule|exhibit|appendix|addendum|attachment)\b/i.test(line)) return true;
  if (/\b(policy|agreement|terms|notice|privacy|security|support|service level|data processing|acceptable use|subprocessor|retention|deletion|children|minors|breach|incident|confidentiality|intellectual property|ownership|disclaimer|limitations?)\b/i.test(line) && wordCount(line) <= 12) return true;
  if (line === line.toUpperCase() && /[A-Z]/.test(line) && wordCount(line) <= 12) return true;
  return false;
}

function inferUnitType(heading) {
  if (/^annexure\b/i.test(heading)) return "ANNEXURE";
  if (/^schedule\b/i.test(heading)) return "SCHEDULE";
  if (/^exhibit\b/i.test(heading)) return "EXHIBIT";
  if (/^appendix\b/i.test(heading)) return "APPENDIX";
  if (/^addendum\b/i.test(heading)) return "ADDENDUM";
  if (/notice/i.test(heading)) return "NOTICE";
  return "SECTION";
}

function isEmbeddedLegalUnit(section) {
  const text = `${section.internal_unit} ${section.unit_type}`.toLowerCase();
  return ["annexure", "schedule", "exhibit", "appendix", "addendum", "data processing", "dpa", "service level", "sla", "support terms", "acceptable use", "subprocessor"].some((needle) => text.includes(needle));
}

function deriveDocumentTitle({ source, text }) {
  const firstLine = splitLinesWithOffsets(text).map((line) => cleanHeading(line.text)).find(Boolean);
  if (firstLine && firstLine.length <= 180) return firstLine;
  if (source.route_type) return titleCase(String(source.route_type).replace(/_/g, " "));
  return inferNameFromUrl(source.final_url || source.url || source.canonical_url || "Loaded legal document");
}

function inferArtifactClass({ source = {}, title = "", text = "" }) {
  const haystack = `${source.route_type || ""} ${source.url || ""} ${source.final_url || ""} ${source.canonical_url || ""} ${title} ${text.slice(0, 500)}`.toLowerCase();
  if (haystack.includes("eula") || haystack.includes("end user license")) return "EULA";
  if (haystack.includes("privacy-policy") || haystack.includes("privacy policy")) return "PRIVACY_POLICY";
  if (haystack.includes("cookie")) return "COOKIE_POLICY";
  if (haystack.includes("terms-of-service") || haystack.includes("terms of service") || /\bterms\b/.test(haystack)) return "TERMS_OF_SERVICE";
  if (haystack.includes("data processing") || haystack.includes("dpa")) return "DATA_PROCESSING_AGREEMENT";
  if (haystack.includes("subprocessor")) return "SUBPROCESSOR_LIST";
  if (haystack.includes("acceptable use") || haystack.includes("aup")) return "ACCEPTABLE_USE_POLICY";
  if (haystack.includes("support")) return "SUPPORT_TERMS";
  if (haystack.includes("service level") || haystack.includes("sla")) return "SLA_SUPPORT_TERMS";
  if (haystack.includes("trust") || haystack.includes("security")) return "TRUST_CENTER";
  if (haystack.includes("legal notice") || haystack.includes("impressum")) return "LEGAL_NOTICE_IMPRESSUM";
  if (haystack.includes("transparency")) return "TRANSPARENCY_REPORT";
  if (haystack.includes("content policy") || haystack.includes("usage policy")) return "CONTENT_POLICY";
  if (haystack.includes("responsible ai") || haystack.includes("ai policy") || haystack.includes("ai terms")) return "AI_TERMS_POLICY";
  return "UNKNOWN_LEGAL_ARTIFACT";
}

function splitLinesWithOffsets(text) {
  const rows = [];
  const parts = String(text || "").split(/\n/);
  let offset = 0;
  for (let i = 0; i < parts.length; i += 1) {
    rows.push({ line_number: i + 1, start: offset, text: parts[i] });
    offset += parts[i].length + 1;
  }
  return rows;
}

function cleanHeading(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function wordCount(value) {
  return cleanHeading(value).split(/\s+/).filter(Boolean).length;
}

function attemptedPaths(row) {
  if (Array.isArray(row?.attempted_paths) && row.attempted_paths.length) return row.attempted_paths.join(", ");
  if (Array.isArray(row?.searched_paths) && row.searched_paths.length) return row.searched_paths.join(", ");
  if (row?.search_basis) return String(row.search_basis);
  if (row?.url || row?.canonical_url) return String(row.url || row.canonical_url);
  return "Source family metadata / source discovery handoff.";
}

function stripLosslessPrefix(value) {
  return String(value || "").replace(/^lossless_family__/, "");
}

function makeId(value) {
  return String(value || "UNKNOWN").toUpperCase().replace(/[^A-Z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 96) || "UNKNOWN";
}

function inferNameFromUrl(url) {
  const clean = stripTrailingPunctuation(String(url || ""));
  try {
    const parsed = new URL(clean);
    const last = parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
    return titleCase(decodeURIComponent(last).replace(/[-_]/g, " "));
  } catch {
    return titleCase(clean.replace(/[-_]/g, " ").slice(0, 80) || "Referenced Legal Artifact");
  }
}

function stripTrailingPunctuation(value) {
  return String(value || "").replace(/[.,;:]+$/g, "");
}

function titleCase(value) {
  return String(value || "").replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unwrapArtifact(value) {
  if (!value || typeof value !== "object") return value;
  if (value.artifact && typeof value.artifact === "object") return value.artifact;
  return value;
}

function findRunId(artifacts) {
  for (const value of Object.values(artifacts || {})) {
    const artifact = unwrapArtifact(value);
    if (artifact?.run_id) return artifact.run_id;
  }
  return "";
}

function dedupeRows(rows, keyFn) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = keyFn(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function resolveMapStatus({ documentMap, sourceArtifactsRead, qualityRepairQueue }) {
  if (!sourceArtifactsRead.some((row) => row.supplied)) return "CONTROLLED_FAILURE";
  if (!documentMap.length) return "LOCKED_WITH_LIMITATIONS";
  if (qualityRepairQueue.length) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

const OVERLAY_NAME = "m7_deterministic_legal_signal_overlay";
const TARGET_PROFILE = "target_profile";

const FIELD_RULES = Object.freeze([
  {
    field_path: "target_identity.legal_entity_name",
    label: "Legal entity / contracting party signal",
    source_keys: ["legal_notice_locator", "document_coverage_index", "document_structure_index"],
    direct_keys: ["legal_entity_name", "contracting_party", "contracting_entity", "company_name", "operator_entity", "notice_entity", "entity_name"],
    extractors: [extractLegalEntityName]
  },
  {
    field_path: "jurisdiction_notice.governing_law",
    label: "Governing law signal",
    source_keys: ["governing_law_venue_locator", "dispute_resolution_locator", "document_structure_index"],
    direct_keys: ["governing_law", "law", "governing_law_signal", "applicable_law"],
    extractors: [extractGoverningLaw]
  },
  {
    field_path: "jurisdiction_notice.courts_venue",
    label: "Court / venue signal",
    source_keys: ["governing_law_venue_locator", "dispute_resolution_locator", "document_structure_index"],
    direct_keys: ["courts_venue", "venue", "forum", "jurisdiction", "dispute_forum", "court", "courts"],
    extractors: [extractCourtsVenue]
  }
]);

export function buildM7DeterministicLegalSignalOverlay({ artifacts = {} } = {}) {
  const legalIndex = unwrapLegalCartographyIndex(artifacts.legal_cartography_index);
  const material_field_overlay = {};
  const field_derivation_ledger = [];
  const limitation_ledger = [];

  for (const rule of FIELD_RULES) {
    const result = deriveField({ legalIndex, rule });
    material_field_overlay[rule.field_path] = result.value;
    field_derivation_ledger.push({
      field_path: rule.field_path,
      label: rule.label,
      status: result.status,
      value: result.value,
      source: result.source,
      source_url: result.source_url,
      source_ref: result.source_ref,
      derivation_method: result.derivation_method,
      limitation: result.limitation
    });
    if (result.status !== "FOUND") {
      limitation_ledger.push({
        field_path: rule.field_path,
        status: result.status,
        limitation: result.limitation,
        qualified_review_action: "Confirm during Qualified Review if the field is needed for document assembly."
      });
    }
  }

  return {
    artifact_name: OVERLAY_NAME,
    schema_version: "M7_DETERMINISTIC_LEGAL_SIGNAL_OVERLAY_v1",
    source_artifact: "legal_cartography_index",
    model_generated: false,
    reads_lossless_legal_families: false,
    overlay_policy: {
      applies_only_to_m7_target_profile: true,
      allowed_fields: FIELD_RULES.map((rule) => rule.field_path),
      may_override_model_output_when_status_found: true,
      must_not_create_legal_analysis: true,
      must_not_load_l1_l6_lossless_families: true
    },
    material_field_overlay,
    field_derivation_ledger,
    limitation_ledger
  };
}

export function applyM7DeterministicLegalSignalOverlay(output, overlay) {
  const profile = output?.[TARGET_PROFILE];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return output;
  const ledger = Array.isArray(overlay?.field_derivation_ledger) ? overlay.field_derivation_ledger : [];
  for (const row of ledger) {
    if (row?.status !== "FOUND") continue;
    const value = cleanSignal(row.value);
    if (!value) continue;
    setPath(profile, row.field_path, value);
  }
  return output;
}

function deriveField({ legalIndex, rule }) {
  const rows = rule.source_keys.flatMap((key) => asArray(legalIndex[key]).map((row) => ({ key, row })));
  for (const { key, row } of rows) {
    if (!isPublicIndexedRow(row)) continue;
    const direct = firstDirectValue(row, rule.direct_keys);
    if (direct) return found({ value: direct, row, key, method: "direct_normalized_locator_field" });
    const text = rowText(row);
    for (const extractor of rule.extractors) {
      const extracted = extractor(text);
      if (extracted) return found({ value: extracted, row, key, method: "deterministic_locator_text_pattern" });
    }
  }
  return {
    status: "NOT_FOUND",
    value: "",
    source: "legal_cartography_index",
    source_url: "",
    source_ref: "",
    derivation_method: "deterministic_locator_scan",
    limitation: `${rule.label} was not deterministically visible in the locked legal_cartography_index locator rows.`
  };
}

function found({ value, row, key, method }) {
  return {
    status: "FOUND",
    value: cleanSignal(value),
    source: key,
    source_url: row.source_url || row.url || row.href || "",
    source_ref: row.source_ref || row.source_id || row.unit_id || row.queue_id || row.document_id || "",
    derivation_method: method,
    limitation: ""
  };
}

function unwrapLegalCartographyIndex(value) {
  if (value?.legal_cartography_index && typeof value.legal_cartography_index === "object") return value.legal_cartography_index;
  if (value?.artifact?.legal_cartography_index && typeof value.artifact.legal_cartography_index === "object") return value.artifact.legal_cartography_index;
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function isPublicIndexedRow(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return false;
  if (row.display_in_main_report === false || row.technical_annexure_only === true) return true;
  const status = String(row.status || row.source_corpus_status || "").toUpperCase();
  if (!status) return true;
  return status.includes("FOUND") || status.includes("INDEXED") || status.includes("EMBEDDED");
}

function firstDirectValue(row, keys) {
  for (const key of keys) {
    const value = cleanSignal(row?.[key]);
    if (value) return value;
  }
  return "";
}

function extractLegalEntityName(text) {
  return firstRegex(text, [
    /(?:contracting party|contracting entity|legal entity|company name|provider entity|operator entity)\s*[:\-]\s*([A-Z][A-Za-z0-9&.,'’()\- ]{2,120})/i,
    /(?:owned and operated by|provided by|operated by)\s+([A-Z][A-Za-z0-9&.,'’()\- ]{2,120})/i,
    /©\s*\d{4}\s+([A-Z][A-Za-z0-9&.,'’()\- ]{2,120})/i
  ]);
}

function extractGoverningLaw(text) {
  return firstRegex(text, [
    /governed by(?: and construed in accordance with)?\s+(?:the\s+)?laws? of\s+([^.;\n]{2,120})/i,
    /(?:governing law|applicable law)\s*[:\-]\s*([^.;\n]{2,120})/i,
    /laws? of\s+([A-Z][A-Za-z ,&()\-]{2,80})\s+(?:shall|will|govern|appl(?:y|ies))/i
  ]);
}

function extractCourtsVenue(text) {
  return firstRegex(text, [
    /(?:exclusive|non-exclusive)?\s*(?:jurisdiction|venue|forum)\s+(?:of|in|for)\s+([^.;\n]{2,120})/i,
    /(?:courts?|tribunals?)\s+(?:of|in|at)\s+([^.;\n]{2,120})/i,
    /(?:disputes?|claims?)\s+.*?(?:brought|resolved|submitted)\s+(?:in|before)\s+([^.;\n]{2,120})/i
  ]);
}

function firstRegex(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = cleanSignal(match?.[1] || "");
    if (value) return value;
  }
  return "";
}

function rowText(row) {
  const pieces = [];
  collectStringValues(row, pieces);
  return pieces.join(" ");
}

function collectStringValues(value, out) {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, out);
    return;
  }
  for (const item of Object.values(value)) collectStringValues(item, out);
}

function cleanSignal(value) {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  return raw
    .replace(/^(the\s+)?/i, "")
    .replace(/\s+(?:and any applicable conflict of laws rules|without regard to conflict of laws principles).*$/i, "")
    .replace(/[,:;\-–—\s]+$/g, "")
    .slice(0, 160)
    .trim();
}

function setPath(root, path, value) {
  const parts = String(path || "").split(".").filter(Boolean);
  if (!parts.length) return;
  let cursor = root;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

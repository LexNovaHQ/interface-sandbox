import { cleanText, shortExcerpt } from "./legal-text-extraction.service.js";

export function buildEvidenceBasis(rows = [], terms = [], limit = 3) {
  return rows.slice(0, limit).map((row) => ({
    source_artifact: row.artifact_name || "",
    source_path: row.path || "",
    source_document: row.document_name || "",
    source_url: row.source_url || "",
    unit_id: row.unit_id || "",
    evidence_excerpt: shortExcerpt(row.text || "", terms),
    source_status: row.source_status || ""
  })).filter((row) => row.evidence_excerpt || row.source_path || row.source_url || row.source_document);
}

export function buildLocatorBasis(rows = [], terms = [], limit = 3) {
  return rows.slice(0, limit).map((row) => ({
    source_artifact: row.artifact_name || "",
    source_path: row.path || "",
    source_document: row.document_name || "",
    source_url: row.source_url || "",
    unit_id: row.unit_id || "",
    locator_excerpt: shortExcerpt(row.text || "", terms),
    source_status: row.source_status || ""
  })).filter((row) => row.locator_excerpt || row.source_path || row.source_url || row.source_document);
}

export function scannedSourceSummary(rows = []) {
  const byArtifact = new Map();
  for (const row of rows) {
    const key = row.artifact_name || "unknown_artifact";
    const current = byArtifact.get(key) || { source_artifact: key, row_count: 0, sample_paths: [] };
    current.row_count += 1;
    if (current.sample_paths.length < 5 && row.path) current.sample_paths.push(row.path);
    byArtifact.set(key, current);
  }
  return [...byArtifact.values()];
}

export function emptySignalRow({ field_id, field_key, field_family, status, scanned_sources, failure_reason, locator_basis = [], limitation = "" }) {
  return {
    field_id,
    field_key,
    field_family,
    derivation_status: status,
    value: "",
    evidence_basis: [],
    locator_basis,
    scanned_sources,
    failure_reason,
    limitation,
    confidence: status === "NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN" ? "NO_PUBLIC_SIGNAL" : "LIMITED_PUBLIC_SIGNAL",
    downstream_consumers: downstreamConsumersForFamily(field_family)
  };
}

export function derivedSignalRow({ field_id, field_key, field_family, value, evidence_basis, limitation = "", status = "DERIVED", confidence = "HIGH" }) {
  const cleanValue = cleanText(value);
  const cleanLimitation = cleanText(limitation);
  return {
    field_id,
    field_key,
    field_family,
    derivation_status: status,
    value: cleanValue,
    evidence_basis: evidence_basis || [],
    locator_basis: [],
    scanned_sources: [],
    failure_reason: "",
    limitation: cleanLimitation,
    confidence,
    downstream_consumers: downstreamConsumersForFamily(field_family)
  };
}

export function limitationRow({ field_id, field_key, field_family, value, evidence_basis, limitation, confidence = "MEDIUM" }) {
  return derivedSignalRow({
    field_id,
    field_key,
    field_family,
    value,
    evidence_basis,
    limitation,
    status: "DERIVED_WITH_LIMITATION",
    confidence
  });
}

export function downstreamConsumersForFamily(fieldFamily) {
  if (fieldFamily === "legal_notice_contact_signal_map" || fieldFamily === "jurisdiction_dispute_signal_map") return ["M7_TARGET_PROFILE", "NORMALIZED_COMPILER", "QUALIFIED_REVIEW", "ASSEMBLY_ENGINE"];
  if (fieldFamily === "privacy_grievance_contact_signal_map" || fieldFamily === "consent_manager_signal_map") return ["M10", "NORMALIZED_COMPILER", "QUALIFIED_REVIEW", "ASSEMBLY_ENGINE"];
  return ["NORMALIZED_COMPILER", "QUALIFIED_REVIEW", "ASSEMBLY_ENGINE"];
}

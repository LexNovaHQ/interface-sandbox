import crypto from "node:crypto";
import Busboy from "busboy";
import { saveBinaryFileToDrive, saveJsonArtifactToDrive, readJsonArtifactFromDrive } from "./drive.js";

const MAX_FILES = 4;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 7 * 1024 * 1024;
const MAX_TEXT = 160000;
const ACCEPTED = new Set([".pdf", ".docx", ".txt", ".md", ".html", ".htm"]);
const FAMILY_BUCKET = Object.freeze({ D1_SECURITY_TRUST: "data_asset_provenance_profile_urls", D2_SUBPROCESSOR_PRIVACY_CENTER: "data_asset_provenance_profile_urls", D5_AI_SAFETY_TRANSPARENCY: "data_asset_provenance_profile_urls", L1_CORE_TERMS_PRIVACY: "legal_governance_profile_urls", L2_B2B_CONTRACTING: "legal_governance_profile_urls", L3_AI_USAGE_GOVERNANCE: "legal_governance_profile_urls", L4_PRIVACY_ADJACENT_NOTICES: "legal_governance_profile_urls", L5_LEGAL_HUB_HOSTED: "legal_governance_profile_urls", L6_ENTITY_NOTICE: "legal_governance_profile_urls" });

export function parseMultipartDiligenceJob(req) {
  return new Promise((resolve, reject) => {
    const contentType = String(req.headers["content-type"] || "");
    if (!contentType.toLowerCase().includes("multipart/form-data")) return reject(new Error("INVALID_REQUEST:multipart_required"));
    const fields = {};
    const files = [];
    let totalBytes = 0;
    let settled = false;
    const done = (error, value) => { if (settled) return; settled = true; error ? reject(error) : resolve(value); };
    const busboy = Busboy({ headers: req.headers, limits: { files: MAX_FILES, fileSize: MAX_FILE_BYTES, fields: 12, parts: 24 } });
    busboy.on("field", (name, value) => { fields[String(name || "")] = String(value || "").trim(); });
    busboy.on("file", (_fieldname, file, info) => {
      const filename = cleanName(info?.filename || "uploaded-document");
      const mimeType = String(info?.mimeType || "application/octet-stream");
      const chunks = [];
      let limited = false;
      file.on("data", (chunk) => { totalBytes += chunk.length; if (totalBytes > MAX_TOTAL_BYTES) { limited = true; file.resume(); return; } chunks.push(chunk); });
      file.on("limit", () => { limited = true; });
      file.on("end", () => {
        if (limited) return done(new Error(`INVALID_REQUEST:file_too_large:${filename}`));
        const buffer = Buffer.concat(chunks);
        if (!buffer.length) return;
        const extension = extOf(filename);
        if (!ACCEPTED.has(extension)) return done(new Error(`INVALID_REQUEST:unsupported_file_type:${filename}`));
        files.push({ filename, mime_type: mimeType, buffer, size_bytes: buffer.length, extension });
      });
    });
    busboy.on("filesLimit", () => done(new Error(`INVALID_REQUEST:too_many_files:max_${MAX_FILES}`)));
    busboy.on("error", (error) => done(error));
    busboy.on("close", () => fields.target_url ? done(null, { fields, files }) : done(new Error("INVALID_REQUEST:target_url: Required")));
    req.pipe(busboy);
  });
}

export async function ingestUploadedSourceDocuments({ run, files, drive_folder_id }) {
  const uploaded = Array.isArray(files) ? files : [];
  if (!uploaded.length) return { source_mode: "url", uploaded_source_documents: { document_count: 0, extracted_document_count: 0 } };
  const documents = [];
  const sources = [];
  for (let index = 0; index < uploaded.length; index += 1) {
    const file = uploaded[index];
    const uploadedSourceId = `UPDOC.SRC.${String(index + 1).padStart(3, "0")}`;
    const original = await saveBinaryFileToDrive({ drive_folder_id, filename: `uploaded_source_${String(index + 1).padStart(3, "0")}__${file.filename}`, mime_type: file.mime_type, buffer: file.buffer });
    const extracted = await extractDocumentText(file);
    const classification = classifyUploadedDocument(file.filename, extracted.text);
    const source = { uploaded_source_id: uploadedSourceId, source_type: "uploaded_document", filename: file.filename, content_type: file.mime_type, extension: file.extension, sha256: sha256(file.buffer), original_drive_file_id: original.drive_file_id, original_drive_web_view_link: original.drive_web_view_link, extraction_status: extracted.text ? "EXTRACTED" : "EMPTY_TEXT", extraction_method: extracted.method, extraction_warnings: extracted.warnings, text_length: extracted.text.length, root_families: classification.root_families, document_class: classification.document_class, route_type_by_family: classification.route_type_by_family, bucket_by_family: Object.fromEntries(classification.root_families.map((family) => [family, FAMILY_BUCKET[family] || "legal_governance_profile_urls"])), materiality: "uploaded_public_source", canonical_url: `uploaded://${encodeURIComponent(uploadedSourceId)}/${encodeURIComponent(file.filename)}`, lossless_text: extracted.text };
    sources.push(source);
    documents.push(withoutText(source));
  }
  const indexArtifact = { run_id: run.run_id, target: run.target, target_url: run.root_url, source_mode: "url_plus_documents", generated_by: "document_source_ingestor_v1", document_count: documents.length, extracted_document_count: documents.filter((doc) => doc.extraction_status === "EXTRACTED").length, documents, generated_at: new Date().toISOString() };
  const corpusArtifact = { run_id: run.run_id, target: run.target, target_url: run.root_url, source_mode: "url_plus_documents", generated_by: "document_source_ingestor_v1", source_text_location: "uploaded_source_document_corpus.sources[].lossless_text", sources, generated_at: new Date().toISOString() };
  const indexDrive = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name: "uploaded_source_document_index", version: 1, drive_folder_id, artifact: indexArtifact });
  const corpusDrive = await saveJsonArtifactToDrive({ run_id: run.run_id, artifact_name: "uploaded_source_document_corpus", version: 1, drive_folder_id, artifact: corpusArtifact });
  return { source_mode: "url_plus_documents", uploaded_source_document_index_drive_file_id: indexDrive.drive_file_id, uploaded_source_document_index_drive_web_view_link: indexDrive.drive_web_view_link, uploaded_source_document_corpus_drive_file_id: corpusDrive.drive_file_id, uploaded_source_document_corpus_drive_web_view_link: corpusDrive.drive_web_view_link, uploaded_source_documents: { document_count: documents.length, extracted_document_count: documents.filter((doc) => doc.extraction_status === "EXTRACTED").length, filenames: documents.map((doc) => doc.filename), root_families: [...new Set(documents.flatMap((doc) => doc.root_families || []))] } };
}

export async function mergeUploadedDocumentSourcesIntoArtifact({ run, artifactName, artifact }) {
  if (!run?.uploaded_source_document_corpus_drive_file_id || !artifact || typeof artifact !== "object") return artifact;
  if (artifactName === "source_family_index") return mergeSourceFamilyIndex({ run, artifact });
  if (!String(artifactName || "").startsWith("lossless_family__")) return artifact;
  const family = String(artifactName).replace(/^lossless_family__/, "");
  const corpus = await readJsonArtifactFromDrive(run.uploaded_source_document_corpus_drive_file_id);
  const matching = (corpus.sources || []).filter((source) => Array.isArray(source.root_families) && source.root_families.includes(family));
  if (!matching.length) return artifact;
  const existing = Array.isArray(artifact.sources) ? artifact.sources : [];
  const rows = matching.map((source, index) => uploadedSourceRow({ source, family, sourceNumber: existing.length + index + 1 }));
  return { ...artifact, sources: [...existing, ...rows], corpus_forensics: { ...(artifact.corpus_forensics || {}), total_sources: existing.length + rows.length, uploaded_document_sources: rows.length }, uploaded_document_merge: { status: "APPLIED", source: "uploaded_source_document_corpus", merged_rows: rows.length, generated_at: new Date().toISOString() } };
}

async function mergeSourceFamilyIndex({ run, artifact }) {
  const corpus = await readJsonArtifactFromDrive(run.uploaded_source_document_corpus_drive_file_id);
  const uploadedRows = [];
  for (const source of corpus.sources || []) for (const family of source.root_families || []) uploadedRows.push(withoutText(uploadedSourceRow({ source, family, sourceNumber: uploadedRows.length + 1 })));
  if (!uploadedRows.length) return artifact;
  return { ...artifact, discovered_source_index: [...(artifact.discovered_source_index || []), ...uploadedRows], corpus_forensics: { ...(artifact.corpus_forensics || {}), sources_extracted: Number(artifact.corpus_forensics?.sources_extracted || 0) + uploadedRows.length, uploaded_document_sources: uploadedRows.length } };
}

function uploadedSourceRow({ source, family, sourceNumber }) { const routeType = source.route_type_by_family?.[family] || source.document_class || "uploaded_document"; const bucket = source.bucket_by_family?.[family] || FAMILY_BUCKET[family] || "legal_governance_profile_urls"; return { source_id: `${family}.UPDOC.${String(sourceNumber).padStart(3, "0")}`, manifest_id: source.uploaded_source_id, bucket, root_family: family, canonical_url: source.canonical_url, url: source.original_drive_web_view_link || source.canonical_url, route_type: routeType, materiality: source.materiality || "uploaded_source_material", discovered_by: ["USER_UPLOADED_DOCUMENT"], route_found_by: "DOCUMENT_UPLOAD", priority_result: "UPLOADED_PRIMARY_SOURCE", admission_tier: "PRIMARY", variant_class: "UPLOADED_DOCUMENT", extraction_decision: "EXTRACT", tier_reason: "Uploaded by user as source material.", execution_status: "uploaded_document_parsed", extraction_status: source.extraction_status, evidence_text_source: "UPLOADED_DOCUMENT_TEXT", content_type: source.content_type, final_url: source.original_drive_web_view_link, filename: source.filename, sha256: source.sha256, lossless_text: source.lossless_text, extraction_warnings: source.extraction_warnings || [] }; }

async function extractDocumentText(file) {
  const warnings = [];
  let method = "TEXT_BUFFER";
  let text = "";
  if (file.extension === ".pdf") { method = "PDF_PARSE"; const pdfModule = await import("pdf-parse"); const pdfParse = pdfModule.default || pdfModule; const parsed = await pdfParse(file.buffer); text = parsed?.text || ""; }
  else if (file.extension === ".docx") { method = "MAMMOTH_RAW_TEXT"; const mammoth = await import("mammoth"); const parsed = await mammoth.extractRawText({ buffer: file.buffer }); text = parsed?.value || ""; }
  else if ([".html", ".htm"].includes(file.extension)) { method = "HTML_TEXT_STRIP"; text = cleanHtmlToText(file.buffer.toString("utf8")); }
  else text = file.buffer.toString("utf8");
  text = normalizeText(text);
  if (text.length > MAX_TEXT) { text = text.slice(0, MAX_TEXT); warnings.push(`EXTRACTED_TEXT_CAPPED_AT_${MAX_TEXT}_CHARS_ORIGINAL_FILE_SAVED_IN_DRIVE`); }
  if (!text) warnings.push("NO_EXTRACTED_TEXT");
  return { text, method, warnings };
}

function classifyUploadedDocument(filename, text) {
  const value = `${filename} ${text.slice(0, 12000)}`.toLowerCase();
  const families = new Set();
  const routeType = {};
  const add = (family, route) => { families.add(family); routeType[family] = route; };
  if (value.includes("privacy")) { add("L1_CORE_TERMS_PRIVACY", "uploaded_privacy_document"); add("D2_SUBPROCESSOR_PRIVACY_CENTER", "uploaded_privacy_document"); }
  if (value.includes("terms") || value.includes("eula")) add("L1_CORE_TERMS_PRIVACY", "uploaded_terms_document");
  if (value.includes("dpa") || value.includes("subprocessor") || value.includes("data processing")) { add("L2_B2B_CONTRACTING", "uploaded_data_processing_document"); add("D2_SUBPROCESSOR_PRIVACY_CENTER", "uploaded_data_processing_document"); }
  if (value.includes("security") || value.includes("trust") || value.includes("compliance")) add("D1_SECURITY_TRUST", "uploaded_security_document");
  if (value.includes("acceptable use") || value.includes("sla") || value.includes("msa") || value.includes("customer agreement")) add("L2_B2B_CONTRACTING", "uploaded_contracting_document");
  if (value.includes("cookie") || value.includes("ccpa") || value.includes("gdpr")) add("L4_PRIVACY_ADJACENT_NOTICES", "uploaded_privacy_adjacent_document");
  if (value.includes("usage policy") || value.includes("ai policy") || value.includes("model policy") || value.includes("safety")) { add("L3_AI_USAGE_GOVERNANCE", "uploaded_ai_governance_document"); add("D5_AI_SAFETY_TRANSPARENCY", "uploaded_ai_governance_document"); }
  if (value.includes("regulation") || value.includes("regulator") || value.includes("authority") || value.includes("guidance")) add("L5_LEGAL_HUB_HOSTED", "uploaded_regulatory_document");
  if (value.includes("legal notice") || value.includes("imprint") || value.includes("controller")) add("L6_ENTITY_NOTICE", "uploaded_entity_notice");
  if (!families.size) add("L5_LEGAL_HUB_HOSTED", "uploaded_legal_governance_document");
  return { root_families: [...families], document_class: routeType[[...families][0]] || "uploaded_document", route_type_by_family: routeType };
}

function withoutText(source) { const { lossless_text: _losslessText, ...rest } = source; return rest; }
function cleanName(value) { const base = String(value || "uploaded-document").replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_").slice(0, 120); return base || "uploaded-document"; }
function extOf(filename) { const match = String(filename || "").toLowerCase().match(/\.[a-z0-9]+$/); return match ? match[0] : ""; }
function cleanHtmlToText(html) { return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "); }
function normalizeText(text) { return String(text || "").replace(/\r/g, "\n").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

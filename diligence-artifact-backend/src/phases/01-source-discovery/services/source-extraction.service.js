import crypto from "node:crypto";
import { config } from "../../../runtime/config.js";
import { COMMON_ROOTS, COMMON_ROOT_ARTIFACT_NAMES, legalDocTypeFromUrlOrRoute, neutralBucketsForSource, stableSlug } from "./source-discovery-taxonomy.service.js";

const MAX_ROOT_ARTIFACT_BYTES = positiveInt(process.env.LN_MAX_ROOT_ARTIFACT_BYTES, 250000);
const MAX_SOURCES_PER_ROOT_ARTIFACT = positiveInt(process.env.LN_MAX_SOURCES_PER_ROOT_ARTIFACT, 5);

export async function buildSourceExtractionArtifactSet({ run, deduped_url_manifest }) {
  if (!deduped_url_manifest?.manifest_sources?.length) throw new Error("SOURCE_EXTRACTION_BLOCKED:deduped_url_manifest_missing_or_empty");

  const rootUrl = deduped_url_manifest.target_url || normalizeRootUrl(run.root_url || run.target);
  const rootHost = stripWww(new URL(rootUrl).hostname);
  const commonRootArtifacts = emptyCommonRootArtifacts({ run, rootUrl });
  const extractedIndex = [];
  const manifestOnlyIndex = [];
  const metadataOnlyIndex = [];
  const failedSourceIndex = [];
  const extractionCache = new Map();
  const counters = Object.fromEntries(COMMON_ROOTS.map((root) => [root.id, 0]));

  for (const manifestRow of deduped_url_manifest.manifest_sources) {
    const root = manifestRow.common_root;
    const rootArtifact = commonRootArtifacts[`lossless_root__${root}`];
    if (!rootArtifact) continue;

    if (manifestRow.extraction_decision !== "EXTRACT" || manifestRow.admission_tier !== "PRIMARY") {
      const indexed = manifestOnlyRecord(manifestRow);
      if (manifestRow.admission_tier === "METADATA_ONLY" || manifestRow.extraction_decision === "NO_EXTRACT") {
        rootArtifact.metadata_only_sources.push(indexed);
        metadataOnlyIndex.push(indexed);
      } else if (manifestRow.admission_tier === "REJECTED_NOT_EVIDENCE") {
        rootArtifact.rejected_sources.push({ ...indexed, rejection_reason: manifestRow.tier_reason });
        failedSourceIndex.push({ ...indexed, extraction_status: "REJECTED_NOT_EVIDENCE", error: manifestRow.tier_reason });
      } else {
        rootArtifact.manifest_only_sources.push(indexed);
        manifestOnlyIndex.push(indexed);
      }
      continue;
    }

    const extracted = await getOrExtract(extractionCache, manifestRow, rootUrl, rootHost);
    const sourceNumber = String(++counters[root]).padStart(3, "0");
    const sourceId = `${root}.SRC.${sourceNumber}`;
    const baseRow = {
      source_id: sourceId,
      manifest_id: manifestRow.manifest_id,
      common_root: root,
      canonical_url: manifestRow.canonical_url,
      url: manifestRow.fetch_url,
      route_type: manifestRow.route_type,
      route_type_aliases: manifestRow.route_type_aliases || [],
      materiality: manifestRow.materiality,
      neutral_buckets: manifestRow.neutral_buckets || neutralBucketsForSource(manifestRow),
      discovered_by: manifestRow.discovered_by,
      route_found_by: manifestRow.priority_route_found_by,
      priority_result: manifestRow.priority_result,
      admission_tier: manifestRow.admission_tier,
      variant_class: manifestRow.variant_class,
      extraction_decision: manifestRow.extraction_decision,
      tier_reason: manifestRow.tier_reason,
      legal_doc_candidate: Boolean(manifestRow.legal_doc_candidate),
      legal_doc_type: manifestRow.legal_doc_type,
      execution_status: extracted.ok ? "executed_bucketed" : "access_failed_recorded_limited"
    };

    if (extracted.ok) {
      const row = { ...baseRow, extraction_status: "FETCHED", evidence_text_source: extracted.evidence_text_source, http_status: extracted.http_status, content_type: extracted.content_type, final_url: extracted.final_url, sha256: sha256(extracted.lossless_text), lossless_text: extracted.lossless_text, extraction_warnings: extracted.extraction_warnings };
      if (row.legal_doc_candidate) rootArtifact.legal_document_sources.push(withoutLosslessText(row));
      else rootArtifact.sources.push(row);
      extractedIndex.push(withoutLosslessText(row));
    } else {
      const failed = { ...baseRow, extraction_status: extracted.status || "FETCH_FAILED", error: extracted.error };
      rootArtifact.rejected_sources.push(failed);
      failedSourceIndex.push(failed);
    }
  }

  const missingLimited = buildMissingLimited(commonRootArtifacts, deduped_url_manifest);
  const sparseArtifacts = {};
  const rootArtifactManifest = {};
  for (const artifactName of COMMON_ROOT_ARTIFACT_NAMES) {
    const artifact = commonRootArtifacts[artifactName];
    artifact.missing_limited_primary_sources = missingLimited.filter((item) => item.common_root === artifact.common_root);
    artifact.corpus_forensics.total_sources = artifact.sources.length;
    artifact.corpus_forensics.legal_document_sources = artifact.legal_document_sources.length;
    artifact.corpus_forensics.manifest_only_sources = artifact.manifest_only_sources.length;
    artifact.corpus_forensics.metadata_only_sources = artifact.metadata_only_sources.length;
    artifact.corpus_forensics.rejected_sources = artifact.rejected_sources.length;
    artifact.dedupe_forensics = buildRootDedupeForensics(deduped_url_manifest, artifact);

    const shards = buildSparseRootArtifacts(artifact);
    rootArtifactManifest[artifact.common_root] = rootManifestEntry({ artifact, shards });
    for (const shard of shards) sparseArtifacts[shard.artifact_name] = shard;
  }

  const legalArtifacts = buildLegalDocArtifacts({ run, rootUrl, extractedIndex, extractionCache, deduped_url_manifest });
  const savedArtifactNames = Object.keys(sparseArtifacts).sort();
  return {
    source_family_index: {
      run_id: run.run_id,
      target: run.target,
      target_url: rootUrl,
      generated_by: "source_discovery_extraction",
      taxonomy_version: "PHASE1_AGNOSTIC_COMMON_ROOT_INDEX_v1",
      manifest_artifact_required: "deduped_url_manifest",
      extraction_boundary: "Source Extraction extracted only PRIMARY rows from the URL manifest. SECONDARY and CONTEXT_ONLY remain manifest-only. METADATA_ONLY is separately indexed and never extracted.",
      storage_taxonomy: "common roots plus independent legal documents",
      root_artifacts: COMMON_ROOT_ARTIFACT_NAMES,
      saved_root_artifacts: savedArtifactNames,
      root_artifact_manifest: rootArtifactManifest,
      discovered_source_index: extractedIndex,
      manifest_only_index: manifestOnlyIndex,
      metadata_only_index: metadataOnlyIndex,
      failed_source_index: failedSourceIndex,
      missing_limited_primary_sources: missingLimited,
      legal_doc_inventory_ref: "legal_doc_inventory",
      legal_doc_extraction_index_ref: "legal_doc_extraction_index",
      legal_doc_lossless_validation_manifest_ref: "legal_doc_lossless_validation_manifest",
      corpus_forensics: {
        manifest_rows_read: deduped_url_manifest.manifest_sources.length,
        primary_rows_seen: deduped_url_manifest.manifest_sources.filter((row) => row.admission_tier === "PRIMARY").length,
        sources_extracted: extractedIndex.length,
        manifest_only_rows: manifestOnlyIndex.length,
        metadata_only_rows: metadataOnlyIndex.length,
        failed_or_rejected_sources: failedSourceIndex.length,
        extraction_cache_entries: extractionCache.size,
        root_artifacts_saved: savedArtifactNames.length,
        roots_checked: COMMON_ROOTS.length,
        roots_with_material_sources: Object.values(rootArtifactManifest).filter((entry) => entry.source_count > 0).length,
        sharded_roots: Object.values(rootArtifactManifest).filter((entry) => entry.status === "SHARDED").length,
        generated_at: new Date().toISOString()
      }
    },
    ...sparseArtifacts,
    ...legalArtifacts
  };
}

function buildSparseRootArtifacts(artifact) {
  if (!Array.isArray(artifact.sources) || artifact.sources.length === 0) return [];
  const sources = artifact.sources.map(markOversizedAtomicSourceIfNeeded);
  const normalized = { ...artifact, sources };
  const single = buildRootArtifactPayload({ artifact: normalized, artifactName: `lossless_root__${artifact.common_root}`, sources, storageMode: "SINGLE", shardIndex: 1, shardCount: 1, includeContext: true });
  if (sources.length <= MAX_SOURCES_PER_ROOT_ARTIFACT && byteLength(single) <= MAX_ROOT_ARTIFACT_BYTES) return [single];

  const groups = [];
  let current = [];
  for (const source of sources) {
    const candidate = [...current, source];
    const candidatePayload = buildRootArtifactPayload({ artifact: normalized, artifactName: "__candidate__", sources: candidate, storageMode: "SHARD", shardIndex: groups.length + 1, shardCount: 99, includeContext: groups.length === 0 });
    if (current.length && (candidate.length > MAX_SOURCES_PER_ROOT_ARTIFACT || byteLength(candidatePayload) > MAX_ROOT_ARTIFACT_BYTES)) {
      groups.push(current);
      current = [source];
    } else current = candidate;
  }
  if (current.length) groups.push(current);
  const shardCount = groups.length;
  const shards = groups.map((group, index) => buildRootArtifactPayload({ artifact: normalized, artifactName: `lossless_root__${artifact.common_root}__part_${String(index + 1).padStart(3, "0")}`, sources: group, storageMode: "SHARD", shardIndex: index + 1, shardCount, includeContext: index === 0 }));
  return shards.map((shard, index) => ({ ...shard, previous_shard: index > 0 ? shards[index - 1].artifact_name : null, next_shard: index < shards.length - 1 ? shards[index + 1].artifact_name : null }));
}

function buildRootArtifactPayload({ artifact, artifactName, sources, storageMode, shardIndex, shardCount, includeContext }) {
  const payload = {
    ...artifact,
    artifact_name: artifactName,
    storage_mode: storageMode,
    shard_index: shardIndex,
    shard_count: shardCount,
    root_virtual_artifact_name: `lossless_root__${artifact.common_root}`,
    root_shard_integrity: { required_together: storageMode === "SHARD", physical_storage_only: storageMode === "SHARD", downstream_must_resolve_all_shards: storageMode === "SHARD", source_text_cutting_allowed: false },
    sources,
    manifest_only_sources: includeContext ? artifact.manifest_only_sources : [],
    metadata_only_sources: includeContext ? artifact.metadata_only_sources : [],
    legal_document_sources: includeContext ? artifact.legal_document_sources : [],
    rejected_sources: includeContext ? artifact.rejected_sources : [],
    missing_limited_primary_sources: includeContext ? artifact.missing_limited_primary_sources : [],
    corpus_forensics: { ...artifact.corpus_forensics, total_sources: sources.length, root_total_sources: artifact.sources.length, oversized_atomic_sources_included: sources.filter((source) => source.oversized_atomic_source === true).length },
    dedupe_forensics: includeContext ? artifact.dedupe_forensics : {}
  };
  payload.artifact_size_estimate_bytes = byteLength(payload);
  return payload;
}

function rootManifestEntry({ artifact, shards }) {
  const manifestRowsSeen = artifact.dedupe_forensics?.manifest_rows_seen || 0;
  const primaryRowsSeen = artifact.dedupe_forensics?.primary_rows_seen || 0;
  if (!shards.length) return { common_root: artifact.common_root, status: primaryRowsSeen ? "UNSAVED_NO_MATERIAL_SOURCE" : manifestRowsSeen ? "UNSAVED_INDEX_ONLY" : "UNSAVED_ABSENT", complete: true, required_artifacts: [], virtual_artifact_name: `lossless_root__${artifact.common_root}`, source_count: 0, manifest_rows_seen: manifestRowsSeen, primary_rows_seen: primaryRowsSeen, manifest_only_sources: artifact.manifest_only_sources.length, metadata_only_sources: artifact.metadata_only_sources.length, rejected_sources: artifact.rejected_sources.length, missing_limited_primary_sources: artifact.missing_limited_primary_sources.length, reason: "Root evaluated but had no extracted non-legal material source text. Legal documents are stored separately as legal_doc_* artifacts." };
  const requiredArtifacts = shards.map((shard) => shard.artifact_name);
  return { common_root: artifact.common_root, status: shards.length === 1 && shards[0].storage_mode === "SINGLE" ? "SINGLE" : "SHARDED", complete: true, required_artifacts: requiredArtifacts, virtual_artifact_name: `lossless_root__${artifact.common_root}`, shard_count: requiredArtifacts.length, source_count: artifact.sources.length, saved_source_rows: shards.reduce((sum, shard) => sum + shard.sources.length, 0), source_ids: shards.flatMap((shard) => shard.sources.map((source) => source.source_id)), total_text_bytes: artifact.sources.reduce((sum, source) => sum + Buffer.byteLength(String(source.lossless_text || ""), "utf8"), 0), artifact_bytes: shards.map((shard) => ({ artifact_name: shard.artifact_name, bytes: byteLength(shard) })), root_sources_required_together: requiredArtifacts.length > 1, source_text_cutting_allowed: false, oversized_single_source_allowed: true };
}

function buildLegalDocArtifacts({ run, rootUrl, extractedIndex, extractionCache, deduped_url_manifest }) {
  const docs = [];
  const artifacts = {};
  const used = new Set();
  const legalRows = deduped_url_manifest.manifest_sources.filter((row) => row.legal_doc_candidate && row.admission_tier === "PRIMARY" && row.extraction_decision === "EXTRACT");
  for (const row of legalRows) {
    const extracted = extractionCache.get(row.canonical_url_key);
    if (!extracted?.ok) continue;
    const type = legalDocTypeFromUrlOrRoute(`${row.legal_doc_type || ""} ${row.route_type || ""} ${row.canonical_url || ""}`);
    const base = type.artifactName === "legal_doc_other" ? `legal_doc_other__${stableSlug(row.canonical_url)}` : type.artifactName;
    const artifactName = uniqueArtifactName(base, row, used);
    used.add(artifactName);
    const digest = sha256(extracted.lossless_text);
    docs.push({ doc_id: artifactName, doc_type: type.docType, source_url: row.canonical_url, artifact_name: artifactName, extraction_mode: "LOSSLESS_DOCUMENT_GRANULAR", status: "EXTRACTED", sha256: digest });
    artifacts[artifactName] = { run_id: run.run_id, target_url: rootUrl, generated_by: "source_discovery_extraction", schema_version: "PHASE1_LEGAL_DOC_LOSSLESS_v1", artifact_name: artifactName, doc_type: type.docType, source_url: row.canonical_url, route_type: row.route_type, common_root: row.common_root, extraction_mode: "LOSSLESS_DOCUMENT_GRANULAR", legal_doc_granularity_rule: "This artifact contains one legal document source only. Do not merge with other legal documents for evidentiary reliance.", source_text_cutting_allowed: false, lossless_text: extracted.lossless_text, sha256: digest, extraction_warnings: extracted.extraction_warnings || [] };
  }
  return { legal_doc_inventory: { run_id: run.run_id, target_url: rootUrl, generated_by: "source_discovery_extraction", schema_version: "PHASE1_LEGAL_DOC_INVENTORY_v1", status: docs.length ? "LEGAL_DOCS_EXTRACTED" : "NO_LEGAL_DOCS_EXTRACTED", documents_found: docs, inventory_is_navigation_only: true, individual_legal_doc_artifacts_are_source_of_truth: true }, legal_doc_extraction_index: { run_id: run.run_id, generated_by: "source_discovery_extraction", schema_version: "PHASE1_LEGAL_DOC_EXTRACTION_INDEX_v1", url_to_artifact: Object.fromEntries(docs.map((doc) => [doc.source_url, doc.artifact_name])), artifact_to_doc_type: Object.fromEntries(docs.map((doc) => [doc.artifact_name, doc.doc_type])) }, legal_doc_lossless_validation_manifest: { run_id: run.run_id, generated_by: "source_discovery_extraction", schema_version: "PHASE1_LEGAL_DOC_LOSSLESS_VALIDATION_v1", legal_source_count: legalRows.length, legal_doc_artifact_count: docs.length, one_legal_url_one_artifact: legalRows.length === docs.length, merged_legal_blob_detected: false, status: legalRows.length === docs.length ? "PASS" : "FAIL" }, ...artifacts };
}

function markOversizedAtomicSourceIfNeeded(source) { if (byteLength({ source }) <= MAX_ROOT_ARTIFACT_BYTES) return source; return { ...source, oversized_atomic_source: true, oversized_atomic_source_policy: "SOURCE_TEXT_PRESERVED_WHOLE_DESPITE_ARTIFACT_CAP", extraction_warnings: unique([...(source.extraction_warnings || []), "SOURCE_EXCEEDS_ARTIFACT_CAP_STORED_ATOMIC_LOSSLESS"]) }; }
function emptyCommonRootArtifacts({ run, rootUrl }) { const out = {}; for (const root of COMMON_ROOTS) out[`lossless_root__${root.id}`] = { run_id: run.run_id, target_url: rootUrl, artifact_name: `lossless_root__${root.id}`, generated_by: "source_discovery_extraction", common_root: root.id, priority: root.priority, neutral_buckets: root.buckets, sources: [], legal_document_sources: [], manifest_only_sources: [], metadata_only_sources: [], rejected_sources: [], missing_limited_primary_sources: [], corpus_forensics: { total_sources: 0, legal_document_sources: 0, manifest_only_sources: 0, metadata_only_sources: 0, rejected_sources: 0 }, dedupe_forensics: {} }; return out; }
function buildRootDedupeForensics(manifest, artifact) { const rows = manifest.manifest_sources.filter((row) => row.common_root === artifact.common_root); return { manifest_rows_seen: rows.length, primary_rows_seen: rows.filter((row) => row.admission_tier === "PRIMARY").length, manifest_only_rows_seen: rows.filter((row) => ["SECONDARY", "CONTEXT_ONLY"].includes(row.admission_tier)).length, metadata_only_rows_seen: rows.filter((row) => row.admission_tier === "METADATA_ONLY").length, canonical_urls_seen: new Set(rows.map((row) => row.canonical_url_key)).size, canonical_sources_saved: artifact.sources.length, duplicate_rows_allowed: false }; }
function buildMissingLimited(inventories, manifest) { const rows = []; for (const root of COMMON_ROOTS) { const artifact = inventories[`lossless_root__${root.id}`]; const primaryRows = manifest.manifest_sources.filter((row) => row.common_root === root.id && row.admission_tier === "PRIMARY"); if (artifact && primaryRows.length === 0 && root.priority === "PRIMARY") rows.push({ common_root: root.id, missing_or_limited_source: root.id, search_exhausted: true, attempted_paths: root.paths || [], attempted_manifest_rows: manifest.manifest_sources.filter((row) => row.common_root === root.id).length, why_it_matters: "No PRIMARY public source was found in Source Discovery URL Manifest for this common root.", status: "ABSENT_AFTER_TARGETED_PROBE" }); } return rows; }
function manifestOnlyRecord(row) { return { manifest_id: row.manifest_id, common_root: row.common_root, canonical_url: row.canonical_url, fetch_url: row.fetch_url, route_type: row.route_type, admission_tier: row.admission_tier, variant_class: row.variant_class, extraction_decision: row.extraction_decision, tier_reason: row.tier_reason }; }
function withoutLosslessText(row) { const { lossless_text, ...rest } = row; return rest; }
async function getOrExtract(cache, manifestRow, rootUrl, rootHost) { const key = manifestRow.canonical_url_key; if (cache.has(key)) return cache.get(key); const extracted = await fetchBestEvidenceText(manifestRow.fetch_url, rootUrl, rootHost); cache.set(key, extracted); return extracted; }
async function fetchBestEvidenceText(url, rootUrl, rootHost) { for (const mdUrl of markdownCandidateUrls(url)) { const md = await safeFetchRaw(mdUrl); if (md.ok && isClearMarkdownText(md.raw_text, md.content_type) && !isBadEvidenceText(md.raw_text)) return toEvidence(md, "MARKDOWN_DERIVED"); } const html = await safeFetchRaw(url); if (!html.ok) return { ok: false, error: html.error, http_status: html.http_status || null }; for (const href of extractMarkdownAlternates(html.raw_text)) { const mdUrl = normalizeCandidateUrl(href, url || rootUrl, rootHost); const md = mdUrl ? await safeFetchRaw(mdUrl) : { ok: false }; if (md.ok && isClearMarkdownText(md.raw_text, md.content_type) && !isBadEvidenceText(md.raw_text)) return toEvidence(md, "MARKDOWN_ALTERNATE"); } const clean = cleanHtmlToText(html.raw_text); if (!clean || clean.length < 120) return { ok: false, status: "REJECTED_NOT_EVIDENCE", error: "NO_CLEAR_TEXT_AFTER_HTML_CLEAN", http_status: html.http_status || null }; if (isBadEvidenceText(clean)) return { ok: false, status: "REJECTED_NOT_EVIDENCE", error: "BAD_OR_PLACEHOLDER_EVIDENCE_TEXT", http_status: html.http_status || null }; return { ok: true, http_status: html.http_status, content_type: html.content_type, final_url: html.final_url, lossless_text: clean, evidence_text_source: "CLEANED_HTML", extraction_warnings: [...html.extraction_warnings, "RAW_HTML_NOT_STORED"] }; }
function markdownCandidateUrls(value) { const out = []; try { const url = new URL(value); const path = url.pathname.replace(/\/$/, ""); if (path && path !== "/" && !path.endsWith(".md")) { const md = new URL(url.toString()); md.pathname = `${path}.md`; out.push(md.toString()); } if (path.endsWith(".md")) out.push(url.toString()); } catch { return []; } return out; }
function isClearMarkdownText(text, contentType) { const value = String(text || "").trim(); if (value.length < 80) return false; if (/^<!doctype html/i.test(value) || /<html[\s>]/i.test(value)) return false; const lowerType = String(contentType || "").toLowerCase(); return lowerType.includes("markdown") || lowerType.includes("text/plain") || lowerType.includes("octet-stream") || /(^|\n)#{1,3}\s+/.test(value) || value.includes("\n- ") || value.includes("\n## "); }
function toEvidence(fetchResult, source) { return { ok: true, http_status: fetchResult.http_status, content_type: fetchResult.content_type, final_url: fetchResult.final_url, lossless_text: normalizeEvidenceText(fetchResult.raw_text), evidence_text_source: source, extraction_warnings: fetchResult.extraction_warnings }; }
function cleanHtmlToText(html) { const title = extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i); const meta = extractMetaDescription(html); const body = String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<canvas[\s\S]*?<\/canvas>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " "); return normalizeEvidenceText([title, meta, decodeEntities(body)].filter(Boolean).join("\n\n")); }
function normalizeEvidenceText(text) { return decodeEntities(String(text || "")).replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function decodeEntities(value) { return String(value || "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#x27;/gi, "'").replace(/&#39;/gi, "'").replace(/&ldquo;/gi, '"').replace(/&rdquo;/gi, '"').replace(/&rsquo;/gi, "'").replace(/&lsquo;/gi, "'"); }
function extractMetaDescription(html) { return extractFirst(html, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || extractFirst(html, /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i); }
function extractFirst(value, regex) { const match = String(value || "").match(regex); return match?.[1] ? decodeEntities(match[1]).trim() : ""; }
function extractMarkdownAlternates(html) { const out = []; const regex = /<link\b[^>]*rel=["'][^"']*alternate[^"']*["'][^>]*type=["']text\/markdown["'][^>]*href=["']([^"']+)["'][^>]*>/gi; for (const match of String(html || "").matchAll(regex)) out.push(match[1]); return out; }
async function safeFetchRaw(url) { try { const fetched = await fetchRaw(url); return { ok: true, ...fetched }; } catch (error) { return { ok: false, url, error: error?.message || String(error), http_status: error?.http_status || null }; } }
async function fetchRaw(url) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.sourceFetchTimeoutMs); try { const response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow", headers: { "user-agent": "LexNovaHQ-DiligenceReviewer/1.0 (+phase1-agnostic-source-extraction)", "accept": "text/markdown,text/plain,text/html,application/xhtml+xml,application/json,application/xml,text/xml,*/*;q=0.5" } }); const contentType = response.headers.get("content-type") || ""; const rawText = await response.text(); if (!response.ok) { const error = new Error(`HTTP_${response.status}`); error.http_status = response.status; throw error; } return { http_status: response.status, content_type: contentType, final_url: response.url, raw_text: rawText, extraction_warnings: buildWarnings(contentType, rawText) }; } catch (error) { if (error?.name === "AbortError") throw new Error("FETCH_TIMEOUT"); throw error; } finally { clearTimeout(timeout); } }
function buildWarnings(contentType, text) { const warnings = []; const lower = String(contentType || "").toLowerCase(); if (lower.includes("pdf")) warnings.push("PDF_FETCHED_AS_TEXT_NOT_PARSED"); if (String(text || "").length > 900000) warnings.push("LARGE_SOURCE_TEXT"); return warnings; }
function normalizeCandidateUrl(value, baseUrl, rootHost) { try { const url = new URL(String(value || "").trim(), baseUrl); if (!["http:", "https:"].includes(url.protocol)) return ""; const host = stripWww(url.hostname); if (!(host === rootHost || host.endsWith(`.${rootHost}`))) return ""; url.hash = ""; return url.toString(); } catch { return ""; } }
function isBadEvidenceText(text) { const value = String(text || "").toLowerCase(); return value.includes("enable javascript") && value.length < 500 || value.includes("access denied") && value.length < 500; }
function uniqueArtifactName(baseName, row, used) { if (!used.has(baseName)) return baseName; return `${baseName}__${stableSlug(row.canonical_url || row.manifest_id)}`; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
function byteLength(value) { return Buffer.byteLength(JSON.stringify(value), "utf8"); }
function positiveInt(value, fallback) { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
function stripWww(hostname) { return String(hostname || "").replace(/^www\./i, "").toLowerCase(); }
function normalizeRootUrl(value) { const raw = String(value || "").trim(); const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; const url = new URL(withProtocol); url.hash = ""; if (!url.pathname || url.pathname === "/") url.pathname = "/"; return url.toString(); }

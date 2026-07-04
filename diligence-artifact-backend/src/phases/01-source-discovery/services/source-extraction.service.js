import crypto from "node:crypto";
import { config } from "../../../runtime/config.js";
import { ROOT_FAMILY_CODES, LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES } from "../../../runtime/contracts/artifact-permissions.contract.js";

const FAMILY_META = Object.freeze({
  T0_ROOT: ["target_profile_urls", "homepage_primary_public_root"],
  T1_IDENTITY: ["target_profile_urls", "about_company_identity"],
  T2_LEGAL_IDENTITY: ["target_profile_urls", "legal_identity_notice"],
  T3_OPERATOR_ENTITY: ["target_profile_urls", "operator_entity_fallback"],
  T4_SUPPORTING_IDENTITY: ["target_profile_urls", "supporting_company_signals"],
  P1_PRODUCT: ["product_activity_profile_urls", "product_root_and_product_slug_pages"],
  P2_PLATFORM_FEATURE_SOLUTION: ["product_activity_profile_urls", "platform_feature_solution_pages"],
  P3_AI_CAPABILITY_TECHNICAL: ["product_activity_profile_urls", "ai_api_docs_integrations_capability"],
  P4_USE_CASE_INDUSTRY: ["product_activity_profile_urls", "use_case_industry_customer_context"],
  P5_ENTERPRISE_PRICING: ["product_activity_profile_urls", "pricing_enterprise_plans"],
  D1_SECURITY_TRUST: ["data_asset_provenance_profile_urls", "security_trust_compliance"],
  D2_SUBPROCESSOR_PRIVACY_CENTER: ["data_asset_provenance_profile_urls", "subprocessor_privacy_center_dpa"],
  D3_DATA_GOVERNANCE_CONTROLS: ["data_asset_provenance_profile_urls", "data_governance_controls"],
  D4_DOCS_API_DATA_FLOW: ["data_asset_provenance_profile_urls", "docs_api_data_flow_signal"],
  D5_AI_SAFETY_TRANSPARENCY: ["data_asset_provenance_profile_urls", "ai_safety_transparency"],
  L1_CORE_TERMS_PRIVACY: ["legal_governance_profile_urls", "core_terms_privacy_eula"],
  L2_B2B_CONTRACTING: ["legal_governance_profile_urls", "b2b_contracting_documents"],
  L3_AI_USAGE_GOVERNANCE: ["legal_governance_profile_urls", "ai_usage_governance"],
  L4_PRIVACY_ADJACENT_NOTICES: ["legal_governance_profile_urls", "privacy_adjacent_notices"],
  L5_LEGAL_HUB_HOSTED: ["legal_governance_profile_urls", "legal_policy_trust_hub"],
  L6_ENTITY_NOTICE: ["legal_governance_profile_urls", "entity_notice_controller"]
});

const KNOWN_PATHS_BY_FAMILY = Object.freeze({
  T0_ROOT: ["/"],
  T1_IDENTITY: ["/about", "/about-us", "/company", "/our-company", "/who-we-are"],
  T2_LEGAL_IDENTITY: ["/legal", "/legal-notice", "/imprint", "/controller"],
  T3_OPERATOR_ENTITY: ["/privacy", "/terms", "/dpa", "/legal"],
  T4_SUPPORTING_IDENTITY: ["/team", "/careers", "/newsroom", "/press", "/blog", "/blogs"],
  P1_PRODUCT: ["/product", "/products"],
  P2_PLATFORM_FEATURE_SOLUTION: ["/platform", "/features", "/solutions"],
  P3_AI_CAPABILITY_TECHNICAL: ["/models", "/agents", "/assistant", "/assistants", "/studio", "/api", "/apis", "/developer", "/developers", "/docs", "/integrations", "/connectors", "/actions", "/workflows", "/automation"],
  P4_USE_CASE_INDUSTRY: ["/use-cases", "/industries", "/customers", "/stories"],
  P5_ENTERPRISE_PRICING: ["/pricing", "/api-pricing", "/enterprise", "/contact-sales", "/plans"],
  D1_SECURITY_TRUST: ["/security", "/security-center", "/data-security", "/trust", "/trust-center", "/compliance", "/compliance-center", "/soc-2", "/iso-27001"],
  D2_SUBPROCESSOR_PRIVACY_CENTER: ["/subprocessors", "/subprocessor", "/privacy-center", "/data-protection", "/gdpr", "/dpa", "/data-processing-agreement"],
  D3_DATA_GOVERNANCE_CONTROLS: ["/enterprise-privacy", "/customer-data", "/data-processing", "/data-residency", "/retention", "/deletion", "/data-export", "/data-deletion"],
  D4_DOCS_API_DATA_FLOW: ["/docs", "/developer", "/developers", "/api", "/apis", "/api-reference", "/integrations", "/connectors", "/webhooks", "/authentication", "/permissions", "/audit-logs"],
  D5_AI_SAFETY_TRANSPARENCY: ["/responsible-ai", "/ai-policy", "/ai-transparency", "/transparency", "/safety", "/model-card", "/model-cards", "/model-details", "/usage-policy"],
  L1_CORE_TERMS_PRIVACY: ["/terms", "/terms-of-use", "/terms-of-service", "/terms-and-conditions", "/privacy", "/privacy-policy", "/eula"],
  L2_B2B_CONTRACTING: ["/dpa", "/data-processing-agreement", "/data-processing-addendum", "/aup", "/acceptable-use", "/acceptable-use-policy", "/sla", "/service-level-agreement", "/service-credit-terms", "/platform-agreement", "/customer-agreement", "/msa", "/order-terms"],
  L3_AI_USAGE_GOVERNANCE: ["/usage-policy", "/content-policy", "/ai-policy", "/model-policy", "/safety-policy"],
  L4_PRIVACY_ADJACENT_NOTICES: ["/cookie-policy", "/cookies", "/do-not-sell", "/ccpa", "/gdpr", "/data-privacy-framework"],
  L5_LEGAL_HUB_HOSTED: ["/legal", "/legal-center", "/legal-hub", "/policies", "/terms-and-policies", "/trust", "/trust-center"],
  L6_ENTITY_NOTICE: ["/legal-notice", "/imprint", "/controller"]
});

const MAX_FAMILY_ARTIFACT_BYTES = positiveInt(process.env.LN_MAX_FAMILY_ARTIFACT_BYTES, 250000);
const MAX_SOURCES_PER_FAMILY_ARTIFACT = positiveInt(process.env.LN_MAX_SOURCES_PER_FAMILY_ARTIFACT, 5);

export async function buildSourceExtractionArtifactSet({ run, deduped_url_manifest }) {
  if (!deduped_url_manifest?.manifest_sources?.length) throw new Error("SOURCE_EXTRACTION_BLOCKED:deduped_url_manifest_missing_or_empty");

  const rootUrl = deduped_url_manifest.target_url || normalizeRootUrl(run.root_url || run.target);
  const rootHost = stripWww(new URL(rootUrl).hostname);
  const inventories = emptyFamilyArtifacts({ run, rootUrl });
  const sourceIndex = [];
  const manifestOnlyIndex = [];
  const metadataOnlyIndex = [];
  const failedSourceIndex = [];
  const extractionCache = new Map();
  const familyCounters = Object.fromEntries(ROOT_FAMILY_CODES.map((code) => [code, 0]));

  for (const manifestRow of deduped_url_manifest.manifest_sources) {
    const familyArtifact = inventories[`lossless_family__${manifestRow.root_family}`];
    if (!familyArtifact) continue;

    if (manifestRow.extraction_decision !== "EXTRACT" || manifestRow.admission_tier !== "PRIMARY") {
      const indexed = manifestOnlyRecord(manifestRow);
      if (manifestRow.admission_tier === "METADATA_ONLY" || manifestRow.extraction_decision === "NO_EXTRACT") {
        familyArtifact.metadata_only_sources.push(indexed);
        metadataOnlyIndex.push(indexed);
      } else if (manifestRow.admission_tier === "REJECTED_NOT_EVIDENCE") {
        familyArtifact.rejected_sources.push({ ...indexed, rejection_reason: manifestRow.tier_reason });
        failedSourceIndex.push({ ...indexed, extraction_status: "REJECTED_NOT_EVIDENCE", error: manifestRow.tier_reason });
      } else {
        familyArtifact.manifest_only_sources.push(indexed);
        manifestOnlyIndex.push(indexed);
      }
      continue;
    }

    const extracted = await getOrExtract(extractionCache, manifestRow, rootUrl, rootHost);
    const sourceNumber = String(++familyCounters[manifestRow.root_family]).padStart(3, "0");
    const sourceId = `${manifestRow.root_family}.SRC.${sourceNumber}`;
    const baseRow = {
      source_id: sourceId,
      manifest_id: manifestRow.manifest_id,
      bucket: manifestRow.bucket,
      root_family: manifestRow.root_family,
      canonical_url: manifestRow.canonical_url,
      url: manifestRow.fetch_url,
      route_type: manifestRow.route_type,
      route_type_aliases: manifestRow.route_type_aliases || [],
      materiality: manifestRow.materiality,
      discovered_by: manifestRow.discovered_by,
      route_found_by: manifestRow.priority_route_found_by,
      priority_result: manifestRow.priority_result,
      admission_tier: manifestRow.admission_tier,
      variant_class: manifestRow.variant_class,
      extraction_decision: manifestRow.extraction_decision,
      tier_reason: manifestRow.tier_reason,
      execution_status: extracted.ok ? "executed_bucketed" : "access_failed_recorded_limited"
    };

    if (extracted.ok) {
      const row = { ...baseRow, extraction_status: "FETCHED", evidence_text_source: extracted.evidence_text_source, http_status: extracted.http_status, content_type: extracted.content_type, final_url: extracted.final_url, sha256: sha256(extracted.lossless_text), lossless_text: extracted.lossless_text, extraction_warnings: extracted.extraction_warnings };
      familyArtifact.sources.push(row);
      sourceIndex.push(withoutLosslessText(row));
    } else {
      const failed = { ...baseRow, extraction_status: extracted.status || "FETCH_FAILED", error: extracted.error };
      familyArtifact.rejected_sources.push(failed);
      failedSourceIndex.push(failed);
    }
  }

  const missingLimited = buildMissingLimited(inventories, deduped_url_manifest);
  const sparseArtifacts = {};
  const familyArtifactManifest = {};

  for (const artifactName of LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES) {
    const artifact = inventories[artifactName];
    artifact.missing_limited_primary_sources = missingLimited.filter((item) => item.root_family === artifact.root_family);
    artifact.corpus_forensics.total_sources = artifact.sources.length;
    artifact.corpus_forensics.manifest_only_sources = artifact.manifest_only_sources.length;
    artifact.corpus_forensics.metadata_only_sources = artifact.metadata_only_sources.length;
    artifact.corpus_forensics.rejected_sources = artifact.rejected_sources.length;
    artifact.dedupe_forensics = buildFamilyDedupeForensics(deduped_url_manifest, artifact);

    const shards = buildSparseFamilyArtifacts(artifact);
    familyArtifactManifest[artifact.root_family] = familyManifestEntry({ artifact, shards });
    for (const shard of shards) sparseArtifacts[shard.artifact_name] = shard;
  }

  const savedArtifactNames = Object.keys(sparseArtifacts).sort();
  return {
    source_family_index: {
      run_id: run.run_id,
      target: run.target,
      target_url: rootUrl,
      generated_by: "source_discovery_extraction",
      taxonomy_version: "SOURCE_DISCOVERY_SPARSE_ATOMIC_FAMILY_SHARDS_v5_RUNTIME_PHASE",
      legacy_taxonomy_version: "M6_PHASE_1B_SPARSE_ATOMIC_FAMILY_SHARDS_v5",
      manifest_artifact_required: "deduped_url_manifest",
      extraction_boundary: "Source Extraction extracted only PRIMARY rows from the URL manifest. SECONDARY and CONTEXT_ONLY remain manifest-only for downstream request. METADATA_ONLY is separately indexed and never extracted.",
      sparse_family_artifact_rule: "Every ROOT_FAMILY_CODE is evaluated, but a lossless_family artifact is saved only when that family has extracted material sources. Empty/index-only families are recorded here, not saved as empty artifacts.",
      sharded_family_integrity_rule: "A shard is physical storage only. Downstream must load every required_artifact listed for a family and merge them into one virtual family before relying on the evidence.",
      atomic_source_text_rule: "Caps may split between source URLs only. A source row's lossless_text is never cut, truncated, or fragmented to satisfy the cap. If one source exceeds the cap, it is stored whole in its own artifact/shard.",
      cap_policy: { max_family_artifact_bytes: MAX_FAMILY_ARTIFACT_BYTES, max_sources_per_family_artifact: MAX_SOURCES_PER_FAMILY_ARTIFACT, source_text_cutting_allowed: false, oversized_single_source_allowed: true },
      root_family_artifacts: LOSSLESS_ROOT_FAMILY_ARTIFACT_NAMES,
      saved_family_artifacts: savedArtifactNames,
      family_artifact_manifest: familyArtifactManifest,
      discovered_source_index: sourceIndex,
      manifest_only_index: manifestOnlyIndex,
      metadata_only_index: metadataOnlyIndex,
      failed_source_index: failedSourceIndex,
      missing_limited_primary_sources: missingLimited,
      corpus_forensics: {
        manifest_rows_read: deduped_url_manifest.manifest_sources.length,
        primary_rows_seen: deduped_url_manifest.manifest_sources.filter((row) => row.admission_tier === "PRIMARY").length,
        sources_extracted: sourceIndex.length,
        manifest_only_rows: manifestOnlyIndex.length,
        metadata_only_rows: metadataOnlyIndex.length,
        failed_or_rejected_sources: failedSourceIndex.length,
        extraction_cache_entries: extractionCache.size,
        family_artifacts_saved: savedArtifactNames.length,
        families_checked: ROOT_FAMILY_CODES.length,
        families_with_material_sources: Object.values(familyArtifactManifest).filter((entry) => entry.source_count > 0).length,
        sharded_families: Object.values(familyArtifactManifest).filter((entry) => entry.status === "SHARDED").length,
        generated_at: new Date().toISOString()
      }
    },
    ...sparseArtifacts
  };
}

function buildSparseFamilyArtifacts(artifact) {
  if (!Array.isArray(artifact.sources) || artifact.sources.length === 0) return [];
  const sources = artifact.sources.map(markOversizedAtomicSourceIfNeeded);
  const normalized = { ...artifact, sources };
  const single = buildFamilyArtifactPayload({ artifact: normalized, artifactName: `lossless_family__${artifact.root_family}`, sources, storageMode: "SINGLE", shardIndex: 1, shardCount: 1, includeContext: true });
  if (sources.length <= MAX_SOURCES_PER_FAMILY_ARTIFACT && byteLength(single) <= MAX_FAMILY_ARTIFACT_BYTES) return [single];

  const groups = [];
  let current = [];
  for (const source of sources) {
    const candidate = [...current, source];
    const candidatePayload = buildFamilyArtifactPayload({ artifact: normalized, artifactName: "__candidate__", sources: candidate, storageMode: "SHARD", shardIndex: groups.length + 1, shardCount: 99, includeContext: groups.length === 0 });
    if (current.length && (candidate.length > MAX_SOURCES_PER_FAMILY_ARTIFACT || byteLength(candidatePayload) > MAX_FAMILY_ARTIFACT_BYTES)) {
      groups.push(current);
      current = [source];
    } else {
      current = candidate;
    }
  }
  if (current.length) groups.push(current);

  const shardCount = groups.length;
  const shards = groups.map((group, index) => buildFamilyArtifactPayload({ artifact: normalized, artifactName: `lossless_family__${artifact.root_family}__part_${String(index + 1).padStart(3, "0")}`, sources: group, storageMode: "SHARD", shardIndex: index + 1, shardCount, includeContext: index === 0 }));
  return shards.map((shard, index) => ({ ...shard, previous_shard: index > 0 ? shards[index - 1].artifact_name : null, next_shard: index < shards.length - 1 ? shards[index + 1].artifact_name : null }));
}

function buildFamilyArtifactPayload({ artifact, artifactName, sources, storageMode, shardIndex, shardCount, includeContext }) {
  const payload = {
    ...artifact,
    artifact_name: artifactName,
    storage_mode: storageMode,
    shard_index: shardIndex,
    shard_count: shardCount,
    family_virtual_artifact_name: `lossless_family__${artifact.root_family}`,
    family_shard_integrity: { required_together: storageMode === "SHARD", physical_storage_only: storageMode === "SHARD", downstream_must_resolve_all_shards: storageMode === "SHARD", source_text_cutting_allowed: false },
    sources,
    manifest_only_sources: includeContext ? artifact.manifest_only_sources : [],
    metadata_only_sources: includeContext ? artifact.metadata_only_sources : [],
    rejected_sources: includeContext ? artifact.rejected_sources : [],
    missing_limited_primary_sources: includeContext ? artifact.missing_limited_primary_sources : [],
    corpus_forensics: { ...artifact.corpus_forensics, total_sources: sources.length, family_total_sources: artifact.sources.length, oversized_atomic_sources_included: sources.filter((source) => source.oversized_atomic_source === true).length },
    dedupe_forensics: includeContext ? artifact.dedupe_forensics : {}
  };
  payload.artifact_size_estimate_bytes = byteLength(payload);
  return payload;
}

function familyManifestEntry({ artifact, shards }) {
  const manifestRowsSeen = artifact.dedupe_forensics?.manifest_rows_seen || 0;
  const primaryRowsSeen = artifact.dedupe_forensics?.primary_rows_seen || 0;
  if (!shards.length) {
    return {
      family: artifact.root_family,
      bucket: artifact.bucket,
      status: primaryRowsSeen ? "UNSAVED_NO_MATERIAL_SOURCE" : manifestRowsSeen ? "UNSAVED_INDEX_ONLY" : "UNSAVED_ABSENT",
      complete: true,
      required_artifacts: [],
      virtual_artifact_name: `lossless_family__${artifact.root_family}`,
      source_count: 0,
      manifest_rows_seen: manifestRowsSeen,
      primary_rows_seen: primaryRowsSeen,
      manifest_only_sources: artifact.manifest_only_sources.length,
      metadata_only_sources: artifact.metadata_only_sources.length,
      rejected_sources: artifact.rejected_sources.length,
      missing_limited_primary_sources: artifact.missing_limited_primary_sources.length,
      reason: "Family was evaluated but had no extracted material source text; no empty lossless family artifact was saved."
    };
  }
  const requiredArtifacts = shards.map((shard) => shard.artifact_name);
  return {
    family: artifact.root_family,
    bucket: artifact.bucket,
    status: shards.length === 1 && shards[0].storage_mode === "SINGLE" ? "SINGLE" : "SHARDED",
    complete: true,
    required_artifacts: requiredArtifacts,
    virtual_artifact_name: `lossless_family__${artifact.root_family}`,
    shard_count: requiredArtifacts.length,
    source_count: artifact.sources.length,
    saved_source_rows: shards.reduce((sum, shard) => sum + shard.sources.length, 0),
    source_ids: shards.flatMap((shard) => shard.sources.map((source) => source.source_id)),
    total_text_bytes: artifact.sources.reduce((sum, source) => sum + Buffer.byteLength(String(source.lossless_text || ""), "utf8"), 0),
    artifact_bytes: shards.map((shard) => ({ artifact_name: shard.artifact_name, bytes: byteLength(shard) })),
    family_sources_required_together: requiredArtifacts.length > 1,
    source_text_cutting_allowed: false,
    oversized_single_source_allowed: true
  };
}

function markOversizedAtomicSourceIfNeeded(source) {
  if (byteLength({ source }) <= MAX_FAMILY_ARTIFACT_BYTES) return source;
  return { ...source, oversized_atomic_source: true, oversized_atomic_source_policy: "SOURCE_TEXT_PRESERVED_WHOLE_DESPITE_ARTIFACT_CAP", extraction_warnings: unique([...(source.extraction_warnings || []), "SOURCE_EXCEEDS_ARTIFACT_CAP_STORED_ATOMIC_LOSSLESS"]) };
}

function emptyFamilyArtifacts({ run, rootUrl }) {
  const out = {};
  for (const code of ROOT_FAMILY_CODES) {
    const [bucket, purpose] = FAMILY_META[code] || ["UNMAPPED_BUCKET", "unmapped_root_family"];
    out[`lossless_family__${code}`] = {
      run_id: run.run_id,
      target_url: rootUrl,
      artifact_name: `lossless_family__${code}`,
      generated_by: "source_discovery_extraction",
      bucket,
      root_family: code,
      purpose,
      sources: [],
      manifest_only_sources: [],
      metadata_only_sources: [],
      rejected_sources: [],
      missing_limited_primary_sources: [],
      corpus_forensics: { total_sources: 0, manifest_only_sources: 0, metadata_only_sources: 0, rejected_sources: 0 },
      dedupe_forensics: {}
    };
  }
  return out;
}

function buildFamilyDedupeForensics(manifest, artifact) {
  const rows = manifest.manifest_sources.filter((row) => row.root_family === artifact.root_family);
  return {
    manifest_rows_seen: rows.length,
    primary_rows_seen: rows.filter((row) => row.admission_tier === "PRIMARY").length,
    manifest_only_rows_seen: rows.filter((row) => ["SECONDARY", "CONTEXT_ONLY"].includes(row.admission_tier)).length,
    metadata_only_rows_seen: rows.filter((row) => row.admission_tier === "METADATA_ONLY").length,
    canonical_urls_seen: new Set(rows.map((row) => row.canonical_url_key)).size,
    canonical_sources_saved: artifact.sources.length,
    duplicate_rows_allowed: false
  };
}

function buildMissingLimited(inventories, manifest) {
  const rows = [];
  for (const code of ROOT_FAMILY_CODES) {
    const artifact = inventories[`lossless_family__${code}`];
    const primaryManifestRows = manifest.manifest_sources.filter((row) => row.root_family === code && row.admission_tier === "PRIMARY");
    if (artifact && primaryManifestRows.length === 0 && shouldReportEmptyFamily(code)) rows.push({
      root_family: code,
      bucket_affected: artifact.bucket,
      missing_or_limited_source: code,
      search_exhausted: true,
      attempted_paths: KNOWN_PATHS_BY_FAMILY[code] || [],
      attempted_manifest_rows: manifest.manifest_sources.filter((row) => row.root_family === code).length,
      why_it_matters: "No PRIMARY public source was found in Source Discovery URL Manifest for this root family.",
      status: "ABSENT_AFTER_TARGETED_PROBE"
    });
  }
  return rows;
}

function shouldReportEmptyFamily(code) { return code.startsWith("D") || code.startsWith("L") || ["T0_ROOT", "T1_IDENTITY", "T2_LEGAL_IDENTITY", "P1_PRODUCT", "P3_AI_CAPABILITY_TECHNICAL", "P5_ENTERPRISE_PRICING"].includes(code); }
function manifestOnlyRecord(row) { return { manifest_id: row.manifest_id, bucket: row.bucket, root_family: row.root_family, canonical_url: row.canonical_url, fetch_url: row.fetch_url, route_type: row.route_type, admission_tier: row.admission_tier, variant_class: row.variant_class, extraction_decision: row.extraction_decision, tier_reason: row.tier_reason }; }
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
async function fetchRaw(url) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.sourceFetchTimeoutMs); try { const response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow", headers: { "user-agent": "LexNovaHQ-DiligenceReviewer/0.8 (+central-source-extraction)", "accept": "text/markdown,text/plain,text/html,application/xhtml+xml,application/json,application/xml,text/xml,*/*;q=0.5" } }); const contentType = response.headers.get("content-type") || ""; const rawText = await response.text(); if (!response.ok) { const error = new Error(`HTTP_${response.status}`); error.http_status = response.status; throw error; } return { http_status: response.status, content_type: contentType, final_url: response.url, raw_text: rawText, extraction_warnings: buildWarnings(contentType, rawText) }; } catch (error) { if (error?.name === "AbortError") throw new Error("FETCH_TIMEOUT"); throw error; } finally { clearTimeout(timeout); } }
function normalizeCandidateUrl(value, baseUrl, rootHost) { try { const url = new URL(String(value || "").trim(), baseUrl); if (!["http:", "https:"].includes(url.protocol)) return ""; const host = stripWww(url.hostname); if (!(host === rootHost || host.endsWith(`.${rootHost}`))) return ""; url.hash = ""; return url.toString(); } catch { return ""; } }
function buildWarnings(contentType, text) { const warnings = []; const lower = String(contentType || "").toLowerCase(); if (lower.includes("pdf")) warnings.push("PDF_FETCHED_AS_TEXT_NOT_PARSED"); if (String(text || "").length > 900000) warnings.push("LARGE_SOURCE_TEXT"); return warnings; }
function normalizeRootUrl(value) { const raw = String(value || "").trim(); const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; const url = new URL(withProtocol); url.hash = ""; if (!url.pathname || url.pathname === "/") url.pathname = "/"; return url.toString(); }
function stripWww(hostname) { return String(hostname || "").replace(/^www\./i, "").toLowerCase(); }
function isBadEvidenceText(text) { const value = String(text || "").trim().toLowerCase(); return value.includes("page not found") || value.includes("this page does not exist") || value === "sarvam platform\nbuild powerful multilingual voice and speech applications with sarvam platform.\nsarvam platform"; }
function shouldUseKnownPathFamily(code) { return Boolean(KNOWN_PATHS_BY_FAMILY[code]); }
function byteLength(value) { return Buffer.byteLength(JSON.stringify(value || {}), "utf8"); }
function positiveInt(value, fallback) { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
function withoutLosslessText(row) { const { lossless_text: _losslessText, ...rest } = row; return rest; }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }

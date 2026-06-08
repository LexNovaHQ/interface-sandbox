import { buildFamilySearchQueries, buildBoundedGeminiUrlDiscoveryPrompt, SOURCE_DISCOVERY_MAGNA_CARTA_VERSION } from "./sourceDiscoverySearchPlan.js";
import { probeDeterministicSources } from "./sourceDiscoveryProbe.js";
import {
  buildAnchorClassificationPrompt,
  extractAnchorClassifiedCandidates,
  extractFirstPartyLinksFromHtml,
  mergeAnchorLinks
} from "./sourceDiscoveryAnchorLinks.js";

const ALLOWED_FAMILIES = ["company_profile", "product_profile", "legal_profile", "governance_profile"];

function normalizeCandidateUrl(value) {
  try {
    const raw = String(value || "").trim();
    if (!raw) return null;
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withScheme);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    if (url.pathname !== "/" && url.pathname.endsWith("/")) url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

function hostWithoutWww(value) {
  return String(value || "").toLowerCase().replace(/^www\./, "");
}

function isFirstPartyUrl(value, registrableDomain) {
  try {
    const url = new URL(value);
    const hostname = hostWithoutWww(url.hostname);
    const domain = hostWithoutWww(registrableDomain);
    return hostname === domain || hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

function isUnsafeUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return true;
    const host = url.hostname.toLowerCase();
    if (["localhost", "0.0.0.0"].includes(host)) return true;
    if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
    if (/^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
    return false;
  } catch {
    return true;
  }
}

function dedupeRecords(records = []) {
  const map = new Map();
  for (const record of records || []) {
    const url = normalizeCandidateUrl(record?.url || record);
    if (!url) continue;
    const existing = map.get(url);
    const next = { ...record, url };
    if (!existing) {
      map.set(url, {
        ...next,
        provenance: Array.isArray(next.provenance) ? next.provenance : []
      });
      continue;
    }
    existing.provenance = [
      ...(Array.isArray(existing.provenance) ? existing.provenance : []),
      ...(Array.isArray(next.provenance) ? next.provenance : [])
    ];
    if (!existing.source_family && next.source_family) existing.source_family = next.source_family;
    if (!existing.reason && next.reason) existing.reason = next.reason;
    if (!existing.link_text && next.link_text) existing.link_text = next.link_text;
    if (!existing.anchor_url && next.anchor_url) existing.anchor_url = next.anchor_url;
  }
  return [...map.values()];
}

function summarizeRecord(record = {}) {
  return {
    url: record.url || null,
    source_family: record.source_family || null,
    reason: record.reason || "",
    anchor_url: record.anchor_url || null,
    link_text: record.link_text || "",
    status: record.status || null,
    content_type: record.content_type || "",
    provenance: Array.isArray(record.provenance) ? record.provenance.slice(0, 8) : []
  };
}

function anchorRecordFor(plan, url) {
  return {
    url,
    source_family: plan.source_family,
    anchor_family: plan.source_family,
    provenance: [{ method: "family_anchor_url", family: plan.source_family, anchor_url: url }]
  };
}

async function fetchAnchor({ record, identity, options }) {
  const url = normalizeCandidateUrl(record?.url);
  if (!url || isUnsafeUrl(url) || !isFirstPartyUrl(url, identity.registrable_domain)) {
    return { ok: false, anchor_url: url, source_family: record?.source_family || null, error: "unsafe_or_not_first_party", links: [] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.anchorFetchTimeoutMs || 8000));
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "LexNovaHQ-SourceDiscovery/1.0",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      return { ok: false, anchor_url: url, source_family: record.source_family, status: response.status, content_type: contentType, error: "anchor_not_html_or_not_ok", links: [] };
    }
    const html = await response.text();
    const links = extractFirstPartyLinksFromHtml({
      html,
      anchorUrl: url,
      registrableDomain: identity.registrable_domain,
      limit: Number(options.anchorLinkLimit || 200)
    });
    return { ok: true, anchor_url: url, source_family: record.source_family, status: response.status, content_type: contentType, link_count: links.length, links };
  } catch (error) {
    return { ok: false, anchor_url: url, source_family: record?.source_family || null, error: error?.name === "AbortError" ? "anchor_fetch_timeout" : error?.message || "anchor_fetch_failed", links: [] };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAnchors({ plans, identity, options }) {
  const anchorRecords = dedupeRecords(plans.flatMap((plan) => (plan.anchor_urls || []).map((url) => anchorRecordFor(plan, url))));
  const limit = Math.max(1, Number(options.anchorFetchMaxAnchors || 48));
  const selected = anchorRecords.slice(0, limit);
  const concurrency = Math.max(1, Number(options.anchorFetchConcurrency || 4));
  const results = [];
  for (let i = 0; i < selected.length; i += concurrency) {
    const batch = selected.slice(i, i + concurrency);
    results.push(...await Promise.all(batch.map((record) => fetchAnchor({ record, identity, options }))));
  }
  return { anchor_records: selected, results, merged_links: mergeAnchorLinks(results) };
}

function familyCandidateFromAnchor(record, plan) {
  return {
    url: record.url,
    source_family: plan.source_family,
    reason: `Minimum ${plan.label} anchor URL.`,
    anchor_url: record.url,
    link_text: "",
    provenance: [{ method: "family_anchor_url", family: plan.source_family, anchor_url: record.url }]
  };
}

async function classifyAnchorLinks({ plans, anchorExtraction, identity, company_name, options, runPool }) {
  const runs = [];
  const candidates = [];
  const anchorSelfCandidates = [];

  for (const plan of plans) {
    for (const record of anchorExtraction.anchor_records.filter((item) => item.source_family === plan.source_family)) {
      anchorSelfCandidates.push(familyCandidateFromAnchor(record, plan));
    }

    const prompt = buildAnchorClassificationPrompt({ familyPlan: plan, links: anchorExtraction.merged_links, identity, company_name });
    const result = await runPool({
      poolName: "json",
      prompt,
      options: {
        timeoutMs: Number(options.anchorClassifyTimeoutMs || options.jsonTimeoutMs || options.searchTimeoutMs || 90000),
        maxOutputTokens: Number(options.anchorClassifyMaxOutputTokens || 8192),
        temperature: Number(options.temperature ?? 0),
        responseMimeType: "application/json",
        enableSearchGrounding: false
      }
    });

    runs.push({
      source_family: plan.source_family,
      retrieval_intent_id: "anchor_link_classification",
      ok: result.ok === true,
      admitted_count: Array.isArray(result.json?.admitted) ? result.json.admitted.length : 0,
      rejected_count: Array.isArray(result.json?.rejected) ? result.json.rejected.length : 0,
      coverage_gap: result.json?.coverage_gap || null,
      error_type: result.error_type || null,
      error: result.error || null,
      model_meta: result.model_meta || null
    });

    if (result.ok === true) {
      const extracted = extractAnchorClassifiedCandidates({ classifierJson: result.json, familyPlan: plan, registrableDomain: identity.registrable_domain });
      for (const item of extracted) {
        candidates.push({
          ...item,
          provenance: [{ method: "gemini_anchor_classification", family: plan.source_family, anchor_url: item.anchor_url, link_text: item.link_text, reason: item.reason }]
        });
      }
    }
  }

  return { runs, candidates: dedupeRecords([anchorSelfCandidates, candidates].flat()) };
}

function extractGeminiUrls({ geminiJson, familyPlan, retrievalIntent, registrableDomain }) {
  const rawUrls = Array.isArray(geminiJson?.urls) ? geminiJson.urls : [];
  const out = [];
  for (const item of rawUrls) {
    const rawUrl = typeof item === "string" ? item : item?.url;
    const url = normalizeCandidateUrl(rawUrl);
    if (!url || isUnsafeUrl(url) || !isFirstPartyUrl(url, registrableDomain)) continue;
    out.push({
      url,
      source_family: familyPlan.source_family,
      reason: typeof item === "object" ? item?.reason || "Gemini free first-party search candidate." : "Gemini free first-party search candidate.",
      provenance: [{ method: "free_first_party_search", family: familyPlan.source_family, retrieval_intent_id: retrievalIntent?.intent_id || "free_first_party_search", query: retrievalIntent?.query || familyPlan.query }]
    });
  }
  return out.slice(0, familyPlan.target_max || 8);
}

async function runFreeFirstPartySearch({ plans, identity, company_name, options, runPool }) {
  const runs = [];
  const candidates = [];
  for (const plan of plans) {
    const intents = (plan.retrieval_intents || []).filter((intent) => intent.intent_id === "free_first_party_search");
    for (const intent of intents) {
      const prompt = buildBoundedGeminiUrlDiscoveryPrompt({
        primary_url: identity.primary_url,
        normalized_origin: identity.normalized_origin,
        registrable_domain: identity.registrable_domain,
        company_name,
        family_plan: plan,
        retrieval_intent: intent
      });
      const result = await runPool({
        poolName: "search",
        prompt,
        options: {
          timeoutMs: Number(options.searchTimeoutMs || 90000),
          maxOutputTokens: Number(options.searchMaxOutputTokens || 3072),
          temperature: Number(options.temperature ?? 0),
          responseMimeType: "application/json",
          enableSearchGrounding: true
        }
      });
      runs.push({ source_family: plan.source_family, retrieval_intent_id: intent.intent_id, ok: result.ok === true, error_type: result.error_type || null, error: result.error || null, coverage_gap: result.json?.coverage_gap || null, model_meta: result.model_meta || null });
      if (result.ok === true) {
        candidates.push(...extractGeminiUrls({ geminiJson: result.json, familyPlan: plan, retrievalIntent: intent, registrableDomain: identity.registrable_domain }));
      }
    }
  }
  return { runs, candidates: dedupeRecords(candidates) };
}

function candidateLookupKeys(value) {
  const normalized = normalizeCandidateUrl(value);
  if (!normalized) return [];
  const out = new Set([normalized]);
  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    const altHosts = host.startsWith("www.")
      ? [host.replace(/^www\./, "")]
      : [`www.${host}`];

    for (const altHost of altHosts) {
      const alt = new URL(normalized);
      alt.hostname = altHost;
      out.add(alt.toString());
    }

    const noSlash = new URL(normalized);
    if (noSlash.pathname !== "/" && noSlash.pathname.endsWith("/")) {
      noSlash.pathname = noSlash.pathname.replace(/\/+$/, "");
      out.add(noSlash.toString());
    }
  } catch {
    // ignore alias failure
  }
  return [...out];
}
async function probeFinalCandidates({ candidates, options }) {
  const probeResult = await probeDeterministicSources(candidates.map((item) => item.url), {
    concurrency: Number(options.probeConcurrency || 6),
    timeoutMs: Number(options.probeTimeoutMs || 5000),
    delayMs: Number(options.probeDelayMs || 25)
  });
  const byUrl = new Map();
  for (const item of candidates || []) {
    for (const key of candidateLookupKeys(item.url)) {
      if (!byUrl.has(key)) byUrl.set(key, item);
    }
  }

  const hydrate = (rows) => rows.map((row) => {
    let candidate = null;
    for (const key of candidateLookupKeys(row.url)) {
      candidate = byUrl.get(key);
      if (candidate) break;
    }
    return { ...row, ...(candidate || {}) };
  });

  return { probeResult, admitted: hydrate(probeResult.admitted), rejected: hydrate(probeResult.rejected) };
}

function buildDiscovery({ admitted, rejected, plans }) {
  const candidate_sources = admitted.map((item) => ({ ...summarizeRecord(item), admission_status: "ADMITTED" }));
  const rejected_sources = rejected.map((item) => ({ ...summarizeRecord(item), admission_status: "REJECTED", rejection_reason: item.reason || "probe_or_fetch_failed" }));
  const byFamily = (family) => candidate_sources.filter((item) => item.source_family === family);
  const counts = {
    candidate_sources: candidate_sources.length,
    company_profile_sources: byFamily("company_profile").length,
    product_profile_sources: byFamily("product_profile").length,
    legal_profile_sources: byFamily("legal_profile").length,
    governance_profile_sources: byFamily("governance_profile").length,
    rejected_sources: rejected_sources.length,
    coverage_gaps: 0
  };
  const coverage_gaps = plans
    .filter((plan) => byFamily(plan.source_family).length < plan.target_min)
    .map((plan) => ({ source_family: plan.source_family, label: plan.label, target_minimum: plan.target_min, found: byFamily(plan.source_family).length, status: "coverage_gap" }));
  counts.coverage_gaps = coverage_gaps.length;
  return {
    source_discovery_version: SOURCE_DISCOVERY_MAGNA_CARTA_VERSION,
    candidate_sources,
    company_profile_sources: byFamily("company_profile"),
    product_profile_sources: byFamily("product_profile"),
    legal_profile_sources: byFamily("legal_profile"),
    governance_profile_sources: byFamily("governance_profile"),
    rejected_sources,
    coverage_gaps,
    counts
  };
}

function buildProvenanceAudit({ plans, anchorExtraction, anchorClassification, freeSearch, finalProbe }) {
  return plans.map((plan) => {
    const family = plan.source_family;
    const finalAdmitted = finalProbe.admitted.filter((item) => item.source_family === family);
    const finalRejected = finalProbe.rejected.filter((item) => item.source_family === family);
    return {
      source_family: family,
      label: plan.label,
      anchor_urls_attempted: anchorExtraction.anchor_records.filter((item) => item.source_family === family).map((item) => item.url),
      anchor_fetch: anchorExtraction.results.filter((item) => item.source_family === family).map((item) => ({ ok: item.ok, anchor_url: item.anchor_url, status: item.status || null, content_type: item.content_type || "", link_count: item.link_count || 0, error: item.error || null })),
      gemini_anchor_classification: anchorClassification.runs.filter((run) => run.source_family === family),
      free_first_party_search: freeSearch.runs.filter((run) => run.source_family === family),
      admitted: finalAdmitted.map(summarizeRecord),
      rejected: finalRejected.map(summarizeRecord)
    };
  });
}

export async function runSourceDiscoveryOrchestrator({ identity, company_name = null, options = {}, runPool }) {
  if (!identity?.primary_url || !identity?.registrable_domain || !identity?.normalized_origin) throw new Error("identity with primary_url, normalized_origin, and registrable_domain is required");
  if (typeof runPool !== "function") throw new Error("runPool function is required");

  const plans = buildFamilySearchQueries({ registrable_domain: identity.registrable_domain, normalized_origin: identity.normalized_origin, company_name })
    .filter((plan) => ALLOWED_FAMILIES.includes(plan.source_family));

  const anchorExtraction = await fetchAnchors({ plans, identity, options });
  const anchorClassification = await classifyAnchorLinks({ plans, anchorExtraction, identity, company_name, options, runPool });

  const shouldRunFreeSearch = options.runFreeFirstPartySearch === true || options.sourceDiscoveryMode === "sync_with_free_search";
  const freeSearch = shouldRunFreeSearch
    ? await runFreeFirstPartySearch({ plans, identity, company_name, options, runPool })
    : { runs: [], candidates: [] };

  const allCandidates = dedupeRecords([...anchorClassification.candidates, ...freeSearch.candidates])
    .filter((item) => ALLOWED_FAMILIES.includes(item.source_family))
    .filter((item) => normalizeCandidateUrl(item.url) && !isUnsafeUrl(item.url) && isFirstPartyUrl(item.url, identity.registrable_domain));

  const finalProbe = await probeFinalCandidates({ candidates: allCandidates, options });
  const discovery = buildDiscovery({ admitted: finalProbe.admitted, rejected: finalProbe.rejected, plans });
  const provenance_audit = buildProvenanceAudit({ plans, anchorExtraction, anchorClassification, freeSearch, finalProbe });

  return {
    discovery,
    diagnostics: {
      discovery_policy: {
        source_discovery_version: SOURCE_DISCOVERY_MAGNA_CARTA_VERSION,
        gemini_discovers_and_classifies: true,
        deterministic_role: "fetch_extract_normalize_dedupe_first_party_probe_prepare_only",
        final_allowed_families: ALLOWED_FAMILIES,
        provenance_is_report_not_gate: true,
        admitted_documents_downstream_lossless: true
      },
      plans,
      anchor_link_discovery: {
        anchor_urls_attempted: anchorExtraction.anchor_records.map(summarizeRecord),
        anchor_fetch_results: anchorExtraction.results.map((result) => ({ ok: result.ok, anchor_url: result.anchor_url, source_family: result.source_family, status: result.status || null, content_type: result.content_type || "", link_count: result.link_count || 0, error: result.error || null })),
        extracted_first_party_link_count: anchorExtraction.merged_links.length,
        sample_extracted_links: anchorExtraction.merged_links.slice(0, 40)
      },
      gemini_anchor_classification_runs: anchorClassification.runs,
      free_first_party_search_runs: freeSearch.runs,
      provenance_audit,
      candidate_counts: {
        anchor_classified_candidates: anchorClassification.candidates.length,
        free_search_candidates: freeSearch.candidates.length,
        final_unique_candidates: allCandidates.length,
        admitted: finalProbe.probeResult.counts.admitted,
        rejected: finalProbe.probeResult.counts.rejected
      },
      probe_counts: {
        final_candidates: finalProbe.probeResult.counts
      }
    }
  };
}






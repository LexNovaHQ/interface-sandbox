import { buildFamilySearchQueries, buildBoundedGeminiUrlDiscoveryPrompt } from "./sourceDiscoverySearchPlan.js";
import { buildDeterministicSourceCandidates } from "./sourceDiscoveryStrategy.js";
import { probeDeterministicSources } from "./sourceDiscoveryProbe.js";
import { buildDiscoveryBuckets } from "./sourceDiscoveryCategorizer.js";

function normalizeCandidateUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function isFirstPartyUrl(value, registrableDomain) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const domain = String(registrableDomain || "").toLowerCase();
    return hostname === domain || hostname.endsWith("." + domain);
  } catch {
    return false;
  }
}

function extractGeminiUrls({ geminiJson, familyPlan, registrableDomain }) {
  const rawUrls = Array.isArray(geminiJson?.urls) ? geminiJson.urls : [];
  const out = [];

  for (const item of rawUrls) {
    const rawUrl = typeof item === "string" ? item : item?.url;
    const url = normalizeCandidateUrl(rawUrl);
    if (!url) continue;
    if (!isFirstPartyUrl(url, registrableDomain)) continue;

    out.push({
      url,
      source_family: familyPlan.source_family,
      discovery_method: "gemini_search",
      reason: typeof item === "object" ? item?.reason || "" : "",
      batch_id: familyPlan.source_family
    });
  }

  return out.slice(0, familyPlan.target_max || 3);
}

function mergeCandidates(candidateGroups) {
  const seen = new Map();

  for (const group of candidateGroups || []) {
    for (const item of group || []) {
      const url = normalizeCandidateUrl(item?.url || item);
      if (!url) continue;

      if (!seen.has(url)) {
        seen.set(url, {
          url,
          source_family: item?.source_family || null,
          discovery_method: item?.discovery_method || "unknown",
          reason: item?.reason || "",
          batch_id: item?.batch_id || null
        });
      } else {
        const existing = seen.get(url);
        if (existing.discovery_method !== item?.discovery_method) {
          existing.discovery_method = existing.discovery_method + "+" + (item?.discovery_method || "unknown");
        }
        if (!existing.source_family && item?.source_family) {
          existing.source_family = item.source_family;
        }
      }
    }
  }

  return [...seen.values()];
}

function buildCoverageGaps({ plans, buckets, geminiRuns }) {
  const familyToBucket = {
    product_profile: buckets.product_profile_sources || [],
    legal_governance: buckets.legal_governance_sources || [],
    docs_developer: buckets.docs_developer_sources || [],
    commercial: buckets.commercial_sources || [],
    updates: buckets.update_sources || []
  };

  return plans
    .filter((plan) => (familyToBucket[plan.source_family] || []).length < plan.target_min)
    .map((plan) => ({
      source_family: plan.source_family,
      label: plan.label,
      target_minimum: plan.target_min,
      found: (familyToBucket[plan.source_family] || []).length,
      attempted_methods: ["gemini_search", "deterministic_seed", "probe_validation"],
      attempted_query: plan.query,
      gemini_status: geminiRuns.find((run) => run.source_family === plan.source_family)?.ok === true ? "completed" : "failed_or_empty",
      status: "coverage_gap"
    }));
}

export async function runSourceDiscoveryOrchestrator({ identity, company_name = null, options = {}, runPool }) {
  if (!identity?.primary_url || !identity?.registrable_domain || !identity?.normalized_origin) {
    throw new Error("identity with primary_url, normalized_origin, and registrable_domain is required");
  }

  if (typeof runPool !== "function") {
    throw new Error("runPool function is required");
  }

  const plans = buildFamilySearchQueries({
    registrable_domain: identity.registrable_domain,
    company_name
  });

  const geminiRuns = [];
  const geminiCandidates = [];

  for (const plan of plans) {
    const prompt = buildBoundedGeminiUrlDiscoveryPrompt({
      primary_url: identity.primary_url,
      normalized_origin: identity.normalized_origin,
      registrable_domain: identity.registrable_domain,
      company_name,
      family_plan: plan
    });

    const result = await runPool({
      poolName: "search",
      prompt,
      options: {
        timeoutMs: Number(options.searchTimeoutMs || 90000),
        maxOutputTokens: Number(options.searchMaxOutputTokens || 1536),
        temperature: Number(options.temperature ?? 0),
        responseMimeType: "application/json",
        enableSearchGrounding: true
      }
    });

    const run = {
      source_family: plan.source_family,
      ok: result.ok === true,
      model_meta: result.model_meta || null,
      error_type: result.error_type || null,
      error: result.error || null,
      coverage_gap: result.json?.coverage_gap || null
    };

    geminiRuns.push(run);

    if (result.ok === true) {
      geminiCandidates.push(...extractGeminiUrls({
        geminiJson: result.json,
        familyPlan: plan,
        registrableDomain: identity.registrable_domain
      }));
    }
  }

  const deterministicCandidates = buildDeterministicSourceCandidates({
    normalized_origin: identity.normalized_origin
  }).map((url) => ({
    url,
    discovery_method: "deterministic_seed"
  }));

  const mergedCandidates = mergeCandidates([geminiCandidates, deterministicCandidates]);

  const probeResult = await probeDeterministicSources(
    mergedCandidates.map((item) => item.url),
    {
      concurrency: Number(options.probeConcurrency || 6),
      timeoutMs: Number(options.probeTimeoutMs || 5000),
      delayMs: Number(options.probeDelayMs || 25)
    }
  );

  const metadataByUrl = new Map(mergedCandidates.map((item) => [normalizeCandidateUrl(item.url), item]));

  const admitted = probeResult.admitted.map((item) => ({
    ...item,
    ...(metadataByUrl.get(normalizeCandidateUrl(item.url)) || {})
  }));

  const rejected = probeResult.rejected.map((item) => ({
    ...item,
    ...(metadataByUrl.get(normalizeCandidateUrl(item.url)) || {})
  }));

  const buckets = buildDiscoveryBuckets({ admitted, rejected });
  const coverage_gaps = buildCoverageGaps({ plans, buckets, geminiRuns });
  buckets.coverage_gaps = coverage_gaps;
  buckets.counts.coverage_gaps = coverage_gaps.length;

  return {
    discovery: buckets,
    diagnostics: {
      plans,
      gemini_runs: geminiRuns,
      candidate_counts: {
        gemini_candidates: geminiCandidates.length,
        deterministic_candidates: deterministicCandidates.length,
        merged_candidates: mergedCandidates.length
      },
      probe_counts: probeResult.counts
    }
  };
}


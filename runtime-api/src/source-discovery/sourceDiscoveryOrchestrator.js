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
        const nextMethod = item?.discovery_method || "unknown";
        if (!String(existing.discovery_method || "").split("+").includes(nextMethod)) {
          existing.discovery_method = existing.discovery_method + "+" + nextMethod;
        }
        if (!existing.source_family && item?.source_family) {
          existing.source_family = item.source_family;
        }
      }
    }
  }

  return [...seen.values()];
}

function metadataMapFor(candidates) {
  return new Map((candidates || []).map((item) => [normalizeCandidateUrl(item.url), item]));
}

function hydrateProbeRecords(records, metadataByUrl) {
  return (records || []).map((item) => ({
    ...item,
    ...(metadataByUrl.get(normalizeCandidateUrl(item.url)) || {})
  }));
}

function bucketCountForFamily(buckets, family) {
  const familyToBucket = {
    product_profile: buckets.product_profile_sources || [],
    legal_governance: buckets.legal_governance_sources || [],
    docs_developer: buckets.docs_developer_sources || [],
    commercial: buckets.commercial_sources || [],
    updates: buckets.update_sources || []
  };
  return (familyToBucket[family] || []).length;
}

function buildCoverageGaps({ plans, buckets, geminiRuns, supportFamilies }) {
  const supportSet = new Set(supportFamilies || []);

  return plans
    .filter((plan) => bucketCountForFamily(buckets, plan.source_family) < plan.target_min)
    .map((plan) => ({
      source_family: plan.source_family,
      label: plan.label,
      target_minimum: plan.target_min,
      found: bucketCountForFamily(buckets, plan.source_family),
      attempted_methods: [
        "gemini_search_primary",
        "probe_validation",
        ...(supportSet.has(plan.source_family) ? ["deterministic_support_probe"] : [])
      ],
      attempted_query: plan.query,
      gemini_status: geminiRuns.find((run) => run.source_family === plan.source_family)?.ok === true ? "completed" : "failed_or_empty",
      status: "coverage_gap"
    }));
}

async function probeCandidateSet({ candidates, options }) {
  const metadataByUrl = metadataMapFor(candidates);
  const probeResult = await probeDeterministicSources(
    (candidates || []).map((item) => item.url),
    {
      concurrency: Number(options.probeConcurrency || 6),
      timeoutMs: Number(options.probeTimeoutMs || 5000),
      delayMs: Number(options.probeDelayMs || 25)
    }
  );

  return {
    probeResult,
    admitted: hydrateProbeRecords(probeResult.admitted, metadataByUrl),
    rejected: hydrateProbeRecords(probeResult.rejected, metadataByUrl)
  };
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

  const geminiProbe = await probeCandidateSet({ candidates: geminiCandidates, options });
  const geminiOnlyBuckets = buildDiscoveryBuckets({
    admitted: geminiProbe.admitted,
    rejected: geminiProbe.rejected
  });

  const supportFamilies = plans
    .filter((plan) => bucketCountForFamily(geminiOnlyBuckets, plan.source_family) < plan.target_min)
    .map((plan) => plan.source_family);

  const supportCandidatesRaw = supportFamilies.length > 0
    ? buildDeterministicSourceCandidates({
        normalized_origin: identity.normalized_origin,
        source_families: supportFamilies
      })
    : [];

  const geminiUrls = new Set(geminiCandidates.map((item) => normalizeCandidateUrl(item.url)).filter(Boolean));
  const supportCandidates = supportCandidatesRaw.filter((item) => !geminiUrls.has(normalizeCandidateUrl(item.url)));
  const supportProbe = supportCandidates.length > 0
    ? await probeCandidateSet({ candidates: supportCandidates, options })
    : { probeResult: { counts: { admitted: 0, rejected: 0 } }, admitted: [], rejected: [] };

  const admitted = mergeCandidates([geminiProbe.admitted, supportProbe.admitted]);
  const rejected = mergeCandidates([geminiProbe.rejected, supportProbe.rejected]);
  const buckets = buildDiscoveryBuckets({ admitted, rejected });
  const coverage_gaps = buildCoverageGaps({ plans, buckets, geminiRuns, supportFamilies });
  buckets.coverage_gaps = coverage_gaps;
  buckets.counts.coverage_gaps = coverage_gaps.length;

  return {
    discovery: buckets,
    diagnostics: {
      discovery_policy: {
        gemini_primary_for_all_families: true,
        deterministic_role: "support_only_after_gemini_family_gap",
        source_family_preserved_from_gemini: true
      },
      plans,
      gemini_runs: geminiRuns,
      support_families: supportFamilies,
      candidate_counts: {
        gemini_candidates: geminiCandidates.length,
        deterministic_support_candidates: supportCandidates.length,
        merged_candidates: admitted.length + rejected.length
      },
      probe_counts: {
        gemini_primary: geminiProbe.probeResult.counts,
        deterministic_support: supportProbe.probeResult.counts
      }
    }
  };
}

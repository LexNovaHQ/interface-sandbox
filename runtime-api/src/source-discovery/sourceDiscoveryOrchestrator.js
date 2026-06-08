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

function extractGeminiUrls({ geminiJson, familyPlan, retrievalIntent, registrableDomain }) {
  const rawUrls = Array.isArray(geminiJson?.urls) ? geminiJson.urls : [];
  const out = [];
  const intentId = retrievalIntent?.intent_id || geminiJson?.retrieval_intent_id || "family_query";

  for (const item of rawUrls) {
    const rawUrl = typeof item === "string" ? item : item?.url;
    const url = normalizeCandidateUrl(rawUrl);
    if (!url) continue;
    if (!isFirstPartyUrl(url, registrableDomain)) continue;

    out.push({
      url,
      source_family: familyPlan.source_family,
      discovery_method: "gemini_search",
      discovery_role: "primary",
      retrieval_intent_id: intentId,
      reason: typeof item === "object" ? item?.reason || "" : "",
      batch_id: `${familyPlan.source_family}:${intentId}`
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
          discovery_role: item?.discovery_role || null,
          retrieval_intent_id: item?.retrieval_intent_id || null,
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
        if (!existing.discovery_role && item?.discovery_role) {
          existing.discovery_role = item.discovery_role;
        }
        if (!existing.retrieval_intent_id && item?.retrieval_intent_id) {
          existing.retrieval_intent_id = item.retrieval_intent_id;
        }
        if (!existing.reason && item?.reason) {
          existing.reason = item.reason;
        }
        if (!existing.batch_id && item?.batch_id) {
          existing.batch_id = item.batch_id;
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

function geminiStatusForFamily(geminiRuns, family) {
  const runs = (geminiRuns || []).filter((run) => run.source_family === family);
  if (!runs.length) return "not_run";
  if (runs.some((run) => run.ok === true)) return "completed";
  return "failed_or_empty";
}

function buildCoverageGaps({ plans, buckets, geminiRuns, supportFamilies, mode = "final" }) {
  const supportSet = new Set(supportFamilies || []);

  return plans
    .filter((plan) => bucketCountForFamily(buckets, plan.source_family) < plan.target_min)
    .map((plan) => ({
      source_family: plan.source_family,
      label: plan.label,
      target_minimum: plan.target_min,
      found: bucketCountForFamily(buckets, plan.source_family),
      attempted_methods: [
        "gemini_search_primary_multi_intent",
        "probe_validation",
        ...(mode === "final" && supportSet.has(plan.source_family) ? ["deterministic_support_probe"] : [])
      ],
      attempted_query: plan.query,
      retrieval_intents: (plan.retrieval_intents || []).map((intent) => ({
        intent_id: intent.intent_id,
        label: intent.label,
        query: intent.query
      })),
      gemini_status: geminiStatusForFamily(geminiRuns, plan.source_family),
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

function summarizeDiscoveryRecord(record = {}) {
  return {
    url: record.url || null,
    source_family: record.source_family || null,
    discovery_method: record.discovery_method || null,
    discovery_role: record.discovery_role || null,
    retrieval_intent_id: record.retrieval_intent_id || null,
    batch_id: record.batch_id || null,
    reason: record.reason || "",
    status: record.status || null,
    http_status: record.http_status || null,
    content_type: record.content_type || ""
  };
}

function buildFamilyProvenanceAudit({ plans, geminiCandidates, supportCandidates, geminiProbe, supportProbe }) {
  return plans.map((plan) => {
    const family = plan.source_family;
    const byFamily = (records) => (records || []).filter((record) => record.source_family === family);

    return {
      source_family: family,
      label: plan.label,
      target_minimum: plan.target_min,
      target_maximum: plan.target_max,
      retrieval_intents: (plan.retrieval_intents || []).map((intent) => ({
        intent_id: intent.intent_id,
        label: intent.label,
        query: intent.query
      })),
      gemini_primary: {
        candidate_count: byFamily(geminiCandidates).length,
        admitted_count: byFamily(geminiProbe.admitted).length,
        rejected_count: byFamily(geminiProbe.rejected).length,
        admitted: byFamily(geminiProbe.admitted).map(summarizeDiscoveryRecord),
        rejected: byFamily(geminiProbe.rejected).map(summarizeDiscoveryRecord)
      },
      deterministic_support: {
        candidate_count: byFamily(supportCandidates).length,
        admitted_count: byFamily(supportProbe.admitted).length,
        rejected_count: byFamily(supportProbe.rejected).length,
        admitted: byFamily(supportProbe.admitted).map(summarizeDiscoveryRecord),
        rejected: byFamily(supportProbe.rejected).map(summarizeDiscoveryRecord)
      }
    };
  });
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
    const intents = Array.isArray(plan.retrieval_intents) && plan.retrieval_intents.length
      ? plan.retrieval_intents
      : [{ intent_id: "family_query", label: "Family query", query: plan.query, instruction: "Find first-party URLs for this family." }];

    for (const retrievalIntent of intents) {
      const prompt = buildBoundedGeminiUrlDiscoveryPrompt({
        primary_url: identity.primary_url,
        normalized_origin: identity.normalized_origin,
        registrable_domain: identity.registrable_domain,
        company_name,
        family_plan: plan,
        retrieval_intent: retrievalIntent
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

      const run = {
        source_family: plan.source_family,
        retrieval_intent_id: retrievalIntent.intent_id,
        retrieval_intent_label: retrievalIntent.label,
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
          retrievalIntent,
          registrableDomain: identity.registrable_domain
        }));
      }
    }
  }

  const geminiCandidatesMerged = mergeCandidates([geminiCandidates]);
  const geminiProbe = await probeCandidateSet({ candidates: geminiCandidatesMerged, options });
  const geminiOnlyBuckets = buildDiscoveryBuckets({
    admitted: geminiProbe.admitted,
    rejected: geminiProbe.rejected
  });

  const gemini_primary_coverage_gaps = buildCoverageGaps({
    plans,
    buckets: geminiOnlyBuckets,
    geminiRuns,
    supportFamilies: [],
    mode: "gemini_primary"
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

  const geminiUrls = new Set(geminiCandidatesMerged.map((item) => normalizeCandidateUrl(item.url)).filter(Boolean));
  const supportCandidates = supportCandidatesRaw.filter((item) => !geminiUrls.has(normalizeCandidateUrl(item.url)));
  const supportProbe = supportCandidates.length > 0
    ? await probeCandidateSet({ candidates: supportCandidates, options })
    : { probeResult: { counts: { admitted: 0, rejected: 0 } }, admitted: [], rejected: [] };

  const admitted = mergeCandidates([geminiProbe.admitted, supportProbe.admitted]);
  const rejected = mergeCandidates([geminiProbe.rejected, supportProbe.rejected]);
  const buckets = buildDiscoveryBuckets({ admitted, rejected });
  const coverage_gaps = buildCoverageGaps({ plans, buckets, geminiRuns, supportFamilies, mode: "final" });
  buckets.coverage_gaps = coverage_gaps;
  buckets.counts.coverage_gaps = coverage_gaps.length;

  const provenance_audit = buildFamilyProvenanceAudit({
    plans,
    geminiCandidates: geminiCandidatesMerged,
    supportCandidates,
    geminiProbe,
    supportProbe
  });

  return {
    discovery: buckets,
    diagnostics: {
      discovery_policy: {
        gemini_primary_for_all_families: true,
        gemini_primary_strategy: "multi_intent_page_family_discovery",
        deterministic_role: "support_only_after_gemini_family_gap",
        source_family_preserved_from_gemini: true,
        provenance_audit_location: "source_discovery_diagnostics"
      },
      plans,
      gemini_runs: geminiRuns,
      support_families: supportFamilies,
      gemini_primary_coverage_gaps,
      provenance_audit,
      candidate_counts: {
        gemini_candidates: geminiCandidatesMerged.length,
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

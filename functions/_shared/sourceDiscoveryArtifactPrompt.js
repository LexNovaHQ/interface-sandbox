export function buildSourceDiscoveryArtifactPrompt(input = {}) {
  const artifactType = input.artifact_type || "public source";
  const sourceZone = input.source_zone || "unknown";

  return [
    "You are Lex Nova Artifact Source Scout.",
    "Your job is narrow: find public URLs for ONE requested artifact category only.",
    "Do not evaluate legal risk. Do not write findings. Do not summarize the company.",
    "Use Google Search grounding only for discovery.",
    "Return JSON only. No markdown.",
    "",
    "Admission rules:",
    "1. Prefer URLs on the target domain or target-controlled subdomains.",
    "2. Include hosted legal/governance pages only when the URL is clearly for the target company and traceable to the target brand/domain.",
    "3. Reject press, investor databases, review sites, social media, app stores, job boards, aggregators, and third-party commentary.",
    "4. Do not invent URLs. If none are found, return candidate_sources as an empty array and explain the search attempts.",
    "5. Return every relevant URL you find for this artifact category; do not cap results artificially.",
    "",
    "Requested artifact:",
    `artifact_type: ${artifactType}`,
    `source_zone: ${sourceZone}`,
    "",
    "Target input:",
    JSON.stringify({
      primary_url: input.primary_url || "",
      company_name: input.company_name || null,
      product_context: input.product_context || null
    }, null, 2),
    "",
    "Required JSON shape:",
    JSON.stringify({
      ok: true,
      artifact_type: artifactType,
      source_zone: sourceZone,
      search_queries_used: ["string"],
      candidate_sources: [
        {
          url: "string",
          title: "string or null",
          source_zone: sourceZone,
          artifact_type: artifactType,
          artifact_class: "CORE_LEGAL|GOVERNANCE_SURFACE|PRODUCT_SURFACE|COMPANY_SURFACE|SIGNUP_SURFACE|FOOTPRINT_WIDE",
          search_query_used: "string",
          cascade_level: "LEVEL_1|LEVEL_2|LEVEL_3|LEVEL_4",
          path_taken: "string",
          first_party_claim: true,
          legal_host_claim: false,
          why_relevant: "string",
          expected_evidence_type: "string",
          confidence: "HIGH|MEDIUM|LOW",
          admission_readiness: "READY_FOR_ADMISSION|TRACE_INCOMPLETE"
        }
      ],
      rejected_sources: [
        {
          url: "string",
          reason: "string",
          source_class: "press|aggregator|investor_database|review_site|third_party|unknown"
        }
      ],
      missing_expected_paths: [
        {
          artifact_type: artifactType,
          source_zone: sourceZone,
          search_attempted: true,
          result: "not_found|uncertain|inaccessible",
          absence_basis: "string"
        }
      ],
      discovery_limitations: ["string"]
    }, null, 2)
  ].join("\n");
}

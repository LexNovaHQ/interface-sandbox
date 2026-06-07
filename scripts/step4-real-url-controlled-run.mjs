import { createServer } from "vite";

const BASE = "https://sandbox.lexnovahq.com";
const TARGET_URL = "https://sarvam.ai";

const endpoints = {
  evidence_refiner: `${BASE}/api/diligence-evidence-refiner`,
  target_feature_profile: `${BASE}/api/diligence-target-feature-profile`,
  legal_stack_review: `${BASE}/api/diligence-legal-stack-review`,
  registry_ledger: `${BASE}/api/diligence-registry-ledger`,
  operator_challenge: `${BASE}/api/diligence-operator-challenge`,
  final_compiler: `${BASE}/api/diligence-final-compiler`
};

const registry = {
  registry_count: 3,
  threats: [
    {
      _registry_position: 1,
      threat_id: "SMOKE-001",
      threat_name: "Unreviewed AI output reliance",
      pain_tier: "T1",
      pain_category: "Reliance / output risk",
      archetype: "AI assistant",
      surface: "web app, API",
      legal_pain: "Users may rely on AI outputs without review.",
      fp_mechanism: "Product describes AI answer generation but does not show visible reliance controls in the admitted source.",
      fp_impact: "Potential mismatch between product function and contractual/product disclaimers.",
      lex_nova_fix: "Review-ready AI output reliance clause and user review duty.",
      trigger_conditions: ["AI generates answers or summaries", "User may rely on output"],
      exclude_conditions: ["Clear human review workflow shown", "Clear no-reliance warning shown"]
    },
    {
      _registry_position: 2,
      threat_id: "SMOKE-002",
      threat_name: "Missing public AI/data processing posture",
      pain_tier: "T1",
      pain_category: "Privacy / data processing",
      archetype: "AI platform",
      surface: "website, API, enterprise product",
      legal_pain: "Product may process user or customer data but the public footprint may not clearly explain processing boundaries.",
      fp_mechanism: "Public product pages describe AI capability, integrations, or API use without equally visible data-processing controls.",
      fp_impact: "Enterprise buyers may ask for privacy, DPA, and data-use answers before procurement.",
      lex_nova_fix: "Review-ready privacy/DPA issue map and public data-use clarification route.",
      trigger_conditions: ["Product mentions AI/API/customer data", "Public footprint lacks clear processing explanation"],
      exclude_conditions: ["Clear DPA available", "Clear privacy/data-use controls visible"]
    },
    {
      _registry_position: 3,
      threat_id: "SMOKE-003",
      threat_name: "API/service terms coverage gap",
      pain_tier: "T2",
      pain_category: "Commercial terms / API risk",
      archetype: "API-enabled AI product",
      surface: "API, developer docs, web app",
      legal_pain: "API or service capability may create usage-limit, output, SLA, and misuse questions not visibly covered by basic public pages.",
      fp_mechanism: "Public product footprint shows technical service delivery but legal-stack visibility is thin or incomplete.",
      fp_impact: "Buyer review may stall on usage restrictions, output reliance, acceptable use, and support commitments.",
      lex_nova_fix: "Review-ready ToS/AUP/SLA/API terms issue pack.",
      trigger_conditions: ["API or platform delivery is visible", "Legal/service coverage is not clearly surfaced"],
      exclude_conditions: ["Complete ToS/AUP/SLA/API terms visible", "No API/platform delivery visible"]
    }
  ]
};

const registry_key = {
  version: "step4-real-url-controlled",
  note: "Controlled three-threat registry for real URL source collection smoke."
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const server = await createServer({
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true }
  });

  try {
    const diligence = await server.ssrLoadModule("/src/wrapper/diligence/index.js");

    const result = await diligence.runDiligencePipeline(
      {
        run_id: "step4-real-url-" + new Date().toISOString().replace(/[:.]/g, "-"),
        primary_url: TARGET_URL
      },
      {
        endpoints,
        registry,
        registry_key,
        registryBatchSize: 3,
        sourceTimeoutMs: 30000,
        sourceMaxCharacters: 18000,
        stageOptions: {
          model: "gemini-3.1-flash-lite",
          temperature: 0,
          maxOutputTokens: 8192
        },
        stageOptionOverrides: {
          final_compiler: {
            model: "gemini-3.1-flash-lite",
            temperature: 0,
            maxOutputTokens: 16384
          }
        }
      }
    );

    if (!result.ok) {
      console.error(JSON.stringify(result, null, 2));
      throw new Error("Pipeline failed: " + (result.error || "unknown"));
    }

    assert(result.compiler_output, "Missing compiler_output");
    assert(result.pipeline_artifacts?.source_collection?.scrape_meta?.pages_attempted >= 1, "Expected at least one URL attempted");
    assert(result.pipeline_artifacts?.merged_registry_result?.registry_count_evaluated === 3, "Expected exactly three registry rows evaluated");

    console.log("STEP 4 REAL URL CONTROLLED RUN PASSED");
    console.log(JSON.stringify({
      ok: result.ok,
      run_id: result.run_id,
      status: result.status,
      target_url: TARGET_URL,
      source_mode: result.pipeline_artifacts.source_collection.source_mode,
      pages_attempted: result.pipeline_artifacts.source_collection.scrape_meta.pages_attempted,
      pages_read: result.pipeline_artifacts.source_collection.scrape_meta.pages_read,
      source_limitations: result.pipeline_artifacts.source_collection.scrape_meta.limitations,
      stage_count: result.stage_log.length,
      registry_count_evaluated: result.pipeline_artifacts.merged_registry_result.registry_count_evaluated,
      compiler_status: result.compiler_output.diligence_run?.compiler_status,
      findings_count: Array.isArray(result.compiler_output.findings) ? result.compiler_output.findings.length : null,
      controlled_count: Array.isArray(result.compiler_output.controlled_rows) ? result.compiler_output.controlled_rows.length : null,
      insufficient_count: Array.isArray(result.compiler_output.insufficient_evidence_rows) ? result.compiler_output.insufficient_evidence_rows.length : null
    }, null, 2));
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error("STEP 4 REAL URL CONTROLLED RUN FAILED");
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});

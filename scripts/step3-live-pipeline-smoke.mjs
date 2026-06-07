import { createServer } from "vite";

const BASE = "https://sandbox.lexnovahq.com";

const endpoints = {
  evidence_refiner: `${BASE}/api/diligence-evidence-refiner`,
  target_feature_profile: `${BASE}/api/diligence-target-feature-profile`,
  legal_stack_review: `${BASE}/api/diligence-legal-stack-review`,
  registry_ledger: `${BASE}/api/diligence-registry-ledger`,
  operator_challenge: `${BASE}/api/diligence-operator-challenge`,
  final_compiler: `${BASE}/api/diligence-final-compiler`
};

const registry = {
  registry_count: 1,
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
      fp_mechanism: "Product describes AI answer generation but does not show visible reliance controls in the provided source.",
      fp_impact: "Potential mismatch between product function and contractual/product disclaimers.",
      lex_nova_fix: "Review-ready AI output reliance clause and user review duty.",
      trigger_conditions: ["AI generates answers or summaries", "User may rely on output"],
      exclude_conditions: ["Clear human review workflow shown", "Clear no-reliance warning shown"]
    }
  ]
};

const registry_key = {
  version: "step3-live-pipeline-smoke",
  note: "Controlled one-row registry for live orchestrator smoke."
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
        run_id: "step3-live-pipeline-" + new Date().toISOString().replace(/[:.]/g, "-"),
        pasted_text: "Dry Run Co offers an AI assistant that helps users summarize business documents and answer product questions. It is available through a web app and API. The company says users should review outputs before relying on them."
      },
      {
        endpoints,
        registry,
        registry_key,
        registryBatchSize: 1,
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
    assert(result.pipeline_artifacts?.merged_registry_result?.registry_count_evaluated === 1, "Expected exactly one registry row evaluated");

    console.log("STEP 3 LIVE PIPELINE SMOKE PASSED");
    console.log(JSON.stringify({
      ok: result.ok,
      run_id: result.run_id,
      status: result.status,
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
  console.error("STEP 3 LIVE PIPELINE SMOKE FAILED");
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});

import { createServer } from "vite";

const DISCLAIMER = "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function textResponse(payload, status = 200) {
  return new Response(payload, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

async function readRequestJson(init = {}) {
  if (!init.body) return {};
  if (typeof init.body === "string") return JSON.parse(init.body);
  if (init.body instanceof Uint8Array) return JSON.parse(new TextDecoder().decode(init.body));
  return JSON.parse(String(init.body));
}

function getThreatId(row) {
  return String(row?.threat_id || row?.Threat_ID || "UNKNOWN_THREAT").trim();
}

function getThreatName(row) {
  return String(row?.threat_name || row?.Threat_Name || getThreatId(row)).trim();
}

function createRegistryEntry(row, index) {
  return {
    entry_number: Number(row?._registry_position || index + 1),
    threat_id: getThreatId(row),
    threat_name: getThreatName(row),
    conditions: [],
    trigger_if_result: false,
    exclude_if_result: false,
    final_status: "NOT_APPLICABLE",
    feature_refs: [],
    evidence_ref: "dry_run_mock_evidence",
    reasoning_summary: "Dry-run registry ledger entry generated without a model call."
  };
}

function createCompilerOutput({ runId, sourceMode = "url", registryCount = 0 }) {
  return {
    diligence_run: {
      run_id: runId,
      source_mode: sourceMode,
      compiler_status: "completed"
    },
    source_bundle_summary: {
      source_count: 1,
      dry_run: true
    },
    target_profile: {
      company_name: "Dry Run Co",
      market: "AI software"
    },
    primary_product: {
      name: "Dry Run Product",
      summary: "Mock product generated for the controlled dry run."
    },
    product_feature_map: [],
    legal_stack: [],
    document_stack_redline: [],
    threat_registry_summary: {
      registry_count_loaded: registryCount,
      registry_count_evaluated: registryCount,
      status_counts: {
        TRIGGERED: 0,
        CONTROLLED: 0,
        NOT_TRIGGERED: 0,
        NOT_APPLICABLE: registryCount,
        INSUFFICIENT_EVIDENCE: 0
      },
      operator_challenge_result: "PASS_NO_CORRECTIONS",
      reopened_count: 0,
      warnings: []
    },
    feature_to_threat_matrix: [],
    findings: [],
    controlled_rows: [],
    insufficient_evidence_rows: [],
    assembly_route: {
      recommended_package: "INSUFFICIENT_PUBLIC_EVIDENCE",
      document_routes: [],
      route_reasoning: "Dry run fixture only. No model-generated finding was produced.",
      local_counsel_review_required: true,
      vault_confirmation_question_count: 0,
      backend_assembler_note: "Node 5B derives backend-owned handoff fields deterministically."
    },
    report_data: {
      executive_report: {
        cover_and_reliance: {},
        scope_and_methodology: {},
        subject_profile: {},
        risk_posture_summary: {
          summary: "Dry run completed without real model findings."
        },
        material_highlights: [],
        triggered_findings_schedule: [],
        document_stack_verdict: {},
        recommended_route: {}
      },
      full_forensic_record: {
        source_review: {},
        artifact_inventory: [],
        product_feature_map: [],
        feature_to_threat_matrix: [],
        document_stack_redline: [],
        triggered_findings: [],
        controlled_rows: [],
        insufficient_evidence_rows: [],
        assembly_route: {},
        technical_audit_log: []
      }
    },
    technical_audit_log: [],
    threat_findings: [],
    vault_confirmation_questions: [],
    disclaimer: DISCLAIMER
  };
}

function makeMockFetch() {
  const calls = [];

  async function mockFetch(input, init = {}) {
    const url = typeof input === "string" ? input : input?.url || "";
    calls.push({ url, method: init.method || "GET" });

    if (url === "/api/source-discovery-scout") {
      return jsonResponse({
        ok: true,
        service: "source-discovery-scout",
        model_role: "search",
        selected_model: "dry-run-search-model",
        selected_key_alias: "dry-run-search-key",
        attempt_policy: { model_role: "search", max_attempts: 1, attempt_timeout_ms: 15000 },
        attempted_models: [{ provider: "gemini", pool: "search", key_alias: "dry-run-search-key", model: "dry-run-search-model", ok: true }],
        quality_status: "READY_FOR_ADMISSION",
        scout_quality: {
          candidate_count: 2,
          trace_complete_count: 2,
          trace_incomplete_count: 0,
          ready_for_admission_gate: true,
          warnings: []
        },
        discovery: {
          ok: true,
          target: {
            primary_url: "https://example.com/",
            company_domain: "example.com",
            company_name_guess: "Dry Run Co"
          },
          search_queries_used: ["site:example.com terms privacy security"],
          candidate_sources: [
            {
              url: "https://example.com/terms",
              title: "Terms of Service",
              source_zone: "terms",
              artifact_type: "Terms of Service",
              artifact_class: "CORE_LEGAL",
              search_query_used: "site:example.com terms",
              cascade_level: "LEVEL_2",
              path_taken: "Found through target-domain site query.",
              first_party_claim: true,
              legal_host_claim: false,
              why_relevant: "Target-domain legal terms page.",
              expected_evidence_type: "Legal terms text",
              confidence: "HIGH",
              admission_readiness: "READY_FOR_ADMISSION"
            },
            {
              url: "https://example.com/security",
              title: "Security",
              source_zone: "security_trust",
              artifact_type: "Security Page",
              artifact_class: "GOVERNANCE_SURFACE",
              search_query_used: "site:example.com security",
              cascade_level: "LEVEL_2",
              path_taken: "Found through target-domain site query.",
              first_party_claim: true,
              legal_host_claim: false,
              why_relevant: "Target-domain security page.",
              expected_evidence_type: "Security and governance text",
              confidence: "HIGH",
              admission_readiness: "READY_FOR_ADMISSION"
            }
          ],
          rejected_sources: [],
          missing_expected_paths: [],
          discovery_limitations: []
        },
        grounding: { web_search_queries: ["site:example.com terms privacy security"], grounding_chunks: [], grounding_supports: [] },
        usage_metadata: null,
        finish_reason: "STOP"
      });
    }

    if (url.startsWith("https://r.jina.ai/")) {
      return textResponse("Title: Dry Run Co\nDry Run Product is an AI software demo with public marketing, legal, and security copy.");
    }

    if (url === "/api/diligence-evidence-refiner") {
      const body = await readRequestJson(init);
      return jsonResponse({
        ok: true,
        source_bundle: {
          run_id: body.input?.run_id || "dry-run",
          source_mode: body.input?.source_mode || "url",
          source_discovery: body.input?.source_discovery || {},
          source_bundle_summary: { dry_run: true },
          source_records: body.input?.raw_footprint?.records || [],
          scrape_meta: body.input?.scrape_meta || {}
        }
      });
    }

    if (url === "/api/diligence-target-feature-profile") {
      return jsonResponse({
        ok: true,
        target_feature_profile: {
          target_profile: { company_name: "Dry Run Co", market: "AI software" },
          primary_product: { name: "Dry Run Product" },
          product_feature_map: []
        }
      });
    }

    if (url === "/api/diligence-legal-stack-review") {
      return jsonResponse({
        ok: true,
        legal_stack_review: {
          legal_stack: [],
          document_stack_redline: [],
          review_summary: "Dry-run legal stack review."
        }
      });
    }

    if (url === "/api/diligence-registry-ledger") {
      const body = await readRequestJson(init);
      const rows = body.input?.registry_rows || [];
      return jsonResponse({
        ok: true,
        registry_ledger_result: {
          registry_evaluation_ledger: rows.map(createRegistryEntry),
          batch_warnings: []
        }
      });
    }

    if (url === "/api/diligence-operator-challenge") {
      return jsonResponse({
        ok: true,
        operator_challenge_result: {
          operator_challenge_gate: {
            result: "PASS_NO_CORRECTIONS",
            rationale: "Dry run fixture produced no corrected ledger entries."
          },
          corrected_ledger_entries: []
        }
      });
    }

    if (url === "/api/diligence-final-compiler") {
      const body = await readRequestJson(init);
      const inputPayload = body.input || {};
      return jsonResponse({
        ok: true,
        compiler_output: createCompilerOutput({
          runId: inputPayload.run_id || "dry-run",
          sourceMode: inputPayload.source_mode || "url",
          registryCount: inputPayload.registry_count_loaded || 0
        })
      });
    }

    return jsonResponse({ ok: false, error: `Unhandled dry-run URL: ${url}` }, 404);
  }

  mockFetch.calls = calls;
  return mockFetch;
}

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
    const assembly = await server.ssrLoadModule("/src/wrapper/assembly/index.js");
    const mockFetch = makeMockFetch();

    const pipelineResult = await diligence.runDiligencePipeline(
      {
        run_id: "dry-run-e2e",
        primary_url: "https://example.com"
      },
      {
        fetchImpl: mockFetch,
        registryBatchSize: 25
      }
    );

    assert(pipelineResult.ok, `Pipeline failed: ${pipelineResult.error || "unknown error"}`);
    assert(pipelineResult.compiler_output, "Pipeline did not return compiler_output.");
    assert(pipelineResult.pipeline_artifacts.source_collection.source_discovery.status === "COMPLETED", "Source discovery did not complete.");
    assert(pipelineResult.pipeline_artifacts.source_collection.source_discovery.admitted_url_count === 2, "Expected two discovered URLs to be admitted.");
    assert(pipelineResult.pipeline_artifacts.source_collection.scrape_meta.pages_attempted === 3, "Expected primary URL plus two discovered URLs to be scraped.");

    const node5bResult = diligence.assembleNode5B(pipelineResult.compiler_output, {
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    assert(node5bResult.ok, `Node 5B failed: ${(node5bResult.errors || []).join(" | ")}`);

    const persistencePlan = diligence.buildDiligencePersistencePlan({
      pipelineResult,
      node5bResult
    });

    assert(persistencePlan.write_count >= 5, `Expected at least 5 persistence writes, received ${persistencePlan.write_count}.`);

    const intake = assembly.createAssemblyIntake({
      handoff_envelope: node5bResult.handoff_envelope,
      assembly_handoff: node5bResult.assembly_handoff
    });

    assert(intake.ok, `Assembly intake rejected: ${(intake.errors || []).join(" | ")}`);

    console.log("Diligence E2E dry run passed.");
    console.log(JSON.stringify({
      run_id: pipelineResult.run_id,
      stage_count: pipelineResult.stage_log.length,
      source_discovery_status: pipelineResult.pipeline_artifacts.source_collection.source_discovery.status,
      source_discovery_admitted_url_count: pipelineResult.pipeline_artifacts.source_collection.source_discovery.admitted_url_count,
      pages_attempted: pipelineResult.pipeline_artifacts.source_collection.scrape_meta.pages_attempted,
      registry_count_evaluated: pipelineResult.pipeline_artifacts.merged_registry_result.registry_count_evaluated,
      node5b_ok: node5bResult.ok,
      persistence_write_count: persistencePlan.write_count,
      assembly_intake_status: intake.status,
      mock_call_count: mockFetch.calls.length
    }, null, 2));
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error("Diligence E2E dry run failed.");
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});

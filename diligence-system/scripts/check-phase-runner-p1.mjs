import {
  buildHybridExtractionManifest,
  validateHybridExtractionManifest
} from "../stage0-adapter.js";
import { validatePromptStack } from "../prompt-stack-loader.js";
import { buildP1PromptMessages, runP1SourceDiscovery } from "../phase-runner.js";

const runId = "p1_stub_fixture_run";
const manifest = buildHybridExtractionManifest({
  runId,
  sourceMode: "synthetic_demo",
  targetUrl: "N/A",
  companyName: "DemoCo",
  syntheticDemoMaterial: "DemoCo is a synthetic demo company. It offers an AI assistant that summarizes uploaded documents.",
  hybridEvidencePacket: {}
});

const stage0Validation = validateHybridExtractionManifest(manifest);
const promptStackStatus = validatePromptStack();
const messages = buildP1PromptMessages({
  runId,
  targetUrl: "N/A",
  companyName: "DemoCo",
  sourceMode: "synthetic_demo",
  hybridExtractionManifest: manifest.hybrid_extraction_manifest
});

let realGeminiCalled = false;
const result = await runP1SourceDiscovery({
  runId,
  targetUrl: "N/A",
  companyName: "DemoCo",
  sourceMode: "synthetic_demo",
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  promptStackStatus,
  callModel: async () => {
    realGeminiCalled = false;
    return {
      text: JSON.stringify({
        source_discovery_handoff: {
          phase_id: "P1_SOURCE_DISCOVERY_EVIDENCE_BOX",
          admission_status: "TEST_STUB_ONLY",
          admitted_sources: [],
          rejected_sources: [],
          quarantined_sources: [],
          candidate_source_count: 1,
          notes: ["Stubbed validator-only output. No model call."]
        },
        source_discovery_forensic_ledger: {
          phase_id: "P1_SOURCE_DISCOVERY_EVIDENCE_BOX",
          ledger_status: "TEST_STUB_ONLY",
          ledger_events: []
        },
        source_discovery_trace: {
          phase_id: "P1_SOURCE_DISCOVERY_EVIDENCE_BOX",
          trace_status: "TEST_STUB_ONLY",
          input_object: "hybrid_extraction_manifest"
        }
      }),
      pool_name: "router",
      model: "stub",
      key_index: 0,
      fingerprint: "stub",
      grounding_used: false
    };
  }
});

const ok = stage0Validation.ok && promptStackStatus.ok && Boolean(messages.systemInstruction) && Boolean(messages.userMessage) && result.ok && !realGeminiCalled;
console.log(JSON.stringify({
  ok,
  stage0_ok: stage0Validation.ok,
  prompt_stack_ok: promptStackStatus.ok,
  messages_built: Boolean(messages.systemInstruction && messages.userMessage),
  real_gemini_called: realGeminiCalled,
  result: {
    ok: result.ok,
    status: result.status,
    pool_used: result.pool_used,
    next_node: result.next_node,
    p1_summary: result.p1_summary
  }
}, null, 2));

if (!ok) process.exit(1);

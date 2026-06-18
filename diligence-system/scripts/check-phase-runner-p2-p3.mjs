import {
  buildHybridExtractionManifest,
  validateHybridExtractionManifest
} from "../stage0-adapter.js";
import { validatePromptStack } from "../prompt-stack-loader.js";
import { runP2TargetProfile, runP3TargetFeatureProfile } from "../phase-runner.js";
import { validateP2Output } from "../p2-output-validator.js";
import { validateP3Output } from "../p3-output-validator.js";

const runId = "p2_p3_stub_fixture_run";
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

const sourceDiscoveryHandoff = {
  phase_id: "P1_SOURCE_DISCOVERY_EVIDENCE_BOX",
  admission_status: "TEST_STUB_ONLY",
  admitted_sources: [],
  rejected_sources: [],
  quarantined_sources: [],
  candidate_source_count: 1,
  notes: ["Stubbed P1 validator-only output. No model call."]
};

const p2Ev0001Regression = validateP2Output({
  sourceDiscoveryHandoff: {
    ...sourceDiscoveryHandoff,
    admitted_sources: [
      {
        evidence_ref: "ev_0001",
        source_ref: "src_0001",
        source_id: "source_0001"
      }
    ]
  },
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  p2Output: {
    target_profile: {
      phase_id: "P2_TARGET_PROFILE",
      identity: {
        brand_name: "DemoCo",
        legal_name: "N/A"
      },
      jurisdiction: {
        governing_law_country: "N/A"
      },
      pipeline_assumptions: {
        for_legal_cartography: []
      },
      vault_baseline_candidates: {
        compliance: {}
      },
      evidence: {
        field_evidence_refs: [
          {
            field_path: "target_profile.identity.brand_name",
            evidence_refs: ["ev_0001"],
            basis: "Stubbed validator-only reference.",
            confidence: "TEST"
          }
        ]
      },
      limitations: ["Legal details are unknown in this stub."]
    },
    target_profile_forensic_ledger: {
      phase_id: "P2_TARGET_PROFILE",
      ledger_status: "TEST_STUB_ONLY",
      ledger_events: []
    },
    target_profile_trace: {
      phase_id: "P2_TARGET_PROFILE",
      trace_status: "TEST_STUB_ONLY",
      input_objects: ["hybrid_extraction_manifest", "source_discovery_handoff"]
    }
  }
});

const p2LegalCartographyForbiddenRegression = validateP2Output({
  sourceDiscoveryHandoff,
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  p2Output: {
    target_profile: {
      phase_id: "P2_TARGET_PROFILE",
      company_name: "DemoCo",
      limitations: ["Stubbed validator-only output."]
    },
    target_profile_forensic_ledger: {
      phase_id: "P2_TARGET_PROFILE",
      ledger_status: "TEST_STUB_ONLY",
      ledger_events: []
    },
    target_profile_trace: {
      phase_id: "P2_TARGET_PROFILE",
      trace_status: "TEST_STUB_ONLY"
    },
    legal_cartography_index: {}
  }
});

const p3Ev0001SourceDiscoveryHandoff = {
  ...sourceDiscoveryHandoff,
  admitted_sources: [
    {
      evidence_ref: "ev_0001",
      source_ref: "src_0001",
      source_id: "source_0001"
    }
  ]
};
const p3Ev0001TargetProfile = {
  phase_id: "P2_TARGET_PROFILE",
  target_name: "DemoCo",
  evidence: {
    field_evidence_refs: [
      {
        field_path: "target_profile.identity.brand_name",
        evidence_refs: ["ev_0001"]
      }
    ]
  },
  limitations: ["Stubbed validator-only target profile."]
};
const p3AllowedRegistryRoutingOutput = {
  target_feature_profile: {
    phase_id: "P3_TARGET_FEATURE_PROFILE",
    feature_inventory: [
      {
        feature_id: "feat_stub_001",
        product_wrapper: "AI document assistant",
        feature_name: "Document summarization",
        function_behavior: "Summarizes uploaded documents for users.",
        primary_evidence_refs: ["ev_0001"],
        evidence: {
          field_evidence_refs: [
            {
              field_path: "target_feature_profile.feature_inventory[0].feature_name",
              evidence_refs: ["ev_0001"]
            }
          ]
        }
      }
    ],
    archetype_provenance: {
      candidate_archetypes: [
        {
          archetype_code: "CONTENT_GENERATION_OR_SUMMARIZATION",
          evidence_refs: ["ev_0001"]
        }
      ]
    },
    surface_provenance: {
      candidate_surfaces: [
        {
          surface_code: "USER_UPLOADED_DOCUMENT",
          evidence_refs: ["ev_0001"]
        }
      ]
    },
    registry_key_detection_test: {
      linked_archetype_codes: ["CONTENT_GENERATION_OR_SUMMARIZATION"],
      archetype_codes_supported: true
    },
    downstream_use_limit: "This does not determine registry row truth.",
    evidence_boundary_statement: "Phase 3 does not determine registry row truth.",
    forbidden_scope_checks: {
      registry_evaluation: "PASS"
    }
  },
  feature_profile_forensic_ledger: {
    phase_id: "P3_TARGET_FEATURE_PROFILE",
    ledger_status: "TEST_STUB_ONLY",
    primary_evidence_refs: ["ev_0001"],
    ledger_events: []
  },
  feature_function_trace: {
    phase_id: "P3_TARGET_FEATURE_PROFILE",
    trace_status: "TEST_STUB_ONLY",
    primary_evidence_refs: ["ev_0001"],
    input_objects: ["target_profile", "source_discovery_handoff"]
  }
};
const p3Ev0001AllowedRegistryRoutingRegression = validateP3Output({
  sourceDiscoveryHandoff: p3Ev0001SourceDiscoveryHandoff,
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  targetProfile: p3Ev0001TargetProfile,
  targetProfileForensicLedger: {
    phase_id: "P2_TARGET_PROFILE",
    ledger_status: "TEST_STUB_ONLY",
    ledger_events: [
      {
        event_id: "ledger_event_001",
        evidence_ref: "ev_0001"
      }
    ]
  },
  targetProfileTrace: {
    phase_id: "P2_TARGET_PROFILE",
    trace_status: "TEST_STUB_ONLY",
    primary_evidence_refs: ["ev_0001"]
  },
  p3Output: p3AllowedRegistryRoutingOutput
});
const p3RegistryLedgerForbiddenRegression = validateP3Output({
  sourceDiscoveryHandoff: p3Ev0001SourceDiscoveryHandoff,
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  targetProfile: p3Ev0001TargetProfile,
  p3Output: {
    ...p3AllowedRegistryRoutingOutput,
    registry_ledger: {}
  }
});
const p3RegistryRowStatusForbiddenRegression = validateP3Output({
  sourceDiscoveryHandoff: p3Ev0001SourceDiscoveryHandoff,
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  targetProfile: p3Ev0001TargetProfile,
  p3Output: {
    ...p3AllowedRegistryRoutingOutput,
    target_feature_profile: {
      ...p3AllowedRegistryRoutingOutput.target_feature_profile,
      registry_row_status: "APPLICABLE"
    }
  }
});

const sourceDiscoveryForensicLedger = {
  phase_id: "P1_SOURCE_DISCOVERY_EVIDENCE_BOX",
  ledger_status: "TEST_STUB_ONLY",
  ledger_events: []
};
const sourceDiscoveryTrace = {
  phase_id: "P1_SOURCE_DISCOVERY_EVIDENCE_BOX",
  trace_status: "TEST_STUB_ONLY",
  input_object: "hybrid_extraction_manifest"
};

let realGeminiCalled = false;
let p3CallCount = 0;

const p2Result = await runP2TargetProfile({
  runId,
  targetUrl: "N/A",
  companyName: "DemoCo",
  sourceMode: "synthetic_demo",
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  sourceDiscoveryHandoff,
  sourceDiscoveryForensicLedger,
  sourceDiscoveryTrace,
  promptStackStatus,
  callModel: async () => ({
    text: JSON.stringify({
      target_profile: {
        phase_id: "P2_TARGET_PROFILE",
        target_name: "DemoCo",
        company_name: "DemoCo",
        public_positioning: "Synthetic demo company for validator-only test.",
        product_families: [
          {
            name: "AI document assistant",
            evidence_refs: []
          }
        ],
        limitations: ["Stubbed validator-only output. No model call."]
      },
      target_profile_forensic_ledger: {
        phase_id: "P2_TARGET_PROFILE",
        ledger_status: "TEST_STUB_ONLY",
        ledger_events: []
      },
      target_profile_trace: {
        phase_id: "P2_TARGET_PROFILE",
        trace_status: "TEST_STUB_ONLY",
        input_objects: ["hybrid_extraction_manifest", "source_discovery_handoff"]
      }
    }),
    pool_name: "profile",
    model: "stub",
    key_index: 0,
    fingerprint: "stub",
    grounding_used: false
  })
});

const p3Result = p2Result.ok ? await runP3TargetFeatureProfile({
  runId,
  targetUrl: "N/A",
  companyName: "DemoCo",
  sourceMode: "synthetic_demo",
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  sourceDiscoveryHandoff,
  sourceDiscoveryForensicLedger,
  sourceDiscoveryTrace,
  targetProfile: p2Result.target_profile,
  targetProfileForensicLedger: p2Result.target_profile_forensic_ledger,
  targetProfileTrace: p2Result.target_profile_trace,
  promptStackStatus,
  callModel: async () => {
    p3CallCount += 1;
    return {
      text: JSON.stringify({
        target_feature_profile: {
          phase_id: "P3_TARGET_FEATURE_PROFILE",
          feature_inventory: [
            {
              feature_id: "feat_stub_001",
              product_wrapper: "AI document assistant",
              feature_name: "Document summarization",
              function_behavior: "Summarizes uploaded documents for users.",
              archetypes: ["CONTENT_GENERATION_OR_SUMMARIZATION"],
              surfaces: ["USER_UPLOADED_DOCUMENT"]
            }
          ],
          limitations: ["Stubbed validator-only output. No model call."]
        },
        feature_profile_forensic_ledger: {
          phase_id: "P3_TARGET_FEATURE_PROFILE",
          ledger_status: "TEST_STUB_ONLY",
          ledger_events: []
        },
        feature_function_trace: {
          phase_id: "P3_TARGET_FEATURE_PROFILE",
          trace_status: "TEST_STUB_ONLY",
          input_objects: ["target_profile", "source_discovery_handoff"]
        }
      }),
      pool_name: "profile",
      model: "stub",
      key_index: 0,
      fingerprint: "stub",
      grounding_used: false
    };
  }
}) : null;

let blockedP3CallCount = 0;
const failedP2 = await runP2TargetProfile({
  runId: `${runId}_fail`,
  targetUrl: "N/A",
  companyName: "DemoCo",
  sourceMode: "synthetic_demo",
  hybridExtractionManifest: manifest.hybrid_extraction_manifest,
  sourceDiscoveryHandoff,
  sourceDiscoveryForensicLedger,
  sourceDiscoveryTrace,
  promptStackStatus,
  callModel: async () => ({
    text: JSON.stringify({ target_profile: { company_name: "DemoCo" } }),
    pool_name: "profile",
    model: "stub",
    key_index: 0,
    fingerprint: "stub",
    grounding_used: false
  })
});
if (failedP2.ok) {
  blockedP3CallCount += 1;
}

const ok = stage0Validation.ok
  && promptStackStatus.ok
  && p2Result.ok
  && p3Result?.ok
  && p3CallCount === 1
  && !failedP2.ok
  && p2Ev0001Regression.ok
  && !p2LegalCartographyForbiddenRegression.ok
  && p3Ev0001AllowedRegistryRoutingRegression.ok
  && p3Ev0001AllowedRegistryRoutingRegression.warnings.includes("P3_REGISTRY_ROUTING_SIGNAL_PRESENT_NOT_ROW_EVALUATION")
  && !p3RegistryLedgerForbiddenRegression.ok
  && !p3RegistryRowStatusForbiddenRegression.ok
  && blockedP3CallCount === 0
  && !realGeminiCalled;

console.log(JSON.stringify({
  ok,
  stage0_ok: stage0Validation.ok,
  prompt_stack_ok: promptStackStatus.ok,
  real_gemini_called: realGeminiCalled,
  p2: {
    ok: p2Result.ok,
    status: p2Result.status,
    pool_used: p2Result.pool_used,
    next_node: p2Result.next_node,
    summary: p2Result.p2_summary
  },
  p3: {
    ok: p3Result?.ok || false,
    status: p3Result?.status || "NOT_RUN",
    pool_used: p3Result?.pool_used || null,
    next_node: p3Result?.next_node || null,
    summary: p3Result?.p3_summary || null
  },
  p3_not_run_after_failed_p2: blockedP3CallCount === 0 && !failedP2.ok,
  failed_p2_status: failedP2.status,
  p2_ev_0001_regression: {
    ok: p2Ev0001Regression.ok,
    errors: p2Ev0001Regression.errors,
    warnings: p2Ev0001Regression.warnings,
    evidence_ref_check: p2Ev0001Regression.summary.evidence_ref_check
  },
  p2_legal_cartography_index_forbidden_regression: {
    ok: p2LegalCartographyForbiddenRegression.ok,
    errors: p2LegalCartographyForbiddenRegression.errors,
    warnings: p2LegalCartographyForbiddenRegression.warnings
  },
  p3_ev_0001_allowed_registry_routing_regression: {
    ok: p3Ev0001AllowedRegistryRoutingRegression.ok,
    errors: p3Ev0001AllowedRegistryRoutingRegression.errors,
    warnings: p3Ev0001AllowedRegistryRoutingRegression.warnings,
    evidence_ref_check: p3Ev0001AllowedRegistryRoutingRegression.summary.evidence_ref_check
  },
  p3_registry_ledger_forbidden_regression: {
    ok: p3RegistryLedgerForbiddenRegression.ok,
    errors: p3RegistryLedgerForbiddenRegression.errors,
    warnings: p3RegistryLedgerForbiddenRegression.warnings
  },
  p3_registry_row_status_forbidden_regression: {
    ok: p3RegistryRowStatusForbiddenRegression.ok,
    errors: p3RegistryRowStatusForbiddenRegression.errors,
    warnings: p3RegistryRowStatusForbiddenRegression.warnings
  }
}, null, 2));

if (!ok) process.exit(1);

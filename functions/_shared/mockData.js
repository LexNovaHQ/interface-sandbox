import { getRuntimeConfig } from "./config.js";

export function getHealthPayload(env = {}) {
  return {
    ok: true,
    ...getRuntimeConfig(env)
  };
}

export const mockSourceBundle = {
  run_id: "demo_source_001",
  source_mode: "url",
  submitted_by_user: "",
  sources_read: [
    {
      source_id: "src_001",
      type: "webpage",
      title: "Sarvam AI public website placeholder",
      url: "https://www.sarvam.ai",
      text: "Mock public source text. No live page fetch has occurred.",
      retrieved_at: "2026-06-04T00:00:00.000Z"
    }
  ],
  source_summary: {
    pages_attempted: 1,
    pages_read: 1,
    total_chars: 58,
    limitations: ["Skeleton mock only", "No scraping or live retrieval"]
  }
};

export const mockDiligenceReport = {
  run_id: "demo_diligence_001",
  source_bundle: mockSourceBundle,
  company_profile: {
    company_name: "Sarvam AI",
    website: "https://www.sarvam.ai",
    profile_status: "mock_placeholder"
  },
  product_profile: {
    product_name: "Public AI product example",
    product_category: "AI platform",
    profile_status: "mock_placeholder"
  },
  classification: {
    risk_tier: "pending_real_classification",
    method: "mock_only",
    confidence: 0
  },
  triggered_findings: [
    {
      finding_id: "finding_mock_001",
      title: "Public claims review route",
      status: "placeholder"
    }
  ],
  document_route_summary: [
    {
      route_id: "route_mock_001",
      title: "Review-ready AI product terms route",
      status: "placeholder"
    }
  ],
  assembly_ready: true
};

export const mockVaultAnswers = {
  product_identity: {
    company_legal_name: "",
    product_name: "",
    market: "B2B",
    jurisdictions: [],
    users: []
  },
  ai_architecture: {
    architecture: "unknown",
    model_provider: "",
    uses_vector_db: false,
    uses_agentic_actions: false,
    human_review: false
  },
  data_output: {
    uses_personal_data: false,
    uses_sensitive_data: false,
    stores_prompts: false,
    customer_uploads: false,
    output_relied_on: false,
    output_ownership_position: ""
  },
  commercial_controls: {
    enterprise_customers: false,
    sla_needed: false,
    indemnity_concern: false,
    aup_needed: true,
    liability_cap_preference: ""
  }
};

export const mockAssemblyOutput = {
  run_id: "demo_assembly_001",
  product_profile: mockDiligenceReport.product_profile,
  active_document_stack: [
    "Terms route placeholder",
    "Data processing route placeholder",
    "Acceptable use route placeholder"
  ],
  clause_routes: [
    {
      route_id: "clause_route_mock_001",
      label: "AI use disclosures route",
      status: "pending_clause_source"
    }
  ],
  schedule_routes: [
    {
      route_id: "schedule_route_mock_001",
      label: "Technical controls schedule route",
      status: "pending_schedule_source"
    }
  ],
  variable_map: {
    company_name: "Sarvam AI",
    product_name: "Public AI product example"
  },
  draft_preview: {
    format: "html",
    documents: [
      {
        document_id: "draft_shell_001",
        title: "Review-Ready Draft Route Shell",
        body: "Clause source pending. This preview is a structural placeholder only."
      }
    ]
  },
  review_notes: [
    "Skeleton route only.",
    "No final clauses or legal document generation."
  ],
  crm_delivery: {
    status: "ready_to_push"
  }
};

export const mockDeliveryState = {
  matter_id: "matter_demo_001",
  company_name: "Sarvam AI",
  diligence_report_status: "mock_report_ready",
  vault_status: "placeholder_answers_ready",
  draft_bundle_status: "generated",
  crm_status: "pushed_to_dummy_crm",
  counsel_review_required: true,
  client_delivery_status: "ready_for_review",
  documents: [
    {
      id: "doc_demo_001",
      title: "Draft Route Shell",
      status: "review_required"
    },
    {
      id: "doc_demo_002",
      title: "Diligence Report Shell",
      status: "mock_ready"
    }
  ],
  activity_log: [
    {
      timestamp: "2026-06-04T00:00:00.000Z",
      message: "Synthetic matter created."
    },
    {
      timestamp: "2026-06-04T00:01:00.000Z",
      message: "Mock draft bundle marked ready for counsel review."
    }
  ]
};

export const mockMaintenanceRun = {
  new_threat: {
    threat_id: "threat_demo_001",
    title: "Sample AI transparency update",
    severity: "medium",
    summary: "Synthetic new threat card for maintenance workflow testing."
  },
  coverage: {
    covered: ["Basic AI use disclosure route"],
    upcoming: ["Transparency schedule review"],
    exposed: ["Model change notification route"]
  },
  recommended_update_route: [
    "Open maintenance review",
    "Refresh route mapping",
    "Prepare counsel review note"
  ],
  notification_status: "Synthetic client/admin notifications queued."
};

export function getMockPayload(endpoint) {
  const clean = endpoint.replace(/^\/api\//, "");

  const payloads = {
    "diligence-url": mockDiligenceReport,
    "diligence-text": {
      ...mockDiligenceReport,
      run_id: "demo_diligence_text_001",
      source_bundle: {
        ...mockSourceBundle,
        run_id: "demo_source_text_001",
        source_mode: "text",
        sources_read: [
          {
            ...mockSourceBundle.sources_read[0],
            source_id: "src_text_001",
            type: "pasted_text",
            title: "Pasted public text placeholder",
            url: ""
          }
        ]
      }
    },
    assembly: mockAssemblyOutput,
    delivery: mockDeliveryState,
    maintenance: mockMaintenanceRun
  };

  return payloads[clean] || {};
}

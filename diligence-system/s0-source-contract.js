// s0-source-contract.js
// Canonical machine-readable S0 contract.
// Do not treat the Markdown contract as machine canon after this file is complete.

export const S0_SOURCE_CONTRACT_VERSION =
  "s0_source_extraction_contract_v3_universal_locked";

export const S0_RUNTIME_PARENT =
  "The Interface Diligence Engine";

export const S0_NODE_ID = "S0";

export const S0_SOURCE_MODES = Object.freeze([
  "url",
  "text",
  "url_plus_text",
  "synthetic_demo"
]);

export const S0_DOWNSTREAM_MODES = Object.freeze([
  "MONOLITH_RUNTIME",
  "PHASE_STACK_RUNTIME"
]);

export const S0_CANONICAL_OUTPUT_ROOTS = Object.freeze([
  "hybrid_extraction_manifest",
  "extraction_forensic_ledger"
]);

export const S0_CONTRACT_META = deepFreeze({
  contract_name: "S0 Source Extraction Contract",
  contract_version: S0_SOURCE_CONTRACT_VERSION,
  runtime_parent: S0_RUNTIME_PARENT,
  node_id: S0_NODE_ID,
  downstream_modes: S0_DOWNSTREAM_MODES,
  canonical_outputs: S0_CANONICAL_OUTPUT_ROOTS,
  operating_summary:
    "S0 is a bounded public-source selector. It collects, classifies, fetches, dedupes, preserves full lossless source content, records limitations, and emits a universal handoff. S0 does not profile, extract features, infer data provenance, assess legal stack, evaluate registry rows, compile findings, or generate reports."
});

export const S0_ROLE_BOUNDARY = deepFreeze({
  section_id: "C1",
  title: "Role Boundary",
  upstream: ["Runtime Kernel"],

  may: [
    "collect",
    "classify",
    "fetch",
    "dedupe",
    "preserve full lossless content",
    "verify source uniqueness",
    "record failures",
    "package handoff"
  ],

  must_not: [
    "summarize accepted evidence",
    "use prior model memory",
    "use third-party summaries",
    "process private/confidential materials",
    "profile target",
    "feature-extract",
    "infer data provenance",
    "assess legal stack",
    "evaluate registry",
    "write findings",
    "produce HTML",
    "make legal/compliance conclusions"
  ],

  allowed_language: [
    "not visible in reviewed public footprint",
    "not publicly verifiable",
    "no public artifact found",
    "requires qualified review"
  ],

  forbidden_language: [
    "illegal",
    "non-compliant",
    "liable",
    "unenforceable",
    "confirmed violation"
  ],

  forbidden_language_exception:
    "Forbidden language may appear only when quoted verbatim from an accepted public source."
});

export const S0_EVIDENCE_FIREWALL = deepFreeze({
  section_id: "C2",
  title: "Evidence Firewall",
  upstream: ["C1"],

  admissible_source_classes: [
    "target domain",
    "company-controlled subdomain",
    "qualifying hosted governance artifact",
    "pasted public first-party material",
    "synthetic demo fixture in synthetic_demo mode"
  ],

  qualifying_hosted_governance_requirements: [
    "linked from target footprint or clearly company-controlled",
    "company-specific text",
    "recognized governance/document class"
  ],

  search_snippet_rule: {
    status: "candidate_leads_only",
    cannot_enter: "lossless_text_artifacts[]"
  },

  kill_list: [
    "Crunchbase",
    "PitchBook",
    "TechCrunch",
    "press summaries",
    "investor blurbs",
    "review sites",
    "directories",
    "forums",
    "social commentary",
    "prior model knowledge"
  ]
});

export const S0_RUNTIME_IGNITION = deepFreeze({
  section_id: "C3",
  title: "Runtime Ignition",
  upstream: ["C1", "C2"],

  source_modes: S0_SOURCE_MODES,

  downstream_modes: S0_DOWNSTREAM_MODES,

  rules: [
    "same handoff supports both modes",
    "no monolith-only root",
    "no phase-stack-only root",
    "root outputs stay canonical"
  ]
});

export const S0_LLM_FAILURE_CONTROLS = deepFreeze({
  section_id: "C4",
  title: "LLM Failure Controls",
  upstream: ["C1", "C2", "C3"],

  failure_modes_countered: [
    {
      id: 1,
      name: "hallucination / prior-knowledge contamination"
    },
    {
      id: 2,
      name: "front-loaded instruction bias"
    },
    {
      id: 3,
      name: "recency / terminal overwrite bias"
    },
    {
      id: 4,
      name: "middle-out / lost-in-the-middle failure"
    },
    {
      id: 5,
      name: "instruction dilution"
    },
    {
      id: 6,
      name: "role drift / premature synthesis"
    },
    {
      id: 7,
      name: "schema drift / nomenclature mutation"
    },
    {
      id: 8,
      name: "classification bias"
    },
    {
      id: 9,
      name: "quota satisfaction bias"
    },
    {
      id: 10,
      name: "evidence dilution / repetition amplification"
    },
    {
      id: 11,
      name: "false blocking / brittle validation"
    }
  ],

  required_controls: [
    "four-layer structure",
    "upstream references per step",
    "closed taxonomy",
    "known path bank",
    "full lossless accepted content",
    "deterministic dedupe first",
    "model review only for ambiguity/satisfaction",
    "nonblocking repair max 2 attempts",
    "canonical nomenclature only"
  ]
});



export const S0_SOURCE_FAMILY_ORDER = Object.freeze([
  "TARGET_FAMILY",
  "PRODUCT_FAMILY",
  "LEGAL_FAMILY",
  "DATA_FAMILY"
]);

export const S0_FAMILY_CAPS = deepFreeze({
  TARGET_FAMILY: {
    hard_max: 5,
    normal_stop: 3
  },
  PRODUCT_FAMILY: {
    hard_max: 10
  },
  LEGAL_FAMILY: {
    hard_max: 10
  },
  DATA_FAMILY: {
    hard_max: 5
  }
});

export const S0_TOTAL_ACCEPTED_LOSSLESS_SOURCES_HARD_MAX = 30;

export const S0_SOURCE_TAXONOMY = deepFreeze({
  TARGET_FAMILY: [
    "T0_ROOT",
    "T1_IDENTITY",
    "T2_LEGAL_IDENTITY",
    "T3_OPERATOR_ENTITY",
    "T4_SUPPORTING_IDENTITY"
  ],

  PRODUCT_FAMILY: [
    "P0_PRODUCT_ROOT",
    "P1_PRODUCT_SLUG",
    "P2_PLATFORM_FEATURE_SOLUTION",
    "P3_AI_CAPABILITY_TECHNICAL",
    "P4_USE_CASE_INDUSTRY",
    "P5_ENTERPRISE_PRICING"
  ],

  LEGAL_FAMILY: [
    "L1_CORE_TERMS_PRIVACY",
    "L2_B2B_CONTRACTING",
    "L3_AI_USAGE_GOVERNANCE",
    "L4_PRIVACY_ADJACENT_NOTICES",
    "L5_LEGAL_HUB_HOSTED",
    "L6_ENTITY_NOTICE"
  ],

  DATA_FAMILY: [
    "D1_SECURITY_TRUST",
    "D2_SUBPROCESSOR_PRIVACY_CENTER",
    "D3_DATA_GOVERNANCE_CONTROLS",
    "D4_DOCS_API_DATA_FLOW",
    "D5_AI_SAFETY_TRANSPARENCY"
  ]
});

export const S0_SUBFAMILY_CAPS = deepFreeze({
  T0_ROOT: {
    cap: 1,
    role: "required"
  },
  T1_IDENTITY: {
    cap: 1,
    role: "primary"
  },
  T2_LEGAL_IDENTITY: {
    cap: 1,
    role: "primary"
  },
  T3_OPERATOR_ENTITY: {
    cap: 1,
    role: "fallback"
  },
  T4_SUPPORTING_IDENTITY: {
    cap: 1,
    role: "fallback"
  },

  P0_PRODUCT_ROOT: {
    cap: 1,
    role: "primary"
  },
  P1_PRODUCT_SLUG: {
    cap: 5,
    role: "primary_discovered_only"
  },
  P2_PLATFORM_FEATURE_SOLUTION: {
    cap: 2,
    role: "primary"
  },
  P3_AI_CAPABILITY_TECHNICAL: {
    cap: 2,
    role: "primary"
  },
  P4_USE_CASE_INDUSTRY: {
    cap: 1,
    role: "fallback_replacement"
  },
  P5_ENTERPRISE_PRICING: {
    cap: 1,
    role: "fallback_replacement"
  },

  L1_CORE_TERMS_PRIVACY: {
    cap: 2,
    role: "required"
  },
  L2_B2B_CONTRACTING: {
    cap: 3,
    role: "primary"
  },
  L3_AI_USAGE_GOVERNANCE: {
    cap: 2,
    role: "primary"
  },
  L4_PRIVACY_ADJACENT_NOTICES: {
    cap: 1,
    role: "supporting"
  },
  L5_LEGAL_HUB_HOSTED: {
    cap: 1,
    role: "route_map_or_hosted_governance"
  },
  L6_ENTITY_NOTICE: {
    cap: 1,
    role: "supporting"
  },

  D1_SECURITY_TRUST: {
    cap: 1,
    role: "primary"
  },
  D2_SUBPROCESSOR_PRIVACY_CENTER: {
    cap: 1,
    role: "primary"
  },
  D3_DATA_GOVERNANCE_CONTROLS: {
    cap: 1,
    role: "primary"
  },
  D4_DOCS_API_DATA_FLOW: {
    cap: 1,
    role: "gated"
  },
  D5_AI_SAFETY_TRANSPARENCY: {
    cap: 1,
    role: "supporting"
  }
});

export const S0_SUBFAMILY_HARD_CAPS = deepFreeze(
  Object.fromEntries(
    Object.entries(S0_SUBFAMILY_CAPS).map(([subfamily, config]) => [
      subfamily,
      config.cap
    ])
  )
);

export const S0_KNOWN_PATH_BANK = deepFreeze({
  TARGET_FAMILY: {
    T0_ROOT: [
      "/"
    ],

    T1_IDENTITY: [
      "/about",
      "/about-us",
      "/company",
      "/our-company",
      "/who-we-are"
    ],

    T2_LEGAL_IDENTITY: [
      "/legal",
      "/legal-notice",
      "/imprint",
      "/contact",
      "/contact-us"
    ],

    T3_OPERATOR_ENTITY: [
      "/privacy",
      "/terms",
      "/dpa",
      "/legal"
    ],

    T4_SUPPORTING_IDENTITY: [
      "/team",
      "/careers",
      "/newsroom",
      "/press"
    ]
  },

  PRODUCT_FAMILY: {
    P0_PRODUCT_ROOT: [
      "/product",
      "/products",
      "/platform"
    ],

    P1_PRODUCT_SLUG: [
      "/product/{slug}",
      "/products/{slug}",
      "/#/product/{slug}",
      "/#/products/{slug}"
    ],

    P2_PLATFORM_FEATURE_SOLUTION: [
      "/platform",
      "/platform/{slug}",
      "/features",
      "/features/{slug}",
      "/solutions",
      "/solutions/{slug}",
      "/#/platform/{slug}",
      "/#/features/{slug}",
      "/#/solutions/{slug}"
    ],

    P3_AI_CAPABILITY_TECHNICAL: [
      "/models",
      "/models/{slug}",
      "/agents",
      "/agents/{slug}",
      "/assistant",
      "/assistants",
      "/studio",
      "/api",
      "/apis",
      "/developer",
      "/developers",
      "/docs",
      "/integrations",
      "/connectors",
      "/actions",
      "/workflows",
      "/automation",
      "/search",
      "/knowledge",
      "/vault"
    ],

    P4_USE_CASE_INDUSTRY: [
      "/use-cases",
      "/use-case/{slug}",
      "/industries",
      "/industry/{slug}",
      "/customers"
    ],

    P5_ENTERPRISE_PRICING: [
      "/pricing",
      "/enterprise",
      "/contact-sales",
      "/plans"
    ]
  },

  LEGAL_FAMILY: {
    L1_CORE_TERMS_PRIVACY: [
      "/terms",
      "/terms-of-use",
      "/terms-of-service",
      "/terms-and-conditions",
      "/legal/terms",
      "/policies/terms-of-use",
      "/privacy",
      "/privacy-policy",
      "/legal/privacy",
      "/policies/privacy-policy",
      "/eula"
    ],

    L2_B2B_CONTRACTING: [
      "/dpa",
      "/data-processing-agreement",
      "/legal/dpa",
      "/legal/data-processing-agreement",
      "/policies/data-processing-addendum",
      "/aup",
      "/acceptable-use",
      "/acceptable-use-policy",
      "/legal/acceptable-use-policy",
      "/sla",
      "/service-level-agreement",
      "/service-credit-terms",
      "/platform-agreement",
      "/customer-agreement"
    ],

    L3_AI_USAGE_GOVERNANCE: [
      "/usage-policy",
      "/acceptable-use-policy",
      "/content-policy",
      "/ai-policy",
      "/responsible-ai",
      "/model-policy",
      "/safety-policy"
    ],

    L4_PRIVACY_ADJACENT_NOTICES: [
      "/cookie-policy",
      "/cookies",
      "/privacy-center",
      "/do-not-sell",
      "/data-privacy-framework",
      "/gdpr",
      "/ccpa"
    ],

    L5_LEGAL_HUB_HOSTED: [
      "/legal",
      "/legal-center",
      "/legal-hub",
      "/policies",
      "/terms-and-policies",
      "/trust",
      "/trust-center"
    ],

    L6_ENTITY_NOTICE: [
      "/legal-notice",
      "/imprint",
      "/contact",
      "/controller"
    ]
  },

  DATA_FAMILY: {
    D1_SECURITY_TRUST: [
      "/security",
      "/security-center",
      "/data-security",
      "/trust",
      "/trust-center",
      "/compliance",
      "/compliance-center",
      "/soc-2",
      "/iso-27001"
    ],

    D2_SUBPROCESSOR_PRIVACY_CENTER: [
      "/subprocessors",
      "/subprocessor",
      "/privacy-center",
      "/data-protection",
      "/gdpr",
      "/dpa",
      "/data-processing-agreement"
    ],

    D3_DATA_GOVERNANCE_CONTROLS: [
      "/enterprise-privacy",
      "/customer-data",
      "/data-processing",
      "/data-residency",
      "/retention",
      "/deletion",
      "/data-export",
      "/data-deletion"
    ],

    D4_DOCS_API_DATA_FLOW: [
      "/docs",
      "/developer",
      "/developers",
      "/api",
      "/api-reference",
      "/integrations",
      "/connectors",
      "/webhooks",
      "/actions",
      "/authentication",
      "/audit-logs",
      "/permissions"
    ],

    D5_AI_SAFETY_TRANSPARENCY: [
      "/responsible-ai",
      "/ai-policy",
      "/ai-transparency",
      "/transparency",
      "/safety",
      "/model-card",
      "/model-cards",
      "/model-details",
      "/usage-policy"
    ]
  }
});

export const S0_HOSTED_GOVERNANCE_CANDIDATES = Object.freeze([
  "legal.{domain}",
  "trust.{domain}",
  "security.{domain}",
  "compliance.{domain}",
  "privacy.{domain}",
  "iubenda",
  "Termly",
  "Termsfeed",
  "OneTrust",
  "TrustArc",
  "Vanta",
  "Drata",
  "Secureframe",
  "SafeBase",
  "TrustCloud",
  "Whistic",
  "Conveyor",
  "Notion",
  "Webflow",
  "GitHub Pages"
]);

export const S0_DATA_FLOW_SIGNALS = Object.freeze([
  "data",
  "file",
  "upload",
  "storage",
  "retention",
  "delete",
  "export",
  "webhook",
  "connector",
  "integration",
  "auth",
  "permission",
  "audit",
  "log",
  "subprocessor",
  "model",
  "training",
  "customer content"
]);

export const S0_TARGET_COLLECTION_RULES = Object.freeze([
  "always fetch root",
  "after root fetch at most 2 identity/legal-identity pages unless identity unresolved",
  "use T3/T4 only if company_name/legal_entity/HQ/operator remains unresolved",
  "do not spend target quota on blog/customer/generic press/careers unless no stronger identity source exists"
]);

export const S0_PRODUCT_COLLECTION_RULES = Object.freeze([
  "fetch discovered product slugs first",
  "product slugs must come from nav/sitemap/hash/root/search scout",
  "never brute-force {slug}",
  "when discovered product-slug set is exhausted, stop slug discovery",
  "do not fetch weak /features /solutions /use-cases /blog /customers merely to fill quota"
]);

export const S0_LEGAL_COLLECTION_RULES = Object.freeze([
  "resolve ToS Privacy Policy DPA AUP SLA",
  "FOUND / ABSENT_AFTER_TARGETED_PROBE / ACCESS_FAILED / INSUFFICIENT_TEXT are terminal collection states",
  "stop once status is resolved"
]);

export const S0_DATA_COLLECTION_RULES = Object.freeze([
  "security/trust/subprocessor/privacy-center outrank docs",
  "never crawl broad docs trees",
  "docs/API gets one slot unless subfamily review justifies targeted second pass"
]);

export const S0_D4_DOCS_API_DATA_FLOW_GATE = deepFreeze({
  applies_to: "D4_DOCS_API_DATA_FLOW",
  fetch_only_if_any_route_text_contains: S0_DATA_FLOW_SIGNALS,
  route_text_sources: [
    "URL",
    "anchor",
    "title",
    "route_basis"
  ]
});

export const S0_FAMILY_SUBFAMILY_TAXONOMY = deepFreeze({
  section_id: "C5",
  title: "Family/Subfamily Taxonomy",
  upstream: ["C1", "C2", "C3", "C4"],

  family_order: S0_SOURCE_FAMILY_ORDER,
  family_caps: S0_FAMILY_CAPS,
  total_accepted_lossless_sources_hard_max:
    S0_TOTAL_ACCEPTED_LOSSLESS_SOURCES_HARD_MAX,

  subfamilies: S0_SOURCE_TAXONOMY,
  subfamily_caps: S0_SUBFAMILY_CAPS,

  quota_rule:
    "Quota full is not coverage satisfied. Every accepted source must earn its place."
});

export const S0_KNOWN_PATH_BANK_SECTION = deepFreeze({
  section_id: "C6",
  title: "Known Path Bank",
  upstream: ["C5"],

  known_path_bank: S0_KNOWN_PATH_BANK,

  hosted_governance_candidates: S0_HOSTED_GOVERNANCE_CANDIDATES,

  collection_rules_by_family: {
    TARGET_FAMILY: S0_TARGET_COLLECTION_RULES,
    PRODUCT_FAMILY: S0_PRODUCT_COLLECTION_RULES,
    LEGAL_FAMILY: S0_LEGAL_COLLECTION_RULES,
    DATA_FAMILY: S0_DATA_COLLECTION_RULES
  },

  d4_docs_api_data_flow_gate: S0_D4_DOCS_API_DATA_FLOW_GATE
});

export const S0_DETERMINISTIC_AUTHORITY = Object.freeze([
  "canonicalize URL",
  "build navigation_map",
  "extract nav/footer/header/sitemap/robots/hash routes",
  "generate known-path candidates",
  "scope filter",
  "classify obvious paths",
  "apply caps",
  "fetch",
  "extract raw_text/clean_text",
  "dedupe by URL/hash/canonical/redirect",
  "assemble schema",
  "repair schema"
]);

export const S0_MODEL_AUTHORITY = Object.freeze([
  "search scout leads",
  "coverage challenge leads",
  "ambiguous family/subfamily review",
  "near-duplicate review",
  "subfamily satisfaction review"
]);

export const S0_MODEL_PROHIBITIONS = Object.freeze([
  "summarize accepted content",
  "profile target",
  "feature-extract",
  "infer data provenance",
  "legal-stack assess",
  "registry evaluate",
  "write findings",
  "certify absence",
  "invent product slugs",
  "treat snippets as evidence"
]);

export const S0_DETERMINISTIC_MODEL_SPLIT = deepFreeze({
  section_id: "C7",
  title: "Deterministic / Model Split",
  upstream: ["C1", "C2", "C3", "C4", "C5", "C6"],

  deterministic_may: S0_DETERMINISTIC_AUTHORITY,
  model_may: S0_MODEL_AUTHORITY,
  model_must_not: S0_MODEL_PROHIBITIONS
});

export function getS0FamilyCap(sourceFamily) {
  return S0_FAMILY_CAPS[sourceFamily] || null;
}

export function getS0Subfamilies(sourceFamily) {
  return S0_SOURCE_TAXONOMY[sourceFamily] || [];
}

export function getS0SubfamilyCap(sourceSubfamily) {
  return S0_SUBFAMILY_CAPS[sourceSubfamily] || null;
}

export function getS0SubfamilyHardCap(sourceSubfamily) {
  return S0_SUBFAMILY_HARD_CAPS[sourceSubfamily] || 0;
}

export function getS0KnownPaths(sourceFamily, sourceSubfamily) {
  return S0_KNOWN_PATH_BANK?.[sourceFamily]?.[sourceSubfamily] || [];
}

export function isS0KnownFamily(sourceFamily) {
  return S0_SOURCE_FAMILY_ORDER.includes(sourceFamily);
}

export function isS0KnownSubfamily(sourceSubfamily) {
  return Object.prototype.hasOwnProperty.call(
    S0_SUBFAMILY_CAPS,
    sourceSubfamily
  );
}

export function isS0ParameterizedPath(path) {
  return String(path || "").includes("{slug}");
}

export function isS0D4DataFlowSignalText(value) {
  const haystack = String(value || "").toLowerCase();
  return S0_DATA_FLOW_SIGNALS.some((signal) =>
    haystack.includes(signal.toLowerCase())
  );
}

export const S0_EXECUTION_STEP_SHAPE = Object.freeze([
  "purpose",
  "upstream_references",
  "consumes",
  "emits",
  "rules",
  "failure_route"
]);

export const S0_ROUTE_SOURCE_STRENGTH = deepFreeze({
  HEADER: 1,
  FOOTER: 2,
  SITEMAP: 3,
  ROOT: 4,
  HASH_ROUTE: 5,
  KNOWN_PATH_PROBE: 6,
  SEARCH_SCOUT: 7,
  COVERAGE_CHALLENGE: 8,
  PASTED_TEXT: 9,
  SYNTHETIC_DEMO: 10
});

export const S0_DEDUPE_BASIS = Object.freeze([
  "normalized URL",
  "canonical URL",
  "redirect target",
  "tracking-param stripped URL",
  "canonical tag",
  "same hash route",
  "known-path equivalence",
  "raw hash",
  "clean hash",
  "normalized hash",
  "boilerplate-stripped hash",
  "title similarity",
  "first 800-1200 char body similarity",
  "same legal shell"
]);

export const S0_NEAR_DUPLICATE_REVIEW_DECISIONS = Object.freeze([
  "KEEP_UNIQUE",
  "KEEP_CANONICAL",
  "DEFER_NEAR_DUPLICATE",
  "DEFER_REPETITIVE_TEMPLATE",
  "DEFER_LOW_INCREMENTAL_VALUE"
]);

export const S0_SUBFAMILY_SATISFACTION_STATUSES = Object.freeze([
  "SATISFIED",
  "THIN",
  "MISFILLED_SLOT",
  "DUPLICATIVE",
  "UNAVAILABLE_AFTER_SEARCH",
  "NEEDS_COVERAGE_CHALLENGE"
]);

export const S0_SUBFAMILY_SATISFACTION_ACTIONS = Object.freeze([
  "LOCK",
  "RUN_COVERAGE_CHALLENGE",
  "RECLASSIFY",
  "DROP_DUPLICATE",
  "DEFER_EXTRA"
]);

export const S0_COLLECTION_TERMINAL_STATES = Object.freeze([
  "FOUND",
  "ABSENT_AFTER_TARGETED_PROBE",
  "ACCESS_FAILED",
  "INSUFFICIENT_TEXT"
]);

export const S0_LAYER_2_STEP_IDS = Object.freeze([
  "SX.0",
  "SX.1",
  "SX.2",
  "SX.3",
  "SX.4",
  "SX.5",
  "SX.6",
  "SX.7",
  "SX.8",
  "SX.9",
  "SX.10",
  "SX.11",
  "SX.12"
]);

export const S0_SX0_INPUT_VALIDATION_TARGET_CANONICALIZATION = deepFreeze({
  step_id: "SX.0",
  title: "Input Validation + Target Canonicalization",

  purpose:
    "Validate source mode, downstream mode, single-target boundary, public-material boundary, and canonical target identity before any discovery or fetch work begins.",

  upstream_references: [
    "C1",
    "C2",
    "C3"
  ],

  consumes: [
    "user input"
  ],

  emits: [
    "target{}",
    "extraction_call_card{}",
    "ledger event"
  ],

  rules: [
    "one target only",
    "valid source_mode only",
    "canonicalize target_url/root/canonical_domain/allowed_hosts",
    "text mode disables search/fetch",
    "synthetic_demo marked demo-only"
  ],

  failure_route: {
    fatal: [
      "invalid mode",
      "no clear target",
      "prohibited-only material"
    ],
    repairable: [
      {
        condition: "hosted-domain ambiguity",
        route: "model review",
        max_attempts: 2
      }
    ]
  }
});

export const S0_SX1_ROOT_FETCH_NAVIGATION_MAP = deepFreeze({
  step_id: "SX.1",
  title: "Root Fetch + Navigation Map",

  purpose:
    "Fetch the root surface first in URL modes and build the navigation map before search scout or fallback discovery.",

  upstream_references: [
    "C2",
    "C5",
    "C6"
  ],

  consumes: [
    "target{}"
  ],

  emits: [
    "navigation_map{}",
    "route seeds"
  ],

  rules: [
    "root first in URL modes",
    "extract header/footer/root anchors/sitemap/robots/hash routes",
    "classify routes by family",
    "search scout cannot run before navigation attempt"
  ],

  failure_route: {
    repairable: [
      {
        condition: "root fetch failed",
        route: "retry once"
      },
      {
        condition: "root fetch still failed after retry",
        route: "run search scout"
      }
    ],
    warning: [
      {
        condition: "navigation unresolved after retry/search scout",
        route: "record limitation"
      }
    ]
  }
});

export const S0_SX2_CANDIDATE_GENERATION = deepFreeze({
  step_id: "SX.2",
  title: "Candidate Generation",

  purpose:
    "Generate bounded source candidates from navigation first, then known-path bank, then narrowly justified search scout for missing core coverage.",

  upstream_references: [
    "C5",
    "C6",
    "SX.1"
  ],

  consumes: [
    "navigation_map{}",
    "known path bank"
  ],

  emits: [
    "candidate_sources[]"
  ],

  rules: [
    "navigation candidates first",
    "legal/data canonical probes allowed even if not visible",
    "product slug brute-force forbidden",
    "search scout only for missing core family/subfamily",
    "every candidate gets route_source + route_basis"
  ],

  failure_route: {
    repairable: [
      {
        condition: "missing core family",
        route: "search scout"
      }
    ],
    reject: [
      {
        condition: "scout-only third-party",
        route: "reject"
      }
    ]
  }
});

export const S0_SX3_FAMILY_SUBFAMILY_CLASSIFICATION = deepFreeze({
  step_id: "SX.3",
  title: "Family/Subfamily Classification",

  purpose:
    "Classify every candidate into the closed S0 family/subfamily taxonomy before dedupe, queue selection, or fetch.",

  upstream_references: [
    "C5",
    "C6"
  ],

  consumes: [
    "candidate_sources[]"
  ],

  emits: [
    "classified candidate_sources[]"
  ],

  rules: [
    "classify by path + route basis + anchor + title + known bank",
    "legal/data tie: contract/policy = LEGAL; controls/security/subprocessor/retention/transfer/data-flow = DATA",
    "ambiguous cases → model review"
  ],

  failure_route: {
    warning: [
      {
        condition: "unresolved unclassified candidate",
        route: "deferred with limitation"
      }
    ]
  }
});

export const S0_SX4_DETERMINISTIC_CANDIDATE_DEDUPE = deepFreeze({
  step_id: "SX.4",
  title: "Deterministic Candidate Dedupe",

  purpose:
    "Suppress duplicate candidate routes before fetch using deterministic URL, redirect, canonical, tracking, hash-route, and known-path equivalence rules.",

  upstream_references: [
    "C5",
    "C6",
    "C7"
  ],

  consumes: [
    "classified candidates"
  ],

  emits: [
    "dedupe_records[]",
    "candidate status updates"
  ],

  dedupe_by: [
    "normalized URL",
    "canonical URL",
    "redirect target",
    "tracking-param stripped URL",
    "canonical tag",
    "same hash route",
    "known-path equivalence"
  ],

  rules: [
    "deterministic candidate dedupe runs before queue selection",
    "deduped candidates must remain visible through dedupe_records[]",
    "no candidate may be silently dropped"
  ],

  failure_route: {
    repairable: [
      {
        condition: "dedupe conflict",
        route: "keep strongest route_source and log conflict"
      }
    ]
  }
});

export const S0_SX5_FAMILY_SUBFAMILY_QUEUE_SELECTION = deepFreeze({
  step_id: "SX.5",
  title: "Family/Subfamily Queue Selection",

  purpose:
    "Select the bounded fetch queue using family order, subfamily caps, family caps, route strength, product slug rules, and no quota-filling discipline.",

  upstream_references: [
    "C5",
    "C6",
    "SX.3",
    "SX.4"
  ],

  consumes: [
    "deduped candidates"
  ],

  emits: [
    "fetch queue",
    "stop states"
  ],

  route_strength_order: [
    "HEADER",
    "FOOTER",
    "SITEMAP",
    "ROOT",
    "HASH_ROUTE",
    "KNOWN_PATH_PROBE",
    "SEARCH_SCOUT"
  ],

  rules: [
    "family order TARGET→PRODUCT→LEGAL→DATA",
    "subfamily caps before family caps",
    "route strength HEADER/FOOTER > SITEMAP > ROOT > HASH_ROUTE > KNOWN_PATH_PROBE > SEARCH_SCOUT",
    "product quota is max not target",
    "do not fill quotas with weak sources"
  ],

  failure_route: {
    repairable: [
      {
        condition: "no queue for unresolved family",
        route: "search scout/challenge if justified"
      }
    ]
  }
});

export const S0_SX6_FETCH_LADDER_FULL_LOSSLESS_EXTRACTION = deepFreeze({
  step_id: "SX.6",
  title: "Fetch Ladder + Full Lossless Extraction",

  purpose:
    "Fetch selected public candidates, stop at private/auth/paywall barriers, and preserve raw_text plus clean_text for every accepted source.",

  upstream_references: [
    "C2",
    "C6",
    "C7",
    "SX.5"
  ],

  consumes: [
    "fetch queue"
  ],

  emits: [
    "lossless_text_artifacts[]",
    "artifact_inventory[]",
    "fetch_log"
  ],

  rules: [
    "http/https public only",
    "stop at login/paywall/private/auth wall",
    "extract raw_text + clean_text",
    "accepted source must preserve full lossless content",
    "no summaries",
    "no excerpt-only accepted source",
    "no accepted snippet-only source",
    "record hash/count/quality/lineage"
  ],

  failure_route: {
    repairable: [
      {
        condition: "fetch failed",
        route: "retry once"
      },
      {
        condition: "thin extraction",
        route: "targeted retry"
      }
    ],
    terminal_collection_states: [
      "ACCESS_FAILED",
      "INSUFFICIENT_TEXT"
    ]
  }
});

export const S0_SX7_CONTENT_DEDUPE_ACCEPTED_SOURCE_GATE = deepFreeze({
  step_id: "SX.7",
  title: "Content Dedupe + Accepted-Source Gate",

  purpose:
    "Dedupe fetched artifacts by content and admit only unique, lossless, in-scope sources that add evidentiary value.",

  upstream_references: [
    "C4",
    "C5",
    "C6",
    "C7",
    "SX.6"
  ],

  consumes: [
    "fetched artifacts"
  ],

  emits: [
    "accepted lossless_text_artifacts[]",
    "dedupe_records[]",
    "limitations"
  ],

  accepted_source_must: [
    "be in scope",
    "fit open family/subfamily slot",
    "preserve full lossless content",
    "not duplicate accepted source",
    "add unique evidentiary value",
    "carry lineage/hash/url/family/subfamily/artifact_type"
  ],

  content_dedupe_by: [
    "raw hash",
    "clean hash",
    "normalized hash",
    "boilerplate-stripped hash",
    "title similarity",
    "first 800-1200 char body similarity",
    "same legal shell"
  ],

  rules: [
    "accepted source must earn its place",
    "duplicates are suppressed with dedupe_records[]",
    "unclear duplicate status routes to SX.8",
    "unclear evidentiary value routes to SX.9"
  ],

  failure_route: {
    duplicate: [
      {
        condition: "duplicate accepted source",
        route: "suppress duplicate"
      }
    ],
    repairable: [
      {
        condition: "ambiguous near-duplicate",
        route: "SX.8"
      },
      {
        condition: "unclear value",
        route: "SX.9"
      }
    ]
  }
});

export const S0_SX8_MODEL_NEAR_DUPLICATE_REVIEW = deepFreeze({
  step_id: "SX.8",
  title: "Model Near-Duplicate Review",

  purpose:
    "Use model review only for ambiguous near-duplicate source clusters after deterministic dedupe has already run.",

  upstream_references: [
    "C7",
    "SX.7"
  ],

  consumes: [
    "compact metadata",
    "fingerprints",
    "headings"
  ],

  emits: [
    "model_review_log",
    "dedupe_records[]"
  ],

  decisions: S0_NEAR_DUPLICATE_REVIEW_DECISIONS,

  rules: [
    "model receives compact metadata/fingerprints/headings only",
    "model does not summarize accepted content",
    "model does not profile target",
    "model does not evaluate legal or registry issues",
    "model output only decides duplicate treatment"
  ],

  failure_route: {
    repairable: [
      {
        condition: "ambiguous after first review",
        route: "second targeted review"
      }
    ],
    warning: [
      {
        condition: "ambiguous after 2 attempts",
        route: "keep strongest canonical source and warn"
      }
    ]
  }
});

export const S0_SX9_MODEL_SUBFAMILY_SATISFACTION_REVIEW = deepFreeze({
  step_id: "SX.9",
  title: "Model Subfamily Satisfaction Review",

  purpose:
    "Verify that accepted sources actually satisfy their assigned subfamilies and are not merely quota-filling.",

  upstream_references: [
    "C4",
    "C5",
    "C6",
    "C7",
    "SX.5",
    "SX.6",
    "SX.7",
    "SX.8"
  ],

  consumes: [
    "accepted source metadata",
    "collection_summary",
    "artifact_inventory"
  ],

  emits: [
    "model_review_log",
    "limitations",
    "challenge recommendations"
  ],

  statuses: S0_SUBFAMILY_SATISFACTION_STATUSES,

  allowed_actions: S0_SUBFAMILY_SATISFACTION_ACTIONS,

  rules: [
    "quota full is not coverage satisfied",
    "model verifies satisfaction, thinness, misfill, duplication, unavailability, or challenge need",
    "model may recommend challenge only if caps remain",
    "model may not certify legal absence",
    "model may not write findings"
  ],

  failure_route: {
    repairable: [
      {
        condition: "MISFILLED_SLOT",
        route: "repaired/reclassified/dropped"
      }
    ],
    warning: [
      {
        condition: "THIN",
        route: "limitation-routed"
      }
    ],
    challenge: [
      {
        condition: "NEEDS_COVERAGE_CHALLENGE",
        route: "SX.10 only if quota remains"
      }
    ]
  }
});

export const S0_SX10_COVERAGE_CHALLENGE = deepFreeze({
  step_id: "SX.10",
  title: "Coverage Challenge",

  purpose:
    "Run targeted challenge only for unresolved family/subfamily slots after subfamily satisfaction review.",

  upstream_references: [
    "C5",
    "C6",
    "C7",
    "SX.9"
  ],

  consumes: [
    "unresolved family/subfamily slots"
  ],

  emits: [
    "challenge leads",
    "challenge log"
  ],

  rules: [
    "only unresolved family/subfamily",
    "no all-family reopen",
    "respect remaining caps",
    "no weak P4 unless resolving missing family/subfamily",
    "candidate leads only"
  ],

  failure_route: {
    terminal_warning: [
      {
        condition: "no leads",
        route: "UNAVAILABLE_AFTER_SEARCH"
      }
    ],
    continue: [
      {
        condition: "useful leads",
        route: "SX.11"
      }
    ]
  }
});

export const S0_SX11_TARGETED_SECOND_PASS = deepFreeze({
  step_id: "SX.11",
  title: "Targeted Second Pass",

  purpose:
    "Fetch or repair only challenge-approved failed/unresolved items without rerunning the whole S0 phase.",

  upstream_references: [
    "SX.10"
  ],

  consumes: [
    "challenge-approved candidates"
  ],

  emits: [
    "updated artifacts",
    "dedupe records",
    "limitations"
  ],

  rules: [
    "only failed/unresolved item",
    "no global rerun",
    "max 2 repair attempts per failure",
    "unresolved nonfatal → warning + forensic archive"
  ],

  failure_route: {
    warning: [
      {
        condition: "unresolved after max attempts",
        route: "warning + forensic archive"
      }
    ],
    fatal: [
      {
        condition: "schema cannot be emitted after repair",
        route: "fatal"
      }
    ]
  }
});

export const S0_SX12_MANIFEST_ASSEMBLY = deepFreeze({
  step_id: "SX.12",
  title: "Manifest Assembly",

  purpose:
    "Assemble the universal S0 handoff using only canonical fields and exactly two root objects.",

  upstream_references: [
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
    "C6",
    "C7",
    "SX.0",
    "SX.1",
    "SX.2",
    "SX.3",
    "SX.4",
    "SX.5",
    "SX.6",
    "SX.7",
    "SX.8",
    "SX.9",
    "SX.10",
    "SX.11"
  ],

  consumes: [
    "all S0 records"
  ],

  emits: [
    "hybrid_extraction_manifest",
    "extraction_forensic_ledger"
  ],

  rules: [
    "canonical fields only",
    "exactly two roots",
    "no discussion/retired fields",
    "universal for monolith + phase stack",
    "schema repair max 2",
    "schema impossible = fatal"
  ],

  failure_route: {
    repairable: [
      {
        condition: "schema validation failed",
        route: "schema repair max 2"
      }
    ],
    fatal: [
      {
        condition: "schema impossible",
        route: "fatal"
      }
    ]
  }
});

export const S0_LAYER_2_EXECUTION_STEPS = deepFreeze({
  layer_id: "LAYER_2_EXECUTION_STEPS",
  title: "Layer 2 — Execution Steps",

  required_step_shape: S0_EXECUTION_STEP_SHAPE,

  steps: {
    SX0_INPUT_VALIDATION_TARGET_CANONICALIZATION:
      S0_SX0_INPUT_VALIDATION_TARGET_CANONICALIZATION,

    SX1_ROOT_FETCH_NAVIGATION_MAP:
      S0_SX1_ROOT_FETCH_NAVIGATION_MAP,

    SX2_CANDIDATE_GENERATION:
      S0_SX2_CANDIDATE_GENERATION,

    SX3_FAMILY_SUBFAMILY_CLASSIFICATION:
      S0_SX3_FAMILY_SUBFAMILY_CLASSIFICATION,

    SX4_DETERMINISTIC_CANDIDATE_DEDUPE:
      S0_SX4_DETERMINISTIC_CANDIDATE_DEDUPE,

    SX5_FAMILY_SUBFAMILY_QUEUE_SELECTION:
      S0_SX5_FAMILY_SUBFAMILY_QUEUE_SELECTION,

    SX6_FETCH_LADDER_FULL_LOSSLESS_EXTRACTION:
      S0_SX6_FETCH_LADDER_FULL_LOSSLESS_EXTRACTION,

    SX7_CONTENT_DEDUPE_ACCEPTED_SOURCE_GATE:
      S0_SX7_CONTENT_DEDUPE_ACCEPTED_SOURCE_GATE,

    SX8_MODEL_NEAR_DUPLICATE_REVIEW:
      S0_SX8_MODEL_NEAR_DUPLICATE_REVIEW,

    SX9_MODEL_SUBFAMILY_SATISFACTION_REVIEW:
      S0_SX9_MODEL_SUBFAMILY_SATISFACTION_REVIEW,

    SX10_COVERAGE_CHALLENGE:
      S0_SX10_COVERAGE_CHALLENGE,

    SX11_TARGETED_SECOND_PASS:
      S0_SX11_TARGETED_SECOND_PASS,

    SX12_MANIFEST_ASSEMBLY:
      S0_SX12_MANIFEST_ASSEMBLY
  }
});

export function getS0ExecutionStep(stepId) {
  return Object.values(S0_LAYER_2_EXECUTION_STEPS.steps).find(
    (step) => step.step_id === stepId
  ) || null;
}

export function isS0ExecutionStepId(stepId) {
  return S0_LAYER_2_STEP_IDS.includes(stepId);
}

export function getS0RouteSourceStrength(routeSource) {
  return S0_ROUTE_SOURCE_STRENGTH[routeSource] || 999;
}

export function isS0NearDuplicateDecision(decision) {
  return S0_NEAR_DUPLICATE_REVIEW_DECISIONS.includes(decision);
}

export function isS0SubfamilySatisfactionStatus(status) {
  return S0_SUBFAMILY_SATISFACTION_STATUSES.includes(status);
}

export function isS0SubfamilySatisfactionAction(action) {
  return S0_SUBFAMILY_SATISFACTION_ACTIONS.includes(action);
}

export function isS0CollectionTerminalState(state) {
  return S0_COLLECTION_TERMINAL_STATES.includes(state);
}

export const S0_GATE_IDS = Object.freeze([
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8"
]);

export const S0_FAILURE_SEVERITIES = Object.freeze([
  "REPAIRABLE",
  "WARNING",
  "FATAL"
]);

export const S0_REPAIR_ROUTES = Object.freeze([
  "DETERMINISTIC_REPAIR",
  "MODEL_REVIEW",
  "COVERAGE_CHALLENGE",
  "FETCH_RETRY",
  "SCHEMA_REPAIR"
]);

export const S0_REPAIR_FINAL_STATUSES = Object.freeze([
  "RESOLVED",
  "PASSED_WITH_WARNING",
  "FATAL"
]);

export const S0_MAX_REPAIR_ATTEMPTS = 2;

export const S0_FAILURE_TICKET_SCHEMA = deepFreeze({
  failure_id: "",
  gate_id: "",
  failed_condition: "",
  affected_item_ids: [],
  failure_severity: "REPAIRABLE | WARNING | FATAL",
  repair_route:
    "DETERMINISTIC_REPAIR | MODEL_REVIEW | COVERAGE_CHALLENGE | FETCH_RETRY | SCHEMA_REPAIR",
  attempt_count: 0,
  max_attempts: 2,
  final_status: "RESOLVED | PASSED_WITH_WARNING | FATAL"
});

export const S0_G1_BOUNDARY_GATE = deepFreeze({
  gate_id: "G1",
  title: "Boundary Gate",

  checks: [
    "valid mode",
    "one target",
    "public-only material",
    "no prohibited material admitted"
  ],

  fatal_only_for: [
    "invalid mode",
    "no target",
    "prohibited-only material"
  ],

  failure_ticket_shape: S0_FAILURE_TICKET_SCHEMA,

  repair_route: {
    invalid_mode: "FATAL",
    no_target: "FATAL",
    prohibited_only_material: "FATAL",
    hosted_domain_ambiguity: "MODEL_REVIEW"
  },

  max_attempts: S0_MAX_REPAIR_ATTEMPTS,

  pass_with_warning_rule:
    "Nonfatal ambiguity may pass with warning only after targeted repair/review attempts are exhausted.",

  forensic_archive_rule:
    "Every boundary failure, warning, or fatal stop must be archived in validation_repair_log and terminal_gate_log.",

  fatality_rule:
    "Only invalid mode, no target, or prohibited-only material can make G1 fatal."
});

export const S0_G2_NAVIGATION_GATE = deepFreeze({
  gate_id: "G2",
  title: "Navigation Gate",

  checks: [
    "root attempted or text-mode bypass logged",
    "navigation_map populated or limitation logged",
    "sitemap/robots/hash attempted when available"
  ],

  failure_ticket_shape: S0_FAILURE_TICKET_SCHEMA,

  repair_route: {
    root_fetch_failed: "FETCH_RETRY",
    navigation_map_missing: "DETERMINISTIC_REPAIR",
    sitemap_robots_hash_unattempted_when_available: "DETERMINISTIC_REPAIR"
  },

  max_attempts: S0_MAX_REPAIR_ATTEMPTS,

  pass_with_warning_rule:
    "If navigation cannot be populated after targeted retry/repair, S0 may continue only with a collection limitation.",

  forensic_archive_rule:
    "Navigation failure, retry, bypass, and limitation must be archived in fetch_log, validation_repair_log, and terminal_gate_log.",

  fatality_rule:
    "Navigation failure is not fatal if text mode is valid or other public material remains usable."
});

export const S0_G3_FAMILY_SUBFAMILY_GATE = deepFreeze({
  gate_id: "G3",
  title: "Family/Subfamily Gate",

  checks: [
    "candidate family/subfamily or defer reason present",
    "caps applied",
    "product slug brute-force absent",
    "legal/data probes applied"
  ],

  failure_ticket_shape: S0_FAILURE_TICKET_SCHEMA,

  repair_route: {
    unclassified_candidate: "MODEL_REVIEW",
    cap_misapplied: "DETERMINISTIC_REPAIR",
    product_slug_bruteforce_detected: "DETERMINISTIC_REPAIR",
    legal_data_probe_missing: "COVERAGE_CHALLENGE"
  },

  max_attempts: S0_MAX_REPAIR_ATTEMPTS,

  pass_with_warning_rule:
    "Unresolved candidates may be deferred with limitation if they cannot be classified without violating scope or caps.",

  forensic_archive_rule:
    "All classification deferrals, reclassifications, and probe failures must be archived.",

  fatality_rule:
    "Family/subfamily failure is not fatal unless schema emission becomes impossible."
});

export const S0_G4_FULL_LOSSLESS_GATE = deepFreeze({
  gate_id: "G4",
  title: "Full Lossless Gate",

  checks: [
    "accepted artifact has raw_text + clean_text",
    "not snippet-only",
    "hashes/counts present",
    "preservation status recorded"
  ],

  failure_ticket_shape: S0_FAILURE_TICKET_SCHEMA,

  repair_route: {
    missing_raw_or_clean_text: "FETCH_RETRY",
    snippet_only_accepted: "DETERMINISTIC_REPAIR",
    missing_hash_or_count: "SCHEMA_REPAIR",
    missing_preservation_status: "SCHEMA_REPAIR"
  },

  max_attempts: S0_MAX_REPAIR_ATTEMPTS,

  pass_with_warning_rule:
    "A source that cannot preserve full lossless text must be limitation-routed, not accepted as evidence.",

  forensic_archive_rule:
    "Every lossless preservation failure must be archived with affected candidate/artifact ids.",

  fatality_rule:
    "Fatal only if no usable public material remains or terminal schema cannot be emitted."
});

export const S0_G5_UNIQUE_VALUE_DEDUPE_GATE = deepFreeze({
  gate_id: "G5",
  title: "Unique Value / Dedupe Gate",

  checks: [
    "URL dedupe complete",
    "content dedupe complete",
    "model near-duplicate review where triggered",
    "every accepted source earns its place"
  ],

  failure_ticket_shape: S0_FAILURE_TICKET_SCHEMA,

  repair_route: {
    url_dedupe_missing: "DETERMINISTIC_REPAIR",
    content_dedupe_missing: "DETERMINISTIC_REPAIR",
    near_duplicate_ambiguous: "MODEL_REVIEW",
    source_value_unclear: "MODEL_REVIEW"
  },

  max_attempts: S0_MAX_REPAIR_ATTEMPTS,

  pass_with_warning_rule:
    "If ambiguity remains after two attempts, keep strongest canonical source and archive warning.",

  forensic_archive_rule:
    "All duplicate suppressions and ambiguity outcomes must be recorded in dedupe_records and dedupe_log.",

  fatality_rule:
    "Dedupe failure is not fatal unless accepted evidence cannot be distinguished from duplicates at all."
});

export const S0_G6_SUBFAMILY_SATISFACTION_GATE = deepFreeze({
  gate_id: "G6",
  title: "Subfamily Satisfaction Gate",

  checks: [
    "no quota-only slot filling",
    "model satisfaction review complete",
    "misfilled slots repaired or limitation-routed"
  ],

  failure_ticket_shape: S0_FAILURE_TICKET_SCHEMA,

  repair_route: {
    quota_only_slot_filling: "MODEL_REVIEW",
    satisfaction_review_missing: "MODEL_REVIEW",
    misfilled_slot: "DETERMINISTIC_REPAIR",
    thin_slot: "COVERAGE_CHALLENGE"
  },

  max_attempts: S0_MAX_REPAIR_ATTEMPTS,

  pass_with_warning_rule:
    "Thin, unavailable, or unresolved subfamily coverage may pass only as collection_limitations[].",

  forensic_archive_rule:
    "Satisfaction review and any misfilled-slot repair must be archived in model_review_log and validation_repair_log.",

  fatality_rule:
    "Subfamily satisfaction failure is not fatal unless the terminal schema cannot represent the limitation."
});

export const S0_G7_NONBLOCKING_REPAIR_GATE = deepFreeze({
  gate_id: "G7",
  title: "Nonblocking Repair Gate",

  checks: [
    "repairable failure has ticket",
    "attempt_count <= 2",
    "unresolved nonfatal archived",
    "single failure does not doom S0"
  ],

  failure_ticket_shape: S0_FAILURE_TICKET_SCHEMA,

  repair_route: {
    missing_failure_ticket: "SCHEMA_REPAIR",
    attempt_count_exceeded: "SCHEMA_REPAIR",
    unresolved_nonfatal_unarchived: "SCHEMA_REPAIR",
    phase_kill_from_single_nonfatal: "SCHEMA_REPAIR"
  },

  max_attempts: S0_MAX_REPAIR_ATTEMPTS,

  pass_with_warning_rule:
    "After two targeted repair attempts, unresolved nonfatal failures pass with warning and forensic archive.",

  forensic_archive_rule:
    "All repair attempts and final statuses must appear in validation_repair_log.",

  fatality_rule:
    "Only fatal boundary failures, zero usable public material, or impossible schema may stop S0."
});

export const S0_G8_TERMINAL_SCHEMA_GATE = deepFreeze({
  gate_id: "G8",
  title: "Terminal Schema Gate",

  checks: [
    "exactly two roots",
    "hybrid_extraction_manifest has exactly 10 top-level fields",
    "extraction_forensic_ledger has exactly 8 top-level fields",
    "canonical nomenclature preserved",
    "downstream_handoff present"
  ],

  failure_ticket_shape: S0_FAILURE_TICKET_SCHEMA,

  repair_route: {
    wrong_root_count: "SCHEMA_REPAIR",
    wrong_manifest_field_count: "SCHEMA_REPAIR",
    wrong_ledger_field_count: "SCHEMA_REPAIR",
    nomenclature_drift: "SCHEMA_REPAIR",
    downstream_handoff_missing: "SCHEMA_REPAIR"
  },

  max_attempts: S0_MAX_REPAIR_ATTEMPTS,

  pass_with_warning_rule:
    "Terminal schema problems cannot pass if canonical roots or required top-level fields are missing.",

  forensic_archive_rule:
    "Terminal validation outcome must be archived in terminal_gate_log.",

  fatality_rule:
    "Schema impossible after max repair attempts is fatal."
});

export const S0_LAYER_3_GATES = deepFreeze({
  layer_id: "LAYER_3_GATES",
  title: "Layer 3 — Gates",

  gates: {
    G1_BOUNDARY_GATE: S0_G1_BOUNDARY_GATE,
    G2_NAVIGATION_GATE: S0_G2_NAVIGATION_GATE,
    G3_FAMILY_SUBFAMILY_GATE: S0_G3_FAMILY_SUBFAMILY_GATE,
    G4_FULL_LOSSLESS_GATE: S0_G4_FULL_LOSSLESS_GATE,
    G5_UNIQUE_VALUE_DEDUPE_GATE: S0_G5_UNIQUE_VALUE_DEDUPE_GATE,
    G6_SUBFAMILY_SATISFACTION_GATE: S0_G6_SUBFAMILY_SATISFACTION_GATE,
    G7_NONBLOCKING_REPAIR_GATE: S0_G7_NONBLOCKING_REPAIR_GATE,
    G8_TERMINAL_SCHEMA_GATE: S0_G8_TERMINAL_SCHEMA_GATE
  },

  failure_ticket_schema: S0_FAILURE_TICKET_SCHEMA,
  max_repair_attempts: S0_MAX_REPAIR_ATTEMPTS
});

export const S0_HYBRID_EXTRACTION_MANIFEST_TOP_LEVEL_FIELDS = Object.freeze([
  "extraction_call_card",
  "target",
  "navigation_map",
  "collection_summary",
  "candidate_sources",
  "artifact_inventory",
  "lossless_text_artifacts",
  "dedupe_records",
  "collection_limitations",
  "downstream_handoff"
]);

export const S0_EXTRACTION_FORENSIC_LEDGER_TOP_LEVEL_FIELDS = Object.freeze([
  "ledger_meta",
  "ledger_events",
  "candidate_discovery_log",
  "fetch_log",
  "dedupe_log",
  "model_review_log",
  "validation_repair_log",
  "terminal_gate_log"
]);

export const S0_COLLECTION_STATUSES = Object.freeze([
  "COMPLETED",
  "COMPLETED_WITH_LIMITATIONS",
  "CONTROLLED_FAILURE"
]);

export const S0_ROUTE_SOURCES = Object.freeze([
  "ROOT",
  "HEADER",
  "FOOTER",
  "SITEMAP",
  "ROBOTS",
  "HASH_ROUTE",
  "KNOWN_PATH_PROBE",
  "SEARCH_SCOUT",
  "COVERAGE_CHALLENGE",
  "PASTED_TEXT",
  "SYNTHETIC_DEMO"
]);

export const S0_SCOPE_CLASSES = Object.freeze([
  "TARGET_DOMAIN_CANDIDATE",
  "COMPANY_CONTROLLED_SUBDOMAIN_CANDIDATE",
  "HOSTED_GOVERNANCE_CANDIDATE",
  "PASTED_PUBLIC_MATERIAL_CANDIDATE",
  "SYNTHETIC_DEMO_CANDIDATE",
  "THIRD_PARTY_NON_GOVERNANCE",
  "PRIVATE_OR_PROHIBITED"
]);

export const S0_FETCH_DECISIONS = Object.freeze([
  "FETCH",
  "DEFER",
  "REJECT"
]);

export const S0_CANDIDATE_FINAL_STATUSES = Object.freeze([
  "ACCEPTED_LOSSLESS",
  "FETCH_FAILED",
  "DEDUPED",
  "DEFERRED",
  "REJECTED",
  "SNIPPET_ONLY_QUARANTINED"
]);

export const S0_ARTIFACT_TYPES = Object.freeze([
  "Homepage",
  "Product Page",
  "ToS",
  "Privacy Policy",
  "DPA",
  "AUP",
  "SLA",
  "Trust Center",
  "Security Page",
  "Subprocessor Page",
  "Legal Center",
  "AI Policy",
  "Documentation",
  "Developer Docs",
  "API Docs",
  "Pricing Page",
  "Other"
]);

export const S0_ARTIFACT_CLASSES = Object.freeze([
  "TARGET_SURFACE",
  "PRODUCT_SURFACE",
  "CORE_LEGAL",
  "GOVERNANCE_SURFACE",
  "DATA_SURFACE",
  "FOOTPRINT_WIDE"
]);

export const S0_ARTIFACT_STATUSES = Object.freeze([
  "FOUND",
  "ABSENT",
  "ACCESS_FAILED",
  "INSUFFICIENT_TEXT"
]);

export const S0_EXTRACTION_QUALITIES = Object.freeze([
  "GOOD",
  "PARTIAL",
  "THIN",
  "EMPTY"
]);

export const S0_LOSSLESS_PRESERVATION_STATUSES = Object.freeze([
  "PRESERVED",
  "PARTIAL_PRESERVED",
  "FAILED"
]);

export const S0_DEDUPE_TYPES = Object.freeze([
  "URL_NORMALIZATION",
  "REDIRECT_TARGET",
  "CANONICAL_TAG",
  "CONTENT_HASH",
  "NORMALIZED_TEXT_HASH",
  "BOILERPLATE_STRIPPED_HASH",
  "MODEL_NEAR_DUPLICATE_REVIEW"
]);

export const S0_LIMITATION_TYPES = Object.freeze([
  "ACCESS_FAILED",
  "THIN_COVERAGE",
  "UNFILLED_SUBFAMILY",
  "MISFILLED_SLOT",
  "PASSED_WITH_WARNING",
  "TOOL_LIMITATION",
  "SOURCE_UNAVAILABLE",
  "SNIPPET_ONLY_QUARANTINED"
]);

export const S0_DOWNSTREAM_NEXT_USE = Object.freeze([
  "MONOLITH_MODULE_VI_EVIDENCE_BUFFER",
  "PHASE_1_SOURCE_DISCOVERY_EVIDENCE_BOX"
]);

export const S0_LEDGER_LOCK_STATUSES = Object.freeze([
  "LOCKED",
  "LOCKED_WITH_WARNINGS",
  "CONTROLLED_FAILURE"
]);

export const S0_ROOT_OUTPUT_SCHEMA = deepFreeze({
  hybrid_extraction_manifest: {},
  extraction_forensic_ledger: {}
});

export const S0_HYBRID_EXTRACTION_MANIFEST_SCHEMA = deepFreeze({
  extraction_call_card: {
    node_id: "S0",
    contract_version: S0_SOURCE_CONTRACT_VERSION,
    adapter_version: "",
    run_id: "",
    source_mode: "url | text | url_plus_text | synthetic_demo",
    downstream_mode: "MONOLITH_RUNTIME | PHASE_STACK_RUNTIME",
    canonical_output: "hybrid_extraction_manifest",
    search_pool_enabled: true,
    grounding_enabled: true,
    deterministic_fetch_enabled: true,
    output_is_candidate_only: true,
    generated_at: ""
  },

  target: {
    target_url: "",
    normalized_target_url: "",
    canonical_domain: "",
    root_url: "",
    allowed_hosts: [],
    company_name_candidate: "",
    normalization_notes: []
  },

  navigation_map: {
    root_url: "",
    header_links: [],
    footer_links: [],
    sitemap_links: [],
    robots_sitemap_links: [],
    spa_hash_routes: [],
    candidate_routes_by_family: {
      TARGET_FAMILY: [],
      PRODUCT_FAMILY: [],
      LEGAL_FAMILY: [],
      DATA_FAMILY: []
    }
  },

  collection_summary: {
    collection_status:
      "COMPLETED | COMPLETED_WITH_LIMITATIONS | CONTROLLED_FAILURE",
    candidate_count: 0,
    accepted_source_count: 0,
    lossless_artifact_count: 0,
    fetch_success_count: 0,
    fetch_failure_count: 0,
    dedupe_suppressed_count: 0,
    deferred_count: 0,
    scope_rejected_count: 0,
    family_caps: {},
    family_counts: {},
    subfamily_counts: {},
    family_stop_states: {},
    coverage_status_by_family: {},
    source_runtime_trace: {}
  },

  candidate_sources: [
    {
      candidate_source_id: "",
      candidate_url: "",
      canonical_url: "",
      source_family: "",
      source_subfamily: "",
      route_source:
        "ROOT | HEADER | FOOTER | SITEMAP | ROBOTS | HASH_ROUTE | KNOWN_PATH_PROBE | SEARCH_SCOUT | COVERAGE_CHALLENGE | PASTED_TEXT | SYNTHETIC_DEMO",
      route_basis: "",
      scope_class:
        "TARGET_DOMAIN_CANDIDATE | COMPANY_CONTROLLED_SUBDOMAIN_CANDIDATE | HOSTED_GOVERNANCE_CANDIDATE | PASTED_PUBLIC_MATERIAL_CANDIDATE | SYNTHETIC_DEMO_CANDIDATE | THIRD_PARTY_NON_GOVERNANCE | PRIVATE_OR_PROHIBITED",
      fetch_decision: "FETCH | DEFER | REJECT",
      fetch_decision_reason: "",
      final_status:
        "ACCEPTED_LOSSLESS | FETCH_FAILED | DEDUPED | DEFERRED | REJECTED | SNIPPET_ONLY_QUARANTINED"
    }
  ],

  artifact_inventory: [
    {
      artifact_id: "",
      candidate_source_id: "",
      artifact_type:
        "Homepage | Product Page | ToS | Privacy Policy | DPA | AUP | SLA | Trust Center | Security Page | Subprocessor Page | Legal Center | AI Policy | Documentation | Developer Docs | API Docs | Pricing Page | Other",
      artifact_class:
        "TARGET_SURFACE | PRODUCT_SURFACE | CORE_LEGAL | GOVERNANCE_SURFACE | DATA_SURFACE | FOOTPRINT_WIDE",
      status: "FOUND | ABSENT | ACCESS_FAILED | INSUFFICIENT_TEXT",
      source_url: "",
      source_family: "",
      source_subfamily: "",
      lossless_artifact_ref: "",
      absence_basis: "",
      warning: ""
    }
  ],

  lossless_text_artifacts: [
    {
      lossless_artifact_id: "",
      candidate_source_id: "",
      artifact_id: "",
      source_url: "",
      source_family: "",
      source_subfamily: "",
      artifact_type: "",
      fetch_method_lineage: [],
      raw_text: "",
      clean_text: "",
      normalized_text_hash: "",
      content_hash: "",
      char_count: 0,
      word_count: 0,
      extraction_quality: "GOOD | PARTIAL | THIN | EMPTY",
      lossless_preservation_status:
        "PRESERVED | PARTIAL_PRESERVED | FAILED",
      snippet_only: false
    }
  ],

  dedupe_records: [
    {
      dedupe_record_id: "",
      dedupe_type:
        "URL_NORMALIZATION | REDIRECT_TARGET | CANONICAL_TAG | CONTENT_HASH | NORMALIZED_TEXT_HASH | BOILERPLATE_STRIPPED_HASH | MODEL_NEAR_DUPLICATE_REVIEW",
      canonical_candidate_source_id: "",
      suppressed_candidate_source_ids: [],
      dedupe_basis: [],
      model_review_ref: "",
      not_silently_dropped: true
    }
  ],

  collection_limitations: [
    {
      limitation_id: "",
      limitation_type:
        "ACCESS_FAILED | THIN_COVERAGE | UNFILLED_SUBFAMILY | MISFILLED_SLOT | PASSED_WITH_WARNING | TOOL_LIMITATION | SOURCE_UNAVAILABLE | SNIPPET_ONLY_QUARANTINED",
      affected_family: "",
      affected_subfamily: "",
      affected_item_ids: [],
      basis: "",
      downstream_effect: "",
      forensic_ref: ""
    }
  ],

  downstream_handoff: {
    canonical_next_use:
      "MONOLITH_MODULE_VI_EVIDENCE_BUFFER | PHASE_1_SOURCE_DISCOVERY_EVIDENCE_BOX",
    candidate_only: true,
    lossless_text_available: true,
    artifact_inventory_ready: true,
    snippet_only_forbidden_as_accepted_evidence: true,
    evidence_buffer_materials: {
      source_text_array: "lossless_text_artifacts[]",
      artifact_map: "artifact_inventory[]",
      source_metadata: "candidate_sources[]",
      limitations: "collection_limitations[]"
    }
  }
});

export const S0_EXTRACTION_FORENSIC_LEDGER_SCHEMA = deepFreeze({
  ledger_meta: {
    ledger_id: "",
    node_id: "S0",
    run_id: "",
    contract_version: S0_SOURCE_CONTRACT_VERSION,
    ledger_type: "EXTRACTION_FORENSIC_LEDGER",
    started_at: "",
    completed_at: "",
    ledger_lock_status: "LOCKED | LOCKED_WITH_WARNINGS | CONTROLLED_FAILURE"
  },

  ledger_events: [],
  candidate_discovery_log: [],
  fetch_log: [],
  dedupe_log: [],
  model_review_log: [],
  validation_repair_log: [],
  terminal_gate_log: []
});

export const S0_LAYER_4_FINAL_OUTPUT = deepFreeze({
  layer_id: "LAYER_4_FINAL_OUTPUT",
  title: "Layer 4 — Final Output",

  O1_ROOT_OUTPUT: {
    output_id: "O1",
    title: "Root Output",
    schema: S0_ROOT_OUTPUT_SCHEMA,
    required_roots: S0_CANONICAL_OUTPUT_ROOTS,
    root_count: 2
  },

  O2_HYBRID_EXTRACTION_MANIFEST: {
    output_id: "O2",
    title: "hybrid_extraction_manifest",
    top_level_fields: S0_HYBRID_EXTRACTION_MANIFEST_TOP_LEVEL_FIELDS,
    top_level_field_count: 10,
    schema: S0_HYBRID_EXTRACTION_MANIFEST_SCHEMA
  },

  O3_EXTRACTION_FORENSIC_LEDGER: {
    output_id: "O3",
    title: "extraction_forensic_ledger",
    top_level_fields: S0_EXTRACTION_FORENSIC_LEDGER_TOP_LEVEL_FIELDS,
    top_level_field_count: 8,
    schema: S0_EXTRACTION_FORENSIC_LEDGER_SCHEMA
  },

  O4_TERMINAL_VALIDITY_RULE: {
    output_id: "O4",
    title: "Terminal Validity Rule",
    valid_s0_output_requires: [
      "exactly two roots",
      "no third root",
      "accepted sources are full lossless or limitation-routed",
      "candidate drops are recorded",
      "dedupe is recorded",
      "model reviews are logged where triggered",
      "nonfatal failures are repaired or archived",
      "downstream mode is declared",
      "canonical nomenclature is preserved"
    ]
  }
});

export function getS0Gate(gateId) {
  return Object.values(S0_LAYER_3_GATES.gates).find(
    (gate) => gate.gate_id === gateId
  ) || null;
}

export function isS0GateId(gateId) {
  return S0_GATE_IDS.includes(gateId);
}

export function isS0FailureSeverity(value) {
  return S0_FAILURE_SEVERITIES.includes(value);
}

export function isS0RepairRoute(value) {
  return S0_REPAIR_ROUTES.includes(value);
}

export function isS0RepairFinalStatus(value) {
  return S0_REPAIR_FINAL_STATUSES.includes(value);
}

export function getS0ManifestTopLevelFields() {
  return [...S0_HYBRID_EXTRACTION_MANIFEST_TOP_LEVEL_FIELDS];
}

export function getS0LedgerTopLevelFields() {
  return [...S0_EXTRACTION_FORENSIC_LEDGER_TOP_LEVEL_FIELDS];
}

export function isS0RouteSource(value) {
  return S0_ROUTE_SOURCES.includes(value);
}

export function isS0ScopeClass(value) {
  return S0_SCOPE_CLASSES.includes(value);
}

export function isS0FetchDecision(value) {
  return S0_FETCH_DECISIONS.includes(value);
}

export function isS0CandidateFinalStatus(value) {
  return S0_CANDIDATE_FINAL_STATUSES.includes(value);
}

export function isS0ArtifactType(value) {
  return S0_ARTIFACT_TYPES.includes(value);
}

export function isS0ArtifactClass(value) {
  return S0_ARTIFACT_CLASSES.includes(value);
}

export function isS0ArtifactStatus(value) {
  return S0_ARTIFACT_STATUSES.includes(value);
}

export function isS0ExtractionQuality(value) {
  return S0_EXTRACTION_QUALITIES.includes(value);
}

export function isS0LosslessPreservationStatus(value) {
  return S0_LOSSLESS_PRESERVATION_STATUSES.includes(value);
}

export function isS0DedupeType(value) {
  return S0_DEDUPE_TYPES.includes(value);
}

export function isS0LimitationType(value) {
  return S0_LIMITATION_TYPES.includes(value);
}

export function isS0DownstreamNextUse(value) {
  return S0_DOWNSTREAM_NEXT_USE.includes(value);
}

export function isS0LedgerLockStatus(value) {
  return S0_LEDGER_LOCK_STATUSES.includes(value);
}

export function validateS0RootShape(output) {
  if (!output || typeof output !== "object") {
    return {
      ok: false,
      error: "S0_OUTPUT_NOT_OBJECT"
    };
  }

  const roots = Object.keys(output).sort();
  const expected = [...S0_CANONICAL_OUTPUT_ROOTS].sort();

  if (JSON.stringify(roots) !== JSON.stringify(expected)) {
    return {
      ok: false,
      error: "S0_ROOTS_NOT_CANONICAL",
      expected,
      received: roots
    };
  }

  return {
    ok: true
  };
}

export function validateS0ManifestTopLevelShape(manifest) {
  return validateExactTopLevelFields({
    objectName: "hybrid_extraction_manifest",
    objectValue: manifest,
    expectedFields: S0_HYBRID_EXTRACTION_MANIFEST_TOP_LEVEL_FIELDS
  });
}

export function validateS0LedgerTopLevelShape(ledger) {
  return validateExactTopLevelFields({
    objectName: "extraction_forensic_ledger",
    objectValue: ledger,
    expectedFields: S0_EXTRACTION_FORENSIC_LEDGER_TOP_LEVEL_FIELDS
  });
}

export function validateS0TerminalOutputShape(output) {
  const rootCheck = validateS0RootShape(output);
  if (!rootCheck.ok) return rootCheck;

  const manifestCheck = validateS0ManifestTopLevelShape(
    output.hybrid_extraction_manifest
  );
  if (!manifestCheck.ok) return manifestCheck;

  const ledgerCheck = validateS0LedgerTopLevelShape(
    output.extraction_forensic_ledger
  );
  if (!ledgerCheck.ok) return ledgerCheck;

  return {
    ok: true
  };
}

function validateExactTopLevelFields({
  objectName,
  objectValue,
  expectedFields
}) {
  if (!objectValue || typeof objectValue !== "object" || Array.isArray(objectValue)) {
    return {
      ok: false,
      error: `${objectName.toUpperCase()}_NOT_OBJECT`
    };
  }

  const received = Object.keys(objectValue).sort();
  const expected = [...expectedFields].sort();

  if (JSON.stringify(received) !== JSON.stringify(expected)) {
    return {
      ok: false,
      error: `${objectName.toUpperCase()}_FIELDS_NOT_CANONICAL`,
      expected,
      received
    };
  }

  return {
    ok: true
  };
}

export const S0_LAYER_1_CANON = deepFreeze({
  layer_id: "LAYER_1_CANON",
  title: "Layer 1 — Canon",

  sections: {
    C1_ROLE_BOUNDARY: S0_ROLE_BOUNDARY,
    C2_EVIDENCE_FIREWALL: S0_EVIDENCE_FIREWALL,
    C3_RUNTIME_IGNITION: S0_RUNTIME_IGNITION,
    C4_LLM_FAILURE_CONTROLS: S0_LLM_FAILURE_CONTROLS,
    C5_FAMILY_SUBFAMILY_TAXONOMY: S0_FAMILY_SUBFAMILY_TAXONOMY,
    C6_KNOWN_PATH_BANK: S0_KNOWN_PATH_BANK_SECTION,
    C7_DETERMINISTIC_MODEL_SPLIT: S0_DETERMINISTIC_MODEL_SPLIT
  }
});

export const S0_SOURCE_CONTRACT = deepFreeze({
  contract_meta: S0_CONTRACT_META,

  layer_1_canon: S0_LAYER_1_CANON,
  layer_2_execution_steps: S0_LAYER_2_EXECUTION_STEPS,
  layer_3_gates: S0_LAYER_3_GATES,
  layer_4_final_output: S0_LAYER_4_FINAL_OUTPUT,

  taxonomy: {
    family_order: S0_SOURCE_FAMILY_ORDER,
    family_caps: S0_FAMILY_CAPS,
    total_accepted_lossless_sources_hard_max:
      S0_TOTAL_ACCEPTED_LOSSLESS_SOURCES_HARD_MAX,
    subfamilies: S0_SOURCE_TAXONOMY,
    subfamily_caps: S0_SUBFAMILY_CAPS,
    subfamily_hard_caps: S0_SUBFAMILY_HARD_CAPS
  },

  known_path_bank: S0_KNOWN_PATH_BANK,

  enums: {
    source_modes: S0_SOURCE_MODES,
    downstream_modes: S0_DOWNSTREAM_MODES,
    canonical_output_roots: S0_CANONICAL_OUTPUT_ROOTS,

    hosted_governance_candidates: S0_HOSTED_GOVERNANCE_CANDIDATES,
    data_flow_signals: S0_DATA_FLOW_SIGNALS,

    route_source_strength: S0_ROUTE_SOURCE_STRENGTH,
    route_sources: S0_ROUTE_SOURCES,
    scope_classes: S0_SCOPE_CLASSES,

    fetch_decisions: S0_FETCH_DECISIONS,
    candidate_final_statuses: S0_CANDIDATE_FINAL_STATUSES,

    artifact_types: S0_ARTIFACT_TYPES,
    artifact_classes: S0_ARTIFACT_CLASSES,
    artifact_statuses: S0_ARTIFACT_STATUSES,

    extraction_qualities: S0_EXTRACTION_QUALITIES,
    lossless_preservation_statuses: S0_LOSSLESS_PRESERVATION_STATUSES,

    dedupe_basis: S0_DEDUPE_BASIS,
    dedupe_types: S0_DEDUPE_TYPES,

    near_duplicate_review_decisions: S0_NEAR_DUPLICATE_REVIEW_DECISIONS,
    subfamily_satisfaction_statuses: S0_SUBFAMILY_SATISFACTION_STATUSES,
    subfamily_satisfaction_actions: S0_SUBFAMILY_SATISFACTION_ACTIONS,

    collection_terminal_states: S0_COLLECTION_TERMINAL_STATES,
    collection_statuses: S0_COLLECTION_STATUSES,
    limitation_types: S0_LIMITATION_TYPES,

    downstream_next_use: S0_DOWNSTREAM_NEXT_USE,
    ledger_lock_statuses: S0_LEDGER_LOCK_STATUSES,

    failure_severities: S0_FAILURE_SEVERITIES,
    repair_routes: S0_REPAIR_ROUTES,
    repair_final_statuses: S0_REPAIR_FINAL_STATUSES
  },

  authority_split: {
    deterministic_may: S0_DETERMINISTIC_AUTHORITY,
    model_may: S0_MODEL_AUTHORITY,
    model_must_not: S0_MODEL_PROHIBITIONS
  },

  output_handoff_schema: {
    root_output_schema: S0_ROOT_OUTPUT_SCHEMA,
    hybrid_extraction_manifest_top_level_fields:
      S0_HYBRID_EXTRACTION_MANIFEST_TOP_LEVEL_FIELDS,
    extraction_forensic_ledger_top_level_fields:
      S0_EXTRACTION_FORENSIC_LEDGER_TOP_LEVEL_FIELDS,
    hybrid_extraction_manifest_schema:
      S0_HYBRID_EXTRACTION_MANIFEST_SCHEMA,
    extraction_forensic_ledger_schema:
      S0_EXTRACTION_FORENSIC_LEDGER_SCHEMA
  }
});

export function assertValidS0SourceMode(sourceMode) {
  return S0_SOURCE_MODES.includes(sourceMode);
}

export function assertValidS0DownstreamMode(downstreamMode) {
  return S0_DOWNSTREAM_MODES.includes(downstreamMode);
}

export function isS0ForbiddenLanguage(term) {
  return S0_ROLE_BOUNDARY.forbidden_language.includes(term);
}

export function isS0AllowedLanguage(term) {
  return S0_ROLE_BOUNDARY.allowed_language.includes(term);
}

export function isS0CanonicalOutputRoot(rootName) {
  return S0_CANONICAL_OUTPUT_ROOTS.includes(rootName);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;

  Object.freeze(value);

  for (const key of Object.keys(value)) {
    const child = value[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }

  return value;
}
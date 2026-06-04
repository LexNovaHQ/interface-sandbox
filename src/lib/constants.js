export const APP_NAME = "Lex Nova Sandbox OS";
export const APP_SUBTITLE = "Public risk input to review-ready delivery.";
export const APP_ID = "lexnova-interface-sandbox";
export const PHASE = "skeleton";
export const DOMAIN_TARGET = "sandbox.lexnovahq.com";

export const AI_CONFIG = {
  provider: "groq",
  primaryModel: "openai/gpt-oss-120b",
  fallbackModel: "llama-3.3-70b-versatile",
  liveCallEnabled: false
};

export const DISCLAIMER =
  "Public sandbox. No legal advice. Public/user-provided materials only. Do not submit confidential information. The delivery layer is synthetic. Outputs are review-ready demo drafts requiring qualified legal review.";

export const STATUS_TEXT = "Skeleton ready \u2014 engine logic pending";

export const STORAGE_KEYS = {
  sourceBundle: "lexnova:lastSourceBundle",
  diligenceReport: "lexnova:lastDiligenceReport",
  vaultAnswers: "lexnova:lastVaultAnswers",
  assemblyOutput: "lexnova:lastAssemblyOutput",
  deliveryState: "lexnova:lastDeliveryState",
  maintenanceRun: "lexnova:lastMaintenanceRun"
};

export const SYSTEM_CHAIN = [
  "Public source",
  "Diligence Engine",
  "Vault Assembly",
  "Review-Ready Draft Route",
  "Synthetic Delivery",
  "Maintenance Radar"
];

export const ENGINE_ROUTES = [
  {
    path: "/diligence",
    title: "Diligence Engine",
    summary: "Turns public source material into a structured diligence report shell.",
    input: "Public website URL or pasted public text.",
    output: "Mock source bundle, product profile, classification, findings, and route summary."
  },
  {
    path: "/assembly",
    title: "Vault Assembly Engine",
    summary: "Combines diligence context with vault answers into a draft route shell.",
    input: "Mock diligence report and placeholder vault answers.",
    output: "Mock document stack, clause routes, schedule routes, and draft preview shell."
  },
  {
    path: "/delivery",
    title: "Delivery Layer",
    summary: "Tracks synthetic CRM and client delivery state for demo matters.",
    input: "Mock assembly bundle and synthetic matter metadata.",
    output: "Mock delivery state, document list, and activity log."
  },
  {
    path: "/maintenance",
    title: "Maintenance Radar",
    summary: "Shows a placeholder coverage comparison against a sample new threat.",
    input: "Mock document stack and synthetic update event.",
    output: "Mock coverage buckets and recommended update route."
  }
];

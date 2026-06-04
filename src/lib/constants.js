export const APP_NAME = "The Interface";
export const APP_SUBTITLE = "Law \u00d7 Technology \u00b7 AI Governance \u00b7 Privacy \u00b7 Systems";
export const APP_ID = "interface-sandbox";
export const PHASE = "wrapper-batch-1";

export const DISCLAIMER =
  "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.";

export const STATUS_TEXT = "Skeleton ready \u2014 runtime implementation pending.";

export const OPERATIONAL_CHAIN = [
  "Public Source",
  "Diligence Layer",
  "Assembly Layer",
  "Delivery Portal",
  "Maintenance Monitor"
];

export const UNIT_PANELS = [
  {
    path: "/diligence",
    title: "Diligence Layer",
    unit: "DILIGENCE",
    summary:
      "Future public evidence intake, source collection, feature classification, threat registry evaluation, diligence report, and Assembly handoff."
  },
  {
    path: "/assembly",
    title: "Assembly Layer",
    unit: "ASSEMBLY",
    summary:
      "Future handoff intake, canonical profile construction, document assembly routing, human review, and Delivery handoff."
  },
  {
    path: "/delivery",
    title: "Delivery Portal",
    unit: "DELIVERY",
    summary:
      "Future delivered draft packages, human review state, client package trail, and maintenance status."
  },
  {
    path: "/horizon",
    title: "Horizon Scanner",
    unit: "HORIZON",
    summary:
      "Future fixed regulatory source list, extraction, classification, storage, and Maintenance feed."
  }
];

export const WRAPPER_STATUS = [
  { label: "Firebase/Firestore", value: "Not connected" },
  { label: "Handoff ledger", value: "Pending" }
];

export const RUNTIME_ARTIFACTS = [
  { file: "registry.runtime.json", status: "Missing" },
  { file: "registry_key.runtime.json", status: "Missing" },
  { file: "runtime_artifacts_manifest.json", status: "Missing" },
  { file: "02_DILIGENCE_RUNTIME_SANDBOX_v1.md", status: "Missing" },
  { file: "vault.js", status: "Missing" }
];

export const UNIVERSAL_HANDOFF_ENVELOPE = {
  handoff_id: "",
  run_id: "",
  source_engine: "",
  target_engine: "",
  payload_type: "",
  status: "draft | ready | pushed | received | failed",
  created_at: "",
  updated_at: "",
  payload_ref: "",
  summary: "",
  warnings: []
};

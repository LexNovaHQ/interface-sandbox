import {
  APP_NAME,
  APP_SUBTITLE,
  GLOBAL_DISCLAIMER,
  RUNTIME_VERSION
} from "../wrapper/config/runtimeConfig.js";

export { APP_NAME, APP_SUBTITLE, GLOBAL_DISCLAIMER };

export const APP_ID = "legal-diligence-assembly-os";
export const PHASE = RUNTIME_VERSION;

export const STATUS_TEXT = "Legal Diligence & Assembly OS activation in progress.";

export const OPERATIONAL_CHAIN = [
  "Review Target",
  "Diligence Engine",
  "Assembly Engine",
  "Delivery",
  "Maintenance Radar"
];

export const UNIT_PANELS = [
  {
    path: "/diligence",
    title: "Diligence Engine",
    unit: "DILIGENCE",
    summary:
      "Live public-footprint and document-led diligence engine producing a Legal Exposure Diligence Report and Stage 10 handoff."
  },
  {
    path: "/assembly",
    title: "Assembly Engine",
    unit: "ASSEMBLY",
    summary:
      "Stage 10 handoff intake, internal Vault Review, canonical profile construction, and document assembly routing."
  },
  {
    path: "/delivery",
    title: "Delivery",
    unit: "DELIVERY",
    summary:
      "Review package readiness, artifacts, internal delivery state, and monitoring transition."
  },
  {
    path: "/horizon",
    title: "Horizon Radar",
    unit: "HORIZON",
    summary:
      "Regulatory update intake, classification, matter matching, and maintenance feed."
  }
];

import {
  APP_NAME,
  APP_SUBTITLE,
  GLOBAL_DISCLAIMER,
  RUNTIME_VERSION
} from "../wrapper/config/runtimeConfig.js";

export { APP_NAME, APP_SUBTITLE, GLOBAL_DISCLAIMER };

export const APP_ID = "interface-sandbox";
export const PHASE = RUNTIME_VERSION;

export const STATUS_TEXT = "Diligence Engine live review activation in progress.";

export const OPERATIONAL_CHAIN = [
  "Public Source",
  "Diligence Engine",
  "Assembly Layer",
  "Delivery Portal",
  "Maintenance Monitor"
];

export const UNIT_PANELS = [
  {
    path: "/diligence",
    title: "Diligence Engine",
    unit: "DILIGENCE",
    summary:
      "Live public-footprint and document-led diligence engine producing a Legal Exposure Diligence Report and Review-Ready Remediation Handoff."
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

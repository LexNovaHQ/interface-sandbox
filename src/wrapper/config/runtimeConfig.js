const viteEnv = import.meta.env || {};

function readBooleanEnv(value, fallback) {
  if (value === undefined || value === "") return fallback;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return fallback;
}

export const APP_NAME = "Legal Diligence & Assembly OS";
export const APP_SUBTITLE =
  "AI product review · structured diligence · assembly workflow · monitoring";
export const GLOBAL_DISCLAIMER =
  "Interview proof-of-work demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.";

export const APP_MODE = viteEnv.VITE_INTERFACE_APP_MODE || "sandbox";
export const DEMO_MODE = readBooleanEnv(viteEnv.VITE_INTERFACE_DEMO_MODE, true);
export const RUNTIME_VERSION =
  viteEnv.VITE_INTERFACE_RUNTIME_VERSION || "diligence-assembly-os-v1";

export const WRAPPER_NAME = "Operating System Shell";
export const OPERATIONAL_UNITS = Object.freeze([
  "Operating Shell",
  "Diligence",
  "Assembly",
  "Delivery",
  "Horizon"
]);

export const AI_PROVIDERS = Object.freeze({
  primary: "gemini",
  fallback: "groq or none",
  primaryModelLabel: "Gemini 3.5 Flash",
  fastModelLabel: "Gemini 3.1 Flash-Lite"
});

export const CAPABILITY_LABELS = Object.freeze({
  searchDiscovery: "Search Discovery",
  geminiUrlContext: "Gemini URL Context",
  knownPathSourceCollection: "Known-Path Source Collection",
  firebaseClient: "Firebase Client",
  firestoreClient: "Firestore Client"
});

export const AI_KEY_EXPOSURE_STATUS = "server-only";

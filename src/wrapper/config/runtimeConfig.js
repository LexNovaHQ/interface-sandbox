const viteEnv = import.meta.env || {};

function readBooleanEnv(value, fallback) {
  if (value === undefined || value === "") return fallback;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return fallback;
}

export const APP_NAME = "The Interface";
export const APP_SUBTITLE =
  "Law \u00d7 Technology \u00b7 AI Governance \u00b7 Privacy \u00b7 Systems";
export const GLOBAL_DISCLAIMER =
  "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.";

export const APP_MODE = viteEnv.VITE_INTERFACE_APP_MODE || "sandbox";
export const DEMO_MODE = readBooleanEnv(viteEnv.VITE_INTERFACE_DEMO_MODE, true);
export const RUNTIME_VERSION =
  viteEnv.VITE_INTERFACE_RUNTIME_VERSION || "wrapper-batch-1";

export const GROQ_PRIMARY_MODEL =
  viteEnv.GROQ_PRIMARY_MODEL || "openai/gpt-oss-120b";
export const GROQ_FALLBACK_MODEL =
  viteEnv.GROQ_FALLBACK_MODEL || "llama-3.3-70b-versatile";
export const GROQ_API_CONFIGURED = false;
export const GROQ_API_EXPOSURE_STATUS = "server-only / not exposed";

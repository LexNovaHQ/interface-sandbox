import { runLiveDiligenceReview as runBaseLiveDiligenceReview } from "./canonicalLiveDiligenceRunOrchestrator.js";

const NO_SOURCE_CAP = Number.MAX_SAFE_INTEGER;

function setDefaultEnv(name, value) {
  if (process.env[name] === undefined || process.env[name] === null || process.env[name] === "") process.env[name] = String(value);
}

function applyLockedRuntimeEnv() {
  setDefaultEnv("LIVE_SOURCE_DISCOVERY_MODE", "sync_with_free_search");
  setDefaultEnv("LIVE_RUN_FREE_SEARCH", "true");
  setDefaultEnv("LIVE_ANCHOR_FETCH_MAX", 60);
  setDefaultEnv("LIVE_ANCHOR_LINK_LIMIT", NO_SOURCE_CAP);
  setDefaultEnv("LIVE_ANCHOR_CLASSIFY_TOKENS", 8192);
  setDefaultEnv("LIVE_PROBE_TIMEOUT_MS", 8000);
  setDefaultEnv("LIVE_CAPTURE_LIMIT", NO_SOURCE_CAP);
  setDefaultEnv("LIVE_PRODUCT_CAPTURE_LIMIT", NO_SOURCE_CAP);
  setDefaultEnv("LIVE_COMPANY_CAPTURE_LIMIT", NO_SOURCE_CAP);
  setDefaultEnv("LIVE_LEGAL_CAPTURE_LIMIT", NO_SOURCE_CAP);
  setDefaultEnv("LIVE_GOVERNANCE_CAPTURE_LIMIT", NO_SOURCE_CAP);
  setDefaultEnv("LIVE_CAPTURE_TIMEOUT_MS", 24000);
  setDefaultEnv("SOURCE_CAPTURE_MAX_BYTES", 30 * 1024 * 1024);
  setDefaultEnv("LIVE_COMPANY_MAX_OUTPUT_TOKENS", 24000);
  setDefaultEnv("STAGE4_COMPANY_MAX_OUTPUT_TOKENS", 24000);
  setDefaultEnv("STAGE5_MAX_INPUT_CHARS", 240000);
  setDefaultEnv("STAGE5_MAX_ESTIMATED_TOKENS", 120000);
  setDefaultEnv("STAGE5_MAX_SINGLE_SOURCE_CHARS", NO_SOURCE_CAP);
  setDefaultEnv("LIVE_FEATURE_MAX_OUTPUT_TOKENS", 28000);
  setDefaultEnv("STAGE5_FEATURE_MAX_OUTPUT_TOKENS", 28000);
  setDefaultEnv("STAGE7_BUDGET_ENFORCEMENT_MODE", "guidance");
}

function lockedOptions(options = {}) {
  return {
    ...options,
    sourceDiscoveryMode: options.sourceDiscoveryMode || "sync_with_free_search",
    runFreeFirstPartySearch: options.runFreeFirstPartySearch === false ? false : true,
    anchorFetchMaxAnchors: Number(options.anchorFetchMaxAnchors || 60),
    anchorLinkLimit: Number(options.anchorLinkLimit || NO_SOURCE_CAP),
    anchorClassifyMaxOutputTokens: Number(options.anchorClassifyMaxOutputTokens || 8192),
    probe_timeout_ms: Number(options.probe_timeout_ms || 8000),
    capture_limit: Number(options.capture_limit || NO_SOURCE_CAP),
    max_sources: Number(options.max_sources || NO_SOURCE_CAP),
    product_capture_limit: Number(options.product_capture_limit || NO_SOURCE_CAP),
    company_capture_limit: Number(options.company_capture_limit || NO_SOURCE_CAP),
    legal_capture_limit: Number(options.legal_capture_limit || NO_SOURCE_CAP),
    governance_capture_limit: Number(options.governance_capture_limit || NO_SOURCE_CAP),
    capture_timeout_ms: Number(options.capture_timeout_ms || 24000)
  };
}

export async function runLiveDiligenceReview(input = {}, options = {}) {
  applyLockedRuntimeEnv();
  return runBaseLiveDiligenceReview(input, lockedOptions(options));
}

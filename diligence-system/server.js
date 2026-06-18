import express from "express";
import helmet from "helmet";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import {
  DILIGENCE_SYSTEM_PROMPT,
  buildDiligenceRuntimePayload,
  buildDiligenceUserPrompt
} from "./prompts/diligence-prompt.js";
import { validatePromptStack, getPhasePoolBindings } from "./prompt-stack-loader.js";
import {
  buildHybridExtractionManifest,
  summarizeHybridExtractionManifest,
  validateHybridExtractionManifest
} from "./stage0-adapter.js";
import {
  runP1SourceDiscovery,
  runP2TargetProfile,
  runP3TargetFeatureProfile
} from "./phase-runner.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8080);
const DILIGENCE_MODE = process.env.DILIGENCE_MODE || "mock";
const ACTIVE_DILIGENCE_RUNTIME = "phase_stack_p3";

const DEFAULT_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const GEMINI_MODELS = parseModelPool();
const GEMINI_MODEL = GEMINI_MODELS[0] || DEFAULT_GEMINI_MODELS[0];
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 240000);
const GEMINI_PING_TIMEOUT_MS = Number(process.env.GEMINI_PING_TIMEOUT_MS || 30000);
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 65535);
const GEMINI_PING_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_PING_MAX_OUTPUT_TOKENS || 128);

const HYBRID_FETCH_ENABLED = parseBool(process.env.HYBRID_FETCH_ENABLED, true);
const HYBRID_GROUNDING_ALLOWED = parseBool(process.env.HYBRID_GROUNDING_ALLOWED, true);
const HYBRID_MAX_PAGES = Number(process.env.HYBRID_MAX_PAGES || 24);
const HYBRID_MAX_DISCOVERED_LINKS = Number(process.env.HYBRID_MAX_DISCOVERED_LINKS || 24);
const HYBRID_MAX_CHARS_PER_SOURCE = Number(process.env.HYBRID_MAX_CHARS_PER_SOURCE || 12000);
const HYBRID_FETCH_TIMEOUT_MS = Number(process.env.HYBRID_FETCH_TIMEOUT_MS || 15000);

const GEMINI_API_KEYS = parseKeyPool();
const GEMINI_POOL = buildGeminiPool(GEMINI_API_KEYS);
const GEMINI_MODEL_POOL = buildGeminiModelPool(GEMINI_MODELS);

const DILIGENCE_POOL_DEFINITIONS = {
  search: {
    label: "Source Discovery / Grounded Search",
    keyEnv: "DILIGENCE_SEARCH_API_KEYS",
    singleKeyEnv: "DILIGENCE_SEARCH_API_KEY",
    modelEnv: "DILIGENCE_SEARCH_MODEL_SEQUENCE",
    singleModelEnv: "DILIGENCE_SEARCH_MODEL",
    defaultModels: ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
    groundingDefault: true,
    fallbackPool: null
  },
  extract: {
    label: "Extraction / Evidence Structuring",
    keyEnv: "DILIGENCE_EXTRACT_API_KEYS",
    singleKeyEnv: "DILIGENCE_EXTRACT_API_KEY",
    modelEnv: "DILIGENCE_EXTRACT_MODEL_SEQUENCE",
    singleModelEnv: "DILIGENCE_EXTRACT_MODEL",
    defaultModels: ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
    groundingDefault: false,
    fallbackPool: "repair"
  },
  router: {
    label: "Evidence Package Router",
    keyEnv: "DILIGENCE_ROUTER_API_KEYS",
    singleKeyEnv: "DILIGENCE_ROUTER_API_KEY",
    modelEnv: "DILIGENCE_ROUTER_MODEL_SEQUENCE",
    singleModelEnv: "DILIGENCE_ROUTER_MODEL",
    defaultModels: ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
    groundingDefault: false,
    fallbackPool: "extract"
  },
  profile: {
    label: "Target / Function / Data Profile Builder",
    keyEnv: "DILIGENCE_PROFILE_API_KEYS",
    singleKeyEnv: "DILIGENCE_PROFILE_API_KEY",
    modelEnv: "DILIGENCE_PROFILE_MODEL_SEQUENCE",
    singleModelEnv: "DILIGENCE_PROFILE_MODEL",
    defaultModels: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    groundingDefault: false,
    fallbackPool: "repair"
  },
  registry: {
    label: "Registry / Exposure Evaluation",
    keyEnv: "DILIGENCE_REGISTRY_API_KEYS",
    singleKeyEnv: "DILIGENCE_REGISTRY_API_KEY",
    modelEnv: "DILIGENCE_REGISTRY_MODEL_SEQUENCE",
    singleModelEnv: "DILIGENCE_REGISTRY_MODEL",
    defaultModels: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    groundingDefault: false,
    fallbackPool: "repair"
  },
  final: {
    label: "Integrated Report / Vault Handoff Compiler",
    keyEnv: "DILIGENCE_FINAL_API_KEYS",
    singleKeyEnv: "DILIGENCE_FINAL_API_KEY",
    modelEnv: "DILIGENCE_FINAL_MODEL_SEQUENCE",
    singleModelEnv: "DILIGENCE_FINAL_MODEL",
    defaultModels: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    groundingDefault: false,
    fallbackPool: "repair"
  },
  repair: {
    label: "Schema Repair / Normalization",
    keyEnv: "DILIGENCE_REPAIR_API_KEYS",
    singleKeyEnv: "DILIGENCE_REPAIR_API_KEY",
    modelEnv: "DILIGENCE_REPAIR_MODEL_SEQUENCE",
    singleModelEnv: "DILIGENCE_REPAIR_MODEL",
    defaultModels: ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
    groundingDefault: false,
    fallbackPool: null
  }
};

const DILIGENCE_STAGE_POOL_BINDINGS = {
  stage1_source_evidence_box: { primary: "search", secondary: "extract" },
  stage2_evidence_package_router: { primary: "router", secondary: "extract" },
  stage3_target_profile: { primary: "profile", secondary: "repair" },
  stage4_function_profile: { primary: "profile", secondary: "repair" },
  stage5_legal_index: { primary: "extract", secondary: "profile" },
  stage6_data_profile: { primary: "profile", secondary: "repair" },
  stage7_registry_exposure: { primary: "registry", secondary: "repair" },
  stage8_integrated_report_handoff: { primary: "final", secondary: "repair" }
};

const DILIGENCE_POOLS = buildDiligencePools();

const PROMPT_LIVE_FILES = {
  monolith: "prompts/01_DILIGENCE_RUNTIME_GPT_v1.md",
  registryKey: "reference/REGISTRY_KEY_v3_0.md",
  registryCsv: "reference/AI_THREAT_REGISTRY_REGISTRY.csv",
  hunterEngineRules: "reference/AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv",
  vaultMap: "reference/VAULT_JS_CANONICAL_MAP_v1.md",
  contractSpine: "reference/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md"
};

const PRIMARY_PATHS = [
  "/",
  "/home",
  "/about",
  "/about-us",
  "/company",
  "/product",
  "/products",
  "/platform",
  "/solutions",
  "/security",
  "/trust",
  "/trust-center",
  "/legal",
  "/terms",
  "/terms-of-service",
  "/privacy",
  "/dpa",
  "/subprocessors",
  "/acceptable-use",
  "/aup",
  "/sla"
];

const SECONDARY_PATHS = [
  "/pricing",
  "/enterprise",
  "/api",
  "/docs",
  "/developers",
  "/integrations",
  "/customers",
  "/use-cases"
];

const DISCOVERY_ALLOW_RE = /^\/(product|products|platform|solutions|security|trust|trust-center|legal|terms|terms-of-service|privacy|dpa|subprocessors|acceptable-use|aup|sla|api|docs|developers|integrations|enterprise)(\/|$)/i;
const DISCOVERY_REJECT_RE = /\/(blog|news|press|case-studies|case-study|events|careers|jobs|login|signin|sign-in|signup|sign-up|contact|demo)(\/|$)/i;

const MANDATORY_DISCLAIMER =
  "Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.";

const referenceBundlePromise = loadReferenceBundle();

let promptStackStatus = { ok: false, validation_errors: ["NOT_INITIALIZED"], validation_warnings: [] };
try {
  promptStackStatus = validatePromptStack();
  console.log("[prompt-stack]", promptStackStatus.ok ? "loaded" : "validation failed");
} catch (err) {
  promptStackStatus = {
    ok: false,
    validation_errors: [err?.message || "PROMPT_STACK_LOAD_FAILED"],
    validation_warnings: []
  };
  console.warn("[prompt-stack] validation failed", err?.message || err);
}

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.redirect(302, "/diligence.html");
});

app.get("/health", async (_req, res) => {
  const referenceBundle = await safeReferenceBundle();
  res.json({
    ok: true,
    service: "interface-diligence-system",
    mode: DILIGENCE_MODE,
    active_diligence_runtime: ACTIVE_DILIGENCE_RUNTIME,
    monolith_active: false,
    phase_stack_stage0_adapter: true,
    phase_stack_p1_runner: true,
    phase_stack_p2_runner: true,
    phase_stack_p3_runner: true,
    supported_modes: ["phase_stack_p3"],
    model: GEMINI_MODEL,
    models: GEMINI_MODELS,
    model_pool_size: GEMINI_MODEL_POOL.length,
    gemini_ready: GEMINI_POOL.length > 0 && GEMINI_MODEL_POOL.length > 0,
    key_pool_size: GEMINI_POOL.length,
    key_pool: publicPoolSnapshot(),
    diligence_pool_foundation: {
      version: "diligence_pool_v1",
      pool_count: Object.keys(DILIGENCE_POOLS).length,
      pools: publicDiligencePoolsSnapshot(),
      stage_pool_bindings: DILIGENCE_STAGE_POOL_BINDINGS
    },
    hybrid_fetcher: {
      version: "hybrid_v1",
      enabled: HYBRID_FETCH_ENABLED,
      grounding_allowed: HYBRID_GROUNDING_ALLOWED,
      max_pages: HYBRID_MAX_PAGES,
      max_discovered_links: HYBRID_MAX_DISCOVERED_LINKS,
      max_chars_per_source: HYBRID_MAX_CHARS_PER_SOURCE,
      fetch_timeout_ms: HYBRID_FETCH_TIMEOUT_MS,
      primary_paths: PRIMARY_PATHS,
      secondary_paths: SECONDARY_PATHS
    },
    timeouts: {
      gemini_timeout_ms: GEMINI_TIMEOUT_MS,
      gemini_ping_timeout_ms: GEMINI_PING_TIMEOUT_MS
    },
    output_limits: {
      gemini_max_output_tokens: GEMINI_MAX_OUTPUT_TOKENS,
      gemini_ping_max_output_tokens: GEMINI_PING_MAX_OUTPUT_TOKENS
    },
    legacy_prompt_live_available: referenceBundle.ok,
    legacy_prompt_live_files: referenceBundle.manifest || [],
    registry_row_count_estimate: referenceBundle.registry_row_count_estimate || 0,
    reference_load_error: referenceBundle.ok ? null : referenceBundle.error
  });
});

app.get("/api/gemini/pool", (_req, res) => {
  res.json({
    ok: true,
    model: GEMINI_MODEL,
    models: GEMINI_MODELS,
    model_pool_size: GEMINI_MODEL_POOL.length,
    configured: GEMINI_POOL.length > 0 && GEMINI_MODEL_POOL.length > 0,
    key_pool_size: GEMINI_POOL.length,
    pool: publicPoolSnapshot(),
    diligence_pool_foundation: {
      version: "diligence_pool_v1",
      pools: publicDiligencePoolsSnapshot(),
      stage_pool_bindings: DILIGENCE_STAGE_POOL_BINDINGS
    },
    mode: DILIGENCE_MODE,
    note: "Keys are server-side only. Raw key material is never returned."
  });
});

app.get("/api/diligence/pools", (_req, res) => {
  let phasePoolBindingsFrom08 = {};
  let phasePoolBindingWarning;
  try {
    phasePoolBindingsFrom08 = getPhasePoolBindings();
  } catch {
    phasePoolBindingWarning = "PROMPT_STACK_NOT_LOADED";
  }

  res.json({
    ok: true,
    version: "diligence_pool_v1",
    service: "interface-diligence-system",
    mode: DILIGENCE_MODE,
    fallback_policy: "Pool-specific DILIGENCE_* env values are preferred; GEMINI_API_KEYS/GEMINI_MODEL(S) remain migration fallbacks.",
    pools: publicDiligencePoolsSnapshot(),
    stage_pool_bindings: DILIGENCE_STAGE_POOL_BINDINGS,
    phase_pool_bindings_from_08: phasePoolBindingsFrom08,
    ...(phasePoolBindingWarning ? { phase_pool_binding_warning: phasePoolBindingWarning } : {}),
    note: "Keys are server-side only. Raw key material is never returned."
  });
});

app.get("/api/diligence/prompt-stack", (_req, res) => {
  res.json({
    ok: promptStackStatus.ok,
    stack_dir: promptStackStatus.stack_dir,
    reference_dir: promptStackStatus.reference_dir,
    loaded_phase_stack_files: promptStackStatus.loaded_phase_stack_files || [],
    loaded_reference_files: promptStackStatus.loaded_reference_files || [],
    missing_phase_stack_files: promptStackStatus.missing_phase_stack_files || [],
    missing_reference_files: promptStackStatus.missing_reference_files || [],
    missing_optional_reference_files: promptStackStatus.missing_optional_reference_files || [],
    execution_graph_summary: promptStackStatus.execution_graph_summary || [],
    phase_pool_bindings: promptStackStatus.phase_pool_bindings || {},
    validation_errors: promptStackStatus.validation_errors || [],
    validation_warnings: promptStackStatus.validation_warnings || []
  });
});

app.post("/api/gemini/ping", async (_req, res) => {
  if (!GEMINI_POOL.length) {
    return res.status(500).json({ ok: false, error: "GEMINI_API_KEYS_NOT_CONFIGURED" });
  }

  const startedAt = Date.now();
  try {
    const result = await callGeminiWithFallback({
      systemPrompt: "You are a server health-check responder. Return only valid JSON.",
      userPrompt: "Return exactly this JSON shape with no markdown: {\"ok\":true,\"ping\":\"pong\"}",
      responseMimeType: "application/json",
      timeoutMs: GEMINI_PING_TIMEOUT_MS,
      maxOutputTokens: GEMINI_PING_MAX_OUTPUT_TOKENS,
      temperature: 0,
      returnMeta: true,
      allowGrounding: false,
      poolName: "repair"
    });

    return res.json({
      ok: true,
      model: result.model,
      key_index: result.key_index,
      key_fingerprint: result.fingerprint,
      pool_name: result.pool_name,
      models: GEMINI_MODELS,
      key_pool_size: GEMINI_POOL.length,
      latency_ms: Date.now() - startedAt,
      response: safeJsonOrText(stripJsonFence(result.text))
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      error: "GEMINI_PING_FAILED",
      message: err?.message || String(err),
      latency_ms: Date.now() - startedAt
    });
  }
});

app.post("/api/diligence/run", async (req, res) => {
  try {
    const sourceMode = String(req.body?.source_mode || req.body?.sourceMode || "url").trim();
    const incomingTargetUrl = String(req.body?.target_url || req.body?.targetUrl || "").trim();
    const pastedPublicMaterial = String(req.body?.pasted_public_material || req.body?.pastedPublicMaterial || "");
    const syntheticDemoMaterial = String(req.body?.synthetic_demo_material || req.body?.syntheticDemoMaterial || pastedPublicMaterial || "");
    const companyName = String(req.body?.company_name || req.body?.companyName || "");
    const normalizedTargetUrl = sourceMode === "text" || sourceMode === "synthetic_demo" ? "N/A" : normalizeTargetUrl(incomingTargetUrl);

    if (!normalizedTargetUrl && sourceMode !== "text" && sourceMode !== "synthetic_demo") {
      return res.status(400).json({ ok: false, error: "TARGET_URL_REQUIRED" });
    }

    const runId = createRunId();
    const runtimePayload = {
      run_id: runId,
      source_mode: sourceMode,
      target_url: normalizedTargetUrl || "N/A",
      pasted_public_material: pastedPublicMaterial,
      company_name: companyName
    };

    const startedAt = new Date().toISOString();
    const hybridEvidencePacket = sourceMode === "synthetic_demo"
      ? emptyHybridEvidencePacket(runtimePayload)
      : await buildHybridEvidencePacket(runtimePayload);
    const completedAt = new Date().toISOString();

    const manifest = buildHybridExtractionManifest({
      runId,
      sourceMode,
      targetUrl: runtimePayload.target_url,
      companyName,
      pastedPublicMaterial,
      syntheticDemoMaterial,
      hybridEvidencePacket,
      startedAt,
      completedAt
    });
    const stage0Validation = validateHybridExtractionManifest(manifest);
    const stage0Summary = summarizeHybridExtractionManifest(manifest);

    if (!stage0Validation.ok) {
      return res.json({
        ok: false,
        run_id: runId,
        target_url: runtimePayload.target_url,
        mode: ACTIVE_DILIGENCE_RUNTIME,
        status: "STAGE0_MANIFEST_INVALID",
        phase_stack: {
          active: true,
          current_node: "S0",
          completed_nodes: [],
          next_node: "S0_RETRY",
          execution_map_loaded: promptStackStatus.ok === true
        },
        stage0_summary: stage0Summary,
        stage0_validation: stage0Validation,
        p1_summary: null,
        p1_validation: null,
        p1_parse: null,
        p1_model_meta: null,
        hybrid_extraction_manifest: manifest.hybrid_extraction_manifest,
        source_discovery_handoff: null,
        source_discovery_forensic_ledger: null,
        source_discovery_trace: null,
        legacy_monolith_active: false,
        final_output_handoff: null,
        machine_json: {
          run_meta: {
            run_id: runId,
            source_mode: sourceMode,
            target_url: runtimePayload.target_url,
            company_name: companyName,
            active_diligence_runtime: ACTIVE_DILIGENCE_RUNTIME
          },
          stage0_summary: stage0Summary,
          source_discovery_handoff: null,
          p1_summary: null,
          next_required_phase: "S0_RETRY"
        },
        html_report: "",
        audit: {
          stage0_validation: stage0Validation,
          p1_validation: null,
          p1_parse: null,
          prompt_stack_status: safePromptStackStatus()
        },
        vault_payload: null
      });
    }

    const p1Result = await runP1SourceDiscovery({
      runId,
      targetUrl: runtimePayload.target_url,
      companyName,
      sourceMode,
      hybridExtractionManifest: manifest.hybrid_extraction_manifest,
      promptStackStatus,
      callModel: async ({ poolName, systemInstruction, userMessage, allowGrounding }) => callGeminiWithFallback({
        systemPrompt: systemInstruction,
        userPrompt: userMessage,
        responseMimeType: "application/json",
        timeoutMs: GEMINI_TIMEOUT_MS,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        temperature: 0,
        returnMeta: true,
        allowGrounding: allowGrounding === true,
        poolName
      })
    });

    const p1Output = p1Result.p1_output || {};
    const sourceDiscoveryHandoff = p1Output.source_discovery_handoff || null;
    const sourceDiscoveryForensicLedger = p1Output.source_discovery_forensic_ledger || null;
    const sourceDiscoveryTrace = p1Output.source_discovery_trace || null;

    if (!p1Result.ok) {
      return res.json({
        ok: false,
        run_id: runId,
        target_url: runtimePayload.target_url,
        mode: "phase_stack_p1",
        status: p1Result.status,
        phase_stack: {
          active: true,
          current_node: "P1",
          completed_nodes: ["S0"],
          next_node: p1Result.next_node,
          execution_map_loaded: promptStackStatus.ok === true
        },
        stage0_summary: stage0Summary,
        stage0_validation: stage0Validation,
        p1_summary: p1Result.p1_summary,
        p1_validation: p1Result.p1_validation,
        p1_parse: p1Result.p1_parse,
        p2_summary: null,
        p2_validation: null,
        p2_parse: null,
        p3_summary: null,
        p3_validation: null,
        p3_parse: null,
        p1_model_meta: p1Result.model_meta,
        p2_model_meta: null,
        p3_model_meta: null,
        hybrid_extraction_manifest: manifest.hybrid_extraction_manifest,
        source_discovery_handoff: sourceDiscoveryHandoff,
        source_discovery_forensic_ledger: sourceDiscoveryForensicLedger,
        source_discovery_trace: sourceDiscoveryTrace,
        target_profile: null,
        target_profile_forensic_ledger: null,
        target_profile_trace: null,
        target_feature_profile: null,
        feature_profile_forensic_ledger: null,
        feature_function_trace: null,
        final_output_handoff: null,
        legacy_monolith_active: false,
        machine_json: {
          run_meta: buildRunMeta({ runId, sourceMode, targetUrl: runtimePayload.target_url, companyName }),
          stage0_summary: stage0Summary,
          source_discovery_handoff: sourceDiscoveryHandoff,
          target_profile: null,
          target_feature_profile: null,
          p1_summary: p1Result.p1_summary,
          p2_summary: null,
          p3_summary: null,
          next_required_phase: "P1_RETRY_OR_REPAIR"
        },
        html_report: "",
        audit: {
          stage0_validation: stage0Validation,
          p1_validation: p1Result.p1_validation,
          p1_parse: p1Result.p1_parse,
          p2_validation: null,
          p2_parse: null,
          p3_validation: null,
          p3_parse: null,
          prompt_stack_status: safePromptStackStatus()
        },
        vault_payload: null
      });
    }

    const callPhaseModel = async ({ poolName, systemInstruction, userMessage, allowGrounding }) => callGeminiWithFallback({
      systemPrompt: systemInstruction,
      userPrompt: userMessage,
      responseMimeType: "application/json",
      timeoutMs: GEMINI_TIMEOUT_MS,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      temperature: 0,
      returnMeta: true,
      allowGrounding: allowGrounding === true,
      poolName
    });

    const p2Result = await runP2TargetProfile({
      runId,
      targetUrl: runtimePayload.target_url,
      companyName,
      sourceMode,
      hybridExtractionManifest: manifest.hybrid_extraction_manifest,
      sourceDiscoveryHandoff,
      sourceDiscoveryForensicLedger,
      sourceDiscoveryTrace,
      promptStackStatus,
      callModel: callPhaseModel
    });

    if (!p2Result.ok) {
      return res.json({
        ok: false,
        run_id: runId,
        target_url: runtimePayload.target_url,
        mode: "phase_stack_p2",
        status: p2Result.status,
        phase_stack: {
          active: true,
          current_node: "P2",
          completed_nodes: ["S0", "P1"],
          next_node: p2Result.next_node,
          execution_map_loaded: promptStackStatus.ok === true
        },
        stage0_summary: stage0Summary,
        stage0_validation: stage0Validation,
        p1_summary: p1Result.p1_summary,
        p1_validation: p1Result.p1_validation,
        p1_parse: p1Result.p1_parse,
        p2_summary: p2Result.p2_summary,
        p2_validation: p2Result.p2_validation,
        p2_parse: p2Result.p2_parse,
        p3_summary: null,
        p3_validation: null,
        p3_parse: null,
        p1_model_meta: p1Result.model_meta,
        p2_model_meta: p2Result.model_meta,
        p3_model_meta: null,
        hybrid_extraction_manifest: manifest.hybrid_extraction_manifest,
        source_discovery_handoff: sourceDiscoveryHandoff,
        source_discovery_forensic_ledger: sourceDiscoveryForensicLedger,
        source_discovery_trace: sourceDiscoveryTrace,
        target_profile: null,
        target_profile_forensic_ledger: null,
        target_profile_trace: null,
        target_feature_profile: null,
        feature_profile_forensic_ledger: null,
        feature_function_trace: null,
        final_output_handoff: null,
        legacy_monolith_active: false,
        machine_json: {
          run_meta: buildRunMeta({ runId, sourceMode, targetUrl: runtimePayload.target_url, companyName }),
          stage0_summary: stage0Summary,
          source_discovery_handoff: sourceDiscoveryHandoff,
          target_profile: null,
          target_feature_profile: null,
          p1_summary: p1Result.p1_summary,
          p2_summary: p2Result.p2_summary,
          p3_summary: null,
          next_required_phase: "P2_RETRY_OR_REPAIR"
        },
        html_report: "",
        audit: {
          stage0_validation: stage0Validation,
          p1_validation: p1Result.p1_validation,
          p1_parse: p1Result.p1_parse,
          p2_validation: p2Result.p2_validation,
          p2_parse: p2Result.p2_parse,
          p3_validation: null,
          p3_parse: null,
          prompt_stack_status: safePromptStackStatus()
        },
        vault_payload: null
      });
    }

    const p3Result = await runP3TargetFeatureProfile({
      runId,
      targetUrl: runtimePayload.target_url,
      companyName,
      sourceMode,
      hybridExtractionManifest: manifest.hybrid_extraction_manifest,
      sourceDiscoveryHandoff,
      sourceDiscoveryForensicLedger,
      sourceDiscoveryTrace,
      targetProfile: p2Result.target_profile,
      targetProfileForensicLedger: p2Result.target_profile_forensic_ledger,
      targetProfileTrace: p2Result.target_profile_trace,
      promptStackStatus,
      callModel: callPhaseModel
    });

    if (!p3Result.ok) {
      return res.json({
        ok: false,
        run_id: runId,
        target_url: runtimePayload.target_url,
        mode: "phase_stack_p3",
        status: p3Result.status,
        phase_stack: {
          active: true,
          current_node: "P3",
          completed_nodes: ["S0", "P1", "P2"],
          next_node: p3Result.next_node,
          execution_map_loaded: promptStackStatus.ok === true
        },
        stage0_summary: stage0Summary,
        stage0_validation: stage0Validation,
        p1_summary: p1Result.p1_summary,
        p1_validation: p1Result.p1_validation,
        p1_parse: p1Result.p1_parse,
        p2_summary: p2Result.p2_summary,
        p2_validation: p2Result.p2_validation,
        p2_parse: p2Result.p2_parse,
        p3_summary: p3Result.p3_summary,
        p3_validation: p3Result.p3_validation,
        p3_parse: p3Result.p3_parse,
        p1_model_meta: p1Result.model_meta,
        p2_model_meta: p2Result.model_meta,
        p3_model_meta: p3Result.model_meta,
        hybrid_extraction_manifest: manifest.hybrid_extraction_manifest,
        source_discovery_handoff: sourceDiscoveryHandoff,
        source_discovery_forensic_ledger: sourceDiscoveryForensicLedger,
        source_discovery_trace: sourceDiscoveryTrace,
        target_profile: p2Result.target_profile,
        target_profile_forensic_ledger: p2Result.target_profile_forensic_ledger,
        target_profile_trace: p2Result.target_profile_trace,
        target_feature_profile: null,
        feature_profile_forensic_ledger: null,
        feature_function_trace: null,
        final_output_handoff: null,
        legacy_monolith_active: false,
        machine_json: {
          run_meta: buildRunMeta({ runId, sourceMode, targetUrl: runtimePayload.target_url, companyName }),
          stage0_summary: stage0Summary,
          source_discovery_handoff: sourceDiscoveryHandoff,
          target_profile: p2Result.target_profile,
          target_feature_profile: null,
          p1_summary: p1Result.p1_summary,
          p2_summary: p2Result.p2_summary,
          p3_summary: p3Result.p3_summary,
          next_required_phase: "P3_RETRY_OR_REPAIR"
        },
        html_report: "",
        audit: {
          stage0_validation: stage0Validation,
          p1_validation: p1Result.p1_validation,
          p1_parse: p1Result.p1_parse,
          p2_validation: p2Result.p2_validation,
          p2_parse: p2Result.p2_parse,
          p3_validation: p3Result.p3_validation,
          p3_parse: p3Result.p3_parse,
          prompt_stack_status: safePromptStackStatus()
        },
        vault_payload: null
      });
    }

    return res.json({
      ok: p3Result.ok,
      run_id: runId,
      target_url: runtimePayload.target_url,
      mode: "phase_stack_p3",
      status: p3Result.status,
      phase_stack: {
        active: true,
        current_node: "P3",
        completed_nodes: ["S0", "P1", "P2", "P3"],
        next_node: p3Result.next_node,
        execution_map_loaded: promptStackStatus.ok === true
      },
      stage0_summary: stage0Summary,
      stage0_validation: stage0Validation,
      p1_summary: p1Result.p1_summary,
      p1_validation: p1Result.p1_validation,
      p1_parse: p1Result.p1_parse,
      p2_summary: p2Result.p2_summary,
      p2_validation: p2Result.p2_validation,
      p2_parse: p2Result.p2_parse,
      p3_summary: p3Result.p3_summary,
      p3_validation: p3Result.p3_validation,
      p3_parse: p3Result.p3_parse,
      p1_model_meta: p1Result.model_meta,
      p2_model_meta: p2Result.model_meta,
      p3_model_meta: p3Result.model_meta,
      hybrid_extraction_manifest: manifest.hybrid_extraction_manifest,
      source_discovery_handoff: sourceDiscoveryHandoff,
      source_discovery_forensic_ledger: sourceDiscoveryForensicLedger,
      source_discovery_trace: sourceDiscoveryTrace,
      target_profile: p2Result.target_profile,
      target_profile_forensic_ledger: p2Result.target_profile_forensic_ledger,
      target_profile_trace: p2Result.target_profile_trace,
      target_feature_profile: p3Result.target_feature_profile,
      feature_profile_forensic_ledger: p3Result.feature_profile_forensic_ledger,
      feature_function_trace: p3Result.feature_function_trace,
      legacy_monolith_active: false,
      final_output_handoff: null,
      machine_json: {
        run_meta: buildRunMeta({ runId, sourceMode, targetUrl: runtimePayload.target_url, companyName }),
        stage0_summary: stage0Summary,
        source_discovery_handoff: sourceDiscoveryHandoff,
        target_profile: p2Result.target_profile,
        target_feature_profile: p3Result.target_feature_profile,
        p1_summary: p1Result.p1_summary,
        p2_summary: p2Result.p2_summary,
        p3_summary: p3Result.p3_summary,
        next_required_phase: "P4_LEGAL_CARTOGRAPHY_INDEX"
      },
      html_report: "",
      audit: {
        stage0_validation: stage0Validation,
        p1_validation: p1Result.p1_validation,
        p1_parse: p1Result.p1_parse,
        p2_validation: p2Result.p2_validation,
        p2_parse: p2Result.p2_parse,
        p3_validation: p3Result.p3_validation,
        p3_parse: p3Result.p3_parse,
        prompt_stack_status: safePromptStackStatus()
      },
      vault_payload: null
    });
  } catch (err) {
    console.error("[diligence/run] stage0 failed", err);
    return res.status(500).json({
      ok: false,
      error: "STAGE0_RUN_FAILED",
      message: err?.message || String(err),
      mode: ACTIVE_DILIGENCE_RUNTIME,
      legacy_monolith_active: false,
      final_output_handoff: null,
      machine_json: { run_meta: {}, stage0_summary: {}, next_required_phase: "P1_SOURCE_DISCOVERY_EVIDENCE_BOX" },
      html_report: "",
      audit: { stage0_validation: { ok: false, errors: [err?.message || "STAGE0_RUN_FAILED"], warnings: [] }, prompt_stack_status: safePromptStackStatus() },
      vault_payload: null
    });
  }
});
app.post("/api/vault/push", async (req, res) => {
  const vaultUrl = process.env.VAULT_ASSEMBLY_ENDPOINT || "";
  if (!vaultUrl) {
    return res.json({
      ok: true,
      mode: "LOCAL_ACK_ONLY",
      message: "Vault Assembly endpoint not configured. Handoff payload accepted locally.",
      received: {
        run_id: req.body?.run_id || "N/A",
        has_handoff: Boolean(req.body?.vault_assembly_handoff),
        has_machine_json: Boolean(req.body?.machine_json),
        has_html_report: Boolean(req.body?.html_report)
      }
    });
  }

  try {
    const response = await fetch(vaultUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.VAULT_ASSEMBLY_TOKEN ? { authorization: `Bearer ${process.env.VAULT_ASSEMBLY_TOKEN}` } : {})
      },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    return res.status(response.ok ? 200 : 502).json({
      ok: response.ok,
      status: response.status,
      vault_response: safeJsonOrText(text)
    });
  } catch (err) {
    return res.status(502).json({ ok: false, error: "VAULT_PUSH_FAILED", message: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Interface Diligence System listening on :${PORT}`);
  console.log(`Mode: ${DILIGENCE_MODE}`);
  console.log(`Gemini models: ${GEMINI_MODELS.join(", ")}`);
  console.log(`Gemini key pool size: ${GEMINI_POOL.length}`);
  console.log(`Diligence pool foundation: diligence_pool_v1 pools=${Object.keys(DILIGENCE_POOLS).length}`);
  console.log(`Hybrid fetcher: hybrid_v1 enabled=${HYBRID_FETCH_ENABLED} grounding=${HYBRID_GROUNDING_ALLOWED}`);
});

function buildRunMeta({
  runId,
  targetUrl,
  companyName,
  sourceMode,
  startedAt,
  completedAt,
  activeRuntime,
  completedNodes = [],
  currentNode = null,
  nextNode = null
} = {}) {
  return {
    run_id: runId || null,
    target_url: targetUrl || "",
    company_name: companyName || "",
    source_mode: sourceMode || "",
    active_runtime: activeRuntime || ACTIVE_DILIGENCE_RUNTIME,
    completed_nodes: completedNodes,
    current_node: currentNode,
    next_node: nextNode,
    started_at: startedAt || null,
    completed_at: completedAt || new Date().toISOString()
  };
}

function parseBool(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseKeyPool() {
  const multi = process.env.GEMINI_API_KEYS || "";
  const single = process.env.GEMINI_API_KEY || "";
  const keys = multi.split(",").map((x) => x.trim()).filter(Boolean);
  if (single.trim()) keys.push(single.trim());
  return Array.from(new Set(keys));
}

function parseModelPool() {
  const multi = process.env.GEMINI_MODELS || "";
  const single = process.env.GEMINI_MODEL || "";
  const raw = multi.trim() ? multi : single;
  const models = raw.split(",").map((x) => x.trim()).filter(Boolean);
  return Array.from(new Set(models.length ? models : DEFAULT_GEMINI_MODELS));
}

function buildGeminiPool(keys) {
  return keys.map((key, index) => ({
    index: index + 1,
    key,
    fingerprint: crypto.createHash("sha256").update(key).digest("hex").slice(0, 12)
  }));
}

function buildGeminiModelPool(models) {
  return models.map((model, index) => ({ index: index + 1, model }));
}

function publicPoolSnapshot() {
  return GEMINI_POOL.map((entry) => ({
    index: entry.index,
    configured: true,
    fingerprint: entry.fingerprint
  }));
}

function buildDiligencePools() {
  const pools = {};
  for (const [name, definition] of Object.entries(DILIGENCE_POOL_DEFINITIONS)) {
    const keys = parseRoleKeyPool(definition);
    const models = parseRoleModelPool(definition);
    pools[name] = {
      name,
      label: definition.label,
      keys: buildGeminiPool(keys),
      models: buildGeminiModelPool(models),
      grounding_default: Boolean(definition.groundingDefault),
      fallback_pool: definition.fallbackPool || null,
      env: {
        keys: definition.keyEnv,
        single_key: definition.singleKeyEnv,
        models: definition.modelEnv,
        single_model: definition.singleModelEnv
      }
    };
  }
  return pools;
}

function parseRoleKeyPool(definition) {
  const multi = process.env[definition.keyEnv] || "";
  const single = process.env[definition.singleKeyEnv] || "";
  const migrationMulti = process.env.GEMINI_API_KEYS || "";
  const migrationSingle = process.env.GEMINI_API_KEY || "";

  const raw = [multi, single, migrationMulti, migrationSingle].join(",");
  return Array.from(new Set(raw.split(",").map((x) => x.trim()).filter(Boolean)));
}

function parseRoleModelPool(definition) {
  const multi = process.env[definition.modelEnv] || "";
  const single = process.env[definition.singleModelEnv] || "";
  const migrationMulti = process.env.GEMINI_MODELS || "";
  const migrationSingle = process.env.GEMINI_MODEL || "";
  const raw = multi.trim() ? multi : (single.trim() ? single : (migrationMulti.trim() ? migrationMulti : migrationSingle));
  const models = raw.split(",").map((x) => x.trim()).filter(Boolean);
  return Array.from(new Set(models.length ? models : definition.defaultModels));
}

function getExecutionPool(poolName = "default") {
  if (!poolName || poolName === "default") {
    return {
      name: "default",
      label: "Legacy simple Gemini pool",
      keys: GEMINI_POOL,
      models: GEMINI_MODEL_POOL,
      grounding_default: false,
      fallback_pool: null
    };
  }

  const selected = DILIGENCE_POOLS[poolName];
  if (selected) return selected;

  return {
    name: "default",
    label: `Unknown pool requested (${poolName}); using legacy simple Gemini pool`,
    keys: GEMINI_POOL,
    models: GEMINI_MODEL_POOL,
    grounding_default: false,
    fallback_pool: null
  };
}

function publicDiligencePoolsSnapshot() {
  return Object.fromEntries(
    Object.entries(DILIGENCE_POOLS).map(([name, pool]) => [
      name,
      {
        label: pool.label,
        configured: pool.keys.length > 0 && pool.models.length > 0,
        key_count: pool.keys.length,
        model_count: pool.models.length,
        models: pool.models.map((entry) => entry.model),
        key_pool: pool.keys.map((entry) => ({
          index: entry.index,
          configured: true,
          fingerprint: entry.fingerprint
        })),
        grounding_default: pool.grounding_default,
        fallback_pool: pool.fallback_pool,
        env: pool.env
      }
    ])
  );
}

function createRunId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `diligence_${stamp}_${rand}`;
}

async function safeReferenceBundle() {
  try {
    return await referenceBundlePromise;
  } catch (err) {
    return { ok: false, error: err?.message || String(err), manifest: [] };
  }
}

async function loadReferenceBundle() {
  const entries = await Promise.all(
    Object.entries(PROMPT_LIVE_FILES).map(async ([key, relativePath]) => {
      const absolutePath = path.join(__dirname, relativePath);
      const content = await fs.readFile(absolutePath, "utf8");
      return [key, { relativePath, content, chars: content.length }];
    })
  );

  const bundle = Object.fromEntries(entries);
  const registryRowCount = estimateCsvDataRows(bundle.registryCsv.content);
  return {
    ok: true,
    monolith: bundle.monolith.content,
    registryKey: bundle.registryKey.content,
    registryCsv: bundle.registryCsv.content,
    hunterEngineRules: bundle.hunterEngineRules.content,
    vaultMap: bundle.vaultMap.content,
    contractSpine: bundle.contractSpine.content,
    registry_row_count_estimate: registryRowCount,
    manifest: Object.entries(bundle).map(([key, value]) => ({
      key,
      path: value.relativePath,
      chars: value.chars
    }))
  };
}

function estimateCsvDataRows(csvText) {
  return Math.max(0, String(csvText || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length - 1);
}

function safePromptStackStatus() {
  return {
    ok: promptStackStatus.ok === true,
    stack_dir: promptStackStatus.stack_dir,
    reference_dir: promptStackStatus.reference_dir,
    loaded_phase_stack_files: promptStackStatus.loaded_phase_stack_files || [],
    loaded_reference_files: promptStackStatus.loaded_reference_files || [],
    missing_phase_stack_files: promptStackStatus.missing_phase_stack_files || [],
    missing_reference_files: promptStackStatus.missing_reference_files || [],
    missing_optional_reference_files: promptStackStatus.missing_optional_reference_files || [],
    execution_graph_summary: promptStackStatus.execution_graph_summary || [],
    phase_pool_bindings: promptStackStatus.phase_pool_bindings || {},
    validation_errors: promptStackStatus.validation_errors || [],
    validation_warnings: promptStackStatus.validation_warnings || []
  };
}

function emptyHybridEvidencePacket(runtimePayload) {
  return {
    mode: "hybrid_v1",
    status: "NO_FETCH_SYNTHETIC_DEMO",
    target_url: runtimePayload.target_url || "N/A",
    source_mode: runtimePayload.source_mode || "synthetic_demo",
    grounding_allowed: false,
    source_review: {
      primary_attempted: 0,
      primary_ingested: 0,
      secondary_attempted: 0,
      secondary_ingested: 0,
      total_fetch_attempts: 0,
      evidence_entries: 0,
      artifact_inventory_entries: 0,
      jina_used: false,
      grounding_allowed: false,
      evidence_buffer_size_chars: 0
    },
    primary_paths: [],
    secondary_paths: [],
    direct_fetch_attempts: [],
    candidate_links: [],
    evidence_buffer: [],
    artifact_inventory: [],
    warnings: ["SYNTHETIC_DEMO_NO_FETCH"]
  };
}
async function buildHybridEvidencePacket(runtimePayload) {
  const warnings = ["SERVER_REFERENCE_BUNDLE_LOADED"];
  const evidenceBuffer = [];
  const artifactInventory = [];
  const directFetchAttempts = [];
  const candidateLinks = [];
  const sourceMode = runtimePayload.source_mode || "url";

  if (!HYBRID_FETCH_ENABLED) {
    warnings.push("HYBRID_FETCH_DISABLED_BY_ENV");
  }

  if ((sourceMode === "text" || sourceMode === "url_plus_text") && runtimePayload.pasted_public_material) {
    const pasted = truncateChars(String(runtimePayload.pasted_public_material), HYBRID_MAX_CHARS_PER_SOURCE);
    evidenceBuffer.push({
      source_id: nextSourceId(evidenceBuffer.length),
      source_url: runtimePayload.target_url && runtimePayload.target_url !== "N/A" ? runtimePayload.target_url : "PASTED_PUBLIC_MATERIAL",
      source_type: "PASTED_PUBLIC_MATERIAL",
      ingestion_method: "PASTED_TEXT",
      artifact_type: "Other",
      evidence_text: pasted,
      evidence_scope: "PRODUCT",
      first_party_basis: "User supplied pasted material represented as public product/legal/governance text."
    });
    artifactInventory.push({
      artifact_type: "Other",
      artifact_class: "PRODUCT_SURFACE",
      status: "INGESTED",
      source_url: runtimePayload.target_url && runtimePayload.target_url !== "N/A" ? runtimePayload.target_url : "PASTED_PUBLIC_MATERIAL",
      ingestion_method: "PASTED_TEXT",
      evidence_summary: summarizeText(pasted),
      absence_basis: "N/A",
      warning: "MANUAL_OVERRIDE_PASTED_TEXT_USED"
    });
    warnings.push("MANUAL_OVERRIDE_PASTED_TEXT_USED");
  }

  if (HYBRID_FETCH_ENABLED && sourceMode !== "text" && runtimePayload.target_url && runtimePayload.target_url !== "N/A") {
    const rootUrl = normalizeTargetUrl(runtimePayload.target_url);
    if (rootUrl) {
      const queued = [];
      const seen = new Set();
      const enqueue = (url, bucket, discoveryBasis = "seed_path") => {
        const normalized = normalizeTargetUrl(url);
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        queued.push({ url: normalized, bucket, discovery_basis: discoveryBasis });
      };

      for (const rel of PRIMARY_PATHS) enqueue(new URL(rel, rootUrl).toString(), "PRIMARY");
      for (const rel of SECONDARY_PATHS) enqueue(new URL(rel, rootUrl).toString(), "SECONDARY");

      let fetchedCount = 0;
      for (let i = 0; i < queued.length && fetchedCount < HYBRID_MAX_PAGES; i += 1) {
        const entry = queued[i];
        const fetched = await fetchEvidenceUrl(entry.url, entry.bucket, entry.discovery_basis);
        directFetchAttempts.push(...fetched.attempts);

        if (!fetched.ok) continue;

        fetchedCount += 1;
        const classification = classifyArtifact(entry.url);
        const sourceId = nextSourceId(evidenceBuffer.length);
        evidenceBuffer.push({
          source_id: sourceId,
          source_url: entry.url,
          source_type: "TARGET_DOMAIN",
          ingestion_method: fetched.ingestion_method,
          artifact_type: classification.artifact_type,
          evidence_text: fetched.text,
          evidence_scope: classification.evidence_scope,
          first_party_basis: `Same-origin URL under ${new URL(rootUrl).origin}; bucket=${entry.bucket}; discovery=${entry.discovery_basis}.`
        });
        artifactInventory.push({
          artifact_type: classification.artifact_type,
          artifact_class: classification.artifact_class,
          status: "INGESTED",
          source_url: entry.url,
          ingestion_method: fetched.ingestion_method,
          evidence_summary: summarizeText(fetched.text),
          absence_basis: "N/A",
          warning: fetched.warning || "N/A"
        });

        for (const link of discoverCandidateLinks(fetched.raw_html || "", entry.url, rootUrl)) {
          if (candidateLinks.length >= HYBRID_MAX_DISCOVERED_LINKS) break;
          candidateLinks.push(link);
          enqueue(link.url, link.bucket, link.discovery_basis);
        }
      }
    } else {
      warnings.push("HYBRID_FETCH_SKIPPED_INVALID_TARGET_URL");
    }
  }

  appendAbsentCoreLegalArtifacts(artifactInventory);

  const primaryAttempted = directFetchAttempts.filter((x) => x.bucket === "PRIMARY").length;
  const secondaryAttempted = directFetchAttempts.filter((x) => x.bucket === "SECONDARY").length;
  const jinaUsed = directFetchAttempts.some((x) => x.method === "JINA_FETCH" && x.status === "INGESTED");

  if (!evidenceBuffer.length) warnings.push("NO_EVIDENCE_BUFFER_ENTRIES_AFTER_HYBRID_FETCH");
  if (!artifactInventory.some((x) => x.artifact_class === "CORE_LEGAL" && x.status === "INGESTED")) {
    warnings.push("NO_CORE_LEGAL_ARTIFACTS_INGESTED");
  }

  return {
    mode: "hybrid_v1",
    status: evidenceBuffer.length ? "EVIDENCE_PACKET_READY" : "NO_EVIDENCE_INGESTED",
    target_url: runtimePayload.target_url || "N/A",
    source_mode: sourceMode,
    grounding_allowed: HYBRID_GROUNDING_ALLOWED,
    source_review: {
      primary_attempted: primaryAttempted,
      primary_ingested: countInventoryByBucket(artifactInventory, "PRIMARY"),
      secondary_attempted: secondaryAttempted,
      secondary_ingested: countInventoryByBucket(artifactInventory, "SECONDARY"),
      total_fetch_attempts: directFetchAttempts.length,
      evidence_entries: evidenceBuffer.length,
      artifact_inventory_entries: artifactInventory.length,
      jina_used: jinaUsed,
      grounding_allowed: HYBRID_GROUNDING_ALLOWED,
      evidence_buffer_size_chars: evidenceBuffer.reduce((sum, entry) => sum + String(entry.evidence_text || "").length, 0)
    },
    primary_paths: PRIMARY_PATHS,
    secondary_paths: SECONDARY_PATHS,
    direct_fetch_attempts: directFetchAttempts,
    candidate_links: candidateLinks,
    evidence_buffer: evidenceBuffer,
    artifact_inventory: artifactInventory,
    warnings
  };
}

async function fetchEvidenceUrl(url, bucket, discoveryBasis) {
  const attempts = [];
  const direct = await fetchTextWithTimeout(url, "DIRECT_FETCH", bucket, discoveryBasis);
  attempts.push(direct.attempt);
  if (direct.ok && isSubstantiveText(direct.text)) {
    return {
      ok: true,
      text: truncateChars(cleanText(direct.text), HYBRID_MAX_CHARS_PER_SOURCE),
      raw_html: direct.raw_text,
      ingestion_method: "DIRECT_FETCH",
      attempts,
      warning: "N/A"
    };
  }

  const jinaUrl = toJinaUrl(url);
  const jina = await fetchTextWithTimeout(jinaUrl, "JINA_FETCH", bucket, discoveryBasis, url);
  attempts.push(jina.attempt);
  if (jina.ok && isSubstantiveText(jina.text)) {
    return {
      ok: true,
      text: truncateChars(cleanText(jina.text), HYBRID_MAX_CHARS_PER_SOURCE),
      raw_html: direct.raw_text || "",
      ingestion_method: "WEB",
      attempts,
      warning: "JINA_FALLBACK_USED"
    };
  }

  return { ok: false, text: "", raw_html: "", ingestion_method: "NONE", attempts };
}

async function fetchTextWithTimeout(url, method, bucket, discoveryBasis, sourceUrlOverride = "") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HYBRID_FETCH_TIMEOUT_MS);
  const startedAt = Date.now();
  const sourceUrl = sourceUrlOverride || url;

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "InterfaceDiligenceSystem/1.0 (+https://lexnovahq.com)"
      }
    });
    const raw = await response.text();
    const cleaned = cleanText(raw);
    const ok = response.ok && isSubstantiveText(cleaned);
    return {
      ok,
      text: cleaned,
      raw_text: raw,
      attempt: {
        source_url: sourceUrl,
        fetch_url: url,
        method,
        bucket,
        discovery_basis: discoveryBasis,
        status: ok ? "INGESTED" : "ACCESS_FAILED",
        http_status: response.status,
        chars: cleaned.length,
        latency_ms: Date.now() - startedAt,
        warning: ok ? "N/A" : `FETCH_RETURNED_${response.status}_OR_INSUFFICIENT_TEXT`
      }
    };
  } catch (err) {
    return {
      ok: false,
      text: "",
      raw_text: "",
      attempt: {
        source_url: sourceUrl,
        fetch_url: url,
        method,
        bucket,
        discovery_basis: discoveryBasis,
        status: "ACCESS_FAILED",
        http_status: 0,
        chars: 0,
        latency_ms: Date.now() - startedAt,
        warning: err?.name === "AbortError" ? "FETCH_TIMEOUT" : (err?.message || String(err))
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}

function discoverCandidateLinks(rawHtml, pageUrl, rootUrl) {
  if (!rawHtml || !String(rawHtml).includes("href")) return [];

  const root = new URL(rootUrl);
  const links = [];
  const seen = new Set();
  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRe.exec(rawHtml)) && links.length < HYBRID_MAX_DISCOVERED_LINKS) {
    const href = match[1];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    let candidate;
    try {
      candidate = new URL(href, pageUrl);
    } catch {
      continue;
    }

    if (candidate.origin !== root.origin) continue;
    if (DISCOVERY_REJECT_RE.test(candidate.pathname)) continue;
    if (!DISCOVERY_ALLOW_RE.test(candidate.pathname)) continue;

    candidate.hash = "";
    const normalized = candidate.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    links.push({
      url: normalized,
      bucket: classifyDiscoveryBucket(candidate.pathname),
      discovery_basis: `same_origin_link_from:${pageUrl}`
    });
  }

  return links;
}

function classifyDiscoveryBucket(pathname) {
  const p = String(pathname || "").toLowerCase();
  if (/^\/(pricing|enterprise|api|docs|developers|integrations|customers|use-cases)(\/|$)/.test(p)) return "SECONDARY";
  return "PRIMARY";
}

function classifyArtifact(url) {
  let p = "/";
  try {
    p = new URL(url).pathname.toLowerCase();
  } catch {
    p = "/";
  }

  if (p === "/" || p === "/home") return artifact("Homepage", "COMPANY_SURFACE", "COMPANY");
  if (p.includes("about") || p.includes("company")) return artifact("Other", "COMPANY_SURFACE", "COMPANY");
  if (p.includes("terms-of-service") || p === "/terms" || p.includes("/terms/")) return artifact("ToS", "CORE_LEGAL", "LEGAL");
  if (p.includes("privacy")) return artifact("Privacy Policy", "CORE_LEGAL", "LEGAL");
  if (p.includes("dpa") || p.includes("data-processing")) return artifact("DPA", "CORE_LEGAL", "LEGAL");
  if (p.includes("acceptable-use") || p.includes("/aup")) return artifact("AUP", "CORE_LEGAL", "LEGAL");
  if (p.includes("sla") || p.includes("service-level")) return artifact("SLA", "CORE_LEGAL", "LEGAL");
  if (p.includes("subprocessor")) return artifact("Subprocessor Page", "GOVERNANCE_SURFACE", "GOVERNANCE");
  if (p.includes("trust")) return artifact("Trust Center", "GOVERNANCE_SURFACE", "TRUST");
  if (p.includes("security")) return artifact("Security Page", "GOVERNANCE_SURFACE", "SECURITY");
  if (p.includes("legal")) return artifact("Legal Center", "GOVERNANCE_SURFACE", "LEGAL");
  if (p.includes("developer")) return artifact("Developer Docs", "GOVERNANCE_SURFACE", "PRODUCT");
  if (p.includes("docs")) return artifact("Documentation", "GOVERNANCE_SURFACE", "PRODUCT");
  if (p.includes("api")) return artifact("API Docs", "GOVERNANCE_SURFACE", "PRODUCT");
  if (p.includes("pricing")) return artifact("Pricing Page", "PRODUCT_SURFACE", "PRODUCT");
  if (p.includes("product") || p.includes("platform") || p.includes("solution")) return artifact("Product Page", "PRODUCT_SURFACE", "PRODUCT");
  return artifact("Other", "PRODUCT_SURFACE", "FOOTPRINT_WIDE");
}

function artifact(artifact_type, artifact_class, evidence_scope) {
  return { artifact_type, artifact_class, evidence_scope };
}

function appendAbsentCoreLegalArtifacts(artifactInventory) {
  const core = ["ToS", "Privacy Policy", "DPA", "AUP", "SLA"];
  const present = new Set(
    artifactInventory
      .filter((entry) => entry.artifact_class === "CORE_LEGAL" && entry.status === "INGESTED")
      .map((entry) => entry.artifact_type)
  );

  for (const artifactType of core) {
    if (present.has(artifactType)) continue;
    artifactInventory.push({
      artifact_type: artifactType,
      artifact_class: "CORE_LEGAL",
      status: "ABSENT",
      source_url: "N/A",
      ingestion_method: "NONE",
      evidence_summary: "N/A",
      absence_basis: `Hybrid fetcher v1 attempted primary source family paths for ${artifactType}; no first-party page was ingested.`,
      warning: "ABSENCE_REQUIRES_MODEL_CONFIRMATION_OR_GROUNDED_DISCOVERY"
    });
  }
}

function countInventoryByBucket(artifactInventory, bucket) {
  return artifactInventory.filter((entry) => String(entry.source_url || "").includes("://") && bucketFromUrl(entry.source_url) === bucket).length;
}

function bucketFromUrl(url) {
  try {
    return classifyDiscoveryBucket(new URL(url).pathname);
  } catch {
    return "UNKNOWN";
  }
}

function summarizeText(text) {
  return truncateChars(String(text || "").replace(/\s+/g, " ").trim(), 280) || "N/A";
}

function nextSourceId(index) {
  return `src_${String(index + 1).padStart(3, "0")}`;
}

function toJinaUrl(url) {
  try {
    const parsed = new URL(url);
    return `https://r.jina.ai/http://${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    return `https://r.jina.ai/http://${String(url).replace(/^https?:\/\//i, "")}`;
  }
}

function cleanText(raw) {
  return String(raw || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isSubstantiveText(text) {
  return String(text || "").trim().length >= 120;
}

function truncateChars(value, maxChars) {
  const text = String(value || "");
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

function normalizeTargetUrl(rawValue) {
  let value = String(rawValue || "").trim();
  if (!value || value === "N/A") return "";
  value = value.replace(/^http:\/\//i, "https://");
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function buildPromptLiveUserPrompt({ runtimePayload, hybridEvidencePacket, referenceBundle }) {
  return [
    "# EXECUTION COMMAND",
    "Run the Diligence Engine against exactly one target using the runtime payload below.",
    "Do not use private documents. Do not use prior memory. Obey the monolithic prompt and reference documents.",
    "",
    "# RUNTIME PAYLOAD",
    fencedJson(runtimePayload),
    "",
    "# HYBRID EVIDENCE PACKET",
    "The server-side hybrid evidence packet below is the primary evidence source. Use it before any model-side search.",
    "If Google Search grounding is available, it is allowed only as fallback discovery or verification for first-party target-domain pages or qualifying hosted governance artifacts.",
    "Never admit third-party summaries, press, Crunchbase, PitchBook, reviews, investor blurbs, or directories as evidence.",
    "If evidence is thin, still evaluate every registry row exactly once using the 5-state matrix. Do not summarize the registry.",
    fencedJson(hybridEvidencePacket),
    "",
    "# REFERENCE DOCUMENTS",
    "These files are authoritative runtime references. Apply them in the priority and boundaries specified by the Diligence Runtime.",
    "",
    "## REGISTRY_KEY_v3_0.md",
    fencedText(referenceBundle.registryKey),
    "",
    "## AI_THREAT_REGISTRY_REGISTRY.csv",
    fencedText(referenceBundle.registryCsv),
    "",
    "## AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv",
    fencedText(referenceBundle.hunterEngineRules),
    "",
    "## VAULT_JS_CANONICAL_MAP_v1.md",
    fencedText(referenceBundle.vaultMap),
    "",
    "## INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md",
    fencedText(referenceBundle.contractSpine),
    "",
    "# TERMINAL OUTPUT REQUIREMENT",
    "Return the full terminal sequence required by the monolithic Diligence Runtime:",
    "1. <technical_audit_log> ... </technical_audit_log>",
    "2. <operator_challenge_gate> ... </operator_challenge_gate>",
    "3. fenced json Machine JSON Payload including assembly_handoff",
    "4. fenced html final report",
    "",
    "# NON-NEGOTIABLE GUARDRAIL",
    "registry_count_loaded must equal registry_count_evaluated.",
    "Every active registry row must produce exactly one visible ledger entry.",
    `The final HTML report must include this exact disclaimer: ${MANDATORY_DISCLAIMER}`
  ].join("\n");
}

function fencedJson(value) {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

function fencedText(value) {
  return `\`\`\`text\n${String(value || "")}\n\`\`\``;
}

function buildMockResult(runtimePayload) {
  return {
    ok: true,
    run_id: runtimePayload.run_id,
    target_url: runtimePayload.target_url,
    status: "MOCK_COMPLETED",
    parse_status: "MOCK",
    html_report: `<div class="interface-report"><h1>Diligence System Skeleton Live</h1><p>Target accepted: ${escapeHtml(runtimePayload.target_url)}</p><p>This is mock output. Prompt and reference documents are present. Real execution is available only in live or prompt_live mode.</p><p>${escapeHtml(MANDATORY_DISCLAIMER)}</p></div>`,
    technical_audit_log: "MOCK: Diligence System shell received the runtime payload and returned a mock report.",
    operator_challenge_gate: {
      completed: false,
      result: "MOCK_NOT_RUN",
      notes: ["Prompt-layer execution is intentionally skipped in mock mode."]
    },
    machine_json: {
      target_profile: {
        website: runtimePayload.target_url,
        company_name: runtimePayload.company_name || "N/A"
      },
      source_review: { mode: "MOCK" }
    },
    vault_assembly_handoff: {
      source: "interface_diligence_system",
      handoff_version: "mock_reference_ready",
      run_id: runtimePayload.run_id,
      target_url: runtimePayload.target_url,
      handoff_envelope: {
        status: "MOCK_READY",
        warnings: ["Vault handoff contract placeholder only. Real output available in live/prompt_live mode."]
      }
    },
    raw_output: ""
  };
}

async function callGeminiWithFallback({
  systemPrompt,
  userPrompt,
  responseMimeType,
  timeoutMs = GEMINI_TIMEOUT_MS,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  temperature = 0.2,
  returnMeta = false,
  allowGrounding,
  poolName = "default"
}) {
  const executionPool = getExecutionPool(poolName);
  const effectiveGrounding = allowGrounding === undefined ? executionPool.grounding_default : Boolean(allowGrounding);
  const errors = [];

  if (!executionPool.keys.length || !executionPool.models.length) {
    throw new Error(`DILIGENCE_POOL_NOT_CONFIGURED:${executionPool.name}:keys=${executionPool.keys.length}:models=${executionPool.models.length}`);
  }

  for (const modelEntry of executionPool.models) {
    for (const poolEntry of executionPool.keys) {
      try {
        const result = await callGeminiOnce({
          apiKey: poolEntry.key,
          model: modelEntry.model,
          systemPrompt,
          userPrompt,
          responseMimeType,
          timeoutMs,
          maxOutputTokens,
          temperature,
          allowGrounding: effectiveGrounding
        });
        if (result.text && result.text.trim()) {
          const meta = {
            text: result.text,
            pool_name: executionPool.name,
            model: modelEntry.model,
            key_index: poolEntry.index,
            fingerprint: poolEntry.fingerprint,
            grounding_used: result.grounding_used,
            grounding_metadata: result.grounding_metadata
          };
          return returnMeta ? meta : result.text;
        }
        errors.push({ pool_name: executionPool.name, model: modelEntry.model, key_index: poolEntry.index, fingerprint: poolEntry.fingerprint, error: "EMPTY_RESPONSE" });
      } catch (err) {
        const message = err?.message || String(err);
        errors.push({ pool_name: executionPool.name, model: modelEntry.model, key_index: poolEntry.index, fingerprint: poolEntry.fingerprint, error: message });
        console.warn(`[gemini:${executionPool.name}] model ${modelEntry.model} key ${poolEntry.index} failed: ${message}`);
      }
    }
  }

  throw new Error(`ALL_DILIGENCE_POOL_MODEL_KEY_COMBINATIONS_FAILED:${executionPool.name}:${JSON.stringify(errors).slice(0, 2500)}`);
}

async function callGeminiOnce({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  responseMimeType,
  timeoutMs = GEMINI_TIMEOUT_MS,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  temperature = 0.2,
  allowGrounding = false
}) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const generationConfig = { temperature, topP: 0.9, maxOutputTokens };
  if (responseMimeType && responseMimeType !== "text/plain") {
    generationConfig.responseMimeType = responseMimeType;
  }

  const bodyBase = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig
  };

  if (!allowGrounding) {
    return await executeGeminiRequest(endpoint, bodyBase, timeoutMs, false);
  }

  const groundedBody = {
    ...bodyBase,
    tools: [{ googleSearch: {} }]
  };

  try {
    return await executeGeminiRequest(endpoint, groundedBody, timeoutMs, true);
  } catch (err) {
    const message = err?.message || String(err);
    if (/googleSearch|Tool|tools|grounding|400|INVALID_ARGUMENT/i.test(message)) {
      console.warn(`[gemini] grounding rejected for ${model}; retrying without grounding: ${message}`);
      return await executeGeminiRequest(endpoint, bodyBase, timeoutMs, false);
    }
    throw err;
  }
}

async function executeGeminiRequest(endpoint, body, timeoutMs, groundingUsed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const bodyText = await response.text();
    if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}: ${bodyText.slice(0, 1000)}`);

    const parsed = JSON.parse(bodyText);
    const text = parsed?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
    if (!text.trim()) throw new Error(`GEMINI_EMPTY_TEXT: ${bodyText.slice(0, 1000)}`);

    return {
      text,
      grounding_used: groundingUsed,
      grounding_metadata: parsed?.candidates?.[0]?.groundingMetadata || null
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseDiligenceOutput(rawText) {
  const trimmed = String(rawText || "").trim();
  try {
    const json = JSON.parse(stripJsonFence(trimmed));
    return normalizeParsedJson(json, trimmed);
  } catch {
    // Continue to fenced-output parser.
  }

  const technicalAuditLog = extractTaggedBlock(trimmed, "technical_audit_log");
  const operatorChallengeRaw = extractTaggedBlock(trimmed, "operator_challenge_gate");
  const jsonFence = extractFence(trimmed, "json");
  const htmlFence = extractFence(trimmed, "html");

  if (technicalAuditLog || operatorChallengeRaw || jsonFence || htmlFence) {
    const machineJson = safeJsonOrText(jsonFence || "");
    return {
      parse_status: "FENCED_OUTPUT_OK",
      raw_output: trimmed,
      status: "COMPLETED",
      technical_audit_log: technicalAuditLog || "",
      operator_challenge_gate: safeJsonOrText(operatorChallengeRaw || "{}"),
      machine_json: typeof machineJson === "object" ? machineJson : { raw_machine_json: machineJson },
      html_report: htmlFence || `<div class="interface-report"><h2>Diligence Output</h2><pre>${escapeHtml(trimmed)}</pre></div>`,
      vault_assembly_handoff: extractVaultHandoff(machineJson)
    };
  }

  return {
    parse_status: "RAW_FALLBACK",
    raw_output: trimmed,
    status: "PARTIAL",
    technical_audit_log: "",
    operator_challenge_gate: {},
    machine_json: {},
    html_report: `<div class="interface-report"><h2>Raw Diligence Output</h2><pre>${escapeHtml(trimmed)}</pre></div>`,
    vault_assembly_handoff: {}
  };
}

function normalizeParsedJson(json, rawText) {
  const machineJson = json.machine_json || json;
  return {
    parse_status: "JSON_OK",
    raw_output: rawText,
    status: json.status || "COMPLETED",
    technical_audit_log: json.technical_audit_log || "",
    operator_challenge_gate: json.operator_challenge_gate || {},
    machine_json: machineJson || {},
    html_report: json.html_report || json.report_html || "",
    vault_assembly_handoff: json.vault_assembly_handoff || extractVaultHandoff(machineJson)
  };
}

function validatePromptLiveOutput({ parsed, expectedRegistryCount, expectedLegalStackSize }) {
  const machineJson = parsed.machine_json && typeof parsed.machine_json === "object" ? parsed.machine_json : {};
  const operator = parsed.operator_challenge_gate && typeof parsed.operator_challenge_gate === "object" ? parsed.operator_challenge_gate : {};

  const registryCountLoaded = firstNumber([
    operator.registry_count_loaded,
    machineJson.registry_count_loaded,
    machineJson?.technical_audit_log?.registry_count_loaded,
    extractNumber(parsed.raw_output, /registry_count_loaded["']?\s*[:=]\s*["']?(\d+)/i),
    extractNumber(parsed.technical_audit_log, /registry entries evaluated\s*:\s*(\d+)/i)
  ]);

  const registryCountEvaluated = firstNumber([
    operator.registry_count_evaluated,
    machineJson.registry_count_evaluated,
    machineJson?.technical_audit_log?.registry_count_evaluated,
    extractNumber(parsed.raw_output, /registry_count_evaluated["']?\s*[:=]\s*["']?(\d+)/i),
    extractNumber(parsed.technical_audit_log, /registry entries evaluated\s*:\s*(\d+)/i)
  ]);

  const ledger = findArrayByKey(machineJson, "registry_evaluation_ledger");
  const ledgerLength = Array.isArray(ledger) ? ledger.length : countUniqueThreatIds(`${parsed.technical_audit_log || ""}\n${parsed.raw_output || ""}`);

  const legalStack = findArrayByKey(machineJson, "legal_stack");
  const legalStackLength = Array.isArray(legalStack) ? legalStack.length : countLegalStackMarkers(parsed.raw_output || parsed.technical_audit_log || "");

  const errors = [];
  const warnings = [];

  if (!parsed.machine_json || !Object.keys(machineJson).length) errors.push("MACHINE_JSON_MISSING");
  if (!parsed.html_report || !String(parsed.html_report).trim()) errors.push("HTML_REPORT_MISSING");
  if (!String(parsed.html_report || "").includes(MANDATORY_DISCLAIMER)) errors.push("MANDATORY_DISCLAIMER_MISSING");

  if (expectedRegistryCount > 0) {
    if (registryCountLoaded !== null && registryCountLoaded !== expectedRegistryCount) {
      errors.push(`REGISTRY_COUNT_LOADED_MISMATCH:${registryCountLoaded}_EXPECTED_${expectedRegistryCount}`);
    }
    if (registryCountEvaluated === null) {
      errors.push(`REGISTRY_COUNT_EVALUATED_MISSING_EXPECTED_${expectedRegistryCount}`);
    } else if (registryCountEvaluated !== expectedRegistryCount) {
      errors.push(`REGISTRY_COUNT_EVALUATED_MISMATCH:${registryCountEvaluated}_EXPECTED_${expectedRegistryCount}`);
    }

    if (ledgerLength < expectedRegistryCount) {
      errors.push(`VISIBLE_LEDGER_INCOMPLETE:${ledgerLength}_EXPECTED_${expectedRegistryCount}`);
    }
  }

  if (legalStackLength !== expectedLegalStackSize) {
    errors.push(`LEGAL_STACK_SIZE_INVALID:${legalStackLength}_EXPECTED_${expectedLegalStackSize}`);
  }

  const operatorResult = String(operator.result || "").toUpperCase();
  if (operatorResult === "PASS" && errors.some((err) => err.includes("REGISTRY") || err.includes("LEDGER"))) {
    errors.push("OPERATOR_PASS_WITH_INCOMPLETE_REGISTRY");
  }

  if (parsed.parse_status === "RAW_FALLBACK") warnings.push("RAW_FALLBACK_USED");

  return {
    ok: errors.length === 0,
    status: errors.length ? "GUARDRAIL_FAILED" : "GUARDRAIL_PASSED",
    expected_registry_count: expectedRegistryCount,
    registry_count_loaded: registryCountLoaded,
    registry_count_evaluated: registryCountEvaluated,
    visible_ledger_count: ledgerLength,
    legal_stack_count: legalStackLength,
    errors,
    warnings
  };
}

function applyGuardrailToParsed(parsed, guardrail) {
  if (guardrail.ok) {
    return {
      ...parsed,
      status: parsed.status || "COMPLETED"
    };
  }

  const guardrailHtml = [
    `<div class="interface-report guardrail-failed">`,
    `<h1>Guardrail Failed</h1>`,
    `<p>The model returned output, but the server rejected it as an incomplete Diligence Engine result.</p>`,
    `<ul>${guardrail.errors.map((err) => `<li>${escapeHtml(err)}</li>`).join("")}</ul>`,
    `<p>Expected registry rows: ${escapeHtml(guardrail.expected_registry_count)}</p>`,
    `<p>Evaluated registry rows: ${escapeHtml(guardrail.registry_count_evaluated ?? "N/A")}</p>`,
    `<p>Visible ledger rows: ${escapeHtml(guardrail.visible_ledger_count)}</p>`,
    `<p>${escapeHtml(MANDATORY_DISCLAIMER)}</p>`,
    `</div>`,
    parsed.html_report || ""
  ].join("");

  return {
    ...parsed,
    status: "GUARDRAIL_FAILED",
    parse_status: `${parsed.parse_status || "UNKNOWN"}_GUARDRAIL_FAILED`,
    html_report: guardrailHtml
  };
}

function firstNumber(values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function extractNumber(text, pattern) {
  const match = String(text || "").match(pattern);
  return match ? Number(match[1]) : null;
}

function findArrayByKey(obj, key) {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj[key])) return obj[key];

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const found = findArrayByKey(value, key);
      if (Array.isArray(found)) return found;
    }
  }

  return null;
}

function countUniqueThreatIds(text) {
  const matches = String(text || "").match(/\b(?:UNI|DOE|JDG|CMP|CRT|RDR|ORC|TRN|SHD|OPT|MOV)_(?:CNS|LIA|HAL|INF|PRV|BIO|DEC|HRM|FRD|TRD)_(?:\d{3}|IN\d|LB\d)\b/g) || [];
  return new Set(matches).size;
}

function countLegalStackMarkers(text) {
  const labels = ["ToS", "Privacy Policy", "DPA", "AUP", "SLA"];
  return labels.filter((label) => new RegExp(`\\b${label.replace(/\s+/g, "\\s+")}\\b`, "i").test(String(text || ""))).length;
}

function extractVaultHandoff(machineJson) {
  if (!machineJson || typeof machineJson !== "object") return {};
  return machineJson.vault_assembly_handoff || machineJson.assembly_handoff || machineJson.handoff_envelope || {};
}

function extractTaggedBlock(text, tagName) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = String(text || "").match(pattern);
  return match?.[1]?.trim() || "";
}

function extractFence(text, lang) {
  const pattern = new RegExp("```" + lang + "\\s*([\\s\\S]*?)```", "i");
  const match = String(text || "").match(pattern);
  return match?.[1]?.trim() || "";
}

function stripJsonFence(text) {
  return String(text || "").replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJsonOrText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}



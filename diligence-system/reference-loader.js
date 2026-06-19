import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const BASE_DIR = path.dirname(__filename);

const LOADER_VERSION = "reference_loader_prompt_supremacy_v1";

export const REFERENCE_ROUTES = {
  ALL: ["00_RUNTIME_SPINE.md", "00_RUNTIME_SPINE_INDEX.md"],
  S0: ["00_SOURCE_EXTRACTION_CONTRACT.md"],
  P1: ["00_SOURCE_EXTRACTION_CONTRACT.md"],
  P6: [
  "REGISTRY_KEY_v3_0.md",
  "AI_THREAT_REGISTRY",
  "AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES"
]
  P7: ["09_OUTPUT_HANDOFF_CONTRACT.md"],
  AUDIT: ["08_PHASE_STACK_EXECUTION_MAP.md", "10_RUNTIME_AUDIT_CHECKLIST.md"]
};

const DEFAULT_REFERENCE_SEARCH_DIRS = [".", "reference", "references", "prompts", "prompts/phase-stack", "../", "../reference", "../references"];

export async function loadReferenceBundle({ phaseId = "ALL", baseDir = BASE_DIR, extraRoutes = {}, maxCharsPerReference = Number(process.env.DILIGENCE_REFERENCE_MAX_CHARS || 0) } = {}) {
  const requested = requestedReferencesForPhase(phaseId, extraRoutes);
  const references = [];
  const missing = [];
  const rejected = [];

  for (const name of requested) {
    const loaded = await findAndLoadReference({ name, baseDir, maxCharsPerReference, rejected });
    if (loaded) references.push(loaded);
    else missing.push(name);
  }

  return {
    ok: missing.length === 0 || missing.every((name) => optionalReference(name)),
    loader_version: LOADER_VERSION,
    phase_id: phaseId,
    references,
    missing_references: missing,
    rejected_references: rejected,
    reference_manifest: references.map((ref) => ({ name: ref.name, path: ref.path, sha256: ref.sha256, char_count: ref.char_count, loaded_for_phase: phaseId, route_reason: ref.route_reason, content_kind: ref.content_kind }))
  };
}

export async function loadAllReferenceBundles({ phaseIds = [], baseDir = BASE_DIR, extraRoutes = {} } = {}) {
  const bundles = {};
  for (const phaseId of phaseIds) bundles[phaseId] = await loadReferenceBundle({ phaseId, baseDir, extraRoutes });
  return bundles;
}

export function formatReferencesForPrompt(bundle) {
  const refs = bundle?.references || [];
  if (!refs.length) return "REFERENCE_BUNDLE: none loaded.";
  return refs.map((ref) => [
    `REFERENCE_FILE: ${ref.name}`,
    `REFERENCE_PATH: ${ref.path}`,
    `REFERENCE_SHA256: ${ref.sha256}`,
    `REFERENCE_KIND: ${ref.content_kind}`,
    `REFERENCE_SCOPE: ${ref.route_reason}`,
    "REFERENCE_CONTENT_BEGIN",
    ref.content,
    "REFERENCE_CONTENT_END"
  ].join("\n")).join("\n\n");
}

export function requestedReferencesForPhase(phaseId, extraRoutes = {}) {
  const node = String(phaseId || "").trim();
  const refs = new Set();
  for (const name of REFERENCE_ROUTES.ALL) refs.add(name);
  for (const name of REFERENCE_ROUTES[node] || []) refs.add(name);
  for (const name of extraRoutes[node] || []) refs.add(name);
  return Array.from(refs);
}

export function requiredReferenceNamesForPhase(phaseId) {
  if (String(phaseId).trim() === "P6") return ["REGISTRY_KEY_v3_0.md", "AI_THREAT_REGISTRY"];
  return [];
}

export function validatePhaseReferences({ phaseId, bundle }) {
  const required = requiredReferenceNamesForPhase(phaseId);
  const loadedNames = new Set((bundle?.references || []).map((ref) => ref.name));
  const errors = [];
  for (const name of required) if (!loadedNames.has(name)) errors.push(`REFERENCE_REQUIRED_BUT_MISSING:${phaseId}:${name}`);
  return { ok: errors.length === 0, phase_id: phaseId, errors, mechanical_only: true };
}

async function findAndLoadReference({ name, baseDir, maxCharsPerReference, rejected }) {
  const candidates = candidatePathsForReference({ name, baseDir });
  for (const candidate of candidates) {
    try {
      const buffer = await fs.readFile(candidate);
      if (isLikelyBinary(buffer)) {
        rejected.push({ name: canonicalReferenceName(name), path: path.relative(baseDir, candidate) || path.basename(candidate), reason: "BINARY_REFERENCE_REJECTED_USE_TEXT_OR_CSV" });
        continue;
      }
      const content = buffer.toString("utf8");
      const finalContent = maxCharsPerReference > 0 && content.length > maxCharsPerReference
        ? `${content.slice(0, maxCharsPerReference)}\n\n[REFERENCE_TRUNCATED_FOR_MODEL_CONTEXT chars=${content.length} max=${maxCharsPerReference}]`
        : content;
      return {
        name: canonicalReferenceName(name),
        requested_name: name,
        path: path.relative(baseDir, candidate) || path.basename(candidate),
        content: finalContent,
        content_kind: "text",
        char_count: finalContent.length,
        original_char_count: content.length,
        sha256: sha256(buffer),
        route_reason: routeReasonForReference(name)
      };
    } catch {
      // Try next candidate path.
    }
  }
  return null;
}

function candidatePathsForReference({ name, baseDir }) {
  const names = referenceNameVariants(name);
  const paths = [];
  for (const dir of DEFAULT_REFERENCE_SEARCH_DIRS) for (const file of names) paths.push(path.resolve(baseDir, dir, file));
  return Array.from(new Set(paths));
}

function referenceNameVariants(name) {
  const n = String(name || "").trim();
  if (n === "AI_THREAT_REGISTRY") return [
  "AI_THREAT_REGISTRY.csv",
  "AI_THREAT_REGISTRY_REGISTRY.csv",
  "AI_THREAT_REGISTRY.md",
  "AI_THREAT_REGISTRY.txt",
  "AI_THREAT_REGISTRY"
];
  if (n === "AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES") return [
  "AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.csv",
  "AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.md",
  "AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES.txt",
  "AI_THREAT_REGISTRY_HUNTER_ENGINE_RULES"
];
  if (n === "REGISTRY_KEY_v3_0.md") return ["REGISTRY_KEY_v3_0.md", "REGISTRY_KEY_v3_0.txt", "REGISTRY_KEY.md"];
  return [n];
}

function canonicalReferenceName(name) {
  const n = String(name || "").trim();
  if (/^AI_THREAT_REGISTRY/i.test(n)) return "AI_THREAT_REGISTRY";
  if (/^REGISTRY_KEY/i.test(n)) return "REGISTRY_KEY_v3_0.md";
  return n;
}

function routeReasonForReference(name) {
  const canonical = canonicalReferenceName(name);
  if (REFERENCE_ROUTES.ALL.includes(canonical)) return "universal_runtime_context";
  if (canonical === "00_SOURCE_EXTRACTION_CONTRACT.md") return "stage0_and_p1_source_extraction_contract";
  if (canonical === "REGISTRY_KEY_v3_0.md") return "p6_registry_vocabulary_and_schema_reference";
  if (canonical === "AI_THREAT_REGISTRY") return "p6_registry_row_source_reference";
  if (canonical === "09_OUTPUT_HANDOFF_CONTRACT.md") return "p7_output_handoff_contract";
  return "phase_reference_route";
}

function optionalReference(name) {
  const canonical = canonicalReferenceName(name);
  if (canonical === "AI_THREAT_REGISTRY") return false;
  if (canonical === "REGISTRY_KEY_v3_0.md") return false;
  return true;
}

function isLikelyBinary(buffer) {
  const sample = buffer.slice(0, Math.min(buffer.length, 4096));
  if (sample[0] === 0x50 && sample[1] === 0x4b) return true;
  return sample.includes(0);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

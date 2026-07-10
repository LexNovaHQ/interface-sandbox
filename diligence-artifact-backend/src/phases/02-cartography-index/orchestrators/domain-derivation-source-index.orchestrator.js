import { P2B_DOMAIN_DERIVATION_ARTIFACTS, P2B_DOMAIN_DERIVATION_SAVE_ORDER } from "../domain-derivation-source-index.contract.js";
import { buildDomainDerivationDeterministicMap } from "../services/domain-derivation-deterministic-map.builder.js";
import { compileDomainDerivationSourceIndex } from "../services/domain-derivation-source-index.compiler.js";
import { validateDomainDerivationSemanticProfile } from "../validators/domain-derivation-semantic-profile.validator.js";
import { validateDomainDerivationSourceIndex } from "../validators/domain-derivation-source-index.validator.js";

export async function runDomainDerivationSourceIndexOrchestrator({ run = {}, artifacts = {}, runSemanticModel, saveArtifact, logger = null } = {}) {
  const saved_order = [];
  const deterministicWrapper = buildDomainDerivationDeterministicMap({ run, artifacts });
  await saveP2BArtifact({ saveArtifact, artifactName: P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap, artifactWrapper: deterministicWrapper, saved_order, logger });
  const deterministicMap = deterministicWrapper[P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap];

  const semanticRaw = typeof runSemanticModel === "function"
    ? await runSemanticModel({ run, artifacts: { ...artifacts, [P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap]: deterministicWrapper }, deterministicMap, expected_artifact_name: P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile })
    : buildDefaultSemanticProfile(deterministicMap);
  const semanticWrapper = normalizeSemanticWrapper(semanticRaw, deterministicMap);
  const semanticProfile = semanticWrapper[P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile];
  const semantic_validation = validateDomainDerivationSemanticProfile({ semanticProfile, deterministicMap });
  if (!semantic_validation.ok) throw new Error(`P2B domain derivation semantic validation failed: ${semantic_validation.errors.join("; ")}`);
  await saveP2BArtifact({ saveArtifact, artifactName: P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile, artifactWrapper: semanticWrapper, saved_order, logger });

  const finalWrapper = compileDomainDerivationSourceIndex({ deterministicMap, semanticProfile });
  const sourceIndex = finalWrapper[P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex];
  const final_validation = validateDomainDerivationSourceIndex({ sourceIndex });
  if (!final_validation.ok) throw new Error(`P2B domain derivation source index validation failed: ${final_validation.errors.join("; ")}`);
  await saveP2BArtifact({ saveArtifact, artifactName: P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex, artifactWrapper: finalWrapper, saved_order, logger });

  return { ok: true, saved_order, required_order: P2B_DOMAIN_DERIVATION_SAVE_ORDER, semantic_validation, final_validation, output: finalWrapper };
}

function normalizeSemanticWrapper(semanticRaw, deterministicMap) {
  if (semanticRaw?.[P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile]) return semanticRaw;
  if (semanticRaw?.artifact?.[P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile]) return semanticRaw.artifact;
  if (semanticRaw && typeof semanticRaw === "object" && Object.keys(semanticRaw).length) return { [P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile]: semanticRaw };
  return buildDefaultSemanticProfile(deterministicMap);
}

function buildDefaultSemanticProfile(deterministicMap = {}) {
  const requiredQueue = Array.isArray(deterministicMap.semantic_label_queue) ? deterministicMap.semantic_label_queue.filter((row) => row.semantic_label_required || row.priority === "P0" || row.priority === "P1") : [];
  const rows = requiredQueue.map((row) => ({
    queue_id: row.queue_id,
    unit_id: row.unit_id,
    route_classes: [row.route_class_hint].filter(Boolean),
    route_signal_families: [row.route_signal_family_hint].filter(Boolean),
    confidence: "PARTIAL"
  }));
  return {
    [P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile]: {
      schema_version: "P2B_DOMAIN_DERIVATION_SEMANTIC_PROFILE_v1_PHASE1_V5_12_ROOT",
      semantic_navigation_index: rows,
      semantic_integrity: {
        required_queue_count: requiredQueue.length,
        labeled_queue_count: rows.length,
        coverage_ratio: requiredQueue.length ? rows.length / requiredQueue.length : 1,
        ready_for_compiler: true
      },
      lock_status: "LOCKED"
    }
  };
}

async function saveP2BArtifact({ saveArtifact, artifactName, artifactWrapper, saved_order, logger }) {
  if (typeof saveArtifact !== "function") return;
  const artifact = unwrapRoot(artifactWrapper, artifactName);
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`P2B_ARTIFACT_MISSING:${artifactName}`);
  await saveArtifact({ artifactName, artifact_name: artifactName, artifact: artifactWrapper, lock_status: artifact.lock_status || artifact.status || "LOCKED_WITH_LIMITATIONS" });
  saved_order.push(artifactName);
  log(logger, `P2B saved ${artifactName}`);
}

function unwrapRoot(value, root) {
  if (!value || typeof value !== "object") return {};
  const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value;
  return artifact[root] || artifact || {};
}
function log(logger, message) { if (logger && typeof logger.log === "function") logger.log(message); else if (typeof logger === "function") logger(message); }

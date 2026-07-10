import { P2B_DOMAIN_DERIVATION_ARTIFACTS, P2B_DOMAIN_DERIVATION_SAVE_ORDER } from "../domain-derivation-source-index.contract.js";
import { buildDomainDerivationDeterministicMap } from "../services/domain-derivation-deterministic-map.builder.js";
import { compileDomainDerivationSourceIndex } from "../services/domain-derivation-source-index.compiler.js";
import { validateDomainDerivationSemanticProfile } from "../validators/domain-derivation-semantic-profile.validator.js";
import { validateDomainDerivationSourceIndex } from "../validators/domain-derivation-source-index.validator.js";

export async function runDomainDerivationSourceIndexOrchestrator({ run = {}, artifacts = {}, runSemanticModel, saveArtifact } = {}) {
  const saved_order = [];
  const deterministicWrapper = buildDomainDerivationDeterministicMap({ run, artifacts });
  const deterministicMap = deterministicWrapper[P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap];
  await saveIfAvailable(saveArtifact, P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap, deterministicMap);
  saved_order.push(P2B_DOMAIN_DERIVATION_ARTIFACTS.deterministicMap);

  const semanticWrapper = typeof runSemanticModel === "function"
    ? await runSemanticModel({ run, artifacts, deterministicMap, expected_artifact: P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile })
    : buildDefaultSemanticProfile(deterministicMap);
  const semanticProfile = semanticWrapper?.[P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile] || semanticWrapper;
  const semantic_validation = validateDomainDerivationSemanticProfile({ semanticProfile, deterministicMap });
  if (!semantic_validation.ok) throw new Error(`P2B domain derivation semantic validation failed: ${semantic_validation.errors.join("; ")}`);
  await saveIfAvailable(saveArtifact, P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile, semanticProfile);
  saved_order.push(P2B_DOMAIN_DERIVATION_ARTIFACTS.semanticProfile);

  const finalWrapper = compileDomainDerivationSourceIndex({ deterministicMap, semanticProfile });
  const sourceIndex = finalWrapper[P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex];
  const final_validation = validateDomainDerivationSourceIndex({ sourceIndex });
  if (!final_validation.ok) throw new Error(`P2B domain derivation source index validation failed: ${final_validation.errors.join("; ")}`);
  await saveIfAvailable(saveArtifact, P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex, sourceIndex);
  saved_order.push(P2B_DOMAIN_DERIVATION_ARTIFACTS.finalIndex);

  return { ok: true, saved_order, required_order: P2B_DOMAIN_DERIVATION_SAVE_ORDER, semantic_validation, final_validation, output: finalWrapper };
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

async function saveIfAvailable(saveArtifact, artifactName, payload) {
  if (typeof saveArtifact === "function") await saveArtifact({ artifact_name: artifactName, payload });
}

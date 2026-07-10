import { P2C_ACTIVITY_PROFILE_ARTIFACTS, P2C_ACTIVITY_PROFILE_SAVE_ORDER } from "../activity-profile-source-index.contract.js";
import { buildActivityProfileDeterministicMap } from "../services/activity-profile-deterministic-map.builder.js";
import { compileActivityProfileSourceIndex } from "../services/activity-profile-source-index.compiler.js";
import { validateActivityProfileSemanticProfile } from "../validators/activity-profile-semantic-profile.validator.js";
import { validateActivityProfileSourceIndex } from "../validators/activity-profile-source-index.validator.js";

export async function runActivityProfileSourceIndexOrchestrator({ run = {}, artifacts = {}, runSemanticModel, saveArtifact, logger = null } = {}) {
  const saved_order = [];
  const deterministicWrapper = buildActivityProfileDeterministicMap({ run, artifacts });
  await saveP2CArtifact({ saveArtifact, artifactName: P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap, artifactWrapper: deterministicWrapper, saved_order, logger });
  const deterministicMap = deterministicWrapper[P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap];

  const semanticRaw = typeof runSemanticModel === "function"
    ? await runSemanticModel({ run, artifacts: { ...artifacts, [P2C_ACTIVITY_PROFILE_ARTIFACTS.deterministicMap]: deterministicWrapper }, deterministicMap, expected_artifact_name: P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile })
    : buildDefaultSemanticProfile(deterministicMap);
  const semanticWrapper = normalizeSemanticWrapper(semanticRaw, deterministicMap);
  const semanticProfile = semanticWrapper[P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile];
  const semantic_validation = validateActivityProfileSemanticProfile(semanticWrapper, { deterministicMap });
  if (semantic_validation.status !== "PASS") throw new Error(`P2C activity profile semantic validation failed: ${semantic_validation.failures.join("; ")}`);
  await saveP2CArtifact({ saveArtifact, artifactName: P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile, artifactWrapper: semanticWrapper, saved_order, logger });

  const finalWrapper = compileActivityProfileSourceIndex({ deterministicMap, semanticProfile });
  const sourceIndex = finalWrapper[P2C_ACTIVITY_PROFILE_ARTIFACTS.finalIndex];
  const final_validation = validateActivityProfileSourceIndex({ sourceIndex });
  if (!final_validation.ok) throw new Error(`P2C activity profile source index validation failed: ${final_validation.errors.join("; ")}`);
  await saveP2CArtifact({ saveArtifact, artifactName: P2C_ACTIVITY_PROFILE_ARTIFACTS.finalIndex, artifactWrapper: finalWrapper, saved_order, logger });

  return { ok: true, saved_order, required_order: P2C_ACTIVITY_PROFILE_SAVE_ORDER, semantic_validation, final_validation, output: finalWrapper };
}

function normalizeSemanticWrapper(semanticRaw, deterministicMap) {
  if (semanticRaw?.[P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile]) return semanticRaw;
  if (semanticRaw?.artifact?.[P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile]) return semanticRaw.artifact;
  if (semanticRaw && typeof semanticRaw === "object" && Object.keys(semanticRaw).length) return { [P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile]: semanticRaw };
  return buildDefaultSemanticProfile(deterministicMap);
}

function buildDefaultSemanticProfile(deterministicMap = {}) {
  const queue = Array.isArray(deterministicMap.semantic_label_queue) ? deterministicMap.semantic_label_queue : [];
  const rows = queue.map((row) => ({
    queue_id: row.queue_id,
    unit_id: row.unit_id,
    route_classes: Array.isArray(row.route_classes) ? row.route_classes : [row.route_class_hint].filter(Boolean),
    route_signal_families: Array.isArray(row.route_signal_families) ? row.route_signal_families : [row.route_signal_family_hint].filter(Boolean),
    confidence: row.confidence || "PARTIAL",
    semantic_reason_code: "P2C_DEFAULT_ROUTE_LABEL",
    source_text_copied: false,
    package_specific_classification_forbidden: true,
    route_label_status: "DEFAULT_DETERMINISTIC_LABEL_ACCEPTED"
  }));
  const navigation = rows.map((row) => ({
    queue_id: row.queue_id,
    unit_id: row.unit_id,
    route_classes: row.route_classes,
    route_signal_families: row.route_signal_families,
    reading_priority: row.route_classes.includes("ACTIVITY_CANDIDATE_SOURCE_ROUTE") || row.route_classes.includes("PRODUCT_CAPABILITY_ROUTE") || row.route_classes.includes("FEATURE_MECHANICS_ROUTE") ? "P0" : "P1",
    navigation_status: "USE_POINTERS_ONLY",
    source_text_copied: false,
    package_specific_classification_forbidden: true
  }));
  return {
    [P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile]: {
      artifact_type: P2C_ACTIVITY_PROFILE_ARTIFACTS.semanticProfile,
      schema_version: "P2C_ACTIVITY_PROFILE_SEMANTIC_PROFILE_v1_PHASE1_V5_DOMAIN_AGNOSTIC",
      generated_by: "phase2c_activity_profile_semantic_default_layer",
      source_text_policy: {
        source_artifacts_remain_source_of_truth: true,
        source_text_copied: false,
        summaries_allowed: false,
        excerpts_allowed: false
      },
      semantic_route_labels: rows,
      semantic_navigation_index: navigation,
      semantic_integrity: {
        deterministic_queue_count: queue.length,
        labeled_queue_count: rows.length,
        coverage_ratio: queue.length ? Number((rows.length / queue.length).toFixed(4)) : 1,
        ready_for_compiler: true
      },
      package_boundary: {
        domain_agnostic_activity_locator_only: true,
        mounted_domain_package_controls_activity_taxonomy: true,
        archetype_surface_and_package_field_derivation_forbidden: true,
        phase_5_derives_profile_values_later: true
      },
      downstream_rules: {
        phase_2c_is_index_only: true,
        activity_profile_source_index_owned_by_2c: true,
        phase_5_activity_profile_review_derives_values_later: true,
        domain_package_specific_activity_taxonomy_deferred_to_phase5: true,
        archetype_derivation_allowed: false,
        surface_derivation_allowed: false,
        package_specific_classification_allowed: false,
        feature_candidate_inventory_emission_allowed: false,
        mechanics_proof_allowed: false,
        source_text_copy_allowed: false
      },
      lock_status: deterministicMap.lock_status === "CONTROLLED_FAILURE" ? "REPAIR_REQUIRED" : "LOCKED"
    }
  };
}

async function saveP2CArtifact({ saveArtifact, artifactName, artifactWrapper, saved_order, logger }) {
  if (typeof saveArtifact !== "function") return;
  const artifact = unwrapRoot(artifactWrapper, artifactName);
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) throw new Error(`P2C_ARTIFACT_MISSING:${artifactName}`);
  await saveArtifact({ artifactName, artifact_name: artifactName, artifact: artifactWrapper, lock_status: artifact.lock_status || artifact.status || "LOCKED_WITH_LIMITATIONS" });
  saved_order.push(artifactName);
  log(logger, `P2C saved ${artifactName}`);
}

function unwrapRoot(value, root) {
  if (!value || typeof value !== "object") return {};
  const artifact = value.artifact && typeof value.artifact === "object" ? value.artifact : value;
  return artifact[root] || artifact || {};
}
function log(logger, message) { if (logger && typeof logger.log === "function") logger.log(message); else if (typeof logger === "function") logger(message); }

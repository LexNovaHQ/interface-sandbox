import { buildSourceUrlManifestArtifact as buildLegacySourceUrlManifestArtifact } from "./url-manifest.service.js";
import { buildBroadDiscoveryInventory, assertBroadDiscoveryInventory } from "./broad-discovery.service.js";
import { resolveEntityBoundary, assertEntityBoundary } from "./entity-boundary.service.js";
import { buildInternalEvidenceModel, assertInternalEvidenceModel } from "./internal-evidence-model.service.js";
import { buildCanonicalUrlInventory, reconcileFingerprintCanonicalHints, assertCanonicalUrlInventory } from "./canonical-url.service.js";
import { buildSourceFingerprintPass, assertSourceFingerprintInventory } from "./source-fingerprint.service.js";
import { buildLegalInstrumentClassification, assertLegalInstrumentClassification } from "./legal-instrument-classifier.service.js";
import { buildRootFeatureLaneClustering, assertRootFeatureLaneClustering } from "./root-feature-lane-clustering.service.js";

export const PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION = "PHASE1_UNIVERSAL_DISCOVERY_RB08_v1";

export async function buildUniversalSourceUrlManifestArtifact({ run, preflightContext = {} } = {}) {
  const legacyOutput = await buildLegacySourceUrlManifestArtifact({ run, preflightContext });
  return augmentSourceUrlManifestOutput({ run, legacyOutput });
}

export async function augmentSourceUrlManifestOutput({ run, legacyOutput, rootHtml, fetchImpl } = {}) {
  if (!legacyOutput?.deduped_url_manifest || !legacyOutput?.source_discovery_matrix_manifest || !legacyOutput?.adapter_expansion_log || !legacyOutput?.neutral_evidence_bucket_manifest) throw new Error("PHASE1_UNIVERSAL_DISCOVERY_LEGACY_OUTPUT_INCOMPLETE");

  const manifest = legacyOutput.deduped_url_manifest;
  const targetUrl = manifest.target_url || run?.root_url || run?.target;
  const broadDiscovery = await buildBroadDiscoveryInventory({ targetUrl, legacyOutput, rootHtml, fetchImpl });
  assertBroadDiscoveryInventory(broadDiscovery);

  const entityBoundary = resolveEntityBoundary({
    targetUrl,
    discoveredLinks: broadDiscovery.candidate_urls,
    explicitEntitySurfaces: run?.phase1_entity_surfaces || run?.entity_surfaces || []
  });
  assertEntityBoundary(entityBoundary);

  const initialInternalEvidenceModel = buildInternalEvidenceModel({ run, manifest, entityBoundary, rawDiscoveryInventory: broadDiscovery });
  assertInternalEvidenceModel(initialInternalEvidenceModel);

  const initialCanonicalInventory = buildCanonicalUrlInventory({ rawDiscoveryInventory: broadDiscovery, entityBoundary });
  assertCanonicalUrlInventory(initialCanonicalInventory);

  const fingerprintPass = await buildSourceFingerprintPass({
    canonicalInventory: initialCanonicalInventory,
    fetchImpl
  });
  assertSourceFingerprintInventory(fingerprintPass.inventory);

  const canonicalInventory = reconcileFingerprintCanonicalHints({
    canonicalInventory: initialCanonicalInventory,
    fingerprintInventory: fingerprintPass.inventory,
    entityBoundary
  });
  assertCanonicalUrlInventory(canonicalInventory);

  const legalClassification = buildLegalInstrumentClassification({
    canonicalInventory,
    fingerprintInventory: fingerprintPass.inventory,
    analysisCache: fingerprintPass.analysis_cache,
    internalEvidenceModel: initialInternalEvidenceModel
  });
  assertLegalInstrumentClassification(legalClassification);

  const rootFeatureLaneClustering = buildRootFeatureLaneClustering({
    canonicalInventory,
    fingerprintInventory: fingerprintPass.inventory,
    analysisCache: fingerprintPass.analysis_cache,
    internalEvidenceModel: initialInternalEvidenceModel,
    legalClassification
  });
  assertRootFeatureLaneClustering(rootFeatureLaneClustering);

  const internalEvidenceModel = {
    ...initialInternalEvidenceModel,
    analysis_pipeline_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
    canonical_url_inventory_ref: "source_discovery_matrix_manifest.canonical_url_inventory",
    source_fingerprint_inventory_ref: "source_discovery_matrix_manifest.source_fingerprint_inventory",
    legal_instrument_classification_ref: "source_discovery_matrix_manifest.legal_instrument_classification",
    root_feature_lane_clustering_ref: "source_discovery_matrix_manifest.root_feature_lane_clustering",
    canonical_identity_rule: "ENTITY_ID_PLUS_CANONICAL_URL",
    analysis_public_manifest_selection_changed: false
  };

  return {
    ...legacyOutput,
    deduped_url_manifest: {
      ...manifest,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      compatibility_projection_mode: "FROZEN_PUBLIC_CONTRACT_ADDITIVE_ONLY",
      internal_evidence_model_ref: "source_discovery_matrix_manifest.internal_evidence_model",
      canonical_url_inventory_ref: "source_discovery_matrix_manifest.canonical_url_inventory",
      source_fingerprint_inventory_ref: "source_discovery_matrix_manifest.source_fingerprint_inventory",
      legal_instrument_classification_ref: "source_discovery_matrix_manifest.legal_instrument_classification",
      root_feature_lane_clustering_ref: "source_discovery_matrix_manifest.root_feature_lane_clustering",
      target_boundary: {
        ...(manifest.target_boundary || {}),
        entity_boundary_schema_version: entityBoundary.target_boundary_manifest.schema_version,
        entity_boundary_status: entityBoundary.target_boundary_manifest.status,
        primary_entity_id: entityBoundary.target_boundary_manifest.primary_entity_id,
        broad_discovery_inventory_ref: "source_discovery_matrix_manifest.raw_discovery_inventory"
      }
    },
    source_discovery_matrix_manifest: {
      ...legacyOutput.source_discovery_matrix_manifest,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      compatibility_projection_mode: "FROZEN_PUBLIC_CONTRACT_ADDITIVE_ONLY",
      target_boundary_manifest: entityBoundary.target_boundary_manifest,
      entity_surface_map: entityBoundary.entity_surface_map,
      raw_discovery_inventory: broadDiscovery,
      canonical_url_inventory: canonicalInventory,
      source_fingerprint_inventory: fingerprintPass.inventory,
      legal_instrument_classification: legalClassification,
      root_feature_lane_clustering: rootFeatureLaneClustering,
      internal_evidence_model: internalEvidenceModel,
      rb02_internal_evidence_model_active: true,
      rb03_entity_boundary_active: true,
      rb04_broad_discovery_inventory_active: true,
      rb05_url_canonicalisation_active: true,
      rb06_source_fingerprint_pass_active: true,
      rb07_root_feature_lane_clustering_active: true,
      rb08_bounded_legal_classifier_active: true,
      manifest_selection_unchanged_until_rb09: true
    },
    adapter_expansion_log: {
      ...legacyOutput.adapter_expansion_log,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      broad_discovery_candidate_count: broadDiscovery.counts.candidate_urls,
      canonical_candidate_count: canonicalInventory.canonical_candidates.length,
      fingerprint_count: fingerprintPass.inventory.fingerprints.length,
      external_surface_candidate_count: broadDiscovery.counts.external_surface_candidates,
      external_surface_candidates_are_discovery_only: true,
      downstream_contract_changed: false
    },
    neutral_evidence_bucket_manifest: {
      ...legacyOutput.neutral_evidence_bucket_manifest,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      entity_boundary_ref: "source_discovery_matrix_manifest.entity_surface_map",
      internal_evidence_model_ref: "source_discovery_matrix_manifest.internal_evidence_model",
      root_feature_lane_clustering_ref: "source_discovery_matrix_manifest.root_feature_lane_clustering",
      downstream_contract_changed: false
    }
  };
}

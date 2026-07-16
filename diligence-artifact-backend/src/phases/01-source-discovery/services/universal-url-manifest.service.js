import { buildSourceUrlManifestArtifact as buildLegacySourceUrlManifestArtifact } from "./url-manifest.service.js";
import { buildBroadDiscoveryInventory, assertBroadDiscoveryInventory } from "./broad-discovery.service.js";
import { resolveEntityBoundary, assertEntityBoundary } from "./entity-boundary.service.js";
import { buildInternalEvidenceModel, assertInternalEvidenceModel } from "./internal-evidence-model.service.js";

export const PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION = "PHASE1_UNIVERSAL_DISCOVERY_RB04_v1";

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

  const internalEvidenceModel = buildInternalEvidenceModel({ run, manifest, entityBoundary, rawDiscoveryInventory: broadDiscovery });
  assertInternalEvidenceModel(internalEvidenceModel);

  return {
    ...legacyOutput,
    deduped_url_manifest: {
      ...manifest,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      compatibility_projection_mode: "FROZEN_PUBLIC_CONTRACT_ADDITIVE_ONLY",
      internal_evidence_model_ref: "source_discovery_matrix_manifest.internal_evidence_model",
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
      internal_evidence_model: internalEvidenceModel,
      rb02_internal_evidence_model_active: true,
      rb03_entity_boundary_active: true,
      rb04_broad_discovery_inventory_active: true,
      manifest_selection_unchanged_until_rb09: true
    },
    adapter_expansion_log: {
      ...legacyOutput.adapter_expansion_log,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      broad_discovery_candidate_count: broadDiscovery.counts.candidate_urls,
      external_surface_candidate_count: broadDiscovery.counts.external_surface_candidates,
      external_surface_candidates_are_discovery_only: true,
      downstream_contract_changed: false
    },
    neutral_evidence_bucket_manifest: {
      ...legacyOutput.neutral_evidence_bucket_manifest,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      entity_boundary_ref: "source_discovery_matrix_manifest.entity_surface_map",
      internal_evidence_model_ref: "source_discovery_matrix_manifest.internal_evidence_model",
      downstream_contract_changed: false
    }
  };
}

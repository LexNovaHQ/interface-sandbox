import { buildSourceUrlManifestArtifact as buildLegacySourceUrlManifestArtifact } from "./url-manifest.service.js";
import { buildBroadDiscoveryInventory, assertBroadDiscoveryInventory } from "./broad-discovery.service.js";
import { resolveEntityBoundary, assertEntityBoundary } from "./entity-boundary.service.js";
import { buildInternalEvidenceModel, assertInternalEvidenceModel } from "./internal-evidence-model.service.js";
import { buildCanonicalUrlInventory, reconcileFingerprintCanonicalHints, assertCanonicalUrlInventory } from "./canonical-url.service.js";
import { buildSourceFingerprintPass, assertSourceFingerprintInventory } from "./source-fingerprint.service.js";
import { buildLegalInstrumentClassification, assertLegalInstrumentClassification } from "./legal-instrument-classifier.service.js";
import { buildRootFeatureLaneClustering, assertRootFeatureLaneClustering } from "./root-feature-lane-clustering.service.js";
import { buildSemanticFeatureAdjudication, assertSemanticFeatureAdjudication } from "./semantic-feature-adjudication.service.js";
import { buildRb18bCanonicalSelection, assertRb18bCanonicalSelection } from "./rb18b-canonical-selection.service.js";
import { buildFinalDedupedManifest, assertFinalDedupedManifest, finalUrlDispositionForDecision } from "./final-deduped-manifest.service.js";

export const PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION = "PHASE1_UNIVERSAL_DISCOVERY_RB18B_TWO_LAYER_MANIFEST_FILTER_v2";

export async function buildUniversalSourceUrlManifestArtifact({ run, preflightContext = {} } = {}) {
  const legacyOutput = await buildLegacySourceUrlManifestArtifact({ run, preflightContext });
  return augmentSourceUrlManifestOutput({ run, legacyOutput });
}

export async function augmentSourceUrlManifestOutput({ run, legacyOutput, rootHtml, fetchImpl, semanticCallProvider } = {}) {
  if (!legacyOutput?.deduped_url_manifest || !legacyOutput?.source_discovery_matrix_manifest || !legacyOutput?.adapter_expansion_log || !legacyOutput?.neutral_evidence_bucket_manifest) throw new Error("PHASE1_UNIVERSAL_DISCOVERY_LEGACY_OUTPUT_INCOMPLETE");

  const legacyManifest = legacyOutput.deduped_url_manifest;
  const targetUrl = legacyManifest.target_url || run?.root_url || run?.target;
  const broadDiscovery = await buildBroadDiscoveryInventory({ targetUrl, legacyOutput, rootHtml, fetchImpl });
  assertBroadDiscoveryInventory(broadDiscovery);

  const entityBoundary = resolveEntityBoundary({
    targetUrl,
    discoveredLinks: broadDiscovery.candidate_urls,
    explicitEntitySurfaces: run?.phase1_entity_surfaces || run?.entity_surfaces || []
  });
  assertEntityBoundary(entityBoundary);

  const initialInternalEvidenceModel = buildInternalEvidenceModel({ run, manifest: legacyManifest, entityBoundary, rawDiscoveryInventory: broadDiscovery });
  assertInternalEvidenceModel(initialInternalEvidenceModel);

  const initialCanonicalInventory = buildCanonicalUrlInventory({ rawDiscoveryInventory: broadDiscovery, entityBoundary });
  assertCanonicalUrlInventory(initialCanonicalInventory);

  const fingerprintPass = await buildSourceFingerprintPass({ canonicalInventory: initialCanonicalInventory, fetchImpl });
  assertSourceFingerprintInventory(fingerprintPass.inventory);

  const canonicalInventory = reconcileFingerprintCanonicalHints({ canonicalInventory: initialCanonicalInventory, fingerprintInventory: fingerprintPass.inventory, entityBoundary });
  assertCanonicalUrlInventory(canonicalInventory);

  const legalClassification = buildLegalInstrumentClassification({ canonicalInventory, fingerprintInventory: fingerprintPass.inventory, analysisCache: fingerprintPass.analysis_cache, internalEvidenceModel: initialInternalEvidenceModel });
  assertLegalInstrumentClassification(legalClassification);

  const rootFeatureLaneClustering = buildRootFeatureLaneClustering({ canonicalInventory, fingerprintInventory: fingerprintPass.inventory, analysisCache: fingerprintPass.analysis_cache, internalEvidenceModel: initialInternalEvidenceModel, legalClassification });
  assertRootFeatureLaneClustering(rootFeatureLaneClustering);

  const semanticFeatureAdjudication = await buildSemanticFeatureAdjudication({
    canonicalInventory,
    fingerprintInventory: fingerprintPass.inventory,
    rootFeatureLaneClustering,
    legalClassification,
    analysisCache: fingerprintPass.analysis_cache,
    enableModel: run?.phase1_semantic_adjudication_enabled !== false,
    ...(typeof semanticCallProvider === "function" ? { callProvider: semanticCallProvider } : {})
  });
  assertSemanticFeatureAdjudication(semanticFeatureAdjudication);

  const canonicalSelection = buildRb18bCanonicalSelection({
    canonicalInventory,
    fingerprintInventory: fingerprintPass.inventory,
    rootFeatureLaneClustering: semanticFeatureAdjudication.adjudicated_root_feature_lane_clustering,
    legalClassification,
    semanticFeatureAdjudication,
    analysisCache: fingerprintPass.analysis_cache
  });
  assertRb18bCanonicalSelection(canonicalSelection);

  const urlDispositionLedger = buildUrlDispositionLedger(canonicalSelection);
  assertUrlDispositionLedger(urlDispositionLedger, canonicalSelection);

  const finalManifest = buildFinalDedupedManifest({ legacyManifest, canonicalSelection });
  assertFinalDedupedManifest(finalManifest, canonicalSelection);

  const internalEvidenceModel = {
    ...initialInternalEvidenceModel,
    analysis_pipeline_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
    canonical_url_inventory_ref: "source_discovery_matrix_manifest.canonical_url_inventory",
    source_fingerprint_inventory_ref: "source_discovery_matrix_manifest.source_fingerprint_inventory",
    legal_instrument_classification_ref: "source_discovery_matrix_manifest.legal_instrument_classification",
    root_feature_lane_clustering_ref: "source_discovery_matrix_manifest.root_feature_lane_clustering",
    semantic_feature_adjudication_ref: "source_discovery_matrix_manifest.semantic_feature_adjudication",
    canonical_selection_ref: "source_discovery_matrix_manifest.canonical_selection",
    url_disposition_ledger_ref: "source_discovery_matrix_manifest.url_disposition_ledger",
    canonical_identity_rule: "ENTITY_ID_PLUS_CANONICAL_URL",
    analysis_public_manifest_selection_changed: true,
    final_manifest_projection_ref: "deduped_url_manifest",
    final_manifest_rule: "ONLY_EXTRACTION_AUTHORISED_URLS_MOVE_TO_AGENT_1B"
  };

  return {
    ...legacyOutput,
    deduped_url_manifest: {
      ...finalManifest,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      internal_evidence_model_ref: "source_discovery_matrix_manifest.internal_evidence_model",
      canonical_url_inventory_ref: "source_discovery_matrix_manifest.canonical_url_inventory",
      source_fingerprint_inventory_ref: "source_discovery_matrix_manifest.source_fingerprint_inventory",
      legal_instrument_classification_ref: "source_discovery_matrix_manifest.legal_instrument_classification",
      root_feature_lane_clustering_ref: "source_discovery_matrix_manifest.root_feature_lane_clustering",
      semantic_feature_adjudication_ref: "source_discovery_matrix_manifest.semantic_feature_adjudication",
      canonical_selection_ref: "source_discovery_matrix_manifest.canonical_selection",
      url_disposition_ledger_ref: "source_discovery_matrix_manifest.url_disposition_ledger",
      target_boundary: {
        ...(finalManifest.target_boundary || {}),
        entity_boundary_schema_version: entityBoundary.target_boundary_manifest.schema_version,
        entity_boundary_status: entityBoundary.target_boundary_manifest.status,
        primary_entity_id: entityBoundary.target_boundary_manifest.primary_entity_id,
        broad_discovery_inventory_ref: "source_discovery_matrix_manifest.raw_discovery_inventory"
      }
    },
    source_discovery_matrix_manifest: {
      ...legacyOutput.source_discovery_matrix_manifest,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      compatibility_projection_mode: "FROZEN_PUBLIC_CONTRACT_ADDITIVE_FIELDS",
      target_boundary_manifest: entityBoundary.target_boundary_manifest,
      entity_surface_map: entityBoundary.entity_surface_map,
      raw_discovery_inventory: broadDiscovery,
      canonical_url_inventory: canonicalInventory,
      source_fingerprint_inventory: fingerprintPass.inventory,
      legal_instrument_classification: legalClassification,
      root_feature_lane_clustering: rootFeatureLaneClustering,
      semantic_feature_adjudication: semanticFeatureAdjudication,
      canonical_selection: canonicalSelection,
      url_disposition_ledger: urlDispositionLedger,
      final_manifest_forensics: finalManifest.manifest_forensics,
      internal_evidence_model: internalEvidenceModel,
      rb02_internal_evidence_model_active: true,
      rb03_entity_boundary_active: true,
      rb04_broad_discovery_inventory_active: true,
      rb05_url_canonicalisation_active: true,
      rb06_source_fingerprint_pass_active: true,
      rb07_root_feature_lane_clustering_active: true,
      rb08_bounded_legal_classifier_active: true,
      rb18b_two_layer_manifest_filter_active: true,
      rb18b_deterministic_filter_first: true,
      rb18b_semantic_support_layer_second: true,
      rb18b_semantic_output_never_directly_authorizes_extraction: true,
      rb18b_clean_manifest_only_moves_to_extraction: true,
      rb18b_coverage_only_body_extraction_forbidden: true,
      rb09_canonical_selection_active: true,
      rb10_final_deduped_manifest_active: true,
      rb18_material_content_gate_active: true,
      http_success_alone_never_authorizes_extraction: true,
      semantic_output_never_directly_authorizes_extraction: true,
      manifest_selection_unchanged_until_rb09: false,
      final_manifest_controls_agent_1b: true
    },
    adapter_expansion_log: {
      ...legacyOutput.adapter_expansion_log,
      producer_version: PHASE1_UNIVERSAL_DISCOVERY_PRODUCER_VERSION,
      broad_discovery_candidate_count: broadDiscovery.counts.candidate_urls,
      canonical_candidate_count: canonicalInventory.canonical_candidates.length,
      fingerprint_count: fingerprintPass.inventory.fingerprints.length,
      material_content_count: fingerprintPass.inventory.counts.material_content,
      no_material_content_count: fingerprintPass.inventory.counts.fetched_no_material_content,
      semantic_model_call_count: semanticFeatureAdjudication.counts.model_calls,
      semantic_feature_cluster_count: semanticFeatureAdjudication.counts.final_material_feature_clusters || semanticFeatureAdjudication.counts.final_feature_clusters,
      audited_url_count: urlDispositionLedger.counts.audited_urls,
      clean_extraction_manifest_count: finalManifest.manifest_sources.length,
      audit_only_url_count: urlDispositionLedger.counts.audited_urls - finalManifest.manifest_sources.length,
      selected_extraction_count: canonicalSelection.counts.extraction_authorized,
      coverage_only_manifest_count: canonicalSelection.counts.coverage_only_manifest_rows,
      qualifying_unique_delta_source_count: canonicalSelection.counts.qualifying_unique_delta_sources,
      exact_duplicates_suppressed: canonicalSelection.counts.exact_duplicates_suppressed,
      template_variants_suppressed: canonicalSelection.counts.template_variants_suppressed,
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
      semantic_feature_adjudication_ref: "source_discovery_matrix_manifest.semantic_feature_adjudication",
      canonical_selection_ref: "source_discovery_matrix_manifest.canonical_selection",
      url_disposition_ledger_ref: "source_discovery_matrix_manifest.url_disposition_ledger",
      downstream_contract_changed: false
    }
  };
}

function buildUrlDispositionLedger(canonicalSelection) {
  const rows = (canonicalSelection?.decisions || []).map((decision) => ({
    candidate_id: decision.candidate_id,
    canonical_identity: decision.canonical_identity,
    canonical_url: decision.canonical_url,
    entity_id: decision.entity_id,
    primary_root: decision.primary_root,
    feature_cluster: decision.feature_cluster,
    evidence_lane: decision.evidence_lane,
    source_disposition: decision.source_disposition,
    final_url_disposition: finalUrlDispositionForDecision(decision),
    extraction_scope: decision.extraction_scope,
    extraction_authorized: decision.extraction_authorized === true,
    canonical_owner_candidate_id: decision.canonical_owner_candidate_id || null,
    selection_reason: decision.selection_reason,
    structured_coverage: decision.structured_coverage || null,
    semantic_relationship: decision.semantic_relationship || null,
    semantic_decision_source: decision.semantic_decision_source || null,
    deterministic_corroborators: decision.semantic_deterministic_corroborators || [],
    unique_evidence_gate: decision.unique_evidence_gate || null,
    content_materiality: decision.content_materiality || null,
    fingerprint_fetch_status: decision.fingerprint_fetch_status || null
  }));
  return {
    schema_version: "PHASE1_URL_DISPOSITION_LEDGER_RB18B_v1",
    status: "COMPLETE",
    authority_rule: "AUDIT_LEDGER_NEVER_DIRECT_EXTRACTION_INPUT",
    final_manifest_ref: "deduped_url_manifest.manifest_sources",
    counts: {
      audited_urls: rows.length,
      extraction_authorised_urls: rows.filter((row) => row.extraction_authorized).length,
      audit_only_urls: rows.filter((row) => !row.extraction_authorized).length,
      by_final_url_disposition: countBy(rows, (row) => row.final_url_disposition)
    },
    rows
  };
}

function assertUrlDispositionLedger(ledger, canonicalSelection) {
  if (ledger?.schema_version !== "PHASE1_URL_DISPOSITION_LEDGER_RB18B_v1" || ledger.authority_rule !== "AUDIT_LEDGER_NEVER_DIRECT_EXTRACTION_INPUT") throw new Error("PHASE1_URL_DISPOSITION_LEDGER_SCHEMA_INVALID");
  const decisions = canonicalSelection?.decisions || [];
  if (ledger.rows.length !== decisions.length) throw new Error(`PHASE1_URL_DISPOSITION_LEDGER_ACCOUNTING_MISMATCH:${ledger.rows.length}/${decisions.length}`);
  const seen = new Set();
  const extractionDispositions = new Set(["EXTRACT_CANONICAL_FULL", "EXTRACT_UNIQUE_BLOCKS", "EXTRACT_LEGAL_FULL_DOCUMENT"]);
  for (const row of ledger.rows) {
    if (!row.candidate_id || !row.canonical_identity || !row.final_url_disposition) throw new Error("PHASE1_URL_DISPOSITION_LEDGER_ROW_INCOMPLETE");
    if (seen.has(row.canonical_identity)) throw new Error(`PHASE1_URL_DISPOSITION_LEDGER_DUPLICATE_IDENTITY:${row.canonical_identity}`);
    seen.add(row.canonical_identity);
    if (row.extraction_authorized !== extractionDispositions.has(row.final_url_disposition)) throw new Error(`PHASE1_URL_DISPOSITION_LEDGER_AUTHORITY_MISMATCH:${row.candidate_id}`);
  }
  return { ok: true, rows: seen.size };
}

function countBy(values, keyFn) {
  const output = {};
  for (const value of values || []) {
    const key = keyFn(value);
    output[key] = (output[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
}

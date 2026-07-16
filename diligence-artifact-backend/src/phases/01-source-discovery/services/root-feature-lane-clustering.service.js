import crypto from "node:crypto";
import { EVIDENCE_LANES } from "./internal-evidence-model.service.js";

export const PHASE1_ROOT_FEATURE_LANE_SCHEMA_VERSION = "PHASE1_ROOT_FEATURE_LANE_CLUSTERING_v1";

const ROOTS = Object.freeze(["homepage_landing", "company_identity", "contact_notice", "product_service", "platform_feature_solution", "technical_docs_api", "docs_api_data_flow", "integrations_ecosystem", "pricing_commercial_availability", "use_case_customer_industry", "privacy_data_processing", "security_trust_compliance", "data_governance_controls", "ai_safety_transparency", "support_help_resources", "regulatory_licensing_status", "grievance_complaints"]);

/**
 * RB-07 assigns one primary root, one feature cluster and one evidence lane to
 * each canonical source. Other root relevance is represented as references,
 * never duplicate source identities.
 */
export function buildRootFeatureLaneClustering({ canonicalInventory, fingerprintInventory, analysisCache = new Map(), internalEvidenceModel, legalClassification } = {}) {
  const fingerprintById = new Map((fingerprintInventory?.fingerprints || []).map((item) => [item.candidate_id, item]));
  const internalRecords = internalEvidenceModel?.source_candidates || [];
  const legalByIdentity = new Map((legalClassification?.classifications || []).map((item) => [item.canonical_identity, item]));
  const sources = [];

  for (const candidate of canonicalInventory?.canonical_candidates || []) {
    const memberIds = unique([candidate.candidate_id, ...(candidate.member_candidate_ids || [])]);
    const fingerprint = memberIds.map((id) => fingerprintById.get(id)).find((item) => item?.fetch_status === "FETCHED") || memberIds.map((id) => fingerprintById.get(id)).find(Boolean) || null;
    const analysis = fingerprint ? analysisCache.get(fingerprint.candidate_id) : null;
    const legacyRecords = internalRecords.filter((record) => record.canonical_url === candidate.canonical_url || (candidate.aliases || []).includes(record.canonical_url));
    const legal = legalByIdentity.get(candidate.canonical_identity);
    const rootCandidates = unique([...candidate.root_candidates, ...legacyRecords.flatMap((record) => record.root_candidates || []), ...legacyRecords.map((record) => record.primary_root)]).filter((root) => ROOTS.includes(root));
    const primaryRoot = choosePrimaryRoot({ candidate, fingerprint, analysis, legal, rootCandidates });
    const evidenceLane = chooseEvidenceLane({ primaryRoot, legal, fingerprint, analysis, legacyRecords });
    const featureCluster = deriveFeatureCluster({ candidate, fingerprint, analysis, primaryRoot, legacyRecords });
    const variantFamily = deriveVariantFamily({ candidate, fingerprint, featureCluster });
    const aiOverlay = deriveAiOverlay({ candidate, fingerprint, analysis, featureCluster, primaryRoot });
    const secondaryRoots = unique([
      ...rootCandidates.filter((root) => root !== primaryRoot),
      ...(aiOverlay && primaryRoot !== "ai_safety_transparency" ? ["ai_safety_transparency"] : [])
    ]);

    sources.push({
      record_type: "RootFeatureLaneClassification",
      schema_version: PHASE1_ROOT_FEATURE_LANE_SCHEMA_VERSION,
      classification_id: stableId("RFL", candidate.canonical_identity),
      candidate_id: candidate.candidate_id,
      canonical_identity: candidate.canonical_identity,
      entity_id: candidate.entity_id,
      entity_status: candidate.entity_status,
      canonical_url: candidate.canonical_url,
      fingerprint_id: fingerprint?.fingerprint_id || null,
      primary_root: primaryRoot,
      secondary_root_references: secondaryRoots,
      feature_cluster: featureCluster,
      evidence_lane: evidenceLane,
      variant_family: variantFamily,
      template_signature: fingerprint?.template_signature || null,
      exact_content_hash: fingerprint?.exact_content_hash || null,
      legal_instrument_status: legal?.classification_status || "NOT_LEGAL_INSTRUMENT",
      legal_doc_type: legal?.doc_type || "other",
      ai_overlay: aiOverlay,
      classification_basis: {
        legacy_root_candidates: rootCandidates,
        path: safePath(candidate.canonical_url),
        title: fingerprint?.title || "",
        heading_count: fingerprint?.headings?.length || 0,
        deterministic_only: true
      },
      final_extraction_authority: false
    });
  }

  const featureClusters = buildClusters(sources);
  const rootClusters = Object.fromEntries(ROOTS.map((root) => [root, {
    root,
    source_classification_ids: sources.filter((source) => source.primary_root === root).map((source) => source.classification_id),
    feature_cluster_ids: featureClusters.filter((cluster) => cluster.primary_root === root).map((cluster) => cluster.cluster_id)
  }]));

  return {
    schema_version: PHASE1_ROOT_FEATURE_LANE_SCHEMA_VERSION,
    status: "COMPLETE",
    model_usage: "NONE",
    ownership_rule: "ONE_PRIMARY_ROOT_SECONDARY_ROOTS_BY_REFERENCE",
    clustering_key: "ENTITY_ID_PLUS_PRIMARY_ROOT_PLUS_FEATURE_CLUSTER_PLUS_EVIDENCE_LANE",
    public_manifest_selection_changed: false,
    counts: {
      sources_classified: sources.length,
      feature_clusters: featureClusters.length,
      roots_with_primary_sources: Object.values(rootClusters).filter((entry) => entry.source_classification_ids.length).length,
      variant_family_members: sources.filter((source) => source.variant_family !== "none").length,
      ai_overlay_relationships: sources.filter((source) => Boolean(source.ai_overlay)).length
    },
    source_classifications: sources,
    feature_clusters: featureClusters,
    root_clusters: rootClusters
  };
}

export function assertRootFeatureLaneClustering(inventory) {
  if (inventory?.schema_version !== PHASE1_ROOT_FEATURE_LANE_SCHEMA_VERSION) throw new Error("PHASE1_ROOT_FEATURE_LANE_SCHEMA_INVALID");
  if (inventory.model_usage !== "NONE" || inventory.public_manifest_selection_changed !== false || inventory.ownership_rule !== "ONE_PRIMARY_ROOT_SECONDARY_ROOTS_BY_REFERENCE") throw new Error("PHASE1_ROOT_FEATURE_LANE_BOUNDARY_INVALID");
  const seen = new Set();
  for (const source of inventory.source_classifications || []) {
    if (!source.classification_id || !source.candidate_id || !source.canonical_identity || !source.entity_id || !source.primary_root || !source.feature_cluster || !source.evidence_lane) throw new Error("PHASE1_ROOT_FEATURE_LANE_CLASSIFICATION_INCOMPLETE");
    if (seen.has(source.canonical_identity)) throw new Error(`PHASE1_ROOT_FEATURE_LANE_DUPLICATE_SOURCE:${source.canonical_identity}`);
    seen.add(source.canonical_identity);
    if (!ROOTS.includes(source.primary_root)) throw new Error(`PHASE1_ROOT_FEATURE_LANE_UNKNOWN_ROOT:${source.primary_root}`);
    if (!EVIDENCE_LANES.includes(source.evidence_lane)) throw new Error(`PHASE1_ROOT_FEATURE_LANE_UNKNOWN_LANE:${source.evidence_lane}`);
    if ((source.secondary_root_references || []).includes(source.primary_root)) throw new Error(`PHASE1_ROOT_FEATURE_LANE_PRIMARY_DUPLICATED_AS_REFERENCE:${source.candidate_id}`);
    if (source.final_extraction_authority !== false) throw new Error(`PHASE1_ROOT_FEATURE_LANE_EARLY_EXTRACTION_AUTHORITY:${source.candidate_id}`);
  }
  for (const cluster of inventory.feature_clusters || []) {
    if (!cluster.cluster_id || !cluster.entity_id || !cluster.primary_root || !cluster.feature_cluster || !cluster.evidence_lane || !cluster.member_candidate_ids.length) throw new Error("PHASE1_FEATURE_CLUSTER_INCOMPLETE");
  }
  return { ok: true, sources: seen.size, clusters: inventory.feature_clusters?.length || 0 };
}

function choosePrimaryRoot({ candidate, fingerprint, analysis, legal, rootCandidates }) {
  if (legal?.confirmed_legal_instrument && ROOTS.includes(legal.primary_root)) return legal.primary_root;
  if (rootCandidates.length) return [...rootCandidates].sort((a, b) => rootRank(a) - rootRank(b))[0];
  const text = searchableText(candidate, fingerprint, analysis);
  const path = safePath(candidate.canonical_url);
  if (path === "/") return "homepage_landing";
  if (/\b(grievance|complaint|ombudsman|nodal officer)\b/i.test(text)) return "grievance_complaints";
  if (/\b(licen[cs]e|regulatory|authori[sz]ed|registration|disclosure|partner bank|sponsor bank)\b/i.test(text)) return "regulatory_licensing_status";
  if (/\b(security|trust center|soc 2|iso 27001|compliance)\b/i.test(text)) return "security_trust_compliance";
  if (/\b(retention|deletion|data residency|data export|customer data)\b/i.test(text)) return "data_governance_controls";
  if (/\b(webhook|authentication|permission|audit log|data flow|callback|settlement|payout|transaction)\b/i.test(text) && /\b(api|docs?|developer|sdk)\b/i.test(text)) return "docs_api_data_flow";
  if (/\b(api|docs?|developer|sdk|reference|integration guide)\b/i.test(text)) return "technical_docs_api";
  if (/\b(pricing|plans?|fees?|charges?|contact sales)\b/i.test(text)) return "pricing_commercial_availability";
  if (/\b(help|support|faq|knowledge base)\b/i.test(text)) return "support_help_resources";
  if (/\b(about|company|team|careers|newsroom)\b/i.test(text)) return "company_identity";
  if (/\b(ai safety|responsible ai|model card|ai transparency|usage policy)\b/i.test(text)) return "ai_safety_transparency";
  if (/\b(platform|feature|solution|workflow|automation)\b/i.test(text)) return "platform_feature_solution";
  return "product_service";
}

function chooseEvidenceLane({ primaryRoot, legal, fingerprint, analysis, legacyRecords }) {
  if (legal?.confirmed_legal_instrument) return "legal_instrument";
  const legacy = legacyRecords.map((record) => record.evidence_lane).find((lane) => EVIDENCE_LANES.includes(lane) && lane !== "unassigned");
  if (legacy) return legacy;
  if (primaryRoot === "docs_api_data_flow") return "data_flow";
  if (["technical_docs_api", "integrations_ecosystem"].includes(primaryRoot)) return "technical_operation";
  if (primaryRoot === "security_trust_compliance") return "security_compliance";
  if (primaryRoot === "regulatory_licensing_status") return "regulatory_disclosure";
  if (["support_help_resources", "grievance_complaints", "contact_notice"].includes(primaryRoot)) return "support_operations";
  if (["homepage_landing", "company_identity", "use_case_customer_industry"].includes(primaryRoot)) return "corporate_strategy";
  return "commercial_product";
}

function deriveFeatureCluster({ candidate, fingerprint, analysis, primaryRoot, legacyRecords }) {
  const path = safePath(candidate.canonical_url);
  const segments = path.split("/").filter(Boolean).map(normalizeFeatureToken);
  const joined = segments.join("/");
  if (/translation\/[a-z_]+_to_[a-z_]+/.test(joined) || segments.includes("translation")) return "translation";
  if (segments.includes("text_to_speech") || segments.includes("tts")) return "text_to_speech";
  if (segments.includes("speech_to_text") || segments.includes("stt")) return "speech_to_text";
  if (segments.some((segment) => segment.includes("electricity_bill_payment"))) return "electricity_bill_payment";
  if (segments.some((segment) => ["airouter", "ai_router", "payment_router", "payment_routing"].includes(segment))) return "payment_routing";
  if (segments.some((segment) => ["paytm_pi", "fraud", "fraud_detection", "risk"].includes(segment))) return "fraud_detection";
  if (segments.includes("payment_gateway")) return "payment_gateway";
  if (segments.includes("soundbox")) return "soundbox";
  if (segments.includes("settlement") || segments.includes("settlements")) return "settlements";
  if (segments.includes("dubbing")) return "dubbing";
  if (segments.includes("document_digitisation") || segments.includes("document_digitization") || segments.includes("ocr")) return "document_digitisation";
  const legacyFeature = legacyRecords.map((record) => record.feature_cluster).find((value) => value && value !== "unassigned" && value !== "none");
  if (legacyFeature) return normalizeFeatureToken(legacyFeature);
  const umbrella = new Set(["product", "products", "service", "services", "platform", "features", "solutions", "docs", "developer", "developers", "api", "apis", "api_reference", "reference", "support", "help"]);
  const candidateSegment = segments.find((segment) => !umbrella.has(segment) && !isLikelyVariantToken(segment));
  if (candidateSegment) return candidateSegment;
  if (primaryRoot === "homepage_landing") return "homepage";
  if (primaryRoot === "company_identity") return "company_identity";
  const title = normalizeFeatureToken(fingerprint?.title || analysis?.title || "");
  return title || primaryRoot;
}

function deriveVariantFamily({ candidate, fingerprint, featureCluster }) {
  const path = safePath(candidate.canonical_url).toLowerCase();
  if (/\/[a-z-]{2,20}-to-[a-z-]{2,20}(?:\/|$)/.test(path)) return `${featureCluster}_language_pair`;
  if (["text_to_speech", "speech_to_text", "translation"].includes(featureCluster) && /\/(english|hindi|tamil|telugu|marathi|bengali|gujarati|kannada|malayalam|punjabi|odia|urdu|assamese)(?:\/|$)/.test(path)) return `${featureCluster}_language`;
  if (featureCluster === "electricity_bill_payment" && path.split("/").filter(Boolean).length > 1) return "electricity_bill_payment_state_provider";
  if (/\/(sdk|sdks|client|clients)\/(javascript|typescript|python|java|go|ruby|php|dotnet|node)(?:\/|$)/.test(path)) return `${featureCluster}_sdk_language`;
  if (fingerprint?.template_signature?.includes("{language-pair}")) return `${featureCluster}_language_pair`;
  if (fingerprint?.template_signature?.includes("{language}")) return `${featureCluster}_language`;
  return "none";
}

function deriveAiOverlay({ candidate, fingerprint, analysis, featureCluster, primaryRoot }) {
  const text = searchableText(candidate, fingerprint, analysis);
  const signals = [];
  if (/\b(artificial intelligence|machine learning|\bai\b|\bml\b|model|algorithm|predict|optimis|optimiz|anomaly)\b/i.test(text)) signals.push("AI_MECHANISM_SIGNAL");
  if (/\b(fraud|risk|anomaly|account takeover)\b/i.test(text) && signals.length) signals.push("AI_RISK_DETECTION");
  if (/\b(route|routing|gateway performance|approval rate)\b/i.test(text) && signals.length) signals.push("AI_OPTIMISATION_ROUTING");
  if (/\b(conversational|assistant|chatbot|multilingual agent)\b/i.test(text) && signals.length) signals.push("AI_CONVERSATIONAL_SYSTEM");
  if (!signals.length || primaryRoot === "ai_safety_transparency") return null;
  return { underlying_feature: featureCluster, overlay_type: signals.slice(1)[0] || "AI_AUGMENTED_ACTIVITY", signals: unique(signals) };
}

function buildClusters(sources) {
  const groups = new Map();
  for (const source of sources) {
    const key = `${source.entity_id}|${source.primary_root}|${source.feature_cluster}|${source.evidence_lane}`;
    const existing = groups.get(key) || {
      record_type: "FeatureCluster",
      schema_version: PHASE1_ROOT_FEATURE_LANE_SCHEMA_VERSION,
      cluster_id: stableId("CLUSTER", key),
      entity_id: source.entity_id,
      primary_root: source.primary_root,
      feature_cluster: source.feature_cluster,
      evidence_lane: source.evidence_lane,
      member_candidate_ids: [],
      variant_families: [],
      secondary_root_references: [],
      ai_overlay_relationships: []
    };
    existing.member_candidate_ids.push(source.candidate_id);
    existing.variant_families = unique([...existing.variant_families, source.variant_family].filter((value) => value !== "none"));
    existing.secondary_root_references = unique([...existing.secondary_root_references, ...(source.secondary_root_references || [])]);
    if (source.ai_overlay) existing.ai_overlay_relationships.push(source.ai_overlay);
    groups.set(key, existing);
  }
  return [...groups.values()].sort((a, b) => a.entity_id.localeCompare(b.entity_id) || rootRank(a.primary_root) - rootRank(b.primary_root) || a.feature_cluster.localeCompare(b.feature_cluster) || a.evidence_lane.localeCompare(b.evidence_lane));
}

function searchableText(candidate, fingerprint, analysis) { return `${safePath(candidate?.canonical_url)} ${fingerprint?.title || ""} ${(fingerprint?.headings || []).join(" ")} ${fingerprint?.meta_description || ""} ${analysis?.main_text?.slice(0, 8000) || fingerprint?.analysis_excerpt || ""}`; }
function safePath(value) { try { return new URL(value).pathname || "/"; } catch { return "/"; } }
function normalizeFeatureToken(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
function isLikelyVariantToken(value) { return /^[a-z]{2,20}_to_[a-z]{2,20}$/.test(value) || /^(english|hindi|tamil|telugu|marathi|bengali|gujarati|kannada|malayalam|punjabi|odia|urdu|assamese)$/.test(value) || /^\d+$/.test(value); }
function rootRank(value) { return { homepage_landing: 1, company_identity: 2, contact_notice: 3, product_service: 4, platform_feature_solution: 5, technical_docs_api: 6, docs_api_data_flow: 7, integrations_ecosystem: 8, pricing_commercial_availability: 9, use_case_customer_industry: 10, privacy_data_processing: 11, security_trust_compliance: 12, data_governance_controls: 13, ai_safety_transparency: 14, support_help_resources: 15, regulatory_licensing_status: 16, grievance_complaints: 17 }[value] || 99; }
function stableId(prefix, value) { return `${prefix}.${crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16)}`; }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }

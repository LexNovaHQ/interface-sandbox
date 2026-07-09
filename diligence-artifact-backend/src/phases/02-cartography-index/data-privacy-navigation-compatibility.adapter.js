const DATA_FAMILY_KEYS = Object.freeze({
  D1: "lossless_family__D1_SECURITY_TRUST",
  D2: "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER",
  D3: "lossless_family__D3_DATA_GOVERNANCE_CONTROLS",
  D4: "lossless_family__D4_DOCS_API_DATA_FLOW",
  D5: "lossless_family__D5_AI_SAFETY_TRANSPARENCY"
});

const COMMON_ROOT_TO_DATA_FAMILIES = Object.freeze({
  lossless_root__security_trust: [DATA_FAMILY_KEYS.D1, DATA_FAMILY_KEYS.D2, DATA_FAMILY_KEYS.D3],
  lossless_root__trust_compliance: [DATA_FAMILY_KEYS.D1, DATA_FAMILY_KEYS.D2, DATA_FAMILY_KEYS.D3, DATA_FAMILY_KEYS.D5],
  lossless_root__privacy_data_processing: [DATA_FAMILY_KEYS.D2, DATA_FAMILY_KEYS.D3],
  lossless_root__technical_docs_api_developer: [DATA_FAMILY_KEYS.D4, DATA_FAMILY_KEYS.D5],
  lossless_root__docs_api_data_flow: [DATA_FAMILY_KEYS.D3, DATA_FAMILY_KEYS.D4, DATA_FAMILY_KEYS.D5],
  lossless_root__platform_feature_solution: [DATA_FAMILY_KEYS.D4, DATA_FAMILY_KEYS.D5],
  lossless_root__product_service: [DATA_FAMILY_KEYS.D4, DATA_FAMILY_KEYS.D5],
  lossless_root__support_help: [DATA_FAMILY_KEYS.D3],
  lossless_root__contact_notice: [DATA_FAMILY_KEYS.D3]
});

export const DATA_PRIVACY_NAVIGATION_COMPATIBILITY_STATUS = Object.freeze({
  adapter: "data-privacy-navigation-compatibility.adapter",
  purpose: "Builds the old Phase 7 lossless_family__D* artifact shape in memory from Phase 1 common roots and legal_doc_* artifacts before calling the original data_privacy_navigation_index builder.",
  phase7_index_artifact_identity_changed: false,
  phase7_builder_changed: false,
  emits_persisted_artifacts: false,
  old_d_family_artifact_identity_preserved_for_dpni_runtime: true
});

export function buildDataPrivacyNavigationCompatibilityArtifacts({ run = {}, artifacts = {} } = {}) {
  const familySources = new Map(Object.values(DATA_FAMILY_KEYS).map((familyName) => [familyName, []]));
  const sourceLedger = [];
  for (const [artifactName, families] of Object.entries(COMMON_ROOT_TO_DATA_FAMILIES)) {
    const artifact = unwrapArtifact(artifacts[artifactName]);
    if (!artifact || typeof artifact !== "object") continue;
    for (const source of collectSourcesFromArtifact({ artifactName, artifact, sourceClass: "common_root", docType: artifactName.replace(/^lossless_root__/, "") })) addSourceToFamilies({ familySources, sourceLedger, families, source });
  }
  const legalInventory = unwrapArtifact(artifacts.legal_doc_inventory);
  const inventoryDocs = legalDocumentsFromInventory(legalInventory);
  for (const doc of inventoryDocs) {
    const artifactName = doc.artifact_name || doc.legal_doc_artifact_name || (doc.doc_type ? `legal_doc_${normalizeSlug(doc.doc_type)}` : "");
    const docArtifact = unwrapArtifact(artifacts[artifactName]);
    const docType = normalizeDocType(doc.doc_type || docArtifact.doc_type || docArtifact.document_type || artifactName.replace(/^legal_doc_/, ""));
    const families = familiesForDocType(docType, artifactName, docArtifact, doc);
    for (const source of collectSourcesFromArtifact({ artifactName, artifact: docArtifact, fallback: doc, sourceClass: "legal_doc", docType })) addSourceToFamilies({ familySources, sourceLedger, families, source });
  }
  const compatibilityArtifacts = {};
  for (const [familyName, sources] of familySources.entries()) compatibilityArtifacts[familyName] = buildFamilyArtifact({ run, familyName, sources });
  compatibilityArtifacts.data_privacy_navigation_compatibility_manifest = buildManifest({ run, familySources, sourceLedger, inventoryDocs });
  return compatibilityArtifacts;
}

function buildFamilyArtifact({ run, familyName, sources }) {
  return {
    artifact_type: familyName,
    root_family: familyName.replace(/^lossless_family__/, ""),
    storage_mode: "IN_MEMORY_PHASE2_DPNI_COMPATIBILITY_ADAPTER",
    generated_by: "data_privacy_navigation_compatibility_adapter",
    run_id: run.run_id || "",
    status: sources.length ? "LOCKED" : "LOCKED_WITH_LIMITATIONS",
    purpose: purposeForFamily(familyName),
    sources: dedupeSources(sources)
  };
}

function buildManifest({ run, familySources, sourceLedger, inventoryDocs }) {
  return {
    artifact_type: "data_privacy_navigation_compatibility_manifest",
    run_id: run.run_id || "",
    status: "LOCKED",
    persisted: false,
    adapter_policy: {
      phase7_index_artifact_identity_changed: false,
      old_d_family_shape_built_in_memory_only: true,
      full_text_not_copied_into_indexes: true,
      common_roots_and_legal_docs_remain_source_of_truth: true
    },
    legal_doc_inventory_count: Array.isArray(inventoryDocs) ? inventoryDocs.length : 0,
    family_source_counts: Object.fromEntries([...familySources.entries()].map(([familyName, sources]) => [familyName, dedupeSources(sources).length])),
    source_ledger: sourceLedger
  };
}

function familiesForDocType(docType, artifactName, artifact, doc) {
  const raw = `${docType} ${artifactName} ${artifact?.title || ""} ${artifact?.document_title || ""} ${doc?.title || ""} ${doc?.source_url || ""}`.toLowerCase();
  const out = new Set();
  if (/security|trust|soc|iso|incident|vulnerab|technical-measures|information-security/.test(raw)) out.add(DATA_FAMILY_KEYS.D1);
  if (/subprocessor|processor|vendor|transfer|dpa|data-processing|third-party|third_party/.test(raw)) out.add(DATA_FAMILY_KEYS.D2);
  if (/privacy|cookie|retention|deletion|consent|rights|grievance|redressal|contact|governance|data-protection/.test(raw)) out.add(DATA_FAMILY_KEYS.D3);
  if (/api|developer|docs|webhook|sdk|data-flow|integration|technical|schema|endpoint/.test(raw)) out.add(DATA_FAMILY_KEYS.D4);
  if (/ai|model|llm|safety|transparency|acceptable-use|aup|usage|policy|training|automated/.test(raw)) out.add(DATA_FAMILY_KEYS.D5);
  if (!out.size && /privacy|terms|dpa|security|trust/.test(raw)) out.add(DATA_FAMILY_KEYS.D3);
  return [...out];
}

function collectSourcesFromArtifact({ artifactName, artifact, fallback = {}, sourceClass, docType }) {
  const rows = [];
  if (artifact && Array.isArray(artifact.sources)) artifact.sources.forEach((source, index) => rows.push(normalizeSource({ artifactName, source, fallback, index, sourceClass, docType })));
  else if (artifact && typeof artifact === "object") {
    const candidateText = artifact.lossless_text || artifact.clean_text || artifact.text || artifact.raw_text || artifact.content || artifact.markdown || "";
    const hasSourceData = candidateText || artifact.url || artifact.final_url || artifact.canonical_url || artifact.source_url || artifact.title || artifact.page_title || artifact.document_title;
    if (hasSourceData) rows.push(normalizeSource({ artifactName, source: artifact, fallback, index: 0, sourceClass, docType }));
  }
  if (!rows.length && fallback && typeof fallback === "object") rows.push(normalizeSource({ artifactName, source: fallback, fallback, index: 0, sourceClass, docType }));
  return rows;
}

function normalizeSource({ artifactName, source, fallback, index, sourceClass, docType }) {
  const text = String(source.lossless_text || source.clean_text || source.text || source.raw_text || source.content || source.markdown || fallback.lossless_text || fallback.text || "");
  const url = source.final_url || source.canonical_url || source.url || source.source_url || fallback.final_url || fallback.canonical_url || fallback.url || fallback.source_url || "";
  const sourceId = source.source_id || source.manifest_id || source.doc_id || fallback.source_id || fallback.doc_id || `${artifactName}.SRC.${String(index + 1).padStart(3, "0")}`;
  return {
    source_id: sourceId,
    final_url: url,
    url,
    canonical_url: source.canonical_url || fallback.canonical_url || url,
    title: source.title || source.page_title || source.document_title || fallback.title || fallback.document_title || titleFromArtifactName(artifactName),
    page_title: source.page_title || source.title || fallback.title || "",
    doc_type: docType || source.doc_type || fallback.doc_type || "",
    materiality: source.materiality || fallback.materiality || "Data/privacy source mapped for Phase 7 DPNI compatibility.",
    sha256: source.sha256 || source.content_sha256 || fallback.sha256 || "",
    lossless_text: text,
    adapter_source_artifact: artifactName,
    adapter_source_class: sourceClass,
    adapter_doc_type: docType || "",
    adapter_generated: true
  };
}

function addSourceToFamilies({ familySources, sourceLedger, families, source }) {
  for (const familyName of families || []) {
    if (!familySources.has(familyName)) continue;
    familySources.get(familyName).push(source);
    sourceLedger.push({ family_name: familyName, source_id: source.source_id, source_url: source.url || source.final_url || "", adapter_source_artifact: source.adapter_source_artifact, adapter_doc_type: source.adapter_doc_type, has_lossless_text: Boolean(source.lossless_text) });
  }
}
function dedupeSources(sources) { const seen = new Set(); const out = []; for (const source of sources || []) { const key = `${source.source_id || ""}|${source.url || source.final_url || ""}|${source.adapter_source_artifact || ""}`; if (seen.has(key)) continue; seen.add(key); out.push(source); } return out; }
function legalDocumentsFromInventory(inventory = {}) { const docs = inventory.documents_found || inventory.legal_documents || inventory.documents || inventory.docs || []; return Array.isArray(docs) ? docs : []; }
function normalizeDocType(value) { return normalizeSlug(value || "other"); }
function normalizeSlug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "other"; }
function titleFromArtifactName(artifactName) { return String(artifactName || "Data Source").replace(/^legal_doc_/, "").replace(/^lossless_root__/, "").replace(/_/g, " "); }
function unwrapArtifact(value) { return value?.artifact && typeof value.artifact === "object" ? value.artifact : value || {}; }
function purposeForFamily(familyName) {
  if (familyName === DATA_FAMILY_KEYS.D1) return "Security, trust, incident, vulnerability, and technical-measure corpus for original Phase 7 DPNI.";
  if (familyName === DATA_FAMILY_KEYS.D2) return "Subprocessor, vendor, transfer, DPA, and third-party privacy-center corpus for original Phase 7 DPNI.";
  if (familyName === DATA_FAMILY_KEYS.D3) return "Data governance, privacy rights, retention, deletion, consent, grievance, and control corpus for original Phase 7 DPNI.";
  if (familyName === DATA_FAMILY_KEYS.D4) return "Docs, API, integration, endpoint, and data-flow corpus for original Phase 7 DPNI.";
  if (familyName === DATA_FAMILY_KEYS.D5) return "AI safety, transparency, acceptable-use, model, and automated-system corpus for original Phase 7 DPNI.";
  return "Data/privacy corpus for original Phase 7 DPNI.";
}

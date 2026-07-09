const LEGAL_FAMILY_KEYS = Object.freeze({
  L1: "lossless_family__L1_CORE_TERMS_PRIVACY",
  L2: "lossless_family__L2_B2B_CONTRACTING",
  L3: "lossless_family__L3_AI_USAGE_GOVERNANCE",
  L4: "lossless_family__L4_PRIVACY_ADJACENT_NOTICES",
  L5: "lossless_family__L5_LEGAL_HUB_HOSTED",
  L6: "lossless_family__L6_ENTITY_NOTICE"
});

const COMMON_ROOT_TO_LEGAL_FAMILIES = Object.freeze({
  lossless_root__legal_identity_notice: [LEGAL_FAMILY_KEYS.L6, LEGAL_FAMILY_KEYS.L5],
  lossless_root__privacy_data_processing: [LEGAL_FAMILY_KEYS.L1, LEGAL_FAMILY_KEYS.L4, LEGAL_FAMILY_KEYS.L5],
  lossless_root__security_trust: [LEGAL_FAMILY_KEYS.L2, LEGAL_FAMILY_KEYS.L5],
  lossless_root__trust_compliance: [LEGAL_FAMILY_KEYS.L2, LEGAL_FAMILY_KEYS.L5],
  lossless_root__contact_notice: [LEGAL_FAMILY_KEYS.L6, LEGAL_FAMILY_KEYS.L5],
  lossless_root__technical_docs_api_developer: [LEGAL_FAMILY_KEYS.L3],
  lossless_root__docs_api_data_flow: [LEGAL_FAMILY_KEYS.L3, LEGAL_FAMILY_KEYS.L4]
});

export const M9_LEGAL_FAMILY_COMPATIBILITY_STATUS = Object.freeze({
  adapter: "m9-legal-family-compatibility.adapter",
  purpose: "Builds the old M9 lossless_family__L* artifact shape in memory from Phase 1 legal_doc_* and common-root artifacts.",
  m9_agent_package_changed: false,
  m9_contract_changed: false,
  emits_persisted_artifacts: false,
  old_family_artifact_identity_preserved_for_m9_runtime: true
});

export function buildM9LegalFamilyCompatibilityArtifacts({ run = {}, artifacts = {} } = {}) {
  const familySources = new Map(Object.values(LEGAL_FAMILY_KEYS).map((familyName) => [familyName, []]));
  const sourceLedger = [];
  const legalInventory = unwrapArtifact(artifacts.legal_doc_inventory);
  const inventoryDocs = legalDocumentsFromInventory(legalInventory);
  for (const doc of inventoryDocs) {
    const artifactName = doc.artifact_name || doc.legal_doc_artifact_name || (doc.doc_type ? `legal_doc_${normalizeSlug(doc.doc_type)}` : "");
    const docArtifact = unwrapArtifact(artifacts[artifactName]);
    const docType = normalizeDocType(doc.doc_type || docArtifact.doc_type || docArtifact.document_type || artifactName.replace(/^legal_doc_/, ""));
    const families = familiesForDocType(docType, artifactName, docArtifact, doc);
    for (const source of collectSourcesFromArtifact({ artifactName, artifact: docArtifact, fallback: doc, sourceClass: "legal_doc", docType })) addSourceToFamilies({ familySources, sourceLedger, families, source });
  }
  for (const [artifactName, families] of Object.entries(COMMON_ROOT_TO_LEGAL_FAMILIES)) {
    const artifact = unwrapArtifact(artifacts[artifactName]);
    if (!artifact || typeof artifact !== "object") continue;
    for (const source of collectSourcesFromArtifact({ artifactName, artifact, sourceClass: "common_root", docType: artifactName.replace(/^lossless_root__/, "") })) addSourceToFamilies({ familySources, sourceLedger, families, source });
  }
  const compatibilityArtifacts = {};
  for (const [familyName, sources] of familySources.entries()) {
    compatibilityArtifacts[familyName] = buildFamilyArtifact({ run, familyName, sources });
  }
  compatibilityArtifacts.m9_legal_family_compatibility_manifest = buildManifest({ run, familySources, sourceLedger, inventoryDocs });
  return compatibilityArtifacts;
}

function buildFamilyArtifact({ run, familyName, sources }) {
  return {
    artifact_type: familyName,
    root_family: familyName.replace(/^lossless_family__/, ""),
    storage_mode: "IN_MEMORY_PHASE2_COMPATIBILITY_ADAPTER",
    generated_by: "m9_legal_family_compatibility_adapter",
    run_id: run.run_id || "",
    status: sources.length ? "LOCKED" : "LOCKED_WITH_LIMITATIONS",
    purpose: purposeForFamily(familyName),
    sources: dedupeSources(sources)
  };
}

function buildManifest({ run, familySources, sourceLedger, inventoryDocs }) {
  return {
    artifact_type: "m9_legal_family_compatibility_manifest",
    run_id: run.run_id || "",
    status: "LOCKED",
    persisted: false,
    adapter_policy: {
      m9_agent_package_changed: false,
      m9_contract_changed: false,
      m9_services_changed: false,
      old_family_shape_built_in_memory_only: true,
      full_text_not_copied_into_indexes: true,
      legal_doc_artifacts_remain_source_of_truth: true
    },
    legal_doc_inventory_count: Array.isArray(inventoryDocs) ? inventoryDocs.length : 0,
    family_source_counts: Object.fromEntries([...familySources.entries()].map(([familyName, sources]) => [familyName, dedupeSources(sources).length])),
    source_ledger: sourceLedger
  };
}

function familiesForDocType(docType, artifactName, artifact, doc) {
  const raw = `${docType} ${artifactName} ${artifact?.title || ""} ${artifact?.document_title || ""} ${doc?.title || ""} ${doc?.source_url || ""}`.toLowerCase();
  const out = new Set([LEGAL_FAMILY_KEYS.L5]);
  if (/terms|tos|service|user-agreement|agreement|conditions/.test(raw)) out.add(LEGAL_FAMILY_KEYS.L1);
  if (/privacy|cookie|notice|personal-data|data-protection/.test(raw)) { out.add(LEGAL_FAMILY_KEYS.L1); out.add(LEGAL_FAMILY_KEYS.L4); }
  if (/dpa|data-processing|subprocessor|processor|controller|sla|service-level|security|trust|soc|iso|vendor|transfer/.test(raw)) out.add(LEGAL_FAMILY_KEYS.L2);
  if (/acceptable-use|aup|ai|model|developer|api|usage|safety|policy/.test(raw)) out.add(LEGAL_FAMILY_KEYS.L3);
  if (/cookie|subprocessor|privacy|grievance|redressal|contact|consent/.test(raw)) out.add(LEGAL_FAMILY_KEYS.L4);
  if (/imprint|legal-notice|entity|contact|address|company|about/.test(raw)) out.add(LEGAL_FAMILY_KEYS.L6);
  return [...out];
}

function collectSourcesFromArtifact({ artifactName, artifact, fallback = {}, sourceClass, docType }) {
  const rows = [];
  if (artifact && Array.isArray(artifact.sources)) {
    artifact.sources.forEach((source, index) => rows.push(normalizeSource({ artifactName, source, fallback, index, sourceClass, docType })));
  } else if (artifact && typeof artifact === "object") {
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
    materiality: source.materiality || fallback.materiality || "Legal/governance source mapped for M9 compatibility.",
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

function dedupeSources(sources) {
  const seen = new Set();
  const out = [];
  for (const source of sources || []) {
    const key = `${source.source_id || ""}|${source.url || source.final_url || ""}|${source.adapter_source_artifact || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(source);
  }
  return out;
}

function legalDocumentsFromInventory(inventory = {}) {
  const docs = inventory.documents_found || inventory.legal_documents || inventory.documents || inventory.docs || [];
  return Array.isArray(docs) ? docs : [];
}
function normalizeDocType(value) { return normalizeSlug(value || "other"); }
function normalizeSlug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "other"; }
function titleFromArtifactName(artifactName) { return String(artifactName || "Legal Document").replace(/^legal_doc_/, "").replace(/^lossless_root__/, "").replace(/_/g, " "); }
function unwrapArtifact(value) { return value?.artifact && typeof value.artifact === "object" ? value.artifact : value || {}; }
function purposeForFamily(familyName) {
  if (familyName === LEGAL_FAMILY_KEYS.L1) return "Core terms, privacy policy, and primary legal terms corpus for original M9.";
  if (familyName === LEGAL_FAMILY_KEYS.L2) return "B2B contracting, security, vendor, DPA, SLA, and trust corpus for original M9.";
  if (familyName === LEGAL_FAMILY_KEYS.L3) return "AI usage governance, acceptable use, developer, API, and product legal corpus for original M9.";
  if (familyName === LEGAL_FAMILY_KEYS.L4) return "Privacy-adjacent notices, cookies, consent, subprocessors, grievance and redressal corpus for original M9.";
  if (familyName === LEGAL_FAMILY_KEYS.L5) return "Hosted legal hub corpus for original M9.";
  if (familyName === LEGAL_FAMILY_KEYS.L6) return "Entity, contact, legal notice, and operator identity corpus for original M9.";
  return "Legal/governance corpus for original M9.";
}

import {
  buildHybridExtractionManifest,
  summarizeHybridExtractionManifest,
  validateHybridExtractionManifest
} from "../stage0-adapter.js";

const hybridEvidencePacket = {
  source_review: {
    primary_attempted: 2,
    primary_ingested: 2,
    secondary_attempted: 1,
    secondary_ingested: 0,
    evidence_entries: 2,
    artifact_inventory_entries: 2,
    jina_used: false,
    grounding_allowed: false,
    evidence_buffer_size_chars: 142
  },
  evidence_buffer: [
    {
      source_id: "src_001",
      source_url: "https://example.com/",
      source_type: "TARGET_DOMAIN",
      ingestion_method: "DIRECT_FETCH",
      artifact_type: "Homepage",
      evidence_text: "Example homepage public copy. Example offers AI document tools for teams.",
      evidence_scope: "COMPANY",
      first_party_basis: "Synthetic fixture same-origin homepage."
    },
    {
      source_id: "src_002",
      source_url: "https://example.com/privacy",
      source_type: "TARGET_DOMAIN",
      ingestion_method: "DIRECT_FETCH",
      artifact_type: "Privacy Policy",
      evidence_text: "Example privacy policy public copy. Users may request deletion of personal data.",
      evidence_scope: "LEGAL",
      first_party_basis: "Synthetic fixture same-origin privacy policy."
    }
  ],
  artifact_inventory: [
    {
      artifact_type: "Homepage",
      artifact_class: "COMPANY_SURFACE",
      status: "INGESTED",
      source_url: "https://example.com/",
      ingestion_method: "DIRECT_FETCH",
      evidence_summary: "Homepage fixture",
      absence_basis: "N/A",
      warning: "N/A"
    },
    {
      artifact_type: "Privacy Policy",
      artifact_class: "CORE_LEGAL",
      status: "INGESTED",
      source_url: "https://example.com/privacy",
      ingestion_method: "DIRECT_FETCH",
      evidence_summary: "Privacy fixture",
      absence_basis: "N/A",
      warning: "N/A"
    },
    {
      artifact_type: "DPA",
      artifact_class: "CORE_LEGAL",
      status: "ABSENT",
      source_url: "N/A",
      ingestion_method: "NONE",
      evidence_summary: "N/A",
      absence_basis: "DPA fetch failed in fixture.",
      warning: "ABSENCE_REQUIRES_MODEL_CONFIRMATION_OR_GROUNDED_DISCOVERY"
    }
  ],
  direct_fetch_attempts: [
    { source_url: "https://example.com/", fetch_url: "https://example.com/", method: "DIRECT_FETCH", bucket: "PRIMARY", discovery_basis: "seed_path", status: "INGESTED", http_status: 200, chars: 68, latency_ms: 12, warning: "N/A" },
    { source_url: "https://example.com/privacy", fetch_url: "https://example.com/privacy", method: "DIRECT_FETCH", bucket: "PRIMARY", discovery_basis: "seed_path", status: "INGESTED", http_status: 200, chars: 74, latency_ms: 14, warning: "N/A" },
    { source_url: "https://example.com/dpa", fetch_url: "https://example.com/dpa", method: "DIRECT_FETCH", bucket: "PRIMARY", discovery_basis: "seed_path", status: "ACCESS_FAILED", http_status: 404, chars: 0, latency_ms: 11, warning: "FETCH_RETURNED_404_OR_INSUFFICIENT_TEXT" }
  ],
  candidate_links: [
    { url: "https://example.com/security", bucket: "SECONDARY", discovery_basis: "same_origin_link_from:https://example.com/" }
  ],
  warnings: ["FIXTURE_WARNING"]
};

const manifest = buildHybridExtractionManifest({
  runId: "stage0_fixture_run",
  sourceMode: "url",
  targetUrl: "https://example.com/",
  companyName: "Example",
  pastedPublicMaterial: "",
  syntheticDemoMaterial: "",
  hybridEvidencePacket,
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString()
});

const validation = validateHybridExtractionManifest(manifest);
const summary = summarizeHybridExtractionManifest(manifest);
console.log(JSON.stringify({ ok: validation.ok, summary, validation }, null, 2));
process.exit(validation.ok ? 0 : 1);

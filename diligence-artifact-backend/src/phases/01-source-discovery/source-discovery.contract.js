export const SOURCE_DISCOVERY_CONTRACT = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  public_label: "Source Discovery",
  implementation_status: "BOUNDARY_WRAPPER_ACTIVE",
  model_usage: "NONE",
  lossless_required: true,
  jobs: Object.freeze({
    URL_MANIFEST: Object.freeze({
      job_id: "URL_MANIFEST",
      public_label: "Source URL Manifest",
      responsibility: "Resolve target URL, discover candidate source URLs, dedupe candidates, and classify manifest rows by source family before extraction.",
      reads: [],
      writes: ["deduped_url_manifest"]
    }),
    SOURCE_EXTRACTION: Object.freeze({
      job_id: "SOURCE_EXTRACTION",
      public_label: "Source Extraction",
      responsibility: "Fetch admitted primary source rows, preserve lossless text, create source family index, and create lossless source family artifacts.",
      reads: ["deduped_url_manifest"],
      writes: ["source_family_index", "lossless_family__{ROOT_FAMILY}", "lossless_family__{ROOT_FAMILY}__part_{NNN}"]
    }),
    SOURCE_FAMILY_HANDOFF: Object.freeze({
      job_id: "SOURCE_FAMILY_HANDOFF",
      public_label: "Source Family Handoff",
      responsibility: "Build the downstream source discovery handoff from the manifest, source family index, and resolved lossless family artifacts.",
      reads: ["deduped_url_manifest", "source_family_index", "lossless_family__{ROOT_FAMILY}"],
      writes: ["source_discovery_handoff"]
    })
  }),
  material_outputs: Object.freeze([
    "deduped_url_manifest",
    "source_family_index",
    "lossless_family__{ROOT_FAMILY}",
    "lossless_family__{ROOT_FAMILY}__part_{NNN}",
    "source_discovery_handoff"
  ]),
  forbidden_work: Object.freeze([
    "legal_cartography",
    "target_profile_derivation",
    "activity_profile_derivation",
    "data_provenance_derivation",
    "exposure_selection",
    "qualified_review_prefill",
    "report_rendering"
  ]),
  boundary: Object.freeze({
    phase_layer: "src/phases/01-source-discovery",
    runtime_owner: "src/runtime/services/pipeline.service.js",
    migration_mode: "wrapper_first_logic_second",
    production_entrypoint_switched: false
  })
});

export function getSourceDiscoveryJobContract(jobId) {
  const job = SOURCE_DISCOVERY_CONTRACT.jobs[jobId];
  if (!job) throw new Error(`UNKNOWN_SOURCE_DISCOVERY_JOB:${jobId || "missing"}`);
  return job;
}

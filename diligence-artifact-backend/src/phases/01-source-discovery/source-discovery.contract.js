export const SOURCE_DISCOVERY_CONTRACT = Object.freeze({
  phase_id: "SOURCE_DISCOVERY",
  public_label: "Source Discovery",
  implementation_status: "PHASE_OWNED_IMPLEMENTATION_RUNTIME_CUTOVER",
  old_helper_dependency_removed: true,
  old_helper_files_cut_off_from_new_runtime: ["agent-1-scout-extractor.js", "m6-bucket-router.js"],
  model_usage: "NONE",
  lossless_required: true,
  pre_phase_1_domain_preflight: Object.freeze({
    hook_name: "pre_phase_1_domain_preflight",
    numbered_phase: false,
    runs_before: "URL_MANIFEST_DISCOVERY_LOGIC",
    emits: Object.freeze(["domain_selection_profile", "active_run_package_manifest"]),
    lock_allowed: false,
    dynamic_routing_allowed: false,
    discovery_boundary: "non-narrowing do-not-miss hints only"
  }),
  jobs: Object.freeze({
    URL_MANIFEST: Object.freeze({
      job_id: "URL_MANIFEST",
      public_label: "Source URL Manifest",
      responsibility: "Resolve target URL, run passive Pre-Phase 1 Domain Preflight, discover candidate source URLs, dedupe candidates, and classify manifest rows by source family before extraction.",
      implementation_status: "PHASE_OWNED_IMPLEMENTATION_RUNTIME_CUTOVER",
      reads: [],
      writes: ["domain_selection_profile", "active_run_package_manifest", "deduped_url_manifest"]
    }),
    SOURCE_EXTRACTION: Object.freeze({
      job_id: "SOURCE_EXTRACTION",
      public_label: "Source Extraction",
      responsibility: "Fetch admitted primary source rows, preserve lossless text, create source family index, and create lossless source family artifacts.",
      implementation_status: "PHASE_OWNED_IMPLEMENTATION_RUNTIME_CUTOVER",
      reads: ["deduped_url_manifest"],
      writes: ["source_family_index", "lossless_family__{ROOT_FAMILY}", "lossless_family__{ROOT_FAMILY}__part_{NNN}"]
    }),
    SOURCE_FAMILY_HANDOFF: Object.freeze({
      job_id: "SOURCE_FAMILY_HANDOFF",
      public_label: "Source Family Handoff",
      responsibility: "Build the downstream source discovery handoff from the manifest, source family index, resolved lossless family artifacts, and passive domain preflight context.",
      implementation_status: "PHASE_OWNED_IMPLEMENTATION_RUNTIME_CUTOVER",
      reads: ["domain_selection_profile", "active_run_package_manifest", "deduped_url_manifest", "source_family_index", "lossless_family__{ROOT_FAMILY}"],
      writes: ["source_discovery_handoff"]
    })
  }),
  material_outputs: Object.freeze([
    "domain_selection_profile",
    "active_run_package_manifest",
    "deduped_url_manifest",
    "source_family_index",
    "lossless_family__{ROOT_FAMILY}",
    "lossless_family__{ROOT_FAMILY}__part_{NNN}",
    "source_discovery_handoff"
  ]),
  forbidden_work: Object.freeze([
    "domain_locking",
    "source_discovery_narrowing_from_domain_preflight",
    "domain_specific_source_exclusion",
    "dynamic_prompt_routing",
    "field_registry_compilation",
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
    migration_mode: "phase_owned_implementation_runtime_cutover",
    production_entrypoint_switched: true,
    pre_phase_1_domain_preflight_is_runtime_hook: true,
    pre_phase_1_domain_preflight_narrows_discovery: false
  })
});

export function getSourceDiscoveryJobContract(jobId) {
  const job = SOURCE_DISCOVERY_CONTRACT.jobs[jobId];
  if (!job) throw new Error(`UNKNOWN_SOURCE_DISCOVERY_JOB:${jobId || "missing"}`);
  return job;
}

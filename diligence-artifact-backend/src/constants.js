export const SERVICE_NAME = "interface-diligence-artifacts";

export const PHASES = Object.freeze(["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX", "M9", "M7_TARGET_PROFILE", "M7_TARGET_PROFILE_FORENSICS", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS", "M10", "M10_FORENSICS", "AGENT_4B_EXTENDED_DAP_INDIA_READINESS", "AGENT_4C_INTEGRATED_DAP_REPORT", "M11", "M12", "NORMALIZED_COMPILER", "QUALIFIED_REVIEW_HANDOFF", "QUALIFIED_REVIEW_RENDERER", "RENDERER", "COMPLETE"]);
export const LOCK_STATUSES = Object.freeze(["CREATED", "RUNNING", "LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE", "COMPLETE"]);

export const AGENT_1A_ARTIFACT_NAMES = Object.freeze(["deduped_url_manifest"]);
export const AGENT_1B_ARTIFACT_NAMES = Object.freeze(["source_family_index"]);
export const ROOT_FAMILY_CODES = Object.freeze(["T0_ROOT", "T1_IDENTITY", "T2_LEGAL_IDENTITY", "T3_OPERATOR_ENTITY", "T4_SUPPORTING_IDENTITY", "P1_PRODUCT", "P2_PLATFORM_FEATURE_SOLUTION", "P3_AI_CAPABILITY_TECHNICAL", "P4_USE_CASE_INDUSTRY", "P5_ENTERPRISE_PRICING", "D1_SECURITY_TRUST", "D2_SUBPROCESSOR_PRIVACY_CENTER", "D3_DATA_GOVERNANCE_CONTROLS", "D4_DOCS_API_DATA_FLOW", "D5_AI_SAFETY_TRANSPARENCY", "L1_CORE_TERMS_PRIVACY", "L2_B2B_CONTRACTING", "L3_AI_USAGE_GOVERNANCE", "L4_PRIVACY_ADJACENT_NOTICES", "L5_LEGAL_HUB_HOSTED", "L6_ENTITY_NOTICE"]);
export const AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES = Object.freeze(ROOT_FAMILY_CODES.map((code) => `lossless_family__${code}`));
export const AGENT_1B_REQUIRED_ARTIFACT_NAMES = AGENT_1B_ARTIFACT_NAMES;
export const AGENT_1B_WRITE_PERMISSION_ARTIFACT_NAMES = Object.freeze([...AGENT_1B_REQUIRED_ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES]);
export const AGENT_1_ARTIFACT_NAMES = Object.freeze([...AGENT_1A_ARTIFACT_NAMES, ...AGENT_1B_ARTIFACT_NAMES]);

export const LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__L1_CORE_TERMS_PRIVACY", "lossless_family__L2_B2B_CONTRACTING", "lossless_family__L3_AI_USAGE_GOVERNANCE", "lossless_family__L4_PRIVACY_ADJACENT_NOTICES", "lossless_family__L5_LEGAL_HUB_HOSTED", "lossless_family__L6_ENTITY_NOTICE"]);
export const TARGET_PROFILE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__T0_ROOT", "lossless_family__T1_IDENTITY", "lossless_family__T2_LEGAL_IDENTITY", "lossless_family__T3_OPERATOR_ENTITY", "lossless_family__T4_SUPPORTING_IDENTITY"]);
export const PRODUCT_ACTIVITY_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__P1_PRODUCT", "lossless_family__P2_PLATFORM_FEATURE_SOLUTION", "lossless_family__P3_AI_CAPABILITY_TECHNICAL", "lossless_family__P4_USE_CASE_INDUSTRY", "lossless_family__P5_ENTERPRISE_PRICING"]);
export const DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES = Object.freeze(["lossless_family__D1_SECURITY_TRUST", "lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER", "lossless_family__D3_DATA_GOVERNANCE_CONTROLS", "lossless_family__D4_DOCS_API_DATA_FLOW", "lossless_family__D5_AI_SAFETY_TRANSPARENCY"]);

export const EXTENDED_DAP_ARTIFACT_NAMES = Object.freeze(["extended_dap_india_readiness_profile"]);
export const INTEGRATED_DAP_ARTIFACT_NAMES = Object.freeze(["integrated_dap_report"]);
export const M11_STATIC_ARTIFACT_NAMES = Object.freeze(["exposure_registry_route_plan", "exposure_registry_workpad_98", "exposure_registry_controlled_profile", "exposure_registry_triggered_profile", "exposure_registry_profile_forensics"]);
export const M11_DYNAMIC_ARTIFACT_PATTERNS = Object.freeze(["exposure_registry_batch__{GROUP}__{NNN}", "exposure_registry_batch_validation__{GROUP}__{NNN}"]);
export const M11_BATCH_ARTIFACT_PATTERN = /^exposure_registry_batch__[A-Z0-9]+__\d{3}$/;
export const M11_BATCH_VALIDATION_ARTIFACT_PATTERN = /^exposure_registry_batch_validation__[A-Z0-9]+__\d{3}$/;
export const LOSSLESS_FAMILY_ARTIFACT_PATTERN = /^lossless_family__[A-Z0-9_]+(?:__part_\d{3})?$/;

export const NORMALIZED_SECTION_ARTIFACT_NAMES = Object.freeze(["normalized_section__matter_overview", "normalized_section__executive_summary", "normalized_section__target_profile", "normalized_section__product_activity_ip_profile", "normalized_section__data_provenance_controls", "normalized_section__legal_document_control_review", "normalized_section__exposure_findings", "normalized_section__implications_review_path", "normalized_section__evidence_gaps_clarification_points", "normalized_section__methodology_limitations_review_notes", "normalized_section__forensic_ledger_appendix"]);
export const COMPILER_ARTIFACT_NAMES = Object.freeze(["normalized_report_manifest", "final_output_handoff", ...NORMALIZED_SECTION_ARTIFACT_NAMES]);
export const NORMALIZED_COMPILER_ARTIFACT_NAMES = COMPILER_ARTIFACT_NAMES;
export const QUALIFIED_REVIEW_ARTIFACT_NAMES = Object.freeze(["qualified_review_handoff", "qualified_review_renderer_payload"]);
export const NORMALIZED_COMPILER_PHASE = "NORMALIZED_COMPILER";

export const LEGACY_COMPILER_ARTIFACT_NAMES = Object.freeze(["profiles_combined", "forensics_combined"]);
export const ARCHIVED_LEGACY_ARTIFACT_NAMES = LEGACY_COMPILER_ARTIFACT_NAMES;
export const LEGACY_ARTIFACT_NAMES = Object.freeze(["url_manifest", "lossless_source_corpus", "exposure_registry_profile", ...LEGACY_COMPILER_ARTIFACT_NAMES]);
export const UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES = Object.freeze(["uploaded_source_document_index", "uploaded_source_document_corpus"]);

export const ARTIFACT_NAMES = Object.freeze([...new Set([...LEGACY_ARTIFACT_NAMES, ...UPLOADED_SOURCE_DOCUMENT_ARTIFACT_NAMES, ...AGENT_1_ARTIFACT_NAMES, ...AGENT_1B_OPTIONAL_FAMILY_ARTIFACT_NAMES, "source_discovery_handoff", "legal_cartography_deterministic_map", "legal_cartography_semantic_profile", "legal_cartography_reinvestigation_workpad", "legal_cartography_index", "target_profile", "target_profile_forensics", "target_feature_profile", "target_feature_profile_forensics", "data_provenance_profile", "data_provenance_profile_forensics", ...EXTENDED_DAP_ARTIFACT_NAMES, ...INTEGRATED_DAP_ARTIFACT_NAMES, ...M11_STATIC_ARTIFACT_NAMES, "challenge_gate", ...COMPILER_ARTIFACT_NAMES, ...QUALIFIED_REVIEW_ARTIFACT_NAMES, "renderer_payload"])]);
export const AGENTS = Object.freeze(["agent_1a_url_manifest", "agent_1b_extract", "agent_2a_bucket_routing", "agent_2b_m9", "agent_3_target_feature", "agent_4_data_privacy", "agent_5_exposure_registry", "agent_7_m12", "qualified_review_system", "document_source_ingestor", "agent_4b_extended_dap", "agent_4c_integrated_dap_compiler", "compiler", "portfolio_renderer", "operator"]);

const ALL = ARTIFACT_NAMES;
export const READ_PERMISSIONS = Object.fromEntries(AGENTS.map((agent) => [agent, ALL]));
export const WRITE_PERMISSIONS = Object.fromEntries(AGENTS.map((agent) => [agent, agent === "portfolio_renderer" ? ["renderer_payload"] : agent === "compiler" ? COMPILER_ARTIFACT_NAMES : agent === "qualified_review_system" ? QUALIFIED_REVIEW_ARTIFACT_NAMES : ALL]));
export const PHASE_WRITE_PERMISSIONS = Object.freeze({ NORMALIZED_COMPILER: COMPILER_ARTIFACT_NAMES, QUALIFIED_REVIEW_HANDOFF: ["qualified_review_handoff"], QUALIFIED_REVIEW_RENDERER: ["qualified_review_renderer_payload"], RENDERER: ["renderer_payload"] });

export function isKnownArtifactName(artifactName) { const name = String(artifactName || ""); return ARTIFACT_NAMES.includes(name) || LOSSLESS_FAMILY_ARTIFACT_PATTERN.test(name) || M11_BATCH_ARTIFACT_PATTERN.test(name) || M11_BATCH_VALIDATION_ARTIFACT_PATTERN.test(name); }
export function artifactMatchesPermission(artifactName, permission) { return permission === artifactName || permission === "*" || (String(permission || "").startsWith("lossless_family__") && String(artifactName || "").startsWith(permission)); }
export function assertKnownArtifactName(artifactName) { if (!isKnownArtifactName(artifactName)) throw new Error(`INVALID_ARTIFACT_NAME:${artifactName || "missing"}`); }
export function assertKnownPhase(phase) { if (!PHASES.includes(phase)) throw new Error(`INVALID_PHASE:${phase || "missing"}`); }
export function assertKnownAgent(agent) { if (!AGENTS.includes(agent)) throw new Error(`INVALID_AGENT:${agent}`); }
export function assertPhaseCanWriteArtifact(phase, artifactName) { assertKnownPhase(phase); assertKnownArtifactName(artifactName); const allowed = PHASE_WRITE_PERMISSIONS[phase] || ARTIFACT_NAMES; if (!allowed.some((permission) => artifactMatchesPermission(artifactName, permission))) throw new Error(`PHASE_WRITE_FORBIDDEN:${phase}:${artifactName}`); }

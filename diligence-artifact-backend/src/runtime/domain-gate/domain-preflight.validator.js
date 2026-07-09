import {
  PASSIVE_MANIFEST_ADAPTER_MODE,
  PRE_PHASE_1_ALLOWED_STATUSES,
  PRE_PHASE_1_SELECTION_STAGE,
  RUNTIME_FLAG_NAMES
} from "./domain-package-key.js";
import { PRE_PHASE_1_PROFILE_STATUS } from "./domain-selection-profile.schema.js";
import { packageIdSet } from "./package-catalog.loader.js";

export function validatePrePhase1DomainPreflight({ domain_selection_profile, active_run_package_manifest, catalog } = {}) {
  const errors = [];
  const warnings = [];
  validateDomainSelectionProfilePrePhase1(domain_selection_profile, catalog, errors, warnings);
  validateActiveRunPackageManifestV0(active_run_package_manifest, catalog, errors, warnings);
  validateDomainSelectionManifestSync({ domain_selection_profile, active_run_package_manifest }, errors, warnings);
  const status = errors.length ? "FAIL" : warnings.length ? "WARN" : "PASS";
  if (domain_selection_profile?.validation) {
    domain_selection_profile.validation.status = status;
    domain_selection_profile.validation.errors = errors;
    domain_selection_profile.validation.warnings = warnings;
  }
  if (active_run_package_manifest?.validation) {
    active_run_package_manifest.validation.status = status;
    active_run_package_manifest.validation.errors = errors;
    active_run_package_manifest.validation.warnings = warnings;
  }
  if (errors.length) throw new Error(`PRE_PHASE_1_DOMAIN_PREFLIGHT_INVALID:${errors.join("|")}`);
  return { status, errors, warnings };
}

export function validateDomainSelectionProfilePrePhase1(profile, catalog, errors = [], warnings = []) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) errors.push("domain_selection_profile must be object");
  if (profile?.artifact_name !== "domain_selection_profile") errors.push("domain_selection_profile.artifact_name mismatch");
  if (profile?.version !== "0.1") errors.push("domain_selection_profile.version must be 0.1");
  if (profile?.selection_stage !== PRE_PHASE_1_SELECTION_STAGE) errors.push("domain_selection_profile.selection_stage must be PRE_PHASE_1");
  if (profile?.hook_name !== "pre_phase_1_domain_preflight") errors.push("domain_selection_profile.hook_name mismatch");
  if (profile?.status !== PRE_PHASE_1_PROFILE_STATUS) errors.push("domain_selection_profile.status must be PROVISIONAL_ONLY at PRE_PHASE_1");
  if (Object.hasOwn(profile || {}, "locked_primary_domain")) errors.push("locked_primary_domain must not exist at PRE_PHASE_1");
  if (Object.hasOwn(profile || {}, "locked_capability_overlays")) errors.push("locked_capability_overlays must not exist at PRE_PHASE_1");
  if (Object.hasOwn(profile || {}, "locked_regulatory_overlays")) errors.push("locked_regulatory_overlays must not exist at PRE_PHASE_1");
  for (const key of ["provisional_primary_domain_candidates", "provisional_capability_overlay_candidates", "provisional_regulatory_overlay_candidates", "discovery_hints"]) if (!Array.isArray(profile?.[key])) errors.push(`${key} must be array`);
  assertCandidatePackageIds(profile?.provisional_primary_domain_candidates || [], catalog, errors, "primary");
  assertCandidatePackageIds(profile?.provisional_capability_overlay_candidates || [], catalog, errors, "capability");
  assertCandidatePackageIds(profile?.provisional_regulatory_overlay_candidates || [], catalog, errors, "regulatory");
  for (const candidate of [...(profile?.provisional_primary_domain_candidates || []), ...(profile?.provisional_capability_overlay_candidates || []), ...(profile?.provisional_regulatory_overlay_candidates || [])]) {
    if (!PRE_PHASE_1_ALLOWED_STATUSES.includes(candidate.status)) errors.push(`pre-phase-1 candidate has forbidden status ${candidate.package_id}:${candidate.status}`);
    if (candidate.lock_allowed !== false) errors.push(`pre-phase-1 candidate lock_allowed must be false: ${candidate.package_id}`);
  }
  const forbidden = profile?.forbidden_actions_confirmed || {};
  for (const key of ["primary_domain_locked", "capability_overlay_locked", "regulatory_overlay_locked", "source_discovery_narrowed", "sources_excluded", "dynamic_prompt_routing_enabled", "field_registry_compile_enabled", "qr_matrix_routing_enabled", "report_template_routing_enabled"]) {
    if (forbidden[key] !== false) errors.push(`forbidden_actions_confirmed.${key} must be false`);
  }
  for (const hint of profile?.discovery_hints || []) {
    if (hint.may_expand_discovery !== true) warnings.push(`discovery hint does not explicitly expand attention: ${hint.hint_id || "missing"}`);
    if (hint.may_narrow_discovery !== false) errors.push(`discovery hint may_narrow_discovery must be false: ${hint.hint_id || "missing"}`);
    if (hint.may_exclude_sources !== false) errors.push(`discovery hint may_exclude_sources must be false: ${hint.hint_id || "missing"}`);
  }
  if (!profile?.user_intake?.declared_primary_domain_raw) warnings.push("missing user-declared domain");
  if (!profile?.user_intake?.product_or_company_description) warnings.push("missing product/company description");
  return { errors, warnings };
}

export function validateActiveRunPackageManifestV0(manifest, catalog, errors = [], warnings = []) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) errors.push("active_run_package_manifest must be object");
  if (manifest?.artifact_name !== "active_run_package_manifest") errors.push("active_run_package_manifest.artifact_name mismatch");
  if (manifest?.version !== "0.1") errors.push("active_run_package_manifest.version must be 0.1");
  if (manifest?.selection_stage !== PRE_PHASE_1_SELECTION_STAGE) errors.push("active_run_package_manifest.selection_stage must be PRE_PHASE_1");
  if (manifest?.primary_domain_package !== null) errors.push("primary_domain_package must be null at PRE_PHASE_1");
  if (manifest?.primary_domain_status !== "PROVISIONAL") errors.push("primary_domain_status must be PROVISIONAL at PRE_PHASE_1");
  if (!Array.isArray(manifest?.capability_overlays) || manifest.capability_overlays.length !== 0) errors.push("capability_overlays must be empty at PRE_PHASE_1");
  if (!Array.isArray(manifest?.regulatory_overlays) || manifest.regulatory_overlays.length !== 0) errors.push("regulatory_overlays must be empty at PRE_PHASE_1");
  if (manifest?.review_overlay?.package_id !== "qualified-review" || manifest?.review_overlay?.status !== "LOCKED") errors.push("review_overlay must be locked to qualified-review");
  if (manifest?.adapter_mode !== PASSIVE_MANIFEST_ADAPTER_MODE) errors.push("adapter_mode must be passive_manifest");
  for (const flag of RUNTIME_FLAG_NAMES) if (manifest?.runtime_flags?.[flag] !== false) errors.push(`runtime flag must be false: ${flag}`);
  const ids = packageIdSet(catalog || {});
  if (manifest?.review_overlay?.package_id && !ids.has(manifest.review_overlay.package_id)) errors.push("review_overlay package_id missing from catalog");
  if (manifest?.package_catalog?.catalog_loaded !== true) errors.push("package_catalog.catalog_loaded must be true");
  if (manifest?.package_catalog?.catalog_status !== "PASS") errors.push("package_catalog.catalog_status must be PASS");
  if (warnings.length && manifest?.validation?.status === "PASS") warnings.push("manifest has warnings but validation was PASS before validator mutation");
  return { errors, warnings };
}

export function validateDomainSelectionManifestSync({ domain_selection_profile, active_run_package_manifest } = {}, errors = [], warnings = []) {
  if (domain_selection_profile?.run_id !== active_run_package_manifest?.run_id) errors.push("run_id mismatch between domain_selection_profile and active_run_package_manifest");
  if (domain_selection_profile?.selection_stage !== active_run_package_manifest?.selection_stage) errors.push("selection_stage mismatch between domain_selection_profile and active_run_package_manifest");
  if (active_run_package_manifest?.primary_domain_package !== null) errors.push("manifest primary_domain_package must stay null at PRE_PHASE_1");
  if ((domain_selection_profile?.provisional_primary_domain_candidates || []).length > 1) warnings.push("multiple provisional primary domain candidates");
  return { errors, warnings };
}

function assertCandidatePackageIds(candidates, catalog, errors, expectedKind) {
  const allowedByKind = expectedKind === "primary" ? catalog?.primary_domain_packages : expectedKind === "capability" ? catalog?.capability_overlays : catalog?.regulatory_overlays;
  const allowed = new Set(allowedByKind || []);
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      errors.push(`${expectedKind} candidate must be object`);
      continue;
    }
    if (!allowed.has(candidate.package_id)) errors.push(`unsupported ${expectedKind} package_id: ${candidate.package_id || "missing"}`);
  }
}

import assert from "node:assert/strict";
import { buildDomainControlObligationNavigationArtifacts, OBLIGATION_CATALOGS } from "../src/phases/02-cartography-index/services/domain-control-obligation-navigation-index.builder.js";
import { validateDomainControlObligationDeterministicMap, validateDomainControlObligationSemanticProfile, validateDomainControlObligationNavigationIndex } from "../src/phases/02-cartography-index/validators/domain-control-obligation-navigation-index.validator.js";
import { OBLIGATION_SHELL_FIELDS } from "../src/phases/02-cartography-index/domain-control-obligation-navigation-index.contract.js";

assert.ok(OBLIGATION_CATALOGS.some((catalog) => catalog.domain_id === "fintech"), "fintech obligation catalog loaded");
assert.ok(OBLIGATION_CATALOGS.some((catalog) => catalog.domain_id === "ai-native"), "ai obligation catalog loaded");
for (const catalog of OBLIGATION_CATALOGS) { assert.equal(catalog.may_narrow_navigation, false, `${catalog.domain_id} may not narrow navigation`); assert.equal(catalog.may_lock_domain, false, `${catalog.domain_id} may not lock domain`); }

const output = buildDomainControlObligationNavigationArtifacts({ runId: "TEST-RUN", artifacts: { lossless_root__regulatory_licensing_status: {}, lossless_root__grievance_complaints: {}, lossless_root__security_trust_compliance: {}, legal_cartography_index: {}, legal_signal_derivation_profile: {} } });
const det = output.domain_control_obligation_deterministic_map;
const sem = output.domain_control_obligation_semantic_profile;
const idx = output.domain_control_obligation_navigation_index;

assert.equal(validateDomainControlObligationDeterministicMap(det).ok, true);
assert.equal(validateDomainControlObligationSemanticProfile(sem).ok, true);
assert.equal(validateDomainControlObligationNavigationIndex(idx).ok, true);
assert.equal(idx.artifact_type, "domain_control_obligation_navigation_index");
assert.equal(idx.navigation_rules.domain_lock_allowed, false);
assert.equal(idx.navigation_rules.contains_obligation_posture, false);
assert.equal(idx.navigation_rules.contains_lossless_text, false);
assert.equal(idx.navigation_rules.contains_profile_answers, false);
assert.equal(idx.navigation_rules.obligation_catalog_driven, true);
assert.equal(idx.navigation_rules.domain_blind_builder, true);
assert.ok(idx.control_source_routes.length >= 1);
assert.equal(idx.obligation_shell_locator_inventory.length, OBLIGATION_SHELL_FIELDS.length);
assert.ok(idx.obligation_shell_locator_inventory.every((field) => field.action === "LOCATE_ONLY" && field.derived_value_forbidden === true));
const custody = idx.obligation_family_routing.find((row) => row.obligation_family === "funds_custody_safeguarding");
assert.ok(custody && custody.required_control_source_route_ids.length >= 1, "custody family routed");
assert.ok(custody.required_control_source_route_ids.every((id) => idx.control_source_routes.some((route) => route.route_id === id)), "custody routes resolve");
assert.ok(Array.isArray(idx.access_gap_ledger));
for (const gap of idx.access_gap_ledger) { assert.equal(gap.gap_status, "SOURCE_NOT_PRESENT_IN_PHASE1_INPUTS"); assert.equal(gap.navigation_gap_only, true); assert.equal(gap.obligation_posture_conclusion, false); }
for (const route of idx.control_source_routes) for (const pointer of route.pointers || []) { assert.ok(pointer.artifact_name.startsWith("lossless_root__"), `pointer must be phase1 root: ${pointer.artifact_name}`); assert.equal(["lossless_root__security_trust", "lossless_root__trust_compliance", "lossless_root__technical_docs_api_developer"].includes(pointer.artifact_name), false, `retired root used: ${pointer.artifact_name}`); }
const serialized = JSON.stringify(idx);
for (const forbidden of ["data_provenance_source_index", "obligation_present", "obligation_absent", "obligation_partial", "\"lossless_text\":", "\"excerpt\":", "\"snippet\":", "\"summary\":", "\"legal_conclusion\":", "\"compliance_conclusion\":"]) assert.equal(serialized.includes(forbidden), false, `forbidden marker in DCONI: ${forbidden}`);
console.log("Phase 2 domain control obligation navigation index: PASS");

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHANGED = []


def replace_exact(relative_path, old, new, expected=1):
    path = ROOT / relative_path
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != expected:
        raise RuntimeError(
            f"{relative_path}: expected {expected} occurrences, found {count}: {old[:120]!r}"
        )
    updated = text.replace(old, new)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        CHANGED.append(relative_path)


# CF-001 / CF-002 — terminal receipts use one canonical reinvestigation status.
path = "agent-packages/agent_3_target_feature/00_TERMINAL_RECEIPT_RULES_INTEGRATED.md"
replace_exact(
    path,
    "`TERM.S1.C2` If validator status is `REINVESTIGATION_REQUIRED`, `SOURCE_REINVESTIGATION_REQUIRED`, or `CONTROLLED_FAILURE`, terminal must not emit a next-phase or next-agent command.",
    "`TERM.S1.C2` If validator status is `REINVESTIGATION_REQUIRED` or `CONTROLLED_FAILURE`, terminal must not emit a next-phase or next-agent command. Source scope, owning phase, reason code, and attempt number must be carried as receipt metadata, not encoded as a new status.",
)
replace_exact(path, "# SECTION 3 — FAILURE AND REPAIR RECEIPTS", "# SECTION 3 — REINVESTIGATION AND CRITICAL-FAILURE RECEIPTS")
replace_exact(
    path,
    "`TERM.S3.C1` If validator status is `REINVESTIGATION_REQUIRED` or `SOURCE_REINVESTIGATION_REQUIRED`, emit in manual mode:",
    "`TERM.S3.C1` If validator status is `REINVESTIGATION_REQUIRED`, emit in manual mode. The receipt must identify `reinvestigation_owner_phase`, `reinvestigation_scope`, `reinvestigation_reason_code`, and `attempt_number` without inventing a source-specific status:",
)
replace_exact(
    path,
    """PHASE REPAIR REQUIRED: <phase_lock_or_active_phase>
Run ID: <run_id>

Repair owner:
<repair_owner>

Repair scope:
<repair_scope>

Blocking reasons:
- <blocking_reason_1>
- <blocking_reason_2>

NEXT STEP:
Repair this phase before continuing. Do not move to the next phase yet.""",
    """PHASE REINVESTIGATION REQUIRED: <phase_lock_or_active_phase>
Run ID: <run_id>

Reinvestigation owner phase:
<reinvestigation_owner_phase>

Reinvestigation scope:
<reinvestigation_scope>

Reason code:
<reinvestigation_reason_code>

Attempt:
<attempt_number_of_2>

Unresolved reasons:
- <unresolved_reason_1>
- <unresolved_reason_2>

NEXT STEP:
Return control to the backend for targeted reinvestigation. Do not advance this phase yet. This is not a global run block.""",
)
replace_exact(
    path,
    "`TERM.S3.C2` Do not include a next-agent command in `REINVESTIGATION_REQUIRED` or `SOURCE_REINVESTIGATION_REQUIRED` receipts.",
    "`TERM.S3.C2` Do not include a next-agent command in a `REINVESTIGATION_REQUIRED` receipt. After the second unsuccessful targeted attempt, ordinary unresolved matters must be projected as limitations or warnings and the run must continue unless a separately classified critical failure exists.",
)
replace_exact(path, "## 3.3 RETURN_TO_UPSTREAM_REPAIR Receipt", "## 3.3 RETURN_TO_UPSTREAM_REINVESTIGATION Receipt")
replace_exact(
    path,
    """PHASE REPAIR REQUIRED: <phase_lock_or_active_phase>
Run ID: <run_id>

Repair owner:
<upstream_agent_name>

Repair scope:
<upstream_artifact_or_route_defect>

NEXT STEP:
Return to the upstream repair phase identified above. Do not continue this phase until upstream repair is saved.""",
    """PHASE REINVESTIGATION REQUIRED: <phase_lock_or_active_phase>
Run ID: <run_id>

Reinvestigation owner phase:
<upstream_agent_name>

Reinvestigation scope:
<upstream_artifact_or_route_defect>

Reason code:
<upstream_reinvestigation_reason_code>

Attempt:
<attempt_number_of_2>

NEXT STEP:
Return control to the upstream owning phase for targeted reinvestigation. Do not advance this phase until the return artifact is saved.""",
)
replace_exact(
    path,
    "`TERM.S3.C6` Upstream repair instructions are allowed only for repair routing. They are not successful next-phase handoff commands.",
    "`TERM.S3.C6` Upstream reinvestigation instructions are allowed only for scoped return routing. They are not successful next-phase handoff commands and do not create a global blocking status.",
)

# Runtime controller projects source scope through metadata, not a status alias.
path = "agent-packages/agent_4_data_privacy/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md"
replace_exact(
    path,
    """  REINVESTIGATION_COMPLETED_WITH_LIMITATION: LOCKED_WITH_LIMITATIONS
  SOURCE_REINVESTIGATION_REQUIRED: REINVESTIGATION_REQUIRED
  REINVESTIGATION_REQUIRED: REINVESTIGATION_REQUIRED
  CONTROLLED_FAILURE: CONTROLLED_FAILURE""",
    """  REINVESTIGATION_COMPLETED_WITH_LIMITATION: LOCKED_WITH_LIMITATIONS
  REINVESTIGATION_REQUIRED: REINVESTIGATION_REQUIRED
  CONTROLLED_FAILURE: CONTROLLED_FAILURE

reinvestigation_projection_requirements:
  status: REINVESTIGATION_REQUIRED
  reinvestigation_owner_phase: required
  reinvestigation_scope: required
  reinvestigation_reason_code: required
  attempt_number: required_max_2
  source_or_upstream_scope_must_be_metadata_not_status_alias: true""",
)

# M7 — distinct reasons share one canonical status; only pass states advance.
path = "prompts/02_M7_TARGET_PROFILE_RUNTIME_SYNC_PATCHED_STEP1_LOCKED_v3.md"
replace_exact(
    path,
    """  allowed_gate_outcomes:
    - PASS
    - REINVESTIGATION_REQUIRED
    - REINVESTIGATION_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE""",
    """  allowed_gate_outcomes:
    - PASS
    - REINVESTIGATION_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE

  reinvestigation_metadata_required:
    reinvestigation_owner_phase: M7_OR_UPSTREAM_M6
    reinvestigation_scope: required
    reinvestigation_reason_code: LOCAL_PHASE_DEFECT | EVIDENCE_GAP | UPSTREAM_SOURCE_UNIVERSE_DEFECT
    attempt_number: 1_OR_2""",
)
replace_exact(
    path,
    """repair_policy:
  - If the local gate returns REINVESTIGATION_REQUIRED, repair M7 only and rerun the local gate.
  - If the local gate returns REINVESTIGATION_REQUIRED, emit a scoped reinvestigation request and do not advance.
  - If the defect is missing M6 route universe coverage, return to M6/Agent 1 source repair instead of inventing facts.
  - Do not recompute unrelated upstream objects.""",
    """repair_policy:
  - For a local M7 shape, derivation, or field defect, return `REINVESTIGATION_REQUIRED` with owner `M7`, reason `LOCAL_PHASE_DEFECT`, and the smallest affected scope; then rerun only that scope.
  - For an evidence gap, return `REINVESTIGATION_REQUIRED` with owner `M7`, reason `EVIDENCE_GAP`, and a scoped targeted re-extraction request.
  - If M6 route-universe coverage is missing, keep status `REINVESTIGATION_REQUIRED` and set owner `M6`, reason `UPSTREAM_SOURCE_UNIVERSE_DEFECT`, and the exact missing route/artifact scope instead of inventing facts.
  - Permit at most two targeted reinvestigation attempts. After the second unsuccessful attempt, preserve the unresolved matter as a limitation or warning and continue if the output remains truthful and structurally usable.
  - Use `CONTROLLED_FAILURE` only for a separately established critical authority, custody, integrity, permission, or required-artifact failure.
  - Do not recompute unrelated upstream objects.""",
)
replace_exact(
    path,
    """  The Agent 2 resolver may proceed to M8 only if M7 returns PASS, PASS_WITH_LIMITATION, or CONTROLLED_FAILURE that is expressly safe for downstream use.
  If M7 returns REINVESTIGATION_REQUIRED or REINVESTIGATION_REQUIRED, do not proceed to M8.""",
    """  The Agent 2 resolver may proceed to M8 only if M7 returns `PASS` or `PASS_WITH_LIMITATION` and both M7 artifacts are saved.
  `REINVESTIGATION_REQUIRED` stops M7 locally for a maximum of two targeted attempts but does not block the entire run. `CONTROLLED_FAILURE` blocks advancement.""",
)
replace_exact(
    path,
    "`M7.S0.C3` The Module may not advance, hand off, or be treated as locked until its phase-local gate has returned `PASS`, `PASS_WITH_LIMITATION`, or `CONTROLLED_FAILURE` under the rules above.",
    "`M7.S0.C3` The Module may advance or be treated as locked only when its phase-local gate returns `PASS` or `PASS_WITH_LIMITATION`. `CONTROLLED_FAILURE` is a blocking terminal state and never an advance-eligible gate.",
)
replace_exact(
    path,
    "`M7.S0.C4` `REINVESTIGATION_REQUIRED` and `REINVESTIGATION_REQUIRED` are stop states. The Module must repair, route targeted field re-extraction, or route scoped M6 repair before the next Module begins.",
    "`M7.S0.C4` `REINVESTIGATION_REQUIRED` is a local stop-and-return state. It must include owner, scope, reason code, and attempt number; after no more than two unsuccessful attempts, ordinary unresolved matters become limitations or warnings rather than global blockers.",
)
replace_exact(
    path,
    """extraction_result:
  one_of:
    - FIELD_RELEVANT_MATERIAL_EXTRACTED
    - NO_FIELD_RELEVANT_MATERIAL_FOUND
    - DUPLICATE_CANONICALIZED
    - GATED_OR_NON_PUBLIC
    - BROKEN_OR_404
    - OUTSIDE_M7_SCOPE_WITH_REASON
    - RETURN_TO_M6_REINVESTIGATION_REQUIRED
extracted_material_refs:
exclusion_or_limitation_reason:""",
    """extraction_result:
  one_of:
    - FIELD_RELEVANT_MATERIAL_EXTRACTED
    - NO_FIELD_RELEVANT_MATERIAL_FOUND
    - DUPLICATE_CANONICALIZED
    - GATED_OR_NON_PUBLIC
    - BROKEN_OR_404
    - OUTSIDE_M7_SCOPE_WITH_REASON
    - REINVESTIGATION_REQUIRED
reinvestigation_metadata_when_required:
  reinvestigation_owner_phase: M6
  reinvestigation_scope: exact_route_or_artifact
  reinvestigation_reason_code: UPSTREAM_SOURCE_UNIVERSE_DEFECT
  attempt_number: 1_OR_2
extracted_material_refs:
exclusion_or_limitation_reason:""",
)

# M8 — same doctrine.
path = "prompts/03_M8_FEATURE_PROFILE_RUNTIME_SYNC_PATCHED_STEP2_UPDATED.md"
replace_exact(
    path,
    """  allowed_gate_outcomes:
    - PASS
    - REINVESTIGATION_REQUIRED
    - REINVESTIGATION_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE""",
    """  allowed_gate_outcomes:
    - PASS
    - REINVESTIGATION_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE

  reinvestigation_metadata_required:
    reinvestigation_owner_phase: M8_OR_UPSTREAM_M6
    reinvestigation_scope: required
    reinvestigation_reason_code: LOCAL_PHASE_DEFECT | EVIDENCE_GAP | UPSTREAM_SOURCE_UNIVERSE_DEFECT
    attempt_number: 1_OR_2""",
)
replace_exact(
    path,
    """repair_policy:
  - If the local gate returns REINVESTIGATION_REQUIRED, repair M8 only and rerun the local gate.
  - If the local gate returns REINVESTIGATION_REQUIRED, emit a scoped targeted re-extraction request and do not advance.
  - If the necessary Product / Activity route is absent from M6, route repair back to M6/Agent 1 instead of inventing or searching.
  - Do not recompute unrelated upstream objects.""",
    """repair_policy:
  - For a local M8 shape, mechanics, archetype, or surface defect, return `REINVESTIGATION_REQUIRED` with owner `M8`, reason `LOCAL_PHASE_DEFECT`, and the smallest affected scope.
  - For an evidence gap, return `REINVESTIGATION_REQUIRED` with owner `M8`, reason `EVIDENCE_GAP`, and a scoped targeted re-extraction request.
  - If a necessary Product / Activity route is absent from M6, keep status `REINVESTIGATION_REQUIRED` and set owner `M6`, reason `UPSTREAM_SOURCE_UNIVERSE_DEFECT`, and the exact missing route/artifact scope instead of inventing or searching.
  - Permit at most two targeted reinvestigation attempts. After the second unsuccessful attempt, preserve the unresolved matter as a limitation or warning and continue if the profile remains truthful and structurally usable.
  - Use `CONTROLLED_FAILURE` only for a separately established critical authority, custody, integrity, permission, or required-artifact failure.
  - Do not recompute unrelated upstream objects.""",
)
replace_exact(
    path,
    "  The Agent 2 resolver may lock Agent 2 and provide the next-agent command only after `target_feature_profile` and `target_feature_profile_forensics` are saved and M8 returns PASS, PASS_WITH_LIMITATION, or CONTROLLED_FAILURE that is expressly safe for downstream use. If M8 returns REINVESTIGATION_REQUIRED or REINVESTIGATION_REQUIRED, do not advance.",
    "  The Agent 2 resolver may lock Agent 2 and provide the next-agent command only after `target_feature_profile` and `target_feature_profile_forensics` are saved and M8 returns `PASS` or `PASS_WITH_LIMITATION`. `REINVESTIGATION_REQUIRED` stops M8 locally for a maximum of two targeted attempts but does not block the entire run. `CONTROLLED_FAILURE` blocks advancement.",
)
replace_exact(
    path,
    "`M8.S0.C3` The Module may not advance, hand off, or be treated as locked until its phase-local gate has returned `PASS`, `PASS_WITH_LIMITATION`, or `CONTROLLED_FAILURE` under the rules above.",
    "`M8.S0.C3` The Module may advance or be treated as locked only when its phase-local gate returns `PASS` or `PASS_WITH_LIMITATION`. `CONTROLLED_FAILURE` is a blocking terminal state and never an advance-eligible gate.",
)
replace_exact(
    path,
    "`M8.S0.C4` `REINVESTIGATION_REQUIRED` and `REINVESTIGATION_REQUIRED` are stop states. The Module must repair or route scoped reinvestigation before the next Module begins.",
    "`M8.S0.C4` `REINVESTIGATION_REQUIRED` is a local stop-and-return state. It must include owner, scope, reason code, and attempt number; after no more than two unsuccessful attempts, ordinary unresolved matters become limitations or warnings rather than global blockers.",
)

# M10 — same doctrine across material and forensic gates.
path = "agent-packages/agent_4_data_privacy/M10_DATA_PROVENANCE.md"
replace_exact(
    path,
    """  allowed_gate_outcomes:
    - PASS
    - REINVESTIGATION_REQUIRED
    - REINVESTIGATION_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE""",
    """  allowed_gate_outcomes:
    - PASS
    - REINVESTIGATION_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE

  reinvestigation_metadata_required:
    reinvestigation_owner_phase: M10_OR_UPSTREAM_OWNER
    reinvestigation_scope: required
    reinvestigation_reason_code: LOCAL_PHASE_DEFECT | EVIDENCE_GAP | UPSTREAM_SOURCE_UNIVERSE_DEFECT
    attempt_number: 1_OR_2""",
)
replace_exact(
    path,
    """repair_policy:
  - If local gate returns REINVESTIGATION_REQUIRED, repair M10 only and rerun the local gate.
  - If local gate returns REINVESTIGATION_REQUIRED, emit a scoped reinvestigation request limited to M6-approved routes/materials, locked upstream objects, M9 navigation refs, and documented absence/access records.
  - If necessary data/privacy/security/control route is absent from M6, return to M6/Agent 1 repair instead of searching or inventing.
  - Do not recompute unrelated upstream objects.""",
    """repair_policy:
  - For a local M10 shape, derivation, readiness-row, Anti-Unknown, or missing-proof defect, return `REINVESTIGATION_REQUIRED` with owner `M10`, reason `LOCAL_PHASE_DEFECT`, and the smallest affected scope.
  - For an evidence gap, return `REINVESTIGATION_REQUIRED` with owner `M10`, reason `EVIDENCE_GAP`, and a scoped request limited to approved routes/materials, locked upstream objects, navigation refs, and documented absence/access records.
  - If a necessary data/privacy/security/control route is absent upstream, keep status `REINVESTIGATION_REQUIRED` and set the upstream owning phase, reason `UPSTREAM_SOURCE_UNIVERSE_DEFECT`, and exact missing route/artifact scope instead of searching or inventing.
  - Permit at most two targeted reinvestigation attempts. After the second unsuccessful attempt, preserve the unresolved matter as a limitation or warning and continue if the profile remains truthful and structurally usable.
  - Use `CONTROLLED_FAILURE` only for a separately established critical authority, custody, integrity, permission, or required-artifact failure.
  - Do not recompute unrelated upstream objects.""",
)
replace_exact(
    path,
    "`M10.S0.C3` The Module may not advance, hand off, or be treated as locked until its phase-local gate has returned `PASS`, `PASS_WITH_LIMITATION`, or `CONTROLLED_FAILURE`.",
    "`M10.S0.C3` The Module may advance or be treated as locked only when its phase-local gate returns `PASS` or `PASS_WITH_LIMITATION`. `CONTROLLED_FAILURE` is a blocking terminal state and never an advance-eligible gate.",
)
replace_exact(
    path,
    "`M10.S0.C4` `REINVESTIGATION_REQUIRED` and `REINVESTIGATION_REQUIRED` are stop states.",
    "`M10.S0.C4` `REINVESTIGATION_REQUIRED` is a local stop-and-return state. It must include owner, scope, reason code, and attempt number; after no more than two unsuccessful attempts, ordinary unresolved matters become limitations or warnings rather than global blockers.",
)
replace_exact(
    path,
    "- `SOURCE_REINVESTIGATION_REQUIRED` only for upstream source-universe defects",
    "- `REINVESTIGATION_REQUIRED` only during a targeted attempt, with upstream ownership and source scope carried in metadata rather than encoded in the status",
    expected=2,
)
replace_exact(
    path,
    "Any earlier `REINVESTIGATION_REQUIRED` or `REINVESTIGATION_REQUIRED` wording in this module is interpreted as an internal stop-and-repair workflow state, not a handoff-eligible final phase outcome. It does not authorize advancement to M11.",
    "`REINVESTIGATION_REQUIRED` is an internal stop-and-return state, not a handoff-eligible final outcome. It does not authorize advancement to M11, and it may be used for no more than two targeted attempts before an ordinary unresolved matter is preserved as a limitation or warning.",
    expected=2,
)

# Phase 7 navigation statuses use canonical status plus metadata.
path = "src/phases/07-data-provenance-profile/layer2-anti-unknown-protocol.js"
replace_exact(
    path,
    """  \"REQUIRES_PRIVATE_CONFIRMATION\",
  \"NAVIGATION_DEFECT_REINVESTIGATION_REQUIRED\",
  \"UPSTREAM_SOURCE_REINVESTIGATION_REQUIRED\",
  \"PINPOINT_NAVIGATION_READY\""".replace('\\"', '"'),
    """  \"REQUIRES_PRIVATE_CONFIRMATION\",
  \"REINVESTIGATION_REQUIRED\",
  \"PINPOINT_NAVIGATION_READY\""".replace('\\"', '"'),
)
replace_exact(
    path,
    """export function controlledStatusForFamilyCoverage({ primaryRoutes = [], secondaryRoutes = [], mandatory = true } = {}) {
  if (primaryRoutes.length) return \"PINPOINT_NAVIGATION_READY\";
  if (secondaryRoutes.length) return \"DERIVED_CROSS_ROUTE\";
  return mandatory ? \"UPSTREAM_SOURCE_REINVESTIGATION_REQUIRED\" : \"SOURCE_NOT_ROUTED_BY_M6\";
}""".replace('\\"', '"'),
    """export const PHASE7_REINVESTIGATION_REASON_CODES = Object.freeze({
  NAVIGATION_DEFECT: \"NAVIGATION_DEFECT\",
  UPSTREAM_SOURCE_UNIVERSE_DEFECT: \"UPSTREAM_SOURCE_UNIVERSE_DEFECT\"
});

export function controlledStatusForFamilyCoverage({ primaryRoutes = [], secondaryRoutes = [], mandatory = true } = {}) {
  if (primaryRoutes.length) return \"PINPOINT_NAVIGATION_READY\";
  if (secondaryRoutes.length) return \"DERIVED_CROSS_ROUTE\";
  return mandatory ? \"REINVESTIGATION_REQUIRED\" : \"SOURCE_NOT_ROUTED_BY_M6\";
}

export function reinvestigationMetadataForFamilyCoverage({ primaryRoutes = [], secondaryRoutes = [], mandatory = true } = {}) {
  if (primaryRoutes.length || secondaryRoutes.length || !mandatory) return null;
  return Object.freeze({
    reinvestigation_owner_phase: \"SOURCE_DISCOVERY\",
    reinvestigation_scope: \"DAP_FAMILY_ROUTE_COVERAGE\",
    reinvestigation_reason_code: PHASE7_REINVESTIGATION_REASON_CODES.UPSTREAM_SOURCE_UNIVERSE_DEFECT,
    attempt_limit: 2
  });
}""".replace('\\"', '"'),
)

path = "src/phases/07-data-provenance-profile/layer2-source-navigation-inventory-builder.js"
replace_exact(
    path,
    'import { controlledStatusForFamilyCoverage, controlledStatusForRoute } from "./layer2-anti-unknown-protocol.js";',
    'import { PHASE7_REINVESTIGATION_REASON_CODES, controlledStatusForFamilyCoverage, controlledStatusForRoute, reinvestigationMetadataForFamilyCoverage } from "./layer2-anti-unknown-protocol.js";',
)
replace_exact(
    path,
    """      mandatory_before_unresolved: obligation.mandatory_before_unresolved,
      family_navigation_status: controlledStatusForFamilyCoverage({ primaryRoutes, secondaryRoutes, mandatory: obligation.mandatory_before_unresolved }),
      anti_unknown_obligation: obligation.anti_unknown_obligation""",
    """      mandatory_before_unresolved: obligation.mandatory_before_unresolved,
      family_navigation_status: controlledStatusForFamilyCoverage({ primaryRoutes, secondaryRoutes, mandatory: obligation.mandatory_before_unresolved }),
      reinvestigation_metadata: reinvestigationMetadataForFamilyCoverage({ primaryRoutes, secondaryRoutes, mandatory: obligation.mandatory_before_unresolved }),
      anti_unknown_obligation: obligation.anti_unknown_obligation""",
)
replace_exact(
    path,
    """function buildTargetedScanQueue({ coverageMatrix }) {
  return coverageMatrix.filter((row) => row.family_navigation_status === \"UPSTREAM_SOURCE_REINVESTIGATION_REQUIRED\" || row.family_navigation_status === \"SOURCE_NOT_ROUTED_BY_M6\").map((row) => Object.freeze({ registry_family: row.registry_family, reason: row.family_navigation_status, required_document_types: row.primary_required_document_types }));
}""".replace('\\"', '"'),
    """function buildTargetedScanQueue({ coverageMatrix }) {
  return coverageMatrix
    .filter((row) => row.family_navigation_status === \"REINVESTIGATION_REQUIRED\" || row.family_navigation_status === \"SOURCE_NOT_ROUTED_BY_M6\")
    .map((row) => Object.freeze({
      registry_family: row.registry_family,
      status: row.family_navigation_status,
      reason: row.reinvestigation_metadata?.reinvestigation_reason_code || row.family_navigation_status,
      reinvestigation_metadata: row.reinvestigation_metadata,
      required_document_types: row.primary_required_document_types
    }));
}""".replace('\\"', '"'),
)
replace_exact(
    path,
    """function buildAbsenceLedger({ routeInventory, coverageMatrix }) {
  const badLegal = routeInventory.filter((row) => row.legal_cartography_locator_required && !row.legal_cartography_locator_present).map((row) => Object.freeze({ route_id: row.route_id, status: \"NAVIGATION_DEFECT_REINVESTIGATION_REQUIRED\", reason: \"legal_lossless_without_legal_cartography_locator\" }));
  const gaps = coverageMatrix.filter((row) => row.family_navigation_status === \"UPSTREAM_SOURCE_REINVESTIGATION_REQUIRED\" || row.family_navigation_status === \"SOURCE_NOT_ROUTED_BY_M6\").map((row) => Object.freeze({ registry_family: row.registry_family, status: row.family_navigation_status, reason: \"no_pinpoint_route\" }));
  return Object.freeze([...badLegal, ...gaps]);
}""".replace('\\"', '"'),
    """function buildAbsenceLedger({ routeInventory, coverageMatrix }) {
  const badLegal = routeInventory
    .filter((row) => row.legal_cartography_locator_required && !row.legal_cartography_locator_present)
    .map((row) => Object.freeze({
      route_id: row.route_id,
      status: \"REINVESTIGATION_REQUIRED\",
      reinvestigation_owner_phase: \"CARTOGRAPHY_INDEX\",
      reinvestigation_scope: row.route_id,
      reinvestigation_reason_code: PHASE7_REINVESTIGATION_REASON_CODES.NAVIGATION_DEFECT,
      attempt_limit: 2,
      reason: \"legal_lossless_without_legal_cartography_locator\"
    }));
  const gaps = coverageMatrix
    .filter((row) => row.family_navigation_status === \"REINVESTIGATION_REQUIRED\" || row.family_navigation_status === \"SOURCE_NOT_ROUTED_BY_M6\")
    .map((row) => Object.freeze({
      registry_family: row.registry_family,
      status: row.family_navigation_status,
      ...(row.reinvestigation_metadata || {}),
      reason: \"no_pinpoint_route\"
    }));
  return Object.freeze([...badLegal, ...gaps]);
}""".replace('\\"', '"'),
)

# Guard against the exact semantic residues this applicator owns.
for relative_path in sorted(set(CHANGED)):
    text = (ROOT / relative_path).read_text(encoding="utf-8")
    for forbidden in (
        "SOURCE_REINVESTIGATION_REQUIRED",
        "UPSTREAM_SOURCE_REINVESTIGATION_REQUIRED",
        "NAVIGATION_DEFECT_REINVESTIGATION_REQUIRED",
        "REINVESTIGATE_REQUIRED",
        "RETURN_TO_M6_REINVESTIGATION_REQUIRED",
        "`REINVESTIGATION_REQUIRED` and `REINVESTIGATION_REQUIRED`",
    ):
        if forbidden in text:
            raise RuntimeError(f"{relative_path}: forbidden residue remains: {forbidden}")

print({"status": "PASS", "changed_files": sorted(set(CHANGED)), "changed_file_count": len(set(CHANGED))})

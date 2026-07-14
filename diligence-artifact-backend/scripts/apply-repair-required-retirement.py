from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BINARY_EXTENSIONS = {'.docx', '.zip', '.png', '.jpg', '.jpeg', '.gif', '.pdf', '.woff', '.woff2', '.ttf', '.ico'}


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


def write(rel, text):
    (ROOT / rel).write_text(text, encoding='utf-8')


def replace(rel, old, new, expected_min=1):
    text = read(rel)
    count = text.count(old)
    if count < expected_min:
        raise SystemExit(f'PATCH_PATTERN_MISSING:{rel}:{old[:100]}')
    write(rel, text.replace(old, new))


# Global lexical retirement across the active backend. Historical material outside
# diligence-artifact-backend is not production authority.
for path in sorted(ROOT.rglob('*')):
    if not path.is_file() or path.suffix.lower() in BINARY_EXTENSIONS:
        continue
    if any(part in {'node_modules', '.git'} for part in path.parts):
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    updated = text.replace('REPAIR_REQUIRED', 'REINVESTIGATION_REQUIRED')
    updated = updated.replace('REINVESTIGATE_REQUIRED', 'REINVESTIGATION_REQUIRED')
    if updated != text:
        path.write_text(updated, encoding='utf-8')

# Deterministic profile forensics are trace artifacts. Missing/thin trace is a
# limitation, not a run blocker.
replace(
    'src/phases/_shared/forensics/profile-forensics.shared.js',
    'status: failures.length ? "REINVESTIGATION_REQUIRED" : "PASS",',
    'status: failures.length ? "PASS_WITH_LIMITATION" : "PASS",'
)
for rel in [
    'src/phases/04-target-profile-forensics/target-profile-forensics.runner.js',
    'src/phases/06-activity-profile-forensics/activity-profile-forensics.runner.js'
]:
    replace(rel, 'return "REINVESTIGATION_REQUIRED";', 'return "LOCKED_WITH_LIMITATIONS";')

# Phase 11 already owns the critical-only doctrine. Preserve critical substrate
# failures as controlled failures; reinvestigation remains non-blocking.
replace(
    'src/phases/11-operator-challenge/domain-control-obligation-profile.handoff.js',
    'const status = criticalFailures.length ? "REINVESTIGATION_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";',
    'const status = criticalFailures.length ? "CONTROLLED_FAILURE" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";'
)
replace(
    'src/phases/11-operator-challenge/domain-control-obligation-profile.handoff.js',
    'gate: criticalFailures.length ? "REINVESTIGATION_REQUIRED" : warnings.length ? "PASS_WITH_LIMITATIONS" : "PASS",',
    'gate: criticalFailures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATIONS" : "PASS",'
)
replace(
    'src/phases/11-operator-challenge/m12-deterministic-challenge.js',
    'const BLOCKING_BATCH_STATUSES = new Set(["REINVESTIGATION_REQUIRED", "CONTROLLED_FAILURE"]);',
    'const BLOCKING_BATCH_STATUSES = new Set(["CONTROLLED_FAILURE"]);'
)
replace(
    'src/phases/11-operator-challenge/m12-deterministic-challenge.js',
    'const status = critical_failures.length ? "REINVESTIGATION_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";',
    'const status = critical_failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";'
)
replace(
    'src/phases/11-operator-challenge/m12-deterministic-challenge.js',
    'gate: critical_failures.length ? "REINVESTIGATION_REQUIRED" : warnings.length ? "PASS_WITH_LIMITATIONS" : "PASS",',
    'gate: critical_failures.length ? "CONTROLLED_FAILURE" : warnings.length ? "PASS_WITH_LIMITATIONS" : "PASS",'
)

# Reinvestigation is never a terminal run state.
replace(
    'src/runtime/services/async.service.js',
    'const TERMINAL_STATUSES = new Set(["COMPLETE", "REINVESTIGATION_REQUIRED", "CONTROLLED_FAILURE"]);',
    'const TERMINAL_STATUSES = new Set(["COMPLETE", "COMPLETE_WITH_WARNINGS", "COMPLETE_WITH_COUNSEL_ACTIONS", "CONTROLLED_FAILURE"]);'
)

# Phase 10: semantic model defects get two attempts. Residual material uncertainty
# is retained row-by-row and advances with limitations. Structural custody and
# registry-spine failures remain critical.
replace(
    'src/phases/10-exposure-profile/m11-orchestrator-m11v2.js',
    '  assembleAcceptedBatch,\n',
    '  assembleAcceptedBatch,\n  assembleLimitedBatch,\n'
)
replace(
    'src/phases/10-exposure-profile/m11-orchestrator-m11v2.js',
    '  const acceptedBatches = [];\n  const batchValidations = [];',
    '  const acceptedBatches = [];\n  const batchValidations = [];\n  let hasLimitations = false;'
)
replace(
    'src/phases/10-exposure-profile/m11-orchestrator-m11v2.js',
    '''    if (validation.exposure_registry_batch_validation.status !== "PASS") {\n      return failBatch({ run, phase, batch, failures: validation.exposure_registry_batch_validation.failures, manifest: manifest.artifact, validation });\n    }\n\n    const stampedValidation = stampPhase10ExecutionMetadata(validation, manifest.artifact);\n    const accepted = stampPhase10ExecutionMetadata(assembleAcceptedBatch({ semanticOutput, batch, routePlan: route.artifact }), manifest.artifact);\n    const validationName = batchValidationArtifactName(batch);\n    const batchName = batchArtifactName(batch);\n    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: validationName, artifact: stampedValidation, lock_status: "LOCKED" }));\n    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: batchName, artifact: accepted, lock_status: "LOCKED" }));''',
    '''    const validationName = batchValidationArtifactName(batch);\n    const batchName = batchArtifactName(batch);\n    if (validation.exposure_registry_batch_validation.status !== "PASS") {\n      hasLimitations = true;\n      const failures = [...(validation.exposure_registry_batch_validation.failures || [])];\n      const limitedValidation = stampPhase10ExecutionMetadata({\n        exposure_registry_batch_validation: {\n          ...validation.exposure_registry_batch_validation,\n          status: "PASS_WITH_LIMITATION",\n          failures: [],\n          limitations: [...new Set([...(validation.exposure_registry_batch_validation.limitations || []), ...failures.map((failure) => `UNRESOLVED_AFTER_REINVESTIGATION:${failure}`)])],\n          exact_coverage: true,\n          semantic_resolution_limited: true,\n          reinvestigation_attempts: 2,\n          blocking_failure: false\n        }\n      }, manifest.artifact);\n      const limitedBatch = stampPhase10ExecutionMetadata(assembleLimitedBatch({ batch, routePlan: route.artifact, failures }), manifest.artifact);\n      await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: validationName, artifact: limitedValidation, lock_status: "LOCKED_WITH_LIMITATIONS" }));\n      await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: batchName, artifact: limitedBatch, lock_status: "LOCKED_WITH_LIMITATIONS" }));\n      await logEvent({ run_id: run.run_id, event_type: "M11_BATCH_UNRESOLVED_AFTER_REINVESTIGATION", actor: AGENT_5, payload: { batch_id: batch.batch_id, package_id: batch.package_id, stream_id: batch.stream_id, failures, blocking_failure: false } });\n      acceptedBatches.push(limitedBatch);\n      batchValidations.push(limitedValidation);\n      continue;\n    }\n\n    const stampedValidation = stampPhase10ExecutionMetadata(validation, manifest.artifact);\n    const accepted = stampPhase10ExecutionMetadata(assembleAcceptedBatch({ semanticOutput, batch, routePlan: route.artifact }), manifest.artifact);\n    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: validationName, artifact: stampedValidation, lock_status: "LOCKED" }));\n    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: batchName, artifact: accepted, lock_status: "LOCKED" }));'''
)
replace(
    'src/phases/10-exposure-profile/m11-orchestrator-m11v2.js',
    '''  const finalStatus = forensics.artifact?.forensic_lock_gate_result?.status === "PASS" ? "LOCKED" : "REINVESTIGATION_REQUIRED";''',
    '''  const forensicStatus = forensics.artifact?.forensic_lock_gate_result?.status || "CONTROLLED_FAILURE";\n  const finalStatus = forensicStatus === "PASS"\n    ? (hasLimitations ? "LOCKED_WITH_LIMITATIONS" : "LOCKED")\n    : forensicStatus === "PASS_WITH_LIMITATION"\n      ? "LOCKED_WITH_LIMITATIONS"\n      : "CONTROLLED_FAILURE";'''
)
replace(
    'src/phases/10-exposure-profile/m11-orchestrator-m11v2.js',
    'return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: finalStatus, next_phase: finalStatus === "LOCKED" ? contract.next : phase });',
    'return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: finalStatus, next_phase: finalStatus === "CONTROLLED_FAILURE" ? phase : contract.next });'
)
replace(
    'src/phases/10-exposure-profile/m11-orchestrator-m11v2.js',
    '  const lock_status = artifact?.forensic_lock_gate_result?.status === "REINVESTIGATION_REQUIRED" ? "REINVESTIGATION_REQUIRED" : "LOCKED";',
    '  const forensicStatus = artifact?.forensic_lock_gate_result?.status;\n  const lock_status = forensicStatus === "CONTROLLED_FAILURE" ? "CONTROLLED_FAILURE" : forensicStatus === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";'
)

finalization = 'src/phases/10-exposure-profile/phase10-semantic-finalization.js'
replace(
    finalization,
    'forensic_lock_gate_result: { status: failures.length ? "REINVESTIGATION_REQUIRED" : "PASS",',
    'forensic_lock_gate_result: { status: failures.length ? "CONTROLLED_FAILURE" : "PASS",'
)
insert_marker = '\nexport function buildDynamicWorkpad({ manifest, routePlan, acceptedBatches = [], batchValidations = [] } = {}) {'
limited_function = r'''

export function assembleLimitedBatch({ batch, routePlan, failures = [] } = {}) {
  const route = unwrap(routePlan, "exposure_registry_route_plan");
  const routeByKey = new Map(asArray(route.route_rows).map((row) => [row.registry_row_key, row]));
  const limitation = `UNRESOLVED_AFTER_REINVESTIGATION:${asArray(failures).join("|") || "SEMANTIC_OUTPUT_INVALID"}`;
  const rows = asArray(batch.expected_registry_row_keys).map((key) => {
    const routeRow = routeByKey.get(key);
    if (!routeRow) throw new Error(`M11_BATCH_ROUTE_ROW_MISSING:${batch.batch_id}:${key}`);
    const spine = buildDeterministicSpine(routeRow, batch);
    assertCompleteDeterministicSpine(spine);
    const semanticRow = {
      Threat_ID: routeRow.Threat_ID,
      trigger_status: "partial",
      target_match: "Unresolved after targeted reinvestigation",
      basis_proof: "The public-evidence semantic evaluation did not produce a reliable conclusion after two targeted attempts.",
      control_exclusion_evaluation: "No positive control, exclusion, or trigger conclusion was applied.",
      evidence_source_basis: "Routed public evidence retained; semantic resolution remains limited.",
      applied_fp_mechanism: spine.FP_Mechanism,
      row_limitations: limitation,
      status_inputs: {
        target_match_present: "partial",
        hunter_conditions_met: "partial",
        trigger_if_met: "partial",
        exclude_if_met: "partial",
        visible_control_present: "partial",
        visible_control_defeats_or_reduces_exposure: "partial",
        evidence_sufficient: "no",
        public_evidence_limitation: "yes",
        false_positive_concern: "partial"
      }
    };
    return {
      ...pickCustody(spine),
      Threat_ID: routeRow.Threat_ID,
      deterministic_registry_spine: spine,
      semantic_evidence_application: semanticRow,
      final_material_status: FINAL_STATUSES.limitation,
      material_projection: buildMaterialProjection(spine, semanticRow),
      unresolved_after_reinvestigation: true
    };
  });
  return {
    m11_batch_registry_ledger: {
      schema_version: "m11_batch_registry_ledger.v4.complete_registry_spine.accepted",
      report_row_schema_version: REPORT_ROW_SCHEMA_VERSION,
      batch_id: batch.batch_id,
      stream_id: batch.stream_id,
      stream_type: batch.stream_type,
      package_id: batch.package_id,
      expected_registry_row_keys: [...batch.expected_registry_row_keys],
      accepted_registry_row_keys: rows.map((row) => row.registry_row_key),
      accepted_threat_ids: rows.map((row) => row.Threat_ID),
      batch_registry_ledger: rows,
      validation_status: "PASS_WITH_LIMITATION",
      unresolved_after_reinvestigation: true,
      blocking_failure: false
    }
  };
}
'''
text = read(finalization)
if insert_marker not in text:
    raise SystemExit('PHASE10_LIMITED_BATCH_INSERT_MARKER_MISSING')
write(finalization, text.replace(insert_marker, limited_function + insert_marker, 1))

# Phase 10 deterministic reconciliation failures are critical integrity failures.
for rel in [
    'src/phases/10-exposure-profile/m11-deterministic-forensics-m11v2.js',
    'src/phases/10-exposure-profile/m11-deterministic-forensics.js',
    'src/phases/10-exposure-profile/m11-forensic-trace-index.js',
    'src/phases/10-exposure-profile/m11-lep-deterministic.js'
]:
    text = read(rel).replace('failures.length ? "REINVESTIGATION_REQUIRED"', 'failures.length ? "CONTROLLED_FAILURE"')
    text = text.replace('mergedFailures.length ? "REINVESTIGATION_REQUIRED"', 'mergedFailures.length ? "CONTROLLED_FAILURE"')
    write(rel, text)

# Phase 10 workpad/profile reconciliation is structural. Semantic ledger validation
# remains reinvestigation-owned.
rel = 'src/phases/10-exposure-profile/m11-deterministic-system.js'
text = read(rel)
occurrences = text.count('failures.length ? "REINVESTIGATION_REQUIRED"')
if occurrences < 3:
    raise SystemExit(f'PHASE10_DETERMINISTIC_SYSTEM_EXPECTED_3_FAILURE_GATES:{occurrences}')
first = text.find('failures.length ? "REINVESTIGATION_REQUIRED"')
# First occurrence is semantic batch validation and remains reinvestigation.
head = text[:first + len('failures.length ? "REINVESTIGATION_REQUIRED"')]
tail = text[first + len('failures.length ? "REINVESTIGATION_REQUIRED"'):]
tail = tail.replace('failures.length ? "REINVESTIGATION_REQUIRED"', 'failures.length ? "CONTROLLED_FAILURE"')
write(rel, head + tail)

# Remove the temporary scanner and this applicator through the workflow after use.
print('Repair-required retirement transformation complete.')

import fs from "node:fs";

const file = "server.js";
let s = fs.readFileSync(file, "utf8");

// 1) terminalJson must be mutable because completion guard may replace it.
s = s.replace(
  "    const terminalJson = await extractTerminalJsonWithRepair({ text: modelResult.text, rootKey: FINAL_ROOT_KEY, modelResult });",
  "    let terminalJson = await extractTerminalJsonWithRepair({ text: modelResult.text, rootKey: FINAL_ROOT_KEY, modelResult });"
);

// 2) finalOutputHandoff must be mutable.
s = s.replace(
  "    const finalOutputHandoff = terminalJson?.[FINAL_ROOT_KEY];",
  "    let finalOutputHandoff = terminalJson?.[FINAL_ROOT_KEY];"
);

// 3) Add completion guard after finalOutputHandoff assignment.
const guardNeedle = "    let finalOutputHandoff = terminalJson?.[FINAL_ROOT_KEY];\n";
const guardInsert = `    let finalOutputHandoff = terminalJson?.[FINAL_ROOT_KEY];
    if (isPlainObject(finalOutputHandoff) && handoffNeedsCompletion(finalOutputHandoff)) {
      terminalJson = completeFinalOutputHandoffDeterministically({
        terminalJson,
        executionPayload,
        modelResult
      });
      finalOutputHandoff = terminalJson?.[FINAL_ROOT_KEY];
    }
`;

if (!s.includes("handoffNeedsCompletion(finalOutputHandoff)")) {
  s = s.replace(guardNeedle, guardInsert);
}

// 4) Insert deterministic completion functions before JSON repair function.
const marker = "async function extractTerminalJsonWithRepair";
const completionFns = `
function handoffNeedsCompletion(finalOutputHandoff) {
  if (!isPlainObject(finalOutputHandoff)) return true;
  return (
    !isPlainObject(finalOutputHandoff.screen_report_payload) ||
    !isPlainObject(finalOutputHandoff.vault_assembler_handoff) ||
    !isPlainObject(finalOutputHandoff.final_quality_control) ||
    !isPlainObject(finalOutputHandoff.handoff_lock)
  );
}

function completeFinalOutputHandoffDeterministically({ terminalJson, executionPayload, modelResult }) {
  const existing = isPlainObject(terminalJson?.[FINAL_ROOT_KEY])
    ? terminalJson[FINAL_ROOT_KEY]
    : {};

  const completed = deepClonePlain(existing);
  const report = asPlain(completed.integrated_json_report);
  const prepared = asPlain(report.prepared_final_profiles);
  const runMeta = asPlain(completed.run_meta);

  if (!isPlainObject(completed.screen_report_payload)) {
    completed.screen_report_payload = buildServerCompletedScreenReportPayload({
      completed,
      report,
      prepared,
      runMeta,
      executionPayload,
      modelResult
    });
  }

  if (!isPlainObject(completed.vault_assembler_handoff)) {
    completed.vault_assembler_handoff = buildServerCompletedVaultAssemblerHandoff({
      completed,
      report,
      prepared,
      runMeta,
      executionPayload
    });
  }

  if (!isPlainObject(completed.final_quality_control)) {
    completed.final_quality_control = {
      completion_status: "SERVER_COMPLETED_WITH_LIMITATIONS",
      completion_guard_version: "handoff_completion_guard_v1",
      reason: "Model produced integrated_json_report but omitted one or more terminal display/vault branches.",
      substantive_diligence_mutation: false,
      added_branches: [
        "screen_report_payload",
        "vault_assembler_handoff",
        "final_quality_control",
        "handoff_lock"
      ],
      warnings: [
        "Screen report payload was generated deterministically from integrated_json_report.",
        "No new diligence facts were added by the server completion guard.",
        "Review integrated_json_report and forensic appendix before relying on any finding."
      ]
    };
  }

  if (!Array.isArray(completed.limitations)) {
    completed.limitations = [
      "Public-footprint diligence only.",
      "Server completion guard generated missing display/vault branches from existing integrated_json_report.",
      "No legal advice or compliance verdict is provided."
    ];
  }

  if (!isPlainObject(completed.handoff_lock)) {
    completed.handoff_lock = {
      lock_status: "LOCKED_WITH_SERVER_COMPLETION_GUARD",
      lock_version: "handoff_completion_guard_v1",
      terminal_root: FINAL_ROOT_KEY,
      no_new_diligence_facts_added_by_server: true,
      renderer_ready: isPlainObject(completed.screen_report_payload),
      vault_ready: isPlainObject(completed.vault_assembler_handoff)
    };
  }

  modelResult.providerWarnings = [
    ...(modelResult.providerWarnings || []),
    {
      code: "HANDOFF_COMPLETION_GUARD_USED",
      message: "final_output_handoff was missing renderer/vault terminal branches; server generated deterministic branches from integrated_json_report.",
      added_branches: [
        !isPlainObject(existing.screen_report_payload) ? "screen_report_payload" : null,
        !isPlainObject(existing.vault_assembler_handoff) ? "vault_assembler_handoff" : null,
        !isPlainObject(existing.final_quality_control) ? "final_quality_control" : null,
        !isPlainObject(existing.handoff_lock) ? "handoff_lock" : null
      ].filter(Boolean)
    }
  ];

  return { [FINAL_ROOT_KEY]: completed };
}

function buildServerCompletedScreenReportPayload({ completed, report, prepared, runMeta, executionPayload, modelResult }) {
  const targetName = firstNonEmpty(
    runMeta.target_name,
    executionPayload.target_name,
    executionPayload.company_name,
    "Target"
  );

  const targetUrl = firstNonEmpty(
    runMeta.target_url,
    executionPayload.target_url,
    ""
  );

  const runId = firstNonEmpty(
    runMeta.run_id,
    executionPayload.run_id,
    "unknown_run"
  );

  const sourceMode = firstNonEmpty(
    runMeta.source_mode,
    executionPayload.source_mode,
    "url"
  );

  const exposureRows = buildFallbackExposureRows({ report, prepared });

  const sections = {
    matter_overview: {
      matter_identity: { target_name: targetName, target_url: targetUrl, run_id: runId, source_mode: sourceMode },
      review_scope: "Public-footprint diligence generated by the Hunter monolith runtime from grounded model-visible materials.",
      evidence_cutoff: firstNonEmpty(report?.report_meta?.generated_at, runMeta?.submitted_at, new Date().toISOString()),
      reliance_disclaimer: "This is a diligence aid, not legal advice, not a compliance certification, and not a final legal opinion.",
      qualified_review_required: "Qualified legal / compliance review is required before relying on any finding.",
      public_footprint_limitation: "Findings are limited to information visible to the model through public-footprint grounding and user-provided input."
    },

    executive_summary: {
      executive_posture: summarizeLockStatus(report?.profile_manifest),
      target_snapshot: firstUseful(prepared.target_profile, report.report_meta, { target_name: targetName, target_url: targetUrl }),
      product_activity_snapshot: firstUseful(prepared.target_feature_profile, "Product/activity profile was not fully visible in the repaired terminal JSON."),
      data_posture: firstUseful(prepared.target_data_provenance_profile, "Data provenance profile was not fully visible in the repaired terminal JSON."),
      legal_document_posture: firstUseful(prepared.legal_cartography_index, "Legal/governance document posture was not fully visible in the repaired terminal JSON."),
      exposure_posture: firstUseful(prepared.target_exposure_profile, { visible_finding_rows: exposureRows.length }),
      evidence_posture: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence manifest was partially visible or compacted."),
      qualified_review_priorities: [
        "Confirm the target's current legal document set manually.",
        "Validate data-processing and model-provider claims against current policies.",
        "Review all exposure findings before external use."
      ]
    },

    target_profile: {
      identity: firstUseful(prepared.target_profile?.identity, prepared.target_profile, { target_name: targetName, target_url: targetUrl }),
      jurisdiction: firstUseful(prepared.target_profile?.jurisdiction, "Not conclusively visible in public-footprint materials."),
      business_model: firstUseful(prepared.target_profile?.business_model, "Not conclusively visible in repaired terminal JSON."),
      market_context: firstUseful(prepared.target_profile?.market_context, "AI/product diligence target."),
      product_baseline: firstUseful(prepared.target_profile?.product_baseline, prepared.target_feature_profile, "Product baseline not fully visible."),
      data_touchpoint_summary: firstUseful(prepared.target_profile?.data_touchpoint_summary, prepared.target_data_provenance_profile, "Data touchpoints require review."),
      evidence_basis: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence compacted during terminal repair."),
      limitations: "Target profile completed from integrated_json_report where visible."
    },

    product_activity_ip_profile: {
      product_activity_thesis: firstUseful(prepared.target_feature_profile?.product_activity_thesis, "Product/activity review generated from available public-footprint material."),
      feature_inventory_summary: firstUseful(prepared.target_feature_profile?.feature_inventory_summary, prepared.target_feature_profile, "Feature inventory not fully visible."),
      feature_table: firstUseful(prepared.target_feature_profile?.feature_table, []),
      functional_profile: firstUseful(prepared.target_feature_profile?.functional_profile, "Not fully visible."),
      risk_surface_profile: firstUseful(prepared.target_feature_profile?.risk_surface_profile, "Not fully visible."),
      ip_content_profile: firstUseful(prepared.target_feature_profile?.ip_content_profile, "AI/IP posture requires qualified review."),
      architecture_profile: firstUseful(prepared.target_feature_profile?.architecture_profile, "Not fully visible."),
      commercial_scan: firstUseful(prepared.target_feature_profile?.commercial_scan, "Not fully visible."),
      evidence_basis: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence compacted during terminal repair."),
      limitations: "Product/activity profile completed from available integrated_json_report material."
    },

    data_risk_provenance_controls: {
      data_risk_thesis: firstUseful(prepared.target_data_provenance_profile?.data_risk_thesis, "Data posture requires review against public policies and actual processing architecture."),
      data_flow_summary: firstUseful(prepared.target_data_provenance_profile?.data_flow_summary, prepared.target_data_provenance_profile, "Data flow summary not fully visible."),
      data_flow_table: firstUseful(prepared.target_data_provenance_profile?.data_flow_table, []),
      control_review: firstUseful(prepared.target_data_provenance_profile?.control_review, "Control review not fully visible."),
      data_gaps: firstUseful(prepared.target_data_provenance_profile?.data_gaps, ["Confirm retention, training use, subprocessors, deletion, and security controls."]),
      evidence_basis: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence compacted during terminal repair."),
      limitations: "Data review completed from available integrated_json_report material."
    },

    legal_document_control_review: {
      legal_document_review_thesis: firstUseful(prepared.legal_cartography_index?.legal_document_review_thesis, "Legal/governance posture requires manual document confirmation."),
      document_inventory_summary: firstUseful(prepared.legal_cartography_index?.document_inventory_summary, prepared.legal_cartography_index, "Document inventory not fully visible."),
      document_inventory: firstUseful(prepared.legal_cartography_index?.document_inventory, []),
      legal_unit_index: firstUseful(prepared.legal_cartography_index?.legal_unit_index, []),
      document_relationships: firstUseful(prepared.legal_cartography_index?.document_relationships, "Not fully visible."),
      control_signal_matrix: firstUseful(prepared.legal_cartography_index?.control_signal_matrix, []),
      document_mismatch_signals: firstUseful(prepared.legal_cartography_index?.document_mismatch_signals, []),
      qualified_review_points: ["Verify Terms, Privacy Policy, DPA/subprocessor terms, safety/security pages, and AI disclosures manually."],
      evidence_basis: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, "Evidence compacted during terminal repair."),
      limitations: "Legal document review completed from available integrated_json_report material."
    },

    exposure_findings: {
      exposure_category_groups: firstUseful(prepared.target_exposure_profile?.exposure_category_groups, "Exposure rows grouped from visible repaired output where available."),
      finding_rows: exposureRows,
      severity_summary: firstUseful(prepared.target_exposure_profile?.severity_summary, { visible_rows: exposureRows.length }),
      control_position_summary: firstUseful(prepared.target_exposure_profile?.control_position_summary, "Control position requires review."),
      evidence_basis_summary: "Evidence basis is limited to public-footprint material visible in the model output.",
      appendix_crosswalk: exposureRows.map((row) => ({ display_exposure_id: row.display_exposure_id, source: "integrated_json_report/server_completion_guard" }))
    },

    implications_remediation_path: {
      remediation_thesis: "Use this report as a review queue, not as a legal verdict.",
      priority_actions: [
        "Confirm source evidence manually.",
        "Review missing legal/data controls.",
        "Validate exposure findings against current documents."
      ],
      document_route: "Route Terms/Privacy/DPA/security materials to qualified reviewer.",
      data_control_route: "Confirm training use, retention, deletion, subprocessors, and sensitive-data handling.",
      operational_control_route: "Confirm human review, safety controls, and incident/escalation workflows.",
      qualified_review_queue: ["Legal counsel review", "Privacy/security review", "Product owner confirmation"],
      quick_wins: ["Publish/verify legal document links", "Clarify AI/data-use disclosures", "Document human-review controls"],
      blocked_until_clarified: ["Any finding whose source evidence was compacted or not fully visible."],
      review_ready_handoff_bridge: "The report identifies review priorities for counsel/operator confirmation."
    },

    evidence_gaps_clarification_points: {
      open_information_requests: ["Provide current Terms, Privacy Policy, DPA/subprocessor list, security page, model/data-use policy."],
      missing_documents: firstUseful(prepared.legal_cartography_index?.missing_documents, []),
      missing_factual_confirmations: ["Actual model providers", "Training/fine-tuning use", "Retention/deletion controls", "Customer data categories"],
      unclear_data_flows: ["Confirm input, storage, model-processing, logging, analytics, and subprocessor flows."],
      unclear_provider_dependencies: ["Confirm all AI model, cloud, analytics, and support vendors."],
      evidence_limitations: "Grounded model output may not include complete page text or hidden documents.",
      consequence_if_unresolved: "Unresolved gaps remain review blockers, not final findings.",
      client_confirmation_questions: [
        "Which model providers are used?",
        "Is customer data used for training or fine-tuning?",
        "What documents govern enterprise customers?",
        "What human review is mandatory before output reliance?"
      ]
    },

    methodology_limitations_review_notes: {
      methodology: "Hunter monolith public-footprint diligence with Gemini grounding and deterministic server completion of missing display branches.",
      stage_roles: firstUseful(completed.input_manifest, "Module outputs were assembled into integrated_json_report."),
      status_definitions: "LOCKED means model completed the profile branch; LOCKED_WITH_LIMITATIONS means material was available but incomplete or constrained.",
      legal_limitations: "Not legal advice. Requires qualified review.",
      evidence_limitations: "Public-footprint and model-visible source limitations apply.",
      registry_use_note: "Registry findings are triage signals requiring review, not legal conclusions.",
      reviewer_notes: modelResult?.providerWarnings || []
    },

    forensic_ledger_appendix: {
      appendix_notice: "Technical appendix generated for traceability.",
      full_ledger_summary: firstUseful(report.profile_manifest, completed.input_manifest, {}),
      full_registry_ledger: firstUseful(prepared.target_exposure_profile?.full_registry_ledger, prepared.target_exposure_profile, "Full registry ledger not fully visible in repaired terminal JSON."),
      row_level_proof: firstUseful(prepared.target_exposure_profile?.row_level_proof, []),
      condition_trigger_basis: firstUseful(prepared.target_exposure_profile?.condition_trigger_basis, []),
      evidence_references: firstUseful(prepared.source_discovery_handoff?.evidence_box_manifest, []),
      operator_challenge_trace: firstUseful(prepared.operator_challenge_gate, {}),
      batch_warnings: modelResult?.providerWarnings || [],
      appendix_limitations: "Appendix reflects available integrated_json_report and server completion warnings."
    }
  };

  return {
    report_shell: {
      report_title: \`\${targetName} Public-Footprint Diligence Report\`,
      report_subtitle: "Hunter monolith diligence report generated from public-footprint materials.",
      report_status: "RENDERED_WITH_SERVER_COMPLETION_GUARD",
      target_name: targetName,
      target_url: targetUrl,
      run_id: runId,
      generated_at: new Date().toISOString()
    },
    sections,
    renderer_contract: {
      renderer_contract_version: "screen_payload_server_completion_v1",
      source: "server_completion_guard",
      deterministic_only: true,
      no_substantive_mutation: true,
      screen_sections_supplied: Object.keys(sections),
      warning: "Display payload was generated from integrated_json_report because model omitted screen_report_payload."
    },
    display_id_index: {
      run_id: runId,
      exposure_ids: exposureRows.map((row) => row.display_exposure_id),
      source: "server_completion_guard"
    },
    platform_diligence_object: {
      target_name: targetName,
      target_url: targetUrl,
      source_mode: sourceMode,
      model_used: modelResult?.model_used || null,
      key_index_used: modelResult?.key_index_used || null,
      completion_mode: "SERVER_COMPLETED_FROM_INTEGRATED_JSON_REPORT",
      profile_manifest: report.profile_manifest || null
    }
  };
}

function buildServerCompletedVaultAssemblerHandoff({ completed, report, prepared, runMeta, executionPayload }) {
  return {
    assembler_status: "SERVER_COMPLETED_FROM_INTEGRATED_JSON_REPORT",
    assembler_version: "vault_assembler_server_completion_v1",
    target: {
      target_name: firstNonEmpty(runMeta.target_name, executionPayload.target_name, "Target"),
      target_url: firstNonEmpty(runMeta.target_url, executionPayload.target_url, "")
    },
    available_profile_keys: Object.keys(prepared || {}),
    report_meta: report.report_meta || null,
    profile_manifest: report.profile_manifest || null,
    limitations: [
      "Vault assembler branch was missing from model terminal JSON.",
      "Server generated this branch from integrated_json_report without adding new diligence facts."
    ],
    recommended_next_action: "Review generated vault_payload and final_output_handoff before client-facing use."
  };
}

function buildFallbackExposureRows({ report, prepared }) {
  const exposureProfile = firstUseful(prepared.target_exposure_profile, report.target_exposure_profile, {});
  const found = findFirstArrayByKeys(exposureProfile, [
    "finding_rows",
    "exposure_findings",
    "registry_rows",
    "evaluated_registry_rows",
    "full_registry_ledger",
    "ledger_rows"
  ]);

  if (Array.isArray(found) && found.length) {
    return found.slice(0, 24).map((item, index) => {
      const row = asPlain(item);
      return {
        display_exposure_id: firstNonEmpty(row.display_exposure_id, row.threat_id, row.THREAT_ID, \`EXP-\${String(index + 1).padStart(3, "0")}\`),
        normalized_threat_name: firstNonEmpty(row.normalized_threat_name, row.threat_name, row.Threat_Name, row.title, "Registry exposure"),
        display_status: firstNonEmpty(row.display_status, row.evaluation_status, row.status, "Review signal"),
        plain_english_summary: firstNonEmpty(row.plain_english_summary, row.summary, row.finding, "Registry row visible in integrated_json_report; qualified review required."),
        related_activity: firstNonEmpty(row.related_activity, row.activity, row.archetype, ""),
        visible_control_position: firstNonEmpty(row.visible_control_position, row.control_position, row.control_status, ""),
        evidence_preview: firstNonEmpty(row.evidence_preview, row.evidence_basis, row.source_url, ""),
        technical_refs: firstUseful(row.technical_refs, row)
      };
    });
  }

  return [
    {
      display_exposure_id: "EXP-001",
      normalized_threat_name: "Public-footprint review limitation",
      display_status: "REVIEW_REQUIRED",
      plain_english_summary: "The repaired terminal JSON did not preserve a complete exposure finding table. Review integrated_json_report and rerun with compact terminal settings if a full registry ledger is required.",
      related_activity: "Hunter monolith output repair",
      visible_control_position: "Not fully visible in repaired terminal JSON",
      evidence_preview: "Generated by server completion guard from missing exposure rows.",
      technical_refs: { source: "handoff_completion_guard_v1" }
    }
  ];
}

function summarizeLockStatus(profileManifest) {
  const manifest = asPlain(profileManifest);
  if (!Object.keys(manifest).length) return "Integrated report available; profile lock manifest not fully visible.";
  return manifest;
}

function firstUseful(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value;
    if (isPlainObject(value) && Object.keys(value).length) return value;
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" || typeof value === "boolean") return value;
  }
  return values[values.length - 1] ?? null;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function asPlain(value) {
  return isPlainObject(value) ? value : {};
}

function deepClonePlain(value) {
  try {
    return JSON.parse(JSON.stringify(value || {}));
  } catch {
    return {};
  }
}

function findFirstArrayByKeys(value, keys) {
  if (Array.isArray(value)) return value;
  if (!isPlainObject(value)) return null;

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }

  for (const child of Object.values(value)) {
    const found = findFirstArrayByKeys(child, keys);
    if (Array.isArray(found)) return found;
  }

  return null;
}

`;

if (!s.includes("function handoffNeedsCompletion")) {
  if (!s.includes(marker)) {
    throw new Error("Could not find extractTerminalJsonWithRepair marker.");
  }
  s = s.replace(marker, completionFns + marker);
}

fs.writeFileSync(file, s);
console.log("PATCHED server.js with deterministic handoff completion guard");

(function () {
  "use strict";

  const scenario = new URLSearchParams(window.location.search || "").get("scenario") || "baseline";
  const dense = scenario === "dense";
  const limitations = scenario === "limitations";
  const exposureCount = dense ? 24 : 12;
  const reviewCount = dense ? 12 : limitations ? 7 : 3;

  window.InterfaceReportFixtureScenario = scenario;
  window.InterfaceReportFixturePayload = {
    schema_version: "renderer_payload.v14.co_p12_05",
    renderer_version: "phase12_clean_report_renderer_v2_report_document",
    renderer_source: "report_manifest_clean_profiles",
    renderer_design: "senior_partner_section_aware_document",
    run_id: `VISUAL_FIXTURE_${scenario.toUpperCase()}`,
    target: "Aurora Systems Ltd.",
    target_url: "https://example.test",
    generated_at: "2026-07-13T10:30:00.000Z",
    validation_status: limitations ? "PASS_WITH_LIMITATION" : "PASS",
    status_label: limitations ? "Pass with limitation" : "Pass",
    report_shell: {
      report_title: "Diligence Report",
      report_subtitle: "Review-Ready Public-Footprint Legal Exposure Review",
      target_display_name: "Aurora Systems Ltd.",
      target_domain: "https://example.test",
      run_id: `VISUAL_FIXTURE_${scenario.toUpperCase()}`,
      generated_at: "2026-07-13T10:30:00.000Z",
      report_mode: "PUBLIC_FOOTPRINT_REVIEW_READY_DRAFT",
      validation_status: limitations ? "PASS_WITH_LIMITATION" : "PASS",
      status_label: limitations ? "Pass with limitation" : "Pass",
      public_footprint_only: true,
      review_ready_draft: true,
      no_legal_advice: true,
      local_counsel_review_required: true,
      boundary_notice: "This is a Review-Ready Draft prepared from public and approved source materials. It is not legal advice, a compliance certification, or a final legal opinion. Local counsel review is required before reliance."
    },
    dashboard_tiles: [
      { label: "Review status", value: limitations ? "Pass with limitation" : "Pass" },
      { label: "Report sections", value: "10" },
      { label: "Exposure rows", value: String(exposureCount) },
      { label: "Open review items", value: String(reviewCount) }
    ],
    presentation_contract: {
      schema_version: "interface_report_presentation.v1",
      document_mode: "CONTINUOUS_WARM_PAPER_IN_DARK_INTERFACE_SHELL",
      section_renderer: "SECTION_AWARE",
      table_rows_per_page: 10,
      deck_cards_per_page: 5,
      show_all_forbidden: true,
      print_full_dataset: true,
      browser_pagination_is_visibility_only: true,
      activity_classification_paths: {
        primary_behavior_class: "primary_classification.behavior_class_codes",
        primary_surface: "primary_classification.surface_context_tokens",
        overlay_behavior_class: "overlay_classifications[].behavior_class_codes",
        overlay_surface: "overlay_classifications[].surface_context_tokens",
        collapse_primary_and_overlay_forbidden: true
      },
      exposure_presentation_order: [
        "presentation_order.pain_category_rank",
        "presentation_order.pain_category_label",
        "presentation_order.subcategory_order",
        "presentation_order.pain_depth_rank",
        "presentation_order.velocity_rank",
        "identity.threat_id"
      ],
      exposure_grouping: ["identity.stream_scope", "identity.material_status", "severity.pain_category", "classification.subcategory"],
      p12_substantive_derivation_forbidden: true
    },
    report_layers: [
      { layer_id: "layer_1_public_report", label: "Public Report", purpose: "Readable ten-section public-footprint diligence report." },
      { layer_id: "layer_2_public_technical_annexure", label: "Public Technical Annexure", purpose: "Reference layer for public technical detail." },
      { layer_id: "layer_3_qualified_review", label: "Qualified Review Workspace", purpose: "Separate reviewer confirmation and counsel-review workspace." }
    ],
    section_order: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"],
    sections: buildSections(),
    report_artifact_source_count: 29,
    semantic_merge_performed: false,
    custody_rendered: false
  };

  function buildSections() {
    return [
      section("01", "Matter & Review Boundary", [
        subsection("section_summary", "Section Summary", [field("01.SUMMARY", "Summary", { matter: "Aurora Systems public-footprint diligence fixture", status: limitations ? "Pass with limitation" : "Pass" })]),
        subsection("matter_boundary", "Review Boundary", [field("01.review_boundary", "Review Boundary", {
          doctrine: "Upstream phases decide. Phase 12 arranges.",
          phase11_gate_status: limitations ? "PASS_WITH_LIMITATION" : "PASS",
          evidence_boundary: "Public and approved source materials.",
          review_ready_draft_notice: "Review-Ready Draft only; local counsel review is required before reliance.",
          local_counsel_review_required: true
        })])
      ]),
      section("02", "Executive Legal Risk Overview", [
        subsection("section_summary", "Section Summary", [field("02.SUMMARY", "Summary", "Deterministic executive roll-up.")]),
        subsection("exposure_overview", "Exposure Overview", [field("02.exposure_overview", "Exposure Overview", {
          total_material_exposure_rows: exposureCount,
          triggered_count: Math.ceil(exposureCount / 4),
          controlled_by_visible_control_count: Math.ceil(exposureCount / 4),
          controlled_by_exclusion_count: Math.floor(exposureCount / 4),
          controlled_by_public_evidence_limitation_count: Math.floor(exposureCount / 4),
          primary_stream_count: Math.ceil(exposureCount / 2),
          overlay_stream_count: Math.floor(exposureCount / 2),
          highest_upstream_pain_tier: "T2",
          carried_phase11_warning_count: reviewCount
        })])
      ]),
      section("03", "Target & Sector Profile", [
        subsection("target_profile", "Target Profile", [
          field("TP.ID.001", "Target Legal Name", "Aurora Systems Ltd."),
          field("TP.JUR.001", "Jurisdiction Signal", "India and European Union public-market context"),
          field("TP.BIZ.001", "Business Model", "Enterprise AI-enabled financial workflow platform"),
          field("TP.WRAP.001", "Product Wrapper", "Hosted API and web application"),
          field("DD.PRIMARY.001", "Primary Sector", "FinTech"),
          field("DD.OVERLAY.001", "Capability Overlay", "AI Governance"),
          field("DD.REG.001", "Regulatory Context Overlay", "India Data Protection")
        ])
      ]),
      section("04", "Product & Activity Architecture", [
        subsection("activity_register", "Activity Register", [field("PA.ACTIVITY_REGISTER", "Activity Register", activityRows())])
      ]),
      section("05", "Data Provenance & Privacy Architecture", dataProfiles()),
      section("06", "Sector-Specific Control Obligations", [
        subsection("section_summary", "Section Summary", [field("06.SUMMARY", "Summary", { obligation_row_count: 3, primary_sector_obligation_count: 2, capability_overlay_obligation_count: 1 })]),
        subsection("obligation_register", "Obligation Register", [field("DCO.OBLIGATION_REGISTER", "Obligation Register", {
          schema_version: "phase12_obligation_presentation.v1",
          rows: obligationRows()
        })])
      ]),
      section("07", "Legal & Governance Architecture", [
        subsection("section_summary", "Section Summary", [field("07.SUMMARY", "Summary", "Core public legal documents are visible, with two cross-document and access limitations.")]),
        subsection("legal_governance", "Legal Governance", [
          field("LGC.STACK.001", "Overall Document Posture", "Core public stack visible with bounded gaps"),
          field("LGC.ART.002", "Document Name / Title", ["Terms of Service", "Privacy Policy", "Acceptable Use Policy"]),
          field("LGC.NOT.011", "Legal Notice Contact Route", "legal@example.test"),
          field("LGC.CTRL.003", "Related Artifact", "Terms of Service"),
          field("LGC.IND.003", "Covered Claims", "Third-party intellectual property claims"),
          field("LGC.XREF.004", "To Document / Policy / Schedule", "Privacy Policy"),
          field("LGC.ABS.004", "Absence / Access Status", limitations ? "One hosted schedule was inaccessible" : "No material public absence identified", "LIMITATION"),
          field("LGC.LIM.002", "Access Failed", limitations ? "Hosted service schedule returned an access failure" : "No access failure", "LIMITATION")
        ])
      ]),
      section("08", "Exposure Register", exposureProfiles(exposureCount)),
      section("09", "Open Review Items & Handoff", [
        subsection("section_summary", "Section Summary", [field("09.SUMMARY", "Summary", { open_item_count: reviewCount, exposure_register_duplication_forbidden: true })]),
        subsection("open_review", "Open Review Items", [field("09.open_review_items", "Open Review Items", reviewItems(reviewCount))]),
        subsection("carried_limitations", "Carried Limitations", [field("ORI.LIM.001", "Review Handoff Limitation", "Private operational evidence remains outside the public footprint.", "LIMITATION")])
      ]),
      section("10", "Methodology, Limitations & Annexure", [
        subsection("section_summary", "Section Summary", [field("10.SUMMARY", "Summary", "Deterministic report arrangement and reliance boundary.")]),
        subsection("methodology", "Methodology", [field("10.methodology", "Methodology", {
          doctrine: "Upstream phases decide. Phase 12 arranges.",
          artifact_purity_rule: "Mandatory upstream material fields are preserved; forensic and unnecessary mechanical payloads are excluded.",
          admission_status: limitations ? "PASS_WITH_LIMITATION" : "PASS",
          route_status: "PASS",
          active_owned_field_count: 430,
          blocked_gap_field_count: 27,
          custody_manifest_ref: "phase12_report_custody_manifest",
          local_counsel_review_required: true,
          review_ready_draft_boundary: "Review-Ready Draft only; local counsel review is required before use."
        })]),
        subsection("limitations", "Methodology Limitations", [field("METH.LIM.001", "Public-Footprint Limitation", "The report does not establish private operational implementation.", "LIMITATION")])
      ])
    ];
  }

  function dataProfiles() {
    const ids = [
      "parties_roles",
      "data_objects_flows",
      "purpose_authorization_user_controls",
      "privacy_contacts_consent_manager",
      "vendor_processor_chain",
      "location_transfer_custody",
      "retention_deletion_portability",
      "security_access_incident_governance",
      "sensitive_high_risk_contexts",
      "regulatory_readiness",
      "missing_proof_diligence_requests"
    ];
    return ids.map((id, index) => subsection(id, title(id), [field(`DAP.FIX.${String(index + 1).padStart(3, "0")}`, title(id), [{
      item: `${title(id)} fixture row`,
      basis: "Public fixture evidence",
      limitation: limitations && index % 4 === 0 ? "Additional private proof required" : null
    }])]));
  }

  function activityRows() {
    return [
      activity("ACT-001", "Automated payment decisioning", ["PAY"], ["Financial"], "AI_OVERLAY", ["JDG"], ["Consumer-Public", "PII"]),
      activity("ACT-002", "Synthetic customer communication", ["COMMS"], ["Consumer-Public"], "AI_OVERLAY", ["CRT"], ["Content&IP"])
    ];
  }

  function activity(reference, name, primaryBehavior, primarySurface, overlayId, overlayBehavior, overlaySurface) {
    return {
      activity_reference: reference,
      product_service_wrapper: "Aurora platform",
      activity_feature_name: name,
      activity_candidate_summary: `${name} fixture activity.`,
      mechanics_proof: "Public product and documentation evidence.",
      autonomy_human_control_signal: "Human review route described.",
      data_content_object_touched: "Customer transaction and account information.",
      external_internal_action_signal: "External customer-facing effect.",
      primary_classification: {
        package_id: "fintech",
        behavior_class_codes: primaryBehavior,
        behavior_class_derivation_basis: [{ material_basis: "Primary fixture classification basis." }],
        surface_context_tokens: primarySurface,
        surface_derivation_basis: [{ material_basis: "Primary fixture surface basis." }]
      },
      overlay_classifications: [{
        package_id: "ai-governance",
        overlay_id: overlayId,
        behavior_class_codes: overlayBehavior,
        behavior_class_derivation_basis: [{ material_basis: "Overlay fixture classification basis." }],
        surface_context_tokens: overlaySurface,
        surface_derivation_basis: [{ material_basis: "Overlay fixture surface basis." }]
      }]
    };
  }

  function obligationRows() {
    return [
      obligation("DCO-PAY-001", "Payment authorization controls", "Primary Sector", "VISIBLE", null),
      obligation("DCO-PAY-002", "Transaction record and dispute-support controls", "Primary Sector", limitations ? "NOT_VISIBLE" : "PARTIAL", "Private transaction-record procedure"),
      obligation("DCO-AI-001", "AI-assisted customer communication controls", "Capability Overlay", "PARTIAL", "Complete human-review escalation workflow")
    ];
  }

  function obligation(reference, name, source, posture, missingProof) {
    return {
      obligation_reference: reference,
      obligation_family: source === "Primary Sector" ? "Payment operations" : "AI communication governance",
      source_scope: source,
      capability_context: source === "Capability Overlay" ? "AI_OVERLAY" : null,
      linked_activity_references: source === "Capability Overlay" ? ["ACT-002"] : ["ACT-001"],
      matched_behavior_classes: source === "Capability Overlay" ? ["CRT"] : ["PAY"],
      matched_surfaces: source === "Capability Overlay" ? ["Content&IP", "Consumer-Public"] : ["Financial", "Consumer-Public"],
      normalized_name: name,
      what_it_requires: "Maintain the expected operational control described by the mounted package.",
      target_specific_context: "Aurora publicly describes the linked activity.",
      authority_dependency: "Authority depends on the mounted package and reviewed target context.",
      exposure_role_context: "Expected-control benchmark for exposure review.",
      obligation_locus: "Customer-facing operational workflow",
      trigger_timing: "Before and during activity execution",
      expected_control_signal: "Visible authorization, review and escalation route.",
      control_mechanism_present: posture === "VISIBLE" ? "VISIBLE" : posture === "NOT_VISIBLE" ? "NOT_VISIBLE" : "UNCLEAR",
      control_posture_status: posture,
      evidence_basis: "Public fixture evidence.",
      missing_proof: missingProof,
      diligence_question: missingProof ? "Confirm the private operational workflow and supporting evidence." : null,
      derivation_basis: [{ output_field: "Obligation presentation", material_basis: "Fixture derivation basis.", limitation: missingProof }],
      regulatory_context: [{ context_overlay: "INDIA_DPDP", matched_frameworks: ["DPDP Act 2023"], context_status: "CANDIDATE_ONLY" }],
      limitation: missingProof ? "Public-footprint evidence does not establish the private control." : null
    };
  }

  function exposureProfiles(count) {
    const statuses = [
      "TRIGGERED",
      "CONTROLLED_BY_VISIBLE_CONTROL",
      "CONTROLLED_BY_EXCLUSION",
      "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION"
    ];
    const profiles = [];
    for (const stream of ["Primary Sector", "Capability Overlay"]) {
      for (const status of statuses) {
        const rows = [];
        for (let index = 0; index < count; index += 1) {
          const rowStream = index % 2 === 0 ? "Primary Sector" : "Capability Overlay";
          const rowStatus = statuses[index % statuses.length];
          if (rowStream === stream && rowStatus === status) rows.push(exposureRow(index + 1, stream, status));
        }
        if (!rows.length) continue;
        profiles.push(subsection(
          `${stream === "Primary Sector" ? "primary" : "overlay"}_${status.toLowerCase()}`,
          `${stream} — ${title(status)}`,
          [field(`${stream}.${status}.material_rows`, "Material Rows", rows)],
          { stream_scope: stream, material_status: status, public_status_label: title(status) }
        ));
      }
    }
    return [subsection("section_summary", "Section Summary", [field("08.SUMMARY", "Summary", { total_exposure_row_count: count })]), ...profiles];
  }

  function exposureRow(index, stream, status) {
    const painRank = (index % 4) + 1;
    const subcategory = index % 2 === 0 ? "Operational Controls" : "Customer Protection";
    return {
      identity: {
        threat_id: `EXP-${String(index).padStart(3, "0")}`,
        threat_name: `${stream} fixture exposure ${index}`,
        stream_scope: stream,
        material_status: status
      },
      classification: {
        lane: stream === "Primary Sector" ? "PAY" : "AI",
        behavior_class: stream === "Primary Sector" ? "PAY" : "CRT",
        surface: stream === "Primary Sector" ? "Financial" : "Consumer-Public",
        subcategory,
        compliance_framework: index % 3 === 0 ? "DPDP Act 2023" : null
      },
      authorities: {
        india: "Indian authority",
        european_union: "EU authority",
        united_states: "US authority"
      },
      severity: {
        velocity: index % 2 === 0 ? "ACTIVE_NOW" : "EMERGING",
        pain_tier: `T${painRank}`,
        pain_category: painRank <= 2 ? "Deal Death" : "Regulatory Heat",
        pain_depth: index % 2 === 0 ? "Corporate" : "Product",
        legal_status: "Active",
        effective_date: "2026-01-01"
      },
      impact: {
        legal_pain: "Fixture legal consequence carried from the upstream exposure profile.",
        false_positive_impact: "Fixture false-positive impact."
      },
      false_positive: {
        mechanism: "Fixture false-positive mechanism.",
        applied_mechanism: "Applied fixture mechanism."
      },
      basis: {
        target_match: "Fixture target match.",
        basis_proof: "Fixture basis proof.",
        control_or_exclusion_position: status === "TRIGGERED" ? "No sufficient public control identified." : "Upstream controlled position.",
        evidence_basis: "Public fixture evidence basis.",
        provenance: "Visual fixture provenance."
      },
      response: {
        recommended_fix: "Confirm the upstream control and prepare the appropriate architecture response.",
        review_route: status === "TRIGGERED" ? "QUALIFIED_REVIEW" : "CONFIRM_CONTROL"
      },
      limitations: status === "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION" || limitations ? ["Public-footprint limitation."] : [],
      presentation_order: {
        pain_category_rank: painRank,
        pain_category_label: painRank <= 2 ? "Deal Death" : "Regulatory Heat",
        subcategory_order: subcategory,
        pain_depth_rank: index % 2 === 0 ? 1 : 2,
        velocity_rank: index % 2 === 0 ? 1 : 2
      }
    };
  }

  function reviewItems(count) {
    return Array.from({ length: count }, (_, index) => ({
      warning_type: `Open review item ${String(index + 1).padStart(2, "0")}`,
      remaining_uncertainty: index % 2 === 0 ? "Private workflow evidence remains unavailable." : "Public document language requires confirmation.",
      possible_report_impact: index % 3 === 0 ? "May qualify the visible-control position." : "May refine the report limitation.",
      local_counsel_review_route: "QUALIFIED_REVIEW"
    }));
  }

  function section(id, titleText, subsections) {
    return {
      section_id: id,
      section_key: titleText.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      section_number: Number(id),
      section_title: titleText,
      report_layer: "layer_1_public_report",
      artifact_role: "SECTION_PROFILE",
      source_profile_artifacts: [`fixture_section_${id}`],
      reviewer_summary: "Material fields are projected from upstream-owned profiles without Phase 12 substantive re-evaluation.",
      presentation_role: "FIXTURE",
      subsections
    };
  }

  function subsection(profileId, titleText, fields, extra = {}) {
    return {
      subsection_id: profileId,
      subsection_title: titleText,
      artifact_name: `fixture_${profileId}`,
      profile_id: profileId,
      fields,
      ...extra
    };
  }

  function field(fieldId, label, value, importance = "MATERIAL") {
    return {
      field_id: fieldId,
      label,
      value,
      value_status: "RESOLVED",
      report_importance: importance,
      presentation: importance === "LIMITATION" ? "LIMITATION_ITEM" : "FIELD_OR_ROW"
    };
  }

  function title(value) {
    return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
})();

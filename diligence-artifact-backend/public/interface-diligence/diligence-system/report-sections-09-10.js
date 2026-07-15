(function () {
  "use strict";

  const renderers = window.InterfaceReportSectionRenderers || {};
  renderers["09"] = renderSection09;
  renderers["10"] = renderSection10;
  window.InterfaceReportSectionRenderers = renderers;

  function renderSection09(section, R) {
    const root = R.sectionShell(section);
    const fields = R.allFields(section);
    const openItems = extractOpenReviewItems(fields, R);
    const summary = R.findSubsection(section, "section_summary");

    const overview = R.part("09.1 Open Review Overview", "Carried upstream review items");
    overview.append(R.callout(
      "Authority boundary",
      "Section 09 carries unresolved Phase 11 review items and their existing review routes. It does not create new questions, priorities, routes, remediation steps or legal conclusions.",
      "is-limitation"
    ));
    overview.append(R.executiveLedger([
      ["Open review items", openItems.length],
      ["Qualified Review routes", openItems.filter((item) => Boolean(item.local_counsel_review_route || item.review_route)).length],
      ["Items with stated report impact", openItems.filter((item) => Boolean(item.possible_report_impact)).length],
      ["New questions created in report", 0],
      ["New priorities created in report", 0]
    ]));
    if (summary) overview.append(R.callout("Section summary", summary.fields?.[0]?.value || "Open review handoff.", ""));
    root.append(overview);

    const register = R.part("09.2 Open Review Register", "Unresolved uncertainty and review route");
    if (openItems.length) {
      register.append(R.pagination.createPagedTable({
        id: "section-09-open-review-register",
        caption: "Maximum 10 review items are visible per browser page. All entries are carried from the upstream challenge gate.",
        columns: [
          { key: "warning_type", label: "Review Item" },
          { key: "remaining_uncertainty", label: "Remaining Uncertainty" },
          { key: "possible_report_impact", label: "Possible Report Impact" },
          { key: "local_counsel_review_route", label: "Qualified / Local Counsel Route" }
        ],
        rows: openItems,
        renderCell: (row, column) => R.scalarText(row[column.key] ?? row[alternateKey(column.key)])
      }));
    } else {
      register.append(R.node("p", "report-empty-state", "No open Phase 11 review item was carried into the report handoff."));
    }
    root.append(register);

    const detail = R.part("09.3 Review Item Detail", "Bounded review handoff deck");
    if (openItems.length) {
      detail.append(R.pagination.createPagedDeck({
        id: "section-09-open-review-detail",
        caption: "Maximum 5 review-item cards are visible per browser page.",
        items: openItems,
        renderCard: (item, index) => reviewItemCard(item, index, R)
      }));
    } else {
      detail.append(R.node("p", "report-empty-state", "No review-item detail deck is required."));
    }
    root.append(detail);

    const carried = fields.filter((field) =>
      !isSummaryField(field) &&
      !isOpenReviewField(field) &&
      !R.isEmpty(field.value)
    );
    const limitations = carried.filter(R.isLimitationField);
    const other = carried.filter((field) => !R.isLimitationField(field));

    const context = R.part("09.4 Carried Review Context", "Upstream-owned supporting fields");
    if (other.length) {
      R.renderFieldRegister(
        context,
        other,
        "section-09-carried-context",
        "Maximum 10 fields are visible per browser page. These values remain upstream-owned."
      );
    } else {
      context.append(R.node("p", "report-empty-state", "No additional carried review-context field was emitted."));
    }
    root.append(context);

    const limits = R.part("09.5 Review Handoff Limitations", "Limitations preserved for Qualified Review");
    if (limitations.length) R.renderLimitationFields(limits, limitations);
    else limits.append(R.node("p", "report-empty-state", "No additional Section 09 limitation field was emitted."));
    root.append(limits);
    return root;
  }

  function renderSection10(section, R) {
    const root = R.sectionShell(section);
    const fields = R.allFields(section);
    const methodologyField = fields.find(isMethodologyField);
    const methodology = R.isPlainObject(methodologyField?.value) ? methodologyField.value : {};
    const summary = R.findSubsection(section, "section_summary");

    const overview = R.part("10.1 Methodology Overview", "Deterministic report arrangement boundary");
    overview.append(R.callout(
      "Governing doctrine",
      methodology.doctrine || "Upstream phases decide. Phase 12 arranges.",
      ""
    ));
    overview.append(R.executiveLedger([
      ["Admission status", methodology.admission_status],
      ["Route status", methodology.route_status],
      ["Active upstream-owned fields", methodology.active_owned_field_count],
      ["Blocked upstream gaps", methodology.blocked_gap_field_count],
      ["Local counsel review required", methodology.local_counsel_review_required === true ? "Yes" : methodology.local_counsel_review_required],
      ["Phase 12 model usage", "Forbidden"]
    ]));
    if (summary) overview.append(R.callout("Section summary", summary.fields?.[0]?.value || "Methodology and limitations.", ""));
    root.append(overview);

    const method = R.part("10.2 Compilation and Evidence Method", "How this public report was assembled");
    method.append(R.definitionList([
      ["Artifact Purity Rule", methodology.artifact_purity_rule],
      ["Evidence Boundary", "Public and approved source materials, except where an upstream material profile expressly records another reviewed source."],
      ["Substantive Re-evaluation", "Forbidden in Phase 12 and in the browser renderer."],
      ["Exposure Re-ranking", "Forbidden. Presentation order follows upstream pain category, subcategory, pain depth, velocity and threat identity."],
      ["Custody Rendering", "Forbidden in the public report."],
      ["Forensic Payload Rendering", "Forbidden in the public report."],
      ["Review-Ready Boundary", methodology.review_ready_draft_boundary]
    ]));
    root.append(method);

    const layers = R.part("10.3 Report and Review Layers", "Public report, technical reference and Qualified Review");
    layers.append(R.reportLayerFlow());
    root.append(layers);

    const residual = fields.filter((field) =>
      !isSummaryField(field) &&
      !isMethodologyField(field) &&
      !R.isEmpty(field.value)
    );
    const limitations = residual.filter(R.isLimitationField);
    const technical = residual.filter((field) => !R.isLimitationField(field));

    const technicalPart = R.part("10.4 Technical Methodology Fields", "Remaining clean methodology material");
    if (technical.length) {
      for (const [index, field] of technical.entries()) {
        if (R.hasStructuredRows(field.value)) {
          technicalPart.append(R.renderStructuredField(field, `section-10-technical-${index}`, "methodology"));
        } else {
          R.renderFieldRegister(
            technicalPart,
            [field],
            `section-10-technical-field-${index}`,
            "Methodology field carried from the clean Phase 12 profile."
          );
        }
      }
    } else {
      technicalPart.append(R.node("p", "report-empty-state", "No additional technical methodology field was emitted."));
    }
    root.append(technicalPart);

    const limitationPart = R.part("10.5 Methodology and Evidence Limitations", "Reliance boundary");
    limitationPart.append(R.callout(
      "Review-Ready Draft",
      methodology.review_ready_draft_boundary || "Review-Ready Draft only. Qualified and local counsel review is required before reliance.",
      "is-limitation"
    ));
    if (limitations.length) R.renderLimitationFields(limitationPart, limitations);
    else limitationPart.append(R.node("p", "report-empty-state", "No additional methodology limitation field was emitted."));
    root.append(limitationPart);

    const annexure = R.part("10.6 Technical Annexure and Qualified Review Handoff", "Next review layer");
    annexure.append(R.definitionList([
      ["Public Technical Annexure", "Use the Public Technical Annexure for reference-layer detail that does not belong in the main report."],
      ["Qualified Review", "Use the Qualified Review workspace to confirm, correct or qualify material findings."],
      ["Local Counsel", "Jurisdiction-specific legal review remains mandatory before reliance."],
      ["Custody Manifest", methodology.custody_manifest_ref ? "Maintained outside the public report." : "Not rendered in the public report."]
    ]));
    root.append(annexure);
    return root;
  }

  function extractOpenReviewItems(fields, R) {
    for (const field of fields) {
      if (!isOpenReviewField(field)) continue;
      if (Array.isArray(field.value)) return field.value.filter(R.isPlainObject);
      if (R.isPlainObject(field.value)) {
        for (const value of Object.values(field.value)) {
          if (Array.isArray(value) && value.every(R.isPlainObject)) return value;
        }
      }
    }
    return [];
  }

  function reviewItemCard(item, index, R) {
    const card = R.node("article", "report-detail-card report-review-item-card");
    const header = R.node("div", "report-detail-card-header");
    header.append(
      R.node("h4", "", item.warning_type || item.review_item || `Open Review Item ${index + 1}`),
      R.node("span", "report-inline-status", `Item ${String(index + 1).padStart(2, "0")}`)
    );
    card.append(header);
    card.append(R.definitionList([
      ["Remaining Uncertainty", item.remaining_uncertainty || item.uncertainty],
      ["Possible Report Impact", item.possible_report_impact || item.report_impact],
      ["Qualified / Local Counsel Route", item.local_counsel_review_route || item.review_route],
      ["Disposition", item.disposition],
      ["Limitation", item.limitation]
    ]));
    return card;
  }

  function isOpenReviewField(field) {
    return /open_review_items/i.test(String(field?.field_id || ""))
      || /open review items/i.test(String(field?.label || ""));
  }

  function isMethodologyField(field) {
    return /methodology/i.test(String(field?.field_id || ""))
      || String(field?.label || "").toLowerCase() === "methodology";
  }

  function isSummaryField(field) {
    return /\.SUMMARY$/i.test(String(field?.field_id || "")) || String(field?.label || "").toLowerCase() === "summary";
  }

  function alternateKey(key) {
    return ({
      warning_type: "review_item",
      remaining_uncertainty: "uncertainty",
      possible_report_impact: "report_impact",
      local_counsel_review_route: "review_route"
    })[key] || key;
  }
})();

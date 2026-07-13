(function () {
  "use strict";

  const renderers = window.InterfaceReportSectionRenderers || {};
  renderers["06"] = renderSection06;
  renderers["07"] = renderSection07;
  window.InterfaceReportSectionRenderers = renderers;

  const LEGAL_GROUPS = Object.freeze([
    { title: "07.1 Legal Document Stack", label: "Document posture", prefixes: ["LGC.STACK."] },
    { title: "07.2 Artifact Inventory and Coverage", label: "Artifact coverage", prefixes: ["LGC.ART.", "LGC.CORE.", "LGC.COV."] },
    { title: "07.3 Notice and Contact Map", label: "Notice and contact routes", prefixes: ["LGC.NOT."] },
    { title: "07.4 Control-Language Locations", label: "Control-language architecture", prefixes: ["LGC.UNIT.", "LGC.CTRL."] },
    { title: "07.5 Liability and Indemnity Controls", label: "Risk allocation", prefixes: ["LGC.IND.", "LGC.LIAB."] },
    { title: "07.6 Service-Level and Support Commitments", label: "Service and support architecture", prefixes: ["LGC.SLA.", "LGC.SVC.", "LGC.SUP."] },
    { title: "07.7 Cross-Document References", label: "Cross-document consistency", prefixes: ["LGC.XREF."] },
    { title: "07.8 Missing or Inaccessible Artifacts", label: "Missing-document schedule", prefixes: ["LGC.ABS."] }
  ]);

  function renderSection06(section, R) {
    const root = R.sectionShell(section);
    const rows = obligationRows(section, R);
    const summary = R.findSubsection(section, "section_summary");

    if (summary) {
      const overview = R.part("06.1 Obligation Inventory", "Sector-control architecture");
      overview.append(R.callout(
        "Interpretation boundary",
        "These rows preserve upstream Phase 8 obligation context. They are not legal-applicability, compliance, breach, licence, adequacy or liability conclusions.",
        "is-limitation"
      ));
      overview.append(R.executiveLedger([
        ["Total obligation rows", rows.length],
        ["Primary Sector", rows.filter((row) => row.source_scope === "Primary Sector").length],
        ["Capability Overlay", rows.filter((row) => row.source_scope === "Capability Overlay").length],
        ["Visible control posture", rows.filter((row) => posture(row) === "VISIBLE").length],
        ["Rows requiring review", rows.filter(requiresReview).length]
      ]));
      root.append(overview);
    }

    if (!rows.length) {
      const empty = R.part("06.1 Obligation Inventory", "Sector-control architecture");
      empty.append(R.node("p", "report-empty-state", "No structured obligation row was emitted by the clean Phase 12 obligation presentation."));
      root.append(empty);
      renderResidualSection06(root, section, R);
      return root;
    }

    const inventory = R.part("06.1 Obligation Inventory", "Primary and overlay obligation register");
    inventory.append(R.pagination.createPagedTable({
      id: "section-06-obligation-inventory",
      caption: "Maximum 10 obligation rows are visible per browser page. Primary Sector and Capability Overlay rows remain separately identified.",
      columns: [
        { key: "obligation_reference", label: "Ref" },
        { key: "normalized_name", label: "Obligation" },
        { key: "obligation_family", label: "Family" },
        { key: "source_scope", label: "Source Layer" },
        { key: "control_posture_status", label: "Visible Control Posture" }
      ],
      rows,
      renderCell: (row, column) => column.key === "obligation_reference"
        ? obligationLink(row, R)
        : R.scalarText(row[column.key])
    }));
    root.append(inventory);

    const linkage = R.part("06.2 Target, Activity and Authority Linkage", "Obligation linkage");
    linkage.append(R.pagination.createPagedTable({
      id: "section-06-obligation-linkage",
      caption: "Target, activity, taxonomy and authority context preserved from the upstream obligation profile.",
      columns: [
        { key: "obligation_reference", label: "Ref" },
        { key: "linked_activity_references", label: "Linked Activities" },
        { key: "matched_behavior_classes", label: "Behaviour Classes" },
        { key: "matched_surfaces", label: "Surfaces" },
        { key: "target_specific_context", label: "Target Context" },
        { key: "authority_dependency", label: "Authority Dependency" }
      ],
      rows,
      renderCell: (row, column) => R.scalarText(row[column.key])
    }));
    root.append(linkage);

    const expected = R.part("06.3 Expected Operational Controls", "Expected-control benchmark");
    expected.append(R.pagination.createPagedTable({
      id: "section-06-expected-controls",
      caption: "Expected controls are upstream-owned review benchmarks, not compliance conclusions.",
      columns: [
        { key: "obligation_reference", label: "Ref" },
        { key: "what_it_requires", label: "What It Requires" },
        { key: "obligation_locus", label: "Control Locus" },
        { key: "trigger_timing", label: "Timing" },
        { key: "expected_control_signal", label: "Expected Control" }
      ],
      rows,
      renderCell: (row, column) => R.scalarText(row[column.key])
    }));
    root.append(expected);

    const posturePart = R.part("06.4 Visible Control Posture", "Observed public control position");
    for (const stream of ["Primary Sector", "Capability Overlay"]) {
      const streamRows = rows.filter((row) => row.source_scope === stream);
      if (!streamRows.length) continue;
      const streamBlock = R.node("section", "report-obligation-stream");
      const heading = R.node("div", "report-stream-heading");
      heading.append(
        R.node("h3", "", stream),
        R.node("span", "report-inline-status", `${streamRows.length} obligation row${streamRows.length === 1 ? "" : "s"}`)
      );
      streamBlock.append(heading);
      streamBlock.append(R.pagination.createPagedTable({
        id: `section-06-control-posture-${R.stableId(stream)}`,
        caption: `${stream} visible-control posture. Maximum 10 rows per browser page.`,
        columns: [
          { key: "obligation_reference", label: "Ref" },
          { key: "normalized_name", label: "Obligation" },
          { key: "control_mechanism_present", label: "Mechanism Signal" },
          { key: "control_posture_status", label: "Posture" },
          { key: "missing_proof", label: "Missing Proof" }
        ],
        rows: streamRows,
        renderCell: (row, column) => column.key === "control_posture_status"
          ? postureBadge(row, R)
          : R.scalarText(row[column.key])
      }));
      posturePart.append(streamBlock);
    }
    root.append(posturePart);

    const evidence = R.part("06.5 Obligation Evidence", "Evidence and derivation basis");
    evidence.append(R.pagination.createPagedDeck({
      id: "section-06-obligation-evidence-deck",
      caption: "Maximum 5 obligation evidence records are visible per browser page.",
      items: rows,
      renderCard: (row) => obligationEvidenceCard(row, R)
    }));
    root.append(evidence);

    const reviewRows = rows.filter((row) => !R.isEmpty(row.missing_proof) || !R.isEmpty(row.diligence_question) || !R.isEmpty(row.limitation));
    const limitations = R.part("06.6 Obligation Limitations", "Missing proof and Qualified Review");
    if (reviewRows.length) {
      limitations.append(R.pagination.createPagedTable({
        id: "section-06-obligation-limitations",
        caption: "Missing proof and questions are carried from Phase 8. The browser creates no new diligence question.",
        columns: [
          { key: "obligation_reference", label: "Ref" },
          { key: "normalized_name", label: "Obligation" },
          { key: "missing_proof", label: "Missing Proof" },
          { key: "diligence_question", label: "Qualified Review Question" },
          { key: "limitation", label: "Limitation" }
        ],
        rows: reviewRows,
        renderCell: (row, column) => R.scalarText(row[column.key])
      }));
    } else {
      limitations.append(R.node("p", "report-empty-state", "No upstream missing-proof, diligence-question or limitation row was emitted."));
    }
    root.append(limitations);

    renderResidualSection06(root, section, R);
    return root;
  }

  function renderSection07(section, R) {
    const root = R.sectionShell(section);
    const fields = R.allFields(section);
    const used = new Set();
    const summary = fields.find((field) => field.field_id === "07.SUMMARY");
    if (summary) {
      used.add(summary);
      const posture = R.part("07.1 Legal Document Stack", "Legal-document posture");
      posture.append(R.callout("Document-stack summary", summary.value, ""));
      root.append(posture);
    }

    for (const group of LEGAL_GROUPS) {
      const matches = fields.filter((field) =>
        !used.has(field) && group.prefixes.some((prefix) => String(field.field_id || "").startsWith(prefix))
      );
      if (!matches.length) continue;
      matches.forEach((field) => used.add(field));
      const block = R.part(group.title, group.label);
      renderLegalFieldFamily(block, matches, R, R.stableId(group.title));
      root.append(block);
    }

    const limitations = fields.filter((field) => !used.has(field) && R.isLimitationField(field));
    limitations.forEach((field) => used.add(field));
    const limitationBlock = R.part("07.9 Legal Cartography Limitations", "Evidence and access limitations");
    if (limitations.length) R.renderLimitationFields(limitationBlock, limitations);
    else limitationBlock.append(R.node("p", "report-empty-state", "No upstream legal-cartography limitation field was emitted."));
    root.append(limitationBlock);

    const residual = fields.filter((field) => !used.has(field) && !R.isLimitationField(field));
    if (residual.length) {
      const other = R.part("07.10 Additional Legal and Governance Fields", "Remaining clean profile material");
      renderLegalFieldFamily(other, residual, R, "section-07-additional");
      root.append(other);
    }
    return root;
  }

  function renderResidualSection06(root, section, R) {
    const residual = R.allFields(section).filter((field) =>
      field.field_id !== "06.SUMMARY" &&
      !isObligationRegisterField(field)
    );
    if (!residual.length) return;
    const block = R.part("06.7 Additional Sector-Control Fields", "Remaining clean Phase 12 material");
    const material = residual.filter((field) => !R.isLimitationField(field));
    const limitations = residual.filter(R.isLimitationField);
    renderLegalFieldFamily(block, material, R, "section-06-additional");
    R.renderLimitationFields(block, limitations);
    root.append(block);
  }

  function renderLegalFieldFamily(parent, fields, R, baseId) {
    const scalarFields = [];
    let structuredIndex = 0;
    for (const field of fields) {
      if (R.isEmpty(field.value)) continue;
      if (R.isLimitationField(field)) {
        R.renderLimitationFields(parent, [field]);
      } else if (R.hasStructuredRows(field.value)) {
        parent.append(R.renderStructuredField(field, `${baseId}-structured-${structuredIndex++}`, ""));
      } else {
        scalarFields.push(field);
      }
    }
    if (scalarFields.length) {
      R.renderFieldRegister(
        parent,
        scalarFields,
        `${baseId}-fields`,
        "Maximum 10 fields are visible per browser page. Values remain upstream-owned."
      );
    }
  }

  function obligationRows(section, R) {
    for (const subsection of section.subsections || []) {
      for (const field of subsection.fields || []) {
        if (isObligationRegisterField(field)) {
          const value = field.value;
          if (Array.isArray(value)) return value.filter(R.isPlainObject);
          if (R.isPlainObject(value) && Array.isArray(value.rows)) return value.rows.filter(R.isPlainObject);
        }
      }
    }
    return [];
  }

  function isObligationRegisterField(field) {
    return field?.value?.schema_version === "phase12_obligation_presentation.v1"
      || field?.field_id === "DCO.OBLIGATION_REGISTER"
      || /obligation_register/i.test(String(field?.field_id || ""));
  }

  function obligationLink(row, R) {
    const anchor = `obligation-detail-${R.stableId(row.obligation_reference || row.normalized_name)}`;
    const link = R.node("a", "report-row-link", row.obligation_reference || "Obligation");
    link.href = `#${anchor}`;
    return link;
  }

  function postureBadge(row, R) {
    const value = posture(row);
    const badge = R.node("span", `report-obligation-posture is-${R.stableId(value).toLowerCase()}`, R.readableLabel(value));
    return badge;
  }

  function obligationEvidenceCard(row, R) {
    const card = R.node("article", "report-detail-card report-obligation-card");
    card.id = `obligation-detail-${R.stableId(row.obligation_reference || row.normalized_name)}`;
    const header = R.node("div", "report-detail-card-header");
    header.append(
      R.node("h4", "", row.normalized_name || row.obligation_reference || "Obligation"),
      postureBadge(row, R)
    );
    card.append(header);
    card.append(R.definitionList([
      ["Reference", row.obligation_reference],
      ["Source Layer", row.source_scope],
      ["Capability Context", row.capability_context],
      ["Obligation Family", row.obligation_family],
      ["Target-Specific Context", row.target_specific_context],
      ["Authority Dependency", row.authority_dependency],
      ["Exposure Role Context", row.exposure_role_context],
      ["Evidence Basis", row.evidence_basis],
      ["Regulatory Context", row.regulatory_context],
      ["Derivation Basis", row.derivation_basis],
      ["Missing Proof", row.missing_proof],
      ["Limitation", row.limitation]
    ]));
    return card;
  }

  function posture(row) {
    return String(row.control_posture_status || row.control_mechanism_present || "UNRESOLVED").toUpperCase();
  }

  function requiresReview(row) {
    return ["PARTIAL", "NOT_VISIBLE", "UNRESOLVED", "UNCLEAR"].includes(posture(row))
      || Boolean(row.missing_proof)
      || Boolean(row.diligence_question)
      || Boolean(row.limitation);
  }
})();

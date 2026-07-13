(function () {
  "use strict";

  const renderers = window.InterfaceReportSectionRenderers || {};
  renderers["08"] = renderSection08;
  window.InterfaceReportSectionRenderers = renderers;

  const STATUS_ORDER = Object.freeze({
    TRIGGERED: 1,
    CONTROLLED_BY_VISIBLE_CONTROL: 2,
    CONTROLLED_BY_EXCLUSION: 3,
    CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION: 4
  });

  const STATUS_LABELS = Object.freeze({
    TRIGGERED: "Triggered",
    CONTROLLED_BY_VISIBLE_CONTROL: "Controlled by visible control",
    CONTROLLED_BY_EXCLUSION: "Controlled by exclusion",
    CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION: "Controlled by public-evidence limitation"
  });

  function renderSection08(section, R) {
    const root = R.sectionShell(section);
    const profiles = exposureProfiles(section, R);
    const allRows = profiles.flatMap((profile) => profile.rows);

    const overview = R.part("08.1 Exposure Register Overview", "Upstream material exposure spine");
    overview.append(R.callout(
      "Interpretation boundary",
      "Exposure status, pain metadata, control positions and response routes are carried from Phase 10 and Phase 11. The report renderer does not re-evaluate, merge or re-rank exposure rows.",
      "is-limitation"
    ));
    overview.append(R.executiveLedger([
      ["Total exposure rows", allRows.length],
      ["Triggered", countStatus(allRows, "TRIGGERED")],
      ["Visible control", countStatus(allRows, "CONTROLLED_BY_VISIBLE_CONTROL")],
      ["Controlled by exclusion", countStatus(allRows, "CONTROLLED_BY_EXCLUSION")],
      ["Public-evidence limitation", countStatus(allRows, "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION")],
      ["Primary Sector", allRows.filter((row) => stream(row) === "Primary Sector").length],
      ["Capability Overlay", allRows.filter((row) => stream(row) === "Capability Overlay").length]
    ]));
    overview.append(statusLegend(R));
    root.append(overview);

    if (!allRows.length) {
      const empty = R.part("08.2 Exposure Rows", "Material exposure register");
      empty.append(R.node("p", "report-empty-state", "No material exposure row was emitted by the clean Phase 12 exposure profiles."));
      root.append(empty);
      return root;
    }

    for (const streamLabel of ["Primary Sector", "Capability Overlay"]) {
      const streamProfiles = profiles
        .filter((profile) => profile.stream_scope === streamLabel)
        .sort((left, right) => statusRank(left.material_status) - statusRank(right.material_status));
      if (!streamProfiles.length) continue;

      const streamBlock = R.part(
        streamLabel === "Primary Sector" ? "08.2 Primary Sector Exposures" : "08.3 Capability Overlay Exposures",
        `${streamLabel} · status-separated exposure profiles`
      );
      const streamRows = streamProfiles.flatMap((profile) => profile.rows);
      const heading = R.node("div", "report-stream-heading");
      heading.append(
        R.node("h3", "", streamLabel),
        R.node("span", "report-inline-status", `${streamRows.length} exposure row${streamRows.length === 1 ? "" : "s"}`)
      );
      streamBlock.append(heading);

      for (const profile of streamProfiles) {
        streamBlock.append(renderExposureProfile(profile, R));
      }
      root.append(streamBlock);
    }

    const authority = R.part("08.4 Authority and Framework Cross-Section", "Jurisdiction and framework context");
    authority.append(R.pagination.createPagedTable({
      id: "section-08-authority-framework",
      caption: "Maximum 10 exposure rows are visible per browser page. Authority and framework fields are displayed exactly as carried from upstream profiles.",
      columns: [
        { key: "identity.threat_id", label: "ID" },
        { key: "identity.threat_name", label: "Exposure" },
        { key: "identity.stream_scope", label: "Stream" },
        { key: "classification.compliance_framework", label: "Framework" },
        { key: "authorities.india", label: "India" },
        { key: "authorities.european_union", label: "European Union" },
        { key: "authorities.united_states", label: "United States" }
      ],
      rows: allRows.slice().sort(compareRows),
      renderCell: (row, column) => R.scalarText(R.valueAt(row, column.key))
    }));
    root.append(authority);

    const limitations = allRows.filter((row) => !R.isEmpty(row.limitations));
    const limitationPart = R.part("08.5 Exposure Limitations", "Row-level limitations and review routes");
    if (limitations.length) {
      limitationPart.append(R.pagination.createPagedTable({
        id: "section-08-exposure-limitations",
        caption: "Row-level limitations are carried from the upstream exposure profiles and do not create new review findings.",
        columns: [
          { key: "identity.threat_id", label: "ID" },
          { key: "identity.threat_name", label: "Exposure" },
          { key: "identity.material_status", label: "Status" },
          { key: "limitations", label: "Limitation" },
          { key: "response.review_route", label: "Review Route" }
        ],
        rows: limitations.slice().sort(compareRows),
        renderCell: (row, column) => R.scalarText(R.valueAt(row, column.key))
      }));
    } else {
      limitationPart.append(R.node("p", "report-empty-state", "No row-level exposure limitation was emitted."));
    }
    root.append(limitationPart);
    return root;
  }

  function renderExposureProfile(profile, R) {
    const box = R.node("section", "report-exposure-profile");
    const status = profile.material_status || "UNSPECIFIED";
    const header = R.node("div", "report-exposure-profile-heading");
    header.append(
      R.node("div", "report-exposure-status-label", STATUS_LABELS[status] || R.readableLabel(status)),
      R.node("span", `report-exposure-status is-${R.stableId(status).toLowerCase()}`, `${profile.rows.length} row${profile.rows.length === 1 ? "" : "s"}`)
    );
    box.append(header);

    const sorted = profile.rows.slice().sort(compareRows);
    for (const [painCategory, painRows] of groupBy(sorted, (row) => painLabel(row, R))) {
      const painBlock = R.node("section", "report-pain-category");
      painBlock.append(R.node("h3", "", painCategory));
      for (const [subcategory, subgroup] of groupBy(painRows, (row) => subcategoryLabel(row, R))) {
        const group = R.node("section", "report-subcategory-group");
        const base = R.stableId(`section-08-${profile.profile_id}-${painCategory}-${subcategory}`);
        group.append(R.node("h4", "", subcategory));
        group.append(R.pagination.createPagedTable({
          id: `${base}-table`,
          caption: `${profile.stream_scope} · ${STATUS_LABELS[status] || R.readableLabel(status)} · ${painCategory} · ${subcategory}. Maximum 10 rows are visible per browser page.`,
          columns: [
            { key: "identity.threat_id", label: "ID" },
            { key: "identity.threat_name", label: "Exposure" },
            { key: "severity.pain_depth", label: "Pain Depth" },
            { key: "severity.velocity", label: "Velocity" },
            { key: "classification.behavior_class", label: "Behaviour Class" },
            { key: "classification.surface", label: "Surface" },
            { key: "basis.control_or_exclusion_position", label: "Visible Control / Exclusion" },
            { key: "response.review_route", label: "Review Route" }
          ],
          rows: subgroup,
          renderCell: (row, column) => column.key === "identity.threat_id"
            ? rowLink(row, R)
            : R.scalarText(R.valueAt(row, column.key))
        }));
        group.append(R.pagination.createPagedDeck({
          id: `${base}-deck`,
          caption: "Exposure detail deck. Maximum 5 exposure cards are visible per browser page.",
          items: subgroup,
          renderCard: (row) => exposureCard(row, R)
        }));
        painBlock.append(group);
      }
      box.append(painBlock);
    }
    return box;
  }

  function exposureCard(row, R) {
    const card = R.node("article", "report-detail-card report-exposure-card");
    card.id = `exposure-detail-${R.stableId(R.valueAt(row, "identity.threat_id"))}`;
    const header = R.node("div", "report-detail-card-header");
    header.append(
      R.node("h4", "", R.valueAt(row, "identity.threat_name") || R.valueAt(row, "identity.threat_id") || "Exposure"),
      R.node("span", "report-inline-status", R.valueAt(row, "identity.threat_id") || "Exposure")
    );
    card.append(header);
    card.append(R.definitionList([
      ["Stream", R.valueAt(row, "identity.stream_scope")],
      ["Material Status", R.valueAt(row, "identity.material_status")],
      ["Lane", R.valueAt(row, "classification.lane")],
      ["Behaviour Class", R.valueAt(row, "classification.behavior_class")],
      ["Surface", R.valueAt(row, "classification.surface")],
      ["Subcategory", R.valueAt(row, "classification.subcategory")],
      ["Framework", R.valueAt(row, "classification.compliance_framework")],
      ["Pain Category", painLabel(row, R)],
      ["Pain Depth", R.valueAt(row, "severity.pain_depth")],
      ["Velocity", R.valueAt(row, "severity.velocity")],
      ["Legal Status", R.valueAt(row, "severity.legal_status")],
      ["Effective Date", R.valueAt(row, "severity.effective_date")],
      ["Legal Pain", R.valueAt(row, "impact.legal_pain")],
      ["False-Positive Mechanism", R.valueAt(row, "false_positive.mechanism")],
      ["False-Positive Impact", R.valueAt(row, "impact.false_positive_impact")],
      ["Target Match", R.valueAt(row, "basis.target_match")],
      ["Basis Proof", R.valueAt(row, "basis.basis_proof")],
      ["Evidence Basis", R.valueAt(row, "basis.evidence_basis")],
      ["Control / Exclusion Position", R.valueAt(row, "basis.control_or_exclusion_position")],
      ["Recommended Architecture Response", R.valueAt(row, "response.recommended_fix")],
      ["Review Route", R.valueAt(row, "response.review_route")],
      ["Limitations", row.limitations]
    ]));
    return card;
  }

  function statusLegend(R) {
    const legend = R.node("div", "report-exposure-legend");
    for (const [status, label] of Object.entries(STATUS_LABELS)) {
      const item = R.node("div", "report-exposure-legend-item");
      item.append(
        R.node("span", `report-exposure-status is-${R.stableId(status).toLowerCase()}`, label),
        R.node("span", "report-exposure-legend-copy", legendCopy(status))
      );
      legend.append(item);
    }
    return legend;
  }

  function exposureProfiles(section, R) {
    const out = [];
    for (const subsection of section.subsections || []) {
      if (subsection.profile_id === "section_summary") continue;
      const rows = [];
      for (const field of subsection.fields || []) {
        if (Array.isArray(field.value) && field.value.every(R.isPlainObject)) rows.push(...field.value);
      }
      if (!rows.length) continue;
      out.push({
        profile_id: subsection.profile_id || subsection.subsection_id || subsection.artifact_name,
        title: subsection.subsection_title,
        stream_scope: subsection.stream_scope || inferStream(subsection),
        material_status: subsection.material_status || inferStatus(subsection),
        rows
      });
    }
    return out;
  }

  function rowLink(row, R) {
    const id = R.valueAt(row, "identity.threat_id") || "Exposure";
    const link = R.node("a", "report-row-link", id);
    link.href = `#exposure-detail-${R.stableId(id)}`;
    return link;
  }

  function compareRows(left, right) {
    const a = left.presentation_order || {};
    const b = right.presentation_order || {};
    return number(a.pain_category_rank) - number(b.pain_category_rank)
      || String(a.pain_category_label || "").localeCompare(String(b.pain_category_label || ""))
      || String(a.subcategory_order || "").localeCompare(String(b.subcategory_order || ""))
      || number(a.pain_depth_rank) - number(b.pain_depth_rank)
      || number(a.velocity_rank) - number(b.velocity_rank)
      || String(left.identity?.threat_id || "").localeCompare(String(right.identity?.threat_id || ""));
  }

  function painLabel(row, R) {
    return R.scalarText(row.presentation_order?.pain_category_label || row.severity?.pain_category || row.severity?.pain_tier) || "Unspecified Pain Category";
  }

  function subcategoryLabel(row, R) {
    return R.scalarText(row.classification?.subcategory) || "Unspecified Subcategory";
  }

  function stream(row) {
    return row.identity?.stream_scope || "Primary Sector";
  }

  function countStatus(rows, status) {
    return rows.filter((row) => row.identity?.material_status === status).length;
  }

  function statusRank(status) {
    return STATUS_ORDER[status] || 99;
  }

  function inferStream(subsection) {
    return /overlay/i.test(`${subsection.artifact_name || ""} ${subsection.profile_id || ""}`) ? "Capability Overlay" : "Primary Sector";
  }

  function inferStatus(subsection) {
    const text = `${subsection.artifact_name || ""} ${subsection.profile_id || ""}`.toUpperCase();
    return Object.keys(STATUS_ORDER).find((status) => text.includes(status)) || "UNSPECIFIED";
  }

  function groupBy(items, selector) {
    const map = new Map();
    for (const item of items) {
      const key = selector(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return map;
  }

  function legendCopy(status) {
    return ({
      TRIGGERED: "Upstream trigger conditions were satisfied.",
      CONTROLLED_BY_VISIBLE_CONTROL: "A visible public control supports the upstream controlled position.",
      CONTROLLED_BY_EXCLUSION: "An upstream exclusion supports the controlled position.",
      CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION: "The controlled position is bounded by public-evidence limits."
    })[status] || "Upstream material status.";
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 999;
  }
})();

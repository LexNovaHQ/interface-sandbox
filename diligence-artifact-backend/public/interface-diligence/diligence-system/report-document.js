(function () {
  "use strict";

  const EXPECTED_RENDERER_SOURCE = "report_manifest_clean_profiles";
  const EXPECTED_SCHEMA_VERSION = "renderer_payload.v14.co_p12_05";
  const EXPECTED_SECTION_IDS = Object.freeze(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
  const TABLE_PAGE_SIZE = 10;
  const DECK_PAGE_SIZE = 5;
  const runId = queryParam("run_id");
  const pagination = window.InterfaceReportPagination;

  const elements = {
    title: document.getElementById("reportTitle"),
    target: document.getElementById("reportTarget"),
    subtitle: document.getElementById("reportSubtitle"),
    boundary: document.getElementById("reportBoundary"),
    meta: document.getElementById("reportMeta"),
    status: document.getElementById("reportStatusStrip"),
    body: document.getElementById("reportBody"),
    rail: document.getElementById("reportRail"),
    mobileSelect: document.getElementById("reportMobileSectionSelect"),
    utilityContext: document.getElementById("reportUtilityContext"),
    downloadPdf: document.getElementById("downloadPdfButton"),
    qualifiedReview: document.getElementById("qualifiedReviewButton"),
    footerQualifiedReview: document.getElementById("reportFooterQualifiedReviewButton"),
    headerQualifiedReview: document.getElementById("headerQualifiedReviewLink"),
    annexure: document.getElementById("technicalAnnexureButton")
  };

  let observer = null;

  if (!pagination) {
    renderUnavailable("Report pagination engine is unavailable.");
    return;
  }

  elements.downloadPdf?.addEventListener("click", function () { window.print(); });
  elements.mobileSelect?.addEventListener("change", function (event) {
    const id = event.target.value;
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  });

  if (!runId) {
    renderUnavailable("Missing run_id in report URL.");
  } else {
    installLinks(runId);
    loadReport(runId).catch(function (error) { renderUnavailable(error?.message || String(error)); });
  }

  async function loadReport(id) {
    const response = await fetch("/public/diligence-system/report/" + encodeURIComponent(id));
    const json = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(response.status + ": " + (json.message || json.error || "Report not ready"));
    const payload = json.renderer_payload || {};
    assertPayload(payload);
    renderReport(payload, id);
  }

  function assertPayload(payload) {
    if (payload.schema_version !== EXPECTED_SCHEMA_VERSION) throw new Error(`REPORT_DOCUMENT_SCHEMA_INVALID:${payload.schema_version || "missing"}`);
    if (payload.renderer_source !== EXPECTED_RENDERER_SOURCE) throw new Error(`REPORT_DOCUMENT_RENDERER_SOURCE_INVALID:${payload.renderer_source || "missing"}`);
    if (!Array.isArray(payload.sections)) throw new Error("REPORT_DOCUMENT_SECTIONS_MISSING");
    const ids = payload.sections.map(function (section) { return section.section_id; });
    if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_SECTION_IDS)) throw new Error("REPORT_DOCUMENT_SECTION_ORDER_INVALID");
    const contract = payload.presentation_contract || {};
    if (contract.table_rows_per_page !== TABLE_PAGE_SIZE) throw new Error("REPORT_DOCUMENT_TABLE_PAGE_SIZE_INVALID");
    if (contract.deck_cards_per_page !== DECK_PAGE_SIZE) throw new Error("REPORT_DOCUMENT_DECK_PAGE_SIZE_INVALID");
    if (contract.activity_classification_paths?.collapse_primary_and_overlay_forbidden !== true) throw new Error("REPORT_DOCUMENT_ACTIVITY_CLASSIFICATION_COLLAPSE_NOT_FORBIDDEN");
    if (contract.print_full_dataset !== true) throw new Error("REPORT_DOCUMENT_PRINT_FULL_DATASET_NOT_LOCKED");
  }

  function renderReport(payload, id) {
    pagination.reset();
    const shell = payload.report_shell || {};
    elements.title.textContent = shell.report_title || "Diligence Report";
    elements.target.textContent = shell.target_display_name || payload.target || "Target under review";
    elements.subtitle.textContent = shell.report_subtitle || "Review-Ready Public-Footprint Legal Exposure Review";
    elements.boundary.textContent = shell.boundary_notice || "Review-Ready Draft only. Qualified/local counsel review is required before reliance.";
    elements.utilityContext.textContent = `${shell.target_display_name || payload.target || "Target"} · ${shell.run_id || id}`;

    renderMatterCaption(shell, payload, id);
    renderStatusStrip(payload.dashboard_tiles || []);
    renderNavigation(payload.sections);
    elements.body.replaceChildren(...payload.sections.map(renderSection));
    initSectionObserver();
  }

  function renderMatterCaption(shell, payload, id) {
    const rows = [
      ["Target", shell.target_display_name || payload.target],
      ["Public source", shell.target_domain || payload.target_url],
      ["Matter / Run ID", shell.run_id || payload.run_id || id],
      ["Review date", formatDate(shell.generated_at || payload.generated_at)],
      ["Review basis", "Public and approved source materials"],
      ["Review status", shell.status_label || payload.status_label || payload.validation_status],
      ["Report mode", readableLabel(shell.report_mode || "PUBLIC_FOOTPRINT_REVIEW_READY_DRAFT")]
    ];
    elements.meta.replaceChildren(definitionList(rows));
  }

  function renderStatusStrip(tiles) {
    const preferred = ["Review status", "Report sections", "Exposure rows", "Open review items"];
    const selected = preferred.map(function (label) { return tiles.find(function (tile) { return tile.label === label; }); }).filter(Boolean);
    if (!selected.length) selected.push(...tiles.slice(0, 4));
    elements.status.replaceChildren(...selected.map(function (tile) {
      const item = node("div", "report-status-item");
      item.append(node("div", "report-status-label", tile.label), node("div", "report-status-value", scalarText(tile.value)));
      return item;
    }));
  }

  function renderNavigation(sections) {
    const rail = node("nav", "report-rail-list");
    const select = elements.mobileSelect;
    if (select) select.replaceChildren(node("option", "", "Jump to report section"));

    for (const section of sections) {
      const anchor = sectionAnchor(section.section_id);
      const link = node("a", "report-rail-item");
      link.href = `#${anchor}`;
      link.dataset.reportSectionId = section.section_id;
      link.append(node("span", "report-rail-index", section.section_id), node("span", "report-rail-text", section.section_title));
      rail.append(link);

      if (select) {
        const option = node("option", "", `${section.section_id} — ${section.section_title}`);
        option.value = anchor;
        select.append(option);
      }
    }
    elements.rail.replaceChildren(rail);
  }

  function renderSection(section) {
    const renderers = {
      "01": renderSection01,
      "02": renderSection02,
      "03": renderSection03,
      "04": renderSection04,
      "05": renderSection05,
      "06": renderSection06,
      "07": renderSection07,
      "08": renderSection08,
      "09": renderSection09,
      "10": renderSection10
    };
    return (renderers[section.section_id] || renderGenericSection)(section);
  }

  function sectionShell(section) {
    const root = node("section", "report-document-section");
    root.id = sectionAnchor(section.section_id);
    root.dataset.reportSectionId = section.section_id;
    const heading = node("header", "report-section-heading");
    heading.append(node("div", "report-section-number", `Section ${section.section_id}`), node("h2", "", section.section_title || `Section ${section.section_id}`));
    if (section.reviewer_summary) heading.append(node("p", "report-section-summary", section.reviewer_summary));
    root.append(heading);
    return root;
  }

  function renderSection01(section) {
    const root = sectionShell(section);
    renderSubsectionsInto(root, section.subsections, { mode: "definition" });
    return root;
  }

  function renderSection02(section) {
    const root = sectionShell(section);
    const summary = findSubsection(section, "section_summary");
    if (summary) root.append(renderSubsection(summary, { mode: "definition" }));
    const remaining = section.subsections.filter(function (subsection) { return subsection !== summary; });
    for (const subsection of remaining) root.append(renderSubsection(subsection, { mode: "executive" }));
    return root;
  }

  function renderSection03(section) {
    const root = sectionShell(section);
    renderSubsectionsInto(root, section.subsections, { mode: "definition" });
    return root;
  }

  function renderSection04(section) {
    const root = sectionShell(section);
    const activities = extractActivities(section);
    if (!activities.length) {
      renderSubsectionsInto(root, section.subsections, { mode: "editorial" });
      return root;
    }

    const register = part("04.2 Activity Register", "Activity register");
    register.append(pagination.createPagedTable({
      id: "section-04-activity-register",
      caption: "Primary and Capability Overlay classifications remain separate. Maximum 10 rows are visible per browser page.",
      columns: [
        { key: "activity_reference", label: "Ref" },
        { key: "product_service_wrapper", label: "Product / Service" },
        { key: "activity_feature_name", label: "Publicly Described Activity" },
        { key: "primary_behavior", label: "Primary Behaviour Class" },
        { key: "primary_surface", label: "Primary Surface" },
        { key: "overlay_behavior", label: "Overlay Behaviour Class" },
        { key: "overlay_surface", label: "Overlay Surface" },
        { key: "affected_context", label: "Affected Context" }
      ],
      rows: activities.map(activityRegisterRow)
    }));
    root.append(register);

    const detail = part("04.3 Activity Detail Deck", "Activity detail");
    detail.append(pagination.createPagedDeck({
      id: "section-04-activity-detail-deck",
      caption: "Maximum 5 activity detail cards are visible per browser page.",
      items: activities,
      renderCard: renderActivityCard
    }));
    root.append(detail);

    const summaryRows = buildClassificationSummary(activities);
    if (summaryRows.length) {
      const architecture = part("04.4 Classification Architecture Summary", "Classification architecture");
      architecture.append(pagination.createPagedTable({
        id: "section-04-classification-summary",
        columns: [
          { key: "layer", label: "Classification Layer" },
          { key: "package", label: "Package" },
          { key: "behavior", label: "Behaviour Class" },
          { key: "surface", label: "Surface" },
          { key: "count", label: "Activity Count" }
        ],
        rows: summaryRows
      }));
      root.append(architecture);
    }

    const residual = residualSubsections(section, activities);
    if (residual.length) {
      const additional = part("Additional Phase 12 Profile Fields", "Profile detail");
      renderSubsectionsInto(additional, residual, { mode: "editorial" });
      root.append(additional);
    }
    return root;
  }

  function renderSection05(section) {
    const root = sectionShell(section);
    const summary = findSubsection(section, "section_summary");
    if (summary) root.append(renderSubsection(summary, { mode: "definition" }));

    const groups = [
      {
        title: "Part A — Actors, Data and Authority",
        ids: ["parties_roles", "data_objects_flows", "purpose_authorization_user_controls", "privacy_contacts_consent_manager"]
      },
      {
        title: "Part B — Supply Chain and Lifecycle",
        ids: ["vendor_processor_chain", "location_transfer_custody", "retention_deletion_portability", "security_access_incident_governance"]
      },
      {
        title: "Part C — Risk and Readiness",
        ids: ["sensitive_high_risk_contexts", "regulatory_readiness", "missing_proof_diligence_requests"]
      }
    ];
    const used = new Set(summary ? [summary] : []);
    for (const group of groups) {
      const partNode = part(group.title, "Section 05 profile group");
      for (const id of group.ids) {
        const subsection = section.subsections.find(function (candidate) { return candidate.profile_id === id || candidate.subsection_id === id; });
        if (!subsection) continue;
        used.add(subsection);
        partNode.append(renderSubsection(subsection, { mode: "editorial" }));
      }
      if (partNode.children.length > 1) root.append(partNode);
    }
    for (const subsection of section.subsections) if (!used.has(subsection)) root.append(renderSubsection(subsection, { mode: "editorial" }));
    return root;
  }

  function renderSection06(section) {
    const root = sectionShell(section);
    renderSubsectionsInto(root, section.subsections, { mode: "editorial" });
    return root;
  }

  function renderSection07(section) {
    const root = sectionShell(section);
    renderSubsectionsInto(root, section.subsections, { mode: "editorial" });
    return root;
  }

  function renderSection08(section) {
    const root = sectionShell(section);
    const summary = findSubsection(section, "section_summary");
    if (summary) root.append(renderSubsection(summary, { mode: "definition" }));

    const exposureProfiles = section.subsections.filter(function (subsection) { return extractRowsFromSubsection(subsection).length; });
    if (!exposureProfiles.length) {
      renderSubsectionsInto(root, section.subsections.filter(function (subsection) { return subsection !== summary; }), { mode: "editorial" });
      return root;
    }

    const streamOrder = ["Primary Sector", "Capability Overlay"];
    for (const stream of streamOrder) {
      const profiles = exposureProfiles.filter(function (profile) { return inferredStream(profile) === stream; });
      if (!profiles.length) continue;
      const streamBlock = node("div", "report-stream-block");
      const streamHeading = node("div", "report-stream-heading");
      streamHeading.append(node("h3", "", stream), node("span", "report-inline-status", `${profiles.reduce(function (sum, profile) { return sum + extractRowsFromSubsection(profile).length; }, 0)} exposure rows`));
      streamBlock.append(streamHeading);

      for (const profile of sortExposureProfiles(profiles)) streamBlock.append(renderExposureProfile(profile, stream));
      root.append(streamBlock);
    }
    return root;
  }

  function renderSection09(section) {
    const root = sectionShell(section);
    renderSubsectionsInto(root, section.subsections, { mode: "editorial" });
    return root;
  }

  function renderSection10(section) {
    const root = sectionShell(section);
    renderSubsectionsInto(root, section.subsections, { mode: "methodology" });
    return root;
  }

  function renderGenericSection(section) {
    const root = sectionShell(section);
    renderSubsectionsInto(root, section.subsections, { mode: "editorial" });
    return root;
  }

  function renderSubsectionsInto(parent, subsections, options) {
    for (const subsection of subsections || []) parent.append(renderSubsection(subsection, options));
  }

  function renderSubsection(subsection, { mode = "editorial" } = {}) {
    const block = node("section", "report-subsection");
    block.dataset.profileId = subsection.profile_id || "";
    block.dataset.artifactName = subsection.artifact_name || "";
    block.append(node("div", "report-subsection-kicker", profileKicker(subsection)), node("h3", "", subsection.subsection_title || readableLabel(subsection.subsection_id)));
    renderFieldsInto(block, subsection.fields || [], { mode, componentBase: stableId(subsection.profile_id || subsection.subsection_id || subsection.artifact_name) });
    return block;
  }

  function renderFieldsInto(parent, fields, { mode, componentBase }) {
    const definitionRows = [];
    let componentIndex = 0;
    for (const field of fields) {
      const value = field.value;
      if (isEmpty(value)) continue;
      if (field.report_importance === "LIMITATION" || field.presentation === "LIMITATION_ITEM") {
        parent.append(callout(field.label, value, "is-limitation"));
        continue;
      }
      if (Array.isArray(value)) {
        if (!value.length) continue;
        if (value.every(isPrimitive)) {
          parent.append(labeledList(field.label, value));
        } else if (value.every(isPlainObject)) {
          parent.append(renderObjectArray(value, field, `${componentBase}-${componentIndex++}`));
        } else {
          parent.append(labeledList(field.label, value.map(scalarText)));
        }
        continue;
      }
      if (isPlainObject(value)) {
        const rows = flattenDefinitionRows(value, field.label);
        if (rows.length <= 14) definitionRows.push(...rows);
        else parent.append(renderObjectArray([value], field, `${componentBase}-${componentIndex++}`));
        continue;
      }
      if (mode === "executive" && /summary|overview|posture|priority|impact|warning/i.test(field.label || "")) {
        parent.append(callout(field.label, value, /warning|limitation/i.test(field.label || "") ? "is-limitation" : ""));
      } else {
        definitionRows.push([field.label || field.field_id || "Finding", value]);
      }
    }
    if (definitionRows.length) parent.append(definitionList(definitionRows));
  }

  function renderObjectArray(rows, field, id) {
    const columns = inferColumns(rows);
    if (columns.length && columns.length <= 9) {
      return pagination.createPagedTable({
        id,
        caption: field.label || "Register",
        columns: columns.map(function (key) { return { key, label: readableLabel(key) }; }),
        rows,
        renderCell: function (row, column) { return scalarText(valueAt(row, column.key)); }
      });
    }
    return pagination.createPagedDeck({
      id,
      caption: field.label || "Detail deck",
      items: rows,
      renderCard: function (item, index) { return renderGenericDetailCard(item, `${field.label || "Detail"} ${index + 1}`); }
    });
  }

  function renderExposureProfile(profile, stream) {
    const profileBlock = node("section", "report-part exposure-profile");
    const status = profile.public_status_label || readableLabel(profile.material_status || profile.profile_id || "Exposure profile");
    profileBlock.append(node("div", "report-part-label", `${stream} · ${status}`), node("h3", "", profile.subsection_title || status));
    const rows = extractRowsFromSubsection(profile).slice().sort(compareExposureRows);
    const painGroups = groupBy(rows, function (row) { return painCategoryLabel(row); });

    for (const [painCategory, painRows] of painGroups) {
      const painBlock = node("div", "report-pain-category");
      painBlock.append(node("h3", "", painCategory));
      const subcategoryGroups = groupBy(painRows, function (row) { return subcategoryLabel(row); });
      for (const [subcategory, subcategoryRows] of subcategoryGroups) {
        const group = node("div", "report-subcategory-group");
        group.append(node("h4", "", subcategory));
        const base = stableId(`${profile.profile_id}-${painCategory}-${subcategory}`);
        group.append(pagination.createPagedTable({
          id: `${base}-table`,
          caption: `${status} · ${painCategory} · ${subcategory}`,
          columns: [
            { key: "identity.threat_id", label: "ID" },
            { key: "identity.threat_name", label: "Exposure" },
            { key: "severity.pain_depth", label: "Pain Depth" },
            { key: "severity.velocity", label: "Velocity" },
            { key: "classification.behavior_class", label: "Behaviour Class" },
            { key: "classification.surface", label: "Surface" },
            { key: "basis.control_or_exclusion_position", label: "Visible Control" },
            { key: "response.review_route", label: "Review Action" }
          ],
          rows: subcategoryRows,
          renderCell: function (row, column) { return scalarText(valueAt(row, column.key)); }
        }));
        group.append(pagination.createPagedDeck({
          id: `${base}-deck`,
          caption: "Exposure detail deck — maximum 5 cards per browser page.",
          items: subcategoryRows,
          renderCard: renderExposureCard
        }));
        painBlock.append(group);
      }
      profileBlock.append(painBlock);
    }
    return profileBlock;
  }

  function renderActivityCard(activity) {
    const card = node("article", "report-detail-card");
    const header = node("div", "report-detail-card-header");
    header.append(node("h4", "", activity.activity_feature_name || activity.activity_candidate_summary || activity.activity_reference || "Activity"), node("span", "report-inline-status", activity.activity_reference || "Activity"));
    card.append(header);
    card.append(definitionList([
      ["Product / service", activity.product_service_wrapper],
      ["Activity summary", activity.activity_candidate_summary],
      ["Mechanics proof", activity.mechanics_proof],
      ["Autonomy / human control", activity.autonomy_human_control_signal],
      ["Data, content or object touched", activity.data_content_object_touched],
      ["External / internal action", activity.external_internal_action_signal],
      ["Primary Behaviour Class", classificationValues(activity.primary_classification, "behavior_class_codes")],
      ["Primary Surface", classificationValues(activity.primary_classification, "surface_context_tokens")],
      ["Primary classification basis", classificationBasis(activity.primary_classification)],
      ["Overlay Behaviour Class", overlayClassificationValues(activity.overlay_classifications, "behavior_class_codes")],
      ["Overlay Surface", overlayClassificationValues(activity.overlay_classifications, "surface_context_tokens")],
      ["Overlay classification basis", overlayBasis(activity.overlay_classifications)]
    ].filter(function (row) { return !isEmpty(row[1]); })));
    return card;
  }

  function renderExposureCard(row) {
    const card = node("article", "report-detail-card");
    const header = node("div", "report-detail-card-header");
    header.append(node("h4", "", row.identity?.threat_name || row.identity?.threat_id || "Exposure"), node("span", "report-inline-status", row.identity?.threat_id || "Exposure"));
    card.append(header);
    card.append(definitionList([
      ["Stream", row.identity?.stream_scope],
      ["Material status", row.identity?.material_status],
      ["Pain Category", painCategoryLabel(row)],
      ["Subcategory", subcategoryLabel(row)],
      ["Pain Depth", scalarText(row.severity?.pain_depth)],
      ["Velocity", scalarText(row.severity?.velocity)],
      ["Behaviour Class", scalarText(row.classification?.behavior_class)],
      ["Surface", scalarText(row.classification?.surface)],
      ["Legal pain", row.impact?.legal_pain],
      ["False-positive mechanism", row.false_positive?.mechanism],
      ["False-positive impact", row.impact?.false_positive_impact],
      ["Public evidence basis", row.basis?.evidence_basis],
      ["Control / exclusion basis", row.basis?.control_or_exclusion_position],
      ["Recommended architecture response", row.response?.recommended_fix],
      ["Review route", row.response?.review_route],
      ["Limitations", row.limitations]
    ].filter(function (pair) { return !isEmpty(pair[1]); })));
    return card;
  }

  function renderGenericDetailCard(item, title) {
    const card = node("article", "report-detail-card");
    card.append(node("h4", "", title));
    card.append(definitionList(flattenDefinitionRows(item)));
    return card;
  }

  function activityRegisterRow(activity) {
    return {
      activity_reference: activity.activity_reference,
      product_service_wrapper: activity.product_service_wrapper,
      activity_feature_name: activity.activity_feature_name || activity.activity_candidate_summary,
      primary_behavior: classificationValues(activity.primary_classification, "behavior_class_codes"),
      primary_surface: classificationValues(activity.primary_classification, "surface_context_tokens"),
      overlay_behavior: overlayClassificationValues(activity.overlay_classifications, "behavior_class_codes"),
      overlay_surface: overlayClassificationValues(activity.overlay_classifications, "surface_context_tokens"),
      affected_context: activity.data_content_object_touched
    };
  }

  function extractActivities(section) {
    const found = [];
    const seen = new Set();
    for (const subsection of section.subsections || []) {
      for (const field of subsection.fields || []) collectActivities(field.value, found, seen);
    }
    return found;
  }

  function collectActivities(value, found, seen) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      if (value.every(function (item) { return isPlainObject(item) && ("primary_classification" in item || "overlay_classifications" in item || "activity_reference" in item); })) {
        for (const activity of value) addActivity(activity, found, seen);
        return;
      }
      for (const item of value) collectActivities(item, found, seen);
      return;
    }
    if (Array.isArray(value.activities)) for (const activity of value.activities) addActivity(activity, found, seen);
    for (const nested of Object.values(value)) collectActivities(nested, found, seen);
  }

  function addActivity(activity, found, seen) {
    const key = String(activity.activity_reference || activity.activity_feature_name || JSON.stringify(activity));
    if (seen.has(key)) return;
    seen.add(key);
    found.push(activity);
  }

  function residualSubsections(section) {
    return (section.subsections || []).filter(function (subsection) {
      return !(subsection.fields || []).some(function (field) { return containsActivities(field.value); });
    });
  }

  function containsActivities(value) {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(function (item) { return containsActivities(item); });
    if (Array.isArray(value.activities)) return true;
    if ("primary_classification" in value || "overlay_classifications" in value || "activity_reference" in value) return true;
    return Object.values(value).some(containsActivities);
  }

  function buildClassificationSummary(activities) {
    const counts = new Map();
    for (const activity of activities) {
      addClassificationCount(counts, "Primary", activity.primary_classification);
      for (const overlay of activity.overlay_classifications || []) addClassificationCount(counts, "Overlay", overlay);
    }
    return [...counts.values()].sort(function (a, b) {
      return a.layer.localeCompare(b.layer) || a.package.localeCompare(b.package) || a.behavior.localeCompare(b.behavior) || a.surface.localeCompare(b.surface);
    });
  }

  function addClassificationCount(counts, layer, classification) {
    if (!classification || typeof classification !== "object") return;
    const behaviors = arrayValue(classification.behavior_class_codes).map(scalarText).filter(Boolean);
    const surfaces = arrayValue(classification.surface_context_tokens).map(scalarText).filter(Boolean);
    const packageName = classification.overlay_id || classification.package_id || "Unspecified package";
    const behaviorValues = behaviors.length ? behaviors : ["Not evidenced"];
    const surfaceValues = surfaces.length ? surfaces : ["Not evidenced"];
    for (const behavior of behaviorValues) for (const surface of surfaceValues) {
      const key = `${layer}|${packageName}|${behavior}|${surface}`;
      const current = counts.get(key) || { layer, package: packageName, behavior, surface, count: 0 };
      current.count += 1;
      counts.set(key, current);
    }
  }

  function extractRowsFromSubsection(subsection) {
    const rows = [];
    for (const field of subsection.fields || []) {
      if (Array.isArray(field.value) && field.value.every(isPlainObject)) rows.push(...field.value);
    }
    return rows;
  }

  function compareExposureRows(a, b) {
    const ap = a.presentation_order || {};
    const bp = b.presentation_order || {};
    return number(ap.pain_category_rank, 999) - number(bp.pain_category_rank, 999)
      || String(ap.pain_category_label || painCategoryLabel(a)).localeCompare(String(bp.pain_category_label || painCategoryLabel(b)))
      || String(ap.subcategory_order || subcategoryLabel(a)).localeCompare(String(bp.subcategory_order || subcategoryLabel(b)))
      || number(ap.pain_depth_rank, 999) - number(bp.pain_depth_rank, 999)
      || number(ap.velocity_rank, 999) - number(bp.velocity_rank, 999)
      || String(a.identity?.threat_id || "").localeCompare(String(b.identity?.threat_id || ""));
  }

  function sortExposureProfiles(profiles) {
    const order = {
      TRIGGERED: 1,
      CONTROLLED_BY_VISIBLE_CONTROL: 2,
      CONTROLLED_BY_EXCLUSION: 3,
      CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION: 4
    };
    return profiles.slice().sort(function (a, b) { return (order[a.material_status] || 99) - (order[b.material_status] || 99); });
  }

  function inferredStream(profile) {
    if (profile.stream_scope) return profile.stream_scope;
    return /overlay/i.test(profile.artifact_name || profile.profile_id || "") ? "Capability Overlay" : "Primary Sector";
  }

  function painCategoryLabel(row) {
    return scalarText(row.presentation_order?.pain_category_label || row.severity?.pain_category || row.severity?.pain_tier) || "Unspecified Pain Category";
  }

  function subcategoryLabel(row) {
    return scalarText(row.classification?.subcategory) || "Unspecified Subcategory";
  }

  function classificationValues(classification, key) {
    return arrayValue(classification?.[key]).map(scalarText).filter(Boolean).join(", ");
  }

  function overlayClassificationValues(overlays, key) {
    return arrayValue(overlays).map(function (overlay) {
      const values = arrayValue(overlay?.[key]).map(scalarText).filter(Boolean).join(", ");
      if (!values) return "";
      return `${overlay.overlay_id || overlay.package_id || "Overlay"}: ${values}`;
    }).filter(Boolean).join("; ");
  }

  function classificationBasis(classification) {
    return [
      ...arrayValue(classification?.behavior_class_derivation_basis),
      ...arrayValue(classification?.surface_derivation_basis)
    ].map(function (basis) { return scalarText(basis.material_basis || basis.normalized_name || basis); }).filter(Boolean).join("; ");
  }

  function overlayBasis(overlays) {
    return arrayValue(overlays).map(function (overlay) {
      const basis = classificationBasis(overlay);
      return basis ? `${overlay.overlay_id || overlay.package_id || "Overlay"}: ${basis}` : "";
    }).filter(Boolean).join("; ");
  }

  function definitionList(rows) {
    const list = node("div", "report-definition-list");
    for (const row of rows || []) {
      if (!Array.isArray(row) || isEmpty(row[1])) continue;
      const item = node("div", "report-definition-row");
      item.append(node("div", "report-definition-term", readableLabel(row[0])), node("div", "report-definition-value", scalarText(row[1])));
      list.append(item);
    }
    return list;
  }

  function flattenDefinitionRows(value, prefix = "") {
    if (!isPlainObject(value)) return [[prefix || "Value", value]];
    const rows = [];
    for (const [key, nested] of Object.entries(value)) {
      if (isEmpty(nested)) continue;
      const label = prefix && prefix !== "Summary" ? `${prefix} — ${readableLabel(key)}` : readableLabel(key);
      if (isPlainObject(nested) && Object.keys(nested).length <= 6) {
        for (const [childKey, childValue] of Object.entries(nested)) if (!isEmpty(childValue)) rows.push([`${label} — ${readableLabel(childKey)}`, childValue]);
      } else {
        rows.push([label, nested]);
      }
    }
    return rows;
  }

  function callout(label, value, variant) {
    const block = node("div", `report-callout ${variant || ""}`.trim());
    block.append(node("div", "report-definition-term", label || "Review note"), node("div", "report-definition-value", scalarText(value)));
    return block;
  }

  function labeledList(label, values) {
    const block = node("div", "report-subsection");
    block.append(node("div", "report-subsection-kicker", label || "Items"));
    const list = node("ul", "report-list");
    for (const value of values) list.append(node("li", "", scalarText(value)));
    block.append(list);
    return block;
  }

  function part(title, label) {
    const block = node("section", "report-part");
    block.append(node("div", "report-part-label", label || "Report part"), node("h3", "", title));
    return block;
  }

  function inferColumns(rows) {
    const keys = [];
    const seen = new Set();
    for (const row of rows.slice(0, 20)) {
      for (const key of Object.keys(row || {})) {
        if (seen.has(key)) continue;
        const value = row[key];
        if (isPlainObject(value) && !hasReadableScalar(value)) continue;
        seen.add(key);
        keys.push(key);
      }
    }
    return keys;
  }

  function hasReadableScalar(value) {
    return ["label", "normalized_name", "public_name", "name", "code", "token", "value"].some(function (key) { return !isEmpty(value?.[key]); });
  }

  function findSubsection(section, id) {
    return (section.subsections || []).find(function (subsection) { return subsection.profile_id === id || subsection.subsection_id === id; }) || null;
  }

  function profileKicker(subsection) {
    if (subsection.stream_scope && subsection.public_status_label) return `${subsection.stream_scope} · ${subsection.public_status_label}`;
    return subsection.profile_id ? readableLabel(subsection.profile_id) : "Report profile";
  }

  function groupBy(items, keyFn) {
    const map = new Map();
    for (const item of items) {
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return map;
  }

  function renderUnavailable(message) {
    elements.title.textContent = "Report not ready";
    elements.target.textContent = "Renderer payload unavailable";
    elements.subtitle.textContent = "The report page requires the current clean Phase 12 renderer payload.";
    elements.boundary.textContent = "No legal or report conclusion is available from this incomplete renderer state.";
    elements.meta.replaceChildren();
    elements.status.replaceChildren();
    elements.rail.textContent = "Report unavailable";
    const block = node("section", "report-unavailable");
    block.append(node("div", "report-cover-eyebrow", "Run diagnostic"), node("h2", "", "Renderer payload is unavailable"), node("p", "report-narrative", message));
    elements.body.replaceChildren(block);
  }

  function installLinks(id) {
    const qr = "qualified-review.html?run_id=" + encodeURIComponent(id);
    const annexure = "technical-annexure.html?run_id=" + encodeURIComponent(id);
    for (const element of [elements.qualifiedReview, elements.footerQualifiedReview, elements.headerQualifiedReview]) if (element) element.href = qr;
    if (elements.annexure) {
      elements.annexure.href = annexure;
      elements.annexure.target = "_blank";
      elements.annexure.rel = "noopener";
    }
  }

  function initSectionObserver() {
    observer?.disconnect();
    const sections = [...document.querySelectorAll(".report-document-section[data-report-section-id]")];
    if (!("IntersectionObserver" in window) || !sections.length) return;
    observer = new IntersectionObserver(function (entries) {
      const active = entries.filter(function (entry) { return entry.isIntersecting; }).sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
      if (!active) return;
      setActiveSection(active.target.dataset.reportSectionId);
    }, { rootMargin: "-18% 0px -66% 0px", threshold: [0.08, 0.18, 0.35, 0.55] });
    for (const section of sections) observer.observe(section);
  }

  function setActiveSection(sectionId) {
    document.querySelectorAll(".report-rail-item").forEach(function (item) {
      const active = item.dataset.reportSectionId === sectionId;
      item.classList.toggle("active", active);
      item.setAttribute("aria-current", active ? "true" : "false");
    });
    if (elements.mobileSelect) elements.mobileSelect.value = sectionAnchor(sectionId);
  }

  function scalarText(value) {
    if (value === undefined || value === null || value === "") return "";
    if (Array.isArray(value)) return value.map(scalarText).filter(Boolean).join(", ");
    if (typeof value !== "object") return String(value);
    if (hasReadableScalar(value)) return String(value.label ?? value.normalized_name ?? value.public_name ?? value.name ?? value.code ?? value.token ?? value.value ?? "");
    return Object.entries(value).filter(function ([, nested]) { return !isEmpty(nested); }).map(function ([key, nested]) { return `${readableLabel(key)}: ${scalarText(nested)}`; }).join("; ");
  }

  function readableLabel(value) {
    return String(value || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replaceAll("_", " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function valueAt(value, path) {
    return String(path || "").split(".").reduce(function (current, key) { return current === undefined || current === null ? undefined : current[key]; }, value);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function arrayValue(value) { return Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value]; }
  function isPrimitive(value) { return value === null || ["string", "number", "boolean"].includes(typeof value); }
  function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
  function isEmpty(value) { return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0) || (isPlainObject(value) && Object.keys(value).length === 0); }
  function number(value, fallback) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
  function sectionAnchor(id) { return `report-section-${String(id || "").padStart(2, "0")}`; }
  function stableId(value) { return String(value || "report-component").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "report-component"; }
  function queryParam(name) { return new URLSearchParams(window.location.search || "").get(name) || ""; }
  function reducedMotion() { return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true; }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }
})();

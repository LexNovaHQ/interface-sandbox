(function () {
  "use strict";

  const VERSION = "interface_public_annexure.v1";
  const runId = new URLSearchParams(window.location.search || "").get("run_id") || "";
  const els = {
    title: document.getElementById("annexureTitle"),
    subtitle: document.getElementById("annexureSubtitle"),
    meta: document.getElementById("annexureMeta"),
    index: document.getElementById("artifactIndex"),
    counts: document.getElementById("annexureCounts"),
    back: document.getElementById("backToReportButton"),
    qr: document.getElementById("annexureQualifiedReviewButton"),
    json: document.getElementById("manifestJsonButton"),
    live: document.getElementById("annexureLiveStatus")
  };

  window.InterfacePublicAnnexure = Object.freeze({ version: VERSION, groupArtifacts, inferProfile });

  if (!runId) fail("Missing run_id in technical annexure URL.");
  else boot().catch((error) => fail(error?.message || String(error)));

  async function boot() {
    const apiPath = `/public/diligence-system/technical-annexure/${encodeURIComponent(runId)}`;
    els.back.href = `report.html?run_id=${encodeURIComponent(runId)}`;
    els.qr.href = `qualified-review.html?run_id=${encodeURIComponent(runId)}`;
    els.json.href = apiPath;
    const response = await fetch(apiPath);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${response.status}: ${payload.message || payload.error || "Technical annexure not ready"}`);
    assertPayload(payload);
    render(payload);
  }

  function assertPayload(payload) {
    if (payload.layer_id !== "layer_2_public_technical_annexure") throw new Error("TECHNICAL_ANNEXURE_LAYER_INVALID");
    if (payload.report_body_inlines_full_payloads !== false) throw new Error("TECHNICAL_ANNEXURE_FULL_PAYLOAD_INLINE_FORBIDDEN");
    if (!Array.isArray(payload.artifacts)) throw new Error("TECHNICAL_ANNEXURE_ARTIFACT_MANIFEST_MISSING");
    if (payload.manifest_only !== true) throw new Error("TECHNICAL_ANNEXURE_MANIFEST_ONLY_NOT_LOCKED");
  }

  function render(payload) {
    const artifacts = payload.artifacts || [];
    const included = artifacts.filter((row) => row.included_in_public_annexure_manifest === true);
    const excluded = artifacts.filter((row) => row.included_in_public_annexure_manifest !== true);
    els.title.textContent = payload.public_label || "Public Technical Annexure";
    els.subtitle.textContent = `Run ${text(payload.run_id, runId)} · ${text(payload.target, "Target not specified")} · Manifest metadata only`;
    renderMeta(payload, artifacts.length, included.length, excluded.length);
    renderCounts(artifacts.length, included.length, excluded.length, groupArtifacts(artifacts).length);
    renderGroups(groupArtifacts(artifacts));
    announce(`Technical annexure loaded. ${artifacts.length} artifact rows, ${included.length} included and ${excluded.length} excluded.`);
  }

  function renderMeta(payload, total, included, excluded) {
    const rows = [
      ["Run ID", payload.run_id],
      ["Target", payload.target],
      ["Target URL", payload.target_url],
      ["Status", statusLabel(payload.status)],
      ["Current phase", payload.current_phase],
      ["Expected pack", payload.expected_pack_name],
      ["Manifest only", payload.manifest_only ? "Yes" : "No"],
      ["Full payloads inline", payload.report_body_inlines_full_payloads ? "Yes" : "No"],
      ["Artifact rows", total],
      ["Publicly listed", included],
      ["Explicitly excluded", excluded]
    ].filter((row) => row[1] !== undefined && row[1] !== null && row[1] !== "");
    els.meta.replaceChildren(...rows.map(([label, value]) => metaItem(label, value)));
  }

  function renderCounts(total, included, excluded, phases) {
    els.counts.replaceChildren(
      countBadge(`${total} artifact rows`),
      countBadge(`${included} included`),
      countBadge(`${excluded} excluded`),
      countBadge(`${phases} phase groups`)
    );
  }

  function renderGroups(groups) {
    if (!groups.length) {
      els.index.replaceChildren(node("p", "annexure-empty", "No artifacts are listed for this run."));
      return;
    }
    const fragment = document.createDocumentFragment();
    groups.forEach((phase) => fragment.append(renderPhaseGroup(phase)));
    els.index.replaceChildren(fragment);
  }

  function renderPhaseGroup(phase) {
    const section = node("section", "annexure-phase-group");
    const heading = node("div", "annexure-phase-heading");
    heading.append(
      node("h3", "", phase.phase_label),
      node("span", "annexure-status", `${phase.artifact_count} row${phase.artifact_count === 1 ? "" : "s"}`)
    );
    section.append(heading);
    phase.profiles.forEach((profile) => {
      const profileBlock = node("section", "annexure-profile-group");
      profileBlock.append(node("h4", "annexure-profile-heading", profile.profile_label));
      profileBlock.append(renderTable(profile.rows, `${phase.phase_label} · ${profile.profile_label}`));
      section.append(profileBlock);
    });
    return section;
  }

  function renderTable(rows, captionText) {
    const shell = node("div", "annexure-table-shell");
    shell.tabIndex = 0;
    shell.setAttribute("role", "region");
    shell.setAttribute("aria-label", `${captionText} artifact manifest table`);
    const table = node("table", "annexure-table");
    const caption = document.createElement("caption");
    caption.textContent = `${captionText}. Public manifest metadata only.`;
    const thead = document.createElement("thead");
    const header = document.createElement("tr");
    ["Artifact", "Profile", "Status", "Version", "Public Manifest", "Exclusion Reason"].forEach((label) => {
      const th = node("th", "", label);
      th.scope = "col";
      header.append(th);
    });
    thead.append(header);
    const tbody = document.createElement("tbody");
    rows.forEach((artifact) => {
      const included = artifact.included_in_public_annexure_manifest === true;
      const tr = document.createElement("tr");
      tr.append(
        node("td", "", text(artifact.artifact_name, "Unnamed artifact")),
        node("td", "", inferProfile(artifact).profile_label),
        node("td", "", statusLabel(artifact.lock_status)),
        node("td", "", text(artifact.latest_version, "—")),
        statusCell(included ? "Included" : "Excluded", included),
        node("td", "", included ? "—" : text(artifact.exclusion_reason, "Excluded by public annexure policy"))
      );
      tbody.append(tr);
    });
    table.append(caption, thead, tbody);
    shell.append(table);
    return shell;
  }

  function groupArtifacts(artifacts) {
    const phases = new Map();
    artifacts.forEach((artifact) => {
      const phase = normalizePhase(artifact.phase);
      if (!phases.has(phase.key)) phases.set(phase.key, { ...phase, rows: [] });
      phases.get(phase.key).rows.push(artifact);
    });
    return [...phases.values()]
      .sort((a, b) => a.order - b.order || a.phase_label.localeCompare(b.phase_label))
      .map((phase) => {
        const profiles = new Map();
        phase.rows.forEach((artifact) => {
          const profile = inferProfile(artifact);
          if (!profiles.has(profile.profile_key)) profiles.set(profile.profile_key, { ...profile, rows: [] });
          profiles.get(profile.profile_key).rows.push(artifact);
        });
        return {
          phase_key: phase.key,
          phase_label: phase.phase_label,
          artifact_count: phase.rows.length,
          profiles: [...profiles.values()]
            .sort((a, b) => a.profile_label.localeCompare(b.profile_label))
            .map((profile) => ({ ...profile, rows: profile.rows.slice().sort((a, b) => String(a.artifact_name || "").localeCompare(String(b.artifact_name || ""))) }))
        };
      });
  }

  function inferProfile(artifact = {}) {
    const explicit = artifact.profile_id || artifact.profile || artifact.artifact_family || artifact.family || "";
    if (explicit) return { profile_key: stable(explicit), profile_label: label(explicit) };
    const name = String(artifact.artifact_name || "");
    const match = name.match(/(?:report_section__\d+_|phase\d+_)?([a-z0-9]+(?:_[a-z0-9]+){0,3})/i);
    const raw = match?.[1] || name || "general_artifacts";
    if (/^report_section__/.test(name)) {
      const sectionMatch = name.match(/^report_section__(\d+)_([^]+)/);
      return { profile_key: `report-section-${sectionMatch?.[1] || ""}`, profile_label: `Report Section ${sectionMatch?.[1] || ""}` };
    }
    return { profile_key: stable(raw), profile_label: label(raw) };
  }

  function normalizePhase(value) {
    const raw = String(value || "UNASSIGNED").trim();
    const number = Number(raw.match(/\d+/)?.[0]);
    return {
      key: stable(raw),
      phase_label: number ? `Phase ${number}` : label(raw),
      order: Number.isFinite(number) ? number : 999
    };
  }

  function statusCell(value, included) {
    const td = document.createElement("td");
    td.append(node("span", `annexure-status ${included ? "is-included" : "is-excluded"}`, value));
    return td;
  }

  function countBadge(value) { return node("span", "annexure-count", value); }
  function metaItem(labelText, value) {
    const item = node("div", "annexure-meta-item");
    item.append(node("div", "annexure-meta-label", labelText), node("div", "annexure-meta-value", String(value)));
    return item;
  }
  function statusLabel(value) {
    const raw = String(value || "").trim();
    const upper = raw.toUpperCase();
    if (upper === "LOCKED_WITH_LIMITATIONS") return "Completed with public-source limitations";
    if (upper === "LOCKED" || upper === "COMPLETE") return "Completed";
    if (upper === "REPAIR_REQUIRED") return "Requires repair before reliance";
    if (upper === "CONTROLLED_FAILURE") return "Controlled failure — do not rely";
    return raw || "Not stated";
  }
  function fail(message) {
    els.title.textContent = "Technical annexure unavailable";
    els.subtitle.textContent = message;
    els.meta.replaceChildren();
    els.counts.replaceChildren();
    els.index.replaceChildren(node("div", "annexure-error", message));
    announce(message);
  }
  function announce(message) { if (els.live) els.live.textContent = message; }
  function text(value, fallback) { const out = String(value ?? "").trim(); return out || fallback; }
  function label(value) { return String(value || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase()) || "General Artifacts"; }
  function stable(value) { return String(value || "general").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "general"; }
  function node(tag, className, textContent) { const element = document.createElement(tag); if (className) element.className = className; if (textContent !== undefined && textContent !== null) element.textContent = String(textContent); return element; }
})();

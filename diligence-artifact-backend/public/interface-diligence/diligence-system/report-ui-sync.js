(function () {
  const railSelector = ".report-rail-item";
  const sectionSelector = ".report-section-card[id]";
  const body = document.getElementById("reportBody");
  let syncQueued = false;
  let enhanceQueued = false;

  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function activeSectionFromScroll() {
    const sections = Array.from(document.querySelectorAll(sectionSelector));
    if (!sections.length) return null;
    const anchor = Math.min(260, Math.max(130, window.innerHeight * 0.28));
    let active = sections[0];
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= anchor && rect.bottom > 96) active = section;
      if (rect.top > anchor) break;
    }
    return active;
  }

  function setRailActive(section) {
    if (!section) return;
    const rawId = section.dataset.reportSectionId || section.id || "";
    const normalized = slug(rawId);
    const normalizedDomId = slug(section.id || "");
    document.querySelectorAll(railSelector).forEach(function (item) {
      const itemId = slug(item.dataset.reportSectionId || item.getAttribute("href") || "");
      const itemHref = slug(String(item.getAttribute("href") || "").replace(/^#/, ""));
      const active = itemId === normalized || itemId === normalizedDomId || itemHref === normalized || itemHref === normalizedDomId;
      item.classList.toggle("active", active);
      item.setAttribute("aria-current", active ? "true" : "false");
    });
    const status = document.getElementById("reportDeckStatus");
    const activeText = document.querySelector(".report-rail-item.active .report-rail-text")?.textContent;
    if (status && activeText) {
      status.dataset.currentSection = activeText;
      if (!/Current section:/i.test(status.textContent || "")) {
        status.textContent = (status.textContent || "").replace(/\s*$/, "") + " Current section: " + activeText + ".";
      } else {
        status.textContent = (status.textContent || "").replace(/Current section:.*$/i, "Current section: " + activeText + ".");
      }
    }
  }

  function syncRailNow() {
    syncQueued = false;
    setRailActive(activeSectionFromScroll());
  }

  function requestRailSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(syncRailNow);
  }

  function removeDuplicativeTitlePanels() {
    document.querySelectorAll(".report-finding-card").forEach(function (card) {
      const title = normalize(card.querySelector(".report-finding-title")?.textContent || "");
      if (!title) return;
      card.querySelectorAll(".report-context-panel").forEach(function (panel) {
        const label = normalize(panel.querySelector(".report-context-label")?.textContent || "");
        const rows = Array.from(panel.querySelectorAll(".report-context-row"));
        if (rows.length !== 1) return;
        const key = normalize(rows[0].querySelector(".report-context-key")?.textContent || "");
        const value = normalize(rows[0].querySelector(".report-context-value")?.textContent || "");
        const isDuplicateTitle = value && value === title && (key === "threat name" || key === "finding" || key === "plain english issue");
        if (label === "finding action" && isDuplicateTitle) panel.remove();
      });
    });
  }

  function classifyCardLayouts() {
    document.querySelectorAll(".report-finding-layout").forEach(function (layout) {
      const panels = layout.querySelectorAll(":scope > .report-context-panel");
      layout.classList.toggle("single-panel", panels.length === 1);
      layout.classList.toggle("two-panels", panels.length === 2);
      layout.classList.toggle("multi-panel", panels.length > 2);
      layout.classList.add("row-flow");
    });
  }

  function syncDeckFooters() {
    document.querySelectorAll(".report-card-deck[data-report-deck-id]").forEach(function (deck) {
      if (deck.querySelector(":scope > .report-deck-footer")) return;
      const headerActions = deck.querySelector(":scope > .report-deck-header .report-deck-actions");
      if (!headerActions) return;
      const footer = document.createElement("div");
      footer.className = "report-deck-footer";
      const clonedActions = headerActions.cloneNode(true);
      clonedActions.classList.add("report-deck-actions-bottom");
      footer.append(clonedActions);
      deck.append(footer);
    });
  }

  function enhanceNow() {
    enhanceQueued = false;
    removeDuplicativeTitlePanels();
    classifyCardLayouts();
    syncDeckFooters();
    requestRailSync();
  }

  function enhance() {
    if (enhanceQueued) return;
    enhanceQueued = true;
    requestAnimationFrame(enhanceNow);
  }

  window.addEventListener("scroll", requestRailSync, { passive: true });
  window.addEventListener("resize", requestRailSync, { passive: true });
  window.addEventListener("load", enhance);
  document.addEventListener("DOMContentLoaded", enhance);

  if (body && "MutationObserver" in window) {
    new MutationObserver(enhance).observe(body, { childList: true, subtree: true });
  }

  setTimeout(enhance, 250);
  setTimeout(enhance, 1000);
})();

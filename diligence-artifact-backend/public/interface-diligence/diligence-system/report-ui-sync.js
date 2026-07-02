(function () {
  const railSelector = ".report-rail-item";
  const sectionSelector = ".report-section-card[id]";
  const body = document.getElementById("reportBody");
  let syncQueued = false;

  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function activeSectionFromScroll() {
    const sections = Array.from(document.querySelectorAll(sectionSelector));
    if (!sections.length) return null;
    const anchor = Math.min(260, Math.max(130, window.innerHeight * 0.28));
    let active = sections[0];
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= anchor && rect.bottom > 96) {
        active = section;
      }
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

  function classifyCardLayouts() {
    document.querySelectorAll(".report-finding-layout").forEach(function (layout) {
      const panels = layout.querySelectorAll(":scope > .report-context-panel");
      layout.classList.toggle("single-panel", panels.length === 1);
      layout.classList.toggle("two-panels", panels.length === 2);
      layout.classList.toggle("multi-panel", panels.length > 2);
    });
  }

  function enhance() {
    classifyCardLayouts();
    requestRailSync();
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

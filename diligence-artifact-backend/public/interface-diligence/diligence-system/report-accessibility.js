(function () {
  "use strict";

  const VERSION = "interface_report_accessibility.v1";
  let observer = null;

  window.InterfaceReportAccessibility = Object.freeze({
    version: VERSION,
    enhance,
    focusSection
  });

  document.addEventListener("DOMContentLoaded", function () {
    enhance(document);
    observeReportBody();
  });

  document.addEventListener("interface:report-pagination-change", function (event) {
    const detail = event.detail || {};
    announce(`Page ${detail.page || ""} of ${detail.pageCount || ""}. Showing items ${detail.start || ""} through ${detail.end || ""} of ${detail.total || ""}.`);
  });

  window.addEventListener("hashchange", function () {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (id) focusSection(id);
  });

  function enhance(root) {
    document.documentElement.classList.add("report-accessibility-ready");
    const main = document.getElementById("reportMain");
    if (main && !main.hasAttribute("tabindex")) main.tabIndex = -1;

    for (const section of root.querySelectorAll?.(".report-document-section[id]") || []) {
      if (!section.hasAttribute("tabindex")) section.tabIndex = -1;
      const heading = section.querySelector("h2");
      if (heading && !heading.id) heading.id = `${section.id}-heading`;
      if (heading) section.setAttribute("aria-labelledby", heading.id);
    }

    for (const shell of root.querySelectorAll?.(".report-table-shell") || []) {
      shell.tabIndex = 0;
      if (!shell.getAttribute("aria-label") && !shell.getAttribute("aria-labelledby")) {
        shell.setAttribute("aria-label", "Scrollable report table");
      }
    }

    for (const card of root.querySelectorAll?.(".report-detail-card") || []) {
      const heading = card.querySelector("h4");
      if (heading && !heading.id) heading.id = `report-card-heading-${stable(card.dataset.reportCardIndex || heading.textContent)}`;
      if (heading) card.setAttribute("aria-labelledby", heading.id);
    }

    for (const link of root.querySelectorAll?.('a[target="_blank"]') || []) {
      const label = link.getAttribute("aria-label") || link.textContent?.trim() || "Link";
      if (!/new tab/i.test(label)) link.setAttribute("aria-label", `${label} (opens in a new tab)`);
    }
  }

  function observeReportBody() {
    const body = document.getElementById("reportBody");
    if (!body || !("MutationObserver" in window)) return;
    observer?.disconnect();
    observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) enhance(node);
        }
      }
    });
    observer.observe(body, { childList: true, subtree: true });
  }

  function focusSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
    announce(`Moved to ${target.querySelector("h2")?.textContent || "report section"}.`);
  }

  function announce(message) {
    const region = document.getElementById("reportLiveStatus");
    if (!region) return;
    region.textContent = "";
    window.setTimeout(function () { region.textContent = message; }, 20);
  }

  function stable(value) {
    return String(value || "report-item").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "report-item";
  }

  function reducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  }
})();

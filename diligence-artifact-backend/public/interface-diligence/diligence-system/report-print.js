(function () {
  "use strict";

  const VERSION = "interface_report_print.v1";
  let originalTitle = document.title;
  let prepared = false;

  window.InterfaceReportPrint = Object.freeze({
    version: VERSION,
    printReport,
    prepare,
    restore
  });

  window.addEventListener("beforeprint", prepare);
  window.addEventListener("afterprint", restore);

  function printReport({ target = "Diligence Report", runId = "" } = {}) {
    prepare({ target, runId });
    window.print();
  }

  function prepare(options = {}) {
    if (prepared) return;
    const config = options && typeof options === "object" && !options.type ? options : {};
    prepared = true;
    originalTitle = document.title;
    const target = config.target || document.getElementById("reportTarget")?.textContent || "Diligence Report";
    const runId = config.runId || new URLSearchParams(window.location.search || "").get("run_id") || "";
    document.title = filenameTitle(target, runId);
    document.documentElement.classList.add("report-print-expanded");
    document.documentElement.dataset.reportPrintState = "prepared";
    for (const element of document.querySelectorAll(".is-page-hidden")) {
      element.dataset.reportPrintAriaHidden = element.getAttribute("aria-hidden") || "";
      element.setAttribute("aria-hidden", "false");
    }
    announce("Print layout prepared. The full report dataset will be included.");
  }

  function restore() {
    if (!prepared) return;
    for (const element of document.querySelectorAll("[data-report-print-aria-hidden]")) {
      const previous = element.dataset.reportPrintAriaHidden;
      if (previous) element.setAttribute("aria-hidden", previous);
      else element.removeAttribute("aria-hidden");
      delete element.dataset.reportPrintAriaHidden;
    }
    document.documentElement.classList.remove("report-print-expanded");
    delete document.documentElement.dataset.reportPrintState;
    document.title = originalTitle;
    prepared = false;
    announce("Print layout closed.");
  }

  function filenameTitle(target, runId) {
    const safeTarget = String(target || "Diligence Report").replace(/[^a-zA-Z0-9 _.-]+/g, "").trim() || "Diligence Report";
    const safeRun = String(runId || "").replace(/[^a-zA-Z0-9_-]+/g, "").trim();
    return `${safeTarget} — Diligence Report${safeRun ? ` — ${safeRun}` : ""}`;
  }

  function announce(message) {
    const region = document.getElementById("reportLiveStatus");
    if (region) region.textContent = message;
  }
})();

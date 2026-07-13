(function () {
  "use strict";
  const runId = new URLSearchParams(window.location.search || "").get("run_id") || "";
  if (!runId) return;
  const encoded = encodeURIComponent(runId);
  const qr = document.getElementById("annexureHeaderQualifiedReview");
  if (qr) qr.href = `qualified-review.html?run_id=${encoded}`;
})();

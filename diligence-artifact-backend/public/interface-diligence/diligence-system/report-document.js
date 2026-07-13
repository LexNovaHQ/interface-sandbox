(function () {
  "use strict";
  const runtime = window.InterfaceReportRuntime;
  if (!runtime) throw new Error("INTERFACE_REPORT_RUNTIME_MISSING");
  runtime.start();
})();

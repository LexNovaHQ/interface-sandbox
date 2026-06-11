export default function LiveReportViewer({ html = "" }) {
  if (!html) {
    return (
      <div className="live-empty-panel">
        The Legal Exposure Diligence Report will appear here after the live run completes.
      </div>
    );
  }

  return (
    <div className="live-report-frame-wrap">
      <iframe
        title="Legal Exposure Diligence Report"
        className="live-report-frame"
        sandbox=""
        srcDoc={html}
      />
    </div>
  );
}

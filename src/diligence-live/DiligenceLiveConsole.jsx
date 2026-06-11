import { useMemo, useState } from "react";
import DiligenceStageRail from "./DiligenceStageRail.jsx";
import HandoffPreview from "./HandoffPreview.jsx";
import LiveReportViewer from "./LiveReportViewer.jsx";
import { downloadTextFile, prettyJson, runLiveDiligence } from "./diligenceLiveClient.js";

function safeFilenamePart(value) {
  return String(value || "live-diligence")
    .replace(/^https?:\/\//i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "live-diligence";
}

function metricsFromResult(result) {
  const data = result?.stage9_report_data?.report?.report_data || {};
  const handoff = result?.stage10_handoff?.assembly_handoff || {};
  return [
    ["Run mode", result?.mode || "—"],
    ["Reviewed sources", data.evidence_reviewed?.reviewed_source_count ?? "—"],
    ["Registry rows", data.forensic_ledger_appendix?.forensic_ledger_count ?? "—"],
    ["Consolidated findings", data.exposure_findings?.consolidated_count ?? "—"],
    ["Open questions", data.evidence_gaps_clarification_points?.open_request_count ?? "—"],
    ["Handoff findings", Array.isArray(handoff.threat_findings) ? handoff.threat_findings.length : "—"]
  ];
}

export default function DiligenceLiveConsole() {
  const [targetUrl, setTargetUrl] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const canRun = useMemo(() => {
    return Boolean(targetUrl.trim() || documentText.trim()) && !running;
  }, [targetUrl, documentText, running]);

  const stageEntries = result?.stage_status || [];
  const fileBase = safeFilenamePart(targetUrl || companyName || result?.run_id);
  const metrics = metricsFromResult(result);

  async function handleRun() {
    if (!targetUrl.trim() && !documentText.trim()) {
      setError("Provide a public URL, document text, or both.");
      return;
    }

    setRunning(true);
    setError(null);
    setResult({ stage_status: [{ stage: "live_run", status: "running", at: new Date().toISOString() }] });

    try {
      const liveResult = await runLiveDiligence({ targetUrl, documentText, companyName });
      setResult(liveResult);
    } catch (err) {
      setError(err?.message || "Live diligence run failed.");
      setResult((previous) => ({
        ...(previous || {}),
        stage_status: [
          ...((previous && previous.stage_status) || []),
          { stage: "live_run", status: "failed", at: new Date().toISOString(), error: err?.message || "Live diligence run failed." }
        ],
        failure_payload: err?.payload || null
      }));
    } finally {
      setRunning(false);
    }
  }

  function downloadHtml() {
    if (!result?.html_report) return;
    downloadTextFile(`${fileBase}-legal-exposure-diligence-report.html`, result.html_report, "text/html");
  }

  function downloadStage9() {
    if (!result?.stage9_report_data) return;
    downloadTextFile(`${fileBase}-stage9-report-data.json`, prettyJson(result.stage9_report_data));
  }

  function downloadHandoff() {
    if (!result?.stage10_handoff) return;
    downloadTextFile(`${fileBase}-review-ready-remediation-handoff.json`, prettyJson(result.stage10_handoff));
  }

  return (
    <div className="live-diligence-shell">
      <section className="live-hero card-shell">
        <div>
          <p className="eyebrow">DILIGENCE ENGINE · LIVE REVIEW</p>
          <h1>Run a live Legal Exposure Diligence review.</h1>
          <p className="live-hero-copy">
            Provide a public URL, document text, or both. The engine runs fresh source review, registry evaluation,
            a Legal Exposure Diligence Report, and a Review-Ready Remediation Handoff. No cached demo artifacts.
          </p>
        </div>
        <div className="live-guardrail-box">
          <strong>Review boundary</strong>
          <span>Public or authorized user-provided material only. Do not submit confidential or privileged material unless authorized.</span>
          <span>Outputs are Review-Ready artifacts requiring qualified legal review.</span>
        </div>
      </section>

      <section className="live-input-grid">
        <div className="card-shell live-input-card">
          <label htmlFor="target-url">Target URL</label>
          <input
            id="target-url"
            type="url"
            placeholder="https://example.com"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            disabled={running}
          />
          <small>Optional if document text is supplied. URL review runs fresh public-source discovery and capture.</small>
        </div>

        <div className="card-shell live-input-card">
          <label htmlFor="company-name">Company name / matter label</label>
          <input
            id="company-name"
            type="text"
            placeholder="Optional label"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            disabled={running}
          />
          <small>Optional. Used only as a matter label or fallback target name.</small>
        </div>
      </section>

      <section className="card-shell live-doc-card">
        <label htmlFor="document-text">Document Text</label>
        <textarea
          id="document-text"
          placeholder="Paste public or authorized legal/policy/product document text here..."
          value={documentText}
          onChange={(event) => setDocumentText(event.target.value)}
          disabled={running}
        />
        <div className="live-doc-meta">
          <span>{documentText.trim().length.toLocaleString()} characters</span>
          <span>Optional if URL is supplied. If supplied, it is admitted as reviewer-supplied legal evidence.</span>
        </div>
      </section>

      <section className="live-action-row">
        <button className="primary-action" type="button" disabled={!canRun} onClick={handleRun}>
          {running ? "Running live diligence..." : "Run Live Diligence"}
        </button>
        <span className="live-action-note">At least one input is required. One active run per browser tab.</span>
      </section>

      {error && (
        <section className="live-error card-shell">
          <strong>Run failed</strong>
          <p>{error}</p>
          {result?.failure_payload && <pre>{prettyJson(result.failure_payload)}</pre>}
        </section>
      )}

      <section className="live-progress-grid">
        <div className="card-shell">
          <h2>Stage Progress</h2>
          <DiligenceStageRail entries={stageEntries} running={running} />
        </div>
        <div className="card-shell">
          <h2>Run Metrics</h2>
          <div className="metrics-grid">
            {metrics.map(([label, value]) => (
              <div key={label} className="metric-tile">
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="live-downloads card-shell">
        <h2>Artifacts</h2>
        <div className="download-row">
          <button type="button" disabled={!result?.html_report} onClick={downloadHtml}>Download HTML Report</button>
          <button type="button" disabled={!result?.stage9_report_data} onClick={downloadStage9}>Download Stage 9 JSON</button>
          <button type="button" disabled={!result?.stage10_handoff} onClick={downloadHandoff}>Download Handoff JSON</button>
        </div>
      </section>

      <section className="card-shell live-section-card">
        <h2>Legal Exposure Diligence Report</h2>
        <LiveReportViewer html={result?.html_report || ""} />
      </section>

      <section className="card-shell live-section-card">
        <h2>Review-Ready Remediation Handoff</h2>
        <HandoffPreview handoff={result?.stage10_handoff || null} />
      </section>
    </div>
  );
}

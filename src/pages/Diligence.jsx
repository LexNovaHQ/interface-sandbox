import { ArrowRight, FileText, Globe2 } from "lucide-react";
import { useState } from "react";
import JsonDebugPanel from "../components/JsonDebugPanel.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { runTextDiligence, runUrlDiligence } from "../lib/apiClient.js";
import { saveDiligenceArtifacts } from "../lib/localState.js";

const defaultUrl = "https://www.sarvam.ai";

export default function Diligence({ onNavigate }) {
  const [url, setUrl] = useState(defaultUrl);
  const [text, setText] = useState("");
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState("Ready for mock run.");

  async function runWebsite() {
    setStatus("Calling mock website diligence endpoint...");
    const payload = await runUrlDiligence(url);
    setReport(payload.data);
    saveDiligenceArtifacts(payload.data);
    setStatus(payload.message);
  }

  async function runText() {
    setStatus("Calling mock text diligence endpoint...");
    const payload = await runTextDiligence(text || "Public pasted text placeholder.");
    setReport(payload.data);
    saveDiligenceArtifacts(payload.data);
    setStatus(payload.message);
  }

  function pushToAssembly() {
    if (report) {
      saveDiligenceArtifacts(report);
    }
    onNavigate("/assembly");
  }

  return (
    <div className="page-stack">
      <PlaceholderPanel
        title="Diligence Engine"
        description="This engine will convert public source material into a structured AI product diligence report."
        input="Public website URL or pasted public text accessible without login, paywall, or bypass."
        output="Source material summary, company profile, product profile, classification, findings, and document route."
      >
        <p className="notice">
          Sarvam.ai is pre-filled only as a public AI website example. Replace it with any
          public AI product website. The sandbox will later read only public pages accessible
          without login, paywall, or bypass. For now, this page returns a mock diligence report.
        </p>
      </PlaceholderPanel>

      <section className="tool-surface">
        <div className="input-grid">
          <label>
            <span>Website URL</span>
            <input value={url} onChange={(event) => setUrl(event.target.value)} />
          </label>
          <label>
            <span>Pasted public text</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste public product, policy, or website text here."
            />
          </label>
        </div>
        <div className="button-row">
          <button className="primary-action" type="button" onClick={runWebsite}>
            <Globe2 size={17} aria-hidden="true" />
            <span>Run Website Diligence</span>
          </button>
          <button className="secondary-action" type="button" onClick={runText}>
            <FileText size={17} aria-hidden="true" />
            <span>Run Text Diligence</span>
          </button>
        </div>
        <p className="muted">{status}</p>
      </section>

      <section className="output-grid">
        {[
          "Source Material",
          "Company Profile",
          "Product Profile",
          "Classification",
          "Findings",
          "Document Route"
        ].map((title) => (
          <article className="output-panel" key={title}>
            <h3>{title}</h3>
            <p>{report ? "Mock report section ready." : "Awaiting mock diligence run."}</p>
          </article>
        ))}
      </section>

      <button className="primary-action wide-action" type="button" onClick={pushToAssembly}>
        <span>Push to Assembly</span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>

      <JsonDebugPanel title="Last mock diligence report" data={report} />
    </div>
  );
}

import { ArrowRight, FileStack } from "lucide-react";
import { useEffect, useState } from "react";
import JsonDebugPanel from "../components/JsonDebugPanel.jsx";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { runAssembly } from "../lib/apiClient.js";
import { readLastDiligenceReport, saveAssemblyOutput } from "../lib/localState.js";

const previewDisclaimer =
  "This is a Review-Ready Draft route generated for demo purposes. It is not legal advice, not a law-firm deliverable, and must be reviewed by qualified local counsel before use.";

export default function Assembly({ onNavigate }) {
  const [diligenceReport, setDiligenceReport] = useState(null);
  const [assemblyOutput, setAssemblyOutput] = useState(null);
  const [status, setStatus] = useState("Ready for mock assembly.");

  useEffect(() => {
    setDiligenceReport(readLastDiligenceReport());
  }, []);

  async function generateDraftPreview() {
    setStatus("Calling mock assembly endpoint...");
    const payload = await runAssembly({ diligence_report: diligenceReport });
    setAssemblyOutput(payload.data);
    saveAssemblyOutput(payload.data);
    setStatus(payload.message);
  }

  return (
    <div className="page-stack">
      <PlaceholderPanel
        title="Vault Assembly Engine"
        description="This engine will combine diligence context and vault answers into a review-ready draft route."
        input="Last mock diligence report from localStorage plus placeholder vault answers."
        output="Active document stack, clause routes, schedule routes, draft preview shell, and review notes."
      />

      <section className="tool-surface">
        <div className="section-title-row">
          <h2>Quick Vault</h2>
          <span>{diligenceReport ? "Diligence context loaded" : "No diligence context found"}</span>
        </div>
        <div className="vault-grid">
          <label>
            <span>Market</span>
            <select defaultValue="B2B">
              <option>B2B</option>
              <option>B2C</option>
              <option>Hybrid</option>
            </select>
          </label>
          <label>
            <span>Architecture</span>
            <select defaultValue="unknown">
              <option>unknown</option>
              <option>RAG</option>
              <option>fine_tuning</option>
              <option>stateless</option>
              <option>agentic</option>
            </select>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>Human review present</span>
          </label>
        </div>

        <details className="details-block">
          <summary>Full Vault</summary>
          <div className="output-grid">
            <article className="output-panel">
              <h3>Product Identity</h3>
              <p>Placeholder fields for legal name, product name, markets, jurisdictions, and users.</p>
            </article>
            <article className="output-panel">
              <h3>AI Architecture</h3>
              <p>Placeholder fields for model provider, retrieval, storage, agentic actions, and review.</p>
            </article>
            <article className="output-panel">
              <h3>Data and Output</h3>
              <p>Placeholder fields for personal data, uploads, prompt retention, and output reliance.</p>
            </article>
            <article className="output-panel">
              <h3>Commercial Controls</h3>
              <p>Placeholder fields for enterprise settings, SLA, indemnity, AUP, and liability posture.</p>
            </article>
          </div>
        </details>

        <button className="primary-action" type="button" onClick={generateDraftPreview}>
          <FileStack size={17} aria-hidden="true" />
          <span>Generate Draft Preview</span>
        </button>
        <p className="muted">{status}</p>
      </section>

      <section className="output-grid">
        {[
          "Product Profile",
          "Active Document Stack",
          "Clause Routes",
          "Schedule Routes",
          "Draft Preview Shell",
          "Review Notes"
        ].map((title) => (
          <article className="output-panel" key={title}>
            <h3>{title}</h3>
            <p>{assemblyOutput ? "Mock assembly section ready." : "Awaiting mock assembly run."}</p>
          </article>
        ))}
      </section>

      <section className="draft-shell">
        <h2>Draft Preview Shell</h2>
        <p>Clause source pending. This preview is a structural placeholder only.</p>
        <p>{previewDisclaimer}</p>
      </section>

      <button className="primary-action wide-action" type="button" onClick={() => onNavigate("/delivery")}>
        <span>Push to Delivery</span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>

      <JsonDebugPanel title="Last mock assembly output" data={assemblyOutput} />
    </div>
  );
}

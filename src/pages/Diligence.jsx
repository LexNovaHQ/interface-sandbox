import { ArrowRight } from "lucide-react";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";

const reportSections = [
  "Executive Memo",
  "Source Review",
  "Product Feature Map",
  "Threat Registry Summary",
  "Feature-to-Threat Matrix",
  "Document Stack Redline",
  "Registry Findings",
  "Assembly Route",
  "Technical Audit Log"
];

export default function Diligence() {
  return (
    <div className="page-stack">
      <PlaceholderPanel
        kicker="DILIGENCE"
        title="Diligence Layer"
        description="Future responsibility: website/public document input -> source collection -> feature classification -> threat registry evaluation -> law-firm-style diligence report -> Assembly handoff."
      >
        <section className="document-shell">
          <div className="section-title-row">
            <h3>Expected Future Report Sections</h3>
            <span>Runtime pending</span>
          </div>
          <div className="report-list">
            {reportSections.map((section, index) => (
              <article className="report-row" key={section}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{section}</strong>
              </article>
            ))}
          </div>
        </section>
        <button className="primary-action disabled-action" type="button" disabled>
          <span>Push to Assembly — pending implementation</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </PlaceholderPanel>
    </div>
  );
}

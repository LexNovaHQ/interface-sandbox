import { ArrowRight } from "lucide-react";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";

const expectedInputs = [
  "Assembly Handoff Payload",
  "Vault-compatible prefill suggestions",
  "Vault confirmation questions",
  "Canonical Vault payload"
];

export default function Assembly() {
  return (
    <div className="page-stack">
      <PlaceholderPanel
        kicker="ASSEMBLY"
        title="Assembly Layer"
        description="Future responsibility: Assembly Handoff Payload + Vault answers -> canonical client/product profile -> bespoke document assembly -> human review -> Delivery."
      >
        <section className="document-shell">
          <div className="section-title-row">
            <h3>Expected Future Inputs</h3>
            <span>Runtime pending</span>
          </div>
          <div className="report-list">
            {expectedInputs.map((input, index) => (
              <article className="report-row" key={input}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{input}</strong>
              </article>
            ))}
          </div>
        </section>
        <button className="primary-action disabled-action" type="button" disabled>
          <span>Push to Delivery — pending implementation</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </PlaceholderPanel>
    </div>
  );
}

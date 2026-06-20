import "./AssemblyIntakePanel.css";
import { createAssemblyIntake } from "./assemblyIntake.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function valueText(value, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function SummaryGrid({ summary }) {
  const items = [
    ["Handoff ID", summary.handoff_id],
    ["Run ID", summary.run_id],
    ["Status", summary.status],
    ["Package", summary.recommended_package],
    ["Features", summary.feature_count],
    ["Threat findings", summary.threat_finding_count],
    ["Prefill fields", summary.prefill_field_count],
    ["Questions", summary.confirmation_question_count]
  ];

  return (
    <div className="assembly-intake-grid">
      {items.map(([label, value]) => (
        <div className="assembly-intake-stat" key={label}>
          <span>{label}</span>
          <strong>{valueText(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function PrefillPreview({ vaultPrefill }) {
  const groups = ["baseline", "architecture", "archetypes", "compliance"];

  return (
    <div className="assembly-prefill-preview">
      {groups.map((group) => {
        const entries = Object.entries(vaultPrefill?.[group] || {});
        return (
          <article className="quiet-panel" key={group}>
            <span className="eyebrow">{group}</span>
            <h3>{entries.length} field(s)</h3>
            {entries.length ? (
              <div className="report-list">
                {entries.slice(0, 5).map(([field, suggestion]) => (
                  <div className="assembly-prefill-row" key={`${group}.${field}`}>
                    <strong>{field}</strong>
                    <span>{valueText(suggestion?.value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No prefill suggestions in this group.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function QuestionPreview({ questions }) {
  const rows = asArray(questions);
  if (!rows.length) return <p>No confirmation questions are pending.</p>;

  return (
    <div className="report-list">
      {rows.map((question, index) => (
        <article className="report-row report-row--detail" key={`${question.field_path || "question"}-${index}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{question.field_path}</strong>
            <p>{question.question}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="document-shell assembly-intake-empty">
      <div className="section-title-row">
        <div>
          <span>ASSEMBLY INTAKE</span>
          <h3>Waiting for Node 5B handoff</h3>
        </div>
      </div>
      <p>
        Assembly starts only after Diligence produces a validated handoff envelope and assembly handoff payload.
        Raw compiler output, registry ledgers, source bundles, and pipeline artifacts do not enter this layer.
      </p>
      <div className="report-list">
        {[
          "handoff_envelope",
          "assembly_handoff",
          "vault_prefill_suggestions",
          "vault_confirmation_questions"
        ].map((item, index) => (
          <article className="report-row" key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AssemblyIntakePanel({ handoffEnvelope, assemblyHandoff }) {
  if (!handoffEnvelope && !assemblyHandoff) return <EmptyState />;

  const intake = createAssemblyIntake({
    handoff_envelope: handoffEnvelope,
    assembly_handoff: assemblyHandoff
  });

  if (!intake.ok) {
    return (
      <section className="document-shell assembly-intake-error">
        <div className="section-title-row">
          <div>
            <span>ASSEMBLY INTAKE</span>
            <h3>Handoff rejected</h3>
          </div>
        </div>
        <div className="report-list">
          {intake.errors.map((error, index) => (
            <article className="report-row report-row--detail" key={`${error}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{error}</strong></div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="document-shell assembly-intake-panel">
      <header className="assembly-intake-header">
        <div>
          <span className="eyebrow">ASSEMBLY INTAKE</span>
          <h3>Handoff ready for Vault confirmation</h3>
          <p>
            This panel renders the clean Assembly intake only. It does not read raw Diligence internals or mutate the handoff.
          </p>
        </div>
        <SummaryGrid summary={intake.summary} />
      </header>

      <section className="assembly-intake-section">
        <div className="section-title-row">
          <h3>Vault prefill suggestions</h3>
          <span>Node 5B output</span>
        </div>
        <PrefillPreview vaultPrefill={intake.assembly_handoff.vault_prefill_suggestions} />
      </section>

      <section className="assembly-intake-section">
        <div className="section-title-row">
          <h3>Vault confirmation questions</h3>
          <span>Founder input required</span>
        </div>
        <QuestionPreview questions={intake.assembly_handoff.vault_confirmation_questions} />
      </section>

      <button className="primary-action disabled-action" type="button" disabled>
        Build canonical Vault payload — pending next build
      </button>
    </section>
  );
}

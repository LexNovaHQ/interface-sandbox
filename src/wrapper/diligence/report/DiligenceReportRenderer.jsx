function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function count(value) {
  return asArray(value).length;
}

function Section({ title, eyebrow, children }) {
  return (
    <section className="diligence-report-section">
      <div className="section-title-row">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function KeyValueGrid({ items }) {
  return (
    <div className="diligence-kv-grid">
      {items.map((item) => (
        <div className="diligence-kv" key={item.label}>
          <span>{item.label}</span>
          <strong>{text(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="document-shell diligence-report-empty">
      <div className="section-title-row">
        <div>
          <span>REPORT RENDERER</span>
          <h3>Diligence report renderer ready</h3>
        </div>
      </div>
      <p>
        Run the Diligence pipeline to render validated compiler output here. This screen does not create findings,
        mutate handoff fields, or call any AI model.
      </p>
      <div className="report-list">
        {[
          "Executive report",
          "Triggered findings",
          "Controlled rows",
          "Insufficient evidence rows",
          "Document stack verdict",
          "Technical audit log"
        ].map((section, index) => (
          <article className="report-row" key={section}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{section}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function MaterialHighlights({ highlights }) {
  const rows = asArray(highlights);
  if (!rows.length) return <p>No material highlights were emitted.</p>;

  return (
    <div className="diligence-card-grid">
      {rows.map((item, index) => (
        <article className="quiet-panel" key={item.threat_id || item.title || index}>
          <span className="eyebrow">Highlight {index + 1}</span>
          <h3>{text(item.title || item.threat_name || item.threat_id, "Material highlight")}</h3>
          <p>{text(item.summary || item.short_issue || item.issue || item.reasoning_summary)}</p>
        </article>
      ))}
    </div>
  );
}

function FindingsTable({ findings }) {
  const rows = asArray(findings);
  if (!rows.length) return <p>No triggered findings were emitted.</p>;

  return (
    <div className="diligence-table-wrap">
      <table className="diligence-table">
        <thead>
          <tr>
            <th>Threat</th>
            <th>Category</th>
            <th>Feature</th>
            <th>Route</th>
            <th>Issue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.threat_id || "finding"}-${index}`}>
              <td>
                <strong>{text(row.threat_id)}</strong>
                <span>{text(row.threat_name, "")}</span>
              </td>
              <td>{text(row.pain_category || row.pain_tier || row.archetype)}</td>
              <td>{text(row.linked_feature || asArray(row.linked_feature_ids).join(", "))}</td>
              <td>{text(row.document_route || asArray(row.document_routes).join(", "))}</td>
              <td>{text(row.short_issue || row.finding_memo_note || row.reasoning_summary)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompactRows({ rows, empty, titleKey = "threat_id" }) {
  const items = asArray(rows);
  if (!items.length) return <p>{empty}</p>;

  return (
    <div className="report-list">
      {items.map((row, index) => (
        <article className="report-row report-row--detail" key={`${row[titleKey] || "row"}-${index}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{text(row[titleKey] || row.entry_type || row.field_path, "Record")}</strong>
            <p>{text(row.reasoning_summary || row.missing_evidence || row.message || row.technical_note)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function DiligenceReportRenderer({ compilerOutput }) {
  if (!compilerOutput) return <EmptyState />;

  const executive = compilerOutput.report_data?.executive_report || {};
  const full = compilerOutput.report_data?.full_forensic_record || {};
  const triggeredSchedule = executive.triggered_findings_schedule || compilerOutput.findings || [];
  const controlledRows = full.controlled_rows || compilerOutput.controlled_rows || [];
  const insufficientRows = full.insufficient_evidence_rows || compilerOutput.insufficient_evidence_rows || [];
  const auditRows = full.technical_audit_log || compilerOutput.technical_audit_log || [];

  return (
    <article className="diligence-report document-shell">
      <header className="diligence-report-header">
        <div>
          <span className="eyebrow">DILIGENCE REPORT</span>
          <h2>{text(compilerOutput.target_profile?.company_name || compilerOutput.target_profile?.company, "Diligence output")}</h2>
          <p>{text(compilerOutput.disclaimer)}</p>
        </div>
        <KeyValueGrid
          items={[
            { label: "Run ID", value: compilerOutput.diligence_run?.run_id },
            { label: "Source mode", value: compilerOutput.diligence_run?.source_mode },
            { label: "Triggered", value: count(compilerOutput.findings) },
            { label: "Controlled", value: count(compilerOutput.controlled_rows) },
            { label: "Insufficient", value: count(compilerOutput.insufficient_evidence_rows) }
          ]}
        />
      </header>

      <Section title="Risk posture summary" eyebrow="Executive">
        <KeyValueGrid
          items={[
            { label: "Recommended package", value: compilerOutput.assembly_route?.recommended_package },
            { label: "Local counsel review", value: compilerOutput.assembly_route?.local_counsel_review_required ? "Required" : "Not marked" },
            { label: "Registry loaded", value: compilerOutput.threat_registry_summary?.registry_count_loaded },
            { label: "Registry evaluated", value: compilerOutput.threat_registry_summary?.registry_count_evaluated }
          ]}
        />
        <p>{text(executive.risk_posture_summary?.summary || compilerOutput.assembly_route?.route_reasoning)}</p>
      </Section>

      <Section title="Material highlights" eyebrow="Executive">
        <MaterialHighlights highlights={executive.material_highlights} />
      </Section>

      <Section title="Triggered findings schedule" eyebrow="Findings">
        <FindingsTable findings={triggeredSchedule} />
      </Section>

      <Section title="Document stack verdict" eyebrow="Legal stack">
        <CompactRows rows={compilerOutput.document_stack_redline || full.document_stack_redline} empty="No document stack redline was emitted." titleKey="document" />
      </Section>

      <Section title="Controlled rows" eyebrow="Registry">
        <CompactRows rows={controlledRows} empty="No controlled rows were emitted." />
      </Section>

      <Section title="Insufficient evidence rows" eyebrow="Limitations">
        <CompactRows rows={insufficientRows} empty="No insufficient evidence rows were emitted." />
      </Section>

      <Section title="Technical audit log" eyebrow="Audit">
        <CompactRows rows={auditRows} empty="No technical audit log rows were emitted." titleKey="entry_type" />
      </Section>
    </article>
  );
}

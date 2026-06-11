import { useMemo, useState } from "react";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { AssemblyIntakePanel, createAssemblyIntake } from "../wrapper/assembly/index.js";
import { buildCanonicalVaultPayload, flattenVaultSuggestions } from "../wrapper/assembly/vaultReview/canonicalVaultPayload.js";
import { createMatterId, getMatterStoreStatus, saveMatterSnapshot } from "../wrapper/os/matterStore.js";
import { clearPendingAssemblyHandoff, loadPendingAssemblyHandoff } from "../wrapper/os/assemblyHandoffStore.js";

function text(value) {
  if (value === null || value === undefined) return "";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  return JSON.stringify(value, null, 2);
}

function targetName(handoff) {
  const profile = handoff?.target_profile || {};
  return profile.company_name || profile.company || profile.target || profile.product_name || "Review target";
}

function StoreCard() {
  const status = getMatterStoreStatus();
  return (
    <article className="quiet-panel">
      <span className="eyebrow">Matter store</span>
      <h3>{status.firebase_enabled ? "Firestore ready" : "Local fallback active"}</h3>
      <p>Collection: <strong>{status.collection}</strong>{status.fallback ? ` · ${status.fallback}` : ""}</p>
    </article>
  );
}

function EmptyAssembly({ onNavigate }) {
  return (
    <section className="document-shell assembly-workbench-section">
      <div className="section-title-row">
        <div>
          <span>ASSEMBLY INPUT</span>
          <h3>Waiting for live Diligence handoff</h3>
        </div>
        {onNavigate ? <button className="primary-action" type="button" onClick={() => onNavigate("/diligence")}>Run Diligence</button> : null}
      </div>
      <p>Manual JSON paste is disabled. Run the Diligence Engine; Stage 10 / Node 5B will push into this Assembly Review automatically.</p>
    </section>
  );
}

function PendingCard({ pending, onClear }) {
  return (
    <section className="document-shell assembly-workbench-section">
      <div className="section-title-row">
        <div>
          <span>ASSEMBLY INPUT</span>
          <h3>Auto-loaded from live Diligence</h3>
        </div>
        <button className="inline-action" type="button" onClick={onClear}>Clear pending handoff</button>
      </div>
      <div className="assembly-operating-grid">
        <article className="quiet-panel"><span className="eyebrow">Matter</span><h3>{pending.matter_id}</h3><p>Run ID: <strong>{pending.run_id}</strong></p></article>
        <article className="quiet-panel"><span className="eyebrow">Pushed at</span><h3>{pending.created_at}</h3><p>Source: <strong>{pending.source}</strong></p></article>
      </div>
    </section>
  );
}

function FieldRow({ item, value, onChange }) {
  return (
    <article className="assembly-field-row">
      <div className="assembly-field-meta">
        <span className="eyebrow">{item.confidence || "review"}</span>
        <strong>{item.field_path}</strong>
        <p>{item.basis || item.question || "Reviewer confirmation required."}</p>
        {item.source_finding_ids?.length ? <small>Source findings: {item.source_finding_ids.join(", ")}</small> : null}
      </div>
      <textarea value={value} onChange={(e) => onChange(item.field_path, e.target.value)} rows={String(value || "").length > 90 ? 4 : 2} />
    </article>
  );
}

function AssemblyReview({ pending }) {
  const handoffEnvelope = pending?.handoff_envelope;
  const assemblyHandoff = pending?.assembly_handoff;
  const [fieldValues, setFieldValues] = useState({});
  const [answers, setAnswers] = useState({});
  const [payload, setPayload] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const intake = useMemo(() => createAssemblyIntake({ handoff_envelope: handoffEnvelope, assembly_handoff: assemblyHandoff }), [handoffEnvelope, assemblyHandoff]);
  const suggestions = useMemo(() => flattenVaultSuggestions(assemblyHandoff?.vault_prefill_suggestions || {}), [assemblyHandoff]);
  const questions = Array.isArray(assemblyHandoff?.vault_confirmation_questions) ? assemblyHandoff.vault_confirmation_questions : [];

  if (!intake.ok) {
    return <section className="document-shell assembly-intake-error"><h3>Handoff rejected</h3><pre>{intake.errors.join("\n")}</pre></section>;
  }

  function setField(path, value) { setFieldValues((current) => ({ ...current, [path]: value })); }
  function setAnswer(path, value) { if (path) setAnswers((current) => ({ ...current, [path]: value })); }

  function generatePayload() {
    const next = buildCanonicalVaultPayload({
      vaultPrefill: assemblyHandoff?.vault_prefill_suggestions || {},
      fieldValues,
      confirmationAnswers: answers,
      matterMeta: { run_id: handoffEnvelope?.run_id, review_target: targetName(assemblyHandoff) }
    });
    setPayload(next);
    return next;
  }

  async function saveMatter() {
    const vaultPayload = payload || generatePayload();
    const matterId = pending?.matter_id || createMatterId({ targetProfile: assemblyHandoff?.target_profile, runId: handoffEnvelope?.run_id });
    setSaving(true);
    setSaveResult(null);
    try {
      const result = await saveMatterSnapshot({
        matter_id: matterId,
        run_id: handoffEnvelope?.run_id || assemblyHandoff?.handoff_meta?.run_id || null,
        status: "VAULT_CONFIRMED",
        target_profile: assemblyHandoff?.target_profile || {},
        handoff_envelope: handoffEnvelope,
        assembly_handoff: assemblyHandoff,
        stage9_report_data: pending?.stage9_report_data || null,
        html_report: pending?.html_report || "",
        vault_payload: vaultPayload,
        document_stack: { status: "PENDING_DOCUMENT_ASSEMBLY", route: assemblyHandoff?.assembly_route_recommendation || {}, document_stack_status: assemblyHandoff?.document_stack_status || [] },
        delivery: { status: "NOT_READY" },
        maintenance: { status: "NOT_STARTED" },
        pending_handoff_id: pending?.pending_handoff_id || null
      });
      setSaveResult(result);
    } catch (error) {
      setSaveResult({ ok: false, error: error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="document-shell assembly-review-shell">
      <header className="assembly-review-header">
        <div><span className="eyebrow">ASSEMBLY REVIEW</span><h3>{targetName(assemblyHandoff)}</h3><p>Stage 10 has been pushed from live Diligence into internal Vault Review. The reviewer confirms facts before document assembly.</p></div>
        <div className="assembly-review-actions"><button className="inline-action" type="button" onClick={generatePayload}>Generate canonical payload</button><button className="primary-action" type="button" onClick={saveMatter} disabled={saving}>{saving ? "Saving…" : "Save confirmed matter"}</button></div>
      </header>
      <div className="assembly-workbench-grid">
        <section className="assembly-workbench-section"><div className="section-title-row"><h3>Prefilled Vault fields</h3><span>{suggestions.length} fields</span></div><div className="assembly-field-list">{suggestions.map((item) => <FieldRow key={item.field_path} item={item} value={Object.prototype.hasOwnProperty.call(fieldValues, item.field_path) ? fieldValues[item.field_path] : text(item.input_value)} onChange={setField} />)}</div></section>
        <section className="assembly-workbench-section"><div className="section-title-row"><h3>Reviewer confirmations</h3><span>{questions.length} questions</span></div><div className="assembly-field-list">{questions.length ? questions.map((q, i) => <FieldRow key={`${q.field_path || "question"}-${i}`} item={{ ...q, confidence: "confirmation" }} value={answers[q.field_path] || ""} onChange={setAnswer} />) : <p>No confirmation questions pending.</p>}</div></section>
      </div>
      <section className="assembly-workbench-section"><div className="section-title-row"><h3>Canonical Vault payload</h3><span>{payload ? "generated" : "pending"}</span></div><pre className="assembly-json-output">{payload ? JSON.stringify(payload, null, 2) : "Generate payload after reviewer confirmation."}</pre></section>
      {saveResult ? <section className={saveResult.ok ? "assembly-save-result" : "assembly-save-result assembly-save-result--error"}>{saveResult.ok ? `Saved ${saveResult.matter_id} to ${saveResult.mode} (${saveResult.collection}).` : `Save failed: ${saveResult.error}`}{saveResult.warning ? ` ${saveResult.warning}` : ""}</section> : null}
    </section>
  );
}

export default function AssemblyAuto({ onNavigate }) {
  const [pending, setPending] = useState(() => loadPendingAssemblyHandoff());

  function clearPending() {
    clearPendingAssemblyHandoff();
    setPending(null);
  }

  return (
    <div className="page-stack">
      <PlaceholderPanel kicker="LEGAL DILIGENCE & ASSEMBLY OS" title="Assembly Engine" description="Live Diligence pushes Stage 10 / Node 5B handoff directly into internal Vault Review and canonical Vault payload construction.">
        <div className="assembly-operating-grid"><StoreCard /><article className="quiet-panel"><span className="eyebrow">Workflow boundary</span><h3>Internal reviewer only</h3><p>No client portal, no external login, no public intake surface.</p></article></div>
      </PlaceholderPanel>
      {pending ? <PendingCard pending={pending} onClear={clearPending} /> : <EmptyAssembly onNavigate={onNavigate} />}
      {pending ? <><AssemblyIntakePanel handoffEnvelope={pending.handoff_envelope} assemblyHandoff={pending.assembly_handoff} /><AssemblyReview key={pending.pending_handoff_id || pending.run_id} pending={pending} /></> : null}
    </div>
  );
}

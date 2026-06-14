import { useMemo, useState } from "react";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { AssemblyIntakePanel, createAssemblyIntake } from "../wrapper/assembly/index.js";
import {
  buildCanonicalVaultPayload,
  flattenVaultSuggestions
} from "../wrapper/assembly/vaultReview/canonicalVaultPayload.js";
import {
  createMatterId,
  getMatterStoreStatus,
  saveMatterSnapshot
} from "../wrapper/os/matterStore.js";

function stringifyValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function readNested(source, paths) {
  for (const path of paths) {
    const value = path.split(".").reduce((cursor, key) => cursor?.[key], source);
    if (value) return value;
  }
  return null;
}

function extractStage10Objects(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const root = parsed?.review_ready_remediation_handoff
    || parsed?.stage10
    || parsed?.handoff
    || parsed?.result
    || parsed;

  return {
    handoffEnvelope: root?.handoff_envelope
      || root?.handoffEnvelope
      || readNested(parsed, ["handoff_envelope", "stage_10.handoff_envelope", "artifacts.handoff_envelope"]),
    assemblyHandoff: root?.assembly_handoff
      || root?.assemblyHandoff
      || readNested(parsed, ["assembly_handoff", "stage_10.assembly_handoff", "artifacts.assembly_handoff"]),
    source: parsed
  };
}

function targetLabel(assemblyHandoff) {
  const target = assemblyHandoff?.target_profile || {};
  return target.company_name
    || target.company
    || target.target
    || target.product_name
    || "Review target";
}

function MatterStoreStatus() {
  const status = getMatterStoreStatus();
  return (
    <article className="quiet-panel">
      <span className="eyebrow">Matter store</span>
      <h3>{status.firebase_enabled ? "Firestore ready" : "Local fallback active"}</h3>
      <p>
        Collection: <strong>{status.collection}</strong>
        {status.fallback ? ` · fallback: ${status.fallback}` : ""}
      </p>
    </article>
  );
}

function JsonInputPanel({ rawInput, setRawInput, onParse, parseError }) {
  return (
    <section className="document-shell assembly-workbench-section">
      <div className="section-title-row">
        <div>
          <span>STAGE 10 INPUT</span>
          <h3>Load Node 5B handoff</h3>
        </div>
        <button className="primary-action" type="button" onClick={onParse}>Load handoff</button>
      </div>
      <textarea
        className="assembly-json-input"
        value={rawInput}
        onChange={(event) => setRawInput(event.target.value)}
        placeholder="Paste Stage 10 JSON here. Expected fields: handoff_envelope + assembly_handoff."
      />
      {parseError ? <p className="assembly-error">{parseError}</p> : null}
    </section>
  );
}

function VaultSuggestionRow({ suggestion, value, onChange }) {
  return (
    <article className="assembly-field-row">
      <div className="assembly-field-meta">
        <span className="eyebrow">{suggestion.confidence}</span>
        <strong>{suggestion.field_path}</strong>
        <p>{suggestion.basis}</p>
        {suggestion.source_finding_ids?.length ? (
          <small>Source findings: {suggestion.source_finding_ids.join(", ")}</small>
        ) : null}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(suggestion.field_path, event.target.value)}
        rows={String(value || "").length > 90 ? 4 : 2}
      />
    </article>
  );
}

function ConfirmationQuestionRow({ question, value, onChange }) {
  return (
    <article className="assembly-field-row assembly-question-row">
      <div className="assembly-field-meta">
        <span className="eyebrow">confirmation required</span>
        <strong>{question.field_path || "Unmapped field"}</strong>
        <p>{question.question || "Reviewer confirmation required."}</p>
        {question.why_it_matters ? <small>{question.why_it_matters}</small> : null}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(question.field_path, event.target.value)}
        placeholder="Enter reviewer-confirmed value"
        rows={3}
      />
    </article>
  );
}

function VaultReviewWorkbench({ handoffEnvelope, assemblyHandoff }) {
  const [fieldValues, setFieldValues] = useState({});
  const [confirmationAnswers, setConfirmationAnswers] = useState({});
  const [canonicalPayload, setCanonicalPayload] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const intake = useMemo(() => createAssemblyIntake({
    handoff_envelope: handoffEnvelope,
    assembly_handoff: assemblyHandoff
  }), [handoffEnvelope, assemblyHandoff]);

  const suggestions = useMemo(
    () => flattenVaultSuggestions(assemblyHandoff?.vault_prefill_suggestions || {}),
    [assemblyHandoff]
  );

  const questions = Array.isArray(assemblyHandoff?.vault_confirmation_questions)
    ? assemblyHandoff.vault_confirmation_questions
    : [];

  if (!intake.ok) {
    return (
      <section className="document-shell assembly-intake-error">
        <div className="section-title-row">
          <div>
            <span>ASSEMBLY REVIEW</span>
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

  function updateField(path, value) {
    setFieldValues((current) => ({ ...current, [path]: value }));
  }

  function updateAnswer(path, value) {
    if (!path) return;
    setConfirmationAnswers((current) => ({ ...current, [path]: value }));
  }

  function generatePayload() {
    const payload = buildCanonicalVaultPayload({
      vaultPrefill: assemblyHandoff?.vault_prefill_suggestions || {},
      fieldValues,
      confirmationAnswers,
      matterMeta: {
        run_id: handoffEnvelope?.run_id,
        review_target: targetLabel(assemblyHandoff)
      }
    });
    setCanonicalPayload(payload);
    return payload;
  }

  async function saveMatter() {
    const payload = canonicalPayload || generatePayload();
    const matterId = createMatterId({
      targetProfile: assemblyHandoff?.target_profile,
      runId: handoffEnvelope?.run_id
    });

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
        vault_payload: payload,
        legal_documents: {
          status: "PENDING_DOCUMENT_ASSEMBLY",
          route: assemblyHandoff?.assembly_route_recommendation || {},
          legal_document_status: assemblyHandoff?.legal_document_status || assemblyHandoff?.document_stack_status || []
        },
        delivery: {
          status: "NOT_READY"
        },
        maintenance: {
          status: "NOT_STARTED"
        }
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
        <div>
          <span className="eyebrow">ASSEMBLY REVIEW</span>
          <h3>{targetLabel(assemblyHandoff)}</h3>
          <p>
            Stage 10 / Node 5B prefill is converted into an editable internal Vault Review. The reviewer confirms facts before a canonical Vault payload is created.
          </p>
        </div>
        <div className="assembly-review-actions">
          <button className="inline-action" type="button" onClick={generatePayload}>Generate canonical payload</button>
          <button className="primary-action" type="button" onClick={saveMatter} disabled={saving}>
            {saving ? "Saving…" : "Save matter snapshot"}
          </button>
        </div>
      </header>

      <div className="assembly-workbench-grid">
        <section className="assembly-workbench-section">
          <div className="section-title-row">
            <h3>Prefilled Vault fields</h3>
            <span>{suggestions.length} fields</span>
          </div>
          {suggestions.length ? (
            <div className="assembly-field-list">
              {suggestions.map((suggestion) => (
                <VaultSuggestionRow
                  key={suggestion.field_path}
                  suggestion={suggestion}
                  value={Object.prototype.hasOwnProperty.call(fieldValues, suggestion.field_path)
                    ? fieldValues[suggestion.field_path]
                    : suggestion.input_value}
                  onChange={updateField}
                />
              ))}
            </div>
          ) : (
            <p>No Stage 10 prefill suggestions were supplied.</p>
          )}
        </section>

        <section className="assembly-workbench-section">
          <div className="section-title-row">
            <h3>Reviewer confirmations</h3>
            <span>{questions.length} questions</span>
          </div>
          {questions.length ? (
            <div className="assembly-field-list">
              {questions.map((question, index) => (
                <ConfirmationQuestionRow
                  key={`${question.field_path || "question"}-${index}`}
                  question={question}
                  value={confirmationAnswers[question.field_path] || ""}
                  onChange={updateAnswer}
                />
              ))}
            </div>
          ) : (
            <p>No confirmation questions are pending.</p>
          )}
        </section>
      </div>

      <section className="assembly-workbench-section">
        <div className="section-title-row">
          <h3>Canonical Vault payload</h3>
          <span>{canonicalPayload ? "generated" : "pending"}</span>
        </div>
        <pre className="assembly-json-output">
          {canonicalPayload ? JSON.stringify(canonicalPayload, null, 2) : "Generate payload after reviewing the fields above."}
        </pre>
      </section>

      {saveResult ? (
        <section className={saveResult.ok ? "assembly-save-result" : "assembly-save-result assembly-save-result--error"}>
          {saveResult.ok
            ? `Saved ${saveResult.matter_id} to ${saveResult.mode} (${saveResult.collection}).`
            : `Save failed: ${saveResult.error}`}
          {saveResult.warning ? ` ${saveResult.warning}` : ""}
        </section>
      ) : null}
    </section>
  );
}

export default function Assembly() {
  const [rawInput, setRawInput] = useState("");
  const [parseError, setParseError] = useState("");
  const [stage10, setStage10] = useState(null);

  function loadHandoff() {
    setParseError("");
    try {
      const next = extractStage10Objects(rawInput);
      if (!next.handoffEnvelope || !next.assemblyHandoff) {
        throw new Error("Stage 10 input must include handoff_envelope and assembly_handoff.");
      }
      setStage10(next);
    } catch (error) {
      setStage10(null);
      setParseError(error.message);
    }
  }

  return (
    <div className="page-stack">
      <PlaceholderPanel
        kicker="LEGAL DILIGENCE & ASSEMBLY OS"
        title="Assembly Engine"
        description="Stage 10 / Node 5B handoff enters internal Vault Review, reviewer confirmation, canonical Vault payload construction, and matter-state storage."
      >
        <div className="assembly-operating-grid">
          <MatterStoreStatus />
          <article className="quiet-panel">
            <span className="eyebrow">Workflow boundary</span>
            <h3>Internal reviewer only</h3>
            <p>No client portal, no external login, no public intake surface. This page is the operating-system bridge from Diligence to Assembly.</p>
          </article>
        </div>
      </PlaceholderPanel>

      <JsonInputPanel
        rawInput={rawInput}
        setRawInput={setRawInput}
        onParse={loadHandoff}
        parseError={parseError}
      />

      {stage10 ? (
        <>
          <AssemblyIntakePanel
            handoffEnvelope={stage10.handoffEnvelope}
            assemblyHandoff={stage10.assemblyHandoff}
          />
          <VaultReviewWorkbench
            handoffEnvelope={stage10.handoffEnvelope}
            assemblyHandoff={stage10.assemblyHandoff}
          />
        </>
      ) : null}
    </div>
  );
}

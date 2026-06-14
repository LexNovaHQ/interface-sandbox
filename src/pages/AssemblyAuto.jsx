import { useMemo, useState } from "react";
import PlaceholderPanel from "../components/PlaceholderPanel.jsx";
import { createAssemblyIntake } from "../wrapper/assembly/index.js";
import { buildCanonicalVaultPayload, flattenVaultSuggestions, VAULT_GROUPS } from "../wrapper/assembly/vaultReview/canonicalVaultPayload.js";
import { createMatterId, getMatterStoreStatus, saveMatterSnapshot } from "../wrapper/os/matterStore.js";
import { clearPendingAssemblyHandoff, loadPendingAssemblyHandoff } from "../wrapper/os/assemblyHandoffStore.js";

const VAULT_FIELD_GROUPS = [
  {
    key: "baseline",
    title: "Module 1 — Baseline & Commercials",
    sub: "Legal identity, product definition, market exposure, commercial posture, and reliance boundaries.",
    fields: [
      { path: "baseline.company", label: "Company Legal Name", type: "text", required: true },
      { path: "baseline.entity_type", label: "Entity Type", type: "select", options: ["", "LLC", "C-Corp", "B-Corp", "Ltd", "GmbH", "SAS", "Sole Proprietor", "Other"] },
      { path: "baseline.address", label: "Principal Place of Business", type: "textarea" },
      { path: "baseline.legal_email", label: "Designated Legal Notice Email", type: "email" },
      { path: "baseline.privacy_email", label: "Privacy / Data Protection Contact Email", type: "email" },
      { path: "baseline.products", label: "Products Covered", type: "textarea", help: "JSON array or plain list. This mirrors the portal Vault product inventory." },
      { path: "baseline.jurisdiction.country", label: "Jurisdiction Country", type: "text" },
      { path: "baseline.jurisdiction.state", label: "Jurisdiction State / Province", type: "text" },
      { path: "baseline.market", label: "Market Exposure", type: "select", options: ["", "b2b", "b2c", "hybrid"] },
      { path: "baseline.delivery.app", label: "Delivery via App / GUI", type: "checkbox" },
      { path: "baseline.delivery.api", label: "Delivery via API", type: "checkbox" },
      { path: "baseline.revenue_model", label: "Primary Revenue Model", type: "text" },
      { path: "baseline.acv", label: "Approximate ACV", type: "number" },
      { path: "baseline.has_beta", label: "Beta / Free Tier Present", type: "checkbox" },
      { path: "baseline.output_ownership", label: "Output Ownership Position", type: "select", options: ["", "full", "limited", "none"] },
      { path: "baseline.sla_type", label: "SLA Posture", type: "select", options: ["", "no", "standard", "custom"] },
      { path: "baseline.integrations.slack", label: "Slack Integration", type: "checkbox" },
      { path: "baseline.integrations.crm", label: "CRM Integration", type: "checkbox" },
      { path: "baseline.integrations.stripe", label: "Stripe / Payments Integration", type: "checkbox" },
      { path: "baseline.integrations.github", label: "GitHub Integration", type: "checkbox" },
      { path: "baseline.integrations.webhooks", label: "Webhook Integration", type: "checkbox" },
      { path: "baseline.integrations.none", label: "No External Integrations", type: "checkbox" },
      { path: "baseline.reliance_threshold", label: "High-Stakes Reliance Threshold", type: "number" }
    ]
  },
  {
    key: "architecture",
    title: "Module 2 — Tech Stack & AI Memory",
    sub: "Model infrastructure, AI memory posture, and sub-processor exposure.",
    fields: [
      { path: "architecture.memory", label: "AI Memory Architecture", type: "select", options: ["", "rag", "stateless", "finetuning"] },
      { path: "architecture.models", label: "Upstream Model Infrastructure", type: "select", options: ["", "thirdparty", "selfhosted", "hybrid"] },
      { path: "architecture.sub_processors.openai", label: "Sub-processor: OpenAI", type: "checkbox" },
      { path: "architecture.sub_processors.anthropic", label: "Sub-processor: Anthropic", type: "checkbox" },
      { path: "architecture.sub_processors.google", label: "Sub-processor: Google / Gemini / Vertex", type: "checkbox" },
      { path: "architecture.sub_processors.cohere", label: "Sub-processor: Cohere", type: "checkbox" },
      { path: "architecture.sub_processors.mistral", label: "Sub-processor: Mistral", type: "checkbox" },
      { path: "architecture.sub_processors.other", label: "Other AI Provider", type: "text" },
      { path: "architecture.sub_processors.url", label: "Published Sub-processor URL", type: "url" },
      { path: "architecture.cloud_host", label: "Cloud Hosting Provider", type: "text" },
      { path: "architecture.vector_db", label: "Vector Database Provider", type: "text" }
    ]
  },
  {
    key: "archetypes",
    title: "Module 3 — AI Archetypes",
    sub: "Product behavior flags that route to legal issue families and legal document controls.",
    fields: [
      { path: "archetypes.is_doer", label: "The Doer — takes autonomous action", type: "checkbox" },
      { path: "archetypes.is_orchestrator", label: "The Orchestrator — manages agents", type: "checkbox" },
      { path: "archetypes.agent_limits.session_cap", label: "Agent Session Cap", type: "text" },
      { path: "archetypes.agent_limits.period_cap", label: "Agent Period Cap", type: "text" },
      { path: "archetypes.agent_limits.retry_limit", label: "Agent Retry Limit", type: "text" },
      { path: "archetypes.agent_limits.loop_threshold", label: "Agent Loop Threshold", type: "text" },
      { path: "archetypes.is_creator", label: "The Creator — generates content/media/code", type: "checkbox" },
      { path: "archetypes.is_reader", label: "The Reader — reads/uploads/scrapes material", type: "checkbox" },
      { path: "archetypes.conversational_ui", label: "Conversational / Companion Interface", type: "checkbox" },
      { path: "archetypes.sens_bio", label: "Biometric / voice / face signals", type: "checkbox" },
      { path: "archetypes.is_judge", label: "The Judge — high-stakes assessment", type: "checkbox" },
      { path: "archetypes.is_judge_hr", label: "Judge flag — HR / employment", type: "checkbox" },
      { path: "archetypes.is_judge_legal", label: "Judge flag — legal/professional reliance", type: "checkbox" },
      { path: "archetypes.is_optimizer", label: "The Optimizer — financial / sensitive optimization", type: "checkbox" },
      { path: "archetypes.sens_fin", label: "Sensitive financial surface", type: "checkbox" },
      { path: "archetypes.is_shield", label: "The Shield — security / cyber defense", type: "checkbox" },
      { path: "archetypes.is_mover", label: "The Mover — physical/hardware effects", type: "checkbox" },
      { path: "archetypes.is_generalist", label: "Generalist AI surface", type: "checkbox" }
    ]
  },
  {
    key: "compliance",
    title: "Module 4 — Compliance Exposure",
    sub: "Privacy, geography, sensitive data, minors, and vulnerable-user surfaces.",
    fields: [
      { path: "compliance.processes_pii", label: "Processes personal information", type: "checkbox" },
      { path: "compliance.eu_users", label: "EU / UK users", type: "checkbox" },
      { path: "compliance.ca_users", label: "California users", type: "checkbox" },
      { path: "compliance.other_regions", label: "Other regulated regions", type: "checkbox" },
      { path: "compliance.sens_health", label: "Health / biometric sensitive data", type: "checkbox" },
      { path: "compliance.sens_fin", label: "Financial sensitive data", type: "checkbox" },
      { path: "compliance.sens_employment", label: "Employment / HR sensitive data", type: "checkbox" },
      { path: "compliance.minors", label: "Minors / children may use product", type: "checkbox" },
      { path: "compliance.distress", label: "Vulnerable / distressed users", type: "checkbox" },
      { path: "compliance.standard_adults", label: "Standard adult users only", type: "checkbox" }
    ]
  }
];

const FIELD_INDEX = new Map(VAULT_FIELD_GROUPS.flatMap((group) => group.fields.map((field) => [field.path, { ...field, group: group.key }])));

function text(value) {
  if (value === null || value === undefined) return "";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  return JSON.stringify(value, null, 2);
}

function booleanValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function targetName(handoff) {
  const profile = handoff?.target_profile || {};
  return profile.company_name || profile.company || profile.target || profile.product_name || "Review target";
}

function questionKey(question, index) {
  return question.field_path || question.question_id || question.id || `supplementary_${index}`;
}

function groupQuestions(questions = []) {
  const byField = new Map();
  const supplementaryByGroup = new Map();

  questions.forEach((question, index) => {
    const fieldPath = question.field_path;
    if (fieldPath && FIELD_INDEX.has(fieldPath)) {
      const rows = byField.get(fieldPath) || [];
      rows.push({ ...question, _question_key: questionKey(question, index) });
      byField.set(fieldPath, rows);
      return;
    }

    const group = VAULT_GROUPS.find((item) => fieldPath === item || String(fieldPath || "").startsWith(`${item}.`)) || "supplementary";
    const rows = supplementaryByGroup.get(group) || [];
    rows.push({ ...question, _question_key: questionKey(question, index) });
    supplementaryByGroup.set(group, rows);
  });

  return { byField, supplementaryByGroup };
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

function buildInitialVaultValues(assemblyHandoff) {
  const values = {};
  const suggestions = flattenVaultSuggestions(assemblyHandoff?.vault_prefill_suggestions || {});
  const suggestionByPath = new Map(suggestions.map((item) => [item.field_path, item]));

  VAULT_FIELD_GROUPS.forEach((group) => {
    group.fields.forEach((field) => {
      const suggestion = suggestionByPath.get(field.path);
      if (suggestion) {
        values[field.path] = field.type === "checkbox" ? booleanValue(suggestion.value) : text(suggestion.value);
      } else {
        values[field.path] = field.type === "checkbox" ? false : "";
      }
    });
  });

  return values;
}

function fieldSuggestionMap(assemblyHandoff) {
  const suggestions = flattenVaultSuggestions(assemblyHandoff?.vault_prefill_suggestions || {});
  return new Map(suggestions.map((item) => [item.field_path, item]));
}

function VaultInput({ field, value, onChange }) {
  if (field.type === "checkbox") {
    return (
      <label className="vault-review-checkbox">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(field.path, event.target.checked)} />
        <span>{Boolean(value) ? "Yes" : "No"}</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select className="vault-review-input" value={value || ""} onChange={(event) => onChange(field.path, event.target.value)}>
        {(field.options || []).map((option) => <option key={option || "blank"} value={option}>{option || "Select…"}</option>)}
      </select>
    );
  }

  if (field.type === "textarea") {
    return <textarea className="vault-review-input" value={value || ""} onChange={(event) => onChange(field.path, event.target.value)} rows={4} />;
  }

  return <input className="vault-review-input" type={field.type || "text"} value={value || ""} onChange={(event) => onChange(field.path, event.target.value)} />;
}

function IntegratedQuestions({ questions }) {
  if (!questions?.length) return null;
  return (
    <div className="vault-integrated-questions">
      {questions.map((question) => (
        <div className="vault-integrated-question" key={question._question_key}>
          <strong>{question.question || "Reviewer confirmation required."}</strong>
          {question.why_it_matters ? <p>{question.why_it_matters}</p> : null}
          {question.source_context ? <small>{question.source_context}</small> : null}
        </div>
      ))}
    </div>
  );
}

function SupplementaryQuestion({ question, value, onChange }) {
  return (
    <article className="vault-supplementary-question">
      <div>
        <span className="eyebrow">supplementary</span>
        <strong>{question.field_path || "Unmapped diligence question"}</strong>
        <p>{question.question}</p>
        {question.why_it_matters ? <small>{question.why_it_matters}</small> : null}
      </div>
      <textarea className="vault-review-input" rows={3} value={value || ""} onChange={(event) => onChange(question._question_key, event.target.value)} />
    </article>
  );
}

function VaultFieldRow({ field, suggestion, questions, value, onChange }) {
  return (
    <article className="vault-review-field-row">
      <div className="vault-review-field-meta">
        <span className="eyebrow">{suggestion?.confidence || (questions?.length ? "confirmation" : "manual")}</span>
        <strong>{field.label}</strong>
        <small>{field.path}</small>
        {field.help ? <p>{field.help}</p> : null}
        {suggestion?.basis ? <p>{suggestion.basis}</p> : <p>No public-footprint prefill. Reviewer must confirm.</p>}
        {suggestion?.source_finding_ids?.length ? <small>Source findings: {suggestion.source_finding_ids.join(", ")}</small> : null}
        <IntegratedQuestions questions={questions} />
      </div>
      <VaultInput field={field} value={value} onChange={onChange} />
    </article>
  );
}

function VaultGroup({ group, values, suggestions, questionsByField, supplementaryQuestions, supplementaryValues, onFieldChange, onSupplementaryChange }) {
  return (
    <section className="vault-review-module">
      <div className="section-title-row">
        <div>
          <span>{group.key.toUpperCase()}</span>
          <h3>{group.title}</h3>
          <p>{group.sub}</p>
        </div>
        <span>{group.fields.length} Vault fields</span>
      </div>
      <div className="vault-review-field-list">
        {group.fields.map((field) => (
          <VaultFieldRow
            key={field.path}
            field={field}
            suggestion={suggestions.get(field.path)}
            questions={questionsByField.get(field.path) || []}
            value={values[field.path]}
            onChange={onFieldChange}
          />
        ))}
      </div>
      {supplementaryQuestions?.length ? (
        <div className="vault-supplementary-block">
          <div className="section-title-row">
            <h3>Supplementary diligence questions</h3>
            <span>{supplementaryQuestions.length} unresolved</span>
          </div>
          <div className="assembly-field-list">
            {supplementaryQuestions.map((question) => (
              <SupplementaryQuestion key={question._question_key} question={question} value={supplementaryValues[question._question_key]} onChange={onSupplementaryChange} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AssemblyReview({ pending }) {
  const handoffEnvelope = pending?.handoff_envelope;
  const assemblyHandoff = pending?.assembly_handoff;
  const [fieldValues, setFieldValues] = useState(() => buildInitialVaultValues(assemblyHandoff));
  const [supplementaryAnswers, setSupplementaryAnswers] = useState({});
  const [payload, setPayload] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const intake = useMemo(() => createAssemblyIntake({ handoff_envelope: handoffEnvelope, assembly_handoff: assemblyHandoff }), [handoffEnvelope, assemblyHandoff]);
  const suggestions = useMemo(() => fieldSuggestionMap(assemblyHandoff), [assemblyHandoff]);
  const questions = Array.isArray(assemblyHandoff?.vault_confirmation_questions) ? assemblyHandoff.vault_confirmation_questions : [];
  const { byField: questionsByField, supplementaryByGroup } = useMemo(() => groupQuestions(questions), [questions]);

  if (!intake.ok) {
    return <section className="document-shell assembly-intake-error"><h3>Handoff rejected</h3><pre>{intake.errors.join("\n")}</pre></section>;
  }

  function setField(path, value) {
    setFieldValues((current) => ({ ...current, [path]: value }));
    setPayload(null);
  }

  function setSupplementary(key, value) {
    setSupplementaryAnswers((current) => ({ ...current, [key]: value }));
  }

  function generatePayload() {
    const next = buildCanonicalVaultPayload({
      vaultPrefill: assemblyHandoff?.vault_prefill_suggestions || {},
      fieldValues,
      confirmationAnswers: {}
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
        reviewer_supplementary_answers: supplementaryAnswers,
        legal_documents: { status: "PENDING_DOCUMENT_ASSEMBLY", route: assemblyHandoff?.assembly_route_recommendation || {}, legal_document_status: assemblyHandoff?.legal_document_status || assemblyHandoff?.document_stack_status || [] },
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

  const globalSupplementary = supplementaryByGroup.get("supplementary") || [];

  return (
    <section className="document-shell assembly-review-shell">
      <header className="assembly-review-header">
        <div>
          <span className="eyebrow">VAULT REVIEW</span>
          <h3>{targetName(assemblyHandoff)}</h3>
          <p>Editable internal Vault. Stage 10 prefill is treated as a draft only; the reviewer confirms, corrects, or completes every Vault field before document assembly.</p>
        </div>
        <div className="assembly-review-actions">
          <button className="inline-action" type="button" onClick={generatePayload}>Generate canonical payload</button>
          <button className="primary-action" type="button" onClick={saveMatter} disabled={saving}>{saving ? "Saving…" : "Save confirmed matter"}</button>
        </div>
      </header>

      <div className="vault-review-modules">
        {VAULT_FIELD_GROUPS.map((group) => (
          <VaultGroup
            key={group.key}
            group={group}
            values={fieldValues}
            suggestions={suggestions}
            questionsByField={questionsByField}
            supplementaryQuestions={supplementaryByGroup.get(group.key) || []}
            supplementaryValues={supplementaryAnswers}
            onFieldChange={setField}
            onSupplementaryChange={setSupplementary}
          />
        ))}
      </div>

      {globalSupplementary.length ? (
        <section className="vault-review-module">
          <div className="section-title-row">
            <div>
              <span>SUPPLEMENTARY</span>
              <h3>Supplementary diligence questions</h3>
              <p>These questions did not map cleanly to an existing Vault field, so they are kept in the matter record beside the Vault payload.</p>
            </div>
            <span>{globalSupplementary.length} questions</span>
          </div>
          <div className="assembly-field-list">
            {globalSupplementary.map((question) => (
              <SupplementaryQuestion key={question._question_key} question={question} value={supplementaryAnswers[question._question_key]} onChange={setSupplementary} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="assembly-workbench-section">
        <div className="section-title-row"><h3>Canonical Vault payload</h3><span>{payload ? "generated" : "pending"}</span></div>
        <pre className="assembly-json-output">{payload ? JSON.stringify(payload, null, 2) : "Generate payload after reviewer confirmation."}</pre>
      </section>
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
      {pending ? <AssemblyReview key={pending.pending_handoff_id || pending.run_id} pending={pending} /> : null}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  getFirestoreBridgeStatus,
  getFirestoreCollectionNames
} from "../bridge/firebaseBridge.js";
import { getFirebaseConfigStatus } from "../config/firebaseConfig.js";
import {
  AI_KEY_EXPOSURE_STATUS,
  AI_PROVIDERS,
  APP_MODE,
  CAPABILITY_LABELS,
  OPERATIONAL_UNITS,
  WRAPPER_NAME,
  RUNTIME_VERSION
} from "../config/runtimeConfig.js";
import { getRuntimeArtifactStatuses } from "../runtime/artifactStatus.js";
import {
  ENGINE_IDS,
  HANDOFF_STATUSES,
  PAYLOAD_TYPES
} from "../contracts/handoffEnvelope.js";

const SERVER_STATUS_INITIAL = {
  reachable: false,
  pending: true,
  message: "Checking server status"
};

const SMOKE_TEST_INITIAL = {
  pending: false,
  message: "Not run"
};

function formatBoolean(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unavailable";
}

export default function SystemStatusPanel() {
  const [serverStatus, setServerStatus] = useState(SERVER_STATUS_INITIAL);
  const [smokeTestStatus, setSmokeTestStatus] = useState(SMOKE_TEST_INITIAL);
  const firebaseStatus = getFirebaseConfigStatus();
  const firestoreStatus = getFirestoreBridgeStatus();
  const artifactStatuses = getRuntimeArtifactStatuses();
  const collectionNames = getFirestoreCollectionNames();

  useEffect(() => {
    const controller = new AbortController();

    async function loadServerStatus() {
      try {
        const response = await fetch("/api/system-status", {
          headers: { accept: "application/json" },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("unavailable");
        }

        const data = await response.json();
        setServerStatus({
          reachable: true,
          pending: false,
          message: "Reachable",
          data
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setServerStatus({
          reachable: false,
          pending: false,
          message: "Server status unavailable in local dev"
        });
      }
    }

    loadServerStatus();

    return () => controller.abort();
  }, []);

  async function runGeminiSmokeTest() {
    setSmokeTestStatus({
      pending: true,
      message: "Testing"
    });

    try {
      const response = await fetch("/api/ai-smoke-test", {
        method: "POST",
        headers: { accept: "application/json" }
      });
      const data = await response.json();

      setSmokeTestStatus({
        pending: false,
        message: data.test_passed ? "Passed" : data.error || "Failed",
        data
      });
    } catch (error) {
      setSmokeTestStatus({
        pending: false,
        message: "Unavailable in local dev"
      });
    }
  }

  const serverAiStatus = serverStatus.data?.ai;
  const serverCapabilities = serverStatus.data?.capabilities;
  const serverEnvironment = serverStatus.data?.environment;
  const serverFirebase = serverStatus.data?.firebase;

  const systemStatus = [
    { label: "Wrapper status", value: `${WRAPPER_NAME} / ${OPERATIONAL_UNITS.length} units` },
    { label: "Firebase config", value: firebaseStatus.configured ? "Configured" : "Missing config" },
    {
      label: "Firebase status",
      value: serverFirebase
        ? formatBoolean(serverFirebase.configured)
        : firebaseStatus.configured
          ? "configured"
          : "missing config"
    },
    { label: "Firebase project ID", value: firebaseStatus.projectId },
    { label: "Firebase app", value: firestoreStatus.firebase_app },
    { label: "Firestore bridge", value: firestoreStatus.firestore_db },
    { label: "Firestore collections", value: `${collectionNames.length} expected` },
    {
      label: "Handoff contract",
      value: `${ENGINE_IDS.length} engines / ${HANDOFF_STATUSES.length} statuses / ${PAYLOAD_TYPES.length} payloads`
    },
    { label: "App mode", value: APP_MODE },
    { label: "Runtime version", value: RUNTIME_VERSION },
    { label: "Server status", value: serverStatus.pending ? "Checking" : serverStatus.message },
    {
      label: "AI primary provider",
      value: serverAiStatus?.primary_provider || AI_PROVIDERS.primary
    },
    {
      label: "Gemini configured",
      value: formatBoolean(serverAiStatus?.gemini_configured)
    },
    {
      label: "Primary model",
      value: serverAiStatus?.primary_model || AI_PROVIDERS.primaryModelLabel
    },
    {
      label: "Fast/support model",
      value: serverAiStatus?.fast_model || AI_PROVIDERS.fastModelLabel
    },
    {
      label: "Fallback provider",
      value: serverAiStatus?.fallback_provider || AI_PROVIDERS.fallback
    },
    {
      label: "Groq fallback configured",
      value: formatBoolean(serverAiStatus?.groq_configured)
    },
    {
      label: CAPABILITY_LABELS.searchDiscovery,
      value: formatBoolean(serverCapabilities?.search_discovery)
    },
    {
      label: CAPABILITY_LABELS.geminiUrlContext,
      value: formatBoolean(serverCapabilities?.gemini_url_context)
    },
    {
      label: "Source mode",
      value:
        serverCapabilities?.diligence_source_mode ||
        CAPABILITY_LABELS.knownPathSourceCollection
    },
    {
      label: "Sandbox public mode",
      value: formatBoolean(serverEnvironment?.sandbox_public_mode)
    },
    {
      label: "Client confidential inputs",
      value: formatBoolean(serverEnvironment?.client_confidential_inputs_allowed)
    },
    { label: "Key exposure", value: serverAiStatus?.key_exposure || AI_KEY_EXPOSURE_STATUS },
    { label: "Gemini smoke test", value: smokeTestStatus.message }
  ];

  return (
    <details className="technical-drawer">
      <summary>Wrapper Status</summary>
      <div className="technical-grid technical-grid--status">
        {systemStatus.map((item) => (
          <div className="status-line" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <section className="artifact-status-section" aria-label="Runtime artifact status">
        <h3>Runtime Artifacts</h3>
        <div className="artifact-status-list">
          {artifactStatuses.map((artifact) => (
            <article className="artifact-status-item" key={artifact.id}>
              <div className="status-line">
                <span>{artifact.label}</span>
                <strong>{artifact.statusLabel}</strong>
              </div>
              {artifact.metadata.length > 0 ? (
                <div className="artifact-metadata">
                  {artifact.metadata.map((item) => (
                    <div className="status-line status-line--metadata" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{String(item.value)}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      <section className="artifact-status-section" aria-label="Gemini smoke test">
        <h3>AI Provider Check</h3>
        <button
          className="inline-action status-action"
          type="button"
          onClick={runGeminiSmokeTest}
          disabled={smokeTestStatus.pending}
        >
          Test Gemini
        </button>
        {smokeTestStatus.data ? (
          <p className="drawer-note">
            {smokeTestStatus.data.provider} / {smokeTestStatus.data.model}:{" "}
            {smokeTestStatus.data.test_passed ? "GEMINI_OK" : smokeTestStatus.message}
          </p>
        ) : null}
      </section>
      {!firebaseStatus.configured ? (
        <p className="drawer-note">
          Missing Firebase variables: {firebaseStatus.missingVariables.join(", ")}
        </p>
      ) : null}
      {serverStatus.data?.warnings?.length ? (
        <p className="drawer-note">Warnings: {serverStatus.data.warnings.join("; ")}</p>
      ) : null}
      {firestoreStatus.error_message ? (
        <p className="drawer-note">{firestoreStatus.error_message}</p>
      ) : null}
      {!serverStatus.reachable && !serverStatus.pending ? (
        <p className="drawer-note">Server status unavailable in local dev or outside Cloudflare Pages.</p>
      ) : null}
    </details>
  );
}

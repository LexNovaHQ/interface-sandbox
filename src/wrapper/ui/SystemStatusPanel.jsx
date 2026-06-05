import { useEffect, useState } from "react";
import {
  getFirestoreBridgeStatus,
  getFirestoreCollectionNames
} from "../bridge/firebaseBridge.js";
import { getFirebaseConfigStatus } from "../config/firebaseConfig.js";
import {
  APP_MODE,
  GROQ_API_EXPOSURE_STATUS,
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

export default function SystemStatusPanel() {
  const [serverStatus, setServerStatus] = useState(SERVER_STATUS_INITIAL);
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

  const groqStatus = serverStatus.data?.groq;

  const systemStatus = [
    { label: "Firebase config", value: firebaseStatus.configured ? "Configured" : "Missing config" },
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
      label: "Groq configured",
      value: groqStatus ? String(Boolean(groqStatus.configured)) : "unavailable"
    },
    { label: "Primary model", value: groqStatus?.primary_model || "server unavailable" },
    { label: "Fallback model", value: groqStatus?.fallback_model || "server unavailable" },
    { label: "Groq API key", value: groqStatus?.key_exposure || GROQ_API_EXPOSURE_STATUS }
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
      {!firebaseStatus.configured ? (
        <p className="drawer-note">
          Missing Firebase variables: {firebaseStatus.missingVariables.join(", ")}
        </p>
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

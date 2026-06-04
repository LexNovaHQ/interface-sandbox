import { getFirestoreBridgeStatus } from "../bridge/firebaseBridge.js";
import { getFirebaseConfigStatus } from "../config/firebaseConfig.js";
import {
  APP_MODE,
  GROQ_API_EXPOSURE_STATUS,
  GROQ_FALLBACK_MODEL,
  GROQ_PRIMARY_MODEL,
  RUNTIME_VERSION
} from "../config/runtimeConfig.js";
import { getRuntimeArtifactStatuses } from "../runtime/artifactStatus.js";

export default function SystemStatusPanel() {
  const firebaseStatus = getFirebaseConfigStatus();
  const firestoreStatus = getFirestoreBridgeStatus();
  const artifactStatuses = getRuntimeArtifactStatuses();

  const systemStatus = [
    { label: "Firebase config", value: firebaseStatus.label },
    { label: "Firestore bridge", value: firestoreStatus.label },
    { label: "Handoff contract", value: "Loaded" },
    { label: "App mode", value: APP_MODE },
    { label: "Runtime version", value: RUNTIME_VERSION },
    { label: "Primary model", value: GROQ_PRIMARY_MODEL },
    { label: "Fallback model", value: GROQ_FALLBACK_MODEL },
    { label: "Groq API key", value: GROQ_API_EXPOSURE_STATUS }
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
      {firestoreStatus.errorLabel ? (
        <p className="drawer-note">{firestoreStatus.errorLabel}</p>
      ) : null}
    </details>
  );
}

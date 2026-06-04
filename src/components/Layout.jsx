import Nav from "./Nav.jsx";
import { DISCLAIMER, RUNTIME_ARTIFACTS, UNIVERSAL_HANDOFF_ENVELOPE, WRAPPER_STATUS } from "../lib/constants.js";

export default function Layout({ routes, currentPath, onNavigate, children }) {
  return (
    <div className="app-shell">
      <Nav routes={routes} currentPath={currentPath} onNavigate={onNavigate} />
      <div className="workspace">
        <main className="page-frame">{children}</main>
        <SystemStatusPanel />
        <footer className="footer-disclaimer">{DISCLAIMER}</footer>
      </div>
    </div>
  );
}

function SystemStatusPanel() {
  return (
    <details className="technical-drawer">
      <summary>Wrapper Status</summary>
      <div className="technical-grid">
        <section>
          <h3>System</h3>
          {WRAPPER_STATUS.map((item) => (
            <div className="status-line" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>
        <section>
          <h3>Runtime Artifacts</h3>
          {RUNTIME_ARTIFACTS.map((artifact) => (
            <div className="status-line" key={artifact.file}>
              <span>{artifact.file}</span>
              <strong>{artifact.status}</strong>
            </div>
          ))}
        </section>
        <section>
          <h3>Universal Envelope</h3>
          <p className="drawer-note">
            Conceptual only. Writes, persistence, and engine-specific payloads are pending.
          </p>
          <code>{Object.keys(UNIVERSAL_HANDOFF_ENVELOPE).join(" · ")}</code>
        </section>
      </div>
    </details>
  );
}

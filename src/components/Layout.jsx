import Nav from "./Nav.jsx";
import { GLOBAL_DISCLAIMER } from "../wrapper/config/runtimeConfig.js";
import SystemStatusPanel from "../wrapper/ui/SystemStatusPanel.jsx";

export default function Layout({ routes, currentPath, onNavigate, children }) {
  return (
    <div className="app-shell">
      <Nav routes={routes} currentPath={currentPath} onNavigate={onNavigate} />
      <div className="workspace">
        <main className="page-frame">{children}</main>
        <SystemStatusPanel />
        <footer className="footer-disclaimer">{GLOBAL_DISCLAIMER}</footer>
      </div>
    </div>
  );
}

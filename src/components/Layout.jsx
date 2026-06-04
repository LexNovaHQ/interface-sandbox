import Nav from "./Nav.jsx";
import { DISCLAIMER } from "../lib/constants.js";

export default function Layout({ routes, currentPath, onNavigate, children }) {
  return (
    <div className="app-shell">
      <Nav routes={routes} currentPath={currentPath} onNavigate={onNavigate} />
      <main className="page-frame">{children}</main>
      <footer className="footer-disclaimer">{DISCLAIMER}</footer>
    </div>
  );
}

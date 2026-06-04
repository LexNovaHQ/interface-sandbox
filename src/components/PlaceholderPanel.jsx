import StatusPill from "./StatusPill.jsx";
import { STATUS_TEXT } from "../lib/constants.js";

export default function PlaceholderPanel({ title, description, input, output, children }) {
  return (
    <section className="placeholder-panel">
      <div className="panel-heading">
        <div>
          <StatusPill>{STATUS_TEXT}</StatusPill>
          <h2>{title}</h2>
        </div>
      </div>
      <p>{description}</p>
      <div className="panel-grid">
        <div>
          <span className="eyebrow">Eventual input</span>
          <p>{input}</p>
        </div>
        <div>
          <span className="eyebrow">Eventual output</span>
          <p>{output}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

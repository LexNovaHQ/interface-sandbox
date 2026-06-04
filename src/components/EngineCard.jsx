import { ArrowUpRight } from "lucide-react";
import StatusPill from "./StatusPill.jsx";
import { STATUS_TEXT } from "../lib/constants.js";

export default function EngineCard({ engine, onNavigate }) {
  return (
    <article className="engine-card">
      <div>
        <StatusPill>{STATUS_TEXT}</StatusPill>
        <h3>{engine.title}</h3>
        <p>{engine.summary}</p>
      </div>
      <dl>
        <div>
          <dt>Eventual input</dt>
          <dd>{engine.input}</dd>
        </div>
        <div>
          <dt>Eventual output</dt>
          <dd>{engine.output}</dd>
        </div>
      </dl>
      <button className="inline-action" type="button" onClick={() => onNavigate(engine.path)}>
        <span>Open</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
}

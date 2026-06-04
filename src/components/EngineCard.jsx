import { ArrowUpRight } from "lucide-react";
import StatusPill from "./StatusPill.jsx";
import { STATUS_TEXT } from "../lib/constants.js";

export default function EngineCard({ unit, onNavigate }) {
  return (
    <article className="unit-card">
      <div>
        <StatusPill>{STATUS_TEXT}</StatusPill>
        <span className="unit-code">{unit.unit}</span>
        <h3>{unit.title}</h3>
        <p>{unit.summary}</p>
      </div>
      <button className="inline-action" type="button" onClick={() => onNavigate(unit.path)}>
        <span>Open unit</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
}

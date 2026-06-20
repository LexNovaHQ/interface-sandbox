import { ArrowRight } from "lucide-react";
import EngineCard from "../components/EngineCard.jsx";
import SystemMap from "../components/SystemMap.jsx";
import { APP_NAME, APP_SUBTITLE, UNIT_PANELS } from "../lib/constants.js";

export default function Home({ onNavigate }) {
  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="eyebrow">Public demo environment</span>
          <h1>{APP_NAME}</h1>
          <p className="hero-subtitle">{APP_SUBTITLE}</p>
          <p className="hero-description">
            A public demo environment for turning product evidence into diligence outputs,
            draft routes, delivery states, and maintenance signals.
          </p>
        </div>
        <button className="primary-action" type="button" onClick={() => onNavigate("/diligence")}>
          <span>Enter operational chain</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <SystemMap />

      <section className="section-block">
        <div className="section-title-row">
          <h2>Operational Units</h2>
          <span>Wrapper Batch 1</span>
        </div>
        <div className="unit-grid">
          {UNIT_PANELS.map((unit) => (
            <EngineCard unit={unit} key={unit.path} onNavigate={onNavigate} />
          ))}
        </div>
      </section>
    </div>
  );
}

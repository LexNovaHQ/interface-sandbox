import { ArrowRight } from "lucide-react";
import EngineCard from "../components/EngineCard.jsx";
import SystemMap from "../components/SystemMap.jsx";
import { APP_NAME, APP_SUBTITLE, DISCLAIMER, ENGINE_ROUTES } from "../lib/constants.js";

export default function Home({ onNavigate }) {
  return (
    <div className="page-stack">
      <section className="hero">
        <div>
          <span className="eyebrow">Public sandbox</span>
          <h1>{APP_NAME}</h1>
          <p>{APP_SUBTITLE}</p>
        </div>
        <button className="primary-action" type="button" onClick={() => onNavigate("/diligence")}>
          <span>Start with Diligence</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <SystemMap />

      <section className="section-block">
        <div className="section-title-row">
          <h2>Engine Shells</h2>
          <span>Contracts only</span>
        </div>
        <div className="engine-grid">
          {ENGINE_ROUTES.map((engine) => (
            <EngineCard engine={engine} key={engine.path} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      <section className="demo-disclaimer">
        <h2>Demo Boundary</h2>
        <p>{DISCLAIMER}</p>
      </section>
    </div>
  );
}

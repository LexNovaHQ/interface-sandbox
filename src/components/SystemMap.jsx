import { ArrowRight } from "lucide-react";
import { OPERATIONAL_CHAIN } from "../lib/constants.js";

export default function SystemMap() {
  return (
    <section className="system-map" aria-label="Operational chain">
      {OPERATIONAL_CHAIN.map((item, index) => (
        <div className="system-node-group" key={item}>
          <div className="system-node">{item}</div>
          {index < OPERATIONAL_CHAIN.length - 1 ? (
            <ArrowRight className="system-arrow" size={18} aria-hidden="true" />
          ) : null}
        </div>
      ))}
      <p className="horizon-feed">Horizon Scanner feeds Maintenance Monitor.</p>
    </section>
  );
}

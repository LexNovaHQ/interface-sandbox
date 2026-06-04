import { ArrowRight } from "lucide-react";
import { SYSTEM_CHAIN } from "../lib/constants.js";

export default function SystemMap() {
  return (
    <section className="system-map" aria-label="Sandbox system map">
      {SYSTEM_CHAIN.map((item, index) => (
        <div className="system-node-group" key={item}>
          <div className="system-node">{item}</div>
          {index < SYSTEM_CHAIN.length - 1 ? (
            <ArrowRight className="system-arrow" size={18} aria-hidden="true" />
          ) : null}
        </div>
      ))}
    </section>
  );
}

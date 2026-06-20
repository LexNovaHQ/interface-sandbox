import StatusPill from "./StatusPill.jsx";
import { STATUS_TEXT } from "../lib/constants.js";

export default function PlaceholderPanel({ title, kicker, description, children }) {
  return (
    <section className="unit-frame">
      <div className="panel-heading">
        <div>
          <StatusPill>{STATUS_TEXT}</StatusPill>
          {kicker ? <span className="eyebrow">{kicker}</span> : null}
          <h2>{title}</h2>
        </div>
      </div>
      <p>{description}</p>
      {children}
    </section>
  );
}

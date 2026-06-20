import { Compass, FileStack, Home, Radar, Scale, ShieldCheck } from "lucide-react";
import { APP_NAME, APP_SUBTITLE } from "../lib/constants.js";

const routeIcons = {
  "/": Home,
  "/diligence": ShieldCheck,
  "/assembly": FileStack,
  "/delivery": Scale,
  "/horizon": Radar
};

export default function Nav({ routes, currentPath, onNavigate }) {
  return (
    <aside className="side-rail">
      <button className="brand" type="button" onClick={() => onNavigate("/")}>
        <span className="brand-mark">TI</span>
        <span className="brand-copy">
          <strong>{APP_NAME}</strong>
          <small>{APP_SUBTITLE}</small>
        </span>
      </button>
      <nav className="nav-list" aria-label="Primary navigation">
        {routes.map((route) => {
          const Icon = routeIcons[route.path] || Compass;
          return (
            <button
              className={route.path === currentPath ? "nav-item active" : "nav-item"}
              key={route.path}
              type="button"
              onClick={() => onNavigate(route.path)}
              title={route.label}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{route.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="rail-foot">
        <span>Public demo</span>
        <strong>No legal advice</strong>
      </div>
    </aside>
  );
}

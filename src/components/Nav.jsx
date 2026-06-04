import { Activity, Boxes, FileStack, Radar, ShieldCheck } from "lucide-react";
import { APP_NAME } from "../lib/constants.js";

const routeIcons = {
  "/": Boxes,
  "/diligence": ShieldCheck,
  "/assembly": FileStack,
  "/delivery": Activity,
  "/maintenance": Radar
};

export default function Nav({ routes, currentPath, onNavigate }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => onNavigate("/")}>
        <span className="brand-mark">LN</span>
        <span>{APP_NAME}</span>
      </button>
      <nav className="nav-list" aria-label="Primary navigation">
        {routes.map((route) => {
          const Icon = routeIcons[route.path] || Boxes;
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
    </header>
  );
}

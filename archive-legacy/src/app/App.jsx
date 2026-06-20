import { cloneElement, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import { routes } from "./routes.jsx";

function normalizePath(pathname) {
  if (pathname === "/maintenance") return "/delivery";
  const match = routes.find((route) => route.path === pathname);
  return match ? pathname : "/";
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() =>
    normalizePath(window.location.pathname)
  );

  const activeRoute = useMemo(
    () => routes.find((route) => route.path === currentPath) || routes[0],
    [currentPath]
  );

  function navigate(path) {
    const nextPath = normalizePath(path);
    window.history.pushState({}, "", nextPath);
    setCurrentPath(nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (window.location.pathname === "/maintenance") {
      window.history.replaceState({}, "", "/delivery");
      setCurrentPath("/delivery");
    }

    function handlePopState() {
      setCurrentPath(normalizePath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <Layout routes={routes} currentPath={currentPath} onNavigate={navigate}>
      {cloneElement(activeRoute.element, { onNavigate: navigate })}
    </Layout>
  );
}

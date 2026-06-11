import Home from "../pages/Home.jsx";
import Diligence from "../pages/Diligence.jsx";
import Assembly from "../pages/Assembly.jsx";
import Delivery from "../pages/Delivery.jsx";
import Horizon from "../pages/Horizon.jsx";

export const routes = [
  { path: "/", label: "Home", element: <Home /> },
  { path: "/diligence", label: "Diligence Engine", element: <Diligence /> },
  { path: "/assembly", label: "Assembly Layer", element: <Assembly /> },
  { path: "/delivery", label: "Delivery Portal", element: <Delivery /> },
  { path: "/horizon", label: "Horizon Scanner", element: <Horizon /> }
];

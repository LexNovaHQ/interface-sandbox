import Home from "../pages/Home.jsx";
import Diligence from "../pages/Diligence.jsx";
import Assembly from "../pages/Assembly.jsx";
import Delivery from "../pages/Delivery.jsx";
import Maintenance from "../pages/Maintenance.jsx";

export const routes = [
  { path: "/", label: "Overview", element: <Home /> },
  { path: "/diligence", label: "Diligence", element: <Diligence /> },
  { path: "/assembly", label: "Assembly", element: <Assembly /> },
  { path: "/delivery", label: "Delivery", element: <Delivery /> },
  { path: "/maintenance", label: "Maintenance", element: <Maintenance /> }
];

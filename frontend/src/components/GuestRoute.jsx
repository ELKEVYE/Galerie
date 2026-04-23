import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="screen-state">Chargement de la session...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;

import { useAuth } from "@clerk/react";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <p className="p-8">Checking authentication...</p>;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
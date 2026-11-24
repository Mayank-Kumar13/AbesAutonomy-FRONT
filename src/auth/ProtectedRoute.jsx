import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const hasLocalUser = (() => {
    try {
      return !!localStorage.getItem("abes_user") || !!localStorage.getItem("token");
    } catch {
      return false;
    }
  })();

  if (loading && !hasLocalUser) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  if (!isAuthenticated && !hasLocalUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
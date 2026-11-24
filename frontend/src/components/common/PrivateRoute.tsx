import { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DashboardRole } from "../../types";

interface PrivateRouteProps {
  children: ReactElement;
  allowedRole: DashboardRole;
}

export default function PrivateRoute({ children, allowedRole }: PrivateRouteProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ambos" && user.role !== allowedRole) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }
  return children;
}

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type AllowedRole = "customer" | "driver" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Admin has access to everything
  if (role === "admin" || (role && allowedRoles.includes(role))) {
    return <>{children}</>;
  }

  // Redirect based on role
  if (role === "driver") {
    return <Navigate to="/driver" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

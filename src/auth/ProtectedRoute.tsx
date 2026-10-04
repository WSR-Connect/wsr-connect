import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccess?: "src" | "leadership";
}

export default function ProtectedRoute({
  children,
  requiredAccess = "leadership",
}: ProtectedRouteProps) {
  const {
    user,
    isSRC,
    isLeadership,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <main
        style={{
          minHeight: "50vh",
          display: "grid",
          placeItems: "center",
          padding: "40px 20px",
        }}
      >
        <p style={{ color: "#73777C" }}>
          Checking access...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const hasAccess =
    requiredAccess === "src"
      ? isSRC
      : isLeadership;

  if (!hasAccess) {
    return (
      <Navigate
        to={isSRC ? "/duties" : "/"}
        replace
      />
    );
  }

  return <>{children}</>;
}

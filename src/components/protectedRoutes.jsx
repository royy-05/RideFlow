import { Navigate } from "react-router-dom";

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ role, children }) {
  const token = localStorage.getItem("token");

  // No token → send to appropriate login page
  if (!token) {
    return <Navigate to={role === "driver" ? "/driver-login" : "/login"} replace />;
  }

  const decoded = decodeToken(token);

  // Malformed token → send to login
  if (!decoded) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to their correct home
  if (decoded.role !== role) {
    if (decoded.role === "driver") {
      return <Navigate to="/driver-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // Correct role → render the page
  return children;
}
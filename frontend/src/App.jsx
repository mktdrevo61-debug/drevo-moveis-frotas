// src/App.jsx
/**
 * App — root routing component for Drevo Móveis.
 *
 * Routes:
 *   /login          → Login (public)
 *   /driver/*       → DriverDashboard (protected, role: driver or any authenticated)
 *   /manager/*      → ManagerDashboard (protected, role: manager/admin)
 *   *               → Redirect to /login
 *
 * ProtectedRoute:
 *   - Checks isAuthenticated() from localStorage
 *   - Optionally checks role match
 *   - Redirects to /login if unauthenticated
 *   - Redirects to role-appropriate dashboard if wrong role
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from './services/authService.js';
import Login from './pages/Login.jsx';
import DriverDashboard from './pages/DriverDashboard.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
/**
 * Wraps a route with authentication + optional role guard.
 *
 * @param {React.ReactNode} children   - The page component to render
 * @param {'driver'|'manager'} role    - Required role ('driver' accepts any auth'd user; 'manager' requires manager/admin)
 */
function ProtectedRoute({ children, role }) {
  const location = useLocation();

  // 1. Not authenticated — redirect to login, preserving intended destination
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = getCurrentUser();
  const userRole = user?.role?.toLowerCase() ?? 'driver';

  // 2. Role mismatch — redirect to correct dashboard instead of showing 403
  if (role === 'manager' && userRole !== 'manager' && userRole !== 'admin') {
    return <Navigate to="/driver" replace />;
  }

  if (role === 'driver' && (userRole === 'manager' || userRole === 'admin')) {
    return <Navigate to="/manager" replace />;
  }

  // 3. Authorized — render children
  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Driver routes — any authenticated user (non-manager) */}
      <Route
        path="/driver/*"
        element={
          <ProtectedRoute role="driver">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />

      {/* Manager routes — requires manager or admin role */}
      <Route
        path="/manager/*"
        element={
          <ProtectedRoute role="manager">
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback — redirect to login for any unknown path */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

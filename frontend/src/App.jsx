import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./Login.jsx";
import CloudDashboard from "./components/CloudDashboard.jsx";

/**
 * Wrapper component to protect routes.
 * If JWT token exists → allow access.
 * Otherwise → redirect to /login and remember current location.
 */
function RequireAuth({ children }) {
  const authed = !!localStorage.getItem("token"); // check if user is logged in
  const location = useLocation();
  return authed ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

/**
 * Opposite of RequireAuth:
 * If user is already logged in → redirect to /dashboard
 * Otherwise → show the child page (e.g. Login).
 */
function RedirectIfAuthed({ children }) {
  const authed = !!localStorage.getItem("token");
  return authed ? <Navigate to="/dashboard" replace /> : children;
}

// ✅ Sets the document title based on the current route.
function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/login") {
      document.title = "Login | Cloud Cost Optimizer";
    } else if (location.pathname === "/dashboard") {
      document.title = "Dashboard | Cloud Cost Optimizer";
    } else {
      document.title = "Cloud Cost Optimizer";
    }
  }, [location.pathname]);

  return null; // This component doesn't render anything visually
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Runs on every route change to update title */}
      <TitleUpdater />

      <Routes>
        {/* Public route: Login page */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />

        {/* Protected route: Dashboard page */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <CloudDashboard />
            </RequireAuth>
          }
        />

        {/* Catch-all: redirect any unknown path to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
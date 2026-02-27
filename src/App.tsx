import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PublicWebsite } from './components/PublicWebsite';
import { LoginModal } from './components/LoginModal';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({
  children,
  user,
  loading,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  user: ReturnType<typeof useAuth>['user'];
  loading: ReturnType<typeof useAuth>['loading'];
  requireAdmin?: boolean;
}) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Redirect logged-in users from public home to dashboard (e.g. after magic link)
  if (user && location.pathname === '/') {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  // Public route renders immediately; protected routes show loading via ProtectedRoute
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <PublicWebsite onLogin={handleLoginClick} />
              {showLoginModal && (
                <LoginModal onClose={() => setShowLoginModal(false)} />
              )}
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} loading={loading}>
              {user?.role === 'admin' ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Dashboard user={user!} onLogout={handleLogout} />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} loading={loading} requireAdmin>
              {user && <AdminDashboard user={user} onLogout={handleLogout} />}
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

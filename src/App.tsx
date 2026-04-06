import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PublicWebsite } from './components/PublicWebsite';
import { LoginModal } from './components/LoginModal';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { FirstLoginOnboarding } from './components/FirstLoginOnboarding';
import { DashboardV2 } from './experimental/DashboardV2';
import { AdminDashboardV2 } from './experimental/AdminDashboardV2';
import { FamilyDashboardV2 } from './components/dashboard/FamilyDashboardV2';
import { useAuth } from './hooks/useAuth';
import { Alert, AlertDescription } from './components/ui/alert';
import { AlertCircle } from 'lucide-react';

function ProtectedRoute({
  children,
  user,
  loading,
  accessState,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  user: ReturnType<typeof useAuth>['user'];
  loading: ReturnType<typeof useAuth>['loading'];
  accessState: ReturnType<typeof useAuth>['accessState'];
  requireAdmin?: boolean;
}) {
  const location = useLocation();

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

  if (accessState === 'blocked') {
    return <Navigate to="/" replace />;
  }

  if (accessState === 'needs_onboarding' && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading, accessState, accessMessage, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Redirect logged-in users from public home to onboarding/dashboard after magic link.
  if (user && location.pathname === '/') {
    if (accessState === 'needs_onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
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
              {accessMessage && (
                <div className="max-w-3xl mx-auto mt-6 px-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{accessMessage}</AlertDescription>
                  </Alert>
                </div>
              )}
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
            <ProtectedRoute user={user} loading={loading} accessState={accessState}>
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
            <ProtectedRoute user={user} loading={loading} accessState={accessState} requireAdmin>
              {user && <AdminDashboard user={user} onLogout={handleLogout} />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute user={user} loading={loading} accessState={accessState}>
              {user?.role === 'family' ? (
                <FirstLoginOnboarding user={user} onComplete={async () => {
                  window.location.assign('/dashboard');
                }} onLogout={handleLogout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          }
        />
        {/* Experimental routes — new sidebar-based UI prototypes */}
        <Route
          path="/experimental/dashboard"
          element={
            <ProtectedRoute user={user} loading={loading} accessState={accessState}>
              {user?.role === 'admin' ? (
                <AdminDashboardV2 user={user} onLogout={handleLogout} />
              ) : (
                <DashboardV2 user={user!} onLogout={handleLogout} />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/experimental/admin"
          element={
            <ProtectedRoute user={user} loading={loading} accessState={accessState} requireAdmin>
              {user && <AdminDashboardV2 user={user} onLogout={handleLogout} />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/experimental/dashboard-v2"
          element={
            <ProtectedRoute user={user} loading={loading} accessState={accessState}>
              <FamilyDashboardV2 user={user!} onLogout={handleLogout} />
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

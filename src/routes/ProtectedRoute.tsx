import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppRedux';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isInitialized } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // The session cookie is HttpOnly, so JavaScript cannot read it. Until
  // /auth/me answers we genuinely do not know if this visitor is signed in -
  // redirecting now would bounce a signed-in member on a hard refresh.
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
        <p className="text-sm text-slate-400">
          This section requires the <strong>{requiredRole}</strong> role.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
};

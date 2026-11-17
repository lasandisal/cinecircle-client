import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppRedux';

interface GuestRouteProps {
  children: React.ReactElement;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isAuthenticated) {
    if (user && !user.onboarded) {
      return <Navigate to="/onboarding" replace />;
    }
    const origin = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={origin} replace />;
  }

  return children;
};

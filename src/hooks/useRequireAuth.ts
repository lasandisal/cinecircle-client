import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from './useAppRedux';

/**
 * One place for "this control needs an account".
 *
 * Guests are sent to /login with the current location in router state;
 * LoginPage and GuestRoute read `state.from.pathname` to send them straight
 * back afterwards. Handlers use the boolean return to bail out *before*
 * touching optimistic UI state or calling an endpoint that would answer 401.
 */
export const useRequireAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const requireAuth = useCallback((): boolean => {
    if (isAuthenticated) return true;
    navigate('/login', { state: { from: location } });
    return false;
  }, [isAuthenticated, navigate, location]);

  return { isAuthenticated, requireAuth };
};

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';

// Lazy-loaded pages (code-splitting via dynamic import)
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const SoloRecommendationPage = lazy(() =>
  import('../pages/SoloRecommendationPage').then((m) => ({ default: m.SoloRecommendationPage }))
);
const GroupSessionPage = lazy(() =>
  import('../pages/GroupSessionPage').then((m) => ({ default: m.GroupSessionPage }))
);
const TitleDetailPage = lazy(() =>
  import('../pages/TitleDetailPage').then((m) => ({ default: m.TitleDetailPage }))
);
const WatchlistPage = lazy(() =>
  import('../pages/WatchlistPage').then((m) => ({ default: m.WatchlistPage }))
);
const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const CuratorDashboardPage = lazy(() =>
  import('../pages/CuratorDashboardPage').then((m) => ({ default: m.CuratorDashboardPage }))
);
const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const OnboardingPage = lazy(() =>
  import('../pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
    </div>
    <p className="text-xs text-slate-400 font-medium">Loading...</p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Auth routes — full-screen, no Navbar/Footer */}
        <Route
          path="login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        {/* App routes — wrapped in MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="recommend" element={<SoloRecommendationPage />} />
          <Route path="group" element={<GroupSessionPage />} />
          <Route path="title/:id" element={<TitleDetailPage />} />
          <Route path="titles/:id" element={<TitleDetailPage />} />
          <Route
            path="watchlist"
            element={
              <ProtectedRoute>
                <WatchlistPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:id" element={<ProfilePage />} />
          <Route
            path="onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="curator"
            element={
              <ProtectedRoute requiredRole="admin">
                <CuratorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};


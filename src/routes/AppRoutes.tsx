import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { HomePage } from '../pages/HomePage';
import { SoloRecommendationPage } from '../pages/SoloRecommendationPage';
import { GroupSessionPage } from '../pages/GroupSessionPage';
import { TitleDetailPage } from '../pages/TitleDetailPage';
import { WatchlistPage } from '../pages/WatchlistPage';
import { ProfilePage } from '../pages/ProfilePage';
import { CuratorDashboardPage } from '../pages/CuratorDashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';

export const AppRoutes: React.FC = () => {
  return (
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
  );
};


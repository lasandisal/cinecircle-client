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
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="recommend" element={<SoloRecommendationPage />} />
        <Route path="group" element={<GroupSessionPage />} />
        <Route path="title/:id" element={<TitleDetailPage />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="curator" element={<CuratorDashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

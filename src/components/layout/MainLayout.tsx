import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { BottomNav } from '../common/BottomNav';
import { useAppSelector } from '../../hooks/useAppRedux';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const showOnboardingBanner =
    isAuthenticated &&
    user &&
    !user.onboarded &&
    !dismissedBanner &&
    location.pathname !== '/onboarding';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Onboarding Callout Banner */}
      {showOnboardingBanner && (
        <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900 border-b border-indigo-500/30 px-4 py-2.5 text-xs text-slate-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="truncate">
                <span className="font-bold text-white">Unlock personalized recommendations:</span>{' '}
                Complete your 2-minute CineTaste Matrix (genres, seed titles & streaming passes).
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/onboarding"
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Set Up Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={() => setDismissedBanner(true)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
      <Footer />
      {/* Mobile Floating Bottom Dock */}
      <BottomNav />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Users,
  Bookmark,
  Sparkles,
  TrendingUp,
  Tv,
  ShieldCheck,
} from 'lucide-react';
import { StreamingBadge } from '../common/StreamingBadge';
import { useAppSelector } from '../../hooks/useAppRedux';
import { userService } from '../../services/user.service';
import { socketService } from '../../services/socket';

interface LeftNavSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const LeftNavSidebar: React.FC<LeftNavSidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isOnline, setIsOnline] = useState(false);

  // Real counts for this member. Previously these were the literals 42 / 18 / 6.
  const [stats, setStats] = useState({
    watchedCount: 0,
    watchlistCount: 0,
    circlesCount: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) {
      setStats({ watchedCount: 0, watchlistCount: 0, circlesCount: 0, loading: false });
      return;
    }
    setStats((s) => ({ ...s, loading: true }));
    userService
      .getProfile()
      .then((profile: any) => {
        if (cancelled) return;
        setStats({
          watchedCount: profile?.stats?.watchedCount ?? 0,
          watchlistCount: profile?.stats?.watchlistCount ?? 0,
          circlesCount: profile?.stats?.circlesCount ?? 0,
          loading: false,
        });
      })
      .catch(() => {
        if (!cancelled) setStats((s) => ({ ...s, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setIsOnline(false);
      return;
    }

    const socket = socketService.connect();
    if (!socket) {
      setIsOnline(false);
      return;
    }

    const handleConnect = () => setIsOnline(true);
    const handleDisconnect = () => setIsOnline(false);
    const handleOnline = ({ userId }: { userId: string }) => {
      if (userId === user._id) setIsOnline(true);
    };
    const handleOffline = ({ userId }: { userId: string }) => {
      if (userId === user._id) setIsOnline(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socketService.onPresenceOnline(handleOnline);
    socketService.onPresenceOffline(handleOffline);

    if (socket.connected) setIsOnline(true);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('presence:online', handleOnline);
      socket.off('presence:offline', handleOffline);
    };
  }, [isAuthenticated, user?._id]);

  return (
    <aside className="w-64 shrink-0 space-y-6 hidden lg:block">
      {/* Profile Snippet Card or Guest Prompt */}
      {isAuthenticated && user ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl p-[1.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-bold text-white text-base">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span
                title={isOnline ? 'Online' : 'Offline'}
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-slate-950 rounded-full ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white truncate">{user.name}</h3>
                {user.role === 'admin' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-indigo-400 truncate">
                @{user.name.toLowerCase().replace(/\s+/g, '')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-center">
            <div>
              <span className="block text-sm font-bold text-white">
                {stats.loading ? '—' : stats.watchedCount}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Watched</span>
            </div>
            <div>
              <span className="block text-sm font-bold text-white">
                {stats.loading ? '—' : stats.watchlistCount}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">To Watch</span>
            </div>
            <div>
              <span className="block text-sm font-bold text-indigo-400">
                {stats.loading ? '—' : stats.circlesCount}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Circles</span>
            </div>
          </div>

          {/* Subscribed streaming services - from the member's actual subscriptions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Tv className="w-3 h-3 text-cyan-400" /> Subscribed Services
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {(user.subscribedServices || []).length > 0 ? (
                (user.subscribedServices || []).map((service) => (
                  <StreamingBadge key={service} service={service} size="sm" />
                ))
              ) : (
                <p className="text-[10px] text-slate-500 italic">
                  None added yet — set them in your profile.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Guests: show a slim info card — the Navbar already has Sign In / Get Started */
        <>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="CineCircle" className="w-8 h-8 rounded-lg object-cover" />
              <div>
                <h3 className="text-xs font-bold text-white">CineCircle</h3>
                <p className="text-[10px] text-slate-400">Social film discovery</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rate films, write reviews, and decide what to watch together — for free.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Find Your People
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sign in to discover members with similar taste, follow them, and compare what you both watched.
            </p>
          </div>
        </>
      )}

      {/* Feed Filters - members only. Guests have a single discovery view. */}
      {isAuthenticated && (
        <nav className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2.5 space-y-1 backdrop-blur-sm">
          <span className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Feed Discovery
          </span>
          <button
            onClick={() => setActiveTab('for-you')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'for-you'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>For You</span>
          </button>

          <button
            onClick={() => setActiveTab('connections')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'connections'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Connections Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('trending')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'trending'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Trending Shortlists</span>
          </button>
        </nav>
      )}

      {/* Quick Links */}
      <nav className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2.5 space-y-1 backdrop-blur-sm">
        <span className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Shortcuts
        </span>
        <NavLink
          to="/recommend"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
        >
          <Compass className="w-4 h-4 text-violet-400" />
          <span>Solo Decision Engine</span>
        </NavLink>
        <NavLink
          to="/group"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Group Decision Rooms</span>
        </NavLink>
        <NavLink
          to="/watchlist"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
        >
          <Bookmark className="w-4 h-4 text-amber-400" />
          <span>My Watchlist</span>
        </NavLink>
      </nav>
    </aside>
  );
};

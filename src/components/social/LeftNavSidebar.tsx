import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Users,
  Bookmark,
  Sparkles,
  TrendingUp,
  UserCheck,
  Tv,
} from 'lucide-react';
import { StreamingBadge } from '../common/StreamingBadge';

interface LeftNavSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const LeftNavSidebar: React.FC<LeftNavSidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 shrink-0 space-y-6 hidden lg:block">
      {/* Profile Snippet Card */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl p-[1.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces"
                alt="Lasandi Salwathura"
                className="w-full h-full rounded-[10px] object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">Lasandi Salwathura</h3>
            <p className="text-xs text-indigo-400">@lasandisal</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-center">
          <div>
            <span className="block text-sm font-bold text-white">42</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Watched</span>
          </div>
          <div>
            <span className="block text-sm font-bold text-white">18</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Saved</span>
          </div>
          <div>
            <span className="block text-sm font-bold text-indigo-400">6</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Circles</span>
          </div>
        </div>

        {/* Owned streaming services */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Tv className="w-3 h-3 text-cyan-400" /> Owned Services
          </span>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <StreamingBadge service="Netflix" size="sm" />
            <StreamingBadge service="Prime Video" size="sm" />
            <StreamingBadge service="Disney+" size="sm" />
          </div>
        </div>
      </div>

      {/* Feed Filters */}
      <nav className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2.5 space-y-1 backdrop-blur-sm">
        <span className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Feed Discovery
        </span>
        <button
          onClick={() => setActiveTab('for-you')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'for-you'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>For You</span>
        </button>

        <button
          onClick={() => setActiveTab('following')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'following'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Friends Activity</span>
        </button>

        <button
          onClick={() => setActiveTab('trending')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'trending'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trending Shortlists</span>
        </button>
      </nav>

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

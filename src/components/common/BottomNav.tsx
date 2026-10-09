import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sparkles, Plus, Bookmark } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1 shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Feed */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Feed</span>
        </NavLink>

        {/* Solo Match */}
        <NavLink
          to="/recommend"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-violet-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">Solo</span>
        </NavLink>

        {/* Center Floating Action: Start Circle */}
        <NavLink
          to="/group"
          className="relative -top-3 p-3 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="sr-only">Start Circle</span>
        </NavLink>

        {/* Watchlist */}
        <NavLink
          to="/watchlist"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px]">Watchlist</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile/me"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=faces"
            alt="Profile"
            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
          />
          <span className="text-[10px]">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

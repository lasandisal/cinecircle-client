import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sparkles, Plus, Bookmark, User as UserIcon } from 'lucide-react';
import { useAppSelector } from '../../hooks/useAppRedux';

export const BottomNav: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const initial = user?.name?.charAt(0).toUpperCase();

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

        {/* Profile - the real avatar, never someone else's stock photo. */}
        <NavLink
          to="/profile/me"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          {isAuthenticated && user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
            />
          ) : (
            <span className="w-5 h-5 rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-200">
              {initial || <UserIcon className="w-3 h-3" />}
            </span>
          )}
          <span className="text-[10px]">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

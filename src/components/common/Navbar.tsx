import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Bookmark,
  Search,
  Plus,
  X,
} from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

export const Navbar: React.FC = () => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <img
              src="/logo.png"
              alt="CineCircle"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-800 shadow-md shadow-indigo-500/15 group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-['Outfit']">
              Cine<span className="text-indigo-400">Circle</span>
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="relative hidden md:block w-56 lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search films, friends..."
              className="w-full pl-8 pr-10 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Primary Desktop Nav Links (hidden on mobile, handled by bottom dock) */}
        <nav className="hidden md:flex items-center gap-1.5">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-indigo-400 border border-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`
            }
          >
            <span>Feed</span>
          </NavLink>

          <NavLink
            to="/recommend"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-violet-400 border border-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Solo Pick</span>
          </NavLink>

          <NavLink
            to="/group"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-indigo-400 border border-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`
            }
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Circles</span>
          </NavLink>

          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-amber-400 border border-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`
            }
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Watchlist</span>
          </NavLink>
        </nav>

        {/* Right Section: Mobile Search trigger, notifications, and profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 active:scale-95 transition-transform"
            aria-label="Toggle Search"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Desktop New Circle Button */}
          <Link
            to="/group"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Circle</span>
          </Link>

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* User Profile */}
          <Link
            to="/profile/me"
            className="flex items-center gap-2 p-0.5 sm:p-1 rounded-xl hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition-all group"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
              alt="Lasandi"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-1 ring-slate-800 group-hover:ring-indigo-500/50"
            />
            <span className="text-xs font-semibold text-slate-200 hidden lg:inline group-hover:text-white">
              Lasandi
            </span>
          </Link>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 pb-3 pt-1 border-t border-slate-850 bg-slate-950/95 animate-in fade-in duration-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search films, shows, or friends..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}
    </header>
  );
};

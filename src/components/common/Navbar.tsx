import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Sparkles, Bookmark } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="CineCircle"
            className="w-10 h-10 rounded-xl object-cover border border-slate-800 shadow-lg shadow-indigo-500/15 group-hover:scale-105 transition-transform duration-200"
          />
          <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
            Cine<span className="text-indigo-400">Circle</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/recommend"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            Solo Pick
          </Link>
          <Link
            to="/group"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            Group Mode
          </Link>
          <Link
            to="/watchlist"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            Watchlist
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/25 transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Bookmark, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CineCircle Logo"
                className="w-9 h-9 rounded-xl object-cover border border-slate-800 shadow-md shadow-indigo-500/10"
              />
              <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
                Cine<span className="text-indigo-400">Circle</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              A Social Watch-Decision Platform for TV & Film. Solving decision fatigue through context-aware
              scoring, real-time group compromise voting, and legal streaming availability tracking.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Designed & Engineered by</span>
              <span className="font-semibold text-slate-200">Lasandi Salwathura</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/recommend" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Solo Decision Pick
                </Link>
              </li>
              <li>
                <Link to="/group" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> Group Decision Room
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Personal Watchlist
                </Link>
              </li>
              <li>
                <Link to="/curator" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Curator Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Project Details & Tech */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Academic Project</h4>
            <div className="space-y-1 text-xs text-slate-400">
              <p className="font-medium text-slate-300">ITS2020 — Rapid Application Development (RAD)</p>
              <p>Graduate Diploma in Software Engineering</p>
              <p className="text-slate-500">IJSE — Institute of Java & Software Engineering</p>
            </div>
            <div className="pt-2 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800 text-indigo-400">
                React 19 + TS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800 text-violet-400">
                Node.js + Express
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800 text-cyan-400">
                PostgreSQL + Prisma
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800 text-emerald-400">
                Socket.io
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Rights */}
        <div className="border-t border-slate-900/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} CineCircle. All Rights Reserved. Created by Lasandi Salwathura.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Live metadata backed by TMDB & JustWatch</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

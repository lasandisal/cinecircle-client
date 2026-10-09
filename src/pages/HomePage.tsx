import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Tv } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-center mb-2">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-75 transition duration-500"></div>
            <img
              src="/logo.png"
              alt="CineCircle Logo"
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-700/80 shadow-2xl shadow-indigo-500/20"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          The Social Watch-Decision Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-['Outfit']">
          Spend less time scrolling.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
            More time watching.
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          CineCircle is the decision layer for TV & film. Blend your long-term taste profile with your
          immediate mood, available time, and owned streaming services — solo or with a group.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/recommend"
            className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Find What to Watch
          </Link>
          <Link
            to="/group"
            className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5 text-indigo-400" />
            Start Group Session
          </Link>
        </div>
      </section>

      {/* Feature Pillars Preview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Mood & Context Engine</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Short, ranked shortlists computed from your available time, current mood, and recency-weighted taste.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Real-time Group Mode</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Share a join code. Everyone reacts to the shortlist, and a weighted compromise pick resolves the debate.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
            <Tv className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Streaming Provider Filtering</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Filter suggestions by what services you and your group actually subscribe to via TMDB & JustWatch data.
          </p>
        </div>
      </section>
    </div>
  );
};

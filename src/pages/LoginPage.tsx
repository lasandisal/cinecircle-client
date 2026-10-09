import React from 'react';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="CineCircle"
              className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shadow-lg shadow-indigo-500/20"
            />
          </div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Sign In to CineCircle</h1>
          <p className="text-xs text-slate-400">Access your personalized taste profile & groups</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="user@example.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
              disabled
            />
          </div>
          <button
            type="submit"
            disabled
            className="w-full py-2.5 px-4 bg-indigo-600/50 text-indigo-200 font-semibold rounded-lg text-sm cursor-not-allowed"
          >
            Sign In (Skeleton)
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

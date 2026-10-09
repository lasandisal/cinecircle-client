import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Join CineCircle</h1>
          <p className="text-xs text-slate-400">Create your account and build your taste profile</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Alex Parker"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="alex@example.com"
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
            Create Account (Skeleton)
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

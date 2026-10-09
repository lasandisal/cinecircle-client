import React from 'react';
import { KeyRound, Sparkles } from 'lucide-react';

export const GroupSessionPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white font-['Outfit']">
          Group Decision Mode
        </h1>
        <p className="text-slate-400 text-sm">
          Collaborate with friends to resolve what to watch using weighted compromise scoring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Session</h3>
              <p className="text-xs text-slate-400">Host a watch party decision room</p>
            </div>
          </div>
          <button
            disabled
            className="w-full py-2.5 px-4 bg-indigo-600/50 text-indigo-200 text-sm font-semibold rounded-xl cursor-not-allowed"
          >
            Create Session (Skeleton)
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Join Existing Session</h3>
              <p className="text-xs text-slate-400">Enter a 6-character room code</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="e.g. CIN789"
            disabled
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-sm"
          />
          <button
            disabled
            className="w-full py-2.5 px-4 bg-slate-800 text-slate-400 text-sm font-semibold rounded-xl cursor-not-allowed"
          >
            Join Room (Skeleton)
          </button>
        </div>
      </div>
    </div>
  );
};

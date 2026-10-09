import React from 'react';
import { ShieldCheck, Music, AlertTriangle } from 'lucide-react';

export const CuratorDashboardPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">Curator & Admin Dashboard</h1>
            <p className="text-xs text-slate-400">Role-Based Access Control (Admin / Curator)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-400" /> Curated Soundtracks
            </h3>
            <p className="text-xs text-slate-400">Manage flagship title soundtrack seeds</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Moderation Queue
            </h3>
            <p className="text-xs text-slate-400">Review reported comments and flagged community activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

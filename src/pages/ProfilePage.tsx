import React from 'react';
import { User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">User Profile & Taste Matrix</h1>
            <p className="text-sm text-slate-400">Social profile, follow network, and mutual-watched comparison</p>
          </div>
        </div>
      </div>
    </div>
  );
};

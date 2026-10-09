import React from 'react';
import { Clock, Compass } from 'lucide-react';

export const SoloRecommendationPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white font-['Outfit']">
          Solo Decision Prompt
        </h1>
        <p className="text-slate-400 text-sm">
          Tell CineCircle what you feel like watching right now. We'll build a tailored shortlist.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Available Time (Minutes)
          </label>
          <div className="text-sm text-slate-500 italic">Slider / selector placeholder</div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-400" /> Current Mood / Vibe
          </label>
          <div className="text-sm text-slate-500 italic">
            Mood tags placeholder (Comfort Rewatch, Gripping, Mind-Bending, Lighthearted, Background Noise)
          </div>
        </div>

        <button
          disabled
          className="w-full py-3 px-4 bg-indigo-600/50 text-indigo-200 font-semibold rounded-xl cursor-not-allowed text-center"
        >
          Generate Shortlist (Skeleton Placeholder)
        </button>
      </div>
    </div>
  );
};

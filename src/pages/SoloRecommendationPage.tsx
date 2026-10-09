import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sparkles, Clock, Compass, Film, Tv, Star, ArrowRight, Wand2, ShieldAlert, Loader2 } from 'lucide-react';
import { recommendationService, type RecommendationResult } from '../services/recommendation.service';

const MOODS = [
  { label: 'Comfort', emoji: '🛋️' },
  { label: 'Gripping', emoji: '⚡' },
  { label: 'Mind-Bending', emoji: '🧠' },
  { label: 'Fun', emoji: '🍿' },
  { label: 'Stunning', emoji: '✨' },
];

const DURATIONS = [
  { label: '30m', value: 30 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
  { label: '120m', value: 120 },
  { label: 'Any Duration', value: 200 },
];

export const SoloRecommendationPage: React.FC = () => {
  const location = useLocation();
  const initialState = (location.state as any) || {};

  const [selectedMood, setSelectedMood] = useState<string>(initialState.selectedMood || 'Gripping');
  const [selectedDuration, setSelectedDuration] = useState<number>(initialState.selectedDuration || 90);
  const [mediaType, setMediaType] = useState<'all' | 'film' | 'tv'>('all');
  const [aiPrompt, setAiPrompt] = useState<string>(initialState.aiPrompt || '');

  const [shortlist, setShortlist] = useState<RecommendationResult[]>([]);
  const [championPick, setChampionPick] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fatigueActive, setFatigueActive] = useState<boolean>(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    setChampionPick(null);
    try {
      const data = await recommendationService.getSoloRecommendations({
        mood: selectedMood,
        duration: selectedDuration,
        type: mediaType === 'all' ? undefined : mediaType,
        aiPrompt: aiPrompt.trim() || undefined,
      });
      setShortlist(data.shortlist || []);
    } catch (err) {
      console.error('Failed to compute recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedMood, selectedDuration, mediaType]);

  const handleFatigueBreak = async () => {
    setFatigueActive(true);
    try {
      const champ = await recommendationService.getFatiguePick();
      setChampionPick(champ);
    } catch (err) {
      console.error('Failed to break fatigue:', err);
    } finally {
      setFatigueActive(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Scoring Algorithm</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
          Solo Decision Engine
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
          Tailored shortlists calculated from real database titles, your current mood, time limit, and Gemini AI.
        </p>
      </div>

      {/* Control Panel Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl backdrop-blur-sm">
        {/* Mood and Duration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mood Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-violet-400" /> Current Vibe / Mood
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setSelectedMood(m.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedMood === m.label
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Available Time */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Max Available Time
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDuration(d.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedDuration === d.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-4 h-4 text-cyan-400" /> Format
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setMediaType('all')}
                className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                  mediaType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMediaType('film')}
                className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                  mediaType === 'film' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setMediaType('tv')}
                className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                  mediaType === 'tv' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Series
              </button>
            </div>
          </div>
        </div>

        {/* Gemini AI Custom Prompt Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Wand2 className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Or type a custom vibe prompt: e.g. 'Cozy 90s thriller with rainfall and jazz'..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecommendations()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={fetchRecommendations}
            className="py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all shrink-0"
          >
            <span>Analyze & Filter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Decision Fatigue Champion Banner */}
      {championPick && (
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src={championPick.posterUrl}
              alt={championPick.name}
              className="w-32 h-48 object-cover rounded-2xl shadow-xl ring-2 ring-amber-500/30"
            />
            <div className="space-y-3 flex-1 text-center md:text-left">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1">
                🏆 Decision Fatigue Winner
              </span>
              <h2 className="text-2xl font-black text-white">{championPick.name}</h2>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {championPick.synopsis || championPick.overview}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Link
                  to={`/title/${championPick._id || championPick.tmdbId}`}
                  className="py-2 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  Start Watching Now &rarr;
                </Link>
                <button
                  onClick={() => setChampionPick(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Shortlist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Tailored Shortlist</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              {shortlist.length} Matches
            </span>
          </h3>

          <button
            onClick={handleFatigueBreak}
            disabled={fatigueActive}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Stuck? Break Decision Fatigue</span>
          </button>
        </div>

        {loading ? (
          <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400">Computing match scores across catalogue...</p>
          </div>
        ) : shortlist.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <p className="text-sm text-slate-300 font-semibold">No titles matched all criteria.</p>
            <p className="text-xs text-slate-500">Try widening your available time limit or changing the mood.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shortlist.map((title) => (
              <div
                key={title.id}
                className="group relative bg-slate-900/50 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-indigo-500/10"
              >
                <div>
                  {/* Backdrop / Poster Container */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={title.backdropUrl || title.posterUrl}
                      alt={title.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent"></div>

                    {/* Match Score Badge */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-black shadow-lg">
                      {title.matchScore}% Match
                    </div>

                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white uppercase flex items-center gap-1">
                      {title.type === 'tv' ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                      <span>{title.type}</span>
                    </div>

                    {/* Title overlay */}
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <h4 className="text-base font-black text-white line-clamp-1 drop-shadow-md">
                        {title.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 drop-shadow">
                        <span>{title.releaseYear}</span>
                        <span>•</span>
                        <span>{title.runtimeMinutes}m</span>
                        {title.voteAverage ? (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Star className="w-3 h-3 fill-amber-400" /> {title.voteAverage}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    {/* Rationale pill */}
                    <p className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 line-clamp-2">
                      💡 {title.matchReason}
                    </p>

                    {/* Synopsis */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {title.synopsis}
                    </p>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(title.genres || []).slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <Link
                    to={`/title/${title.id}${title.type ? `?type=${title.type}` : ''}`}
                    className="w-full py-2 bg-slate-800 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Title Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Zap,
  Smile,
  ShieldAlert,
  Search,
  Heart,
  Palette,
  Compass,
  FileText,
  Skull,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Star,
  Film,
  Sparkle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppRedux';
import { updateUser } from '../../store/slices/authSlice';
import { userService } from '../../services/user.service';
import { titleService } from '../../services/title.service';
import { StreamingBadge } from '../common/StreamingBadge';
import type { Title } from '../../types';

interface TasteOnboardingWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
  onComplete?: () => void;
}

const AVAILABLE_GENRES = [
  { name: 'Science Fiction', icon: Zap, color: 'from-cyan-500/20 to-blue-600/30 border-cyan-500/40 text-cyan-300' },
  { name: 'Thriller', icon: Flame, color: 'from-amber-500/20 to-rose-600/30 border-amber-500/40 text-amber-300' },
  { name: 'Drama', icon: Film, color: 'from-indigo-500/20 to-purple-600/30 border-indigo-500/40 text-indigo-300' },
  { name: 'Action', icon: Flame, color: 'from-orange-500/20 to-red-600/30 border-orange-500/40 text-orange-300' },
  { name: 'Comedy', icon: Smile, color: 'from-yellow-500/20 to-amber-600/30 border-yellow-500/40 text-yellow-300' },
  { name: 'Crime', icon: ShieldAlert, color: 'from-red-500/20 to-rose-700/30 border-red-500/40 text-red-300' },
  { name: 'Mystery', icon: Search, color: 'from-violet-500/20 to-indigo-700/30 border-violet-500/40 text-violet-300' },
  { name: 'Romance', icon: Heart, color: 'from-pink-500/20 to-rose-600/30 border-pink-500/40 text-pink-300' },
  { name: 'Animation', icon: Palette, color: 'from-emerald-500/20 to-teal-600/30 border-emerald-500/40 text-emerald-300' },
  { name: 'Fantasy', icon: Sparkles, color: 'from-purple-500/20 to-fuchsia-600/30 border-purple-500/40 text-purple-300' },
  { name: 'Adventure', icon: Compass, color: 'from-teal-500/20 to-emerald-600/30 border-teal-500/40 text-teal-300' },
  { name: 'Documentary', icon: FileText, color: 'from-blue-500/20 to-slate-600/30 border-blue-500/40 text-blue-300' },
  { name: 'Horror', icon: Skull, color: 'from-rose-900/30 to-black/60 border-rose-800/40 text-rose-300' },
  { name: 'Family', icon: Users, color: 'from-sky-500/20 to-blue-600/30 border-sky-500/40 text-sky-300' },
];

const COMMON_EXCLUSIONS = [
  { id: 'Horror', label: 'Horror & Jump Scares', desc: 'Gory thrillers and paranormal frights' },
  { id: 'Extreme Violence', label: 'Extreme Violence / Gore', desc: 'Heavy graphic content' },
  { id: 'Romance', label: 'Cheesy Romance', desc: 'Overly sentimental melodramas' },
  { id: 'Musical', label: 'Musicals', desc: 'Song-and-dance theatre films' },
  { id: 'Documentary', label: 'Documentaries', desc: 'Non-fiction real life records' },
  { id: 'Animation', label: 'Cartoons / Animation', desc: 'Animated films or anime' },
];

const STREAMING_PLATFORMS = [
  'Netflix',
  'Prime Video',
  'Disney+',
  'Apple TV+',
  'Max',
  'Hulu',
];

export const TasteOnboardingWizard: React.FC<TasteOnboardingWizardProps> = ({
  isOpen = true,
  onClose,
  isStandalone = false,
  onComplete,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Steps: 1: Genres, 2: Seed Titles, 3: Exclusions, 4: Streaming, 5: Calibration
  const [step, setStep] = useState<number>(1);

  // Selections
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<Title[]>([]);
  const [selectedExclusions, setSelectedExclusions] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Seed titles catalog
  const [trendingTitles, setTrendingTitles] = useState<Title[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [titleSearch, setTitleSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Calibration phase state
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationPhase, setCalibrationPhase] = useState('Initializing Taste Engine...');
  const [isDone, setIsDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize with any existing user data
  useEffect(() => {
    if (currentUser?.subscribedServices?.length) {
      setSelectedServices(currentUser.subscribedServices);
    }
    if (currentUser?.tasteProfile?.favoriteGenres?.length) {
      setSelectedGenres(currentUser.tasteProfile.favoriteGenres);
    }
    if (currentUser?.tasteProfile?.exclusions?.length) {
      setSelectedExclusions(currentUser.tasteProfile.exclusions);
    }
  }, [currentUser]);

  // Load trending titles for seed picking
  useEffect(() => {
    let isMounted = true;
    const loadTitles = async () => {
      try {
        setLoadingTitles(true);
        const data = await titleService.getTrending('all');
        if (isMounted) {
          setTrendingTitles(data.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to load seed titles:', err);
      } finally {
        if (isMounted) setLoadingTitles(false);
      }
    };
    loadTitles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced search for seed titles
  useEffect(() => {
    if (!titleSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await titleService.search(titleSearch.trim());
        setSearchResults(res.slice(0, 8));
      } catch (err) {
        console.error('Title search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [titleSearch]);

  // Toggle helpers
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleTitle = (title: Title) => {
    setSelectedTitles((prev) => {
      const exists = prev.some((t) => (t._id && t._id === title._id) || (t.tmdbId && t.tmdbId === title.tmdbId));
      if (exists) {
        return prev.filter((t) => !((t._id && t._id === title._id) || (t.tmdbId && t.tmdbId === title.tmdbId)));
      }
      return [...prev, title];
    });
  };

  const toggleExclusion = (id: string) => {
    setSelectedExclusions((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  // Calibration simulation & submit
  const handleStartCalibration = useCallback(async () => {
    setStep(5);
    setSubmitting(true);
    setCalibrationProgress(10);
    setCalibrationPhase('Analyzing favorite genre distributions...');

    const titleIds = selectedTitles.map((t) => t._id).filter(Boolean);

    try {
      // Progress simulation stages
      setTimeout(() => {
        setCalibrationProgress(35);
        setCalibrationPhase('Cross-referencing seed anchors & mood compatibility...');
      }, 500);

      setTimeout(() => {
        setCalibrationProgress(70);
        setCalibrationPhase('Configuring streaming subscription synergy filters...');
      }, 1000);

      const result = await userService.completeOnboarding({
        favoriteGenres: selectedGenres,
        favoriteTitles: titleIds,
        exclusions: selectedExclusions,
        subscribedServices: selectedServices,
      });

      setTimeout(() => {
        setCalibrationProgress(100);
        setCalibrationPhase('CineTaste Matrix successfully calibrated!');
        setIsDone(true);
        setSubmitting(false);

        // Update Redux state
        if (result?.user) {
          dispatch(
            updateUser({
              ...result.user,
              onboarded: true,
              subscribedServices: selectedServices,
              tasteProfile: result.tasteProfile,
            })
          );
        }
      }, 1500);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setCalibrationPhase('Error saving preferences. Please try again.');
      setSubmitting(false);
    }
  }, [selectedGenres, selectedTitles, selectedExclusions, selectedServices, dispatch]);

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    } else if (onClose) {
      onClose();
    } else {
      navigate('/', { replace: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        isStandalone
          ? 'min-h-[85vh] flex items-center justify-center p-4'
          : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200'
      }
    >
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
        {/* Top Header & Step Indicator */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Taste Matrix Onboarding</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  Step {step} of 4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Teach CineCircle what you love to unlock razor-sharp watch recommendations
              </p>
            </div>
          </div>

          {!isStandalone && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Tracker Bar */}
        {step <= 4 && (
          <div className="px-6 pt-3 pb-1 bg-slate-950/20 border-b border-slate-800/40">
            <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold text-slate-400">
              <div
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                  step === 1 ? 'border-indigo-500 text-indigo-400' : step > 1 ? 'border-emerald-500 text-emerald-400' : 'border-transparent'
                }`}
              >
                <span>1. Genres</span>
                {step > 1 && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
              </div>
              <div
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                  step === 2 ? 'border-indigo-500 text-indigo-400' : step > 2 ? 'border-emerald-500 text-emerald-400' : 'border-transparent'
                }`}
              >
                <span>2. Seed Titles</span>
                {step > 2 && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
              </div>
              <div
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                  step === 3 ? 'border-indigo-500 text-indigo-400' : step > 3 ? 'border-emerald-500 text-emerald-400' : 'border-transparent'
                }`}
              >
                <span>3. Exclusions</span>
                {step > 3 && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
              </div>
              <div
                className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                  step === 4 ? 'border-indigo-500 text-indigo-400' : 'border-transparent'
                }`}
              >
                <span>4. Streaming</span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* STEP 1: FAVORITE GENRES */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    What genres are you usually in the mood for?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select at least <strong className="text-indigo-400">3 genres</strong> to seed your baseline algorithm.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-indigo-300 border border-slate-700">
                  {selectedGenres.length} selected (min 3)
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {AVAILABLE_GENRES.map((g) => {
                  const Icon = g.icon;
                  const isSelected = selectedGenres.includes(g.name);
                  return (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => toggleGenre(g.name)}
                      className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-24 group ${
                        isSelected
                          ? 'bg-gradient-to-br ' + g.color + ' ring-2 ring-indigo-500/50 scale-[1.02] shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon
                          className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                            isSelected ? 'text-white' : 'text-slate-500'
                          }`}
                        />
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-indigo-500 text-white'
                              : 'border border-slate-700 bg-slate-900 group-hover:border-slate-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <span className={`text-xs font-bold font-['Outfit'] ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {g.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SEED FAVORITE TITLES */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    Select 2–4 titles you genuinely love
                  </h3>
                  <p className="text-xs text-slate-400">
                    CineCircle will use these flagship titles as taste anchors.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-indigo-300 border border-slate-700">
                  {selectedTitles.length} selected
                </div>
              </div>

              {/* Title Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search and add any favorite film or TV series..."
                  value={titleSearch}
                  onChange={(e) => setTitleSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
                )}
              </div>

              {/* Search Results if query present */}
              {titleSearch.trim() && searchResults.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Search Results
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {searchResults.map((t) => {
                      const isSelected = selectedTitles.some(
                        (st) => (st._id && st._id === t._id) || (st.tmdbId && st.tmdbId === t.tmdbId)
                      );
                      return (
                        <button
                          key={t._id || t.tmdbId}
                          type="button"
                          onClick={() => toggleTitle(t)}
                          className={`relative rounded-xl overflow-hidden text-left border transition-all duration-200 group flex flex-col bg-slate-950 ${
                            isSelected
                              ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.02]'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="aspect-[2/3] w-full bg-slate-900 relative overflow-hidden">
                            <img
                              src={t.posterUrl}
                              alt={t.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <h4 className="text-[11px] font-bold text-white truncate">{t.name}</h4>
                            <span className="text-[10px] text-slate-400">{t.releaseYear || ''}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seed Trending Titles Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Popular Flagship Titles
                </span>
                {loadingTitles ? (
                  <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="text-xs">Loading popular titles...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {trendingTitles.map((t) => {
                      const isSelected = selectedTitles.some(
                        (st) => (st._id && st._id === t._id) || (st.tmdbId && st.tmdbId === t.tmdbId)
                      );
                      return (
                        <button
                          key={t._id || t.tmdbId}
                          type="button"
                          onClick={() => toggleTitle(t)}
                          className={`relative rounded-xl overflow-hidden text-left border transition-all duration-200 group flex flex-col bg-slate-950 ${
                            isSelected
                              ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.03] shadow-lg shadow-indigo-500/20'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="aspect-[2/3] w-full bg-slate-900 relative overflow-hidden">
                            <img
                              src={t.posterUrl}
                              alt={t.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-950/80 text-amber-400 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              <span>{t.voteAverage ? t.voteAverage.toFixed(1) : '8.0'}</span>
                            </div>
                          </div>
                          <div className="p-2">
                            <h4 className="text-[11px] font-bold text-white truncate">{t.name}</h4>
                            <span className="text-[10px] text-slate-400 uppercase">{t.type}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: CONTENT EXCLUSIONS */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Hard Limits & Fatigue Filters
                </h3>
                <p className="text-xs text-slate-400">
                  Select what CineCircle should <strong className="text-rose-400">strictly exclude</strong> from your recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {COMMON_EXCLUSIONS.map((ex) => {
                  const isExcluded = selectedExclusions.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => toggleExclusion(ex.id)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start justify-between gap-3 ${
                        isExcluded
                          ? 'bg-rose-950/25 border-rose-500/50 text-white ring-1 ring-rose-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold font-['Outfit'] ${isExcluded ? 'text-rose-300' : 'text-slate-200'}`}>
                            {ex.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{ex.desc}</p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isExcluded
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'border border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isExcluded && <X className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Exclusions act as non-negotiable guards. You can update these anytime in Profile Settings.</span>
              </div>
            </div>
          )}

          {/* STEP 4: OWNED STREAMING SERVICES */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Your Subscribed Streaming Ecosystem
                </h3>
                <p className="text-xs text-slate-400">
                  Recommendations legally streaming on your owned passes get a <strong className="text-indigo-400">+15% synergy boost</strong> so you never pay extra to watch.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {STREAMING_PLATFORMS.map((service) => {
                  const isSelected = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-28 ${
                        isSelected
                          ? 'bg-indigo-950/30 border-indigo-500/50 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <StreamingBadge service={service} size="md" />
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-indigo-500 text-white'
                              : 'border border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                        <span>{isSelected ? 'Subscribed' : 'Not Active'}</span>
                        {isSelected && <span className="text-[10px] font-bold text-emerald-400">Free Stream</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                In Group Decision Mode, CineCircle matches streaming overlap across all friends in the room!
              </p>
            </div>
          )}

          {/* STEP 5: CALIBRATION & SUMMARY */}
          {step === 5 && (
            <div className="p-8 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                {/* Glowing Outer Rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 opacity-20 blur-xl animate-pulse" />
                <div
                  className={`w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  ) : (
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-['Outfit']">
                  {isDone ? 'Your CineTaste Matrix is Live! 🍿' : 'Calibrating Taste Matrix...'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">{calibrationPhase}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-sm mx-auto bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-500"
                  style={{ width: `${calibrationProgress}%` }}
                />
              </div>

              {/* Taste Matrix Summary Card */}
              {isDone && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Active Taste Profile Configuration
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Anchor Genres:</span>
                      <span className="font-semibold text-indigo-300">{selectedGenres.slice(0, 3).join(', ')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Streaming Ecosystem:</span>
                      <span className="font-semibold text-emerald-400">
                        {selectedServices.length > 0 ? selectedServices.join(', ') : 'None selected'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Exclusions:</span>
                      <span className="font-semibold text-rose-400">
                        {selectedExclusions.length > 0 ? selectedExclusions.join(', ') : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Wizard Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {step > 1 && step <= 4 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                type="button"
                disabled={step === 1 && selectedGenres.length < 3}
                onClick={() => setStep((prev) => prev + 1)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  step === 1 && selectedGenres.length < 3
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : step === 4 ? (
              <button
                type="button"
                onClick={handleStartCalibration}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <Sparkle className="w-4 h-4 fill-white" />
                <span>Calibrate Taste Matrix</span>
              </button>
            ) : isDone ? (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Enter CineCircle Feed</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

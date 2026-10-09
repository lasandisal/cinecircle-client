import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Star,
  Clock,
  Calendar,
  Tv,
  Film,
  Music,
  MessageSquare,
  Bookmark,
  Users,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Send,
  Heart,
  CheckCircle2,
  UserCheck,
  CornerDownRight,
  BarChart2,
  Smile,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Disc,
  Volume2,
  ExternalLink,
} from 'lucide-react';
import { titleService } from '../services/title.service';
import type { Title, TitleComment, ReactionEmoji } from '../types';
import { StreamingBadge } from '../components/common/StreamingBadge';
import { useAppSelector } from '../hooks/useAppRedux';

// Available Facebook/Social Emoji Reactions
const EMOJI_REACTIONS: { key: ReactionEmoji; emoji: string; label: string }[] = [
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'popcorn', emoji: '🍿', label: 'Popcorn' },
  { key: 'mindblown', emoji: '🤯', label: 'Mind Blown' },
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'sad', emoji: '😢', label: 'Emotional' },
];

// Sample mutual friends for social proof
const MOCK_MUTUAL_FRIENDS = [
  {
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    rating: 5,
    note: 'Masterpiece television.',
  },
  {
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    rating: 4.5,
    note: 'Unreal sound design & scale.',
  },
  {
    name: 'Jordan Hayes',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    rating: 5,
    note: 'Comfort rewatch forever.',
  },
];

export const TitleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as 'film' | 'tv' | null;

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive user actions (like / watched / star rating)
  const [isWatched, setIsWatched] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Season selector and expandable episode accordion state
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
  const [loadingSeasonEpisodes, setLoadingSeasonEpisodes] = useState<boolean>(false);
  const [activePlayingSong, setActivePlayingSong] = useState<string | null>(null);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlaySong = (songName: string, previewUrl?: string) => {
    if (activePlayingSong === songName) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setActivePlayingSong(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (previewUrl) {
        const audio = new Audio(previewUrl);
        audio.volume = 0.7;
        audio.onended = () => setActivePlayingSong(null);
        audio.onerror = () => {
          console.warn('Audio preview playback failed');
          setActivePlayingSong(null);
        };
        audio.play().catch(() => setActivePlayingSong(null));
        audioPlayerRef.current = audio;
      }
      setActivePlayingSong(songName);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [id]);

  const handleSelectSeason = async (seasonNum: number) => {
    setSelectedSeason(seasonNum);
    setExpandedEpisode(null);

    const activeSeason = title?.seasons?.find((s) => s.seasonNumber === seasonNum);
    const hasGeneric =
      !activeSeason ||
      !activeSeason.episodes ||
      activeSeason.episodes.length === 0 ||
      activeSeason.episodes.some((e) => !e.stillUrl && e.name.match(/^Episode \d+$/i));

    if (hasGeneric && (title?._id || id)) {
      setLoadingSeasonEpisodes(true);
      try {
        const seasonData = await titleService.getSeasonEpisodes(title?._id || id!, seasonNum);
        if (seasonData && title) {
          setTitle({
            ...title,
            seasons: title.seasons?.map((s) => (s.seasonNumber === seasonNum ? seasonData : s)),
          });
        }
      } catch (err) {
        console.error('Failed to load season episodes:', err);
      } finally {
        setLoadingSeasonEpisodes(false);
      }
    }
  };

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [commentRating, setCommentRating] = useState<number>(5);
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  // Poll attachment state
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');

  // Threaded reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Reaction picker hover state (commentId -> boolean)
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);

  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await titleService.getTitleDetails(id, typeParam || undefined);
        setTitle(data);
        if (data.seasons && data.seasons.length > 0) {
          setSelectedSeason(data.seasons[0].seasonNumber);
        }
      } catch (err: any) {
        console.error('Failed to load title details:', err);
        setError('Failed to load title details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, typeParam]);

  // Deduplicate and prioritize famous streaming services first (Netflix, Prime Video, Max, Disney+, Apple TV+, Hulu, etc.)
  const { primaryProviders, hiddenProviders, allProvidersCount } = useMemo(() => {
    if (!title?.watchProviders) return { primaryProviders: [], hiddenProviders: [], allProvidersCount: 0 };

    const map = new Map<string, { service: string; type: string; regions: string[] }>();
    for (const wp of title.watchProviders) {
      const key = wp.service.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { service: wp.service, type: wp.type, regions: [wp.region] });
      } else {
        const item = map.get(key)!;
        if (!item.regions.includes(wp.region)) {
          item.regions.push(wp.region);
        }
      }
    }

    const list = Array.from(map.values());

    const FAMOUS_SERVICES = [
      'netflix',
      'prime video',
      'amazon',
      'max',
      'hbo',
      'disney+',
      'apple tv+',
      'apple tv',
      'hulu',
      'paramount+',
      'peacock',
    ];

    const getRank = (serviceName: string) => {
      const lower = serviceName.toLowerCase().trim();
      const idx = FAMOUS_SERVICES.findIndex((f) => lower.includes(f) || f.includes(lower));
      return idx === -1 ? 999 : idx;
    };

    const isFamous = (serviceName: string) => getRank(serviceName) !== 999;

    const famous = list
      .filter((p) => isFamous(p.service))
      .sort((a, b) => getRank(a.service) - getRank(b.service));

    const others = list
      .filter((p) => !isFamous(p.service))
      .sort((a, b) => a.service.localeCompare(b.service));

    // Show up to 4 famous services in primary list; if fewer than 3 famous, fill with others up to 3
    let primary: typeof list = [];
    let hidden: typeof list = [];

    if (famous.length >= 3) {
      const primaryCount = Math.min(famous.length, 4);
      primary = famous.slice(0, primaryCount);
      hidden = [...famous.slice(primaryCount), ...others];
    } else {
      primary = [...famous, ...others.slice(0, Math.max(0, 3 - famous.length))];
      hidden = others.slice(Math.max(0, 3 - famous.length));
    }

    return {
      primaryProviders: primary,
      hiddenProviders: hidden,
      allProvidersCount: list.length,
    };
  }, [title?.watchProviders]);

  // Deduplicate soundtracks by song name & artist
  const uniqueSoundtracks = useMemo(() => {
    if (!title?.soundtracks) return [];
    const seen = new Set<string>();
    return title.soundtracks.filter((track) => {
      const key = `${track.songName.toLowerCase().trim()}-${track.artist.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [title?.soundtracks]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    try {
      const pollPayload =
        showPollForm && pollQuestion.trim() && pollOption1.trim() && pollOption2.trim()
          ? {
              question: pollQuestion.trim(),
              options: [pollOption1.trim(), pollOption2.trim()],
            }
          : undefined;

      const added = await titleService.addComment(
        title?._id || id,
        newComment.trim(),
        commentRating,
        hasSpoiler,
        null,
        pollPayload
      );

      if (title) {
        setTitle({
          ...title,
          comments: [added, ...(title.comments || [])],
        });
      }
      setNewComment('');
      setHasSpoiler(false);
      setShowPollForm(false);
      setPollQuestion('');
      setPollOption1('');
      setPollOption2('');
    } catch (err: any) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePostReply = async (parentCommentId: string) => {
    if (!id || !replyText.trim() || !isAuthenticated) return;

    setSubmittingReply(true);
    try {
      const addedReply = await titleService.addComment(
        title?._id || id,
        replyText.trim(),
        undefined,
        false,
        parentCommentId
      );

      if (title && title.comments) {
        setTitle({
          ...title,
          comments: title.comments.map((c) => {
            if (c._id === parentCommentId) {
              return {
                ...c,
                replies: [...(c.replies || []), addedReply],
              };
            }
            return c;
          }),
        });
      }
      setReplyingToId(null);
      setReplyText('');
    } catch (err: any) {
      console.error('Error posting reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReaction = async (commentId: string, emoji: ReactionEmoji) => {
    if (!isAuthenticated) return;
    setActiveReactionPicker(null);

    try {
      const updated = await titleService.reactToComment(commentId, emoji);
      if (title && title.comments) {
        setTitle({
          ...title,
          comments: title.comments.map((c) => (c._id === commentId ? { ...c, reactions: updated.reactions } : c)),
        });
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handlePollVote = async (commentId: string, optionIndex: number) => {
    if (!isAuthenticated) return;

    try {
      const updated = await titleService.voteCommentPoll(commentId, optionIndex);
      if (title && title.comments) {
        setTitle({
          ...title,
          comments: title.comments.map((c) => (c._id === commentId ? { ...c, poll: updated.poll } : c)),
        });
      }
    } catch (err) {
      console.error('Failed to vote on poll:', err);
    }
  };

  const toggleLikeTitle = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const toggleSpoiler = (commentId: string) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400">Loading film details & streaming sources...</p>
      </div>
    );
  }

  if (error || !title) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Title Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested movie or series could not be retrieved from the catalogue.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Feed
        </Link>
      </div>
    );
  }

  const activeSeasonData = title.seasons?.find((s) => s.seasonNumber === selectedSeason);

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8 animate-in fade-in duration-300">
      {/* Back Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl">
        {/* Backdrop Image */}
        {title.backdropUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={title.backdropUrl}
              alt={title.name}
              className="w-full h-full object-cover opacity-25 filter blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Poster */}
          <div className="w-40 sm:w-48 md:w-56 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-800 bg-slate-950">
            {title.posterUrl ? (
              <img
                src={title.posterUrl}
                alt={title.name}
                className="w-full h-auto aspect-[2/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] flex items-center justify-center text-slate-600">
                <Film className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {title.type === 'film' ? 'Film' : 'TV Series'}
              </span>
              {title.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-['Outfit'] tracking-tight">
                {title.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                {title.releaseYear && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {title.releaseYear}
                  </span>
                )}
                {title.runtimeMinutes > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {title.runtimeMinutes} min
                  </span>
                )}
                {title.voteAverage ? (
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {title.voteAverage} / 10
                  </span>
                ) : null}
              </div>
            </div>

            {/* Mood Tags */}
            {title.moodTags && title.moodTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {title.moodTags.map((mood) => (
                  <span
                    key={mood}
                    className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-0.5 rounded-lg"
                  >
                    #{mood}
                  </span>
                ))}
              </div>
            )}

            {/* Interactive Social Action Dock (Like, Watched, Rate) */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Watched Toggle */}
              <button
                type="button"
                onClick={() => setIsWatched(!isWatched)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isWatched
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${isWatched ? 'text-emerald-400' : 'text-slate-400'}`}
                />
                <span>{isWatched ? 'Watched' : 'Mark as Watched'}</span>
              </button>

              {/* Like Toggle */}
              <button
                type="button"
                onClick={toggleLikeTitle}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
                />
                <span>{likeCount}</span>
              </button>

              {/* Interactive Star Rating */}
              <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
                <span className="text-[11px] text-slate-400 mr-1.5">Your Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(star)}
                    className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        (hoverRating || userRating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                {userRating > 0 && (
                  <span className="text-[11px] font-bold text-amber-400 ml-1">
                    {userRating}.0
                  </span>
                )}
              </div>
            </div>

            {/* Quick Navigation Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/group"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Add to Group Circle</span>
              </Link>
              <Link
                to="/watchlist"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-xs transition-all"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Save to Watchlist</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mutual Watched Friend Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 overflow-hidden shrink-0">
            {MOCK_MUTUAL_FRIENDS.map((f, i) => (
              <img
                key={i}
                src={f.avatar}
                alt={f.name}
                className="inline-block w-8 h-8 rounded-full ring-2 ring-slate-950 object-cover"
              />
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Watched by <strong className="text-white">Elena Rostova</strong>,{' '}
              <strong className="text-white">Marcus Vance</strong>, and 4 other mutuals
            </p>
            <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-slate-400">
              {MOCK_MUTUAL_FRIENDS.map((f, i) => (
                <span key={i} className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-slate-300 font-medium">{f.name.split(' ')[0]}:</span>{' '}
                  <span className="text-slate-400 italic">"{f.note}"</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-xl shrink-0 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> 89% Taste Match
        </span>
      </div>

      {/* Main Grid: Details + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Synopsis, Cast, Seasons, Discussion */}
        <div className="lg:col-span-2 space-y-8">
          {/* Synopsis */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Storyline</h2>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {title.synopsis || 'No synopsis available for this title.'}
            </p>
          </div>

          {/* Cast */}
          {title.cast && title.cast.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Top Cast & Characters
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {title.cast.map((actor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                      {actor.photoUrl ? (
                        <img
                          src={actor.photoUrl}
                          alt={actor.actorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500">
                          {actor.actorName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{actor.actorName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{actor.characterName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TV Seasons & Episodes with Interactive Season Selector */}
          {title.type === 'tv' && title.seasons && title.seasons.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
                  <Tv className="w-4 h-4 text-indigo-400" />
                  <span>Seasons & Episodes</span>
                </div>

                {/* Interactive Season Pill Selector */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {title.seasons.map((season) => (
                    <button
                      key={season.seasonNumber}
                      type="button"
                      onClick={() => handleSelectSeason(season.seasonNumber)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSeason === season.seasonNumber
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      Season {season.seasonNumber}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading Season State */}
              {loadingSeasonEpisodes && (
                <div className="flex items-center justify-center py-8 gap-2 text-xs font-medium text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading full episodes & soundtracks from TMDB...</span>
                </div>
              )}

              {/* Active Season Episodes - Clickable Accordion */}
              {!loadingSeasonEpisodes && activeSeasonData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                    <span>Season {activeSeasonData.seasonNumber}</span>
                    <span>{activeSeasonData.episodes.length} Episodes • Click episode to expand summary</span>
                  </div>

                  <div className="space-y-2.5">
                    {activeSeasonData.episodes.map((ep) => {
                      const isExpanded = expandedEpisode === ep.episodeNumber;
                      return (
                        <div
                          key={ep.episodeNumber}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isExpanded
                              ? 'bg-slate-950/90 border-indigo-500/50 shadow-lg shadow-indigo-950/20'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          {/* Clickable Header */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedEpisode(isExpanded ? null : ep.episodeNumber)
                            }
                            className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                                {ep.episodeNumber}
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-white block truncate">
                                  {ep.name}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  {ep.airDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-2.5 h-2.5 text-slate-500" />
                                      {ep.airDate}
                                    </span>
                                  )}
                                  {ep.voteAverage && ep.voteAverage > 0 ? (
                                    <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                                      {ep.voteAverage}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {ep.runtimeMinutes} min
                              </span>
                              <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Expanded Content Drawer */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 space-y-3.5 animate-in fade-in duration-200">
                              <div className="flex flex-col sm:flex-row gap-4">
                                {/* Episode Thumbnail Still */}
                                {ep.stillUrl ? (
                                  <div className="w-full sm:w-48 h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative group">
                                    <img
                                      src={ep.stillUrl}
                                      alt={ep.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                                        Episode Still
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full sm:w-48 h-28 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col items-center justify-center text-slate-500 shrink-0 gap-1">
                                    <Tv className="w-5 h-5 text-slate-600" />
                                    <span className="text-[10px]">Episode {ep.episodeNumber}</span>
                                  </div>
                                )}

                                {/* Episode Synopsis */}
                                <div className="flex-1 space-y-2">
                                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Episode Synopsis
                                  </h4>
                                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                    {ep.summary ||
                                      'No extended synopsis recorded for this episode yet.'}
                                  </p>
                                </div>
                              </div>

                              {/* Featured Song / Music in Episode */}
                              {ep.featuredSong && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                      <Music className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-white truncate">
                                          {ep.featuredSong.songName}
                                        </span>
                                        <span className="text-[10px] text-slate-400 truncate">
                                          • {ep.featuredSong.artist}
                                        </span>
                                      </div>
                                      {ep.featuredSong.sceneRef && (
                                        <p className="text-[10px] text-emerald-300/80 truncate">
                                          Scene: {ep.featuredSong.sceneRef}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold shrink-0 flex items-center gap-1">
                                    <Volume2 className="w-2.5 h-2.5" /> Featured Song
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !loadingSeasonEpisodes ? (
                <p className="text-xs text-slate-500">Select a season to view episodes.</p>
              ) : null}
            </div>
          )}

          {/* Dedicated Official Soundtrack & Iconic Featured Songs Section */}
          {uniqueSoundtracks.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Disc className={`w-4 h-4 ${activePlayingSong ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      Official Soundtrack & Iconic Featured Songs
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        30s Audio Previews
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Iconic tracks played in pivotal scenes throughout {title.name}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 font-mono self-start sm:self-auto">
                  {uniqueSoundtracks.length} track{uniqueSoundtracks.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Modern User-Friendly Tracklist */}
              <div className="space-y-2">
                {uniqueSoundtracks.map((track, idx) => {
                  const isPlaying = activePlayingSong === track.songName;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        isPlaying
                          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700/90 hover:bg-slate-950/90'
                      }`}
                    >
                      {/* Left: Track # + Album Art + Song Name & Artist */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Index Number */}
                        <span className="text-xs font-mono font-bold text-slate-500 w-5 text-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Album Art or Vinyl Icon */}
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 group/cover">
                          {track.albumArtUrl ? (
                            <img
                              src={track.albumArtUrl}
                              alt={track.songName}
                              className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Music className="w-5 h-5" />
                            </div>
                          )}
                          {/* Overlay Play/Pause Icon */}
                          <button
                            type="button"
                            onClick={() => handleTogglePlaySong(track.songName, track.previewUrl)}
                            className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity cursor-pointer ${
                              isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                            ) : (
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            )}
                          </button>
                        </div>

                        {/* Track Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                              {track.songName}
                            </p>
                            {isPlaying && (
                              <div className="flex items-center gap-0.5">
                                <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce"></span>
                                <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                          {track.episodeRef && (
                            <p className="text-[10px] text-emerald-400/90 font-medium truncate mt-0.5 sm:hidden">
                              {track.episodeRef}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Middle: Scene / Episode Context Tag (Desktop) */}
                      {track.episodeRef && (
                        <div className="hidden sm:block max-w-xs text-right">
                          <span className="inline-block text-[10px] text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 truncate">
                            {track.episodeRef}
                          </span>
                        </div>
                      )}

                      {/* Right: Audio Action Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {track.previewUrl ? (
                          <button
                            type="button"
                            onClick={() => handleTogglePlaySong(track.songName, track.previewUrl)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              isPlaying
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/25'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>30s Sample</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No audio preview</span>
                        )}

                        {track.spotifyUrl && (
                          <a
                            href={track.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open full track in Apple Music / iTunes"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Discussion & Enthusiast Comments (Facebook-Style Reactions, Threaded Replies, and Polls) */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <span>Discussion, Reviews & Community Polls</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {title.comments?.length || 0} discussion{title.comments?.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Comment Form with Rating Selector & Poll Toggle */}
            {isAuthenticated ? (
              <form
                onSubmit={handlePostComment}
                className="space-y-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Your rating & review:
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCommentRating(star)}
                        className="cursor-pointer p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            commentRating >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-1">
                      {commentRating}.0
                    </span>
                  </div>
                </div>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on the plot, character arcs, or score..."
                  rows={3}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />

                {/* Optional Community Poll Accordion */}
                {showPollForm && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> Community Poll Question
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPollForm(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        Cancel Poll
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Which season had the best finale?"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Option 1 (e.g. Season 1)"
                        value={pollOption1}
                        onChange={(e) => setPollOption1(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Option 2 (e.g. Season 4)"
                        value={pollOption2}
                        onChange={(e) => setPollOption2(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasSpoiler}
                        onChange={(e) => setHasSpoiler(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                      />
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Contains Spoilers
                      </span>
                    </label>

                    {!showPollForm && (
                      <button
                        type="button"
                        onClick={() => setShowPollForm(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Attach Poll</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Post Review</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1.5">
                <p className="text-xs font-bold text-slate-200">Join the discussion</p>
                <p className="text-[11px] text-slate-400">
                  <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
                    Sign in
                  </Link>{' '}
                  or{' '}
                  <Link to="/register" className="text-indigo-400 hover:underline font-semibold">
                    create a free account
                  </Link>{' '}
                  to react, reply, vote on polls, and post your review.
                </p>
              </div>
            )}

            {/* Comments Thread List */}
            <div className="space-y-4 pt-2">
              {title.comments && title.comments.length > 0 ? (
                title.comments.map((comment: TitleComment) => {
                  const isSpoiler = comment.containsSpoilers;
                  const isRevealed = revealedSpoilers[comment._id];

                  // Count reactions grouped by emoji
                  const reactionCounts: Record<string, number> = {};
                  (comment.reactions || []).forEach((r) => {
                    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
                  });

                  // Has current user reacted?
                  const userReaction = (comment.reactions || []).find(
                    (r) => r.user === currentUser?._id
                  );

                  // Calculate poll votes total
                  const totalPollVotes = comment.poll?.options.reduce(
                    (acc, opt) => acc + opt.votes.length,
                    0
                  ) || 0;

                  return (
                    <div
                      key={comment._id}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3"
                    >
                      {/* Comment Header */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-[11px] text-white shadow-sm">
                            {comment.user?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{comment.user?.name || 'User'}</span>
                              {comment.user?.role === 'admin' && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-semibold">
                                  Curator
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {comment.rating && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {comment.rating}.0
                          </span>
                        )}
                      </div>

                      {/* Comment Text / Spoiler */}
                      {isSpoiler && !isRevealed ? (
                        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Review marked as spoiler
                          </span>
                          <button
                            onClick={() => toggleSpoiler(comment._id)}
                            className="text-xs text-amber-400 underline font-semibold cursor-pointer"
                          >
                            Reveal Spoiler
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-200 leading-relaxed font-normal">
                          {comment.text}
                        </p>
                      )}

                      {/* Embedded Community Poll (if attached) */}
                      {comment.poll && (
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                              {comment.poll.question}
                            </span>
                            <span className="text-[10px] text-slate-400">{totalPollVotes} votes</span>
                          </div>

                          <div className="space-y-2">
                            {comment.poll.options.map((opt, optIdx) => {
                              const voteCount = opt.votes.length;
                              const percent = totalPollVotes > 0 ? Math.round((voteCount / totalPollVotes) * 100) : 0;
                              const hasVotedThis = currentUser?._id && opt.votes.includes(currentUser._id);

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={!isAuthenticated}
                                  onClick={() => handlePollVote(comment._id, optIdx)}
                                  className={`w-full relative overflow-hidden rounded-xl p-2.5 border text-left transition-all ${
                                    hasVotedThis
                                      ? 'border-indigo-500 bg-indigo-950/40'
                                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                                  }`}
                                >
                                  {/* Progress bar background fill */}
                                  <div
                                    className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                  />
                                  <div className="relative z-10 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                      {hasVotedThis && <Check className="w-3 h-3 text-indigo-400" />}
                                      {opt.optionText}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-400">
                                      {percent}% ({voteCount})
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Social Reaction Counts & Action Bar */}
                      <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                        {/* Display Active Emoji Reaction Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Object.entries(reactionCounts).map(([emojiKey, count]) => {
                            const found = EMOJI_REACTIONS.find((e) => e.key === emojiKey);
                            const isMyReaction = userReaction?.emoji === emojiKey;

                            return (
                              <button
                                key={emojiKey}
                                type="button"
                                onClick={() => handleReaction(comment._id, emojiKey as ReactionEmoji)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                                  isMyReaction
                                    ? 'bg-indigo-600/25 border-indigo-500/50 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <span>{found?.emoji || '👍'}</span>
                                <span>{count}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Reaction Picker & Reply Buttons */}
                        <div className="relative flex items-center gap-3">
                          {/* Facebook-style Reaction Popover */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveReactionPicker(
                                  activeReactionPicker === comment._id ? null : comment._id
                                )
                              }
                              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                              <Smile className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{userReaction ? 'Reacted' : 'React'}</span>
                            </button>

                            {/* Floating Reaction Bar */}
                            {activeReactionPicker === comment._id && (
                              <div className="absolute left-0 bottom-full mb-2 bg-slate-900 border border-slate-700/80 rounded-full px-2.5 py-1.5 shadow-2xl flex items-center gap-2 z-30 animate-in zoom-in-95 duration-150 backdrop-blur-md">
                                {EMOJI_REACTIONS.map((item) => (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => handleReaction(comment._id, item.key)}
                                    className="text-base hover:scale-130 transition-transform p-0.5 cursor-pointer"
                                    title={item.label}
                                  >
                                    {item.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Reply Toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              setReplyingToId(replyingToId === comment._id ? null : comment._id)
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline Reply Input Box */}
                      {replyingToId === comment._id && (
                        <div className="pt-2 pl-4 border-l-2 border-indigo-500/40 space-y-2 animate-in fade-in duration-150">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${comment.user?.name || 'this review'}...`}
                            rows={2}
                            className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(null);
                                setReplyText('');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!replyText.trim() || submittingReply}
                              onClick={() => handlePostReply(comment._id)}
                              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              {submittingReply ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Nested Threaded Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pt-2 pl-4 space-y-2.5 border-l-2 border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            {comment.replies.length} Repl{comment.replies.length === 1 ? 'y' : 'ies'}
                          </span>
                          {comment.replies.map((reply) => (
                            <div
                              key={reply._id}
                              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded bg-violet-600/30 flex items-center justify-center font-bold text-[9px] text-violet-300">
                                    {reply.user?.name?.charAt(0) || 'U'}
                                  </div>
                                  <span className="font-semibold text-white">
                                    {reply.user?.name || 'User'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                                {reply.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Deduplicated Streaming Providers & Soundtracks */}
        <div className="space-y-6">
          {/* Where to Stream (Famous Global Platforms First + Collapsible Others) */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-cyan-400" /> Where to Stream
              </h2>
              {allProvidersCount > 0 && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {allProvidersCount} source{allProvidersCount === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {primaryProviders.length > 0 ? (
              <div className="space-y-2">
                {/* Most Famous Streaming Platforms (Top 3-4 e.g. Netflix, Prime Video, Max, etc.) */}
                {primaryProviders.map((wp, idx) => (
                  <div
                    key={`prim-${idx}`}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StreamingBadge service={wp.service} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-white transition-colors">
                          {wp.service}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {wp.regions.join(' • ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/80 shrink-0">
                      {wp.type}
                    </span>
                  </div>
                ))}

                {/* Collapsible Other Services (e.g. YouTube TV, TBS, JioHotstar, Crave, etc.) */}
                {showAllProviders && hiddenProviders.length > 0 && (
                  <div className="pt-2.5 space-y-2 border-t border-slate-800/70 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Additional & Regional Networks
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {hiddenProviders.length} platforms
                      </span>
                    </div>

                    {hiddenProviders.map((wp, idx) => (
                      <div
                        key={`hidden-${idx}`}
                        className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <StreamingBadge service={wp.service} size="sm" />
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-slate-300 block truncate">
                              {wp.service}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {wp.regions.join(' • ')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                          {wp.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* See All / Show Less Toggle Button */}
                {hiddenProviders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllProviders(!showAllProviders)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    {showAllProviders ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>
                          See All Available Sources ({hiddenProviders.length} more)
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Streaming availability not yet indexed for this region.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

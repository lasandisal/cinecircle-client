import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  ThumbsUp,
  UserCheck,
} from 'lucide-react';
import { titleService } from '../services/title.service';
import type { Title } from '../types';
import { StreamingBadge } from '../components/common/StreamingBadge';
import { useAppSelector } from '../hooks/useAppRedux';

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
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive user actions (like / watched / star rating)
  const [isWatched, setIsWatched] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Season selector for TV shows
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [commentRating, setCommentRating] = useState<number>(5);
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await titleService.getTitleDetails(id);
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
  }, [id]);

  // Deduplicate watch providers (group by service and list regions)
  const deduplicatedProviders = useMemo(() => {
    if (!title?.watchProviders) return [];
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
    return Array.from(map.values());
  }, [title?.watchProviders]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    try {
      const added = await titleService.addComment(
        title?._id || id,
        newComment.trim(),
        commentRating,
        hasSpoiler
      );

      if (title) {
        setTitle({
          ...title,
          comments: [added, ...(title.comments || [])],
        });
      }
      setNewComment('');
      setHasSpoiler(false);
    } catch (err: any) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (likedComments[commentId]) return;
    setLikedComments((prev) => ({ ...prev, [commentId]: true }));

    try {
      await titleService.likeComment(commentId);
      if (title && title.comments) {
        setTitle({
          ...title,
          comments: title.comments.map((c) =>
            c._id === commentId ? { ...c, likesCount: (c.likesCount || 0) + 1 } : c
          ),
        });
      }
    } catch (err) {
      console.error('Failed to like comment:', err);
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
                      onClick={() => setSelectedSeason(season.seasonNumber)}
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

              {/* Active Season Episodes */}
              {activeSeasonData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                    <span>Season {activeSeasonData.seasonNumber}</span>
                    <span>{activeSeasonData.episodes.length} Episodes</span>
                  </div>

                  <div className="space-y-2.5">
                    {activeSeasonData.episodes.map((ep) => (
                      <div
                        key={ep.episodeNumber}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-white">
                            {ep.episodeNumber}. {ep.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {ep.runtimeMinutes} min
                          </span>
                        </div>
                        {ep.summary && (
                          <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                            {ep.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select a season to view episodes.</p>
              )}
            </div>
          )}

          {/* Discussion & Enthusiast Comments */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <span>Discussion & Reviews</span>
              </div>
              <span className="text-xs text-slate-500">
                {title.comments?.length || 0} review{title.comments?.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Comment Form with Rating Selector */}
            {isAuthenticated ? (
              <form onSubmit={handlePostComment} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Leave your rating & review:
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
                  placeholder="What did you think of the pacing, performances, or twists?"
                  rows={3}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />

                <div className="flex items-center justify-between">
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
                  to post your star rating and review.
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              {title.comments && title.comments.length > 0 ? (
                title.comments.map((comment) => {
                  const isSpoiler = comment.containsSpoilers;
                  const isRevealed = revealedSpoilers[comment._id];
                  const hasLiked = likedComments[comment._id];

                  return (
                    <div
                      key={comment._id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-600/30 flex items-center justify-center font-bold text-[10px] text-indigo-300">
                            {comment.user?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="font-bold text-white">{comment.user?.name || 'User'}</span>
                          {comment.user?.role === 'admin' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                              Curator
                            </span>
                          )}
                          {comment.rating && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {comment.rating}.0
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {isSpoiler && !isRevealed ? (
                        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs text-amber-300">
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
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {comment.text}
                        </p>
                      )}

                      {/* Comment Actions (Like with Counter) */}
                      <div className="flex items-center gap-4 pt-1 border-t border-slate-900 text-xs">
                        <button
                          type="button"
                          onClick={() => handleLikeComment(comment._id)}
                          className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                            hasLiked
                              ? 'text-indigo-400'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-indigo-400' : ''}`} />
                          <span>{comment.likesCount || 0} Helpful</span>
                        </button>
                      </div>
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
          {/* Where to Stream (Deduplicated with Region Tags) */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-cyan-400" /> Where to Stream
            </h2>

            {deduplicatedProviders.length > 0 ? (
              <div className="space-y-2">
                {deduplicatedProviders.map((wp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <StreamingBadge service={wp.service} size="sm" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">
                          {wp.service}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {wp.regions.join(' • ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {wp.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Streaming availability not yet indexed for this region.
              </p>
            )}
          </div>

          {/* Curated Soundtracks & Score */}
          {title.soundtracks && title.soundtracks.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-pink-400" /> Soundtracks & Score
              </h2>
              <div className="space-y-2">
                {title.soundtracks.map((track, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{track.songName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                    {track.episodeRef && (
                      <span className="text-[10px] text-indigo-400 font-mono shrink-0">
                        {track.episodeRef}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

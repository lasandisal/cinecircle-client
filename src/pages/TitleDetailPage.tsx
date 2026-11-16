import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
  Search,
  Plus,
  X,
} from 'lucide-react';
import { titleService } from '../services/title.service';
import { watchlistService } from '../services/watchlist.service';
import type { Title, TitleComment, ReactionEmoji } from '../types';
import { StreamingBadge } from '../components/common/StreamingBadge';
import { ExternalRatings } from '../components/common/ExternalRatings';
import { useToast } from '../hooks/useToast';
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

export const TitleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as 'film' | 'tv' | null;
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);
  const toast = useToast();

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive user actions (like / watched / star rating / watchlist)
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [watchlistActionLoading, setWatchlistActionLoading] = useState(false);

  // Sync real title likes and user like status from title data
  useEffect(() => {
    if (title) {
      setIsLiked(!!title.isLiked);
      setLikeCount(title.likesCount ?? 0);
    }
  }, [title]);

  // Sync real watchlist and watched status from MongoDB on title load
  useEffect(() => {
    const fetchWatchlistStatus = async () => {
      if (!isAuthenticated || !title?._id) return;
      try {
        const status = await watchlistService.getTitleStatus(title._id);
        setIsInWatchlist(status.inWatchlist);
        setIsWatched(status.watched);
        if (status.starRating) {
          setUserRating(status.starRating);
        }
      } catch (err) {
        console.error('Failed to load title watchlist status:', err);
      }
    };
    fetchWatchlistStatus();
  }, [isAuthenticated, title?._id]);

  // Track which poll option the current user voted for (persists across refresh)
  const [myVotesMap, setMyVotesMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!currentUser?._id || !title?.comments) return;
    const votesMap = new Map<string, number>();
    title.comments.forEach((comment: TitleComment) => {
      if (comment.poll?.options) {
        const idx = comment.poll.options.findIndex((opt: any) =>
          opt.votes.includes(currentUser._id)
        );
        if (idx >= 0) votesMap.set(comment._id, idx);
      }
    });
    setMyVotesMap(votesMap);
  }, [currentUser?._id, title?.comments]);

  const requireAuth = (): boolean => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return false;
    }
    return true;
  };

  const toggleLikeTitle = async () => {
    if (!requireAuth()) return;
    const titleTargetId = title?._id || (title as any)?.id || id;
    if (!titleTargetId) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic UI update
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await titleService.toggleLikeTitle(String(titleTargetId));
      setIsLiked(res.isLiked);
      setLikeCount(res.likesCount);
      setTitle((prev) => (prev ? { ...prev, isLiked: res.isLiked, likesCount: res.likesCount } : prev));
    } catch (err: any) {
      console.error('Failed to toggle title like:', err);
      // Revert on error
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(err?.response?.data?.error || err?.message || 'Could not update like status');
    }
  };

  const toggleWatchedTitle = async () => {
    if (!requireAuth()) return;
    if (!title?._id) return;
    const nextWatched = !isWatched;
    try {
      setIsWatched(nextWatched);

      // Ensure the title exists in the watchlist first (upsert is a no-op if already saved),
      // otherwise markAsWatched hits a 404 because there's no watchlist row to update.
      await watchlistService.addToWatchlist(title._id);
      await watchlistService.markAsWatched(title._id, nextWatched);

      setIsInWatchlist(true);

      if (currentUser) {
        setTitle((prev) => {
          if (!prev) return prev;
          const currentWatchers = prev.communityWatchers || [];
          const myId = currentUser._id || (currentUser as any).id;
          if (nextWatched) {
            const exists = currentWatchers.some((w) => w.userId === myId);
            if (!exists) {
              const newWatcher = {
                userId: myId,
                name: currentUser.name,
                handle: currentUser.handle,
                avatar:
                  currentUser.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6366f1&color=fff`,
                starRating: userRating || undefined,
                watchedAt: new Date().toISOString(),
              };
              return { ...prev, communityWatchers: [newWatcher, ...currentWatchers] };
            }
          } else {
            return {
              ...prev,
              communityWatchers: currentWatchers.filter((w) => w.userId !== myId),
            };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to update watched status:', err);
      // Revert optimistic state on failure so the UI reflects reality
      setIsWatched(!nextWatched);
    }
  };

  const handleRateTitle = async (star: number) => {
    if (!requireAuth()) return;
    if (!title?._id) return;
    try {
      setUserRating(star);
      setIsWatched(true);
      setIsInWatchlist(true);
      await watchlistService.rateTitle(title._id, star);

      if (currentUser) {
        setTitle((prev) => {
          if (!prev) return prev;
          const currentWatchers = prev.communityWatchers || [];
          const myId = currentUser._id || (currentUser as any).id;
          const exists = currentWatchers.some((w) => w.userId === myId);
          if (exists) {
            return {
              ...prev,
              communityWatchers: currentWatchers.map((w) =>
                w.userId === myId ? { ...w, starRating: star } : w
              ),
            };
          } else {
            const newWatcher = {
              userId: myId,
              name: currentUser.name,
              handle: currentUser.handle,
              avatar:
                currentUser.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6366f1&color=fff`,
              starRating: star,
              watchedAt: new Date().toISOString(),
            };
            return { ...prev, communityWatchers: [newWatcher, ...currentWatchers] };
          }
        });
      }
      toast.success(`Rated ${star}/5.`);
    } catch (err) {
      console.error('Failed to rate title:', err);
      toast.error('Could not save your rating. Please try again.');
    }
  };

  const handleToggleWatchlist = async () => {
    if (!requireAuth()) return;
    if (!title?._id) return;
    try {
      setWatchlistActionLoading(true);
      if (isInWatchlist) {
        await watchlistService.removeFromWatchlist(title._id);
        setIsInWatchlist(false);
        setIsWatched(false);
      } else {
        await watchlistService.addToWatchlist(title._id);
        setIsInWatchlist(true);
      }
      toast.success(isInWatchlist ? 'Removed from watchlist.' : 'Added to watchlist.');
    } catch (err) {
      console.error('Failed to update watchlist:', err);
      toast.error('Could not update your watchlist. Please try again.');
    } finally {
      setWatchlistActionLoading(false);
    }
  };

  // Season selector and expandable episode accordion state
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
  const [loadingSeasonEpisodes, setLoadingSeasonEpisodes] = useState<boolean>(false);
  const [activePlayingSong, setActivePlayingSong] = useState<string | null>(null);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Soundtrack search filter & user contribution state
  const [soundtrackSearchQuery, setSoundtrackSearchQuery] = useState('');
  const [showAllSoundtracks, setShowAllSoundtracks] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [addSongQuery, setAddSongQuery] = useState('');
  const [addSongSearching, setAddSongSearching] = useState(false);
  const [addSongSearched, setAddSongSearched] = useState(false);
  const [addSongError, setAddSongError] = useState<string | null>(null);
  const [addSongResults, setAddSongResults] = useState<any[]>([]);
  const [selectedAddSong, setSelectedAddSong] = useState<any | null>(null);
  const [addSongSceneRef, setAddSongSceneRef] = useState('');
  const [submittingAddSong, setSubmittingAddSong] = useState(false);
  const [addSongSuccess, setAddSongSuccess] = useState<string | null>(null);

  const handleSearchMusic = async (q: string) => {
    if (!q.trim()) {
      setAddSongResults([]);
      setAddSongError(null);
      setAddSongSearched(false);
      return;
    }
    setAddSongSearching(true);
    setAddSongError(null);
    try {
      const results = await titleService.searchMusic(q.trim(), title?.name);
      setAddSongResults(results || []);
      setAddSongSearched(true);
    } catch (err: any) {
      console.error('Failed to search music:', err);
      setAddSongResults([]);
      setAddSongSearched(true);
      setAddSongError(
        err?.response?.data?.error ||
          'Could not reach Apple Music right now. Please try again.'
      );
    } finally {
      setAddSongSearching(false);
    }
  };

  const handleAddSoundtrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddSong || (!title?._id && !id)) return;
    setSubmittingAddSong(true);
    try {
      const payload = {
        songName: selectedAddSong.songName,
        artist: selectedAddSong.artist,
        episodeRef: addSongSceneRef.trim() || undefined,
        previewUrl: selectedAddSong.previewUrl,
        albumArtUrl: selectedAddSong.albumArtUrl,
        appleMusicUrl: selectedAddSong.appleMusicUrl,
      };
      const created = await titleService.addSoundtrack(title?._id || id!, payload);
      if (created) {
        setTitle((prev) => {
          if (!prev) return prev;
          const currentSoundtracks = prev.soundtracks || [];
          return {
            ...prev,
            soundtracks: [created, ...currentSoundtracks],
          };
        });
        setAddSongSuccess(`"${created.songName}" added to the soundtrack!`);
        setTimeout(() => {
          setShowAddSongModal(false);
          setSelectedAddSong(null);
          setAddSongQuery('');
          setAddSongResults([]);
          setAddSongSceneRef('');
          setAddSongSuccess(null);
          setAddSongError(null);
          setAddSongSearched(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to add track:', err);
    } finally {
      setSubmittingAddSong(false);
    }
  };

  const handleTogglePlaySong = (songName: string, artist: string, previewUrl?: string) => {
    const trackKey = `${songName.trim()}::${artist.trim()}`;
    if (activePlayingSong === trackKey) {
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
      setActivePlayingSong(trackKey);
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
    const seasonEpisodes = activeSeason?.episodes || [];
    // Mirrors the backend's completeness check: anything unpopulated, any
    // "Episode N" placeholder name, or a gap in numbering means the real TMDB
    // episode list has not been loaded yet.
    const episodeNumbers = seasonEpisodes.map((e) => e.episodeNumber).sort((a, b) => a - b);
    const hasGaps = episodeNumbers.some((n, idx) => n !== idx + 1);
    const hasGeneric =
      !activeSeason ||
      seasonEpisodes.length === 0 ||
      hasGaps ||
      seasonEpisodes.some(
        (e) => !e.name || /^episode\s*\d*$/i.test(e.name.trim()) || !e.summary?.trim()
      );

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
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const MAX_POLL_OPTIONS = 4;

  const addPollOption = () => {
    if (pollOptions.length < MAX_POLL_OPTIONS) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const next = [...pollOptions];
    next[index] = value;
    setPollOptions(next);
  };

  // Threaded reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Reaction picker hover state (commentId -> boolean)
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);

  // Comment reporting for curator moderation
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportedCommentIds, setReportedCommentIds] = useState<string[]>([]);
  const [reportNotice, setReportNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const handleReportComment = async (commentId: string) => {
    if (!requireAuth()) return;
    setReportingCommentId(commentId);
    setReportNotice(null);
    try {
      await titleService.reportComment(commentId);
      setReportedCommentIds((prev) => [...prev, commentId]);
      setTitle((prev) =>
        prev
          ? {
              ...prev,
              comments: (prev.comments || []).map((c) =>
                c._id === commentId
                  ? { ...c, reportedByMe: true, reportCount: (c.reportCount || 0) + 1 }
                  : c
              ),
            }
          : prev
      );
      setReportNotice({ text: 'Thanks — a curator will review this comment.', ok: true });
    } catch (err: any) {
      setReportNotice({
        text:
          err?.response?.data?.error ||
          'Could not report this comment. Please try again.',
        ok: false,
      });
    } finally {
      setReportingCommentId(null);
      setTimeout(() => setReportNotice(null), 4000);
    }
  };

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

  // Deduplicate and filter soundtracks by song name & artist & search query
  const uniqueSoundtracks = useMemo(() => {
    if (!title?.soundtracks) return [];
    const seen = new Set<string>();
    const deduplicated = title.soundtracks.filter((track) => {
      const key = `${track.songName.toLowerCase().trim()}-${track.artist.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!soundtrackSearchQuery.trim()) return deduplicated;

    const q = soundtrackSearchQuery.toLowerCase().trim();
    return deduplicated.filter(
      (t) =>
        t.songName.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.episodeRef && t.episodeRef.toLowerCase().includes(q))
    );
  }, [title?.soundtracks, soundtrackSearchQuery]);

  const getStreamingServiceUrl = (serviceName: string, titleName: string) => {
    const norm = serviceName.toLowerCase();
    if (norm.includes('netflix')) return `https://www.netflix.com/search?q=${encodeURIComponent(titleName)}`;
    if (norm.includes('prime') || norm.includes('amazon')) return `https://www.amazon.com/s?k=${encodeURIComponent(titleName)}&i=instant-video`;
    if (norm.includes('max') || norm.includes('hbo')) return `https://www.max.com/search?q=${encodeURIComponent(titleName)}`;
    if (norm.includes('disney')) return `https://www.disneyplus.com/search?q=${encodeURIComponent(titleName)}`;
    if (norm.includes('apple')) return `https://tv.apple.com/search?term=${encodeURIComponent(titleName)}`;
    if (norm.includes('hulu')) return `https://www.hulu.com/search?q=${encodeURIComponent(titleName)}`;
    if (norm.includes('paramount')) return `https://www.paramountplus.com/search/?q=${encodeURIComponent(titleName)}`;
    if (norm.includes('peacock')) return `https://www.peacocktv.com/search?q=${encodeURIComponent(titleName)}`;
    return `https://www.google.com/search?q=${encodeURIComponent(`Watch ${titleName} on ${serviceName}`)}`;
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    try {
      const nonEmptyOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      const pollPayload =
        showPollForm && pollQuestion.trim() && nonEmptyOptions.length >= 2
          ? {
              question: pollQuestion.trim(),
              options: nonEmptyOptions,
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
      setPollOptions(['', '']);
      toast.success(pollPayload ? 'Poll posted.' : 'Comment posted.');
    } catch (err: any) {
      console.error('Error posting comment:', err);
      toast.error(err?.response?.data?.error || 'Could not post your comment. Please try again.');
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
      toast.success('Reply posted.');
    } catch (err: any) {
      console.error('Error posting reply:', err);
      toast.error(err?.response?.data?.error || 'Could not post your reply. Please try again.');
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
    if (!requireAuth()) return;

    try {
      // titleService.voteCommentPoll returns the full updated comment object directly
      const updatedComment = await titleService.voteCommentPoll(commentId, optionIndex);
      const updatedPoll = updatedComment?.poll;
      if (title && title.comments && updatedPoll) {
        setTitle({
          ...title,
          comments: title.comments.map((c) => (c._id === commentId ? { ...c, poll: updatedPoll } : c)),
        });
      }
    } catch (err) {
      console.error('Failed to vote on poll:', err);
      toast.error('Could not submit your vote. Please try again.');
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!requireAuth()) return;

    // Optimistic update
    setTitle((prev) => {
      if (!prev) return prev;
      const updateComment = (arr: TitleComment[]): TitleComment[] =>
        arr.map((c) => {
          if (c._id === commentId) {
            return {
              ...c,
              likedByMe: !currentlyLiked,
              likesCount: (c.likesCount || 0) + (currentlyLiked ? -1 : 1),
            };
          }
          if (c.replies) return { ...c, replies: updateComment(c.replies) };
          return c;
        });
      return { ...prev, comments: updateComment(prev.comments || []) };
    });

    try {
      const result = await titleService.toggleLike(commentId);
      // Sync exact count from backend
      setTitle((prev) => {
        if (!prev) return prev;
        const syncComment = (arr: TitleComment[]): TitleComment[] =>
          arr.map((c) => {
            if (c._id === commentId) {
              return { ...c, likedByMe: result.isLiked, likesCount: result.likesCount };
            }
            if (c.replies) return { ...c, replies: syncComment(c.replies) };
            return c;
          });
        return { ...prev, comments: syncComment(prev.comments || []) };
      });
    } catch (err: any) {
      // Revert on failure
      setTitle((prev) => {
        if (!prev) return prev;
        const revertComment = (arr: TitleComment[]): TitleComment[] =>
          arr.map((c) => {
            if (c._id === commentId) {
              return {
                ...c,
                likedByMe: currentlyLiked,
                likesCount: (c.likesCount || 0) + (currentlyLiked ? 1 : -1),
              };
            }
            if (c.replies) return { ...c, replies: revertComment(c.replies) };
            return c;
          });
        return { ...prev, comments: revertComment(prev.comments || []) };
      });
      console.error('Failed to toggle comment like:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!requireAuth()) return;
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;

    try {
      await titleService.deleteComment(commentId);
      setTitle((prev) => {
        if (!prev) return prev;
        const removeFrom = (arr: any[]) =>
          arr
            .map((c) => ({
              ...c,
              replies: (c.replies || []).filter((r: any) => r._id !== commentId),
            }))
            .filter((c: any) => c._id !== commentId);
        return { ...prev, comments: removeFrom(prev.comments || []) };
      });
      toast.success('Comment deleted.');
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      toast.error(err?.response?.data?.error || 'Could not delete this comment. Please try again.');
    }
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
  // Defensive: a season document can legitimately carry no episodes array yet.
  const seasonEpisodeList = activeSeasonData?.episodes || [];

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8 flex flex-col animate-in fade-in duration-300">
      {/* Back Button */}
      <div className="order-[-3]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="relative order-[-2] rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl">
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
                
                {/* IMDb & Rotten Tomatoes badges */}
                <ExternalRatings 
                  imdbRating={title.imdbRating} 
                  rottenTomatoesRating={title.rottenTomatoesRating} 
                  size="md" 
                />
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
                onClick={toggleWatchedTitle}
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
                    onClick={() => handleRateTitle(star)}
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
              <button
                type="button"
                onClick={handleToggleWatchlist}
                disabled={watchlistActionLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                  isInWatchlist
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-white'
                }`}
              >
                {watchlistActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isInWatchlist ? (
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  {isInWatchlist
                    ? isWatched
                      ? 'In My List (watched)'
                      : 'In My List'
                    : 'Add to My List'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real Community Watcher Social Banner */}
      {title.communityWatchers && title.communityWatchers.length > 0 ? (
        <div className="bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-slate-900/60 border border-indigo-500/25 rounded-2xl p-4 sm:p-5 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex -space-x-2.5 overflow-hidden shrink-0">
              {title.communityWatchers.slice(0, 5).map((watcher, i) => (
                <img
                  key={watcher.userId || i}
                  src={
                    watcher.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(watcher.name)}&background=6366f1&color=fff&size=100`
                  }
                  alt={watcher.name}
                  title={`${watcher.name}${watcher.starRating ? ` • Rated ${watcher.starRating}★` : ''}`}
                  className="inline-block w-8 h-8 rounded-full ring-2 ring-slate-950 object-cover"
                />
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Watched by{' '}
                <strong className="text-white">
                  {title.communityWatchers[0]?.name || 'Circle Member'}
                </strong>
                {title.communityWatchers.length === 2 && (
                  <>
                    {' and '}
                    <strong className="text-white">{title.communityWatchers[1].name}</strong>
                  </>
                )}
                {title.communityWatchers.length > 2 && (
                  <>
                    {', '}
                    <strong className="text-white">{title.communityWatchers[1].name}</strong>
                    {`, and ${title.communityWatchers.length - 2} other circle member${
                      title.communityWatchers.length - 2 > 1 ? 's' : ''
                    }`}
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                {title.communityWatchers.slice(0, 4).map((w, idx) => (
                  <span
                    key={w.userId || idx}
                    className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700/60"
                  >
                    <span className="text-slate-300 font-medium">{w.name.split(' ')[0]}</span>
                    {w.starRating ? (
                      <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {w.starRating}/5
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-semibold">Watched</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Watch Activity
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {isWatched
                  ? "You've marked this title as watched!"
                  : "No circle members have logged this title yet."}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isWatched
                  ? 'Your rating and review help recommendations across your circles.'
                  : 'Be the first in your circle to watch and leave your rating!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isWatched && (
              <button
                type="button"
                onClick={toggleWatchedTitle}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Mark as Watched
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Details + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Synopsis, Cast, Seasons, Discussion */}
        <div className="lg:col-span-2 flex flex-col space-y-8">
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
                    <span>{seasonEpisodeList.length} Episodes • Click episode to expand summary</span>
                  </div>

                  <div className="space-y-2.5">
                    {seasonEpisodeList.map((ep) => {
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
                                    {ep.summary && ep.summary.trim().length > 0 ? (
                                      ep.summary
                                    ) : (
                                      <span className="text-slate-500 italic">
                                        No episode synopsis has been published for this episode yet.
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Featured Song / Music in Episode */}
                              {ep.featuredSong && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                      {ep.featuredSong.albumArtUrl ? (
                                        <img
                                          src={ep.featuredSong.albumArtUrl}
                                          alt={ep.featuredSong.songName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Music className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[11px] font-bold text-white truncate">
                                          {ep.featuredSong.songName}
                                        </span>
                                        <span className="text-[10px] text-slate-400 truncate">
                                          • {ep.featuredSong.artist}
                                        </span>
                                        {activePlayingSong === `${ep.featuredSong.songName}::${ep.featuredSong.artist}` && (
                                          <div className="flex items-center gap-0.5 ml-1">
                                            <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce"></span>
                                            <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                          </div>
                                        )}
                                      </div>
                                      {ep.featuredSong.sceneRef && (
                                        <p className="text-[10px] text-emerald-300/80 truncate">
                                          Scene: {ep.featuredSong.sceneRef}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    {ep.featuredSong.previewUrl && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleTogglePlaySong(
                                            ep.featuredSong!.songName,
                                            ep.featuredSong!.artist,
                                            ep.featuredSong!.previewUrl
                                          )
                                        }
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                          activePlayingSong === `${ep.featuredSong.songName}::${ep.featuredSong.artist}`
                                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/25'
                                            : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700'
                                        }`}
                                      >
                                        {activePlayingSong === `${ep.featuredSong.songName}::${ep.featuredSong.artist}` ? (
                                          <>
                                            <Pause className="w-3 h-3 fill-current" />
                                            <span>Pause</span>
                                          </>
                                        ) : (
                                          <>
                                            <Play className="w-3 h-3 fill-current" />
                                            <span>30s Sample</span>
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {/* Apple Music Launch */}
                                    <a
                                      href={`https://music.apple.com/us/search?term=${encodeURIComponent(
                                        ep.featuredSong.songName + ' ' + ep.featuredSong.artist
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open in Apple Music"
                                      className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:text-pink-200 transition-all text-xs flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.69-1.12 1.83-.98 2.94 1.07.08 2.16-.54 2.79-1.28z" />
                                      </svg>
                                    </a>

                                    {/* Spotify Launch */}
                                    <a
                                      href={
                                        ep.featuredSong.spotifyUrl ||
                                        `https://open.spotify.com/search/${encodeURIComponent(
                                          ep.featuredSong.songName + ' ' + ep.featuredSong.artist
                                        )}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open in Spotify"
                                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all text-xs flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.436-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.722 1.115.294.18.386.562.207.855zm1.227-2.73c-.227.369-.714.485-1.083.257-2.69-1.653-6.79-2.133-9.97-1.168-.413.125-.852-.11-.977-.523-.125-.413.11-.852.523-.977 3.633-1.103 8.147-.568 11.25 1.341.369.227.485.714.257 1.07zm.106-2.836C14.692 8.95 9.37 8.775 6.297 9.708c-.496.15-1.022-.133-1.173-.628-.151-.496.133-1.022.628-1.173 3.532-1.072 9.404-.866 13.115 1.337.447.265.592.845.327 1.292-.265.447-.845.592-1.292.327z" />
                                      </svg>
                                    </a>

                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold shrink-0 flex items-center gap-1">
                                      <Volume2 className="w-2.5 h-2.5" /> Iconic Scene Music
                                    </span>
                                  </div>
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
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
            {/* Header with Search Filter & Add Song Trigger */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Disc className={`w-4 h-4 ${activePlayingSong ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                    Official Soundtrack & Iconic Featured Songs
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      30s Audio Previews
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Iconic needle-drops and pivotal scene anthems throughout {title.name}
                  </p>
                </div>
              </div>

              {/* Action Controls: Search Filter & Suggest Song */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Search / Filter Input */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={soundtrackSearchQuery}
                    onChange={(e) => setSoundtrackSearchQuery(e.target.value)}
                    placeholder="Filter songs or scenes..."
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  {soundtrackSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSoundtrackSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Suggest / Add Song Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!requireAuth()) return;
                    setShowAddSongModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Suggest Song</span>
                </button>

                {/* Counter */}
                <span className="text-[11px] text-slate-500 font-mono shrink-0 hidden sm:inline">
                  {uniqueSoundtracks.length} track{uniqueSoundtracks.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Modern User-Friendly Tracklist */}
            {uniqueSoundtracks.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Music className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  {soundtrackSearchQuery
                    ? `No songs matching "${soundtrackSearchQuery}"`
                    : 'No soundtrack entries recorded yet.'}
                </p>
                {soundtrackSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSoundtrackSearchQuery('')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Clear filter
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddSongModal(true)}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Be the first to suggest an iconic song!
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {(showAllSoundtracks ? uniqueSoundtracks : uniqueSoundtracks.slice(0, 6)).map(
                  (track, idx) => {
                    const trackKey = `${track.songName}::${track.artist}`;
                    const isPlaying = activePlayingSong === trackKey;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                          isPlaying
                            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                            : 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700/90 hover:bg-slate-950/90'
                        }`}
                      >
                        {/* Left: Track # + Album Art + Song Name & Artist & Context Badge */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
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
                            {track.previewUrl && (
                              <button
                                type="button"
                                onClick={() => handleTogglePlaySong(track.songName, track.artist, track.previewUrl)}
                                className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity cursor-pointer ${
                                  isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
                                aria-label={isPlaying ? 'Pause sample' : 'Play 30s sample'}
                              >
                                {isPlaying ? (
                                  <Pause className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                ) : (
                                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Track Details: Row 1 = Song Name (+ animation), Row 2 = Artist + Context Badge */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                                {track.songName}
                              </p>
                              {isPlaying && (
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce"></span>
                                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 min-w-0">
                              <p className="text-[11px] text-slate-400 truncate shrink-0 max-w-[130px] sm:max-w-[200px]">
                                {track.artist}
                              </p>
                              {track.episodeRef && (
                                <>
                                  <span className="text-[10px] text-slate-600 shrink-0 hidden xs:inline">•</span>
                                  <span
                                    title={track.episodeRef}
                                    className="text-[10px] text-emerald-400/90 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 font-medium truncate min-w-0 max-w-[180px] sm:max-w-[300px] lg:max-w-[420px]"
                                  >
                                    {track.episodeRef}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Audio Action Controls */}
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
                          {track.previewUrl ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePlaySong(track.songName, track.artist, track.previewUrl)}
                              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                isPlaying
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/25'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                  <span className="hidden sm:inline">Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span className="hidden sm:inline">30s Sample</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic hidden sm:inline">No preview</span>
                          )}

                          {/* Apple Music Launch Button */}
                          <a
                            href={`https://music.apple.com/us/search?term=${encodeURIComponent(
                              track.songName + ' ' + track.artist
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Listen on Apple Music"
                            className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:text-pink-200 transition-all text-xs font-semibold flex items-center gap-1.5 group/am shrink-0"
                          >
                            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.69-1.12 1.83-.98 2.94 1.07.08 2.16-.54 2.79-1.28z" />
                            </svg>
                            <span className="hidden md:inline">Apple Music</span>
                          </a>

                          {/* Spotify Launch Button */}
                          <a
                            href={`https://open.spotify.com/search/${encodeURIComponent(
                              track.songName + ' ' + track.artist
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Listen on Spotify"
                            className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all text-xs font-semibold flex items-center gap-1.5 group/sp shrink-0"
                          >
                            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.436-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.722 1.115.294.18.386.562.207.855zm1.227-2.73c-.227.369-.714.485-1.083.257-2.69-1.653-6.79-2.133-9.97-1.168-.413.125-.852-.11-.977-.523-.125-.413.11-.852.523-.977 3.633-1.103 8.147-.568 11.25 1.341.369.227.485.714.257 1.07zm.106-2.836C14.692 8.95 9.37 8.775 6.297 9.708c-.496.15-1.022-.133-1.173-.628-.151-.496.133-1.022.628-1.173 3.532-1.072 9.404-.866 13.115 1.337.447.265.592.845.327 1.292-.265.447-.845.592-1.292.327z" />
                            </svg>
                            <span className="hidden md:inline">Spotify</span>
                          </a>
                        </div>
                      </div>
                    );
                  }
                )}

                {/* Show All / Show Less Toggle Button */}
                {uniqueSoundtracks.length > 6 && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllSoundtracks(!showAllSoundtracks)}
                      className="px-4 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {showAllSoundtracks ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Show Top 6 Tracks</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>View All {uniqueSoundtracks.length} Tracks</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal: Suggest / Add Song to Soundtrack */}
          {showAddSongModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Music className="w-4 h-4 text-emerald-400" />
                      Suggest Song for {title.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Search Apple Music for needle-drops, cast covers, or viral scene anthems
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSongModal(false);
                      setSelectedAddSong(null);
                      setAddSongQuery('');
                      setAddSongResults([]);
                      setAddSongSuccess(null);
                      setAddSongError(null);
                      setAddSongSearched(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {addSongSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{addSongSuccess}</span>
                  </div>
                )}

                {/* Live Music Search Form */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={addSongQuery}
                        onChange={(e) => {
                          setAddSongQuery(e.target.value);
                          // Clear stale result/error messaging while retyping.
                          setAddSongSearched(false);
                          setAddSongError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchMusic(addSongQuery);
                          }
                        }}
                        placeholder={`Search track or artist (e.g. Kids in America, Tom Odell)...`}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchMusic(addSongQuery)}
                      disabled={addSongSearching || !addSongQuery.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      {addSongSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </button>
                  </div>

                  {/* Search failure feedback */}
                  {addSongError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{addSongError}</span>
                    </div>
                  )}

                  {/* Completed search with no matches */}
                  {!addSongSearching && !addSongError && addSongSearched && addSongResults.length === 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
                      No Apple Music tracks matched &ldquo;{addSongQuery}&rdquo;. Try a different
                      spelling, or search by the artist instead.
                    </div>
                  )}

                  {/* Search Results */}
                  {addSongResults.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      <p className="text-[11px] font-semibold text-slate-400">
                        Select matching track:
                      </p>
                      {addSongResults.map((song, i) => {
                        const isSelected =
                          selectedAddSong?.songName === song.songName &&
                          selectedAddSong?.artist === song.artist;
                        // Must match handleTogglePlaySong's key, which is
                        // "songName::artist" - comparing against songName alone
                        // meant the play/pause icon never toggled.
                        const trackKey = `${(song.songName || '').trim()}::${(song.artist || '').trim()}`;
                        return (
                          <div
                            key={`${trackKey}-${i}`}
                            onClick={() => setSelectedAddSong(song)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-500 text-white'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                                {song.albumArtUrl ? (
                                  <img
                                    src={song.albumArtUrl}
                                    alt={song.songName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Music className="w-4 h-4 text-slate-500 m-2" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate text-white">
                                  {song.songName}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {song.previewUrl && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Correct argument order: (songName, artist, previewUrl).
                                    // The preview URL used to be passed as `artist`,
                                    // so no audio ever played from search results.
                                    handleTogglePlaySong(song.songName, song.artist, song.previewUrl);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800"
                                >
                                  {activePlayingSong === trackKey ? (
                                    <Pause className="w-3 h-3 fill-current" />
                                  ) : (
                                    <Play className="w-3 h-3 fill-current ml-0.5" />
                                  )}
                                </button>
                              )}
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {isSelected ? 'Selected' : 'Pick'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Scene Reference & Confirmation */}
                  {selectedAddSong && (
                    <form onSubmit={handleAddSoundtrackSubmit} className="space-y-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Scene or Episode Context (Optional):
                        </label>
                        <input
                          type="text"
                          value={addSongSceneRef}
                          onChange={(e) => setAddSongSceneRef(e.target.value)}
                          placeholder="e.g. Season 1 Finale - Homecoming / Jubilee Performance"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAddSong(null);
                            setShowAddSongModal(false);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingAddSong}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {submittingAddSong ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Add to Soundtrack</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Discussion & Enthusiast Comments (Facebook-Style Reactions, Threaded Replies, and Polls) */}
          <div className="order-[-1] bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
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
                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removePollOption(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400"
                              title="Remove option"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < MAX_POLL_OPTIONS && (
                        <button
                          type="button"
                          onClick={addPollOption}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded border border-indigo-500/30 text-xs font-medium"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add option</span>
                        </button>
                      )}
                      <p className="text-[10px] text-slate-500">
                        {pollOptions.length} of {MAX_POLL_OPTIONS} options
                      </p>
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
                  <Link to="/login" state={{ from: location }} className="text-indigo-400 hover:underline font-semibold">
                    Sign in
                  </Link>{' '}
                  or{' '}
                  <Link to="/register" state={{ from: location }} className="text-indigo-400 hover:underline font-semibold">
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
                    (r) => r.userId === currentUser?._id
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

                        {comment.rating ? (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {comment.rating}.0
                          </span>
                        ) : null}

                        {/* Delete - owner only */}
                        {comment.user?._id === currentUser?._id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-[10px] text-slate-500 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                            title="Delete your comment"
                          >
                            <X className="w-3 h-3" />
                          </button>
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
                              const hasVotedThis = myVotesMap.get(comment._id) === optIdx;

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={!isAuthenticated || hasVotedThis}
                                  onClick={() => handlePollVote(comment._id, optIdx)}
                                  className={`w-full relative overflow-hidden rounded-xl p-2.5 border text-left transition-all duration-200 ${
                                    hasVotedThis
                                      ? 'border-indigo-500 bg-indigo-950/50'
                                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900'
                                  }`}
                                >
                                  {/* Progress bar */}
                                  <div className="absolute left-0 top-0 bottom-0 transition-all duration-300 ${
                                    hasVotedThis ? 'bg-indigo-600/30' : 'bg-slate-700/30'
                                  }" style={{ width: `${percent}%` }} />
                                  <div className="relative z-10 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                      {hasVotedThis && (
                                        <>
                                          <Check className="w-3 h-3 text-indigo-400" />
                                          <span className="text-indigo-400 text-[10px] font-bold">Your vote</span>
                                        </>
                                      )}
                                      {opt.optionText}
                                    </span>
                                    <span className="text-[11px] font-bold ${
                                      hasVotedThis ? 'text-indigo-400' : 'text-slate-400'
                                    }">
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
                          {/* Like Button */}
                          <button
                            type="button"
                            onClick={() => handleLikeComment(comment._id, !!comment.likedByMe)}
                            className={`flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                              comment.likedByMe
                                ? 'text-rose-400'
                                : 'text-slate-400 hover:text-rose-400'
                            }`}
                            title={comment.likedByMe ? 'Unlike' : 'Like'}
                          >
                            <Heart className={`w-3.5 h-3.5 ${comment.likedByMe ? 'fill-rose-400' : ''}`} />
                            <span>{comment.likesCount || 0}</span>
                          </button>

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

                          {/* Report for curator moderation */}
                          {!(
                            comment.reportedByMe ||
                            reportedCommentIds.includes(comment._id) ||
                            comment.user?._id === currentUser?._id
                          ) && (
                            <button
                              type="button"
                              onClick={() => handleReportComment(comment._id)}
                              disabled={reportingCommentId === comment._id}
                              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                              title="Report this comment to a curator"
                            >
                              {reportingCommentId === comment._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              )}
                              <span>Report</span>
                            </button>
                          )}
                        </div>

                        {/* Report outcome feedback */}
                        {reportNotice &&
                          (reportedCommentIds.includes(comment._id) ||
                            reportNotice.text?.includes('this comment')) && (
                            <p
                              className={`text-[10px] font-medium pt-1 ${
                                reportNotice.ok ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {reportNotice.text}
                            </p>
                          )}
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

                                {reply.user?._id === currentUser?._id && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(reply._id)}
                                    className="text-[9px] text-slate-500 hover:text-rose-400 px-1 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                                    title="Delete your reply"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
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
                  <a
                    key={`prim-${idx}`}
                    href={getStreamingServiceUrl(wp.service, title.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Watch ${title.name} on ${wp.service}`}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StreamingBadge service={wp.service} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-indigo-300 transition-colors">
                          {wp.service}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {wp.regions.join(' • ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/80">
                        {wp.type}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </a>
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
                      <a
                        key={`hidden-${idx}`}
                        href={getStreamingServiceUrl(wp.service, title.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Watch ${title.name} on ${wp.service}`}
                        className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <StreamingBadge service={wp.service} size="sm" />
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-slate-300 block truncate group-hover:text-indigo-300 transition-colors">
                              {wp.service}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {wp.regions.join(' • ')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] uppercase font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {wp.type}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </a>
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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  User,
  Users,
  Film,
  Bookmark,
  MessageSquare,
  Sparkles,
  Edit3,
  UserPlus,
  Share2,
  Check,
  Star,
  ExternalLink,
  ShieldCheck,
  Search,
  X,
  Play,
  Heart,
  Loader2,
  Tv,
  Radio,
  Sparkle,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/useAppRedux';
import { updateUser } from '../store/slices/authSlice';
import { userService } from '../services/user.service';
import { uploadProfileImage } from '../services/supabase';
import { StreamingBadge } from '../components/common/StreamingBadge';
import { TasteOnboardingWizard } from '../components/onboarding/TasteOnboardingWizard';
import type { UserProfileData, CommunityPerson, ConnectionGraph, ConnectionPerson } from '../types';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  // States
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'watched' | 'watchlist' | 'circles' | 'reviews' | 'taste'>('watched');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFindPeopleOpen, setIsFindPeopleOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editServices, setEditServices] = useState<string[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Find people state
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [searchingPeople, setSearchingPeople] = useState(false);
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Social graph modal
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [graph, setGraph] = useState<ConnectionGraph | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  const graphList: ConnectionPerson[] = graph?.mutuals ?? [];

  const openConnections = async () => {
    setConnectionsOpen(true);
    if (graph) return;
    setGraphLoading(true);
    try {
      setGraph(await userService.getConnections(profile?._id));
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setGraphLoading(false);
    }
  };

  // Real recency-weighted genre affinities, fetched from the backend.
  const [tasteGenreScores, setTasteGenreScores] = useState<
    { genre: string; weight: number; pct: number }[]
  >([]);

  useEffect(() => {
    // Only the signed-in member's own history is exposed.
    const viewingSelf =
      !!profile && !!currentUser && profile._id === currentUser._id;

    if (!viewingSelf) {
      setTasteGenreScores([]);
      return;
    }
    let cancelled = false;
    userService
      .getTasteProfile()
      .then((taste) => {
        if (cancelled) return;
        const scores = taste?.genreScores || {};
        const entries = Object.entries(scores)
          .map(([genre, value]) => ({ genre, weight: Number(value) || 0 }))
          .filter((e) => e.weight > 0)
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 8);
        const max = entries.length ? entries[0].weight : 1;
        setTasteGenreScores(entries.map((e) => ({ ...e, pct: Math.round((e.weight / max) * 100) })));
      })
      .catch(() => {
        if (!cancelled) setTasteGenreScores([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?._id, profile?._id]);

  const isSelf = useMemo(() => {
    if (!profile) return false;
    if (!currentUser) return false;
    if (!id || id === 'me' || id === currentUser._id) return true;
    return profile._id === currentUser._id;
  }, [profile, currentUser, id]);

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const targetId = id && id !== 'me' ? id : currentUser?._id;
      const data = await userService.getProfile(targetId);
      setProfile(data);

      // Pre-fill edit modal form
      setEditName(data.name || '');
      setEditHandle(data.handle || '');
      setEditBio(data.bio || '');
      setEditAvatar(data.avatar || '');
      setEditServices(data.subscribedServices || []);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.error || 'Unable to load profile data');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser?._id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Load community members when Find People modal opens
  const loadCommunityPeople = useCallback(async (query = '') => {
    try {
      setSearchingPeople(true);
      const results = await userService.searchPeople(query);
      setPeople(results);
    } catch (err) {
      console.error('Failed to search community members:', err);
    } finally {
      setSearchingPeople(false);
    }
  }, []);

  useEffect(() => {
    if (isFindPeopleOpen) {
      loadCommunityPeople(searchQuery);
    }
  }, [isFindPeopleOpen, searchQuery, loadCommunityPeople]);

  const handleConnectionRequest = async () => {
    if (!profile || !currentUser) {
      navigate('/login');
      return;
    }
    setConnectionLoading(true);
    try {
      if (profile.connectionStatus === 'pending_received' && profile.connectionRequestId) {
        await userService.respondToConnection(profile.connectionRequestId, 'accepted');
        setProfile((prev) => (prev ? { ...prev, connectionStatus: 'accepted' } : prev));
      } else {
        await userService.requestConnection(profile._id);
        setProfile((prev) => (prev ? { ...prev, connectionStatus: 'pending_sent' } : prev));
      }
    } catch (err) {
      console.error('Failed to send connection request:', err);
    } finally {
      setConnectionLoading(false);
    }
  };

  // Toggle follow inside "Find More People" modal
  const handleToggleFollowPerson = async (personId: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setFollowLoadingMap((prev) => ({ ...prev, [personId]: true }));
    try {
      const res = await userService.toggleFollow(personId);
      setPeople((prev) =>
        prev.map((p) => {
          if (p.id === personId) {
            const nextFollow = res.following;
            return {
              ...p,
              isFollowing: nextFollow,
              stats: {
                ...p.stats,
                followersCount: nextFollow ? p.stats.followersCount + 1 : Math.max(0, p.stats.followersCount - 1),
              },
            };
          }
          return p;
        })
      );

      // If we followed someone, update current user's following stat count
      if (isSelf) {
        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              followingCount: res.following ? prev.stats.followingCount + 1 : Math.max(0, prev.stats.followingCount - 1),
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to toggle follow user:', err);
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [personId]: false }));
    }
  };

  const handleAvatarUpload = async (file: File | undefined) => {
    if (!file) return;
    setAvatarUploadError(null);

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please choose an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadError('Image must be 5 MB or smaller.');
      return;
    }

    const userId = currentUser?._id || profile?._id;
    if (!userId) {
      setAvatarUploadError('You must be signed in to upload a profile image.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setEditAvatar(await uploadProfileImage(file, userId));
    } catch (err) {
      console.error('Failed to upload profile image:', err);
      setAvatarUploadError('Image upload failed. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save edited profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const updated = await userService.updateProfile({
        name: editName,
        handle: editHandle,
        bio: editBio,
        avatar: editAvatar,
        subscribedServices: editServices,
      });

      // Update Redux state
      dispatch(
        updateUser({
          name: updated.name,
          handle: updated.handle,
          bio: updated.bio,
          avatar: updated.avatar,
          subscribedServices: updated.subscribedServices,
        })
      );

      // Update local profile state
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: updated.name,
          handle: updated.handle,
          bio: updated.bio,
          avatar: updated.avatar,
          subscribedServices: updated.subscribedServices,
        };
      });

      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Copy profile link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Available streaming services options
  const availableServices = ['Netflix', 'Max', 'Prime Video', 'Apple TV+', 'Disney+', 'Hulu', 'Paramount+'];

  const toggleService = (svc: string) => {
    if (editServices.includes(svc)) {
      setEditServices(editServices.filter((s) => s !== svc));
    } else {
      setEditServices([...editServices, svc]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading CineCircle profile...</p>
      </div>
    );
  }

  if (!profile && !error) {
    // Not logged in yet - show a friendly social-style welcome wall
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-16">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg text-center space-y-6 sm:space-y-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30 sm:shadow-xl lg:shadow-2xl">
            <User className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Welcome to CineCircle
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-400 leading-relaxed max-w-xs sm:max-w-md lg:max-w-lg mx-auto">
            Join to see what your friends are watching, create watch parties,
            and get personalised recommendations.
          </p>
          <div className="space-y-3 sm:space-y-4 w-full">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all sm:shadow-xl active:scale-95"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              Sign in
            </Link>
            <Link
              to="/register"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white text-sm sm:text-base font-medium rounded-xl bg-slate-900/50 transition-all sm:bg-slate-900/70 active:scale-95"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Profile Not Found</h2>
        <p className="text-sm text-slate-400">{error || 'Could not retrieve profile information.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* 1. INSTAGRAM-STYLE PROFILE HEADER CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-gradient-to-tr from-amber-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          {/* Profile avatar */}
          <div className="relative group shrink-0">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover shadow-inner group-hover:scale-105 transition-transform duration-300"
            />
            {profile.role === 'admin' && (
              <span
                title="Verified CineCircle Creator & Admin"
                className="absolute bottom-1 right-1 p-1.5 rounded-full bg-indigo-600 text-white border-2 border-slate-950 shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
              </span>
            )}
          </div>

          {/* Identity & Action Buttons */}
          <div className="flex-1 text-center md:text-left space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit']">
                    {profile.name}
                  </h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    {profile.handle}
                  </span>
                  {profile.role === 'admin' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40">
                      Curator Admin
                    </span>
                  )}
                </div>
                {/* Identity line. The email is only sent unmasked to the account owner and
                    to admins - everyone else receives a masked copy - so it is
                    never rendered on someone else's profile. The "Real Account"
                    badge was previously shown unconditionally, including for
                    accounts with no verified address. */}
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                  {isSelf && profile.email && (
                    <span className="text-xs text-slate-400 font-mono tracking-wide">
                      {profile.email}
                    </span>
                  )}
                  {isSelf ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified email
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">
                      Email hidden
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons (Edit Profile, Find More People, Share, Follow) */}
              <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
                {isSelf ? (
                  <>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-white text-xs font-semibold border border-slate-700/70 transition-all hover:border-slate-600 active:scale-95 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => setIsFindPeopleOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Find More People</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Real two-way follow edge. Distinct from the shared-titles
                        line further down, which is about watched titles. */}
                    {profile.connectionStatus === 'accepted' && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/25"
                        title="You follow each other"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Connection</span>
                      </span>
                    )}
                    {profile.connectionStatus === 'pending_received' && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700"
                        title="This member already follows you"
                      >
                        <span>Follows you</span>
                      </span>
                    )}
                    <button
                      onClick={handleConnectionRequest}
                      disabled={connectionLoading || profile.connectionStatus === 'pending_sent' || profile.connectionStatus === 'accepted'}
                      className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                        profile.connectionStatus === 'accepted' || profile.connectionStatus === 'pending_sent'
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                      }`}
                    >
                      {profile.connectionStatus === 'accepted' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /><span>Connected</span>
                        </>
                      ) : profile.connectionStatus === 'pending_sent' ? (
                        <span>Request Sent</span>
                      ) : profile.connectionStatus === 'pending_received' ? (
                        <><Check className="w-3.5 h-3.5" /><span>Accept Request</span></>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsFindPeopleOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Community</span>
                    </button>
                  </>
                )}

                <button
                  onClick={handleCopyLink}
                  title="Share Profile Link"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95 relative"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  {copiedLink && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shadow-lg">
                      Link Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* INSTAGRAM-STYLE METRICS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 py-3 px-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 text-center">
              <button
                onClick={() => setActiveTab('circles')}
                className="hover:scale-105 transition-transform cursor-pointer group"
              >
                <div className="text-base sm:text-xl font-black text-indigo-400 group-hover:text-indigo-300 font-['Outfit']">
                  {profile.stats.circlesCount}
                </div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Circles</div>
              </button>

              {/* Only reciprocal follow edges count as accepted connections. */}
              <button
                onClick={() => openConnections()}
                className="hover:scale-105 transition-transform cursor-pointer group"
                title="Accepted connections"
              >
                <div className="text-base sm:text-xl font-black text-teal-400 group-hover:text-teal-300 font-['Outfit']">
                  {profile.stats.connectionsCount ?? 0}
                </div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Connections</div>
              </button>

              <button
                onClick={() => setActiveTab('watched')}
                className="hover:scale-105 transition-transform cursor-pointer group"
              >
                <div className="text-base sm:text-xl font-black text-emerald-400 group-hover:text-emerald-300 font-['Outfit']">
                  {profile.stats.watchedCount}
                </div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Watched</div>
              </button>

              <button
                onClick={() => setActiveTab('watchlist')}
                className="hover:scale-105 transition-transform cursor-pointer group"
              >
                <div className="text-base sm:text-xl font-black text-amber-400 group-hover:text-amber-300 font-['Outfit']">
                  {profile.stats.watchlistCount}
                </div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">To Watch</div>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className="hover:scale-105 transition-transform cursor-pointer group"
              >
                <div className="text-base sm:text-xl font-black text-cyan-400 group-hover:text-cyan-300 font-['Outfit']">
                  {profile.stats.reviewsCount}
                </div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reviews</div>
              </button>
            </div>

            {/* Bio text */}
            <div className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {profile.bio}
            </div>

            {!isSelf && profile.stats.mutualWatchedCount !== undefined && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  You and {profile.name} have watched {profile.stats.mutualWatchedCount} common{' '}
                  {profile.stats.mutualWatchedCount === 1 ? 'title' : 'titles'} together.
                </span>
              </div>
            )}

            {/* INSTAGRAM HIGHLIGHTS: Subscribed Streaming Services */}
            {profile.subscribedServices && profile.subscribedServices.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Tv className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subscribed Streaming Passes</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {profile.subscribedServices.map((svc) => (
                    <StreamingBadge key={svc} service={svc} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. INSTAGRAM-STYLE PROFILE TABS NAVIGATION */}
      <div className="flex items-center justify-center border-b border-slate-800/80">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab('watched')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'watched'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Watched ({profile.stats.watchedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'watchlist'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Want to Watch ({profile.stats.watchlistCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('circles')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'circles'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Circles ({profile.userCircles?.length || profile.stats.circlesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reviews & Takes ({profile.stats.reviewsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('taste')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'taste'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Taste Matrix</span>
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT PANELS */}
      <div>
        {/* TAB 1: WATCHED & RATED POSTER GRID */}
        {activeTab === 'watched' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-['Outfit']">Film Diary & Logged Titles</h2>
                <p className="text-xs text-slate-400">Letterboxd-style chronological viewing history with ratings</p>
              </div>
              <Link
                to="/watchlist"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>View Full Watchlist</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {profile.recentWatched && profile.recentWatched.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {profile.recentWatched.map((item) => (
                  <Link
                    key={item._id}
                    to={`/title/${item.title._id}${item.title.type ? `?type=${item.title.type}` : ''}`}
                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950 relative">
                      <img
                        src={item.title.posterUrl}
                        alt={item.title.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Star Rating Badge */}
                      {item.starRating && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{item.starRating}</span>
                        </div>
                      )}
                      {/* Format Badge */}
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950/85 backdrop-blur-sm text-slate-300 border border-slate-800">
                        {item.title.type === 'tv' ? 'Series' : 'Movie'}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-1">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                        {item.title.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{item.title.releaseYear || 'Watched'}</span>
                        <span className="text-emerald-400 font-medium">Logged</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-3">
                <Film className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No watched movies logged yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Mark movies as watched on their detail pages or save them to your watchlist to start your cinema diary.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Explore Trending Titles
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED WATCHLIST BACKLOG */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-['Outfit']">Want to Watch</h2>
                <p className="text-xs text-slate-400">
                  Saved but not yet watched. Tick one off and it moves to your Watched list.
                </p>
              </div>
              <Link
                to="/watchlist"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                <span>Full Watchlist Manager</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {profile.savedWatchlist && profile.savedWatchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {profile.savedWatchlist.map((item) => (
                  <Link
                    key={item._id}
                    to={`/title/${item.title._id}${item.title.type ? `?type=${item.title.type}` : ''}`}
                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-amber-500/10 flex flex-col"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950 relative">
                      <img
                        src={item.title.posterUrl}
                        alt={item.title.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Rating Badge */}
                      {item.title.voteAverage ? (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{item.title.voteAverage.toFixed(1)}</span>
                        </div>
                      ) : null}
                      {/* Format Badge */}
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950/85 backdrop-blur-sm text-slate-300 border border-slate-800">
                        {item.title.type === 'tv' ? 'Series' : 'Movie'}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-1">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                        {item.title.name}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{item.title.releaseYear || 'Queued'}</span>
                        <span className="text-amber-400 font-medium">To Watch</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-3">
                <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">Watchlist is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Save titles by tapping the bookmark icon on any movie or TV series to add it to your watchlist backlog.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Discover Titles to Save
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTIVE WATCH CIRCLES */}
        {activeTab === 'circles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-['Outfit']">Collaborative Watch Rooms</h2>
                <p className="text-xs text-slate-400">Decision circles hosted and joined with group shortlists</p>
              </div>
              <Link
                to="/group"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-600/20"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Create New Room</span>
              </Link>
            </div>

            {profile.userCircles && profile.userCircles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.userCircles.map((circle) => (
                  <div
                    key={circle._id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-violet-500/40 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-white font-['Outfit'] leading-tight">
                            {circle.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                              CODE: {circle.joinCode}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          </div>
                        </div>

                        {/* Host avatar */}
                        {circle.host && (
                          <div className="flex items-center gap-1.5 shrink-0" title={`Hosted by ${circle.host.name}`}>
                            <img
                              src={circle.host.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(circle.host.name)}&background=6366f1&color=fff`}
                              alt={circle.host.name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* Constraints */}
                      {circle.constraints && (
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                          {circle.constraints.moodFilter && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              Vibe: {circle.constraints.moodFilter}
                            </span>
                          )}
                          {circle.constraints.maxRuntime && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              Max {circle.constraints.maxRuntime} min
                            </span>
                          )}
                        </div>
                      )}

                      {/* Shortlist movie thumbnails */}
                      {circle.shortlist && circle.shortlist.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Candidates on Table
                          </p>
                          <div className="flex items-center gap-2 overflow-x-auto py-1">
                            {circle.shortlist.map((c) => (
                              <img
                                key={c._id}
                                src={c.posterUrl}
                                alt={c.name}
                                title={c.name}
                                className="w-10 h-14 rounded-lg object-cover border border-slate-800 shadow-sm shrink-0"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/group`}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold text-center border border-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
                      <span>Enter Watch Circle</span>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No active circles yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create a watch room with friends or join an existing session code to resolve what to watch.
                </p>
                <Link
                  to="/group"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Start a Watch Circle
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REVIEWS & COMMUNITY TAKES */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">Discussion Takes & Critiques</h2>
              <p className="text-xs text-slate-400">Comments, ratings, and community polls posted by {profile.name}</p>
            </div>

            {profile.recentReviews && profile.recentReviews.length > 0 ? (
              <div className="space-y-3">
                {profile.recentReviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start gap-4"
                  >
                    {/* Poster thumbnail */}
                    {rev.title && (
                      <Link
                        to={`/title/${rev.title._id}`}
                        className="w-16 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 hover:opacity-85 transition-opacity"
                      >
                        <img
                          src={rev.title.posterUrl}
                          alt={rev.title.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    )}

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {rev.title && (
                          <Link
                            to={`/title/${rev.title._id}`}
                            className="text-sm font-bold text-white hover:text-indigo-400 transition-colors font-['Outfit']"
                          >
                            {rev.title.name} {rev.title.releaseYear ? `(${rev.title.releaseYear})` : ''}
                          </Link>
                        )}
                        {rev.rating && (
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/25">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{rev.rating} / 5</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                        "{rev.text}"
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1 text-rose-400 font-medium">
                          <Heart className="w-3 h-3 fill-rose-500/20 text-rose-400" />
                          <span>{rev.likesCount || 0} Likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No public takes or critiques yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Share your thoughts, ratings, and interactive polls under any movie or TV series detail page!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TASTE MATRIX & COMPATIBILITY */}
        {activeTab === 'taste' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-white font-['Outfit']">Taste Profile &amp; Compatibility</h2>
                <p className="text-xs text-slate-400">
                  Your declared preferences, plus genre affinities derived from your watch history
                </p>
              </div>
              {isSelf && (
                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Update Taste Profile</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Favorite genres */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white font-['Outfit']">Primary Cine Taste Preferences</h3>
                </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Genres weighted for AI compromise discovery and mutual circle recommendations.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {profile.tasteProfile?.favoriteGenres?.length ? (
                  profile.tasteProfile.favoriteGenres.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
                    >
                      ★ {g}
                    </span>
                  ))
                ) : (
                  /* No invented default genres - say there are none yet. */
                  <p className="text-xs text-slate-500 italic">
                    No genres selected yet. Use &ldquo;Update Taste Profile&rdquo; to add some.
                  </p>
                )}
              </div>

              {/* Real recency-weighted genre affinities from WatchHistory. */}
              {tasteGenreScores.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Derived from your watch history
                  </span>
                  <p className="text-[10px] text-slate-600 mb-2 leading-relaxed">
                    Weighted by rating and recency — an entry counts half as much after 60 days.
                  </p>
                  <div className="space-y-1.5">
                    {tasteGenreScores.map(({ genre, weight, pct }) => (
                      <div key={genre} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-300 w-32 truncate shrink-0">
                          {genre}
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 w-10 text-right shrink-0">
                          {weight.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.tasteProfile?.exclusions && profile.tasteProfile.exclusions.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Hard Exclusions (Fatigue Filters)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.tasteProfile.exclusions.map((ex) => (
                      <span
                        key={ex}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium"
                      >
                        ✕ {ex}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subscriptions & Synergy */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-['Outfit']">Streaming Ecosystem</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Circles check these subscribed passes when generating zero-cost compromise picks.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {profile.subscribedServices?.map((svc) => (
                  <StreamingBadge key={svc} service={svc} size="md" />
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/25 space-y-1.5 mt-4">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                  <span>Circle Compatibility</span>
                  {/* Real computed value, or an honest "no data" state.
                      This was previously a hardcoded 94%. */}
                  {profile.stats?.circleCompatibility != null ? (
                    <span>{profile.stats.circleCompatibility}%</span>
                  ) : (
                    <span className="text-slate-500 font-semibold">Not enough data</span>
                  )}
                </div>
                {profile.stats?.circleCompatibility != null ? (
                  <>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all"
                        style={{ width: `${profile.stats.circleCompatibility}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">
                      {profile.stats.circleCompatibilityExplanation ||
                        'Based on your shared genres and watched titles.'}
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500 pt-1 italic">
                    {profile.isSelf
                      ? 'Build a taste profile and watch some titles to see how you line up with other members.'
                      : profile.stats?.circleCompatibilityExplanation ||
                        'Not enough shared history yet.'}
                  </p>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: EDIT PROFILE (Instagram-Style) */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white font-['Outfit']">Edit Profile Details</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar upload and preview */}
              <div className="flex items-center gap-4">
                <img
                  src={editAvatar || profile.avatar}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 ring-2 ring-slate-800 shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-slate-300">Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingAvatar}
                    onChange={(e) => {
                      void handleAvatarUpload(e.target.files?.[0]);
                      e.currentTarget.value = '';
                    }}
                    className="w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-500 disabled:opacity-50"
                  />
                  <p className="text-[10px] text-slate-500">
                    {isUploadingAvatar ? 'Uploading...' : 'PNG, JPG, GIF, or WEBP up to 5 MB'}
                  </p>
                  {avatarUploadError && <p className="text-[10px] text-red-400">{avatarUploadError}</p>}
                  <label className="text-[10px] text-slate-500">Or use an image URL</label>
                  <input
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Handle */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Community Handle (@)</label>
                <input
                  type="text"
                  required
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Bio</label>
                  <span className="text-[10px] text-slate-500">{editBio.length} / 180</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={180}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell the community about your film taste..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Subscribed Streaming Services Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Subscribed Streaming Platforms</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableServices.map((svc) => {
                    const isSelected = editServices.includes(svc);
                    return (
                      <button
                        type="button"
                        key={svc}
                        onClick={() => toggleService(svc)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{svc}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: FIND MORE PEOPLE / COMMUNITY DIRECTORY (Instagram-Style) */}
      {/* ========================================================================= */}
      {connectionsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setConnectionsOpen(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black space-y-5 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  {profile?.name}&apos;s Network
                </h3>
              </div>
              <button
                onClick={() => setConnectionsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b border-slate-800/80 pb-3">
              <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Connections ({graph?.counts.mutualConnectionsCount ?? 0})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {graphLoading ? (
                <p className="text-center text-xs text-slate-500 py-8">Loading network...</p>
              ) : graphList.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">
                  No connections yet.
                </p>
              ) : (
                graphList.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800"
                  >
                    <Link
                      to={`/profile/${person.id}`}
                      onClick={() => setConnectionsOpen(false)}
                      className="flex items-center gap-3 min-w-0 group"
                    >
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-800 group-hover:ring-indigo-500 transition-all"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-indigo-400 truncate">
                          {person.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{person.handle}</p>
                      </div>
                    </Link>
                    {graph?.mutuals.some((m) => m.id === person.id) && (
                      <span className="text-[9px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 shrink-0">
                        Connection
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isFindPeopleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white font-['Outfit']">Find More People</h3>
              </div>
              <button
                onClick={() => setIsFindPeopleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real-time Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search real accounts by name, @handle, or email..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Community Members List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {searchingPeople ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-400">Searching community members...</p>
                </div>
              ) : people.length > 0 ? (
                people.map((person) => (
                  <div
                    key={person.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Link
                        to={`/profile/${person.id}`}
                        onClick={() => setIsFindPeopleOpen(false)}
                        className="shrink-0"
                      >
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30 hover:ring-indigo-500 transition-all"
                        />
                      </Link>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/profile/${person.id}`}
                            onClick={() => setIsFindPeopleOpen(false)}
                            className="text-xs font-bold text-white hover:text-indigo-400 transition-colors truncate font-['Outfit']"
                          >
                            {person.name}
                          </Link>
                          <span className="text-[11px] text-indigo-400 font-medium">{person.handle}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{person.email}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                          <span className="text-violet-400 font-semibold">{person.stats.circlesCount} Circles</span>
                          <span>•</span>
                          <span className="text-rose-400 font-semibold">{person.stats.followersCount} Followers</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFollowPerson(person.id)}
                      disabled={followLoadingMap[person.id]}
                      className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                        person.isFollowing
                          ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      }`}
                    >
                      {followLoadingMap[person.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : person.isFollowing ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-2">
                  <p className="text-xs text-slate-300 font-semibold">No people found matching "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-500">
                    Try searching for MishtiX, EventSphere, PulseFit, or Lasandi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: TASTE PROFILE ONBOARDING WIZARD */}
      {/* ========================================================================= */}
      {isOnboardingOpen && (
        <TasteOnboardingWizard
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onComplete={() => {
            setIsOnboardingOpen(false);
            fetchProfileData();
          }}
        />
      )}
    </div>
  );
};
export default ProfilePage;

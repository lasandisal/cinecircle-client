import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2,
  RefreshCw,
  Star,
  Film,
  Tv,
  TrendingUp,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { ActiveCirclesBar } from '../components/social/ActiveCirclesBar';
import { SoloDecisionWidget } from '../components/social/SoloDecisionWidget';
import { SocialFeedPost } from '../components/social/SocialFeedPost';
import type { FeedPostProps } from '../components/social/SocialFeedPost';
import { GroupSessionCard } from '../components/social/GroupSessionCard';
import type { GroupPollProps } from '../components/social/GroupSessionCard';
import { LeftNavSidebar } from '../components/social/LeftNavSidebar';
import { RightSocialSidebar } from '../components/social/RightSocialSidebar';
import { TitlePoster } from '../components/common/TitlePoster';
import { socialService } from '../services/social.service';
import { titleService } from '../services/title.service';
import { useAppSelector } from '../hooks/useAppRedux';
import type { Title } from '../types';

type FeedTab = 'for-you' | 'following' | 'trending';

interface TrendingSectionProps {
  titles: Title[];
  loading: boolean;
  source: 'tmdb' | 'catalogue';
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ titles, loading, source }) => (
  <section className="space-y-3">
    <div>
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span>{source === 'tmdb' ? 'Trending This Week' : 'Top Rated in Catalogue'}</span>
      </h2>
      <p className="text-[11px] text-slate-500 mt-0.5">
        {source === 'tmdb'
          ? 'Live popularity data from TMDB · open a title to rate and review it'
          : 'Highest-rated titles in the CineCircle catalogue · open one to rate and review'}
      </p>
    </div>

    {loading ? (
      <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading what&apos;s popular right now...</p>
      </div>
    ) : titles.length === 0 ? (
      <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/30 border border-slate-800/80 rounded-2xl">
        Trending titles are unavailable right now. Please try again shortly.
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {titles.map((title) => (
          <Link
            key={title._id || title.tmdbId}
            to={`/title/${title._id || title.tmdbId}${title.type ? `?type=${title.type}` : ''}`}
            className="group bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <div className="relative aspect-[2/3] bg-slate-950 overflow-hidden">
              <TitlePoster
                src={title.posterUrl}
                alt={title.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                iconClassName="w-8 h-8"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white uppercase flex items-center gap-1">
                {title.type === 'tv' ? <Tv className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                <span>{title.type === 'tv' ? 'TV' : 'Film'}</span>
              </span>

              {(title.voteAverage ?? 0) > 0 && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  {(title.voteAverage ?? 0).toFixed(1)}
                </span>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                  {title.name}
                </p>
                {title.releaseYear ? (
                  <p className="text-[10px] text-slate-400 mt-0.5">{title.releaseYear}</p>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    )}

    <p className="text-[11px] text-slate-500 flex items-center gap-1">
      <ArrowRight className="w-3 h-3" />
      CineCircle is a review community — pick a title to read reviews or write your own.
    </p>
  </section>
);

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [posts, setPosts] = useState<FeedPostProps[]>([]);
  const [featuredPoll, setFeaturedPoll] = useState<GroupPollProps | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [trendingTitles, setTrendingTitles] = useState<Title[]>([]);
  const [trendingSource, setTrendingSource] = useState<'tmdb' | 'catalogue'>('catalogue');
  const [trendingLoading, setTrendingLoading] = useState<boolean>(true);

  // Only the "following" tab has a server-side filter; the other two are the
  // same global feed and are ranked differently on the client.
  const feedFilter = activeTab === 'following' ? 'following' : 'all';

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [feedPosts, activeSessionsData] = await Promise.all([
        socialService.getFeed(1, 15, feedFilter),
        socialService.getActiveSessions(),
      ]);
      setPosts(feedPosts);
      if (activeSessionsData.featuredPoll) {
        setFeaturedPoll(activeSessionsData.featuredPoll);
      }
    } catch (err) {
      console.error('Failed to load live feed data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTrending = async () => {
    setTrendingLoading(true);
    try {
      const { titles, source } = await titleService.getTrendingFeed('all');
      setTrendingTitles(titles);
      setTrendingSource(source);
    } catch (err) {
      console.error('Failed to load trending titles:', err);
    } finally {
      setTrendingLoading(false);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  useEffect(() => {
    loadData();
  }, [feedFilter]);

  // A guest must never be left on a members-only tab.
  useEffect(() => {
    if (!isAuthenticated && activeTab === 'following') {
      setActiveTab('for-you');
    }
  }, [isAuthenticated, activeTab]);

  // "Trending" is the same global feed ordered by engagement.
  const visiblePosts =
    activeTab === 'trending'
      ? [...posts].sort(
          (a, b) =>
            (b.likesCount ?? 0) + (b.commentsCount ?? 0) - ((a.likesCount ?? 0) + (a.commentsCount ?? 0))
        )
      : posts;

  const refreshAll = () => {
    loadData(true);
    loadTrending();
  };

  const communityFeed = (
    <div className="space-y-6">
      {loading ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading community activity...</p>
        </div>
      ) : (
        <>
          {/* Live Group Session Poll Card */}
          {featuredPoll && <GroupSessionCard session={featuredPoll} />}

          {/* User Review Activity Cards */}
          {posts.length > 0 ? (
            visiblePosts.map((post) => <SocialFeedPost key={post.id} post={post} />)
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-2">
              {activeTab === 'following' ? (
                <>
                  <p className="font-semibold text-slate-400">
                    Nothing from the people you follow yet.
                  </p>
                  <p className="text-xs">
                    Follow members from the sidebar and their reviews will show up here.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-400">No community reviews yet.</p>
                  <p className="text-xs">
                    {isAuthenticated
                      ? 'Pick a title from Trending and write the first review!'
                      : 'Sign in to write the first review, or browse what is trending above.'}
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex gap-8">
      {/* Left Social Navigation & Profile Sidebar */}
      <LeftNavSidebar activeTab={activeTab} setActiveTab={(tab: any) => setActiveTab(tab)} />

      {/* Center Social Feed Stream */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Active Circles Carousel (Live Watch Parties) */}
        <ActiveCirclesBar />

        {/* Solo Decision Context Prompt Widget */}
        <SoloDecisionWidget />

        {/* Guest landing: real, live titles before sign-in (Netflix-style) */}
        {!isAuthenticated ? (
          <>
            <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Welcome to CineCircle
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                  Decide what to watch — together
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                  CineCircle is a review and decision community for TV &amp; film. Browse
                  what&apos;s popular, then sign in to rate titles, write reviews and vote
                  with friends.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/60 flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn className="w-4 h-4 text-indigo-400" />
                  Sign In
                </Link>
              </div>
            </div>

            <TrendingSection
              titles={trendingTitles}
              loading={trendingLoading}
              source={trendingSource}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  Recent Community Reviews
                </h2>
                <button
                  onClick={refreshAll}
                  disabled={refreshing}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>
              {communityFeed}
            </div>
          </>
        ) : (
          <>
            {/* Feed Stream Tabs */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('for-you')}
                  className={`text-sm font-bold pb-1 transition-all whitespace-nowrap ${
                    activeTab === 'for-you'
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  For You
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`text-sm font-bold pb-1 transition-all whitespace-nowrap ${
                    activeTab === 'following'
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Following Activity
                </button>
                <button
                  onClick={() => setActiveTab('trending')}
                  className={`text-sm font-bold pb-1 transition-all whitespace-nowrap ${
                    activeTab === 'trending'
                      ? 'text-white border-b-2 border-indigo-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Trending
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={refreshAll}
                  disabled={refreshing}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Refresh feed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Live community activity
                </span>
              </div>
            </div>

            {activeTab === 'trending' ? (
              <TrendingSection
                titles={trendingTitles}
                loading={trendingLoading}
                source={trendingSource}
              />
            ) : (
              communityFeed
            )}
          </>
        )}
      </div>

      {/* Right Social Sidebar with real users and trending catalogue */}
      <RightSocialSidebar />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2,
  RefreshCw,
  Star,
  Film,
  Tv,
  TrendingUp,
  Sparkles,
  UserCheck,
  Clock,
  PenLine,
  Users,
  ChevronRight,
} from 'lucide-react';
import { ActiveCirclesBar } from '../components/social/ActiveCirclesBar';
import { SocialFeedPost } from '../components/social/SocialFeedPost';
import type { FeedPostProps } from '../components/social/SocialFeedPost';
import { LeftNavSidebar } from '../components/social/LeftNavSidebar';
import { RightSocialSidebar } from '../components/social/RightSocialSidebar';
import { TitlePoster } from '../components/common/TitlePoster';
import { socialService } from '../services/social.service';
import { titleService } from '../services/title.service';
import { useAppSelector } from '../hooks/useAppRedux';
import type { Title } from '../types';

type FeedTab = 'for-you' | 'connections' | 'trending';

const titleHref = (title: Title) =>
  `/title/${title._id || title.tmdbId}${title.type ? `?type=${title.type}` : ''}`;

/**
 * Netflix-style hero for signed-out visitors.
 * Background features a TV series poster mosaic (like Netflix sign-in page).
 * CTA always points to signing in - the Navbar provides Register link too,
 * but CineCircle does not stream any video.
 * The background image should be placed in public/ as: CineCircle-Poster-Mosaic.jpg
 */
interface TrendingSectionProps {
  titles: Title[];
  loading: boolean;
  source: 'tmdb' | 'catalogue';
}

const GuestHero: React.FC<{ featured?: Title; loading: boolean }> = ({ featured, loading }) => {
  const heroBg = featured?.backdropUrl
    ? `url("${featured.backdropUrl}")`
    : 'url("/CineCircle-Poster-Mosaic.jpg")';

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900 min-h-[var(--guest-hero-min-h)] sm:min-h-[500px] flex items-end shadow-2xl shadow-black/40 guest-hero"
      style={{ backgroundImage: heroBg }}
    >
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 to-slate-950/30" />

      <div className="relative z-10 w-full p-5 sm:p-8 lg:p-10 space-y-4 max-w-2xl">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-300" />
          {loading ? 'Loading community picks…' : 'Currently trending'}
        </span>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.05] text-white font-['Outfit'] drop-shadow-lg">
          {featured?.name || 'Your next watch, decided together.'}
        </h1>

        {/* Meta */}
        {featured && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-300">
            <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white">
              {featured.type === 'tv' ? 'Series' : 'Film'}
            </span>
            {featured.releaseYear ? <span>{featured.releaseYear}</span> : null}
            {(featured.voteAverage ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                {(featured.voteAverage ?? 0).toFixed(1)}
              </span>
            )}
            {(featured.runtimeMinutes ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {featured.runtimeMinutes}m
              </span>
            )}
            {featured.genres?.length > 0 && (
              <span className="hidden sm:inline text-slate-400">
                {featured.genres.slice(0, 2).join(' · ')}
              </span>
            )}
          </div>
        )}

        {/* Synopsis / pitch */}
        <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed line-clamp-3 max-w-xl">
          {featured?.synopsis ||
            'Rate films you\'ve seen, write honest reviews, follow people with great taste, and use group voting to end the "what should we watch?" debate — for free, no subscription required.'}
        </p>
      </div>
    </section>
  );
};

/**
 * Netflix-style horizontal trending rail.
 * Posters are laid out horizontally in one section with enough vertical
 * space at the bottom for the card content to be fully visible.
 */
const TrendingSection: React.FC<TrendingSectionProps> = ({
  titles,
  loading,
  source,
}) => {
  return (
    <section
      id="trending"
      className="relative left-1/2 ml-[-50vw] w-screen scroll-mt-20 min-h-[300px] bg-slate-950/50 border-t border-slate-800/50 border-b border-slate-800/50"
    >
      <div className="flex flex-col lg:flex-row gap-6 px-0 py-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-end justify-between gap-3 px-4 sm:px-8 lg:px-12">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{source === 'tmdb' ? 'Trending This Week' : 'Top Rated in Catalogue'}</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {source === 'tmdb'
                  ? 'Live popularity data from TMDB · open a title to rate and review it'
                  : 'Highest-rated titles in the CineCircle catalogue · open one to rate and review'}
              </p>
            </div>
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-500 shrink-0">
              Swipe to explore <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Netflix-style rail with breathing room at both scroll endpoints. */}
          <div className="w-full overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-4 sm:px-8 lg:px-12 pb-6">
            {loading ? (
              <div className="flex w-max gap-3 sm:gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="w-[180px] sm:w-[220px] lg:w-[240px] shrink-0 space-y-2 snap-start">
                    <div className="aspect-video rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse" />
                    <div className="h-3 w-4/5 rounded bg-slate-900/70 animate-pulse" />
                    <div className="h-2.5 w-2/5 rounded bg-slate-900/70 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : titles.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/30 border border-slate-800/80 rounded-2xl">
                Trending titles are unavailable right now. Please try again shortly.
              </div>
            ) : (
              <div className="flex w-max gap-3 sm:gap-4">
                {titles.map((title, index) => (
                  <div
                    key={title._id || title.tmdbId}
                    className="w-[180px] sm:w-[220px] lg:w-[240px] shrink-0 snap-start"
                  >
                    <Link
                      to={titleHref(title)}
                      className="group block hover:text-indigo-300 transition-colors"
                    >
                      <div
                        className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 group-hover:border-indigo-500/60 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-indigo-500/15"
                      >
                        <TitlePoster
                          src={title.backdropUrl || title.posterUrl}
                          alt={title.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          iconClassName="w-8 h-8"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />

                        {index < 10 && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[9px] font-black text-white">
                            #{index + 1}
                          </span>
                        )}

                        {(title.voteAverage ?? 0) > 0 && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            {(title.voteAverage ?? 0).toFixed(1)}
                          </span>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                            {title.type === 'tv' ? <Tv className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                            {title.type === 'tv' ? 'Series' : 'Film'}
                          </span>
                          <p className="text-[11px] sm:text-xs font-bold text-white line-clamp-2 leading-snug mt-0.5 overflow-hidden">
                            {title.name}
                          </p>
                        </div>
                      </div>

                      <div className="pt-1">
                        <p className="text-[11px] font-semibold text-slate-300 group-hover:text-indigo-300 truncate overflow-hidden transition-colors">
                          {title.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate overflow-hidden">
                          {title.releaseYear ? title.releaseYear : 'Year unknown'}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/** Short, honest explanation of what a visitor gets by joining. */
const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Star,
      title: 'Rate what you watch',
      text: 'Give films and series your own score, from a quick gut reaction to a detailed breakdown.',
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: PenLine,
      title: 'Write real reviews',
      text: 'Share spoiler-safe thoughts, reply to other members and build a taste profile that is truly yours.',
      accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      icon: Users,
      title: 'Decide together',
      text: 'Open a Circle when nobody can choose. Everyone votes, and CineCircle finds the fairest compromise.',
      accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white">How CineCircle works</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          A social review platform built to end the &ldquo;what should we watch?&rdquo; loop.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 space-y-2.5"
          >
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${step.accent}`}>
              <step.icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">{step.title}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [posts, setPosts] = useState<FeedPostProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [trendingTitles, setTrendingTitles] = useState<Title[]>([]);
  const [trendingSource, setTrendingSource] = useState<'tmdb' | 'catalogue'>('catalogue');
  const [trendingLoading, setTrendingLoading] = useState<boolean>(true);

  // Only the "connections" tab has a server-side filter; the other two are the
  // same global feed and are ranked differently on the client.
  const feedFilter = activeTab === 'connections' ? 'connections' : 'all';

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [feedPosts, activeSessionsData] = await Promise.all([
        socialService.getFeed(1, 15, feedFilter),
        socialService.getActiveSessions(),
      ]);
      setPosts(feedPosts);
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
    if (!isAuthenticated && activeTab === 'connections') {
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
          {/* User Review Activity Cards */}
          {posts.length > 0 ? (
            <div
              className={
                isAuthenticated
                  ? 'space-y-6'
                  : 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'
              }
            >
              {visiblePosts.map((post) => (
                <SocialFeedPost key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-2">
              {activeTab === 'connections' ? (
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
        {!isAuthenticated ? (
          /* Guest landing: cinematic hero, real live titles, and a clear
             explanation of the community before any sign-in wall. */
          <>
            <GuestHero featured={trendingTitles[0]} loading={trendingLoading} />

            <TrendingSection
              titles={trendingTitles}
              loading={trendingLoading}
              source={trendingSource}
            />

            <HowItWorks />

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    Recent Community Reviews
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Real ratings and takes from CineCircle members.
                  </p>
                </div>
                <button
                  onClick={refreshAll}
                  disabled={refreshing}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>
              {communityFeed}
            </section>

            <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/30 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-white font-['Outfit']">
                  Ready to rate, review and decide together?
                </h2>
                <p className="text-xs text-slate-400">
                  Create a free account and start building your watch history today.
                </p>
              </div>
              {/* No duplicate CTA here - the navbar provides Sign In/Register for guests. */}
            </div>
            </>
        ) : (
          <>
            {/* Active Circles Carousel (Live Watch Parties) */}
            <ActiveCirclesBar />

            {/* Feed Stream Tabs */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
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
                  onClick={() => setActiveTab('connections')}
                  className={`text-sm font-bold pb-1 transition-all whitespace-nowrap ${
                    activeTab === 'connections'
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
      {isAuthenticated && <RightSocialSidebar />}
    </div>
  );
};
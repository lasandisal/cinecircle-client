import React, { useState, useEffect } from 'react';
import { ActiveCirclesBar } from '../components/social/ActiveCirclesBar';
import { SoloDecisionWidget } from '../components/social/SoloDecisionWidget';
import { SocialFeedPost } from '../components/social/SocialFeedPost';
import type { FeedPostProps } from '../components/social/SocialFeedPost';
import { GroupSessionCard } from '../components/social/GroupSessionCard';
import type { GroupPollProps } from '../components/social/GroupSessionCard';
import { LeftNavSidebar } from '../components/social/LeftNavSidebar';
import { RightSocialSidebar } from '../components/social/RightSocialSidebar';
import { socialService } from '../services/social.service';
import { Loader2, RefreshCw } from 'lucide-react';

type FeedTab = 'for-you' | 'following' | 'trending';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [posts, setPosts] = useState<FeedPostProps[]>([]);
  const [featuredPoll, setFeaturedPoll] = useState<GroupPollProps | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  useEffect(() => {
    loadData();
  }, [feedFilter]);

  // "Trending" is a different ordering of the same global feed (most-engaged
  // first). It was previously the identical array under a different tab colour.
  const visiblePosts =
    activeTab === 'trending'
      ? [...posts].sort(
          (a, b) =>
            (b.likesCount ?? 0) + (b.commentsCount ?? 0) - ((a.likesCount ?? 0) + (a.commentsCount ?? 0))
        )
      : posts;

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

        {/* Feed Stream Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('for-you')}
              className={`text-sm font-bold pb-1 transition-all ${
                activeTab === 'for-you'
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`text-sm font-bold pb-1 transition-all ${
                activeTab === 'following'
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Following Activity
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`text-sm font-bold pb-1 transition-all ${
                activeTab === 'trending'
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trending Decision Polls
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh live feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Live Real-Time MongoDB Feed
            </span>
          </div>
        </div>

        {/* Stream of Posts and Polls */}
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading community activity...</p>
            </div>
          ) : (
            <>
              {/* Live Group Session Poll Card from MongoDB */}
              {featuredPoll && <GroupSessionCard session={featuredPoll} />}

              {/* User Review Activity Cards from MongoDB */}
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
                    <p>No community reviews yet. Visit a title to write the first review!</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Social Sidebar with real users and trending catalogue */}
      <RightSocialSidebar />
    </div>
  );
};

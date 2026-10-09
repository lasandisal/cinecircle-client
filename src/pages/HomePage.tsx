import React, { useState } from 'react';
import { ActiveCirclesBar } from '../components/social/ActiveCirclesBar';
import { SoloDecisionWidget } from '../components/social/SoloDecisionWidget';
import { SocialFeedPost } from '../components/social/SocialFeedPost';
import type { FeedPostProps } from '../components/social/SocialFeedPost';
import { GroupSessionCard } from '../components/social/GroupSessionCard';
import type { GroupPollProps } from '../components/social/GroupSessionCard';
import { LeftNavSidebar } from '../components/social/LeftNavSidebar';
import { RightSocialSidebar } from '../components/social/RightSocialSidebar';

const SAMPLE_POSTS: FeedPostProps[] = [
  {
    id: 'post-1',
    author: {
      name: 'Marcus Vance',
      handle: '@marcusv',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
      mutualCount: 14,
    },
    titleData: {
      id: 'dune-2',
      name: 'Dune: Part Two',
      year: 2024,
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&h=300&fit=crop',
      genres: ['Sci-Fi', 'Adventure'],
      runtime: '166 min',
      streamingServices: ['Max', 'Prime Video'],
    },
    rating: 5,
    reviewText:
      'The sound design and scale in the second half left our whole group speechless. A monumental piece of sci-fi cinema.',
    timestamp: '18m ago',
    likesCount: 34,
    commentsCount: 9,
  },
  {
    id: 'post-2',
    author: {
      name: 'Elena Rostova',
      handle: '@elena_films',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces',
      mutualCount: 8,
    },
    titleData: {
      id: 'severance',
      name: 'Severance (Season 2)',
      year: 2025,
      poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=300&fit=crop',
      genres: ['Drama', 'Sci-Fi', 'Thriller'],
      runtime: '55 min/ep',
      streamingServices: ['Apple TV+'],
    },
    rating: 5,
    reviewText:
      'Episode 4 broke the tension meter. If you picked "Gripping" in your solo mood prompt, this is non-negotiable.',
    timestamp: '1h ago',
    likesCount: 52,
    commentsCount: 14,
  },
  {
    id: 'post-3',
    author: {
      name: 'Jordan Hayes',
      handle: '@jordan_h',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
      mutualCount: 19,
    },
    titleData: {
      id: 'past-lives',
      name: 'Past Lives',
      year: 2023,
      poster: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=200&h=300&fit=crop',
      genres: ['Drama', 'Romance'],
      runtime: '106 min',
      streamingServices: ['Netflix', 'Prime Video'],
    },
    rating: 4,
    reviewText:
      'Heartbreakingly restrained. Rewatched it tonight as a comfort pick after a long week. Still hits just as hard.',
    timestamp: '3h ago',
    likesCount: 29,
    commentsCount: 6,
  },
];

const SAMPLE_GROUP_POLL: GroupPollProps = {
  id: 'poll-1',
  roomName: 'Friday Night Sci-Fi Debates',
  joinCode: 'SCI890',
  hostName: 'Marcus Vance',
  participants: [
    { name: 'Marcus', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
    { name: 'Elena', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { name: 'Jordan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
    { name: 'Maya', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
  ],
  candidates: [
    {
      id: 'c1',
      title: 'Interstellar',
      poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&h=160&fit=crop',
      scorePercent: 88,
      isLeader: true,
    },
    {
      id: 'c2',
      title: 'Blade Runner 2049',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&h=160&fit=crop',
      scorePercent: 74,
    },
    {
      id: 'c3',
      title: 'Arrival',
      poster: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=120&h=160&fit=crop',
      scorePercent: 65,
    },
  ],
  status: 'voting',
  aiCompromisePitch:
    'Marcus wanted mind-bending space exploration while Jordan needed emotional depth. "Interstellar" is the definitive compromise winner — black hole physics for Marcus, heartfelt father-daughter tears for Jordan. Settle in, the debate is officially resolved!',
};


export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'trending'>('for-you');

  return (
    <div className="flex gap-8">
      {/* Left Social Navigation & Profile Sidebar */}
      <LeftNavSidebar activeTab={activeTab} setActiveTab={(tab: any) => setActiveTab(tab)} />

      {/* Center Social Feed Stream */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Active Circles Carousel (Stories bar) */}
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
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Live Circle Updates • Real-time
          </span>
        </div>

        {/* Stream of Posts and Polls */}
        <div className="space-y-6">
          {/* Live Group Session Poll Card */}
          <GroupSessionCard session={SAMPLE_GROUP_POLL} />

          {/* User Review Activity Cards */}
          {SAMPLE_POSTS.map((post) => (
            <SocialFeedPost key={post.id} post={post} />
          ))}
        </div>
      </div>

      {/* Right Social Sidebar */}
      <RightSocialSidebar />
    </div>
  );
};

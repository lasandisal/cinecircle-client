import React, { useState, useRef, useEffect } from 'react';
import { Bell, Users, Star, UserPlus, Sparkles, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface NotificationItem {
  id: string;
  type: 'circle' | 'rating' | 'follow' | 'verdict';
  actorName: string;
  actorAvatar: string;
  title: string;
  detail?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'circle',
    actorName: 'Marcus Vance',
    actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    title: 'invited you to join a live watch circle: "Friday Night Sci-Fi Debates"',
    detail: 'Room Code: #SCI890 • 4 participants voting',
    timestamp: '4m ago',
    read: false,
    actionUrl: '/group',
    actionText: 'Join Room',
  },
  {
    id: 'n2',
    type: 'follow',
    actorName: 'Maya Chen',
    actorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    title: 'started following you. You share 16 mutual watched titles!',
    detail: '94% Cinematic Taste Compatibility',
    timestamp: '28m ago',
    read: false,
    actionUrl: '/profile/maya',
    actionText: 'Follow Back',
  },
  {
    id: 'n3',
    type: 'rating',
    actorName: 'Elena Rostova',
    actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    title: 'rated Severance (Season 2) ★★★★★',
    detail: '"Episode 4 broke the tension meter..."',
    timestamp: '1h ago',
    read: false,
    actionUrl: '/title/severance',
    actionText: 'View',
  },
  {
    id: 'n4',
    type: 'verdict',
    actorName: 'CineCircle AI',
    actorAvatar: '/logo.png',
    title: 'Compromise verdict resolved in "Late Night Thriller"!',
    detail: 'Winner: "Arrival" with 84% compromise score',
    timestamp: '1d ago',
    read: true,
    actionUrl: '/title/arrival',
    actionText: 'View Result',
  },
];

export const NotificationsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'circles'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredNotifications =
    activeTab === 'circles'
      ? notifications.filter((n) => n.type === 'circle' || n.type === 'verdict')
      : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all relative active:scale-95 ${
          isOpen
            ? 'bg-slate-800 border-indigo-500/50 text-white'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-slate-400 hover:text-indigo-400 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-800/80 bg-slate-900/40 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setActiveTab('circles')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'circles'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Watch Circles & Invites
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-850/60 no-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No notifications in this tab.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-3.5 flex gap-3 hover:bg-slate-900/50 transition-colors cursor-pointer ${
                    !n.read ? 'bg-indigo-950/15' : ''
                  }`}
                >
                  {/* Avatar with icon badge */}
                  <div className="relative shrink-0">
                    <img
                      src={n.actorAvatar}
                      alt={n.actorName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {n.type === 'circle' && <Users className="w-2.5 h-2.5 text-indigo-400" />}
                      {n.type === 'follow' && <UserPlus className="w-2.5 h-2.5 text-emerald-400" />}
                      {n.type === 'rating' && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                      {n.type === 'verdict' && <Sparkles className="w-2.5 h-2.5 text-cyan-400" />}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-slate-200 leading-snug">
                      <strong className="text-white font-semibold hover:underline">
                        {n.actorName}
                      </strong>{' '}
                      {n.title}
                    </p>

                    {n.detail && (
                      <p className="text-[11px] text-slate-400 font-medium italic">
                        {n.detail}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">{n.timestamp}</span>

                      {n.actionText && (
                        <Link
                          to={n.actionUrl || '#'}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-all active:scale-95"
                        >
                          {n.actionText}
                        </Link>
                      )}
                    </div>
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 self-center"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/40 text-center">
            <span className="text-[10px] text-slate-500">
              CineCircle Live Social Notifications
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

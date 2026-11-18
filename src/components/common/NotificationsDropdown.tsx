import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Users, UserPlus, UserCheck, Sparkles, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppRedux';
import { userService } from '../../services/user.service';
import { sessionService } from '../../services/session.service';

export interface NotificationItem {
  id: string;
  type: 'circle' | 'rating' | 'follow' | 'connection' | 'verdict';
  actorName: string;
  actorAvatar: string;
  title: string;
  detail?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  joinCode?: string;
  actionText?: string;
  requestId?: string;
  invitationId?: string;
  sessionId?: string;
}

const resolveActionUrl = (n: NotificationItem): string | undefined => {
  if (n.actionUrl && n.actionUrl.includes('?code=')) {
    return n.actionUrl;
  }
  if (n.joinCode) {
    return `/group?code=${n.joinCode.replace(/^#/, '').toUpperCase().trim()}`;
  }
  const match = n.detail?.match(/Room Code:\s*#?([A-Za-z0-9]+)/i);
  if (match && match[1]) {
    return `/group?code=${match[1].toUpperCase().trim()}`;
  }
  return n.actionUrl;
};

const STORAGE_KEY = 'cinecircle_read_notifications_v2';

export const NotificationsDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [requestActionError, setRequestActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'circles'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load real notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const data = await userService.getNotifications();
      let readIds = new Set<string>();
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) readIds = new Set(JSON.parse(raw));
      } catch {
        // fallback
      }

      const parsed: NotificationItem[] = (data || []).map((n: any) => ({
        ...n,
        read: n.read || readIds.has(n.id),
      }));

      setNotifications(parsed);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.removeItem('cinecircle_read_notifications_v1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, fetchNotifications]);

  const unreadCount = isAuthenticated ? notifications.filter((n) => !n.read).length : 0;

  const persistReadIds = (readIds: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
    } catch (e) {
      console.error('Failed to save read notifications', e);
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persistReadIds(updated.map((n) => n.id));
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      const readIds = updated.filter((n) => n.read).map((n) => n.id);
      persistReadIds(readIds);
      return updated;
    });
  };

  const respondToConnectionRequest = async (notification: NotificationItem, status: 'accepted' | 'rejected') => {
    if (!notification.requestId || requestActionId) return;

    try {
      setRequestActionId(notification.id);
      setRequestActionError(null);
      await userService.respondToConnection(notification.requestId, status);
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
    } catch (error) {
      console.error(`Failed to ${status === 'accepted' ? 'accept' : 'ignore'} connection request:`, error);
      setRequestActionError('Unable to update this request. Please try again.');
    } finally {
      setRequestActionId(null);
    }
  };

  const respondToSessionInvitation = async (notification: NotificationItem, status: 'accepted' | 'rejected') => {
    if (!notification.invitationId || requestActionId) return;

    try {
      setRequestActionId(notification.id);
      setRequestActionError(null);
      const result = await sessionService.respondToInvitation(notification.invitationId, status);
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
      if (status === 'accepted') {
        setIsOpen(false);
        navigate(`/group?code=${result.joinCode}`);
      }
    } catch (error) {
      console.error(`Failed to ${status === 'accepted' ? 'accept' : 'ignore'} circle invitation:`, error);
      setRequestActionError('Unable to update this invitation. Please try again.');
    } finally {
      setRequestActionId(null);
    }
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
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && isAuthenticated) {
            fetchNotifications();
          }
        }}
        title="Notifications"
        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all relative active:scale-95 cursor-pointer ${
          isOpen
            ? unreadCount > 0
              ? 'bg-rose-500/15 border-rose-500/60 text-rose-300'
              : 'bg-slate-800 border-indigo-500/50 text-white'
            : unreadCount > 0
              ? 'bg-rose-500/10 border-rose-500/50 text-rose-300 hover:bg-rose-500/20'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-rose-300' : ''}`} />
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
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              ) : isAuthenticated ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  All caught up
                </span>
              ) : null}
            </div>

            {isAuthenticated && unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-slate-400 hover:text-indigo-400 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Guest State: Prompt to sign in */}
          {!isAuthenticated ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white font-['Outfit']">Sign In for Notifications</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Join CineCircle to receive real watch circle invitations, friend follows, and group decisions.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
                >
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-800/80 bg-slate-900/40 text-xs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Activity
                </button>
                <button
                  onClick={() => setActiveTab('circles')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
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
                {loading ? (
                  <div className="py-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Loading real notifications...</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-12 px-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
                      <Bell className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300">No notifications yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      When friends invite you to a watch circle or follow your profile, they will appear here.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => {
                    const targetUrl = resolveActionUrl(n);
                    return (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (targetUrl && !n.requestId && !n.invitationId) {
                          setIsOpen(false);
                          navigate(targetUrl);
                        }
                      }}
                      className={`p-3.5 flex gap-3 hover:bg-slate-900/60 transition-colors cursor-pointer ${
                        !n.read ? 'bg-indigo-950/25 border-l-2 border-indigo-500' : ''
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
                          {n.type === 'connection' && <UserCheck className="w-2.5 h-2.5 text-teal-400" />}
                          {n.type === 'verdict' && <Sparkles className="w-2.5 h-2.5 text-cyan-400" />}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs text-slate-200 leading-snug">
                          {targetUrl ? (
                            <Link
                              to={targetUrl}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                                setIsOpen(false);
                              }}
                              className="text-white font-semibold hover:underline"
                            >
                              {n.actorName}
                            </Link>
                          ) : (
                            <strong className="text-white font-semibold">{n.actorName}</strong>
                          )}
                          {' '}
                          {n.title}
                        </p>

                        {n.detail && (
                          <p className="text-[11px] text-slate-400 font-medium italic">
                            {n.detail}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500">{n.timestamp}</span>

                          {n.requestId || n.invitationId ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={requestActionId === n.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                  void (n.requestId
                                    ? respondToConnectionRequest(n, 'accepted')
                                    : respondToSessionInvitation(n, 'accepted'));
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                              >
                                {requestActionId === n.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Accept'}
                              </button>
                              <button
                                type="button"
                                disabled={requestActionId === n.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                  void (n.requestId
                                    ? respondToConnectionRequest(n, 'rejected')
                                    : respondToSessionInvitation(n, 'rejected'));
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                              >
                                Ignore
                              </button>
                            </div>
                          ) : n.actionText && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                                setIsOpen(false);
                                if (targetUrl) {
                                  navigate(targetUrl);
                                }
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              {n.actionText}
                            </button>
                          )}
                        </div>
                        {requestActionError && requestActionId === null && (n.requestId || n.invitationId) && (
                          <p className="text-[10px] text-rose-400">{requestActionError}</p>
                        )}
                      </div>

                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 self-center shadow-sm shadow-indigo-500/50"></span>
                      )}
                    </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/40 text-center">
                <span className="text-[10px] text-slate-500">
                  CineCircle Live Social Notifications
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;

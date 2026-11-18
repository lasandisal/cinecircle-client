import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Bookmark,
  Search,
  Plus,
  X,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Loader2,
  Film,
  Star,
} from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppRedux';
import { logout } from '../../store/slices/authSlice';
import { titleService } from '../../services/title.service';
import { userService } from '../../services/user.service';
import { authService } from '../../services/auth.service';
import { socketService } from '../../services/socket';
import { clearAuthScopedCache } from '../../services/requestCache';
import type { Title, CommunityPerson } from '../../types';
import { StreamingBadge } from './StreamingBadge';

export const Navbar: React.FC = () => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [userResults, setUserResults] = useState<CommunityPerson[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Recent searches - stores actual resolved entities (titles/members the user
  // actually selected), not every partial/typo keystroke. Max 5, persisted.
  type RecentSearchEntry = {
    type: 'title' | 'member';
    id: string;
    name: string;
    posterOrAvatar: string;
    year?: number;
  };
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([]);
  const RECENT_SEARCHES_KEY = 'cinecircle_recent_searches_v2';
  const MAX_RECENT_SEARCHES = 5;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRequestRef = useRef(0);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // Debounced search logic
  const handleSearch = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();
    const requestId = ++searchRequestRef.current;

    if (!normalizedQuery || normalizedQuery.length < 2) {
      setSearchResults([]);
      setUserResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const [titleResult, userResult] = await Promise.allSettled([
      titleService.search(normalizedQuery),
      isAuthenticated ? userService.searchPeople(normalizedQuery) : Promise.resolve([] as CommunityPerson[]),
    ]);

    if (requestId !== searchRequestRef.current) return;

    if (titleResult.status === 'fulfilled') {
      setSearchResults(titleResult.value);
    } else {
      console.error('[Navbar search] Title search failed:', titleResult.reason);
      setSearchResults([]);
    }

    if (userResult.status === 'fulfilled') {
      setUserResults(userResult.value);
    } else {
      console.error('[Navbar search] Member search failed:', userResult.reason);
      setUserResults([]);
    }
    setIsSearching(false);
  }, [isAuthenticated]);

  // Add a resolved entity (title or member) to recent searches when the user
  // actually selects it - not every partial/typo keystroke.
  const addRecentSearch = useCallback((entry: RecentSearchEntry) => {
    setRecentSearches((prev) => {
      // Remove any existing entry with the same id, then prepend.
      const filtered = prev.filter((e) => e.id !== entry.id);
      const next = [entry, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
  }, []);

  // Remove a specific recent search by id
  const removeRecentSearch = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
  }, []);

  // Select a recent search: fill the input with the name and open the dropdown
  const selectRecentSearch = useCallback((entry: RecentSearchEntry) => {
    setSearchQuery(entry.name);
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setUserResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleSelectTitle = (title: Title) => {
    addRecentSearch({
      type: 'title',
      id: String(title._id || title.tmdbId),
      name: title.name,
      posterOrAvatar: title.posterUrl || '',
      year: title.releaseYear,
    });
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    navigate(`/title/${title._id || title.tmdbId}${title.type ? `?type=${title.type}` : ''}`);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setProfileDropdownOpen(false);
    try {
      // Clears the HttpOnly cookie on the server.
      await authService.logout();
    } catch {
      // Already signed out / offline: local cleanup still has to happen.
    }
    // Drop the socket and its short-lived handshake token with the session.
    socketService.disconnect();
    dispatch(logout());
    // Drop this member's cached responses so the next person to sign in on
    // this browser cannot read their watch circles / join codes.
    clearAuthScopedCache();
    navigate('/login');
    setSigningOut(false);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <img
              src="/logo.png"
              alt="CineCircle"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-800 shadow-md shadow-indigo-500/15 group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-['Outfit']">
              Cine<span className="text-indigo-400">Circle</span>
            </span>
          </Link>

          {/* Desktop Search Bar with Live Results Dropdown. Hidden below lg so
              the tablet navbar (768-1023px) has room for navigation links. */}
          <div className="relative hidden lg:block w-44 xl:w-72 2xl:w-80" ref={searchContainerRef}>
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search movies, TV shows, members..."
              className="w-full pl-8 pr-16 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 pointer-events-none">
              ⌘K
            </kbd>

            {/* Desktop Search Results Dropdown */}
            {searchOpen && (searchQuery.trim().length >= 2 || recentSearches.length > 0) && (
              <div className="absolute left-0 top-full mt-2 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in duration-150">
                {/* Recent Searches section (shown when no active query >= 2 chars) */}
                {searchQuery.trim().length < 2 && recentSearches.length > 0 && (
                  <div className="p-2 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Searches</p>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectRecentSearch(entry);
                          }}
                          className="w-full p-2.5 flex items-center justify-between gap-2 hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-10 rounded bg-slate-950 overflow-hidden shrink-0 flex-shrink-0">
                              {entry.posterOrAvatar ? (
                                <img
                                  src={entry.posterOrAvatar}
                                  alt={entry.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <span className="text-[10px] font-bold">
                                    {entry.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-slate-300 group-hover:text-white truncate min-w-0">
                              {entry.name}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded text-slate-400 shrink-0 ${
                              entry.type === 'title'
                                ? 'bg-slate-800/80 border border-slate-700/60'
                                : 'bg-indigo-950/50 border border-indigo-500/30 text-indigo-300'
                            }`}>
                              {entry.type === 'title' ? entry.year ? `${entry.year}` : 'Title' : 'Member'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(entry.id);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 shrink-0"
                            title="Remove from recent"
                          >
                            <X className="w-3 h-3 shrink-0" />
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live search results section (shown when query >= 2 chars) */}
                {searchQuery.trim().length >= 2 && (
                  <>
                    <div className="p-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {isSearching
                          ? 'Searching catalogue...'
                          : `${searchResults.length} title${searchResults.length === 1 ? '' : 's'} • ${userResults.length} member${userResults.length === 1 ? '' : 's'} found`}
                      </span>
                      {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                      {searchResults.length > 0 ? (
                        searchResults.map((title) => (
                          <button
                            key={title._id || title.tmdbId}
                            onClick={() => handleSelectTitle(title)}
                            className="w-full p-2.5 flex items-start gap-3 hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                          >
                            {/* Poster */}
                            <div className="w-10 h-14 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                              {title.posterUrl ? (
                                <img
                                  src={title.posterUrl}
                                  alt={title.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <Film className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                                  {title.name}
                                </span>
                                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                                  {title.type === 'film' ? 'Film' : 'TV'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {title.releaseYear && <span>{title.releaseYear}</span>}
                                {title.runtimeMinutes > 0 && <span>• {title.runtimeMinutes}m</span>}
                                {title.voteAverage ? (
                                  <span className="flex items-center gap-0.5 text-amber-400">
                                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                                    {title.voteAverage}
                                  </span>
                                ) : null}
                              </div>

                              {/* Genres */}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {title.genres.slice(0, 2).map((g) => (
                                  <span
                                    key={g}
                                    className="text-[9px] px-1.5 py-0.2 bg-slate-800/80 text-slate-300 rounded"
                                  >
                                    {g}
                                  </span>
                                ))}
                              </div>

                              {/* Streaming Providers */}
                              {title.watchProviders && title.watchProviders.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5">
                                  {title.watchProviders.slice(0, 3).map((wp, idx) => (
                                    <StreamingBadge key={idx} service={wp.service} size="sm" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      ) : !isSearching ? (
                        <div className="p-6 text-center space-y-1">
                          <p className="text-xs text-slate-300 font-medium">No titles found</p>
                          <p className="text-[11px] text-slate-500">
                            Try searching for "Dune", "Bear", "Severance", "Spider", or "Stranger"
                          </p>
                        </div>
                      ) : null}

                      {/* Member results section */}
                      {userResults.length > 0 && (
                        <>
                          <div className="px-3 py-2 border-b border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Members</p>
                          </div>
                          {userResults.map((person) => (
                            <Link
                              key={person.id}
                              to={`/profile/${person.id}`}
                              onClick={() => {
                                addRecentSearch({
                                  type: 'member',
                                  id: person.id,
                                  name: person.name,
                                  posterOrAvatar:
                                    person.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff`,
                                });
                                setSearchOpen(false);
                                setMobileSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full p-2.5 flex items-center gap-3 hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex-shrink-0">
                                {person.avatar ? (
                                  <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold">
                                    {person.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                                    {person.name}
                                  </span>
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                                    {person.handle}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{person.stats.watchedCount} watched</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {userResults.length === 0 && searchResults.length === 0 && !isSearching && (
                            <div className="p-6 text-center space-y-1">
                              <p className="text-xs text-slate-300 font-medium">No members found</p>
                              <p className="text-[11px] text-slate-500">
                                Try searching for a name or handle
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Primary Desktop Nav Links (hidden on mobile, handled by bottom dock) */}
        <nav className="hidden md:flex items-center gap-1 xl:gap-1.5">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-indigo-400 border border-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`
            }
          >
            <span>Feed</span>
          </NavLink>

          <NavLink
            to="/recommend"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-violet-400 border border-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Solo Pick</span>
          </NavLink>

          <NavLink
            to="/group"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-indigo-400 border border-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`
            }
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Circles</span>
          </NavLink>

          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-amber-400 border border-slate-800'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`
            }
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Watchlist</span>
          </NavLink>
        </nav>

        {/* Right Section: Search trigger, notifications, and profile/auth */}
        <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3">
          {/* Search toggle for every screen without the inline search bar. */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="lg:hidden w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 active:scale-95 transition-transform"
            aria-label="Toggle Search"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* New Circle CTA button - only where there is spare horizontal room. */}
          <Link
            to="/group"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Circle</span>
          </Link>

          {/* Notifications only make sense for signed-in members. */}
          {isAuthenticated && <NotificationsDropdown />}

          {/* User Profile / Auth State.
              On mobile the BottomNav already has a Profile tab, so the avatar
              menu is hidden there to avoid two profile entry points. */}
          {isAuthenticated ? (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900/80 border border-transparent hover:border-slate-800 transition-all cursor-pointer group"
                aria-label="User Menu"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-slate-800 group-hover:ring-indigo-500/50">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-200 hidden lg:inline group-hover:text-white max-w-[100px] truncate">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/70 z-50 animate-in fade-in duration-150 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    {user?.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <ShieldCheck className="w-3 h-3 text-indigo-400" /> Admin Curator
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/profile/${user?._id || 'me'}`}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/watchlist"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>Watchlist</span>
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/curator"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 hover:text-white hover:bg-indigo-950/40 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Curator Dashboard</span>
                    </Link>
                  )}

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/login"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/80 transition-all whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/20 transition-all whitespace-nowrap"
              >
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Bar with Live Results */}
      {mobileSearchOpen && (
        <div className="lg:hidden px-3 pb-3 pt-1 border-t border-slate-850 bg-slate-950/95 animate-in fade-in duration-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search films, shows, or members..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Search Results */}
          {(searchQuery.trim().length >= 2 || recentSearches.length > 0) && (
            <div className="mt-2 bg-slate-900 border border-slate-800 rounded-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/50">
              {/* Recent Searches (mobile) */}
              {searchQuery.trim().length < 2 && recentSearches.length > 0 && (
                <div className="p-3 border-b border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recent Searches
                  </p>
                  <div className="space-y-1">
                    {recentSearches.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectRecentSearch(entry);
                        }}
                        className="w-full p-2 flex items-center justify-between gap-2 hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-8 rounded bg-slate-950 overflow-hidden shrink-0 flex-shrink-0">
                            {entry.posterOrAvatar ? (
                              <img
                                src={entry.posterOrAvatar}
                                alt={entry.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <span className="text-[9px] font-bold">
                                  {entry.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-300 group-hover:text-white truncate min-w-0">
                            {entry.name}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded text-slate-400 shrink-0 ${
                            entry.type === 'title'
                              ? 'bg-slate-800/80 border border-slate-700/60'
                              : 'bg-indigo-950/50 border border-indigo-500/30 text-indigo-300'
                          }`}>
                            {entry.type === 'title' ? entry.year ? `${entry.year}` : 'Title' : 'Member'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(entry.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 shrink-0"
                          title="Remove from recent"
                        >
                          <X className="w-3 h-3 shrink-0" />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live search results (mobile) */}
              {searchQuery.trim().length >= 2 && (
                <>
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length > 0 || userResults.length > 0 ? (
                    <>
                      {searchResults.length > 0 && (
                        <>
                          <div className="px-3 py-2 border-b border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Titles</p>
                          </div>
                          {searchResults.map((title) => (
                            <button
                              key={title._id || title.tmdbId}
                              onClick={() => handleSelectTitle(title)}
                              className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-slate-800/50"
                            >
                              <div className="w-9 h-12 rounded bg-slate-950 overflow-hidden shrink-0">
                                {title.posterUrl ? (
                                  <img
                                    src={title.posterUrl}
                                    alt={title.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <Film className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">{title.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {title.releaseYear} • {title.type === 'film' ? 'Film' : 'TV'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      {userResults.length > 0 && (
                        <>
                          <div className="px-3 py-2 border-b border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Members</p>
                          </div>
                          {userResults.map((person) => (
                            <Link
                              key={person.id}
                              to={`/profile/${person.id}`}
                              onClick={() => {
                                addRecentSearch({
                                  type: 'member',
                                  id: person.id,
                                  name: person.name,
                                  posterOrAvatar:
                                    person.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff`,
                                });
                                setSearchOpen(false);
                                setMobileSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-slate-800/50"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex-shrink-0">
                                {person.avatar ? (
                                  <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold">
                                    {person.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">{person.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {person.handle} • {person.stats.watchedCount} watched
                                </p>
                              </div>
                            </Link>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">No results found</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

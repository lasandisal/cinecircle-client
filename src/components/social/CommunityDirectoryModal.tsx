import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Loader2, Search, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { userService } from '../../services/user.service';
import { usePendingActions } from '../../hooks/usePendingActions';
import { useToast } from '../../hooks/useToast';
import type { CommunityPerson } from '../../types';

interface CommunityDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Searchable directory of every member on CineCircle.
 *
 * Extracted from ProfilePage so the feed's "Suggested Members → See all"
 * shortcut can open the same list in place instead of navigating the member
 * away to their profile first.
 *
 * Each row exposes the viewer-relative connection state returned by
 * GET /users/search: Connect, Accept, Request Sent, or Disconnect.
 */
export const CommunityDirectoryModal: React.FC<CommunityDirectoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [searching, setSearching] = useState(false);

  const { begin, end, isPending } = usePendingActions();
  const toast = useToast();

  // Keystrokes fire overlapping requests; only the newest response may write
  // state, otherwise an earlier slow search can overwrite the latest results.
  const requestId = useRef(0);

  const loadPeople = useCallback(async (query: string) => {
    const id = ++requestId.current;
    setSearching(true);
    try {
      const results = await userService.searchPeople(query);
      if (id === requestId.current) setPeople(results);
    } catch (err) {
      console.error('Failed to search community members:', err);
    } finally {
      if (id === requestId.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadPeople(searchQuery);
  }, [isOpen, searchQuery, loadPeople]);

  // Start each visit with an empty filter so a previous search does not hide
  // members the next time the directory is opened.
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const updatePerson = (id: string, patch: Partial<CommunityPerson>) => {
    setPeople((prev) => prev.map((person) => (person.id === id ? { ...person, ...patch } : person)));
  };

  const handleConnect = async (person: CommunityPerson) => {
    const key = `connection:${person.id}`;
    if (!begin(key)) return;
    try {
      await userService.requestConnection(person.id);
      updatePerson(person.id, { connectionStatus: 'pending_sent' });
      toast.success(`Connection request sent to ${person.name}.`);
    } catch (err: any) {
      console.error('Failed to send connection request:', err);
      toast.error(err?.response?.data?.error || 'Could not send the connection request.');
    } finally {
      end(key);
    }
  };

  const handleAccept = async (person: CommunityPerson) => {
    if (!person.connectionRequestId) {
      toast.error('This connection request is no longer available.');
      return;
    }
    const key = `connection:${person.id}`;
    if (!begin(key)) return;
    try {
      await userService.respondToConnection(person.connectionRequestId, 'accepted');
      updatePerson(person.id, { connectionStatus: 'accepted' });
      toast.success(`You are now connected with ${person.name}.`);
    } catch (err: any) {
      console.error('Failed to accept connection request:', err);
      toast.error(err?.response?.data?.error || 'Could not accept the connection request.');
    } finally {
      end(key);
    }
  };

  const handleDisconnect = async (person: CommunityPerson) => {
    if (!window.confirm(`Disconnect from ${person.name}? You can send a new request later.`)) {
      return;
    }
    const key = `connection:${person.id}`;
    if (!begin(key)) return;
    try {
      await userService.removeConnection(person.id);
      updatePerson(person.id, { connectionStatus: 'none', connectionRequestId: undefined });
      toast.success(`Disconnected from ${person.name}.`);
    } catch (err: any) {
      console.error('Failed to disconnect:', err);
      toast.error(err?.response?.data?.error || 'Could not remove the connection.');
    } finally {
      end(key);
    }
  };

  const renderConnectionAction = (person: CommunityPerson) => {
    const status = person.connectionStatus ?? 'none';
    const pending = isPending(`connection:${person.id}`);
    const baseClass =
      'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap';

    if (status === 'accepted') {
      return (
        <button
          type="button"
          onClick={() => handleDisconnect(person)}
          disabled={pending}
          aria-busy={pending}
          className={`${baseClass} bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20`}
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
          <span>{pending ? 'Removing…' : 'Disconnect'}</span>
        </button>
      );
    }

    if (status === 'pending_received') {
      return (
        <button
          type="button"
          onClick={() => handleAccept(person)}
          disabled={pending}
          aria-busy={pending}
          className={`${baseClass} bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20`}
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          <span>{pending ? 'Accepting…' : 'Accept'}</span>
        </button>
      );
    }

    if (status === 'pending_sent') {
      return (
        <span
          className={`${baseClass} bg-slate-800/80 text-slate-400 border-slate-700 cursor-default`}
          title="Waiting for them to respond"
        >
          <Clock className="w-3 h-3" />
          <span>Request Sent</span>
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleConnect(person)}
        disabled={pending}
        aria-busy={pending}
        className={`${baseClass} bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/50`}
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
        <span>{pending ? 'Sending…' : 'Connect'}</span>
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black space-y-5 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white font-['Outfit']">Find More People</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close community directory"
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
          {searching ? (
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
                  <Link to={`/profile/${person.id}`} onClick={onClose} className="shrink-0">
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
                        onClick={onClose}
                        className="text-xs font-bold text-white hover:text-indigo-400 transition-colors truncate font-['Outfit']"
                      >
                        {person.name}
                      </Link>
                      <span className="text-[11px] text-indigo-400 font-medium">{person.handle}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{person.email}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      <span className="text-violet-400 font-semibold">
                        {person.stats.circlesCount} Circles
                      </span>
                      <span>•</span>
                      <span className="text-teal-400 font-semibold">Member</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">{renderConnectionAction(person)}</div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs text-slate-300 font-semibold">
                No people found matching "{searchQuery}"
              </p>
              <p className="text-[11px] text-slate-500">
                Try searching for MishtiX, EventSphere, PulseFit, or Lasandi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { Users, KeyRound, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface GroupPollProps {
  id: string;
  roomName: string;
  joinCode: string;
  hostName: string;
  participants: { name: string; avatar: string }[];
  candidates: {
    id: string;
    title: string;
    poster: string;
    /** Real share of participants who voted yes. */
    scorePercent: number;
    yesCount?: number;
    noCount?: number;
    isLeader?: boolean;
  }[];
  status: 'voting' | 'locked';
  winnerTitle?: string;
  aiCompromisePitch?: string;
}


export const GroupSessionCard: React.FC<{ session: GroupPollProps }> = ({ session }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-950/30 via-slate-900/50 to-slate-900/40 border border-indigo-500/25 rounded-2xl p-5 space-y-4 backdrop-blur-sm shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wide uppercase">
            <Users className="w-3 h-3" /> Live Circle Session
          </div>
          <h3 className="text-base font-bold text-white">{session.roomName}</h3>
          <p className="text-xs text-slate-400">
            Hosted by <span className="text-slate-200 font-medium">{session.hostName}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-400">
          <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
          <span>#{session.joinCode}</span>
        </div>
      </div>

      {/* Participant avatars stack */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 overflow-hidden">
          {session.participants.map((p, i) => (
            <img
              key={i}
              src={p.avatar}
              alt={p.name}
              title={p.name}
              className="inline-block h-7 w-7 rounded-full ring-2 ring-slate-900 object-cover"
            />
          ))}
        </div>
        <span className="text-xs text-slate-400">
          {session.participants.length} participants actively voting
        </span>
      </div>

      {/* Candidates mini poll overview */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Current Compromise Shortlist:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {session.candidates.map((cand) => {
            const hasVotes = (cand.yesCount || 0) + (cand.noCount || 0) > 0;
            return (
              <div
                key={cand.id}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                  cand.isLeader && hasVotes
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300'
                }`}
              >
                <img
                  src={cand.poster}
                  alt={cand.title}
                  className="w-9 h-12 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold truncate">{cand.title}</span>
                    {hasVotes ? (
                      <span className="font-mono text-[11px]">
                        {cand.scorePercent}% yes ({cand.yesCount}/{cand.yesCount! + cand.noCount!})
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">no votes yet</span>
                    )}
                  </div>
                  {/* Progress bar reflects the real yes share */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cand.isLeader && hasVotes ? 'bg-indigo-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${cand.scorePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Mediator Callout - only shown once the host has locked a real verdict */}
      {session.aiCompromisePitch && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-950/40 border border-violet-500/30 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Compromise Verdict</span>
          </div>
          <p className="text-xs text-slate-300 italic leading-relaxed">
            "{session.aiCompromisePitch}"
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Real-time weighted compromise scoring
        </span>
        <Link
          to={session.joinCode ? `/group?code=${session.joinCode.replace(/^#/, '').toUpperCase().trim()}` : '/group'}
          className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
        >
          <span>Enter Room</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

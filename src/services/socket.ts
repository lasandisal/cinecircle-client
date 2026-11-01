import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export interface SocketJoinAck {
  ok: boolean;
  sessionId?: string;
  joinCode?: string;
  votes?: any[];
  error?: string;
}

export interface VoteUpdatedPayload {
  sessionId: string;
  votes: any[];
  vote?: any;
}

export interface SessionFinalizedPayload {
  session: any;
  winnerId?: string;
  scores: { titleId: string; score: number; yesCount: number; noCount: number }[];
  aiPitch?: string;
  aiPitchGenerated: boolean;
}

/**
 * Socket.IO client for CineCircle group rooms.
 *
 * The server now authenticates the handshake with the same JWT used by REST, so
 * the token has to be attached here. Every method returns a promise and the
 * GroupSessionPage keeps REST as a fallback if the socket cannot connect.
 */
class SocketService {
  private socket: Socket | null = null;

  private getToken(): string | null {
    return localStorage.getItem('cinecircle_token');
  }

  connect(): Socket | null {
    const token = this.getToken();
    if (!token) return null;

    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      auth: { token },
      transports: ['websocket'],
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /** Resolve once the socket is connected (or immediately rejected on error). */
  whenConnected(timeoutMs = 4000): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = this.connect();
      if (!socket) return resolve(false);
      if (socket.connected) return resolve(true);

      const timer = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      const onConnect = () => {
        cleanup();
        resolve(true);
      };
      const onError = () => {
        cleanup();
        resolve(false);
      };

      function cleanup() {
        clearTimeout(timer);
        socket!.off('connect', onConnect);
        socket!.off('connect_error', onError);
      }

      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
    });
  }

  /** Join a room by its 6-character code. */
  joinSession(joinCode: string): Promise<SocketJoinAck> {
    const socket = this.connect();
    if (!socket) return Promise.resolve({ ok: false, error: 'Not authenticated' });

    return new Promise((resolve) => {
      const timer = setTimeout(
        () => resolve({ ok: false, error: 'Timed out joining the room' }),
        5000
      );
      socket.emit('session:join', { joinCode }, (ack: SocketJoinAck) => {
        clearTimeout(timer);
        resolve(ack || { ok: false, error: 'No acknowledgement from server' });
      });
    });
  }

  leaveSession(sessionId: string): void {
    this.socket?.emit('session:leave', { sessionId });
  }

  castVote(
    sessionId: string,
    titleId: string,
    reaction: 'yes' | 'no',
    strength: number
  ): Promise<{ ok: boolean; error?: string }> {
    const socket = this.socket;
    if (!socket?.connected) return Promise.resolve({ ok: false, error: 'Socket not connected' });

    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ ok: false, error: 'Vote timed out' }), 5000);
      socket.emit('vote:cast', { sessionId, titleId, reaction, strength }, (ack: any) => {
        clearTimeout(timer);
        resolve(ack || { ok: false, error: 'No acknowledgement from server' });
      });
    });
  }

  lockSession(
    sessionId: string
  ): Promise<{ ok: boolean; winnerId?: string; aiPitch?: string; error?: string }> {
    const socket = this.socket;
    if (!socket?.connected) return Promise.resolve({ ok: false, error: 'Socket not connected' });

    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ ok: false, error: 'Lock timed out' }), 8000);
      socket.emit('session:lock', { sessionId }, (ack: any) => {
        clearTimeout(timer);
        resolve(ack || { ok: false, error: 'No acknowledgement from server' });
      });
    });
  }

  onVoteUpdated(handler: (payload: VoteUpdatedPayload) => void): void {
    this.socket?.on('vote:updated', handler);
  }

  onSessionFinalized(handler: (payload: SessionFinalizedPayload) => void): void {
    this.socket?.on('session:finalized', handler);
  }

  onParticipantJoined(handler: (payload: { sessionId: string; user?: { id: string; name?: string } }) => void): void {
    this.socket?.on('participant:joined', handler);
  }

  onSessionError(handler: (payload: { event: string; error: string }) => void): void {
    this.socket?.on('session:error', handler);
  }

  /** Remove every listener this page registered, then disconnect. */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
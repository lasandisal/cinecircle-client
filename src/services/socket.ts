import { io, Socket } from 'socket.io-client';
import { api } from './api';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000'
    : 'https://cinecircle-server.vercel.app');

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

export interface PresencePayload {
  userId: string;
}

/**
 * Socket.IO client for CineCircle group rooms.
 *
 * REST runs on the page origin (`/api` rewrite) so the HttpOnly session cookie
 * is first-party. The socket server is a different vercel.app host, and cookies
 * are scoped to the host that set them - the browser will not send the client
 * domain's cookie to the API domain. So the handshake authenticates with a
 * short-lived token fetched over same-origin REST (`/auth/socket-token`).
 * Every method returns a promise and the GroupSessionPage keeps REST as a
 * fallback if the socket cannot connect.
 */
class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private tokenPromise: Promise<string | null> | null = null;
  private authRetryDone = false;

  /** Exchange the HttpOnly cookie for a short-lived socket handshake token. */
  private async fetchToken(force = false): Promise<string | null> {
    if (!force && this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }
    if (this.tokenPromise) return this.tokenPromise;

    this.tokenPromise = api
      .get('/auth/socket-token')
      .then((res) => {
        const token: string | null = res.data?.data?.token ?? null;
        const ttlSeconds = Number(res.data?.data?.expiresInSeconds) || 120;
        this.token = token;
        // Refresh a little before the server considers it expired.
        this.tokenExpiresAt = Date.now() + (ttlSeconds - 60) * 1000;
        return token;
      })
      .catch(() => null)
      .finally(() => {
        this.tokenPromise = null;
      });

    return this.tokenPromise;
  }

  private async authorizeAndConnect(socket: Socket, forceToken = false): Promise<void> {
    const token = await this.fetchToken(forceToken);
    // Fall back to cookie auth when no token is available (local dev, or a
    // same-host deployment where the cookie is actually sent).
    socket.auth = token ? { token } : {};
    socket.connect();
  }

  connect(): Socket | null {
    if (this.socket) {
      if (!this.socket.connected && !this.socket.active) {
        void this.authorizeAndConnect(this.socket);
      }
      return this.socket;
    }

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      // Still useful for local dev and any same-origin deployment.
      withCredentials: true,
      transports: ['websocket'],
    });

    this.socket = socket;

    socket.on('connect', () => {
      this.authRetryDone = false;
    });

    socket.on('connect_error', (error) => {
      // An expired token is the one failure worth retrying automatically.
      if (/auth|token|jwt/i.test(error.message) && !this.authRetryDone) {
        this.authRetryDone = true;
        this.token = null;
        this.tokenExpiresAt = 0;
        void this.authorizeAndConnect(socket, true);
      }
    });

    void this.authorizeAndConnect(socket);

    return socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /** Resolve once the socket is connected (or immediately rejected on error). */
  whenConnected(timeoutMs = 8000): Promise<boolean> {
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

  /** Fires on the first connection and after every automatic reconnect. */
  onConnect(handler: () => void): void {
    this.socket?.on('connect', handler);
  }

  onDisconnect(handler: () => void): void {
    this.socket?.on('disconnect', handler);
  }

  onShortlistUpdated(handler: (payload: { sessionId: string; session: any; votes?: any[] }) => void): void {
    this.socket?.on('shortlist:updated', handler);
  }

  onSessionFinalized(handler: (payload: SessionFinalizedPayload) => void): void {
    this.socket?.on('session:finalized', handler);
  }

  onSessionReopened(handler: (payload: { session: any; votes?: any[] }) => void): void {
    this.socket?.on('session:reopened', handler);
  }

  onParticipantJoined(handler: (payload: { sessionId: string; user?: { id: string; name?: string } }) => void): void {
    this.socket?.on('participant:joined', handler);
  }

  onSessionError(handler: (payload: { event: string; error: string }) => void): void {
    this.socket?.on('session:error', handler);
  }

  onSessionDeleted(handler: (payload: { sessionId: string }) => void): void {
    this.socket?.on('session:deleted', handler);
  }

  onPresenceOnline(handler: (payload: PresencePayload) => void): void {
    this.socket?.on('presence:online', handler);
  }

  onPresenceOffline(handler: (payload: PresencePayload) => void): void {
    this.socket?.on('presence:offline', handler);
  }

  /** Remove every listener this page registered, then disconnect. */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    // Drop the socket credential with the connection so a later session in
    // the same tab can never reuse the previous member's handshake token.
    this.token = null;
    this.tokenExpiresAt = 0;
    this.tokenPromise = null;
    this.authRetryDone = false;
  }
}

export const socketService = new SocketService();
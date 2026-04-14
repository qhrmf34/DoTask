import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;
let subscribedToAuth = false;

function subscribeAuthChanges() {
  if (subscribedToAuth) return;
  subscribedToAuth = true;

  useAuthStore.subscribe((state, prev) => {
    if (!socket || state.accessToken === prev.accessToken) return;
    socket.auth = { token: state.accessToken || undefined };
    if (socket.connected) socket.disconnect();
    socket.connect();
  });
}

export function getSocket(token?: string): Socket {
  subscribeAuthChanges();

  const resolvedToken = token ?? useAuthStore.getState().accessToken ?? undefined;

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      auth: { token: resolvedToken },
      withCredentials: true,
      transports: ['websocket'],
    });
    return socket;
  }

  const currentToken = (socket.auth as any)?.token;
  if (currentToken !== resolvedToken) {
    socket.auth = { token: resolvedToken };
    if (socket.connected) socket.disconnect();
    socket.connect();
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

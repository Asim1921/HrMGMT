import { useEffect, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
let globalSocket = null;

/** Create or return the singleton socket (connects with current access token). */
export function ensureSocket() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });
  } else {
    globalSocket.auth = { token };
    if (!globalSocket.connected) globalSocket.connect();
  }

  return globalSocket;
}

export function getSocketInstance() {
  return globalSocket;
}

export function useSocket() {
  const [socket, setSocket] = useState(() => ensureSocket());
  const [connected, setConnected] = useState(() => ensureSocket()?.connected ?? false);

  useEffect(() => {
    const s = ensureSocket();
    setSocket(s);

    if (!s) return undefined;

    const onConnect = () => {
      setConnected(true);
      setSocket(s);
    };
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setConnected(true);

    const handleLogout = () => {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      setSocket(null);
      setConnected(false);
    };
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const emit = useCallback((event, data, callback) => {
    ensureSocket()?.emit(event, data, callback);
  }, []);

  const joinConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    ensureSocket()?.emit('join_conversation', { conversationId });
  }, []);

  return { socket, emit, joinConversation, connected };
}

/** Subscribe to a socket event; re-binds after reconnect. */
export function subscribeSocketEvent(event, handler) {
  const s = ensureSocket();
  if (!s) return () => {};

  s.on(event, handler);
  return () => s.off(event, handler);
}

/** Run fn when socket connects (immediately if already connected). */
export function onSocketConnect(fn) {
  const s = ensureSocket();
  if (!s) return () => {};

  if (s.connected) fn();
  s.on('connect', fn);
  return () => s.off('connect', fn);
}

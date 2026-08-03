import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
};

export const subscribeToRoom = (roomName: string) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join-room', roomName);
  } else if (s) {
    s.on('connect', () => {
      s.emit('join-room', roomName);
    });
  }
};

export default getSocket;

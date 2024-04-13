import { io } from 'socket.io-client';

export function useSocket() {
  const socket = io('http://localhost:3002'); // Replace with your NestJS server URL

  const emit = (event, data) => socket.emit(event, data);
  const on = (event, callback) => socket.on(event, callback);

  return { socket, emit, on };
}
import { io } from 'socket.io-client';

const port = 3002;

const socket = io(`http://localhost:${port}`, {
    withCredentials: true,
    transports: ["websocket", "polling"],
});

const emit = (event, data) => {
  socket.emit(event, data);
};

const on = (event, callback) => {
  socket.on(event, callback);
};

export { socket, emit, on };
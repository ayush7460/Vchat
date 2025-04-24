// frontend/src/services/socket.jsx - Fixed connection URL
import { io } from 'socket.io-client';

let socket;

export const initSocket = (token) => {
  socket = io('http://localhost:5000', {  // Update this to match your backend URL
    auth: {
      token
    }
  });
  
  return socket;
};

// Rest of the file remains the same...

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    if (token) {
      return initSocket(token);
    }
    throw new Error('Socket not initialized');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
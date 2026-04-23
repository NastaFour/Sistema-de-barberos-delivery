import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  const joinBookingRoom = (bookingId: string) => {
    if (socket) {
      socket.emit('join_booking', bookingId);
    }
  };

  const joinBarberRoom = (barberId: string) => {
    if (socket) {
      socket.emit('join_barber', barberId);
    }
  };

  const leaveRoom = (room: string) => {
    if (socket) {
      socket.leave(room);
    }
  };

  const onBookingUpdate = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('booking_status_updated', callback);
      return () => {
        socket.off('booking_status_updated', callback);
      };
    }
  };

  const onNewBooking = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('new_booking', callback);
      return () => {
        socket.off('new_booking', callback);
      };
    }
  };

  const onBookingCancelled = (callback: (data: any) => void) => {
    if (socket) {
      socket.on('booking_cancelled', callback);
      return () => {
        socket.off('booking_cancelled', callback);
      };
    }
  };

  return {
    socket,
    isConnected,
    joinBookingRoom,
    joinBarberRoom,
    leaveRoom,
    onBookingUpdate,
    onNewBooking,
    onBookingCancelled,
  };
};

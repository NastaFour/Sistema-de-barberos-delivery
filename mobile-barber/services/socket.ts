import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

class SocketService {
  public socket: Socket | null = null;

  async connect() {
    if (this.socket?.connected) return;
    
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => console.log('Socket connected:', this.socket?.id));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitLocation(bookingId: string, lat: number, lng: number) {
    if (this.socket?.connected) {
      this.socket.emit('barberLocationUpdate', { bookingId, latitude: lat, longitude: lng });
    }
  }
}

export const socketService = new SocketService();

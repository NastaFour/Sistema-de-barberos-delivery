import * as SecureStore from "expo-secure-store";
import { type Socket, io } from "socket.io-client";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

class SocketService {
  public socket: Socket | null = null;
  private onStatusChange: ((connected: boolean) => void) | null = null;

  setStatusCallback(cb: (connected: boolean) => void) {
    this.onStatusChange = cb;
  }

  async connect() {
    if (this.socket?.connected) return;

    const token = await SecureStore.getItemAsync("auth_token");
    if (!token) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: RECONNECT_DELAYS[0],
      reconnectionDelayMax: RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1],
      randomizationFactor: 0.3,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      this.onStatusChange?.(true);
    });

    this.socket.on("disconnect", (reason) => {
      this.onStatusChange?.(false);
      if (reason === "io server disconnect") {
        this.socket?.connect();
      }
    });

    this.socket.io.on("reconnect_attempt", (attempt) => {
      const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
      if (this.socket) {
        this.socket.io.opts.reconnectionDelay = delay;
      }
    });

    this.socket.io.on("reconnect", () => {
      this.onStatusChange?.(true);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onBookingUpdated(callback: (data: unknown) => void) {
    this.socket?.on("booking_status_updated", callback);
    return () => {
      this.socket?.off("booking_status_updated", callback);
    };
  }

  onBarberLocation(callback: (data: unknown) => void) {
    this.socket?.on("barber:location", callback);
    return () => {
      this.socket?.off("barber:location", callback);
    };
  }
}

export const socketService = new SocketService();

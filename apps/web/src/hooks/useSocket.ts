import { useCallback, useEffect, useRef, useState } from "react";
import { type Socket, io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: RECONNECT_DELAYS[0],
      reconnectionDelayMax: RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1],
      randomizationFactor: 0.3,
      timeout: 20000,
    });

    socketInstance.on("connect", () => {
      attemptsRef.current = 0;
      if (mountedRef.current) {
        setIsConnected(true);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      if (mountedRef.current) {
        setIsConnected(false);
      }
      if (reason === "io server disconnect") {
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", () => {
      attemptsRef.current += 1;
    });

    socketInstance.on("reconnect_attempt", (attempt) => {
      const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
      socketInstance.io.opts.reconnectionDelay = delay;
    });

    socketInstance.io.on("reconnect", () => {
      attemptsRef.current = 0;
      if (mountedRef.current) {
        setIsConnected(true);
      }
    });

    setSocket(socketInstance);

    return () => {
      mountedRef.current = false;
      socketInstance.removeAllListeners();
      socketInstance.close();
    };
  }, []);

  const joinBookingRoom = useCallback(
    (bookingId: string) => {
      socket?.emit("join_booking", bookingId);
    },
    [socket],
  );

  const joinBarberRoom = useCallback(
    (barberId: string) => {
      socket?.emit("join_barber", barberId);
    },
    [socket],
  );

  const leaveRoom = useCallback(
    (room: string) => {
      socket?.emit("leave_room", room);
    },
    [socket],
  );

  const setBarberOnline = useCallback(
    (barberId: string) => {
      socket?.emit("barber:online", { barberId });
    },
    [socket],
  );

  const setBarberOffline = useCallback(
    (barberId: string) => {
      socket?.emit("barber:offline", { barberId });
    },
    [socket],
  );

  const onBookingUpdate = useCallback(
    (callback: (data: unknown) => void) => {
      if (!socket) return;
      socket.on("booking_status_updated", callback);
      return () => {
        socket.off("booking_status_updated", callback);
      };
    },
    [socket],
  );

  const onNewBooking = useCallback(
    (callback: (data: unknown) => void) => {
      if (!socket) return;
      socket.on("new_booking", callback);
      return () => {
        socket.off("new_booking", callback);
      };
    },
    [socket],
  );

  const onBookingCancelled = useCallback(
    (callback: (data: unknown) => void) => {
      if (!socket) return;
      socket.on("booking_cancelled", callback);
      return () => {
        socket.off("booking_cancelled", callback);
      };
    },
    [socket],
  );

  return {
    socket,
    isConnected,
    joinBookingRoom,
    joinBarberRoom,
    leaveRoom,
    onBookingUpdate,
    onNewBooking,
    onBookingCancelled,
    setBarberOnline,
    setBarberOffline,
  };
};

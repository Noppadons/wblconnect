"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api.*$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

let sharedSocket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(`${SOCKET_URL}/notifications`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
    });
  }
  return sharedSocket;
}

interface UseSocketOptions {
  userId?: string;
  classroomId?: string;
  onNotification?: (data: {
    id: string;
    title: string;
    content: string;
    type: string;
  }) => void;
}

/**
 * Hook for real-time WebSocket notifications.
 *
 * @example
 * useSocket({
 *   userId: user?.id,
 *   classroomId: student?.classroomId,
 *   onNotification: (n) => toast.info(n.title),
 * });
 */
export function useSocket(options: UseSocketOptions) {
  const { userId, classroomId, onNotification } = options;
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  const connect = useCallback(() => {
    if (!userId) return;

    const socket = getSocket();
    refCount++;

    if (!socket.connected) {
      socket.connect();
    }

    // Register user
    socket.emit("register", { userId });

    // Join classroom room
    if (classroomId) {
      socket.emit("joinClassroom", { classroomId });
    }

    // Listen for notifications
    const handler = (data: {
      id: string;
      title: string;
      content: string;
      type: string;
    }) => {
      callbackRef.current?.(data);
    };

    socket.on("notification", handler);

    return () => {
      socket.off("notification", handler);
      refCount--;
      if (refCount <= 0) {
        socket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, [userId, classroomId]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);
}

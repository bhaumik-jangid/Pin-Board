import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { useNoteStore } from '@/stores/note.store';
import { useCollabStore } from '@/stores/collab.store';
import { SOCKET_EVENTS } from '@/lib/socketEvents';

let globalSocket: Socket | null = null;

export function useSocket(boardId: string | null) {
  const token       = useAuthStore((s) => s.token);
  const user        = useAuthStore((s) => s.user);
  const { addNote, updateNote, removeNote } = useNoteStore();
  const { addUser, removeUser, setUsers, updateCursor } = useCollabStore();
  const socketRef   = useRef<Socket | null>(null);

  /* ── Connect ── */
  useEffect(() => {
    if (!token || !boardId) return;

    /* Reuse existing connection if already open */
    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1500,
      });
    }

    socketRef.current = globalSocket;
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[socket] connected', socket.id);
      socket.emit(SOCKET_EVENTS.JOIN_BOARD, boardId);
    });

    socket.on('connect_error', (err) => {
      console.warn('[socket] connect error:', err.message);
    });

    /* If already connected, join immediately */
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.JOIN_BOARD, boardId);
    }

    /* ── Room state (initial presence list) ── */
    socket.on(SOCKET_EVENTS.ROOM_STATE, ({ users }: { boardId: string; users: unknown[] }) => {
      setUsers(users as any);
    });

    /* ── Presence ── */
    socket.on(SOCKET_EVENTS.USER_JOINED, (u: any) => addUser(u));
    socket.on(SOCKET_EVENTS.USER_LEFT,   ({ userId }: { userId: string }) => removeUser(userId));

    /* ── Note events from other users ── */
    socket.on(SOCKET_EVENTS.NOTE_CREATED_BC, (note: any) => {
      addNote(note);
    });

    socket.on(SOCKET_EVENTS.NOTE_MOVED_BC, ({ noteId, x, y }: any) => {
      updateNote(noteId, { x, y });
    });

    socket.on(SOCKET_EVENTS.NOTE_UPDATED_BC, ({ noteId, updates }: any) => {
      updateNote(noteId, updates);
    });

    socket.on(SOCKET_EVENTS.NOTE_DELETED_BC, ({ noteId }: any) => {
      removeNote(noteId);
    });

    socket.on(SOCKET_EVENTS.NOTE_FRONT_BC, ({ noteId, zIndex }: any) => {
      updateNote(noteId, { zIndex });
    });

    /* ── Cursor positions ── */
    socket.on(SOCKET_EVENTS.CURSOR_BC, (payload: any) => {
      if (payload.userId !== user?.userId) {
        updateCursor(payload);
      }
    });

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_BOARD, boardId);
      socket.off(SOCKET_EVENTS.ROOM_STATE);
      socket.off(SOCKET_EVENTS.USER_JOINED);
      socket.off(SOCKET_EVENTS.USER_LEFT);
      socket.off(SOCKET_EVENTS.NOTE_CREATED_BC);
      socket.off(SOCKET_EVENTS.NOTE_MOVED_BC);
      socket.off(SOCKET_EVENTS.NOTE_UPDATED_BC);
      socket.off(SOCKET_EVENTS.NOTE_DELETED_BC);
      socket.off(SOCKET_EVENTS.NOTE_FRONT_BC);
      socket.off(SOCKET_EVENTS.CURSOR_BC);
      socket.off('connect');
    };
  }, [token, boardId]);

  /* ── Emit helpers ── */
  const emit = useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return { emit, socket: socketRef.current };
}

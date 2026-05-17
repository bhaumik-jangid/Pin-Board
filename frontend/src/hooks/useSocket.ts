import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { useNoteStore } from '@/stores/note.store';
import { useCollabStore } from '@/stores/collab.store';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { setSocket } from '../lib/socketEmit';

let globalSocket: Socket | null = null;

export function useSocket(boardId: string | null) {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  const { addNote, updateNote, removeNote } = useNoteStore();
  const { addUser, removeUser, setUsers, updateCursor } = useCollabStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !boardId) return;

    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
      });
    }

    socketRef.current = globalSocket;
    setSocket(globalSocket);
    const socket = socketRef.current;

    const joinBoard = () => {
      console.log('[socket] joining board', boardId);
      socket.emit(SOCKET_EVENTS.JOIN_BOARD, boardId);
    };

    socket.on('connect', joinBoard);
    if (socket.connected) joinBoard();

    socket.on('connect_error', (err) => {
      console.warn('[socket] error:', err.message);
    });

    /* Room state */
    socket.on(SOCKET_EVENTS.ROOM_STATE, ({ users }: any) => {
      console.log('[socket] room state — users:', users.length);
      setUsers(users);
    });

    /* Presence */
    socket.on(SOCKET_EVENTS.USER_JOINED, (u: any) => {
      console.log('[socket] user joined:', u.username);
      addUser(u);
    });
    socket.on(SOCKET_EVENTS.USER_LEFT, ({ userId }: any) => {
      console.log('[socket] user left:', userId);
      removeUser(userId);
    });

    /* Note events */
    socket.on(SOCKET_EVENTS.NOTE_CREATED_BC,  (note: any) => addNote(note));
    socket.on(SOCKET_EVENTS.NOTE_MOVED_BC,    ({ noteId, x, y }: any) => updateNote(noteId, { x, y }));
    socket.on(SOCKET_EVENTS.NOTE_UPDATED_BC,  ({ noteId, updates }: any) => updateNote(noteId, updates));
    socket.on(SOCKET_EVENTS.NOTE_DELETED_BC,  ({ noteId }: any) => removeNote(noteId));
    socket.on(SOCKET_EVENTS.NOTE_FRONT_BC,    ({ noteId, zIndex }: any) => updateNote(noteId, { zIndex }));

    /* Cursors */
    socket.on(SOCKET_EVENTS.CURSOR_BC, (payload: any) => {
      if (payload.userId !== user?._id) updateCursor(payload);
    });

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_BOARD, boardId);
      socket.off('connect', joinBoard);
      socket.off(SOCKET_EVENTS.ROOM_STATE);
      socket.off(SOCKET_EVENTS.USER_JOINED);
      socket.off(SOCKET_EVENTS.USER_LEFT);
      socket.off(SOCKET_EVENTS.NOTE_CREATED_BC);
      socket.off(SOCKET_EVENTS.NOTE_MOVED_BC);
      socket.off(SOCKET_EVENTS.NOTE_UPDATED_BC);
      socket.off(SOCKET_EVENTS.NOTE_DELETED_BC);
      socket.off(SOCKET_EVENTS.NOTE_FRONT_BC);
      socket.off(SOCKET_EVENTS.CURSOR_BC);
    };
  }, [token, boardId]);

  /* Emit helpers */
  const emit = useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload);
  }, []);

  /* Cursor tracking */
  const emitCursor = useCallback((boardId: string, x: number, y: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.CURSOR_MOVE, {
      boardId, x, y,
      userId:      user?._id,
      username:    user?.username,
      avatarColor: user?.avatarColor,
    });
  }, [user]);

  return { emit, emitCursor, socket: socketRef.current };
}

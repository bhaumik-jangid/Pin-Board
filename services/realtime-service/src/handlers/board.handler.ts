import { Server } from 'socket.io';
import { AuthSocket } from './auth.handler';
import { EVENTS, PresenceUser } from '../events';
import { roomManager } from '../rooms/room.manager';

export const registerBoardHandlers = (io: Server, socket: AuthSocket) => {
  const user = socket.user!;

  /* ── Join a board room ── */
  socket.on(EVENTS.JOIN_BOARD, (boardId: string) => {
    socket.join(boardId);

    const presence: PresenceUser = {
      userId:      user.userId,
      username:    user.username,
      avatarColor: '#c49a45',   /* default; client updates via profile */
      socketId:    socket.id,
    };

    roomManager.join(boardId, presence);

    /* Tell the joiner who else is here */
    socket.emit(EVENTS.ROOM_STATE, {
      boardId,
      users: roomManager.getUsers(boardId),
    });

    /* Tell everyone else a new user joined */
    socket.to(boardId).emit(EVENTS.USER_JOINED, presence);

    console.log(`[room] ${user.username} joined board ${boardId}`);
  });

  /* ── Leave a board room ── */
  socket.on(EVENTS.LEAVE_BOARD, (boardId: string) => {
    socket.leave(boardId);
    const left = roomManager.leave(boardId, socket.id);
    if (left) socket.to(boardId).emit(EVENTS.USER_LEFT, { socketId: socket.id, userId: left.userId });
  });

  /* ── Note events — broadcast to everyone else in the room ── */
  socket.on(EVENTS.NOTE_CREATED, (payload: { boardId: string; note: unknown }) => {
    socket.to(payload.boardId).emit(EVENTS.NOTE_CREATED_BC, payload.note);
  });

  socket.on(EVENTS.NOTE_MOVED, (payload: { boardId: string; noteId: string; x: number; y: number }) => {
    socket.to(payload.boardId).emit(EVENTS.NOTE_MOVED_BC, payload);
  });

  socket.on(EVENTS.NOTE_UPDATED, (payload: { boardId: string; noteId: string; updates: unknown }) => {
    socket.to(payload.boardId).emit(EVENTS.NOTE_UPDATED_BC, payload);
  });

  socket.on(EVENTS.NOTE_DELETED, (payload: { boardId: string; noteId: string }) => {
    socket.to(payload.boardId).emit(EVENTS.NOTE_DELETED_BC, payload);
  });

  socket.on(EVENTS.NOTE_FRONT, (payload: { boardId: string; noteId: string; zIndex: number }) => {
    socket.to(payload.boardId).emit(EVENTS.NOTE_FRONT_BC, payload);
  });

  /* ── Cursor position ── */
  socket.on(EVENTS.CURSOR_MOVE, (payload) => {
    socket.to(payload.boardId).emit(EVENTS.CURSOR_BC, {
      ...payload,
      userId:      user.userId,
      username:    user.username,
    });
  });

  /* ── Board lock state ── */
  socket.on(EVENTS.BOARD_LOCK, (payload: { boardId: string; isLocked: boolean }) => {
    socket.to(payload.boardId).emit(EVENTS.BOARD_LOCK_BC, payload);
  });

  /* ── Disconnect — remove from all rooms ── */
  socket.on('disconnect', () => {
    const leftRooms = roomManager.leaveAll(socket.id);
    for (const { boardId, user: leftUser } of leftRooms) {
      io.to(boardId).emit(EVENTS.USER_LEFT, {
        socketId: socket.id,
        userId:   leftUser.userId,
      });
    }
    console.log(`[socket] ${user.username} disconnected`);
  });
};

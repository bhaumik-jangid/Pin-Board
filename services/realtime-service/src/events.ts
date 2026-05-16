export const EVENTS = {
  /* client → server */
  JOIN_BOARD:        'board:join',
  LEAVE_BOARD:       'board:leave',
  NOTE_CREATED:      'note:created',
  NOTE_MOVED:        'note:moved',
  NOTE_UPDATED:      'note:updated',
  NOTE_DELETED:      'note:deleted',
  NOTE_FRONT:        'note:front',
  CURSOR_MOVE:       'cursor:move',
  BOARD_LOCK:        'board:lock',

  /* server → client */
  ROOM_STATE:        'room:state',
  USER_JOINED:       'user:joined',
  USER_LEFT:         'user:left',
  NOTE_CREATED_BC:   'note:created:bc',
  NOTE_MOVED_BC:     'note:moved:bc',
  NOTE_UPDATED_BC:   'note:updated:bc',
  NOTE_DELETED_BC:   'note:deleted:bc',
  NOTE_FRONT_BC:     'note:front:bc',
  CURSOR_BC:         'cursor:bc',
  BOARD_LOCK_BC:     'board:lock:bc',
  ERROR:             'error',
} as const;

export interface PresenceUser {
  userId:   string;
  username: string;
  avatarColor: string;
  socketId: string;
}

export interface CursorPayload {
  boardId: string;
  userId:  string;
  username: string;
  avatarColor: string;
  x: number;
  y: number;
}

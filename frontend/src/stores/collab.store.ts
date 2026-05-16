import { create } from 'zustand';

export interface CollabUser {
  userId:      string;
  username:    string;
  avatarColor: string;
  socketId:    string;
}

export interface CursorPos {
  userId:      string;
  username:    string;
  avatarColor: string;
  x:           number;
  y:           number;
}

interface CollabState {
  users:   CollabUser[];
  cursors: Record<string, CursorPos>;

  setUsers:      (users: CollabUser[]) => void;
  addUser:       (user: CollabUser)   => void;
  removeUser:    (userId: string)     => void;
  updateCursor:  (pos: CursorPos)    => void;
  removeCursor:  (userId: string)    => void;
}

export const useCollabStore = create<CollabState>((set) => ({
  users:   [],
  cursors: {},

  setUsers: (users) => set({ users }),

  addUser: (user) => set((s) => {
    if (s.users.find((u) => u.userId === user.userId)) return s;
    return { users: [...s.users, user] };
  }),

  removeUser: (userId) => set((s) => ({
    users: s.users.filter((u) => u.userId !== userId),
  })),

  updateCursor: (pos) => set((s) => ({
    cursors: { ...s.cursors, [pos.userId]: pos },
  })),

  removeCursor: (userId) => set((s) => {
    const next = { ...s.cursors };
    delete next[userId];
    return { cursors: next };
  }),
}));

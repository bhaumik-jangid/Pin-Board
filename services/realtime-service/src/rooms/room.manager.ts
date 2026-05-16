import { PresenceUser } from '../events';

class RoomManager {
  /* boardId → Set of presence users */
  private rooms = new Map<string, Map<string, PresenceUser>>();

  join(boardId: string, user: PresenceUser): void {
    if (!this.rooms.has(boardId)) {
      this.rooms.set(boardId, new Map());
    }
    this.rooms.get(boardId)!.set(user.socketId, user);
  }

  leave(boardId: string, socketId: string): PresenceUser | null {
    const room = this.rooms.get(boardId);
    if (!room) return null;
    const user = room.get(socketId) ?? null;
    room.delete(socketId);
    if (room.size === 0) this.rooms.delete(boardId);
    return user;
  }

  leaveAll(socketId: string): { boardId: string; user: PresenceUser }[] {
    const left: { boardId: string; user: PresenceUser }[] = [];
    for (const [boardId, room] of this.rooms.entries()) {
      const user = room.get(socketId);
      if (user) {
        room.delete(socketId);
        left.push({ boardId, user });
        if (room.size === 0) this.rooms.delete(boardId);
      }
    }
    return left;
  }

  getUsers(boardId: string): PresenceUser[] {
    return Array.from(this.rooms.get(boardId)?.values() ?? []);
  }
}

export const roomManager = new RoomManager();

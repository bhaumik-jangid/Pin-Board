/**
 * Thin singleton so any component can emit socket events
 * without prop-drilling through BoardCanvas → StickyNote.
 */
import { io, Socket } from 'socket.io-client';

let _socket: Socket | null = null;

export const getSocket = (): Socket | null => _socket;

export const setSocket = (s: Socket) => { _socket = s; };

export const socketEmit = (event: string, payload: unknown) => {
  _socket?.emit(event, payload);
};

import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '@pinboard/shared-types';

export interface AuthSocket extends Socket {
  user?: AuthTokenPayload;
}

export const authenticateSocket = (
  socket: AuthSocket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) throw new Error('No token');

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    ) as AuthTokenPayload;

    socket.user = decoded;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
};

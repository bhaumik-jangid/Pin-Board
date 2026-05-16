import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { authenticateSocket, AuthSocket } from './handlers/auth.handler';
import { registerBoardHandlers } from './handlers/board.handler';

const PORT   = process.env.PORT   || 3003;
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const httpServer = createServer((_req, res) => {
  /* Simple health check endpoint */
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'realtime-service' }));
});

const io = new Server(httpServer, {
  cors: {
    origin: ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

/* JWT auth middleware on every socket connection */
io.use((socket, next) => authenticateSocket(socket as AuthSocket, next));

io.on('connection', (socket) => {
  const s = socket as AuthSocket;
  console.log(`[socket] ${s.user?.username} connected (${socket.id})`);
  registerBoardHandlers(io, s);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 realtime-service on port ${PORT}`);
});

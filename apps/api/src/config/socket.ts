import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';
import { env } from './env';
import { logger } from './logger';

let io: Server<ClientToServerEvents, ServerToClientEvents>;

export function initSocket(httpServer: HttpServer) {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Client disconnected');
    });
  });

  return io;
}

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents> {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
}

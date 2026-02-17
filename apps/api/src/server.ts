import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app';
import { env, logger, initSocket } from './config';
import { setupSocketHandlers } from './websocket';

async function main() {
  const app = createApp();
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const io = initSocket(httpServer);
  setupSocketHandlers(io);

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`📡 WebSocket ready`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});

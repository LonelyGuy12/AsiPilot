import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import { config } from './config/env.js';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { apiRoutes } from './routes/index.js';
import { setupWebSocketHandlers } from './websocket/handler.js';
import { logger } from './utils/logger.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', apiRoutes);

// Error handler
app.use(errorHandler);

// WebSocket
setupWebSocketHandlers(io);

// Start server
httpServer.listen(config.PORT, () => {
  logger.info(`🚀 FrontendForge server running on port ${config.PORT}`);
  logger.info(`   Environment: ${config.NODE_ENV}`);
  logger.info(`   Client URL: ${config.CLIENT_URL}`);
});

export { app, httpServer, io };

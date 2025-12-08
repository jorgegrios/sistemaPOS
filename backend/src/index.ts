import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import paymentsRouter from './routes/payments';
import ordersRouter from './routes/orders';
import menusRouter from './routes/menus';
import webhooksRouter from './routes/webhooks';
import authRouter, { verifyToken } from './routes/auth';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health check (no auth required)
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

// Authentication routes (no auth required for login)
app.use('/api/v1/auth', authRouter);

// Protected routes (JWT required)
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/orders', verifyToken, ordersRouter);
app.use('/api/v1/menus', menusRouter); // Menus are public (read) / protected (write)
app.use('/api/v1/webhooks', webhooksRouter); // Webhooks use provider signature verification

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('[Socket] Connected:', socket.id);

  socket.on('join_location', (locationId: string) => {
    socket.join(`location:${locationId}`);
    console.log(`[Socket] User joined location: ${locationId}`);
  });

  socket.on('order_status_change', (data: { orderId: string; status: string }) => {
    io.emit('order_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: POST http://localhost:${PORT}/api/v1/auth/login`);
});

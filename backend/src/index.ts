import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import paymentsRouter from './routes/payments';
import ordersRouter from './routes/orders';
import webhooksRouter from './routes/webhooks';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/webhooks', webhooksRouter);

app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

// Socket events example
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('join_location', (locationId: string) => {
    socket.join(locationId);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});

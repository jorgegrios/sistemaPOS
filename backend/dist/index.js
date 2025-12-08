"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const payments_1 = __importDefault(require("./routes/payments"));
const orders_1 = __importDefault(require("./routes/orders"));
const menus_1 = __importDefault(require("./routes/menus"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const auth_1 = __importStar(require("./routes/auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Health check (no auth required)
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));
// Authentication routes (no auth required for login)
app.use('/api/v1/auth', auth_1.default);
// Protected routes (JWT required)
app.use('/api/v1/payments', payments_1.default);
app.use('/api/v1/orders', auth_1.verifyToken, orders_1.default);
app.use('/api/v1/menus', menus_1.default); // Menus are public (read) / protected (write)
app.use('/api/v1/webhooks', webhooks_1.default); // Webhooks use provider signature verification
// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});
// Socket.io events
io.on('connection', (socket) => {
    console.log('[Socket] Connected:', socket.id);
    socket.on('join_location', (locationId) => {
        socket.join(`location:${locationId}`);
        console.log(`[Socket] User joined location: ${locationId}`);
    });
    socket.on('order_status_change', (data) => {
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

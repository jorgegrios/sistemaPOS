"use strict";
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
const webhooks_1 = __importDefault(require("./routes/webhooks"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/api/v1/payments', payments_1.default);
app.use('/api/v1/orders', orders_1.default);
app.use('/api/v1/webhooks', webhooks_1.default);
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));
// Socket events example
io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('join_location', (locationId) => {
        socket.join(locationId);
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Backend listening on ${PORT}`);
});

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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // ← MOVER AQUÍ, ANTES DE TODO
// Config reload trigger: 2026-01-24
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const os_1 = __importDefault(require("os"));
const socket_io_1 = require("socket.io");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const payments_1 = __importDefault(require("./routes/payments"));
const orders_1 = __importDefault(require("./routes/orders"));
const menus_1 = __importDefault(require("./routes/menus"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const auth_1 = __importStar(require("./routes/auth"));
const printers_1 = __importDefault(require("./routes/printers"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const purchases_1 = __importDefault(require("./routes/purchases"));
const ai_analysis_1 = __importDefault(require("./routes/ai-analysis"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const tables_1 = __importDefault(require("./routes/tables"));
const cashier_1 = __importDefault(require("./routes/cashier"));
const menu_costs_1 = __importDefault(require("./routes/menu-costs"));
const advanced_costing_1 = __importDefault(require("./routes/advanced-costing"));
const dynamic_pricing_1 = __importDefault(require("./routes/dynamic-pricing"));
const swagger_1 = require("./swagger");
const monitoring_1 = require("./middleware/monitoring");
const performance_1 = require("./config/performance");
const pg_1 = require("pg");
const kitchenPrintService_1 = __importDefault(require("./services/kitchenPrintService"));
const printerService_1 = __importDefault(require("./services/printerService"));
const printerDiscovery_1 = __importDefault(require("./services/printerDiscovery"));
// Domain-based routes (new modular architecture)
const routes_1 = __importDefault(require("./domains/orders/routes"));
const routes_2 = __importDefault(require("./domains/tables/routes"));
const routes_3 = __importDefault(require("./domains/products/routes"));
const routes_4 = __importDefault(require("./domains/kitchen/routes"));
const routes_5 = __importDefault(require("./domains/bar/routes"));
const routes_6 = __importDefault(require("./domains/payments/routes"));
const routes_7 = __importDefault(require("./domains/cashier/routes"));
// Event listeners for domain communication
const events_1 = require("./shared/events");
const service_1 = require("./domains/tables/service");
const service_2 = require("./domains/orders/service");
const db_1 = require("./shared/db");
const service_3 = require("./domains/cashier/service");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
// Initialize monitoring (optional - only if configured)
(0, monitoring_1.initSentry)();
(0, monitoring_1.initDataDog)();
// Middleware
app.use((0, helmet_1.default)());
// Configuración de CORS para aceptar conexiones de red
const corsOptions = {
    origin: function (origin, callback) {
        // En desarrollo, permitir todas las conexiones (localhost y red local)
        if (process.env.NODE_ENV === 'development' || !process.env.CORS_ORIGIN) {
            return callback(null, true);
        }
        // En producción, usar CORS_ORIGIN de .env o permitir todas si no está configurado
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : ['*'];
        // Si está configurado como '*', permitir todas
        if (allowedOrigins.includes('*') || !origin) {
            return callback(null, true);
        }
        // Verificar si el origin está en la lista permitida
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Permitir cookies y headers de autenticación
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Restaurant-ID', 'x-restaurant-id', 'X-Company-ID', 'x-company-id'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Request tracking middleware (for performance monitoring)
app.use(monitoring_1.requestTrackingMiddleware);
// Swagger UI documentation
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
        urls: [
            {
                url: 'http://localhost:3000/api/docs.json',
                name: 'Local Development'
            }
        ]
    },
    customCss: '.swagger-ui .topbar { display: none }'
}));
// Swagger spec JSON endpoint
app.get('/api/docs.json', (_, res) => res.json(swagger_1.swaggerSpec));
// Health check (no auth required)
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));
// Authentication routes (no auth required for login)
app.use('/api/v1/auth', auth_1.default);
// Public payment config endpoint (needed for Stripe initialization)
app.get('/api/v1/payments/stripe/config', async (req, res) => {
    try {
        const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
            // Return 200 with enabled: false (not an error, just not configured)
            return res.status(200).json({
                enabled: false,
                publishableKey: null
            });
        }
        return res.json({
            publishableKey,
            enabled: true
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// ============================================
// DOMAIN-BASED ROUTES (New Modular Architecture)
// ============================================
// Core POS domains following ALDELO specification
app.use('/api/v2/orders', auth_1.verifyToken, routes_1.default);
app.use('/api/v2/tables', auth_1.verifyToken, routes_2.default);
app.use('/api/v2/products', auth_1.verifyToken, routes_3.default);
app.use('/api/v2/kitchen', auth_1.verifyToken, routes_4.default);
app.use('/api/v2/bar', auth_1.verifyToken, routes_5.default);
app.use('/api/v2/payments', auth_1.verifyToken, routes_6.default);
app.use('/api/v2/cashier', auth_1.verifyToken, routes_7.default);
// ============================================
// LEGACY ROUTES (Maintained for compatibility)
// ============================================
app.use('/api/v1/payments', payments_1.default);
app.use('/api/v1/orders', auth_1.verifyToken, orders_1.default);
app.use('/api/v1/menus', menus_1.default); // Menus are public (read) / protected (write)
app.use('/api/v1/printers', auth_1.verifyToken, printers_1.default); // Printer management
app.use('/api/v1/inventory', inventory_1.default); // Inventory management
app.use('/api/v1/purchases', purchases_1.default); // Purchases and suppliers
app.use('/api/v1/dashboard', dashboard_1.default); // Dashboard data
app.use('/api/v1/tables', tables_1.default); // Tables management
app.use('/api/v1/cashier', cashier_1.default); // Cashier view
app.use('/api/v1/menu-costs', auth_1.verifyToken, menu_costs_1.default); // Menu costs calculation
app.use('/api/v1/advanced-costing', auth_1.verifyToken, advanced_costing_1.default); // Advanced costing system
app.use('/api/v1/dynamic-pricing', auth_1.verifyToken, dynamic_pricing_1.default); // Dynamic pricing with AI
app.use('/api/v1/ai-analysis', auth_1.verifyToken, ai_analysis_1.default); // AI Analysis (admin only)
app.use('/api/v1/webhooks', webhooks_1.default); // Webhooks use provider signature verification
// Error handler (with tracking)
app.use(monitoring_1.errorTrackingMiddleware);
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});
// Initialize printer discovery and load existing configs
printerDiscovery_1.default.loadPrinterConfigs().then(() => {
    // Auto-discover printers on startup (optional, can be disabled)
    if (process.env.AUTO_DISCOVER_PRINTERS !== 'false') {
        console.log('[Startup] Auto-discovering printers...');
        printerDiscovery_1.default.scanNetwork().then((printers) => {
            if (printers.length > 0) {
                console.log(`[Startup] Found ${printers.length} printer(s), initializing...`);
                // Re-initialize printer service with discovered printers
                printerService_1.default.initializePrinters();
            }
            else {
                console.log('[Startup] No printers found, using manual configuration');
                printerService_1.default.initializePrinters();
            }
        }).catch(() => {
            // Fallback to manual config if discovery fails
            printerService_1.default.initializePrinters();
        });
    }
    else {
        // Use manual configuration only
        printerService_1.default.initializePrinters();
    }
    // Start periodic scanning if enabled
    if (process.env.PRINTER_DISCOVERY_INTERVAL) {
        const interval = parseInt(process.env.PRINTER_DISCOVERY_INTERVAL, 10);
        printerDiscovery_1.default.startPeriodicScan(interval);
    }
});
// Initialize kitchen print service with Socket.io
kitchenPrintService_1.default.setSocketIO(io);
// ============================================
// DOMAIN EVENT LISTENERS (Inter-domain communication)
// ============================================
// Initialize domain services for event handling
const tablesService = new service_1.TablesService(db_1.pool);
const ordersService = new service_2.OrdersService(db_1.pool);
const cashierDomainService = new service_3.CashierDomainService(db_1.pool);
// Listen for order created - DON'T occupy table yet (only when sent to kitchen)
// Table should only be occupied when order is sent to kitchen, not when draft is created
(0, events_1.onEvent)(events_1.DomainEventType.ORDER_CREATED, async (payload) => {
    try {
        // Don't occupy table on draft order creation
        // Table will be occupied when order is sent to kitchen
        console.log(`[Event] Order ${payload.orderId} created (draft) - table not occupied yet`);
    }
    catch (error) {
        console.error('[Event] Error handling ORDER_CREATED:', error);
    }
});
// Listen for order closed - mark table as paid (it stays occupied by customers but bill is done)
(0, events_1.onEvent)(events_1.DomainEventType.ORDER_CLOSED, async (payload) => {
    try {
        const { tableId } = payload;
        if (tableId) {
            await tablesService.markAsPaid(tableId);
            console.log(`[Event] Table ${tableId} marked as PAID after order closure`);
        }
    }
    catch (error) {
        console.error('[Event] Error handling ORDER_CLOSED:', error);
    }
});
// Listen for order sent to kitchen - occupy table and emit socket event
(0, events_1.onEvent)(events_1.DomainEventType.ORDER_SENT_TO_KITCHEN, async (payload) => {
    try {
        const { orderId, tableId, items } = payload;
        // Occupy table when order is sent to kitchen (not when draft is created)
        if (tableId) {
            await tablesService.occupyTable(tableId);
            console.log(`[Event] Table ${tableId} occupied - order sent to kitchen`);
        }
        // Emit socket event to kitchen room
        io.to('kitchen').emit('order_sent_to_kitchen', { orderId, items });
        console.log(`[Event] Order ${orderId} sent to kitchen`);
    }
    catch (error) {
        console.error('[Event] Error handling ORDER_SENT_TO_KITCHEN:', error);
    }
});
// Listen for order item prepared - check if all prepared
(0, events_1.onEvent)(events_1.DomainEventType.ORDER_ITEM_PREPARED, async (payload) => {
    try {
        const { orderId } = payload;
        // Emit socket event to waiter
        io.emit('order_item_prepared', { orderId });
        console.log(`[Event] Order item prepared for order ${orderId}`);
    }
    catch (error) {
        console.error('[Event] Error handling ORDER_ITEM_PREPARED:', error);
    }
});
// Listen for all items prepared - notify waiter
(0, events_1.onEvent)(events_1.DomainEventType.ALL_ITEMS_PREPARED, async (payload) => {
    try {
        const { orderId } = payload;
        // Emit socket event to waiter
        io.emit('all_items_prepared', { orderId });
        console.log(`[Event] All items prepared for order ${orderId}`);
    }
    catch (error) {
        console.error('[Event] Error handling ALL_ITEMS_PREPARED:', error);
    }
});
// Listen for order served - notify waiter that kitchen has finished
(0, events_1.onEvent)(events_1.DomainEventType.ORDER_SERVED, async (payload) => {
    try {
        const { orderId } = payload;
        // Emit socket event to waiter
        io.emit('order_served', { orderId });
        console.log(`[Event] Order ${orderId} served by kitchen - notifying waiter`);
    }
    catch (error) {
        console.error('[Event] Error handling ORDER_SERVED:', error);
    }
});
// Listen for payment completed - try to close order
(0, events_1.onEvent)(events_1.DomainEventType.PAYMENT_COMPLETED, async (payload) => {
    try {
        const { orderId } = payload;
        // Check if order can be closed (all items served and payment completed)
        try {
            const { companyId } = payload;
            await ordersService.closeOrder(orderId, companyId);
            console.log(`[Event] Order ${orderId} closed after payment completion`);
            // Update cash session expected balance if it was a cash payment
            const { method, amount, restaurantId } = payload;
            const currentSession = await cashierDomainService.getCurrentSession(restaurantId);
            if (currentSession && method === 'cash') {
                await cashierDomainService.recordPayment(currentSession.id, method, amount);
                console.log(`[Event] Cash session ${currentSession.id} balance updated (+${amount})`);
            }
        }
        catch (error) {
            // Order cannot be closed yet (items not served, etc.)
            console.log(`[Event] Order ${orderId} cannot be closed yet:`, error.message);
        }
    }
    catch (error) {
        console.error('[Event] Error handling PAYMENT_COMPLETED:', error);
    }
});
// Socket.io events
io.on('connection', (socket) => {
    console.log('[Socket] Connected:', socket.id);
    socket.on('join_location', (locationId) => {
        socket.join(`location:${locationId}`);
        console.log(`[Socket] User joined location: ${locationId}`);
    });
    // Join kitchen room for kitchen tickets
    socket.on('join_kitchen', () => {
        socket.join('kitchen');
        console.log(`[Socket] ${socket.id} joined kitchen`);
    });
    // Join bar room for bar tickets
    socket.on('join_bar', () => {
        socket.join('bar');
        console.log(`[Socket] ${socket.id} joined bar`);
    });
    socket.on('order_status_change', (data) => {
        io.emit('order_updated', data);
    });
    // Mark ticket as completed
    socket.on('ticket_complete', async (data) => {
        await kitchenPrintService_1.default.markTicketCompleted(data.orderId, data.type);
    });
    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected:', socket.id);
    });
});
const PORT = process.env.PORT || 3000;
// Initialize database indexes on startup (optional)
if (process.env.APPLY_INDEXES === 'true') {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    (0, performance_1.applyIndexes)(pool).catch(err => {
        console.error('[Startup] Failed to apply indexes:', err);
    });
}
// Función para obtener la IP local
function getLocalIP() {
    const interfaces = os_1.default.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const networkInterface = interfaces[name];
        if (networkInterface) {
            for (const iface of networkInterface) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }
    return 'localhost';
}
const LOCAL_IP = getLocalIP();
const PORT_VAL = process.env.PORT || 3000;
const FINAL_PORT = typeof PORT_VAL === 'string' ? parseInt(PORT_VAL, 10) : PORT_VAL;
server.listen(FINAL_PORT, '0.0.0.0', () => {
    console.log(`✅ Backend listening on:`);
    console.log(`   - Local: http://localhost:${FINAL_PORT}`);
    console.log(`   - Red local: http://${LOCAL_IP}:${FINAL_PORT}`);
    console.log(`📚 Swagger UI: http://${LOCAL_IP}:${FINAL_PORT}/api/docs`);
    console.log(`🏥 Health check: http://${LOCAL_IP}:${FINAL_PORT}/health`);
    console.log(`🔐 Auth: POST http://${LOCAL_IP}:${FINAL_PORT}/api/v1/auth/login`);
    console.log(`🌐 CORS: ${process.env.NODE_ENV === 'development' || !process.env.CORS_ORIGIN ? 'Permite todas las conexiones (desarrollo)' : `Orígenes permitidos: ${process.env.CORS_ORIGIN}`}`);
    if (process.env.SENTRY_DSN) {
        console.log(`📊 Sentry monitoring: Enabled`);
    }
    if (process.env.DD_SERVICE) {
        console.log(`📊 DataDog APM: Enabled`);
    }
});

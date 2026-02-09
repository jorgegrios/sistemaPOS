import dotenv from 'dotenv';
dotenv.config(); // ← MOVER AQUÍ, ANTES DE TODO
// Config reload trigger: 2026-01-24

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import http from 'http';
import os from 'os';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import paymentsRouter from './routes/payments';
import ordersRouter from './routes/orders';
import menusRouter from './routes/menus';
import webhooksRouter from './routes/webhooks';
import authRouter, { verifyToken } from './routes/auth';
import printersRouter from './routes/printers';
import inventoryRouter from './routes/inventory';
import purchasesRouter from './routes/purchases';
import aiAnalysisRouter from './routes/ai-analysis';
import dashboardRouter from './routes/dashboard';
import tablesRouter from './routes/tables';
import cashierRouter from './routes/cashier';
import menuCostsRouter from './routes/menu-costs';
import advancedCostingRouter from './routes/advanced-costing';
import dynamicPricingRouter from './routes/dynamic-pricing';
import { swaggerSpec } from './swagger';
import {
  initSentry,
  initDataDog,
  errorTrackingMiddleware,
  requestTrackingMiddleware
} from './middleware/monitoring';
import { applyIndexes } from './config/performance';
import { Pool } from 'pg';
import kitchenPrintService from './services/kitchenPrintService';
import printerService from './services/printerService';
import printerDiscovery from './services/printerDiscovery';

// Domain-based routes (new modular architecture)
import ordersDomainRouter from './domains/orders/routes';
import tablesDomainRouter from './domains/tables/routes';
import productsDomainRouter from './domains/products/routes';
import kitchenDomainRouter from './domains/kitchen/routes';
import barDomainRouter from './domains/bar/routes';
import paymentsDomainRouter from './domains/payments/routes';
import cashierDomainRouter from './domains/cashier/routes';

// Event listeners for domain communication
import { onEvent, DomainEventType } from './shared/events';
import { TablesService } from './domains/tables/service';
import { OrdersService } from './domains/orders/service';
import { pool } from './shared/db';
import { CashierDomainService } from './domains/cashier/service';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// Initialize monitoring (optional - only if configured)
initSentry();
initDataDog();

// Middleware
app.use(helmet());

// Configuración de CORS para aceptar conexiones de red
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
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
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permitir cookies y headers de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Restaurant-ID', 'x-restaurant-id', 'X-Company-ID', 'x-company-id'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Request tracking middleware (for performance monitoring)
app.use(requestTrackingMiddleware);

// Swagger UI documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
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
app.get('/api/docs.json', (_, res) => res.json(swaggerSpec));

// Health check (no auth required)
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

// Authentication routes (no auth required for login)
app.use('/api/v1/auth', authRouter);

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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ============================================
// DOMAIN-BASED ROUTES (New Modular Architecture)
// ============================================
// Core POS domains following ALDELO specification
app.use('/api/v2/orders', verifyToken, ordersDomainRouter);
app.use('/api/v2/tables', verifyToken, tablesDomainRouter);
app.use('/api/v2/products', verifyToken, productsDomainRouter);
app.use('/api/v2/kitchen', verifyToken, kitchenDomainRouter);
app.use('/api/v2/bar', verifyToken, barDomainRouter);
app.use('/api/v2/payments', verifyToken, paymentsDomainRouter);
app.use('/api/v2/cashier', verifyToken, cashierDomainRouter);

// ============================================
// LEGACY ROUTES (Maintained for compatibility)
// ============================================
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/orders', verifyToken, ordersRouter);
app.use('/api/v1/menus', menusRouter); // Menus are public (read) / protected (write)
app.use('/api/v1/printers', verifyToken, printersRouter); // Printer management
app.use('/api/v1/inventory', inventoryRouter); // Inventory management
app.use('/api/v1/purchases', purchasesRouter); // Purchases and suppliers
app.use('/api/v1/dashboard', dashboardRouter); // Dashboard data
app.use('/api/v1/tables', tablesRouter); // Tables management
app.use('/api/v1/cashier', cashierRouter); // Cashier view
app.use('/api/v1/menu-costs', verifyToken, menuCostsRouter); // Menu costs calculation
app.use('/api/v1/advanced-costing', verifyToken, advancedCostingRouter); // Advanced costing system
app.use('/api/v1/dynamic-pricing', verifyToken, dynamicPricingRouter); // Dynamic pricing with AI
app.use('/api/v1/ai-analysis', verifyToken, aiAnalysisRouter); // AI Analysis (admin only)
app.use('/api/v1/webhooks', webhooksRouter); // Webhooks use provider signature verification

// Error handler (with tracking)
app.use(errorTrackingMiddleware);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize printer discovery and load existing configs
printerDiscovery.loadPrinterConfigs().then(() => {
  // Auto-discover printers on startup (optional, can be disabled)
  if (process.env.AUTO_DISCOVER_PRINTERS !== 'false') {
    console.log('[Startup] Auto-discovering printers...');
    printerDiscovery.scanNetwork().then((printers) => {
      if (printers.length > 0) {
        console.log(`[Startup] Found ${printers.length} printer(s), initializing...`);
        // Re-initialize printer service with discovered printers
        printerService.initializePrinters();
      } else {
        console.log('[Startup] No printers found, using manual configuration');
        printerService.initializePrinters();
      }
    }).catch(() => {
      // Fallback to manual config if discovery fails
      printerService.initializePrinters();
    });
  } else {
    // Use manual configuration only
    printerService.initializePrinters();
  }

  // Start periodic scanning if enabled
  if (process.env.PRINTER_DISCOVERY_INTERVAL) {
    const interval = parseInt(process.env.PRINTER_DISCOVERY_INTERVAL, 10);
    printerDiscovery.startPeriodicScan(interval);
  }
});

// Initialize kitchen print service with Socket.io
kitchenPrintService.setSocketIO(io);

// ============================================
// DOMAIN EVENT LISTENERS (Inter-domain communication)
// ============================================
// Initialize domain services for event handling
const tablesService = new TablesService(pool);
const ordersService = new OrdersService(pool);
const cashierDomainService = new CashierDomainService(pool);

// Listen for order created - DON'T occupy table yet (only when sent to kitchen)
// Table should only be occupied when order is sent to kitchen, not when draft is created
onEvent(DomainEventType.ORDER_CREATED, async (payload: any) => {
  try {
    // Don't occupy table on draft order creation
    // Table will be occupied when order is sent to kitchen
    console.log(`[Event] Order ${payload.orderId} created (draft) - table not occupied yet`);
  } catch (error) {
    console.error('[Event] Error handling ORDER_CREATED:', error);
  }
});

// Listen for order closed - mark table as paid (it stays occupied by customers but bill is done)
onEvent(DomainEventType.ORDER_CLOSED, async (payload: any) => {
  try {
    const { tableId } = payload;
    if (tableId) {
      await tablesService.markAsPaid(tableId);
      console.log(`[Event] Table ${tableId} marked as PAID after order closure`);
    }
  } catch (error) {
    console.error('[Event] Error handling ORDER_CLOSED:', error);
  }
});

// Listen for order sent to kitchen - occupy table and emit socket event
onEvent(DomainEventType.ORDER_SENT_TO_KITCHEN, async (payload: any) => {
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
  } catch (error) {
    console.error('[Event] Error handling ORDER_SENT_TO_KITCHEN:', error);
  }
});

// Listen for order item prepared - check if all prepared
onEvent(DomainEventType.ORDER_ITEM_PREPARED, async (payload: any) => {
  try {
    const { orderId } = payload;
    // Emit socket event to waiter
    io.emit('order_item_prepared', { orderId });
    console.log(`[Event] Order item prepared for order ${orderId}`);
  } catch (error) {
    console.error('[Event] Error handling ORDER_ITEM_PREPARED:', error);
  }
});

// Listen for all items prepared - notify waiter
onEvent(DomainEventType.ALL_ITEMS_PREPARED, async (payload: any) => {
  try {
    const { orderId } = payload;
    // Emit socket event to waiter
    io.emit('all_items_prepared', { orderId });
    console.log(`[Event] All items prepared for order ${orderId}`);
  } catch (error) {
    console.error('[Event] Error handling ALL_ITEMS_PREPARED:', error);
  }
});

// Listen for order served - notify waiter that kitchen has finished
onEvent(DomainEventType.ORDER_SERVED, async (payload: any) => {
  try {
    const { orderId } = payload;
    // Emit socket event to waiter
    io.emit('order_served', { orderId });
    console.log(`[Event] Order ${orderId} served by kitchen - notifying waiter`);
  } catch (error) {
    console.error('[Event] Error handling ORDER_SERVED:', error);
  }
});

// Listen for payment completed - try to close order
onEvent(DomainEventType.PAYMENT_COMPLETED, async (payload: any) => {
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
    } catch (error: any) {
      // Order cannot be closed yet (items not served, etc.)
      console.log(`[Event] Order ${orderId} cannot be closed yet:`, error.message);
    }
  } catch (error) {
    console.error('[Event] Error handling PAYMENT_COMPLETED:', error);
  }
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('[Socket] Connected:', socket.id);

  socket.on('join_location', (locationId: string) => {
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

  socket.on('order_status_change', (data: { orderId: string; status: string }) => {
    io.emit('order_updated', data);
  });

  // Mark ticket as completed
  socket.on('ticket_complete', async (data: { orderId: string; type: 'kitchen' | 'bar' }) => {
    await kitchenPrintService.markTicketCompleted(data.orderId, data.type);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

// Initialize database indexes on startup (optional)
if (process.env.APPLY_INDEXES === 'true') {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  applyIndexes(pool).catch(err => {
    console.error('[Startup] Failed to apply indexes:', err);
  });
}

// Función para obtener la IP local
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
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

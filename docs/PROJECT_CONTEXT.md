# 📘 Project Context - Sistema POS para Restaurantes

> **Propósito**: Este documento proporciona contexto completo del proyecto para cualquier modelo LLM o desarrollador que trabaje en el sistema. Léelo completamente antes de hacer cambios.

**Última actualización**: 2026-01-24  
**Versión del proyecto**: 1.0.0  
**Estado**: En desarrollo activo

---

## 🎯 Descripción del Proyecto

**Sistema POS (Point of Sale) completo para restaurantes** con soporte multi-proveedor de pagos, gestión de mesas, cocina, bar, inventario, y dashboard de métricas.

### Características Principales

- ✅ **Gestión de Órdenes**: Crear, modificar, y cerrar órdenes de mesas
- ✅ **Sistema de Mesas**: Estados (disponible, ocupada, pagada), asignación de órdenes
- ✅ **Múltiples Métodos de Pago**: Efectivo, tarjeta (Stripe), PayPal, Square, Mercado Pago
- ✅ **Kitchen Display System (KDS)**: Pantalla de cocina en tiempo real
- ✅ **Bar Display**: Pantalla separada para bebidas
- ✅ **Caja (Cashier)**: Procesamiento de pagos y cierre de órdenes
- ✅ **Inventario**: Gestión de stock, alertas, ajustes
- ✅ **Compras**: Órdenes de compra a proveedores
- ✅ **Dashboard**: Métricas de ventas, productos más vendidos, ingresos
- ✅ **Multi-empresa**: Soporte para múltiples restaurantes/empresas
- ✅ **Sesiones configurables**: Timeout de sesión por empresa
- ✅ **Internacionalización**: Soporte i18n (español/inglés)

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### **Frontend**
- **Framework**: React 18.2 + TypeScript
- **Build Tool**: Vite 5.0
- **Routing**: React Router DOM 6.20
- **Styling**: TailwindCSS 3.3
- **State Management**: Zustand 4.4
- **HTTP Client**: Axios 1.6
- **UI Components**: Lucide React (iconos), Sonner (toasts)
- **Payments**: Stripe React/JS 3.0
- **i18n**: react-i18next 16.5

#### **Backend**
- **Runtime**: Node.js 20 + TypeScript 5.6
- **Framework**: Express 4.18
- **Database**: PostgreSQL (via `pg` 8.11)
- **Cache**: Redis (via `ioredis` 5.3)
- **Real-time**: Socket.io 4.8
- **Message Queue**: RabbitMQ (via `amqplib` 0.10)
- **Authentication**: JWT (jsonwebtoken 9.0) + bcrypt 6.0
- **Payment Providers**:
  - Stripe 12.14
  - Square 35.0
  - PayPal Checkout SDK 1.0
  - Mercado Pago 2.0
- **Printing**: node-thermal-printer 4.5
- **API Docs**: Swagger UI Express 4.6
- **Migrations**: node-pg-migrate 8.0

#### **Infrastructure**
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL (puerto 5432)
- **Cache**: Redis (puerto 6379)
- **Message Broker**: RabbitMQ
- **Process Manager**: PM2 (ecosystem.config.js)

---

## 📁 Estructura del Proyecto

```
sistemaPOS/
├── backend/                    # Backend Node.js + Express
│   ├── src/
│   │   ├── config/            # Configuraciones (DB, Redis, etc.)
│   │   ├── db/                # Pool de PostgreSQL
│   │   ├── domains/           # Lógica de negocio por dominio
│   │   │   ├── bar/           # Controlador y servicio de bar
│   │   │   ├── cashier/       # Caja y procesamiento de pagos
│   │   │   ├── kitchen/       # Cocina y órdenes
│   │   │   ├── orders/        # Gestión de órdenes
│   │   │   ├── payments/      # Providers de pago (Stripe, etc.)
│   │   │   ├── products/      # Productos y categorías
│   │   │   └── tables/        # Mesas y estados
│   │   ├── lib/               # Utilidades compartidas
│   │   ├── middleware/        # Auth, error handling
│   │   ├── routes/            # Rutas de Express
│   │   ├── services/          # Servicios compartidos
│   │   ├── shared/            # Tipos y constantes
│   │   ├── index.ts           # Punto de entrada principal
│   │   └── swagger.ts         # Documentación OpenAPI
│   ├── migrations/            # Migraciones de base de datos
│   ├── scripts/               # Scripts de seed y utilidades
│   └── package.json
│
├── frontend/                   # Frontend React + Vite
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── contexts/          # React Contexts
│   │   ├── domains/           # Lógica de negocio por dominio
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilidades
│   │   ├── locales/           # Traducciones i18n
│   │   ├── pages/             # Páginas/Rutas principales
│   │   │   ├── CashierPage.tsx
│   │   │   ├── CreateOrderPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── KitchenPage.tsx
│   │   │   ├── BarPage.tsx
│   │   │   └── ... (33 páginas total)
│   │   ├── services/          # API clients
│   │   ├── utils/             # Helpers
│   │   ├── App.tsx            # Componente raíz
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Estilos globales
│   └── package.json
│
├── docs/                       # Documentación del proyecto
│   ├── changes/               # Registro de cambios por feature
│   ├── ARCHITECTURE.md        # Arquitectura del sistema
│   ├── PAYMENT_FLOW.md        # Flujo de pagos
│   └── PROJECT_CONTEXT.md     # Este documento
│
├── docker-compose.yml          # Servicios Docker
├── .env                        # Variables de entorno
└── package.json                # Scripts raíz
```

---

## 🔑 Dominios del Sistema

### Backend Domains (`backend/src/domains/`)

Cada dominio sigue el patrón: **Controller → Service → Database**

| Dominio | Descripción | Archivos principales |
|---------|-------------|---------------------|
| `bar/` | Gestión de órdenes de bebidas | controller.ts, service.ts, types.ts |
| `cashier/` | Procesamiento de pagos y cierre de caja | controller.ts, service.ts |
| `kitchen/` | Display de cocina y órdenes | controller.ts, service.ts |
| `orders/` | CRUD de órdenes | controller.ts, service.ts |
| `payments/` | **Providers de pago multi-proveedor** | providers.ts, factory.ts |
| `products/` | Productos y categorías | controller.ts, service.ts |
| `tables/` | Mesas y estados | controller.ts, service.ts |

### Frontend Pages (`frontend/src/pages/`)

| Página | Ruta | Descripción |
|--------|------|-------------|
| `LoginPage.tsx` | `/login` | Autenticación de usuarios |
| `DashboardPage.tsx` | `/dashboard` | Métricas y estadísticas |
| `TablesPage.tsx` | `/tables` | Vista de mesas del restaurante |
| `CreateOrderPage.tsx` | `/orders/new` | Crear nueva orden (mesero) |
| `CashierPage.tsx` | `/cashier` | Procesar pagos y cerrar órdenes |
| `KitchenPage.tsx` | `/kitchen` | Display de cocina |
| `BarPage.tsx` | `/bar` | Display de bar |
| `InventoryPage.tsx` | `/inventory` | Gestión de inventario |
| `MenuPage.tsx` | `/menu` | Menú público |
| `ManageMenuPage.tsx` | `/admin/menu` | Administrar productos |

---

## 🔐 Autenticación y Seguridad

### JWT Authentication

- **Access Token**: Expira en 15 minutos
- **Refresh Token**: Expira en 7 días
- **Almacenamiento**: LocalStorage (frontend)
- **Headers**: `Authorization: Bearer <token>`

### Roles de Usuario

```typescript
type UserRole = 'admin' | 'manager' | 'waiter' | 'kitchen' | 'bar' | 'cashier';
```

### Session Timeout

- Configurable por empresa (`companies.session_timeout_minutes`)
- Modal de advertencia 2 minutos antes de expirar
- Auto-logout al expirar

---

## 💳 Sistema de Pagos

### Payment Providers Implementados

1. **Stripe** (Activo)
   - Test mode habilitado
   - Tarjeta de prueba: `4242 4242 4242 4242`
   - Configuración: `STRIPE_SECRET_KEY` en `.env`

2. **PayPal** (Configurado)
3. **Square** (Configurado)
4. **Mercado Pago** (Configurado)

### Flujo de Pago

```
Usuario selecciona mesa → Click "💳 Tarjeta" → 
StripePaymentModal → Ingresa datos → 
Frontend crea payment con cardToken → 
Backend usa StripeProvider.processPayment() → 
Stripe procesa → Orden cerrada → Mesa "Pagada"
```

### Archivos Clave

- `backend/src/domains/payments/providers.ts` - Implementación de providers
- `backend/src/domains/payments/factory.ts` - Factory pattern
- `frontend/src/components/StripePaymentModal.tsx` - Modal de pago
- `frontend/src/pages/CashierPage.tsx` - Integración

---

## 🗄️ Base de Datos

### Tablas Principales

```sql
-- Core
companies          -- Empresas/restaurantes
users              -- Usuarios del sistema
sessions           -- Sesiones activas

-- Operaciones
tables             -- Mesas del restaurante
orders             -- Órdenes de clientes
order_items        -- Items de cada orden
payments           -- Pagos procesados

-- Inventario
products           -- Productos/platos del menú
categories         -- Categorías de productos
inventory_items    -- Items de inventario
purchase_orders    -- Órdenes de compra
suppliers          -- Proveedores

-- Configuración
company_settings   -- Configuraciones por empresa
```

### Migraciones

```bash
# Ejecutar migraciones
npm run migrate:up

# Revertir última migración
npm run migrate:down

# Reset completo
npm run migrate:reset

# Seed de datos de prueba
npm run seed
```

**Ubicación**: `backend/migrations/`

---

## 🚀 Comandos Importantes

### Desarrollo

```bash
# Iniciar todo (backend + frontend)
npm run dev

# Solo backend
npm run dev:backend

# Solo frontend
npm run dev:frontend

# Docker (PostgreSQL + Redis)
npm run docker:up
```

### Build y Producción

```bash
# Build completo
npm run build

# Iniciar en producción
npm run start
```

### Testing y Linting

```bash
# Lint todo
npm run lint

# Lint backend
npm run lint:backend

# Lint frontend
npm run lint:frontend
```

---

## 🌐 Variables de Entorno

### Backend (`.env` raíz y `backend/.env`)

```bash
# Database
DATABASE_URL=postgresql://pos_admin:postgres@localhost:5432/pos_system

# Redis
REDIS_URL=redis://:redis_password@localhost:6379

# JWT
JWT_SECRET=local_dev_secret_key_12345
JWT_REFRESH_SECRET=local_dev_refresh_secret_key_67890

# API
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:3000
```

---

## 📋 Patrones y Convenciones

### 1. **Estructura de Dominios**

Cada dominio backend sigue:

```typescript
// controller.ts
export class DomainController {
  async getAll(req, res) { /* ... */ }
  async getById(req, res) { /* ... */ }
  async create(req, res) { /* ... */ }
  async update(req, res) { /* ... */ }
  async delete(req, res) { /* ... */ }
}

// service.ts
export class DomainService {
  async findAll() { /* SQL query */ }
  async findById(id) { /* SQL query */ }
  async create(data) { /* SQL insert */ }
  async update(id, data) { /* SQL update */ }
  async delete(id) { /* SQL delete */ }
}

// types.ts
export interface DomainEntity { /* ... */ }
export interface CreateDomainRequest { /* ... */ }
```

### 2. **Naming Conventions**

- **Archivos**: PascalCase para componentes (`CashierPage.tsx`), camelCase para utils
- **Componentes React**: PascalCase
- **Funciones**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Tipos/Interfaces**: PascalCase
- **Rutas API**: kebab-case (`/api/order-items`)

### 3. **Imports**

```typescript
// Orden de imports
import React from 'react';           // 1. Librerías externas
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components'; // 2. Componentes internos
import { useAuth } from '@/hooks';     // 3. Hooks
import { api } from '@/services';      // 4. Servicios
import type { Order } from '@/types';  // 5. Tipos
```

### 4. **Error Handling**

```typescript
// Backend
try {
  const result = await service.doSomething();
  res.json(result);
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Error message' });
}

// Frontend
try {
  const data = await api.fetchData();
  setData(data);
} catch (error) {
  toast.error('Error al cargar datos');
  console.error(error);
}
```

---

## ⚠️ REGLAS CRÍTICAS PARA MODIFICACIONES

### 🚫 NO HACER SIN CONSULTAR

1. **NO refactorizar** código existente sin razón explícita
2. **NO cambiar** nombres de archivos o carpetas establecidas
3. **NO eliminar** código que parezca "innecesario" sin verificar
4. **NO introducir** nuevas dependencias sin justificación
5. **NO modificar** la estructura de carpetas existente
6. **NO cambiar** patrones establecidos (ej: Controller → Service)

### ✅ HACER SIEMPRE

1. **Seguir** los patrones existentes en el código
2. **Usar** los mismos estilos y convenciones
3. **Preguntar** antes de cambios estructurales
4. **Documentar** cambios en `docs/changes/`
5. **Probar** localmente antes de confirmar
6. **Revisar** archivos relacionados antes de modificar

### 📝 Antes de Modificar un Archivo

1. **Lee el archivo completo** primero
2. **Busca archivos relacionados** (imports, exports)
3. **Verifica el patrón** usado en archivos similares
4. **Pregunta si no estás seguro** del impacto

---

## 🧪 Testing

### Datos de Prueba

**Usuario Admin por defecto:**
- Email: `admin@example.com`
- Password: `admin123`

**Tarjeta de prueba Stripe:**
- Número: `4242 4242 4242 4242`
- Vencimiento: `12/25`
- CVC: `123`

### Flujos de Prueba Comunes

1. **Login → Dashboard → Ver métricas**
2. **Mesas → Crear orden → Agregar items → Enviar a cocina**
3. **Cocina → Ver órdenes → Marcar como preparada**
4. **Caja → Seleccionar mesa → Pagar con tarjeta → Cerrar orden**
5. **Inventario → Ver stock → Crear alerta**

---

## 📚 Documentación Adicional

### Archivos de Referencia

- [`ARCHITECTURE.md`](file:///c:/proyectos/posRestaurante/sistemaPOS/docs/ARCHITECTURE.md) - Arquitectura detallada
- [`PAYMENT_FLOW.md`](file:///c:/proyectos/posRestaurante/sistemaPOS/docs/PAYMENT_FLOW.md) - Flujo de pagos
- [`QUICKSTART.md`](file:///c:/proyectos/posRestaurante/sistemaPOS/QUICKSTART.md) - Guía de inicio rápido
- [`docs/changes/`](file:///c:/proyectos/posRestaurante/sistemaPOS/docs/changes) - Registro de cambios por feature

### Últimas Features Implementadas

Ver: [`docs/changes/2026-01-24_stripe-cashier-integration.md`](file:///c:/proyectos/posRestaurante/sistemaPOS/docs/changes/2026-01-24_stripe-cashier-integration.md)

- ✅ Integración de Stripe en CashierPage
- ✅ StripePaymentModal component
- ✅ Session timeout configurable por empresa
- ✅ Layout fixes en CreateOrderPage

---

## 🎯 Estado Actual del Proyecto

### ✅ Completado

- [x] Autenticación JWT con refresh tokens
- [x] Multi-empresa con configuraciones
- [x] CRUD completo de órdenes, mesas, productos
- [x] Kitchen Display System (KDS)
- [x] Bar Display System
- [x] Sistema de pagos con Stripe
- [x] Dashboard con métricas
- [x] Gestión de inventario
- [x] Órdenes de compra a proveedores
- [x] Internacionalización (i18n)
- [x] Session timeout configurable

### 🚧 En Desarrollo

- [ ] Mejoras en Stripe Elements (usar componentes oficiales)
- [ ] Soporte 3D Secure
- [ ] Guardar métodos de pago de clientes
- [ ] Reportes avanzados
- [ ] Integración con impresoras térmicas

### 📋 Backlog

- [ ] App móvil nativa (React Native)
- [ ] Modo offline (PWA)
- [ ] Multi-moneda
- [ ] Propinas configurables
- [ ] Sistema de reservas

---

## 🆘 Troubleshooting Común

### Backend no inicia

```bash
# Verificar PostgreSQL
docker ps | grep postgres

# Verificar .env
cat .env | grep DATABASE_URL

# Reiniciar servicios
npm run docker:down && npm run docker:up
```

### Frontend no conecta con API

```bash
# Verificar VITE_API_URL
cat frontend/.env

# Verificar CORS en backend
# Debe coincidir con CORS_ORIGIN en .env raíz
```

### Migraciones fallan

```bash
# Reset completo (¡CUIDADO: Borra datos!)
npm run migrate:reset

# Seed de datos de prueba
npm run seed
```

---

## 📞 Contacto y Soporte

**Desarrollador Principal**: Jorge  
**Proyecto**: Sistema POS para Restaurantes  
**Repositorio**: `c:\proyectos\posRestaurante\sistemaPOS`

---

## 🔄 Historial de Versiones

| Versión | Fecha | Cambios Principales |
|---------|-------|---------------------|
| 1.0.0 | 2026-01-24 | Integración Stripe, Session timeout, Layout fixes |
| 0.9.0 | 2026-01-22 | CreateOrderPage refactor, Footer fixes |
| 0.8.0 | 2026-01-20 | Dashboard, Caja, Inventario |
| 0.7.0 | 2026-01-15 | Authentication, Multi-empresa |

---

## 📖 Cómo Usar Este Documento

### Para Modelos LLM

1. **Lee este documento COMPLETO** antes de hacer cualquier cambio
2. **Sigue las reglas críticas** en la sección "REGLAS CRÍTICAS PARA MODIFICACIONES"
3. **Usa los patrones establecidos** en "Patrones y Convenciones"
4. **Consulta antes de refactorizar** o cambiar estructura
5. **Documenta tus cambios** en `docs/changes/YYYY-MM-DD_feature-name.md`

### Para Desarrolladores

1. Lee este documento para entender la arquitectura
2. Revisa `QUICKSTART.md` para iniciar el proyecto
3. Consulta `docs/changes/` para ver features recientes
4. Sigue los patrones de código existentes
5. Actualiza este documento si haces cambios estructurales

---

**Última actualización**: 2026-01-24 12:21 GMT-5  
**Documento mantenido por**: Sistema de documentación automática

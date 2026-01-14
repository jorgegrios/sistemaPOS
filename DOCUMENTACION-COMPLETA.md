# 📚 Documentación Completa - Sistema POS

**Versión:** 1.0.0  
**Fecha:** Enero 2025  
**Estado:** ✅ Sistema Completo y Funcional

---

## 📋 Índice

1. [Descripción General del Sistema](#descripción-general-del-sistema)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Estructura de Archivos - Backend](#estructura-de-archivos---backend)
5. [Estructura de Archivos - Frontend](#estructura-de-archivos---frontend)
6. [Base de Datos y Migraciones](#base-de-datos-y-migraciones)
7. [Configuración y Despliegue](#configuración-y-despliegue)

---

## 🎯 Descripción General del Sistema

**Sistema POS (Point of Sale)** es una aplicación completa para la gestión de restaurantes que incluye:

- **Gestión de Órdenes**: Creación, seguimiento y gestión completa de órdenes
- **Sistema de Pagos Multi-proveedor**: Integración con Stripe, Square, Mercado Pago y PayPal
- **Gestión de Menús**: Administración completa de menús, categorías e items
- **Sistema de Cocina (KDS)**: Visualización y gestión de órdenes en cocina
- **Sistema de Bar**: Gestión separada para órdenes de bar
- **Gestión de Mesas**: Control de ocupación y estado de mesas
- **Inventario**: Control de stock, proveedores y órdenes de compra
- **Usuarios y Roles**: Sistema de autenticación con múltiples roles
- **Análisis de Costos**: Cálculo de costos de menú y precios dinámicos
- **Análisis con IA**: Análisis inteligente de ingredientes y productos
- **Impresión**: Integración con impresoras térmicas y descubrimiento automático
- **Dashboard**: Panel de control con estadísticas y métricas

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

**Backend:**
- Node.js + Express (TypeScript)
- PostgreSQL (Base de datos)
- Redis (Caché)
- Socket.io (Tiempo real)
- JWT (Autenticación)

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS (Estilos)
- React Router (Navegación)
- Axios (HTTP client)

**Infraestructura:**
- Docker + Docker Compose
- PM2 (Gestión de procesos)
- Nginx (Proxy reverso)

### Arquitectura de Dominios

El sistema está organizado en **dominios** que representan áreas funcionales:

- **Orders Domain**: Gestión de órdenes
- **Payments Domain**: Procesamiento de pagos
- **Products Domain**: Gestión de productos y menús
- **Tables Domain**: Gestión de mesas
- **Kitchen Domain**: Sistema de cocina (KDS)
- **Bar Domain**: Sistema de bar

---

## ✨ Funcionalidades Implementadas

### 1. Sistema de Autenticación y Autorización

- ✅ Login/Logout con JWT
- ✅ Roles de usuario: `admin`, `manager`, `waiter`, `cashier`, `kitchen`, `bartender`
- ✅ Rutas protegidas por rol
- ✅ Middleware de autenticación
- ✅ Gestión de tokens y sesiones

### 2. Gestión de Órdenes

- ✅ Crear órdenes con carrito de compras
- ✅ Personalización de productos (excluir ingredientes, agregar adiciones)
- ✅ Estados de orden: `draft`, `pending`, `preparing`, `ready`, `served`, `completed`, `cancelled`
- ✅ Cálculo automático de totales (subtotal, impuestos, propina, descuentos)
- ✅ Agregar/eliminar items de órdenes existentes
- ✅ Notas y observaciones por item
- ✅ Historial completo de órdenes

### 3. Sistema de Pagos

- ✅ **Múltiples Proveedores**: Stripe, Square, Mercado Pago, PayPal
- ✅ **Múltiples Métodos**: Tarjeta, Efectivo, QR, Wallet
- ✅ **Orquestación de Pagos**: Payment Orchestrator para manejar múltiples proveedores
- ✅ **Sistema de Reembolsos**: Refund Orchestrator completo
- ✅ **Idempotencia**: Prevención de cargos duplicados
- ✅ **Retry Logic**: Reintentos automáticos con exponential backoff
- ✅ **Webhooks**: Actualización automática de estados
- ✅ **Gestión de Propinas**: Botones rápidos y personalizado
- ✅ **Verificación de Firmas**: HMAC para todos los webhooks

### 4. Gestión de Menús

- ✅ CRUD completo de menús
- ✅ Categorías de productos
- ✅ Items de menú con precios y descripciones
- ✅ Control de disponibilidad
- ✅ Metadatos para ingredientes
- ✅ Categoría especial "Adiciones" para extras
- ✅ Análisis inteligente de ingredientes con IA

### 5. Sistema de Cocina (KDS)

- ✅ Visualización de órdenes activas
- ✅ Tickets de cocina y bar separados
- ✅ Estados de preparación: `pending`, `preparing`, `ready`
- ✅ Marcar items como preparados
- ✅ Impresión automática de tickets
- ✅ Notificaciones en tiempo real con Socket.io
- ✅ Vista de órdenes servidas

### 6. Sistema de Bar

- ✅ Gestión separada de órdenes de bar
- ✅ Tickets de bar independientes
- ✅ Estados específicos para bar

### 7. Gestión de Mesas

- ✅ Crear y gestionar mesas
- ✅ Estados de mesa: `available`, `occupied`, `reserved`, `cleaning`
- ✅ Ocupación automática al enviar orden a cocina
- ✅ Liberación automática al completar orden

### 8. Inventario

- ✅ Gestión de items de inventario
- ✅ Control de stock (entradas, salidas, ajustes)
- ✅ Alertas de stock bajo
- ✅ Gestión de proveedores
- ✅ Órdenes de compra
- ✅ Historial de movimientos

### 9. Análisis de Costos

- ✅ Cálculo de costos de menú
- ✅ Sistema de costeo avanzado
- ✅ Precios dinámicos basados en costos
- ✅ Análisis de rentabilidad

### 10. Análisis con IA

- ✅ Análisis inteligente de ingredientes
- ✅ Identificación automática de productos en descripciones
- ✅ Sugerencias de ingredientes al crear productos

### 11. Impresión

- ✅ Descubrimiento automático de impresoras
- ✅ Impresión de tickets de cocina
- ✅ Impresión de tickets de bar
- ✅ Impresión de recibos
- ✅ Soporte para impresoras térmicas

### 12. Dashboard y Reportes

- ✅ Estadísticas de ventas
- ✅ Métricas de órdenes
- ✅ Análisis de pagos
- ✅ Vista de mesas ocupadas
- ✅ Estadísticas en tiempo real

### 13. Gestión de Usuarios

- ✅ CRUD de usuarios
- ✅ Asignación de roles
- ✅ Gestión de permisos
- ✅ Usuarios específicos para cocina y bar

### 14. Caja (Cashier)

- ✅ Vista especializada para cajeros
- ✅ Procesamiento rápido de pagos
- ✅ Gestión de órdenes pendientes
- ✅ Cierre de caja

---

## 📁 Estructura de Archivos - Backend

### 📂 `/backend/` - Directorio Principal

#### 📄 `package.json`
**Descripción:** Configuración de dependencias y scripts del backend.  
**Funcionalidad:** Define scripts para desarrollo (`dev`), build (`build`), producción (`start`), migraciones (`migrate`), y seeds (`seed`).

#### 📄 `tsconfig.json`
**Descripción:** Configuración de TypeScript para el backend.  
**Funcionalidad:** Define opciones de compilación, paths, y configuración del compilador.

#### 📄 `ecosystem.config.js`
**Descripción:** Configuración de PM2 para gestión de procesos en producción.  
**Funcionalidad:** Define cómo PM2 debe ejecutar el backend, logs, reinicios automáticos, y límites de memoria.

#### 📄 `Dockerfile`
**Descripción:** Configuración de Docker para contenedorizar el backend.  
**Funcionalidad:** Define la imagen base, instalación de dependencias, y comandos de ejecución.

#### 📄 `k6-load-test.js`
**Descripción:** Script de pruebas de carga usando k6.  
**Funcionalidad:** Simula múltiples usuarios haciendo requests para probar el rendimiento del sistema.

---

### 📂 `/backend/src/` - Código Fuente

#### 📄 `index.ts`
**Descripción:** Punto de entrada principal del backend.  
**Funcionalidad:** 
- Inicializa Express y Socket.io
- Configura middleware (CORS, Helmet, JSON parsing)
- Registra todas las rutas
- Inicializa Swagger UI
- Configura monitoreo (Sentry, DataDog)
- Inicia el servidor HTTP
- Maneja eventos de dominio
- Configura Socket.io para tiempo real

#### 📄 `swagger.ts`
**Descripción:** Configuración de Swagger/OpenAPI para documentación de API.  
**Funcionalidad:** Define la especificación OpenAPI 3.0 con todos los endpoints, schemas, y ejemplos.

---

### 📂 `/backend/src/routes/` - Rutas HTTP

#### 📄 `auth.ts`
**Descripción:** Rutas de autenticación.  
**Funcionalidad:** 
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/logout` - Cerrar sesión
- `GET /api/v1/auth/verify` - Verificar token
- Middleware `verifyToken` para proteger rutas

#### 📄 `orders.ts`
**Descripción:** Rutas para gestión de órdenes (legacy).  
**Funcionalidad:** CRUD de órdenes, agregar items, actualizar estados.

#### 📄 `payments.ts`
**Descripción:** Rutas para procesamiento de pagos.  
**Funcionalidad:**
- `POST /api/v1/payments/process` - Procesar pago
- `POST /api/v1/payments/refund/:id` - Reembolsar
- `GET /api/v1/payments/:id` - Obtener pago
- `GET /api/v1/payments/methods` - Listar métodos de pago
- `GET /api/v1/payments/stripe/config` - Configuración Stripe

#### 📄 `menus.ts`
**Descripción:** Rutas para gestión de menús.  
**Funcionalidad:**
- `GET /api/v1/menus/:restaurantId` - Listar menús
- `GET /api/v1/menus/:restaurantId/:menuId` - Obtener menú completo
- `POST /api/v1/menus/items` - Crear item
- `PUT /api/v1/menus/items/:id` - Actualizar item
- `GET /api/v1/menus/items/:id` - Obtener item

#### 📄 `webhooks.ts`
**Descripción:** Rutas para recibir webhooks de proveedores de pago.  
**Funcionalidad:**
- `POST /api/v1/webhooks/stripe` - Webhooks de Stripe
- `POST /api/v1/webhooks/square` - Webhooks de Square
- `POST /api/v1/webhooks/mercadopago` - Webhooks de Mercado Pago
- `POST /api/v1/webhooks/paypal` - Webhooks de PayPal
- Verificación de firmas HMAC

#### 📄 `tables.ts`
**Descripción:** Rutas para gestión de mesas.  
**Funcionalidad:** CRUD de mesas, actualizar estados, obtener mesas ocupadas.

#### 📄 `inventory.ts`
**Descripción:** Rutas para gestión de inventario.  
**Funcionalidad:** CRUD de items de inventario, ajustes de stock, alertas.

#### 📄 `purchases.ts`
**Descripción:** Rutas para órdenes de compra.  
**Funcionalidad:** CRUD de órdenes de compra, proveedores, recepción de productos.

#### 📄 `printers.ts`
**Descripción:** Rutas para gestión de impresoras.  
**Funcionalidad:** Listar impresoras, descubrir impresoras, imprimir tickets.

#### 📄 `cashier.ts`
**Descripción:** Rutas específicas para cajeros.  
**Funcionalidad:** Órdenes pendientes, procesar pagos rápidos, cierre de caja.

#### 📄 `dashboard.ts`
**Descripción:** Rutas para datos del dashboard.  
**Funcionalidad:** Estadísticas, métricas, resúmenes de ventas.

#### 📄 `ai-analysis.ts`
**Descripción:** Rutas para análisis con IA.  
**Funcionalidad:** Análisis de ingredientes, sugerencias de productos.

#### 📄 `menu-costs.ts`
**Descripción:** Rutas para cálculo de costos de menú.  
**Funcionalidad:** Calcular costos, actualizar precios basados en costos.

#### 📄 `advanced-costing.ts`
**Descripción:** Rutas para sistema de costeo avanzado.  
**Funcionalidad:** Análisis detallado de costos, rentabilidad.

#### 📄 `dynamic-pricing.ts`
**Descripción:** Rutas para precios dinámicos.  
**Funcionalidad:** Ajustar precios basados en demanda, costos, etc.

---

### 📂 `/backend/src/domains/` - Arquitectura por Dominios

#### 📂 `orders/`
**Descripción:** Dominio de órdenes.  
**Archivos:**
- `routes.ts` - Rutas del dominio de órdenes
- `service.ts` - Lógica de negocio de órdenes
- `types.ts` - Tipos TypeScript para órdenes
- `shared/` - Código compartido del dominio

**Funcionalidad:** Gestión completa del ciclo de vida de órdenes, estados, items, y cálculos.

#### 📂 `payments/`
**Descripción:** Dominio de pagos.  
**Archivos:**
- `routes.ts` - Rutas del dominio de pagos
- `service.ts` - Lógica de negocio de pagos
- `types.ts` - Tipos TypeScript para pagos
- `shared/` - Código compartido del dominio

**Funcionalidad:** Procesamiento de pagos, reembolsos, y gestión de transacciones.

#### 📂 `products/`
**Descripción:** Dominio de productos y menús.  
**Archivos:**
- `routes.ts` - Rutas del dominio de productos
- `service.ts` - Lógica de negocio de productos
- `types.ts` - Tipos TypeScript para productos
- `shared/` - Código compartido del dominio

**Funcionalidad:** Gestión de productos, menús, categorías, y disponibilidad.

#### 📂 `tables/`
**Descripción:** Dominio de mesas.  
**Archivos:**
- `routes.ts` - Rutas del dominio de mesas
- `service.ts` - Lógica de negocio de mesas
- `types.ts` - Tipos TypeScript para mesas
- `shared/` - Código compartido del dominio

**Funcionalidad:** Gestión de mesas, estados, y ocupación.

#### 📂 `kitchen/`
**Descripción:** Dominio de cocina (KDS).  
**Archivos:**
- `routes.ts` - Rutas del dominio de cocina
- `service.ts` - Lógica de negocio de cocina
- `types.ts` - Tipos TypeScript para cocina
- `shared/` - Código compartido del dominio

**Funcionalidad:** Visualización de órdenes en cocina, tickets, y estados de preparación.

#### 📂 `bar/`
**Descripción:** Dominio de bar.  
**Archivos:**
- `routes.ts` - Rutas del dominio de bar
- `service.ts` - Lógica de negocio de bar
- `types.ts` - Tipos TypeScript para bar
- `shared/` - Código compartido del dominio

**Funcionalidad:** Gestión de órdenes de bar y tickets de bar.

---

### 📂 `/backend/src/services/` - Servicios de Negocio

#### 📄 `paymentOrchestrator.ts`
**Descripción:** Orquestador principal de pagos.  
**Funcionalidad:** Coordina pagos entre múltiples proveedores, maneja idempotencia, retry logic, y errores.

#### 📄 `refundOrchestrator.ts`
**Descripción:** Orquestador de reembolsos.  
**Funcionalidad:** Coordina reembolsos entre múltiples proveedores, maneja estados y confirmaciones.

#### 📄 `kitchenPrintService.ts`
**Descripción:** Servicio de impresión para cocina.  
**Funcionalidad:** Genera y envía tickets de cocina a impresoras, maneja estados de impresión.

#### 📄 `printerService.ts`
**Descripción:** Servicio general de impresión.  
**Funcionalidad:** Comunicación con impresoras térmicas, formateo de tickets, impresión de recibos.

#### 📄 `printerDiscovery.ts`
**Descripción:** Servicio de descubrimiento de impresoras.  
**Funcionalidad:** Descubre impresoras en la red local usando mDNS/Bonjour, escaneo periódico.

#### 📄 `inventoryService.ts`
**Descripción:** Servicio de gestión de inventario.  
**Funcionalidad:** Control de stock, movimientos, alertas, y cálculos de inventario.

#### 📄 `purchaseService.ts`
**Descripción:** Servicio de órdenes de compra.  
**Funcionalidad:** Gestión de órdenes de compra, recepción de productos, integración con inventario.

#### 📄 `receiptService.ts`
**Descripción:** Servicio de generación de recibos.  
**Funcionalidad:** Formatea y genera recibos de venta, tickets de impresión.

#### 📄 `tableService.ts`
**Descripción:** Servicio de gestión de mesas.  
**Funcionalidad:** Control de estados de mesas, ocupación, y liberación.

#### 📄 `dashboardService.ts`
**Descripción:** Servicio de datos del dashboard.  
**Funcionalidad:** Agrega estadísticas, métricas, y datos para visualización.

#### 📄 `aiAnalysisService.ts`
**Descripción:** Servicio de análisis con IA.  
**Funcionalidad:** Análisis de ingredientes, identificación de productos, sugerencias.

---

### 📂 `/backend/src/services/providers/` - Proveedores de Pago

#### 📄 `stripe.ts`
**Descripción:** Integración con Stripe.  
**Funcionalidad:** Procesamiento de pagos, reembolsos, verificación de webhooks con Stripe API.

#### 📄 `square.ts`
**Descripción:** Integración con Square.  
**Funcionalidad:** Procesamiento de pagos, reembolsos, verificación de webhooks con Square API.

#### 📄 `mercadopago.ts`
**Descripción:** Integración con Mercado Pago.  
**Funcionalidad:** Procesamiento de pagos, reembolsos, verificación de webhooks con Mercado Pago API.

---

### 📂 `/backend/src/shared/` - Código Compartido

#### 📄 `db.ts`
**Descripción:** Pool de conexiones a PostgreSQL.  
**Funcionalidad:** Configuración y gestión del pool de conexiones a la base de datos.

#### 📄 `events.ts`
**Descripción:** Sistema de eventos de dominio.  
**Funcionalidad:** Publicación y suscripción a eventos entre dominios (ORDER_CREATED, ORDER_UPDATED, etc.).

#### 📄 `idempotency.ts`
**Descripción:** Utilidades para idempotencia.  
**Funcionalidad:** Generación y verificación de claves de idempotencia para prevenir operaciones duplicadas.

#### 📄 `types.ts`
**Descripción:** Tipos TypeScript compartidos.  
**Funcionalidad:** Interfaces y tipos comunes usados en todo el backend.

---

### 📂 `/backend/src/lib/` - Librerías

#### 📄 `redis.ts`
**Descripción:** Cliente Redis para caché.  
**Funcionalidad:** Configuración y utilidades para usar Redis como caché.

#### 📄 `webhooks.ts`
**Descripción:** Utilidades para webhooks.  
**Funcionalidad:** Verificación de firmas HMAC, parsing de eventos.

---

### 📂 `/backend/src/middleware/` - Middleware

#### 📄 `monitoring.ts`
**Descripción:** Middleware de monitoreo.  
**Funcionalidad:** Integración con Sentry (error tracking) y DataDog (APM), tracking de requests.

---

### 📂 `/backend/src/config/` - Configuración

#### 📄 `performance.ts`
**Descripción:** Configuración de rendimiento.  
**Funcionalidad:** Aplicación de índices de base de datos, optimizaciones de queries.

---

### 📂 `/backend/src/db/` - Base de Datos

#### 📄 `schema.sql`
**Descripción:** Schema SQL inicial (legacy).  
**Funcionalidad:** Definición de tablas (ahora se usa migraciones).

---

### 📂 `/backend/migrations/` - Migraciones de Base de Datos

#### 📄 `1701960000000_create-initial-schema.js`
**Descripción:** Migración inicial que crea el schema base.  
**Funcionalidad:** Crea tablas principales: restaurants, menus, categories, menu_items, users, orders, etc.

#### 📄 `1701960001000_add-restaurants-menus-users.js`
**Descripción:** Agrega tablas de restaurantes, menús y usuarios.  
**Funcionalidad:** Extiende el schema con tablas relacionadas.

#### 📄 `1701960002000_add-kitchen-tickets.js`
**Descripción:** Agrega soporte para tickets de cocina.  
**Funcionalidad:** Crea tablas para kitchen_tickets y kitchen_ticket_items.

#### 📄 `1701960003000_add-printer-discovery.js`
**Descripción:** Agrega soporte para descubrimiento de impresoras.  
**Funcionalidad:** Crea tablas para printers y printer_discovery.

#### 📄 `1701960004000_add-inventory-system.js`
**Descripción:** Agrega sistema de inventario completo.  
**Funcionalidad:** Crea tablas para inventory_items, stock_movements, suppliers, purchase_orders.

#### 📄 `1701960005000_add-restaurant-config.js`
**Descripción:** Agrega configuración de restaurantes.  
**Funcionalidad:** Crea tablas para restaurant_config y settings.

#### 📄 `1701960006000_add-check-requested.js`
**Descripción:** Agrega funcionalidad de "check requested".  
**Funcionalidad:** Agrega campos y tablas para solicitar la cuenta.

#### 📄 `1701960007000_add-advanced-costing-system.js`
**Descripción:** Agrega sistema de costeo avanzado.  
**Funcionalidad:** Crea tablas para menu_costs, cost_breakdown, etc.

#### 📄 `1701960008000_add-dynamic-pricing-system.js`
**Descripción:** Agrega sistema de precios dinámicos.  
**Funcionalidad:** Crea tablas para dynamic_pricing_rules y price_adjustments.

#### 📄 `1701970000000_restructure-to-aldelo-spec.js`
**Descripción:** Reestructuración según especificación Aldelo.  
**Funcionalidad:** Reorganiza tablas y campos según estándares de Aldelo.

#### 📄 `1701970001000_add-product-ingredients-additions.js`
**Descripción:** Agrega soporte para ingredientes y adiciones.  
**Funcionalidad:** Agrega campos `metadata` a menu_items y `customizations` a order_items para personalización.

---

### 📂 `/backend/scripts/` - Scripts de Utilidad

#### 📄 `seed.ts`
**Descripción:** Script de seed básico.  
**Funcionalidad:** Pobla la base de datos con datos de prueba básicos.

#### 📄 `seed-complete.ts`
**Descripción:** Script de seed completo.  
**Funcionalidad:** Pobla la base de datos con datos completos: restaurantes, menús, categorías, productos, usuarios, incluyendo categoría "Adiciones".

#### 📄 `create-kitchen-bar-users.ts`
**Descripción:** Crea usuarios específicos para cocina y bar.  
**Funcionalidad:** Genera usuarios con roles `kitchen` y `bartender`.

#### 📄 `fix-adiciones-category.ts`
**Descripción:** Script para corregir la categoría "Adiciones".  
**Funcionalidad:** Asegura que la categoría "Adiciones" exista y esté correctamente asociada al menú activo.

#### 📄 `validate-env.ts`
**Descripción:** Valida variables de entorno.  
**Funcionalidad:** Verifica que todas las variables de entorno requeridas estén configuradas.

#### 📄 `init-env.sh`
**Descripción:** Script bash para inicializar variables de entorno.  
**Funcionalidad:** Crea archivo `.env` con valores por defecto.

#### 📄 `diagnose-tables.sql`
**Descripción:** Script SQL de diagnóstico.  
**Funcionalidad:** Queries útiles para diagnosticar problemas con mesas.

---

### 📂 `/backend/tests/` - Tests

#### 📂 `e2e/`
**Descripción:** Tests end-to-end con Playwright.  
**Archivos:**
- `playwright.config.ts` - Configuración de Playwright
- `auth.spec.ts` - Tests de autenticación
- `orders.spec.ts` - Tests de órdenes

---

## 📁 Estructura de Archivos - Frontend

### 📂 `/frontend/` - Directorio Principal

#### 📄 `package.json`
**Descripción:** Configuración de dependencias y scripts del frontend.  
**Funcionalidad:** Define scripts para desarrollo (`dev`), build (`build`), preview (`preview`), y lint (`lint`).

#### 📄 `vite.config.ts`
**Descripción:** Configuración de Vite.  
**Funcionalidad:** Configura el servidor de desarrollo, proxy para API, y opciones de build.

#### 📄 `tsconfig.json`
**Descripción:** Configuración de TypeScript para el frontend.  
**Funcionalidad:** Define opciones de compilación y paths.

#### 📄 `tailwind.config.js`
**Descripción:** Configuración de Tailwind CSS.  
**Funcionalidad:** Define temas, colores, y utilidades personalizadas.

#### 📄 `Dockerfile`
**Descripción:** Configuración de Docker para el frontend.  
**Funcionalidad:** Define la imagen base y proceso de build para producción.

---

### 📂 `/frontend/src/` - Código Fuente

#### 📄 `main.tsx`
**Descripción:** Punto de entrada de la aplicación React.  
**Funcionalidad:** Renderiza la aplicación en el DOM, configura providers globales.

#### 📄 `App.tsx`
**Descripción:** Componente principal de la aplicación.  
**Funcionalidad:** 
- Configura React Router
- Define todas las rutas de la aplicación
- Protege rutas con autenticación
- Aplica redirecciones basadas en roles
- Envuelve la app con providers (Auth, Stripe)

#### 📄 `index.css`
**Descripción:** Estilos globales.  
**Funcionalidad:** Importa Tailwind CSS y define estilos base.

---

### 📂 `/frontend/src/components/` - Componentes Reutilizables

#### 📄 `AppLayout.tsx`
**Descripción:** Layout principal de la aplicación.  
**Funcionalidad:** 
- Sidebar de navegación
- Barra superior con usuario y hora
- Menú contextual según rol del usuario
- Manejo de navegación y rutas activas

#### 📄 `ProtectedRoute.tsx`
**Descripción:** Componente para proteger rutas.  
**Funcionalidad:** Verifica autenticación antes de renderizar rutas protegidas.

#### 📄 `RoleProtectedRoute.tsx`
**Descripción:** Componente para proteger rutas por rol.  
**Funcionalidad:** Verifica que el usuario tenga el rol requerido para acceder a una ruta.

#### 📄 `RoleBasedRedirect.tsx`
**Descripción:** Redirección basada en rol.  
**Funcionalidad:** Redirige a los usuarios a su página de inicio según su rol (waiter → orders, cashier → cashier, etc.).

#### 📄 `StripeProviderWrapper.tsx`
**Descripción:** Wrapper para Stripe Elements.  
**Funcionalidad:** Proporciona el contexto de Stripe a toda la aplicación.

#### 📄 `StripeCardForm.tsx`
**Descripción:** Formulario de tarjeta de Stripe.  
**Funcionalidad:** Componente para capturar datos de tarjeta usando Stripe Elements de forma segura.

#### 📄 `ProductCustomizationModal.tsx`
**Descripción:** Modal para personalizar productos.  
**Funcionalidad:** Permite seleccionar ingredientes y agregar adiciones antes de agregar al carrito.

#### 📄 `IngredientSelectorModal.tsx`
**Descripción:** Modal para seleccionar ingredientes con IA.  
**Funcionalidad:** Usa el analizador de ingredientes para sugerir ingredientes y permite confirmar/modificar.

---

### 📂 `/frontend/src/pages/` - Páginas de la Aplicación

#### 📄 `LoginPage.tsx`
**Descripción:** Página de inicio de sesión.  
**Funcionalidad:** Formulario de login, manejo de errores, redirección post-login.

#### 📄 `DashboardPage.tsx`
**Descripción:** Dashboard principal.  
**Funcionalidad:** Muestra estadísticas, métricas, resumen de ventas, mesas ocupadas.

#### 📄 `OrdersPage.tsx`
**Descripción:** Lista de órdenes.  
**Funcionalidad:** Muestra todas las órdenes con filtros por estado, búsqueda, y paginación.

#### 📄 `CreateOrderPage.tsx`
**Descripción:** Página para crear órdenes.  
**Funcionalidad:** 
- Selección de mesa
- Navegación por categorías y productos
- Carrito de compras
- Personalización de productos (ingredientes y adiciones)
- Cálculo de totales
- Envío a cocina

#### 📄 `OrderDetailPage.tsx`
**Descripción:** Detalles de una orden específica.  
**Funcionalidad:** Muestra información completa de la orden, items, pagos, y permite actualizar estado.

#### 📄 `ProcessPaymentPage.tsx`
**Descripción:** Página para procesar pagos.  
**Funcionalidad:** 
- Selección de método de pago
- Formulario de tarjeta (Stripe)
- Gestión de propinas
- Procesamiento de pago
- Confirmación

#### 📄 `PaymentsPage.tsx`
**Descripción:** Historial de pagos.  
**Funcionalidad:** Lista todos los pagos procesados con filtros y detalles.

#### 📄 `KitchenPage.tsx`
**Descripción:** Vista de cocina (KDS).  
**Funcionalidad:** 
- Muestra órdenes activas en cocina
- Estados de preparación
- Marcar items como preparados
- Tickets de cocina

#### 📄 `ServedOrdersPage.tsx`
**Descripción:** Órdenes servidas.  
**Funcionalidad:** Lista órdenes que ya fueron servidas.

#### 📄 `BarPage.tsx`
**Descripción:** Vista de bar.  
**Funcionalidad:** Similar a KitchenPage pero para órdenes de bar.

#### 📄 `CashierPage.tsx`
**Descripción:** Vista de cajero.  
**Funcionalidad:** Interfaz optimizada para cajeros con acceso rápido a pagos y órdenes pendientes.

#### 📄 `ManageMenuPage.tsx`
**Descripción:** Gestión de menús.  
**Funcionalidad:** 
- CRUD de categorías
- CRUD de items de menú
- Análisis de ingredientes con IA
- Configuración de precios y disponibilidad

#### 📄 `MenuPage.tsx`
**Descripción:** Visualización de menú (público).  
**Funcionalidad:** Muestra el menú de forma visual para clientes.

#### 📄 `TablesPage.tsx`
**Descripción:** Gestión de mesas.  
**Funcionalidad:** Lista todas las mesas, permite crear/editar, ver estados.

#### 📄 `TablePage.tsx`
**Descripción:** Detalles de una mesa.  
**Funcionalidad:** Muestra información de la mesa, órdenes asociadas, estado.

#### 📄 `InventoryPage.tsx`
**Descripción:** Lista de inventario.  
**Funcionalidad:** Muestra todos los items de inventario con stock actual.

#### 📄 `InventoryItemPage.tsx`
**Descripción:** Detalles de un item de inventario.  
**Funcionalidad:** Muestra información del item, historial de movimientos, ajustes.

#### 📄 `CreateInventoryItemPage.tsx`
**Descripción:** Crear item de inventario.  
**Funcionalidad:** Formulario para crear nuevos items de inventario.

#### 📄 `AdjustStockPage.tsx`
**Descripción:** Ajustar stock.  
**Funcionalidad:** Permite hacer ajustes de inventario (entradas/salidas).

#### 📄 `StockAlertsPage.tsx`
**Descripción:** Alertas de stock.  
**Funcionalidad:** Muestra items con stock bajo o crítico.

#### 📄 `SuppliersPage.tsx`
**Descripción:** Lista de proveedores.  
**Funcionalidad:** CRUD de proveedores.

#### 📄 `SupplierPage.tsx`
**Descripción:** Detalles de proveedor.  
**Funcionalidad:** Información del proveedor y órdenes de compra asociadas.

#### 📄 `CreateSupplierPage.tsx`
**Descripción:** Crear proveedor.  
**Funcionalidad:** Formulario para crear nuevos proveedores.

#### 📄 `PurchaseOrdersPage.tsx`
**Descripción:** Lista de órdenes de compra.  
**Funcionalidad:** Muestra todas las órdenes de compra con estados.

#### 📄 `PurchaseOrderPage.tsx`
**Descripción:** Detalles de orden de compra.  
**Funcionalidad:** Información completa de la orden de compra, items, recepción.

#### 📄 `CreatePurchaseOrderPage.tsx`
**Descripción:** Crear orden de compra.  
**Funcionalidad:** Formulario para crear nuevas órdenes de compra.

#### 📄 `UsersPage.tsx`
**Descripción:** Lista de usuarios.  
**Funcionalidad:** CRUD de usuarios, asignación de roles.

#### 📄 `UserPage.tsx`
**Descripción:** Detalles de usuario.  
**Funcionalidad:** Información del usuario, edición de datos y roles.

#### 📄 `CreateUserPage.tsx`
**Descripción:** Crear usuario.  
**Funcionalidad:** Formulario para crear nuevos usuarios.

#### 📄 `MenuCostsPage.tsx`
**Descripción:** Análisis de costos de menú.  
**Funcionalidad:** Muestra costos de items, rentabilidad, y permite actualizar precios.

---

### 📂 `/frontend/src/services/` - Servicios de API

#### 📄 `api-client.ts`
**Descripción:** Cliente HTTP base.  
**Funcionalidad:** Configuración de Axios, interceptores, manejo de errores, y autenticación.

#### 📄 `auth-service.ts`
**Descripción:** Servicio de autenticación.  
**Funcionalidad:** Login, logout, verificación de token, gestión de sesión.

#### 📄 `order-service.ts`
**Descripción:** Servicio de órdenes.  
**Funcionalidad:** CRUD de órdenes, agregar items, actualizar estados.

#### 📄 `payment-service.ts`
**Descripción:** Servicio de pagos.  
**Funcionalidad:** Procesar pagos, reembolsos, obtener métodos de pago.

#### 📄 `menu-service.ts`
**Descripción:** Servicio de menús.  
**Funcionalidad:** Obtener menús, crear/actualizar items, gestionar categorías.

#### 📄 `table-service.ts`
**Descripción:** Servicio de mesas.  
**Funcionalidad:** CRUD de mesas, actualizar estados.

#### 📄 `inventory-service.ts`
**Descripción:** Servicio de inventario.  
**Funcionalidad:** CRUD de items de inventario, ajustes de stock, alertas.

#### 📄 `purchase-service.ts`
**Descripción:** Servicio de órdenes de compra.  
**Funcionalidad:** CRUD de órdenes de compra, proveedores, recepción.

#### 📄 `user-service.ts`
**Descripción:** Servicio de usuarios.  
**Funcionalidad:** CRUD de usuarios, gestión de roles.

#### 📄 `cashier-service.ts`
**Descripción:** Servicio de cajero.  
**Funcionalidad:** Órdenes pendientes, procesar pagos rápidos.

#### 📄 `dashboard-service.ts`
**Descripción:** Servicio de dashboard.  
**Funcionalidad:** Obtener estadísticas y métricas.

#### 📄 `menu-costs-service.ts`
**Descripción:** Servicio de costos de menú.  
**Funcionalidad:** Calcular costos, actualizar precios.

#### 📄 `advanced-costing-service.ts`
**Descripción:** Servicio de costeo avanzado.  
**Funcionalidad:** Análisis detallado de costos.

#### 📄 `dynamic-pricing-service.ts`
**Descripción:** Servicio de precios dinámicos.  
**Funcionalidad:** Ajustar precios basados en reglas.

#### 📄 `ai-analysis-service.ts`
**Descripción:** Servicio de análisis con IA.  
**Funcionalidad:** Análisis de ingredientes, sugerencias.

#### 📄 `ingredient-analyzer.ts`
**Descripción:** Analizador de ingredientes (cliente).  
**Funcionalidad:** Parsea descripciones de productos para identificar ingredientes individuales usando lógica inteligente.

---

### 📂 `/frontend/src/domains/` - Servicios por Dominio

#### 📂 `orders/service.ts`
**Descripción:** Servicio del dominio de órdenes.  
**Funcionalidad:** Lógica específica del dominio de órdenes.

#### 📂 `payments/service.ts`
**Descripción:** Servicio del dominio de pagos.  
**Funcionalidad:** Lógica específica del dominio de pagos.

#### 📂 `products/service.ts`
**Descripción:** Servicio del dominio de productos.  
**Funcionalidad:** Lógica específica del dominio de productos.

#### 📂 `tables/service.ts`
**Descripción:** Servicio del dominio de mesas.  
**Funcionalidad:** Lógica específica del dominio de mesas.

#### 📂 `kitchen/service.ts`
**Descripción:** Servicio del dominio de cocina.  
**Funcionalidad:** Lógica específica del dominio de cocina.

#### 📂 `bar/service.ts`
**Descripción:** Servicio del dominio de bar.  
**Funcionalidad:** Lógica específica del dominio de bar.

---

### 📂 `/frontend/src/contexts/` - Contextos React

#### 📄 `auth-context.tsx`
**Descripción:** Contexto de autenticación.  
**Funcionalidad:** Proporciona estado de autenticación (usuario, loading, error) y métodos (login, logout) a toda la aplicación.

---

### 📂 `/frontend/src/lib/` - Librerías

#### 📄 `api-client.ts`
**Descripción:** Cliente API alternativo.  
**Funcionalidad:** Configuración adicional de API si es necesaria.

---

### 📂 `/frontend/src/utils/` - Utilidades

#### 📄 `api-config.ts`
**Descripción:** Configuración de API.  
**Funcionalidad:** Determina la URL base de la API según el entorno (desarrollo/producción, red local).

---

## 🗄️ Base de Datos y Migraciones

### Tablas Principales

- **restaurants**: Información de restaurantes
- **menus**: Menús de restaurantes
- **menu_categories**: Categorías de productos
- **menu_items**: Items del menú con precios y descripciones
- **users**: Usuarios del sistema con roles
- **tables**: Mesas del restaurante
- **orders**: Órdenes de clientes
- **order_items**: Items dentro de órdenes
- **order_item_modifiers**: Modificadores (adiciones/exclusiones) de items
- **payment_transactions**: Transacciones de pago
- **payment_refunds**: Reembolsos
- **inventory_items**: Items de inventario
- **stock_movements**: Movimientos de stock
- **suppliers**: Proveedores
- **purchase_orders**: Órdenes de compra
- **kitchen_tickets**: Tickets de cocina
- **printers**: Impresoras registradas

### Sistema de Migraciones

El sistema usa **node-pg-migrate** para gestionar cambios en la base de datos. Las migraciones están numeradas con timestamps y se ejecutan en orden.

**Comandos:**
- `npm run migrate:up` - Aplicar migraciones pendientes
- `npm run migrate:down` - Revertir última migración
- `npm run migrate:reset` - Resetear base de datos (down + up)

---

## ⚙️ Configuración y Despliegue

### Variables de Entorno

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
SQUARE_ACCESS_TOKEN=...
MERCADOPAGO_ACCESS_TOKEN=...
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Scripts de Inicio

**Desarrollo:**
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

**Producción:**
```bash
# Backend
cd backend && npm run build && npm start
# O con PM2
pm2 start ecosystem.config.js

# Frontend
cd frontend && npm run build
# Servir con Nginx o servidor estático
```

### Docker

```bash
# Iniciar todo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## 📊 Resumen de Tecnologías

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **Caché**: Redis
- **Tiempo Real**: Socket.io
- **Autenticación**: JWT
- **Documentación**: Swagger/OpenAPI
- **Monitoreo**: Sentry, DataDog (opcional)

### Frontend
- **Framework**: React 18
- **Lenguaje**: TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Notificaciones**: Sonner
- **Pagos**: Stripe Elements

### Infraestructura
- **Contenedores**: Docker
- **Orquestación**: Docker Compose
- **Proceso Manager**: PM2
- **Proxy**: Nginx

---

## 🎯 Características Destacadas

### Seguridad
- ✅ Autenticación JWT
- ✅ Verificación HMAC para webhooks
- ✅ Helmet.js para headers de seguridad
- ✅ CORS configurado
- ✅ Filtrado de datos sensibles en logs

### Performance
- ✅ Redis caching
- ✅ Índices de base de datos optimizados
- ✅ Optimización de queries
- ✅ Claves de idempotencia
- ✅ Retry logic con exponential backoff

### UX/UI
- ✅ Diseño responsive
- ✅ Touch-friendly (botones 44px+)
- ✅ Estados de carga
- ✅ Manejo de errores
- ✅ Notificaciones toast
- ✅ Feedback visual

### Testing
- ✅ Tests E2E con Playwright
- ✅ Load testing con k6
- ✅ Scripts de test configurados

---

## 📚 Documentación Adicional

- `BACKEND_COMPLETE.md` - Guía completa del backend
- `INICIAR-BACKEND-SERVIDOR.md` - Cómo iniciar el backend en servidor
- `EJECUTAR-SEED.md` - Cómo ejecutar el seed de datos
- `IMPLEMENTACION-COMPLETA.md` - Resumen de implementación
- `docs/PAYMENT_FLOW.md` - Flujo de pagos detallado
- `docs/WEBHOOK_TESTING.md` - Guía de testing de webhooks
- `docs/ARCHITECTURE.md` - Arquitectura del sistema

---

**✅ Sistema Completo y Documentado - Listo para Producción**


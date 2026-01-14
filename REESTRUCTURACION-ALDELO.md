# Reestructuración del Sistema POS - Especificación ALDELO

## 🎯 Objetivo

Reestructurar el sistema POS siguiendo exactamente las especificaciones del prompt, garantizando:
- **Single Source of Truth (SSOT)**: Este prompt es la única fuente de verdad
- **Idempotencia Total**: Toda acción puede repetirse sin duplicar datos
- **Touchscreen-First**: Diseño 100% táctil
- **Responsive Absoluto**: Funciona en POS, tablets y móviles

## 🧱 Arquitectura Modular por Dominios

### Estructura de Directorios

```
backend/src/
├── domains/
│   ├── orders/          # Dominio: Órdenes
│   │   ├── routes.ts    # Endpoints del dominio
│   │   ├── service.ts   # Lógica de negocio
│   │   ├── types.ts     # Interfaces y tipos
│   │   └── validators.ts # Validaciones
│   ├── tables/          # Dominio: Mesas
│   ├── products/        # Dominio: Productos y Menú
│   ├── kitchen/         # Dominio: KDS (Kitchen Display System)
│   ├── payments/        # Dominio: Pagos
│   ├── users/           # Dominio: Usuarios y Roles
│   ├── reports/         # Dominio: Reportes
│   └── settings/        # Dominio: Configuración
├── shared/
│   ├── db.ts           # Pool de conexiones compartido
│   ├── events.ts       # Sistema de eventos entre dominios
│   └── types.ts        # Tipos compartidos
└── index.ts            # Punto de entrada (registra dominios)
```

## 📊 Modelo de Datos (NO ALTERAR)

### User
- `id`, `name`, `role(waiter,cashier,admin,kitchen)`, `active`

### Table
- `id`, `name`, `capacity`, `status(free,occupied,reserved)`

### Order
- `id`, `table_id`, `waiter_id`, `status(draft,sent_to_kitchen,served,closed,cancelled)`, `subtotal`, `tax`, `total`, `created_at`

### OrderItem
- `id`, `order_id`, `product_id`, `quantity`, `price_snapshot`, `status(pending,sent,prepared,served)`

### Product
- `id`, `name`, `category_id`, `base_price`, `active`

### Modifier
- `id`, `name`, `price_delta`

### Payment
- `id`, `order_id`, `method(cash,card,split)`, `amount`, `status(pending,completed)`

## 🔄 Flujos Obligatorios

### 1. Crear Orden (Idempotente)
```
1. Seleccionar mesa
2. Verificar si existe orden activa (draft/sent_to_kitchen/served) → retornar existente
3. Si no existe → crear orden draft
4. Una mesa = una orden activa (IDEMPOTENTE)
```

### 2. Agregar Productos
```
1. Validar orden existe y está en draft
2. Crear OrderItem con price_snapshot
3. Recalcular subtotal, tax, total
4. Retornar orden actualizada
```

### 3. Enviar a Cocina
```
1. Validar orden existe y está en draft
2. Cambiar status → sent_to_kitchen
3. Cambiar todos order_items.status → sent
4. Emitir evento a KDS (NO reenviar si ya fue enviado)
5. Retornar orden actualizada
```

### 4. Cocina (KDS)
```
1. Solo mostrar order_items con status = 'sent'
2. Marcar prepared → order_item.status = 'prepared'
3. Emitir evento a waiter cuando todo está prepared
```

### 5. Servir
```
1. Validar que todos los order_items están 'prepared' o 'served'
2. Marcar order_items → served
3. Cambiar order.status → served
```

### 6. Cerrar Orden
```
1. Validar que todos los order_items están 'served'
2. Validar que existe payment con status = 'completed'
3. Cambiar order.status → closed
4. Cambiar table.status → free
```

## ✅ Reglas de Idempotencia

1. **Una mesa = una orden activa**: Al crear orden, verificar si ya existe orden activa en la mesa
2. **No reenviar a cocina**: Si order.status ya es 'sent_to_kitchen', no cambiar
3. **Price snapshot**: Siempre congelar precio al crear OrderItem
4. **Estado final**: Una vez 'closed' o 'cancelled', no puede cambiar

## 🚀 Fases de Implementación

### Fase 1: Core POS ✅
- [x] Migración de base de datos
- [ ] Dominio: Tables
- [ ] Dominio: Orders (con idempotencia)
- [ ] Dominio: Products
- [ ] Flujo: Crear orden, agregar productos

### Fase 2: Cocina (KDS)
- [ ] Dominio: Kitchen
- [ ] Endpoint: GET /kitchen/active-items
- [ ] Endpoint: PATCH /kitchen/items/:id/prepare
- [ ] WebSocket para actualizaciones en tiempo real

### Fase 3: Pagos y Caja
- [ ] Dominio: Payments
- [ ] Integración con método cash/card/split
- [ ] Cerrar orden después de pago

### Fase 4: Reportes
- [ ] Dominio: Reports
- [ ] Dashboard de ventas
- [ ] Reportes por período

### Fase 5: IA (Opcional)
- [ ] Análisis predictivo
- [ ] Sugerencias de precios

## 🎨 UI/UX Reglas

- Botones grandes (≥44px)
- Estados por color
- Flujo máximo 3 taps
- Sin modales pequeños
- Jerarquía clara en pantallas pequeñas
- Touchscreen-first (no hover)

## 🚫 Prohibido

- ❌ Romper idempotencia
- ❌ Duplicar órdenes
- ❌ Desktop-first UI
- ❌ Acceso directo entre módulos (usar eventos)
- ❌ Inventar estados o flujos

## ✅ Criterio de Éxito

- ✅ Usable sin entrenamiento
- ✅ Funciona en tablet 8"
- ✅ Estable en hora pico
- ✅ UX superior a ALDELO







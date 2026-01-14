# 📦 Sistema de Inventario, Compras y Usuarios

## 📋 Resumen

Sistema completo para gestionar:
- **Inventario**: Productos, stock, movimientos, alertas
- **Compras**: Proveedores, órdenes de compra, recepciones
- **Usuarios**: CRUD completo, roles, permisos

## 🗂️ Inventario

### Funcionalidades

- ✅ Gestión de productos/ingredientes
- ✅ Control de stock (mínimo, máximo, punto de reorden)
- ✅ Movimientos de inventario (compras, ventas, ajustes, desperdicios)
- ✅ Alertas de stock bajo
- ✅ Historial completo de movimientos
- ✅ Integración con órdenes de compra

### Endpoints

#### Items de Inventario

```bash
# Listar items
GET /api/v1/inventory?category=ingredientes&lowStock=true

# Obtener item
GET /api/v1/inventory/:id

# Crear item
POST /api/v1/inventory
{
  "name": "Tomate",
  "sku": "TOM-001",
  "category": "Vegetales",
  "unit": "kg",
  "currentStock": 10,
  "minStock": 5,
  "reorderPoint": 7,
  "costPerUnit": 2.50,
  "supplierId": "...",
  "location": "cocina"
}

# Actualizar item
PUT /api/v1/inventory/:id

# Ajustar stock
POST /api/v1/inventory/:id/adjust
{
  "quantity": 5,
  "type": "purchase", // purchase, sale, adjustment, transfer, waste, return
  "unitCost": 2.50,
  "notes": "Compra de proveedor"
}

# Obtener alertas de stock
GET /api/v1/inventory/alerts/stock

# Obtener movimientos
GET /api/v1/inventory/:id/movements?type=purchase&startDate=2024-01-01
```

### Tipos de Movimientos

- **purchase**: Entrada por compra
- **sale**: Salida por venta
- **adjustment**: Ajuste manual
- **transfer**: Transferencia entre ubicaciones
- **waste**: Desperdicio/pérdida
- **return**: Devolución

## 🛒 Compras

### Funcionalidades

- ✅ Gestión de proveedores
- ✅ Órdenes de compra (PO)
- ✅ Recepción de mercancía
- ✅ Actualización automática de inventario
- ✅ Tracking de recepciones parciales

### Endpoints

#### Proveedores

```bash
# Listar proveedores
GET /api/v1/purchases/suppliers?activeOnly=true

# Obtener proveedor
GET /api/v1/purchases/suppliers/:id

# Crear proveedor
POST /api/v1/purchases/suppliers
{
  "name": "Proveedor ABC",
  "contactName": "Juan Pérez",
  "email": "contacto@proveedor.com",
  "phone": "+1234567890",
  "address": "Calle 123",
  "taxId": "123456789",
  "paymentTerms": "Net 30"
}

# Actualizar proveedor
PUT /api/v1/purchases/suppliers/:id
```

#### Órdenes de Compra

```bash
# Listar órdenes
GET /api/v1/purchases/orders?status=received&supplierId=...

# Obtener orden
GET /api/v1/purchases/orders/:id

# Crear orden
POST /api/v1/purchases/orders
{
  "supplierId": "...",
  "items": [
    {
      "inventoryItemId": "...",
      "name": "Tomate",
      "quantity": 20,
      "unit": "kg",
      "unitCost": 2.50
    }
  ],
  "expectedDeliveryDate": "2024-01-20",
  "notes": "Urgente"
}

# Actualizar estado
PUT /api/v1/purchases/orders/:id/status
{
  "status": "sent" // draft, sent, confirmed, received, cancelled
}

# Recibir orden (actualiza inventario)
POST /api/v1/purchases/orders/:id/receive
{
  "receivedItems": [
    {
      "itemId": "...",
      "receivedQuantity": 20
    }
  ]
}
```

### Estados de Orden de Compra

- **draft**: Borrador
- **sent**: Enviada al proveedor
- **confirmed**: Confirmada por proveedor
- **received**: Recibida (inventario actualizado)
- **cancelled**: Cancelada

## 👥 Usuarios

### Funcionalidades

- ✅ CRUD completo de usuarios
- ✅ Roles: admin, manager, cashier, waiter
- ✅ Permisos personalizados (JSONB)
- ✅ Cambio de contraseña
- ✅ Gestión de estado activo/inactivo

### Endpoints

```bash
# Listar usuarios (admin/manager)
GET /api/v1/auth/users?active=true&role=waiter

# Obtener usuario
GET /api/v1/auth/users/:id

# Crear usuario (admin/manager)
POST /api/v1/auth/register
{
  "email": "usuario@restaurant.com",
  "password": "password123",
  "name": "Juan Pérez",
  "role": "waiter",
  "phone": "+1234567890",
  "permissions": {
    "canCreateOrders": true,
    "canProcessPayments": false
  }
}

# Actualizar usuario
PUT /api/v1/auth/users/:id
{
  "name": "Juan Pérez",
  "phone": "+1234567890",
  "active": true
}

# Cambiar contraseña
PUT /api/v1/auth/users/:id/password
{
  "currentPassword": "oldpass", // Solo si es propio
  "newPassword": "newpass123"
}
```

### Roles

- **admin**: Acceso total, puede gestionar usuarios
- **manager**: Puede gestionar usuarios (excepto otros managers/admins)
- **cashier**: Procesar pagos, ver órdenes
- **waiter**: Crear órdenes, ver menú

### Permisos Personalizados

Los permisos se almacenan como JSONB y pueden incluir:

```json
{
  "canCreateOrders": true,
  "canProcessPayments": true,
  "canViewReports": false,
  "canManageInventory": true,
  "canManageSuppliers": false
}
```

## 🔄 Flujos de Trabajo

### Flujo de Compra → Inventario

1. **Crear Orden de Compra** → `POST /api/v1/purchases/orders`
2. **Enviar al Proveedor** → `PUT /api/v1/purchases/orders/:id/status` (status: "sent")
3. **Recibir Mercancía** → `POST /api/v1/purchases/orders/:id/receive`
4. **Inventario Actualizado** → Automáticamente se crea movimiento y actualiza stock

### Flujo de Ajuste de Stock

1. **Ajustar Stock** → `POST /api/v1/inventory/:id/adjust`
2. **Movimiento Registrado** → Se guarda en `inventory_movements`
3. **Stock Actualizado** → `current_stock` se actualiza automáticamente

### Flujo de Alertas

1. **Stock Bajo** → `GET /api/v1/inventory/alerts/stock`
2. **Crear Orden de Compra** → Para reponer stock
3. **Recibir Mercancía** → Stock restaurado

## 📊 Base de Datos

### Tablas Creadas

- `suppliers` - Proveedores
- `inventory_items` - Productos/ingredientes
- `inventory_movements` - Movimientos de stock
- `purchase_orders` - Órdenes de compra
- `purchase_order_items` - Items de órdenes de compra
- `menu_item_ingredients` - Relación menú ↔ inventario

### Campos Agregados a `users`

- `phone` - Teléfono
- `avatar_url` - URL de avatar
- `permissions` - Permisos personalizados (JSONB)

## 🚀 Ejecutar Migración

```bash
cd backend
npm run migrate:up
```

## 📝 Ejemplos de Uso

### Crear Item y Ajustar Stock

```bash
# 1. Crear item
POST /api/v1/inventory
{
  "name": "Aceite de Oliva",
  "unit": "liter",
  "currentStock": 0,
  "minStock": 5,
  "reorderPoint": 10,
  "costPerUnit": 8.50
}

# 2. Ajustar stock (compra inicial)
POST /api/v1/inventory/:id/adjust
{
  "quantity": 20,
  "type": "purchase",
  "unitCost": 8.50,
  "notes": "Compra inicial"
}
```

### Crear Orden de Compra y Recibir

```bash
# 1. Crear orden
POST /api/v1/purchases/orders
{
  "supplierId": "supplier-id",
  "items": [
    {
      "inventoryItemId": "item-id",
      "name": "Aceite de Oliva",
      "quantity": 30,
      "unit": "liter",
      "unitCost": 8.50
    }
  ]
}

# 2. Recibir (actualiza inventario automáticamente)
POST /api/v1/purchases/orders/:id/receive
{
  "receivedItems": [
    {
      "itemId": "po-item-id",
      "receivedQuantity": 30
    }
  ]
}
```

## 🔐 Seguridad

- Todas las rutas requieren autenticación JWT
- Roles y permisos controlan acceso
- Solo admins pueden cambiar roles
- Usuarios pueden cambiar su propia contraseña

## 📚 Referencias

- Ver `README.md` para configuración general
- Ver `README-MIGRATIONS.md` para migraciones
- Ver Swagger UI en `/api/docs` para documentación completa









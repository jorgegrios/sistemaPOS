# Fix Table Status Inconsistency Between Pages

**Fecha**: 2026-01-24  
**Tipo**: Bugfix  
**Componentes**: Frontend (CashierPage, CreateOrderPage)

## 🐛 Problem

Mesa B1 mostraba estados diferentes en dos pantallas:
- **Pantalla de Pagos (CashierPage)**: "Disponible" (⚪)
- **Pantalla de Pedidos (CreateOrderPage)**: "Con Orden" (🟢)

## 🔍 Root Cause

Las dos páginas usaban diferentes lógicas para determinar el estado de las mesas:

### CreateOrderPage
- Solo verificaba `table.activeOrderId` del backend
- Mostraba "Con Orden" si `activeOrderId` existe

### CashierPage  
- Verificaba `table.status` de BD + `table.isActive` + `table.orders`
- **NO verificaba** `activeOrderId`

Esto causaba inconsistencias cuando una mesa tenía `activeOrderId` pero `isActive` era `false` o `orders` estaba vacío.

## ✅ Solution Implemented

### 1. CashierPage - Unified Logic

**File**: `frontend/src/pages/CashierPage.tsx`

Actualizado `getTableStatus()` para también verificar `activeOrderId`:

```typescript
const getTableStatus = (table: any): TableStatus => {
  // 1. Use DB status if it's special
  if (table.status === 'paid') return 'paid';
  if (table.status === 'dirty') return 'dirty';
  if (table.status === 'reserved') return 'reserved';

  // 2. Check if table has active order (unified logic with CreateOrderPage)
  const hasActiveOrderId = table.activeOrderId &&
    typeof table.activeOrderId === 'string' &&
    table.activeOrderId.trim() !== '';

  // Logic for occupied tables
  if (hasActiveOrderId || (table.isActive && table.orders && table.orders.length > 0)) {
    const hasServedOrder = table.orders?.some((o: any) =>
      o.orderStatus === 'served' ||
      (o.servedCount !== undefined && o.itemCount > 0 && o.servedCount === o.itemCount)
    );
    const hasCheckRequested = table.orders?.some((o: any) => o.checkRequestedAt);

    if (hasServedOrder || hasCheckRequested) return 'ready_to_pay';
    return 'active';
  }

  return 'available';
};
```

### 2. CreateOrderPage - Visual Indicators

**File**: `frontend/src/pages/CreateOrderPage.tsx`

Agregados indicadores visuales para estados especiales (paid, dirty, reserved).

## 📊 Estado Unificado

| Estado en BD | Emoji | Label | Color | Ambas Páginas |
|--------------|-------|-------|-------|---------------|
| `available` + sin orden | ⚪ | - | Gris | ✅ |
| Con `activeOrderId` | 🟢 | Con Orden | Verde | ✅ |
| `paid` | 💰 | Pagada | Azul | ✅ |
| `dirty` | 🧹 | Sucia | Naranja | ✅ |
| `reserved` | 🟡 | Reservada | Amarillo | ✅ |

## 🧪 Testing

1. **Crear orden**: Ambas páginas muestran 🟢 "Con Orden"
2. **Procesar pago**: Ambas páginas muestran 💰 "Pagada"
3. **Marcar sucia**: Ambas páginas muestran 🧹 "Sucia"
4. **Marcar disponible**: Ambas páginas muestran ⚪

## 🎯 Benefits

- ✅ Consistencia entre páginas
- ✅ Estados visuales claros
- ✅ Lógica unificada
- ✅ UX mejorada

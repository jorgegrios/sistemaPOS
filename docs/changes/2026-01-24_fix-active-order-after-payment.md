# Fix Active Order Logic After Payment

**Fecha**: 2026-01-24  
**Tipo**: Bugfix  
**Componentes**: Backend (Tables Service)

## 🐛 Problem

Después de pagar una orden, la mesa seguía mostrando "Con Orden" (🟢) en vez de "Pagada" (💰).

## 🔍 Root Cause

El método `getTablesWithOrders()` en `backend/src/domains/tables/service.ts` solo verificaba `order.status` pero NO verificaba `payment_status`.

Una orden podía estar en estado `'sent_to_kitchen'` pero con `payment_status = 'paid'`, causando que siguiera apareciendo como `activeOrderId`.

## ✅ Solution

**File**: `backend/src/domains/tables/service.ts`

Agregada condición `AND o.payment_status = 'pending'` en la query (línea 128):

```typescript
const ordersResult = await this.pool.query(
  `SELECT DISTINCT ON (o.table_id) o.id, o.table_id, o.status, o.total, o.created_at
   FROM orders o
   INNER JOIN order_items oi ON oi.order_id = o.id
   WHERE o.table_id IN (
     SELECT id FROM tables WHERE restaurant_id = $1
   )
   AND o.status = ANY(ARRAY['draft', 'sent_to_kitchen']::text[])
   AND o.payment_status = 'pending'  // ← AGREGADO
   ORDER BY o.table_id, o.created_at DESC`,
  [restaurantId]
);
```

## 📊 Behavior After Fix

| Escenario | Order Status | Payment Status | activeOrderId | Estado Mesa |
|-----------|--------------|----------------|---------------|-------------|
| Orden creada | draft | pending | ✅ Sí | 🟢 Con Orden |
| En cocina | sent_to_kitchen | pending | ✅ Sí | 🟢 Con Orden |
| **Pagada** | sent_to_kitchen | **paid** | ❌ **No** | 💰 **Pagada** |

## 🎯 Benefits

- ✅ Mesa pagada muestra estado correcto (💰 "Pagada")
- ✅ Nuevos productos después de pago crean orden nueva
- ✅ Flujo correcto: Libre → Con Orden → Pagada → Sucia → Libre

## 🧪 Testing

1. Crear orden y enviar a cocina → Mesa muestra 🟢 "Con Orden"
2. Procesar pago → Mesa muestra 💰 "Pagada"
3. Agregar producto → Se crea orden nueva (no se agrega a orden pagada)

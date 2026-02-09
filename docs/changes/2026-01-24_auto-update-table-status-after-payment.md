# Auto-Update Table Status After Payment

**Fecha**: 2026-01-24  
**Tipo**: Enhancement  
**Componentes**: Backend (Payments)

## Objetivo

Actualizar automáticamente el estado de la mesa a `paid` después de confirmar un pago.

## Archivos Modificados

### Backend

**`backend/src/domains/payments/service.ts`**

## Cambios Realizados

### 1. Nuevo Método Helper

Agregado método privado `updateTableStatusToPaid()`:

```typescript
/**
 * Update Table Status to Paid
 * Called after payment is completed
 */
private async updateTableStatusToPaid(orderId: string): Promise<void> {
  try {
    // Get table_id from order
    const orderResult = await this.pool.query(
      'SELECT table_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0 || !orderResult.rows[0].table_id) {
      return; // No table associated, skip
    }

    const tableId = orderResult.rows[0].table_id;

    // Update table status to 'paid'
    await this.pool.query(
      `UPDATE tables SET status = 'paid' WHERE id = $1`,
      [tableId]
    );

    console.log(`[PaymentsService] Table ${tableId} status updated to 'paid'`);
  } catch (err) {
    console.error('[PaymentsService] Error updating table status:', err);
    // Don't throw - table status update should not break payment flow
  }
}
```

### 2. Integración en Métodos de Pago

Llamada agregada en **3 métodos**:

#### a) `createPayment` (Pagos en efectivo)
```typescript
// Update table status to paid
await this.updateTableStatusToPaid(request.orderId);
```

#### b) `processCardPayment` (Pagos con tarjeta)
```typescript
// Update table status to paid
await this.updateTableStatusToPaid(payment.orderId);
```

#### c) `processPayment` (Pagos genéricos)
```typescript
// Update table status to paid
await this.updateTableStatusToPaid(payment.orderId);
```

## Flujo de Pago

### Antes
1. Cliente pide cuenta
2. Mesero procesa pago
3. ✅ `orders.payment_status = 'paid'`
4. ❌ Mesa sigue en estado anterior

### Ahora
1. Cliente pide cuenta
2. Mesero procesa pago
3. ✅ `orders.payment_status = 'paid'`
4. ✅ **`tables.status = 'paid'`** (AUTOMÁTICO)

## Edge Cases Manejados

| Caso | Comportamiento |
|------|----------------|
| Orden sin mesa (`table_id = NULL`) | ✅ Skip silenciosamente |
| Error al actualizar mesa | ✅ Log error, no rompe pago |
| Pago ya completado | ✅ Idempotente |
| Mesa ya en estado 'paid' | ✅ Actualiza de todos modos |

## Testing

### Verificación en Base de Datos
```sql
SELECT 
  o.id as order_id,
  o.payment_status,
  t.name as table_name,
  t.status as table_status
FROM orders o
JOIN tables t ON o.table_id = t.id
WHERE o.payment_status = 'paid'
ORDER BY o.created_at DESC
LIMIT 10;
```

**Resultado esperado**: `table_status = 'paid'` para órdenes con `payment_status = 'paid'`

### Verificación en Logs
Buscar en consola del backend:
```
[PaymentsService] Table <table-id> status updated to 'paid'
```

## Notas Técnicas

- ✅ No rompe flujo de pago si falla (try-catch)
- ✅ Logs para debugging
- ✅ Idempotente
- ✅ Sin cambios en base de datos (usa tabla existente)
- ✅ Sin cambios en frontend

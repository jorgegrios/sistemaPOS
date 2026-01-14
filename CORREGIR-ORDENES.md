# 🔧 Corrección de Órdenes y Mesas

## Problema
- Mesas 2, 3, 5, 8 muestran órdenes cuando deberían estar disponibles
- Mesa 1 muestra "1 orden" cuando debería mostrar "2 órdenes"
- Mesa 4 muestra "1 orden" cuando debería mostrar "3 órdenes"

## Solución

### 1. Ejecutar script de corrección
```bash
cd backend
npx ts-node scripts/fix-payment-status.ts
```

Este script:
- Busca órdenes con pagos completados pero `payment_status = 'pending'`
- Actualiza `payment_status` a `'paid'`
- Muestra las mesas afectadas

### 2. Verificar logs del backend
Después de reiniciar el backend, revisa los logs en la consola. Deberías ver:
- `[Cashier] Found X order rows from database`
- `[Cashier] Order X for table Y: payment_status=..., order_status=...`
- `[Cashier] Table X: Y valid orders, isActive: ...`

### 3. Verificar en la base de datos
```sql
-- Ver órdenes pendientes por mesa
SELECT 
  t.table_number,
  o.id as order_id,
  o.order_number,
  o.payment_status,
  o.status as order_status,
  o.total
FROM tables t
LEFT JOIN orders o ON t.id = o.table_id
WHERE t.restaurant_id = (SELECT id FROM restaurants LIMIT 1)
  AND (o.id IS NULL OR (
    o.payment_status = 'pending'
    AND o.status != 'cancelled'
    AND o.status != 'closed'
    AND o.status IN ('draft', 'sent_to_kitchen', 'served')
  ))
ORDER BY t.table_number, o.created_at DESC;
```

## Cambios implementados

1. ✅ Backend actualiza `payment_status` cuando se procesa un pago
2. ✅ Backend filtra órdenes con `payment_status = 'pending'` y `status` válido
3. ✅ Frontend doble verificación de filtrado
4. ✅ Logging detallado para debugging
5. ✅ Script de corrección para órdenes antiguas

## Resultado esperado

- **Mesa 1**: "En Consumo, 2 órdenes, $31.88"
- **Mesa 4**: "En Consumo, 3 órdenes, $56.07"
- **Mesa 2, 3, 5, 8**: "Disponible, $0.00" (gris)

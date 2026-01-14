-- Query para verificar órdenes pendientes por mesa
SELECT 
  t.id as table_id,
  t.table_number,
  o.id as order_id,
  o.order_number,
  o.payment_status,
  o.status as order_status,
  o.total,
  COUNT(oi.id) as item_count
FROM tables t
LEFT JOIN orders o ON t.id = o.table_id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE t.restaurant_id = (SELECT id FROM restaurants LIMIT 1)
  AND (o.id IS NULL OR (
    o.payment_status = 'pending'
    AND o.status != 'cancelled'
    AND o.status != 'closed'
    AND o.status IN ('draft', 'sent_to_kitchen', 'served')
  ))
GROUP BY t.id, t.table_number, o.id, o.order_number, o.payment_status, o.status, o.total
ORDER BY t.table_number, o.created_at DESC;

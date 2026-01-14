-- Script de diagnóstico para verificar el estado de las mesas y órdenes
-- Ejecutar en PostgreSQL: psql -U juang -d pos_system -f diagnose-tables.sql

-- 1. Ver todas las órdenes con su estado y mesa asociada
SELECT 
  o.id,
  LEFT(o.id::text, 8) as order_id_short,
  o.status,
  o.table_id,
  LEFT(o.table_id::text, 8) as table_id_short,
  t.name as table_name,
  o.total,
  o.created_at
FROM orders o
LEFT JOIN tables t ON o.table_id = t.id
ORDER BY o.created_at DESC
LIMIT 20;

-- 2. Ver solo órdenes activas (draft o sent_to_kitchen)
SELECT 
  o.id,
  LEFT(o.id::text, 8) as order_id_short,
  o.status,
  o.table_id,
  LEFT(o.table_id::text, 8) as table_id_short,
  t.name as table_name,
  o.total,
  o.created_at
FROM orders o
LEFT JOIN tables t ON o.table_id = t.id
WHERE o.status IN ('draft', 'sent_to_kitchen')
ORDER BY o.created_at DESC;

-- 3. Ver órdenes con estado 'served' (NO deberían aparecer como activas)
SELECT 
  o.id,
  LEFT(o.id::text, 8) as order_id_short,
  o.status,
  o.table_id,
  LEFT(o.table_id::text, 8) as table_id_short,
  t.name as table_name,
  o.total,
  o.created_at
FROM orders o
LEFT JOIN tables t ON o.table_id = t.id
WHERE o.status = 'served'
ORDER BY o.created_at DESC;

-- 4. Ver todas las mesas y si tienen órdenes activas
SELECT 
  t.id,
  LEFT(t.id::text, 8) as table_id_short,
  t.name as table_name,
  t.status as table_status,
  COUNT(o.id) FILTER (WHERE o.status IN ('draft', 'sent_to_kitchen')) as active_orders_count,
  STRING_AGG(DISTINCT o.status, ', ') FILTER (WHERE o.status IS NOT NULL) as all_order_statuses
FROM tables t
LEFT JOIN orders o ON o.table_id = t.id
GROUP BY t.id, t.name, t.status
ORDER BY t.name;

-- 5. Verificar si hay órdenes con estados inesperados
SELECT DISTINCT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY status;






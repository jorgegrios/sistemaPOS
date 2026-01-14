/**
 * Script para verificar todas las órdenes pendientes por mesa
 * Ayuda a diagnosticar problemas con el conteo de órdenes
 */

import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está definida');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkPendingOrders() {
  try {
    console.log('🔍 Verificando todas las órdenes pendientes por mesa...\n');
    
    // Obtener todas las mesas
    const tablesResult = await pool.query(
      `SELECT id, table_number FROM tables ORDER BY table_number`
    );

    for (const table of tablesResult.rows) {
      // Obtener todas las órdenes pendientes para esta mesa
      const ordersResult = await pool.query(
        `SELECT 
          o.id,
          o.order_number,
          o.payment_status,
          o.status as order_status,
          o.total,
          o.subtotal,
          o.tax,
          COUNT(oi.id) as item_count
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.table_id = $1
           AND o.payment_status = 'pending'
           AND o.status != 'cancelled'
           AND o.status != 'closed'
         GROUP BY o.id, o.order_number, o.payment_status, o.status, o.total, o.subtotal, o.tax
         ORDER BY o.created_at DESC`,
        [table.id]
      );

      if (ordersResult.rows.length > 0) {
        console.log(`📋 Mesa ${table.table_number} (${table.id}):`);
        console.log(`   Total de órdenes encontradas: ${ordersResult.rows.length}`);
        
        ordersResult.rows.forEach((order: any) => {
          console.log(`   - Orden ${order.order_number}:`);
          console.log(`     * ID: ${order.id}`);
          console.log(`     * Payment Status: ${order.payment_status}`);
          console.log(`     * Order Status: ${order.order_status}`);
          console.log(`     * Total: $${parseFloat(order.total).toFixed(2)}`);
          console.log(`     * Items: ${order.item_count}`);
          console.log(`     * ${parseFloat(order.total) === 0 ? '⚠️  ORDEN VACÍA (total=0)' : '✅ Orden válida'}`);
        });
        console.log('');
      }
    }

    // Resumen
    const summaryResult = await pool.query(
      `SELECT 
        t.table_number,
        COUNT(o.id) as order_count,
        SUM(CASE WHEN o.total > 0 THEN 1 ELSE 0 END) as valid_orders,
        SUM(CASE WHEN o.total = 0 THEN 1 ELSE 0 END) as empty_orders
       FROM tables t
       LEFT JOIN orders o ON t.id = o.table_id
         AND o.payment_status = 'pending'
         AND o.status != 'cancelled'
         AND o.status != 'closed'
       GROUP BY t.id, t.table_number
       HAVING COUNT(o.id) > 0
       ORDER BY t.table_number`
    );

    console.log('📊 RESUMEN POR MESA:');
    console.log('─'.repeat(60));
    summaryResult.rows.forEach((row: any) => {
      console.log(`Mesa ${row.table_number}: ${row.order_count} órdenes (${row.valid_orders} válidas, ${row.empty_orders} vacías)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkPendingOrders()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });


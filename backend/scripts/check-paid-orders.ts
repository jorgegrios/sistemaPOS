/**
 * Script para verificar órdenes pagadas en la base de datos
 */

import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está definida');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkPaidOrders() {
  try {
    console.log('🔍 Verificando órdenes pagadas en la base de datos...\n');
    
    // Verificar todas las órdenes pagadas
    const paidOrdersResult = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.payment_status,
        o.paid_at,
        o.created_at,
        o.table_id,
        t.table_number,
        t.restaurant_id,
        o.total
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       WHERE o.payment_status = 'paid'
       ORDER BY COALESCE(o.paid_at, o.created_at) DESC
       LIMIT 20`
    );

    console.log(`📊 Total de órdenes con payment_status = 'paid': ${paidOrdersResult.rows.length}\n`);

    if (paidOrdersResult.rows.length > 0) {
      console.log('📋 Órdenes pagadas encontradas:');
      paidOrdersResult.rows.forEach((order: any, index: number) => {
        console.log(`\n${index + 1}. Orden ${order.order_number} (${order.id}):`);
        console.log(`   - Payment Status: ${order.payment_status}`);
        console.log(`   - Paid At: ${order.paid_at || 'NULL'}`);
        console.log(`   - Created At: ${order.created_at}`);
        console.log(`   - Table: ${order.table_number || 'N/A'} (ID: ${order.table_id || 'NULL'})`);
        console.log(`   - Restaurant ID: ${order.restaurant_id || 'NULL'}`);
        console.log(`   - Total: $${parseFloat(order.total).toFixed(2)}`);
      });
    } else {
      console.log('⚠️  No se encontraron órdenes con payment_status = "paid"');
    }

    // Verificar órdenes con pagos completados pero payment_status != 'paid'
    const ordersWithCompletedPayments = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.payment_status,
        COUNT(pt.id) as payment_count,
        COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) as completed_payments
       FROM orders o
       INNER JOIN payment_transactions pt ON o.id = pt.order_id
       WHERE pt.status = 'completed'
         AND o.payment_status != 'paid'
       GROUP BY o.id, o.order_number, o.payment_status
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    if (ordersWithCompletedPayments.rows.length > 0) {
      console.log(`\n⚠️  Encontradas ${ordersWithCompletedPayments.rows.length} órdenes con pagos completados pero payment_status != 'paid':`);
      ordersWithCompletedPayments.rows.forEach((order: any) => {
        console.log(`   - Orden ${order.order_number}: payment_status=${order.payment_status}, completed_payments=${order.completed_payments}/${order.payment_count}`);
      });
    }

    // Verificar por restaurant_id
    const restaurantsResult = await pool.query(
      `SELECT DISTINCT t.restaurant_id, COUNT(o.id) as paid_orders
       FROM orders o
       INNER JOIN tables t ON o.table_id = t.id
       WHERE o.payment_status = 'paid'
       GROUP BY t.restaurant_id`
    );

    if (restaurantsResult.rows.length > 0) {
      console.log(`\n📊 Órdenes pagadas por restaurante:`);
      restaurantsResult.rows.forEach((row: any) => {
        console.log(`   - Restaurant ${row.restaurant_id}: ${row.paid_orders} órdenes pagadas`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkPaidOrders()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });



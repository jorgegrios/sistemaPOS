/**
 * Script para corregir payment_status de órdenes
 * Actualiza órdenes que tienen pagos completados pero payment_status = 'pending'
 */

import dotenv from 'dotenv';
dotenv.config(); // Cargar variables de entorno

import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno');
  console.error('   Por favor, asegúrate de tener un archivo .env con DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixPaymentStatus() {
  try {
    console.log('🔍 Buscando órdenes con pagos completados pero payment_status = pending...');
    
    // Buscar órdenes que tienen pagos completados pero payment_status = 'pending'
    const result = await pool.query(
      `SELECT 
        o.id as order_id,
        o.order_number,
        o.table_id,
        o.payment_status,
        o.status as order_status,
        COUNT(pt.id) as payment_count,
        COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) as completed_payments
      FROM orders o
      LEFT JOIN payment_transactions pt ON o.id = pt.order_id
      WHERE o.payment_status = 'pending'
        AND o.status != 'cancelled'
      GROUP BY o.id, o.order_number, o.table_id, o.payment_status, o.status
      HAVING COUNT(CASE WHEN pt.status = 'completed' THEN 1 END) > 0
      ORDER BY o.created_at DESC`
    );

    console.log(`📊 Encontradas ${result.rows.length} órdenes con pagos completados pero payment_status = 'pending'`);

    if (result.rows.length === 0) {
      console.log('✅ No hay órdenes que corregir');
      await pool.end();
      return;
    }

    // Actualizar cada orden
    for (const row of result.rows) {
      console.log(`\n📝 Orden ${row.order_number} (${row.order_id}):`);
      console.log(`   - Mesa: ${row.table_id}`);
      console.log(`   - Payment Status: ${row.payment_status}`);
      console.log(`   - Order Status: ${row.order_status}`);
      console.log(`   - Pagos completados: ${row.completed_payments}/${row.payment_count}`);

      // Actualizar payment_status a 'paid'
      await pool.query(
        `UPDATE orders 
         SET payment_status = 'paid', paid_at = COALESCE(paid_at, NOW())
         WHERE id = $1`,
        [row.order_id]
      );

      console.log(`   ✅ Actualizado: payment_status = 'paid'`);
    }

    console.log(`\n✅ ${result.rows.length} órdenes corregidas exitosamente`);
    
    // Verificar mesas afectadas
    const tablesResult = await pool.query(
      `SELECT DISTINCT t.id, t.table_number
       FROM tables t
       INNER JOIN orders o ON t.id = o.table_id
       WHERE o.id IN (${result.rows.map((_, i) => `$${i + 1}`).join(', ')})
       ORDER BY t.table_number`,
      result.rows.map(r => r.order_id)
    );

    if (tablesResult.rows.length > 0) {
      console.log(`\n📋 Mesas afectadas: ${tablesResult.rows.map(r => `Mesa ${r.table_number}`).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar
fixPaymentStatus()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });


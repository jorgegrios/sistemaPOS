import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function diagnose() {
    try {
        console.log('--- Diagnosis: Recent Orders ---');

        const orders = await pool.query(`
      SELECT o.id, o.order_number, o.status, o.company_id, o.table_id, t.table_number
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
        console.log('Orders:', orders.rows);

        if (orders.rows.length > 0) {
            const orderIds = orders.rows.map(o => o.id);
            const items = await pool.query(`
        SELECT id, order_id, product_id, status, name, company_id
        FROM order_items
        WHERE order_id = ANY($1)
      `, [orderIds]);
            console.log('Recent Order Items:', items.rows);
        }

    } catch (err) {
        console.error('Diagnosis failed:', err);
    } finally {
        await pool.end();
    }
}

diagnose();

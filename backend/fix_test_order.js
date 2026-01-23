const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const orderId = '7a237a33-cba6-4065-bf92-2e76bed5447b';

        // Get the company_id from users (default company)
        const userRes = await pool.query("SELECT company_id FROM users WHERE email = 'admin@default.com'");
        const companyId = userRes.rows[0].company_id;
        console.log('Using Company ID:', companyId);

        // Update the order
        const res = await pool.query('UPDATE orders SET company_id = $1 WHERE id = $2 RETURNING id', [companyId, orderId]);
        console.log('Updated order:', res.rows[0]);

        // Update its items too if they are missing company_id
        const itemRes = await pool.query('UPDATE order_items SET company_id = $1 WHERE order_id = $2 RETURNING id', [companyId, orderId]);
        console.log('Updated items count:', itemRes.rows.length);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

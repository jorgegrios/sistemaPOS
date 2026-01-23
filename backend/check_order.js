const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const orderId = '7a237a33-cba6-4065-bf92-2e76bed5447b';
        const res = await pool.query('SELECT id, company_id, table_id, status FROM orders WHERE id = $1', [orderId]);
        console.log('Order Details:', res.rows[0]);

        if (res.rows[0]) {
            const comp = await pool.query('SELECT id, name, slug FROM companies WHERE id = $1', [res.rows[0].company_id]);
            console.log('Company Details:', comp.rows[0]);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

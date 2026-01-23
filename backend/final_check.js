const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const r = await pool.query(`
      SELECT count(*) as count 
      FROM menu_items 
      WHERE company_id IS NOT NULL
    `);
        console.log('Items with company_id:', r.rows[0].count);

        const r2 = await pool.query(`
      SELECT count(*) as count 
      FROM menu_categories 
      WHERE company_id IS NOT NULL
    `);
        console.log('Categories with company_id:', r2.rows[0].count);

        const r3 = await pool.query(`
      SELECT id, name, company_id 
      FROM menu_items 
      LIMIT 5
    `);
        console.log('Sample Items:', r3.rows);

    } catch (e) {
        console.error('Check failed:', e.message);
    } finally {
        await pool.end();
    }
}
run();

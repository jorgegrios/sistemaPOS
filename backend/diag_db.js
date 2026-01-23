const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items'
    `);
        console.log('Columns in menu_items:', res.rows.map(r => r.column_name));

        const migs = await pool.query("SELECT name FROM pgmigrations");
        console.log('Applied Migrations:', migs.rows.map(r => r.name));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const tables = ['menu_items', 'menu_categories', 'tables', 'orders', 'restaurants'];
        for (const table of tables) {
            const res = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'company_id'
      `, [table]);
            console.log(`Table ${table} has company_id: ${res.rows.length > 0}`);
        }

        const migs = await pool.query("SELECT name FROM pgmigrations WHERE name = '1705000001000_finalize-saas-isolation'");
        console.log('Migration finalize-saas-isolation applied:', migs.rows.length > 0);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

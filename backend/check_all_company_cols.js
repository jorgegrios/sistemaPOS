const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'company_id'
      ORDER BY table_name
    `);
        console.log('Tables with company_id:');
        res.rows.forEach(r => console.log(`- ${r.table_name}`));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

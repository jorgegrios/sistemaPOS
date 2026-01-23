const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        require('fs').writeFileSync('tables.txt', res.rows.map(r => r.table_name).join('\n'));
    } catch (e) {
        require('fs').writeFileSync('tables.txt', e.stack);
    } finally {
        await pool.end();
    }
}
run();

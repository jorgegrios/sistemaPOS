const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const compCount = await pool.query("SELECT count(*) FROM companies");
        console.log('Companies count:', compCount.rows[0].count);

        const userComp = await pool.query("SELECT DISTINCT company_id FROM users");
        console.log('User Company IDs:', userComp.rows.map(r => r.company_id));

        const menuComp = await pool.query("SELECT DISTINCT company_id FROM menus");
        console.log('Menu Company IDs:', menuComp.rows.map(r => r.company_id));

        const itemComp = await pool.query("SELECT DISTINCT company_id FROM menu_items");
        console.log('Item Company IDs:', itemComp.rows.map(r => r.company_id));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

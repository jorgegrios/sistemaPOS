const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query('SELECT id, name FROM companies');
        console.log('COMPANIES');
        res.rows.forEach(r => console.log(`${r.id} | ${r.name}`));

        const res2 = await pool.query('SELECT id, name, company_id FROM restaurants');
        console.log('\nRESTAURANTS');
        res2.rows.forEach(r => console.log(`${r.id} | ${r.company_id} | ${r.name}`));

        const res3 = await pool.query('SELECT name, email, restaurant_id, company_id FROM users');
        console.log('\nUSERS');
        res3.rows.forEach(r => console.log(`${r.name} | ${r.email} | ${r.restaurant_id} | ${r.company_id}`));

        const res4 = await pool.query('SELECT id, name, restaurant_id, company_id FROM menus');
        console.log('\nMENUS');
        res4.rows.forEach(r => console.log(`${r.id} | ${r.name} | ${r.restaurant_id} | ${r.company_id}`));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

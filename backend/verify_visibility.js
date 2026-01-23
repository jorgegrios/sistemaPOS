const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT 
        (SELECT count(*) FROM menus WHERE company_id IS NOT NULL) as menus_with_company,
        (SELECT count(*) FROM menu_categories WHERE company_id IS NOT NULL) as categories_with_company,
        (SELECT count(*) FROM menu_items WHERE company_id IS NOT NULL) as items_with_company,
        (SELECT count(*) FROM users WHERE restaurant_id IS NOT NULL) as users_with_restaurant
    `);
        console.log(res.rows[0]);

        // Check if categories are visible to menus
        const res2 = await pool.query(`
      SELECT count(*) FROM menu_categories mc
      JOIN menus m ON mc.menu_id = m.id
      WHERE m.restaurant_id = (SELECT id FROM restaurants LIMIT 1)
    `);
        console.log('Visible categories:', res2.rows[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

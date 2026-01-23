const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        const companyId = (await pool.query("SELECT id FROM companies LIMIT 1")).rows[0].id;
        const restaurantId = (await pool.query("SELECT id FROM restaurants LIMIT 1")).rows[0].id;

        console.log(`Fixing for Company: ${companyId}, Restaurant: ${restaurantId}`);

        // Force ALL data to this company and restaurant
        await pool.query("UPDATE restaurants SET company_id = $1", [companyId]);
        await pool.query("UPDATE users SET restaurant_id = $2, company_id = $1", [companyId, restaurantId]);
        await pool.query("UPDATE menus SET restaurant_id = $2, company_id = $1, active = true", [companyId, restaurantId]);
        await pool.query("UPDATE menu_categories SET company_id = $1 WHERE company_id IS NULL", [companyId]);
        await pool.query("UPDATE menu_items SET company_id = $1 WHERE company_id IS NULL", [companyId]);
        await pool.query("UPDATE tables SET restaurant_id = $2, company_id = $1", [companyId, restaurantId]);

        // Check if categories are actually linked to the menu
        const menuId = (await pool.query("SELECT id FROM menus LIMIT 1")).rows[0].id;
        await pool.query("UPDATE menu_categories SET menu_id = $1", [menuId]);

        console.log('Fixed link between menus and categories.');

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

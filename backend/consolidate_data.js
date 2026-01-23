const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        // 1. Get the primary company
        const comp = await pool.query("SELECT id FROM companies LIMIT 1");
        if (comp.rows.length === 0) return;
        const companyId = comp.rows[0].id;

        // 2. Get the primary restaurant
        const rest = await pool.query("SELECT id FROM restaurants WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1", [companyId]);
        if (rest.rows.length === 0) return;
        const restaurantId = rest.rows[0].id;
        console.log(`Primary Restaurant: ${restaurantId}`);

        // 3. Move EVERYTHING to this restaurant
        await pool.query("UPDATE users SET restaurant_id = $1, company_id = $2", [restaurantId, companyId]);
        await pool.query("UPDATE menus SET restaurant_id = $1, company_id = $2", [restaurantId, companyId]);
        await pool.query("UPDATE tables SET restaurant_id = $1, company_id = $2", [restaurantId, companyId]);
        await pool.query("UPDATE inventory_items SET restaurant_id = $1, company_id = $2", [restaurantId, companyId]);

        // 4. Delete other restaurants to avoid confusion
        await pool.query("DELETE FROM restaurants WHERE id != $1", [restaurantId]);

        console.log('Successfully consolidated all data into one restaurant.');

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

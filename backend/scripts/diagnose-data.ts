import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function diagnose() {
    try {
        const tablesCount = await pool.query('SELECT count(*) FROM tables');
        console.log(`Total tables: ${tablesCount.rows[0].count}`);

        const sampleTables = await pool.query('SELECT id, name, restaurant_id FROM tables LIMIT 5');
        console.log('Sample Tables:', sampleTables.rows);

        const restaurants = await pool.query('SELECT id, name FROM restaurants');
        console.log('Restaurants:', restaurants.rows);

        const user = await pool.query("SELECT id, email, restaurant_id FROM users WHERE email = 'admin@restaurant.com'");
        console.log('Admin User:', user.rows[0]);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

diagnose();

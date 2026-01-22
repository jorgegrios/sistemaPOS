const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const userRes = await pool.query("SELECT email, restaurant_id FROM users WHERE email = 'admin@restaurant.com'");
        const userRid = userRes.rows[0]?.restaurant_id;
        console.log('User Restaurant ID:', userRid);

        const tablesRes = await pool.query("SELECT DISTINCT restaurant_id FROM tables");
        console.log('Tables Restaurant IDs:', tablesRes.rows.map(r => r.restaurant_id));

        if (userRid && !tablesRes.rows.some(r => r.restaurant_id === userRid)) {
            console.log('MISMATCH DETECTED! Updating tables to match user restaurant ID...');
            await pool.query("UPDATE tables SET restaurant_id = $1", [userRid]);
            console.log('Update complete.');
        } else {
            console.log('Data alignment looks good.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();

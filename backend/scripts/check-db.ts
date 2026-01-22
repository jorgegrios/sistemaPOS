import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkTables() {
    try {
        const result = await pool.query('SELECT count(*) FROM tables');
        console.log(`[DB Check] Total tables: ${result.rows[0].count}`);

        if (result.rows[0].count > 0) {
            const tables = await pool.query('SELECT id, name, status FROM tables LIMIT 5');
            console.log('[DB Check] Sample tables:', tables.rows);
        } else {
            console.log('[DB Check] No tables found. You might need to run the seed.');
        }
    } catch (err) {
        console.error('[DB Check] Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkTables();

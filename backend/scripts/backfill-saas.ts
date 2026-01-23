import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('--- SaaS Backfill Started ---');

        // 1. Create Default Company
        const companyResult = await client.query(`
      INSERT INTO companies (name, slug) 
      VALUES ($1, $2) 
      ON CONFLICT (slug) DO UPDATE SET name = $1
      RETURNING id
    `, ['Empresa Default', 'default']);

        const companyId = companyResult.rows[0].id;
        console.log(`✅ Default Company created/verified: ${companyId}`);

        // 2. Backfill isolated tables
        const isolatedTables = [
            'restaurants',
            'users',
            'orders',
            'payment_transactions',
            'refunds',
            'menus',
            'tables',
            'inventory_items',
            'purchase_orders',
            'cash_sessions'
        ];

        for (const table of isolatedTables) {
            const result = await client.query(`
        UPDATE ${table} SET company_id = $1 WHERE company_id IS NULL
      `, [companyId]);
            console.log(`✅ Table ${table}: updated ${result.rowCount} rows`);
        }

        await client.query('COMMIT');
        console.log('--- SaaS Backfill Completed Successfully ---');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Backfill failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

main();

import { Pool } from 'pg';
import { execSync } from 'child_process';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    console.log('🚀 Iniciando proceso de migración y aislamiento SaaS...');

    try {
        // 1. Ejecutar migraciones
        console.log('📦 Ejecutando migraciones restantes...');
        execSync('npm run migrate up', { stdio: 'inherit', cwd: 'c:/proyectos/posRestaurante/sistemaPOS/backend' });
        console.log('✅ Migraciones completadas.');

        // 2. Obtener el ID de la compañía "default"
        const companyResult = await pool.query("SELECT id FROM companies WHERE slug = 'default' LIMIT 1");
        if (companyResult.rows.length === 0) {
            console.error('❌ No se encontró la compañía "default". Por favor crea la compañía primero.');
            return;
        }
        const companyId = companyResult.rows[0].id;
        console.log(`🏢 ID de compañía "default": ${companyId}`);

        // 3. Backfill company_id en todas las tablas que ahora lo tienen
        const tablesToBackfill = [
            'menu_categories',
            'menu_items',
            'modifiers',
            'ingredients',
            'product_modifiers',
            'order_items',
            'inventory_movements',
            'tables',
            'menus',
            'orders',
            'payment_transactions',
            'refunds',
            'inventory_items',
            'purchase_orders',
            'cash_sessions'
        ];

        console.log('🔧 Iniciando backfill de company_id...');
        for (const table of tablesToBackfill) {
            const result = await pool.query(
                `UPDATE ${table} SET company_id = $1 WHERE company_id IS NULL`,
                [companyId]
            );
            console.log(`   - ${table}: ${result.rowCount} filas actualizadas`);
        }

        console.log('✅ Proceso completado exitosamente.');
    } catch (error) {
        console.error('❌ Error en el proceso:', error);
    } finally {
        await pool.end();
    }
}

run();

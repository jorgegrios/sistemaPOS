import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    console.log('🚀 Iniciando población COMPLETA para compañía default...');

    try {
        // 1. Obtener compañía default
        const companyResult = await pool.query("SELECT id FROM companies WHERE slug = 'default' LIMIT 1");
        if (companyResult.rows.length === 0) {
            console.error('❌ No se encontró la compañía "default".');
            return;
        }
        const companyId = companyResult.rows[0].id;

        // 2. Obtener o crear restaurante default
        let restaurantId: string;
        const resResult = await pool.query("SELECT id FROM restaurants WHERE company_id = $1 LIMIT 1", [companyId]);
        if (resResult.rows.length === 0) {
            restaurantId = uuidv4();
            await pool.query(
                "INSERT INTO restaurants (id, company_id, name, address, phone, email) VALUES ($1, $2, $3, $4, $5, $6)",
                [restaurantId, companyId, 'La Fonda Latina NYC', '82-12 Roosevelt Ave, Queens, NY 11372', '+1 718-555-0123', 'info@lafondanyc.com']
            );
            console.log('🏢 Restaurante creado.');
        } else {
            restaurantId = resResult.rows[0].id;
            console.log('🏢 Usando restaurante existente.');
        }

        // 3. Usuarios de Prueba
        const passwordHash = await bcrypt.hash('pos123', 10);
        const users = [
            { email: 'admin@default.com', name: 'Admin Fonda', role: 'admin' },
            { email: 'mesero1@default.com', name: 'Juan Waiter', role: 'waiter' },
            { email: 'mesero2@default.com', name: 'Luz Waitress', role: 'waiter' },
            { email: 'chef@default.com', name: 'Carlos Chef', role: 'kitchen' },
            { email: 'barman@default.com', name: 'Santi Bar', role: 'bartender' },
            { email: 'cajero@default.com', name: 'Marta Cashier', role: 'cashier' }
        ];

        for (const u of users) {
            await pool.query(
                `INSERT INTO users (id, company_id, restaurant_id, email, password_hash, name, role, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT (email, company_id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`,
                [uuidv4(), companyId, restaurantId, u.email, passwordHash, u.name, u.role]
            );
        }
        console.log(`👤 ${users.length} usuarios de prueba creados (Password: pos123).`);

        // 4. Mesas (Configuración realista)
        await pool.query("DELETE FROM tables WHERE restaurant_id = $1", [restaurantId]);
        const areas = [
            { prefix: 'P', name: 'Principal', count: 8, cap: 4 },
            { prefix: 'V', name: 'Ventana', count: 4, cap: 2 },
            { prefix: 'T', name: 'Terraza', count: 6, cap: 6 },
            { prefix: 'B', name: 'Barra', count: 5, cap: 1 }
        ];

        for (const area of areas) {
            for (let i = 1; i <= area.count; i++) {
                const tableId = uuidv4();
                const tableName = `${area.prefix}${i}`;
                await pool.query(
                    "INSERT INTO tables (id, company_id, restaurant_id, table_number, name, capacity, status) VALUES ($1, $2, $3, $4, $5, $6, 'free')",
                    [tableId, companyId, restaurantId, tableName, tableName, area.cap]
                );
            }
        }
        console.log('🪑 23 mesas creadas en diferentes áreas.');

        // 5. Ingredientes y Recetas (Link a lo que ya existe)
        // Primero aseguramos que los items del menú tengan ingredientes asociados
        // Vamos a buscar algunos items creados en el seed anterior
        const itemsResult = await pool.query("SELECT id, name FROM menu_items WHERE company_id = $1", [companyId]);
        const inventoryResult = await pool.query("SELECT id, name FROM inventory_items WHERE company_id = $1", [companyId]);

        if (itemsResult.rows.length > 0 && inventoryResult.rows.length > 0) {
            const inventoryMap = new Map(inventoryResult.rows.map(r => [r.name.toLowerCase(), r.id]));

            console.log('🍲 Asignando ingredientes (recetas) a platos principales...');
            for (const item of itemsResult.rows) {
                const name = item.name.toLowerCase();

                // Simulación lógica de recetas
                if (name.includes('bandeja paisa')) {
                    const ingrs = ['carne de res', 'tocino de cerdo', 'arroz blanco', 'frijol rojo', 'huevo aa', 'aguacate hass'];
                    for (const ingName of ingrs) {
                        const ingId = inventoryMap.get(ingName);
                        if (ingId) {
                            await pool.query(
                                "INSERT INTO menu_item_ingredients (id, menu_item_id, inventory_item_id, quantity, unit) VALUES ($1, $2, $3, $4, $5)",
                                [uuidv4(), item.id, ingId, 0.25, 'lb']
                            );
                        }
                    }
                } else if (name.includes('mofongo')) {
                    const ingrs = ['plátano verde', 'carne de res', 'sal refinada'];
                    for (const ingName of ingrs) {
                        const ingId = inventoryMap.get(ingName);
                        if (ingId) {
                            await pool.query(
                                "INSERT INTO menu_item_ingredients (id, menu_item_id, inventory_item_id, quantity, unit) VALUES ($1, $2, $3, $4, $5)",
                                [uuidv4(), item.id, ingId, 2, 'unidad']
                            );
                        }
                    }
                }
            }
        }

        // 6. Adiciones (Como items de menú independientes)
        const existingAdicionesCat = await pool.query("SELECT id FROM menu_categories WHERE company_id = $1 AND name = 'Guarniciones (Sides)' LIMIT 1", [companyId]);
        if (existingAdicionesCat.rows.length > 0) {
            const catId = existingAdicionesCat.rows[0].id;
            const adictionalItems = [
                { name: 'Porción de Chicharrón Extra', price: 6.00 },
                { name: 'Huevo Frito Adicional', price: 1.50 },
                { name: 'Aguacate (Tajada)', price: 2.00 },
                { name: 'Arepita Extra', price: 1.00 },
                { name: 'Arroz Extra', price: 3.50 }
            ];

            for (const ai of adictionalItems) {
                await pool.query(
                    "INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available) VALUES ($1, $2, $3, $4, $5, $5, true)",
                    [uuidv4(), companyId, catId, ai.name, ai.price]
                );
            }
        }

        console.log('\n✨ Población completa finalizada con éxito.');
        console.log('Credenciales sugeridas: admin@default.com / pos123');

    } catch (error) {
        console.error('❌ Error en el proceso:', error);
    } finally {
        await pool.end();
    }
}

run();

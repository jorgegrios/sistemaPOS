import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { pool } from '../shared/db';
import { OrdersService } from '../domains/orders/service';
import { KitchenService } from '../domains/kitchen/service';
import { v4 as uuidv4 } from 'uuid';

async function runVerification() {
    const ordersService = new OrdersService(pool);
    const kitchenService = new KitchenService(pool);

    try {
        console.log('--- Starting Multi-Kitchen Verification ---');

        // 1. Get a Company ID (assuming one exists or creating dummy)
        const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
        let companyId = companyRes.rows[0]?.id;
        if (!companyId) {
            console.log('No company found, creating one...');
            const newCo = await pool.query('INSERT INTO companies (name, slug) VALUES ($1, $2) RETURNING id', ['Test Co', 'test-co']);
            companyId = newCo.rows[0].id;
        }
        console.log('Using Company ID:', companyId);

        // 2. Ensure Stations exist
        const stations = await kitchenService.getStations(companyId);
        console.log('Stations:', stations);

        // 3. Create a Product with Components (Simulated by inserting into DB directly first)
        // We need a product that splits.
        // Insert a product
        const prodRes = await pool.query(`
        INSERT INTO menu_items (company_id, name, price, category_id) 
        VALUES ($1, 'Plato Mixto', 10000, NULL) RETURNING id
    `, [companyId]);
        const productId = prodRes.rows[0].id;

        // Create 2 stations
        let kitchenStation = stations.find(s => s.name === 'Cocina' && s.id !== 'kitchen');
        if (!kitchenStation) {
            const kRes = await pool.query("INSERT INTO kitchen_stations (company_id, name, is_default) VALUES ($1, 'Cocina', true) RETURNING id", [companyId]);
            kitchenStation = { id: kRes.rows[0].id, name: 'Cocina', isDefault: true };
        }

        let saladStation = stations.find(s => s.name === 'Ensaladas' && s.id !== 'bar');
        if (!saladStation) {
            const sRes = await pool.query("INSERT INTO kitchen_stations (company_id, name, is_default) VALUES ($1, 'Ensaladas', false) RETURNING id", [companyId]);
            saladStation = { id: sRes.rows[0].id, name: 'Ensaladas', isDefault: false };
        }

        // 3b. Create Dummy Table
        const tableRes = await pool.query("INSERT INTO tables (company_id, name, table_number) VALUES ($1, 'Mesa Test', 99) RETURNING id", [companyId]);
        const tableId = tableRes.rows[0].id;

        // Link components
        await pool.query("INSERT INTO product_components (product_id, station_id, component_name) VALUES ($1, $2, 'Carne')", [productId, kitchenStation.id]);
        await pool.query("INSERT INTO product_components (product_id, station_id, component_name) VALUES ($1, $2, 'Ensalada')", [productId, saladStation.id]);

        console.log('Created Product with Components');

        // 4. Create Order
        // Note: waiterId is string in interface but nullable in DB. We pass a UUID or just cast.
        const waiterId = uuidv4();
        const order = await ordersService.createOrder({
            companyId,
            tableId,
            waiterId
        });
        console.log('Created Order:', order.id);

        // 5. Add Item
        const addedItems = await ordersService.addItemsToOrder(order.id, companyId, {
            items: [{ productId, quantity: 1 }]
        });
        console.log('Added Item. Status:', addedItems[0].status);

        // 6. Send to Kitchen
        await ordersService.sendToKitchen(order.id, companyId);
        console.log('Sent to Kitchen');

        // 7. Verify Tasks
        const activeKitchen = await kitchenService.getActiveItems(companyId, kitchenStation.id);
        console.log('Active Items (Kitchen):', JSON.stringify(activeKitchen, null, 2));

        const activeSalad = await kitchenService.getActiveItems(companyId, saladStation.id);
        console.log('Active Items (Salad):', JSON.stringify(activeSalad, null, 2));

        if (activeKitchen.length === 0 || activeSalad.length === 0) {
            throw new Error('Tasks were not generated correctly!');
        }

        // 8. Mark Kitchen Task as Prepared
        const task1 = activeKitchen[0].tasks![0];
        await kitchenService.markTaskPrepared(task1.id, companyId);
        console.log('Marked Kitchen Task Prepared');

        // Check parent item status (should still be sent/pending because salad is not done)
        const itemCheck1 = await pool.query('SELECT status FROM order_items WHERE id = $1', [task1.orderItemId]);
        console.log('Item Status (partial):', itemCheck1.rows[0].status);

        // 9. Mark Salad Task as Prepared
        const task2 = activeSalad[0].tasks![0];
        await kitchenService.markTaskPrepared(task2.id, companyId);
        console.log('Marked Salad Task Prepared');

        // Check parent item status (should be prepared)
        const itemCheck2 = await pool.query('SELECT status FROM order_items WHERE id = $1', [task1.orderItemId]);
        console.log('Item Status (full):', itemCheck2.rows[0].status);

        if (itemCheck2.rows[0].status !== 'prepared') {
            throw new Error('Item status did not update to prepared!');
        }

        console.log('--- Verification Success! ---');

    } catch (err) {
        console.error('Verification Failed:', err);
    } finally {
        await pool.end();
    }
}

runVerification();

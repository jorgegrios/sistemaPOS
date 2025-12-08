"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://pos:pospass@localhost:5432/pos_dev'
});
async function seed() {
    console.log('🌱 Starting database seed...');
    try {
        // 1. Create restaurant
        const restaurantId = (0, uuid_1.v4)();
        await pool.query(`INSERT INTO restaurants (id, name, address, phone, email, timezone)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            restaurantId,
            'Test Restaurant',
            '123 Main St',
            '+1-555-0100',
            'contact@testrestaurant.com',
            'America/Los_Angeles'
        ]);
        console.log('✅ Restaurant created');
        // 2. Create menu
        const menuId = (0, uuid_1.v4)();
        await pool.query(`INSERT INTO menus (id, restaurant_id, name, description)
       VALUES ($1, $2, $3, $4)`, [menuId, restaurantId, 'Main Menu', 'Our featured menu items']);
        console.log('✅ Menu created');
        // 3. Create categories
        const categoryIds = [];
        const categories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages'];
        for (let i = 0; i < categories.length; i++) {
            const categoryId = (0, uuid_1.v4)();
            categoryIds.push(categoryId);
            await pool.query(`INSERT INTO menu_categories (id, menu_id, name, display_order)
         VALUES ($1, $2, $3, $4)`, [categoryId, menuId, categories[i], i]);
        }
        console.log(`✅ ${categories.length} categories created`);
        // 4. Create menu items
        const menuItems = [
            { category: 0, name: 'Bruschetta', price: 8.99, description: 'Toasted bread with tomato' },
            { category: 0, name: 'Calamari', price: 12.99, description: 'Fried squid rings' },
            { category: 1, name: 'Spaghetti Carbonara', price: 16.99, description: 'Classic Italian pasta' },
            { category: 1, name: 'Grilled Salmon', price: 24.99, description: 'Fresh salmon fillet' },
            { category: 2, name: 'Tiramisu', price: 7.99, description: 'Traditional Italian dessert' },
            { category: 2, name: 'Panna Cotta', price: 6.99, description: 'Creamy vanilla custard' },
            { category: 3, name: 'Iced Tea', price: 3.99, description: 'Refreshing iced tea' },
            { category: 3, name: 'Espresso', price: 2.99, description: 'Strong Italian coffee' }
        ];
        for (const item of menuItems) {
            await pool.query(`INSERT INTO menu_items (id, category_id, name, description, price, available, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                (0, uuid_1.v4)(),
                categoryIds[item.category],
                item.name,
                item.description,
                item.price,
                true,
                0
            ]);
        }
        console.log(`✅ ${menuItems.length} menu items created`);
        // 5. Create tables
        const tableIds = [];
        for (let i = 1; i <= 8; i++) {
            const tableId = (0, uuid_1.v4)();
            tableIds.push(tableId);
            await pool.query(`INSERT INTO tables (id, restaurant_id, table_number, capacity, status)
         VALUES ($1, $2, $3, $4, $5)`, [tableId, restaurantId, `Table ${i}`, 4, 'available']);
        }
        console.log(`✅ ${tableIds.length} tables created`);
        // 6. Create users (with bcrypt hashed passwords)
        const userRoles = ['admin', 'manager', 'waiter', 'cashier'];
        const userIds = [];
        for (let i = 0; i < userRoles.length; i++) {
            const userId = (0, uuid_1.v4)();
            userIds.push(userId);
            const passwordHash = await bcrypt_1.default.hash(`password_${userRoles[i]}`, 10);
            await pool.query(`INSERT INTO users (id, restaurant_id, email, password_hash, name, role, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                userId,
                restaurantId,
                `${userRoles[i]}@testrestaurant.com`,
                passwordHash,
                `Test ${userRoles[i].charAt(0).toUpperCase() + userRoles[i].slice(1)}`,
                userRoles[i],
                true
            ]);
        }
        console.log(`✅ ${userRoles.length} users created`);
        // 7. Create sample orders
        const orderIds = [];
        for (let i = 0; i < 3; i++) {
            const orderId = (0, uuid_1.v4)();
            orderIds.push(orderId);
            const orderNumber = `ORD-${Date.now()}-${i}`;
            await pool.query(`INSERT INTO orders (id, order_number, table_id, waiter_id, status, subtotal, tax, total, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                orderId,
                orderNumber,
                tableIds[i % tableIds.length],
                userIds[2], // waiter
                'pending',
                50.0,
                5.0,
                55.0,
                'pending'
            ]);
        }
        console.log(`✅ ${orderIds.length} sample orders created`);
        // 8. Create payment terminals
        const providers = ['stripe', 'square', 'mercadopago'];
        for (let i = 0; i < 3; i++) {
            await pool.query(`INSERT INTO payment_terminals (id, terminal_id, provider, device_type, location_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)`, [
                (0, uuid_1.v4)(),
                `TERM-${providers[i]}-001`,
                providers[i],
                'iPad Mini',
                restaurantId,
                'active'
            ]);
        }
        console.log('✅ Payment terminals created');
        console.log('\n✨ Database seed completed successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('   Admin:   admin@testrestaurant.com / password_admin');
        console.log('   Manager: manager@testrestaurant.com / password_manager');
        console.log('   Waiter:  waiter@testrestaurant.com / password_waiter');
        console.log('   Cashier: cashier@testrestaurant.com / password_cashier');
        await pool.end();
    }
    catch (error) {
        console.error('❌ Seed error:', error);
        await pool.end();
        process.exit(1);
    }
}
seed();

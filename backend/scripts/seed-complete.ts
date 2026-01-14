/**
 * Complete Seed Script
 * Creates sample data: restaurant, menu, categories, items, users, tables, suppliers, inventory
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://juang@localhost:5432/pos_system'
});

async function seed() {
  console.log('🌱 Iniciando seed completo de datos de ejemplo...\n');

  try {
    // 1. Crear restaurante
    const restaurantId = uuidv4();
    await pool.query(
      `INSERT INTO restaurants (id, name, address, phone, email, timezone, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [
        restaurantId,
        'Restaurante El Buen Sabor',
        'Av. Principal 123, Ciudad',
        '+1234567890',
        'contacto@elbuensabor.com',
        'America/Mexico_City'
      ]
    );
    console.log('✅ Restaurante creado');

    // 2. Crear menú principal
    const menuId = uuidv4();
    await pool.query(
      `INSERT INTO menus (id, restaurant_id, name, description, active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT DO NOTHING`,
      [menuId, restaurantId, 'Menú Principal', 'Nuestro menú completo con todas las opciones']
    );
    console.log('✅ Menú creado');

    // 3. Crear categorías
    const categories = [
      { name: 'Desayunos', order: 0, metadata: { type: 'kitchen' } },
      { name: 'Almuerzos', order: 1, metadata: { type: 'kitchen' } },
      { name: 'Cenas', order: 2, metadata: { type: 'kitchen' } },
      { name: 'Cocteles', order: 3, metadata: { type: 'bar' } },
      { name: 'Bebidas', order: 4, metadata: { type: 'bar' } },
      { name: 'Postres', order: 5, metadata: { type: 'kitchen' } },
      { name: 'Snacks', order: 6, metadata: { type: 'kitchen' } },
      { name: 'Adiciones', order: 7, metadata: { type: 'addition', isAdditionCategory: true } }
    ];

    const categoryIds: Record<string, string> = {};

    for (const cat of categories) {
      const categoryId = uuidv4();
      categoryIds[cat.name] = categoryId;
      await pool.query(
        `INSERT INTO menu_categories (id, menu_id, name, display_order, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`,
        [categoryId, menuId, cat.name, cat.order, JSON.stringify(cat.metadata)]
      );
    }
    console.log(`✅ ${categories.length} categorías creadas`);

    // 4. Crear items del menú
    const menuItems = [
      // DESAYUNOS
      { category: 'Desayunos', name: 'Huevos Rancheros', description: 'Huevos fritos con salsa ranchera, frijoles y tortillas', price: 12.99 },
      { category: 'Desayunos', name: 'Pancakes con Miel', description: 'Tres pancakes esponjosos con miel y mantequilla', price: 9.99 },
      { category: 'Desayunos', name: 'Omelette del Chef', description: 'Omelette con jamón, queso, champiñones y pimientos', price: 11.99 },
      { category: 'Desayunos', name: 'Tostadas Francesas', description: 'Pan brioche con canela, servido con jarabe de arce', price: 10.99 },
      { category: 'Desayunos', name: 'Chilaquiles', description: 'Totopos con salsa verde, crema, queso y huevo', price: 13.99 },

      // ALMUERZOS
      { category: 'Almuerzos', name: 'Pollo a la Parrilla', description: 'Pechuga de pollo a la parrilla con vegetales y arroz', price: 18.99 },
      { category: 'Almuerzos', name: 'Pasta Carbonara', description: 'Fettuccine con tocino, crema y parmesano', price: 16.99 },
      { category: 'Almuerzos', name: 'Hamburguesa Clásica', description: 'Carne 200g, lechuga, tomate, cebolla, queso y papas', price: 14.99 },
      { category: 'Almuerzos', name: 'Ensalada César', description: 'Lechuga romana, pollo, crutones, parmesano y aderezo césar', price: 13.99 },
      { category: 'Almuerzos', name: 'Tacos al Pastor', description: 'Tres tacos con carne al pastor, piña y cebolla', price: 12.99 },
      { category: 'Almuerzos', name: 'Pescado a la Plancha', description: 'Filete de pescado fresco con vegetales al vapor', price: 22.99 },

      // CENAS
      { category: 'Cenas', name: 'Filete Mignon', description: 'Corte premium 250g con papas y vegetales', price: 32.99 },
      { category: 'Cenas', name: 'Salmón Teriyaki', description: 'Salmón glaseado con teriyaki, arroz y brócoli', price: 24.99 },
      { category: 'Cenas', name: 'Risotto de Hongos', description: 'Arroz cremoso con hongos mixtos y parmesano', price: 19.99 },
      { category: 'Cenas', name: 'Costillas BBQ', description: 'Costillas de cerdo con salsa BBQ y papas fritas', price: 26.99 },
      { category: 'Cenas', name: 'Pasta Alfredo', description: 'Fettuccine con salsa cremosa de parmesano', price: 17.99 },

      // COCTELES
      { category: 'Cocteles', name: 'Mojito', description: 'Ron blanco, menta, lima, azúcar y soda', price: 8.99 },
      { category: 'Cocteles', name: 'Margarita', description: 'Tequila, triple sec, lima y sal en el borde', price: 9.99 },
      { category: 'Cocteles', name: 'Piña Colada', description: 'Ron, crema de coco y piña', price: 10.99 },
      { category: 'Cocteles', name: 'Daiquiri', description: 'Ron, jugo de lima y azúcar', price: 8.99 },
      { category: 'Cocteles', name: 'Old Fashioned', description: 'Whisky, azúcar, angostura y naranja', price: 11.99 },
      { category: 'Cocteles', name: 'Cosmopolitan', description: 'Vodka, triple sec, arándano y lima', price: 10.99 },

      // BEBIDAS
      { category: 'Bebidas', name: 'Coca Cola', description: 'Refresco 500ml', price: 3.99 },
      { category: 'Bebidas', name: 'Jugo de Naranja', description: 'Jugo natural recién exprimido', price: 4.99 },
      { category: 'Bebidas', name: 'Agua Mineral', description: 'Agua embotellada 500ml', price: 2.99 },
      { category: 'Bebidas', name: 'Café Americano', description: 'Café espresso con agua caliente', price: 3.99 },
      { category: 'Bebidas', name: 'Té Helado', description: 'Té negro helado con limón', price: 3.99 },
      { category: 'Bebidas', name: 'Limonada', description: 'Limonada natural con hielo', price: 4.99 },

      // POSTRES
      { category: 'Postres', name: 'Flan de Caramelo', description: 'Flan casero con caramelo', price: 6.99 },
      { category: 'Postres', name: 'Pastel de Chocolate', description: 'Torta de chocolate con crema batida', price: 7.99 },
      { category: 'Postres', name: 'Helado de Vainilla', description: 'Tres bolas de helado artesanal', price: 5.99 },
      { category: 'Postres', name: 'Cheesecake', description: 'Pastel de queso con frutos rojos', price: 8.99 },
      { category: 'Postres', name: 'Brownie con Helado', description: 'Brownie caliente con helado de vainilla', price: 7.99 },

      // SNACKS
      { category: 'Snacks', name: 'Nachos con Queso', description: 'Totopos con queso derretido y jalapeños', price: 8.99 },
      { category: 'Snacks', name: 'Papas Fritas', description: 'Papas fritas caseras con sal', price: 5.99 },
      { category: 'Snacks', name: 'Aros de Cebolla', description: 'Aros de cebolla empanizados', price: 7.99 },
      { category: 'Snacks', name: 'Alitas de Pollo', description: '6 alitas con salsa BBQ o picante', price: 9.99 },
      { category: 'Snacks', name: 'Quesadillas', description: 'Tortillas con queso y opción de pollo', price: 8.99 },

      // ADICIONES
      { category: 'Adiciones', name: 'Tomate', description: 'Rodajas de tomate fresco', price: 0.50 },
      { category: 'Adiciones', name: 'Cebolla', description: 'Cebolla en rodajas', price: 0.50 },
      { category: 'Adiciones', name: 'Aros de Cebolla', description: 'Aros de cebolla empanizados', price: 2.50 },
      { category: 'Adiciones', name: 'Papas Fritas', description: 'Porción de papas fritas', price: 3.00 },
      { category: 'Adiciones', name: 'Parmesano', description: 'Queso parmesano rallado', price: 1.00 },
      { category: 'Adiciones', name: 'Mozzarella', description: 'Queso mozzarella', price: 1.50 },
      { category: 'Adiciones', name: 'Lechuga', description: 'Lechuga fresca', price: 0.50 },
      { category: 'Adiciones', name: 'Queso Extra', description: 'Porción adicional de queso', price: 2.00 },
      { category: 'Adiciones', name: 'Tocino', description: 'Tocino crujiente', price: 2.50 },
      { category: 'Adiciones', name: 'Aguacate', description: 'Aguacate fresco', price: 1.50 },
      { category: 'Adiciones', name: 'Champiñones', description: 'Champiñones salteados', price: 2.00 },
      { category: 'Adiciones', name: 'Huevo', description: 'Huevo frito', price: 1.00 },
      { category: 'Adiciones', name: 'Jalapeños', description: 'Jalapeños en rodajas', price: 1.00 },
      { category: 'Adiciones', name: 'Pepinillos', description: 'Pepinillos en rodajas', price: 0.75 },
      { category: 'Adiciones', name: 'Salsa Extra', description: 'Porción adicional de salsa', price: 0.50 }
    ];

    for (const item of menuItems) {
      const categoryId = categoryIds[item.category];
      if (!categoryId) continue;

      await pool.query(
        `INSERT INTO menu_items (id, category_id, name, description, price, base_price, available, display_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $5, true, 0, NOW())
         ON CONFLICT DO NOTHING`,
        [uuidv4(), categoryId, item.name, item.description, item.price]
      );
    }
    console.log(`✅ ${menuItems.length} items del menú creados`);

    // 5. Crear mesas
    for (let i = 1; i <= 10; i++) {
      const tableNumber = `Mesa ${i}`;
      await pool.query(
        `INSERT INTO tables (id, restaurant_id, table_number, name, capacity, status, created_at)
         VALUES ($1, $2, $3, $3, $4, 'free', NOW())
         ON CONFLICT DO NOTHING`,
        [uuidv4(), restaurantId, tableNumber, i <= 4 ? 4 : 6]
      );
    }
    console.log('✅ 10 mesas creadas');

    // 6. Crear usuarios
    const users = [
      { email: 'admin@restaurant.com', password: 'admin123', name: 'Administrador', role: 'admin' },
      { email: 'gerente@restaurant.com', password: 'gerente123', name: 'Gerente', role: 'manager' },
      { email: 'mesero1@restaurant.com', password: 'mesero123', name: 'Juan Mesero', role: 'waiter' },
      { email: 'cajero@restaurant.com', password: 'cajero123', name: 'María Cajero', role: 'cashier' },
      { email: 'cocinero@restaurant.com', password: 'cocinero123', name: 'Chef Cocinero', role: 'kitchen' },
      { email: 'bartender@restaurant.com', password: 'bartender123', name: 'Bartender', role: 'bartender' }
    ];

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await pool.query(
        `INSERT INTO users (id, restaurant_id, email, password_hash, name, role, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
         ON CONFLICT (email) DO NOTHING`,
        [uuidv4(), restaurantId, user.email, passwordHash, user.name, user.role]
      );
    }
    console.log(`✅ ${users.length} usuarios creados`);

    // 7. Crear proveedores de ejemplo
    const suppliers = [
      { name: 'Distribuidora de Alimentos SA', contactName: 'Carlos Pérez', email: 'ventas@distribuidora.com', phone: '+1234567890' },
      { name: 'Bebidas Premium', contactName: 'Ana García', email: 'contacto@bebidas.com', phone: '+1234567891' },
      { name: 'Carnes Frescas', contactName: 'Roberto Martínez', email: 'pedidos@carnes.com', phone: '+1234567892' }
    ];

    for (const supplier of suppliers) {
      await pool.query(
        `INSERT INTO suppliers (id, restaurant_id, name, contact_name, email, phone, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
         ON CONFLICT DO NOTHING`,
        [uuidv4(), restaurantId, supplier.name, supplier.contactName, supplier.email, supplier.phone]
      );
    }
    console.log(`✅ ${suppliers.length} proveedores creados`);

    // 8. Crear items de inventario de ejemplo
    const inventoryItems = [
      { name: 'Pollo', unit: 'kg', currentStock: 50, minStock: 20, costPerUnit: 8.50, category: 'Carnes' },
      { name: 'Carne de Res', unit: 'kg', currentStock: 30, minStock: 15, costPerUnit: 15.00, category: 'Carnes' },
      { name: 'Pescado', unit: 'kg', currentStock: 25, minStock: 10, costPerUnit: 12.00, category: 'Pescados' },
      { name: 'Tomate', unit: 'kg', currentStock: 40, minStock: 20, costPerUnit: 3.50, category: 'Vegetales' },
      { name: 'Cebolla', unit: 'kg', currentStock: 35, minStock: 15, costPerUnit: 2.00, category: 'Vegetales' },
      { name: 'Lechuga', unit: 'kg', currentStock: 20, minStock: 10, costPerUnit: 4.00, category: 'Vegetales' },
      { name: 'Arroz', unit: 'kg', currentStock: 100, minStock: 50, costPerUnit: 2.50, category: 'Granos' },
      { name: 'Pasta', unit: 'kg', currentStock: 60, minStock: 30, costPerUnit: 3.00, category: 'Granos' },
      { name: 'Aceite de Oliva', unit: 'liter', currentStock: 20, minStock: 10, costPerUnit: 8.50, category: 'Aceites' },
      { name: 'Queso', unit: 'kg', currentStock: 15, minStock: 5, costPerUnit: 12.00, category: 'Lácteos' },
      { name: 'Huevos', unit: 'docena', currentStock: 50, minStock: 20, costPerUnit: 4.50, category: 'Lácteos' },
      { name: 'Pan', unit: 'unidad', currentStock: 100, minStock: 50, costPerUnit: 1.50, category: 'Panadería' },
      { name: 'Coca Cola', unit: 'caja', currentStock: 30, minStock: 15, costPerUnit: 12.00, category: 'Bebidas' },
      { name: 'Cerveza', unit: 'caja', currentStock: 40, minStock: 20, costPerUnit: 18.00, category: 'Bebidas' },
      { name: 'Vino Tinto', unit: 'botella', currentStock: 25, minStock: 10, costPerUnit: 15.00, category: 'Bebidas' }
    ];

    for (const item of inventoryItems) {
      await pool.query(
        `INSERT INTO inventory_items (id, restaurant_id, name, unit, current_stock, min_stock, cost_per_unit, category, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
         ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          restaurantId,
          item.name,
          item.unit,
          item.currentStock,
          item.minStock,
          item.costPerUnit,
          item.category
        ]
      );
    }
    console.log(`✅ ${inventoryItems.length} items de inventario creados`);

    console.log('\n🎉 Seed completo finalizado!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Admin: admin@restaurant.com / admin123');
    console.log('   Gerente: gerente@restaurant.com / gerente123');
    console.log('   Mesero: mesero1@restaurant.com / mesero123');
    console.log('   Cajero: cajero@restaurant.com / cajero123');
    console.log('   🍳 Cocinero: cocinero@restaurant.com / cocinero123');
    console.log('   🍹 Bartender: bartender@restaurant.com / bartender123');
    console.log(`\n🏢 Restaurant ID: ${restaurantId}`);
    console.log(`📋 Menu ID: ${menuId}`);

  } catch (error: any) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(console.error);




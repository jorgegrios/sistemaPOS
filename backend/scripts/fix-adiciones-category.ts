/**
 * Script para agregar categoría "Adiciones" al menú activo si no existe
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://juang@localhost:5432/pos_system'
});

async function fixAdicionesCategory() {
  console.log('🔧 Verificando y corrigiendo categoría "Adiciones"...\n');

  try {
    // 1. Obtener menú activo
    const menuResult = await pool.query(
      `SELECT id, name FROM menus WHERE active = true ORDER BY created_at LIMIT 1`
    );

    if (menuResult.rows.length === 0) {
      console.error('❌ No hay menús activos en la base de datos');
      process.exit(1);
    }

    const menuId = menuResult.rows[0].id;
    const menuName = menuResult.rows[0].name;
    console.log(`✅ Menú activo encontrado: ${menuName} (ID: ${menuId})\n`);

    // 2. Verificar si ya existe categoría "Adiciones" en este menú
    const existingCategory = await pool.query(
      `SELECT id, name FROM menu_categories 
       WHERE menu_id = $1 AND name ILIKE 'adicione%'
       LIMIT 1`,
      [menuId]
    );

    let categoryId: string;

    if (existingCategory.rows.length > 0) {
      categoryId = existingCategory.rows[0].id;
      console.log(`✅ Categoría "Adiciones" ya existe en el menú (ID: ${categoryId})`);
    } else {
      // 3. Crear categoría "Adiciones"
      categoryId = uuidv4();
      await pool.query(
        `INSERT INTO menu_categories (id, menu_id, name, display_order, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          categoryId,
          menuId,
          'Adiciones',
          7,
          JSON.stringify({ type: 'addition', isAdditionCategory: true })
        ]
      );
      console.log(`✅ Categoría "Adiciones" creada (ID: ${categoryId})`);
    }

    // 4. Verificar productos de "Adiciones"
    const itemsResult = await pool.query(
      `SELECT COUNT(*) as count FROM menu_items WHERE category_id = $1`,
      [categoryId]
    );
    const itemCount = parseInt(itemsResult.rows[0].count);

    if (itemCount === 0) {
      console.log(`\n⚠️  La categoría no tiene productos. Creando productos de ejemplo...\n`);

      // 5. Crear productos de "Adiciones"
      const adicionesItems = [
        { name: 'Tomate', description: 'Rodajas de tomate fresco', price: 0.50 },
        { name: 'Cebolla', description: 'Cebolla en rodajas', price: 0.50 },
        { name: 'Aros de Cebolla', description: 'Aros de cebolla empanizados', price: 2.50 },
        { name: 'Papas Fritas', description: 'Porción de papas fritas', price: 3.00 },
        { name: 'Parmesano', description: 'Queso parmesano rallado', price: 1.00 },
        { name: 'Mozzarella', description: 'Queso mozzarella', price: 1.50 },
        { name: 'Lechuga', description: 'Lechuga fresca', price: 0.50 },
        { name: 'Queso Extra', description: 'Porción adicional de queso', price: 2.00 },
        { name: 'Tocino', description: 'Tocino crujiente', price: 2.50 },
        { name: 'Aguacate', description: 'Aguacate fresco', price: 1.50 },
        { name: 'Champiñones', description: 'Champiñones salteados', price: 2.00 },
        { name: 'Huevo', description: 'Huevo frito', price: 1.00 },
        { name: 'Jalapeños', description: 'Jalapeños en rodajas', price: 1.00 },
        { name: 'Pepinillos', description: 'Pepinillos en rodajas', price: 0.75 },
        { name: 'Salsa Extra', description: 'Porción adicional de salsa', price: 0.50 }
      ];

      for (const item of adicionesItems) {
        // Verificar si ya existe
        const existingItem = await pool.query(
          `SELECT id FROM menu_items WHERE category_id = $1 AND name = $2 LIMIT 1`,
          [categoryId, item.name]
        );

        if (existingItem.rows.length === 0) {
          await pool.query(
            `INSERT INTO menu_items (id, category_id, name, description, price, base_price, available, display_order, created_at)
             VALUES ($1, $2, $3, $4, $5, $5, true, 0, NOW())`,
            [uuidv4(), categoryId, item.name, item.description, item.price]
          );
          console.log(`  ✅ Creado: ${item.name} - $${item.price}`);
        } else {
          console.log(`  ⏭️  Ya existe: ${item.name}`);
        }
      }
    } else {
      console.log(`✅ La categoría ya tiene ${itemCount} productos asociados`);
    }

    // 6. Verificar categorías del menú
    const finalCheck = await pool.query(
      `SELECT mc.id, mc.name, 
              (SELECT COUNT(*) FROM menu_items WHERE category_id = mc.id) as item_count
       FROM menu_categories mc
       WHERE mc.menu_id = $1
       ORDER BY mc.display_order`,
      [menuId]
    );

    console.log(`\n📋 Categorías finales del menú "${menuName}":`);
    finalCheck.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.item_count} items`);
    });

    console.log(`\n✅ Proceso completado exitosamente!\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixAdicionesCategory();






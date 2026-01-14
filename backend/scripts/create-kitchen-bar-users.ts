/**
 * Script para crear usuarios de Cocina y Bar
 * Ejecutar con: npx ts-node backend/scripts/create-kitchen-bar-users.ts
 */

import bcrypt from 'bcrypt';
import { pool } from '../src/shared/db';
import { v4 as uuidv4 } from 'uuid';

async function createKitchenBarUsers() {
  try {
    console.log('🍳🍹 Creando usuarios de Cocina y Bar...\n');

    // Obtener el primer restaurant_id de la base de datos
    const restaurantResult = await pool.query('SELECT id FROM restaurants LIMIT 1');
    
    if (restaurantResult.rows.length === 0) {
      console.error('❌ No hay restaurantes en la base de datos. Ejecuta el seed primero.');
      process.exit(1);
    }

    const restaurantId = restaurantResult.rows[0].id;
    console.log(`✅ Restaurant ID: ${restaurantId}\n`);

    // Crear usuarios
    const users = [
      { 
        email: 'cocinero@restaurant.com', 
        password: 'cocinero123', 
        name: 'Chef Cocinero', 
        role: 'kitchen' 
      },
      { 
        email: 'bartender@restaurant.com', 
        password: 'bartender123', 
        name: 'Bartender', 
        role: 'bartender' 
      },
      // También crear variantes alternativas
      { 
        email: 'kitchen@restaurant.com', 
        password: 'kitchen123', 
        name: 'Kitchen Staff', 
        role: 'kitchen' 
      },
      { 
        email: 'bar@restaurant.com', 
        password: 'bar123', 
        name: 'Bar Staff', 
        role: 'bartender' 
      }
    ];

    for (const user of users) {
      // Verificar si el usuario ya existe
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⏭️  Usuario ${user.email} ya existe, saltando...`);
        continue;
      }

      // Crear usuario
      const passwordHash = await bcrypt.hash(user.password, 10);
      const userId = uuidv4();
      
      await pool.query(
        `INSERT INTO users (id, restaurant_id, email, password_hash, name, role, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW())`,
        [userId, restaurantId, user.email, passwordHash, user.name, user.role]
      );

      console.log(`✅ Usuario creado: ${user.email} (Rol: ${user.role})`);
    }

    console.log('\n✨ Usuarios de Cocina y Bar creados exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('\n🍳 COCINA:');
    console.log('   Email: cocinero@restaurant.com');
    console.log('   Password: cocinero123');
    console.log('   O');
    console.log('   Email: kitchen@restaurant.com');
    console.log('   Password: kitchen123');
    
    console.log('\n🍹 BAR:');
    console.log('   Email: bartender@restaurant.com');
    console.log('   Password: bartender123');
    console.log('   O');
    console.log('   Email: bar@restaurant.com');
    console.log('   Password: bar123');
    
    console.log('\n');

  } catch (error: any) {
    console.error('❌ Error creando usuarios:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createKitchenBarUsers().catch(console.error);






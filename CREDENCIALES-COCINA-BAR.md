# 🍳🍹 Credenciales de Acceso - Cocina y Bar

## 📋 Usuarios para Cocina y Bar

Los usuarios de cocina y bar **NO están creados automáticamente** en el seed actual. Necesitas crearlos manualmente.

## 🔧 Opción 1: Crear usuarios manualmente desde SQL

Ejecuta estos comandos SQL en tu base de datos PostgreSQL (ajusta el `restaurant_id` según tu caso):

```sql
-- Obtener el hash de bcrypt para las contraseñas
-- Password: cocinero123
-- Hash: Se genera automáticamente con bcrypt.hash('cocinero123', 10)

-- Crear usuario de Cocina
INSERT INTO users (id, restaurant_id, email, password_hash, name, role, active, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM restaurants LIMIT 1),
  'cocinero@restaurant.com',
  '$2b$10$YourBcryptHashHere', -- Necesitas generar el hash real
  'Chef Cocinero',
  'kitchen',
  true,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'cocinero@restaurant.com');

-- Crear usuario de Bar  
INSERT INTO users (id, restaurant_id, email, password_hash, name, role, active, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM restaurants LIMIT 1),
  'bartender@restaurant.com',
  '$2b$10$YourBcryptHashHere', -- Necesitas generar el hash real
  'Bartender',
  'bartender',
  true,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bartender@restaurant.com');
```

## 🚀 Opción 2: Usar el script de Node.js

Primero asegúrate de tener tu `DATABASE_URL` configurado correctamente en `backend/.env`, luego ejecuta:

```bash
cd backend
npx ts-node scripts/create-kitchen-bar-users.ts
```

Este script creará automáticamente los usuarios con los hashes correctos de bcrypt.

## 📝 Credenciales Recomendadas

### 🍳 **COCINA** (Rol: `kitchen`)

**Opción 1:**
- **Email:** `cocinero@restaurant.com`
- **Password:** `cocinero123`

**Opción 2:**
- **Email:** `kitchen@restaurant.com`
- **Password:** `kitchen123`

### 🍹 **BAR** (Rol: `bartender`)

**Opción 1:**
- **Email:** `bartender@restaurant.com`
- **Password:** `bartender123`

**Opción 2:**
- **Email:** `bar@restaurant.com`
- **Password:** `bar123`

## 🔐 Cómo generar el hash de bcrypt manualmente

Si necesitas generar el hash de bcrypt para insertar manualmente, puedes usar Node.js:

```javascript
const bcrypt = require('bcrypt');

async function generateHash() {
  const hash = await bcrypt.hash('cocinero123', 10);
  console.log('Hash para cocinero123:', hash);
  
  const hash2 = await bcrypt.hash('bartender123', 10);
  console.log('Hash para bartender123:', hash2);
}

generateHash();
```

O usar este comando rápido:

```bash
node -e "const bcrypt=require('bcrypt');bcrypt.hash('cocinero123',10).then(h=>console.log('Cocinero:',h));bcrypt.hash('bartender123',10).then(h=>console.log('Bartender:',h))"
```

## ✅ Verificar usuarios creados

Para verificar que los usuarios se crearon correctamente:

```sql
SELECT id, email, name, role, active 
FROM users 
WHERE role IN ('kitchen', 'bartender');
```

## 🎯 Acceso a las pantallas

Una vez creados los usuarios:

- **Cocinero** (`role = 'kitchen'`) → Redirige automáticamente a `/kitchen`
- **Bartender** (`role = 'bartender'`) → Redirige automáticamente a `/bar`

## 🔄 Actualizar seed para incluir estos usuarios

Si quieres que estos usuarios se creen automáticamente en el seed, actualiza `backend/scripts/seed-complete.ts` y agrega:

```typescript
const users = [
  { email: 'admin@restaurant.com', password: 'admin123', name: 'Administrador', role: 'admin' },
  { email: 'gerente@restaurant.com', password: 'gerente123', name: 'Gerente', role: 'manager' },
  { email: 'mesero1@restaurant.com', password: 'mesero123', name: 'Juan Mesero', role: 'waiter' },
  { email: 'cajero@restaurant.com', password: 'cajero123', name: 'María Cajero', role: 'cashier' },
  // Agregar estos:
  { email: 'cocinero@restaurant.com', password: 'cocinero123', name: 'Chef Cocinero', role: 'kitchen' },
  { email: 'bartender@restaurant.com', password: 'bartender123', name: 'Bartender', role: 'bartender' }
];
```







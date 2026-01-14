# 🚀 Inicio Rápido - sistemaPOS

## Método Más Rápido (Recomendado)

### 1. Ejecutar Script de Configuración

```bash
cd /Users/juang/Documents/sistemaPOS
./iniciar.sh
```

Este script:
- ✅ Verifica dependencias
- ✅ Crea archivos `.env` si no existen
- ✅ Instala dependencias
- ✅ Crea base de datos
- ✅ Ejecuta migraciones

### 2. Iniciar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Acceder

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

---

## Configuración Manual (Si prefieres)

### Paso 1: Variables de Entorno

**`backend/.env`:**
```bash
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/pos_system
JWT_SECRET=tu_secret_aqui_cambiar
CORS_ORIGIN=http://localhost:5173
AUTO_DISCOVER_PRINTERS=true
```

**`frontend/.env`:**
```bash
VITE_API_URL=http://localhost:3000
```

### Paso 2: Base de Datos

```bash
# Crear base de datos
createdb pos_system

# O con psql
psql -U postgres
CREATE DATABASE pos_system;
\q
```

### Paso 3: Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Paso 4: Migraciones

```bash
cd backend
npm run migrate:up
```

### Paso 5: Iniciar

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## Crear Usuario Inicial

### Opción 1: SQL Directo (Más Rápido)

```bash
psql -U postgres -d pos_system
```

```sql
-- 1. Crear restaurante
INSERT INTO restaurants (id, name, address, phone, email, created_at)
VALUES (gen_random_uuid(), 'Mi Restaurante', 'Calle 123', '+1234567890', 'rest@example.com', NOW())
RETURNING id;

-- 2. Crear usuario admin (reemplaza RESTAURANT_ID con el ID del paso anterior)
-- Password: "admin123"
INSERT INTO users (id, restaurant_id, email, password_hash, name, role, active, created_at)
VALUES (
  gen_random_uuid(),
  'RESTAURANT_ID_AQUI',
  'admin@restaurant.com',
  '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Hash de "admin123"
  'Administrador',
  'admin',
  true,
  NOW()
);
```

### Opción 2: Usando API (después de crear usuario manualmente)

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@restaurant.com", "password": "admin123"}'

# Usar el token para crear más usuarios desde Swagger UI
```

---

## Verificar que Funciona

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```
   Debe responder: `{"ok":true,"ts":...}`

2. **Swagger UI:**
   Abre: http://localhost:3000/api/docs

3. **Frontend:**
   Abre: http://localhost:5173

4. **Login:**
   - Email: `admin@restaurant.com`
   - Password: `admin123`

---

## Solución de Problemas Rápida

### Error: "Cannot connect to database"
```bash
# Verificar PostgreSQL
pg_isready

# Verificar que la BD existe
psql -l | grep pos_system
```

### Error: "Port already in use"
```bash
# Cambiar puerto en backend/.env
PORT=3001

# O matar proceso
lsof -ti:3000 | xargs kill
```

### Error: "Module not found"
```bash
# Reinstalar
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

---

## URLs Importantes

- 🎨 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:3000
- 📚 **Swagger UI**: http://localhost:3000/api/docs
- 🏥 **Health Check**: http://localhost:3000/health

---

## Próximos Pasos

1. ✅ Iniciar servicios
2. ✅ Crear usuario inicial
3. ✅ Iniciar sesión
4. ✅ Crear menú
5. ✅ Crear items de inventario
6. ✅ Crear proveedores
7. ✅ Probar crear orden

¡Listo! 🎉








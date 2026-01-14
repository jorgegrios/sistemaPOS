# 🚀 Guía de Inicio Rápido - sistemaPOS

## Opción 1: Inicio Local (Recomendado para desarrollo)

### Prerrequisitos

- Node.js 20+ instalado
- PostgreSQL instalado y corriendo
- Redis instalado y corriendo (opcional, pero recomendado)

### Paso 1: Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb pos_system

# O usando psql
psql -U postgres
CREATE DATABASE pos_system;
\q
```

### Paso 2: Configurar Variables de Entorno

**Backend** (`backend/.env`):
```bash
# Database
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/pos_system

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion

# Payment Gateways (opcional para pruebas)
STRIPE_SECRET_KEY=sk_test_...
SQUARE_ACCESS_TOKEN=sandbox-token
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# CORS
CORS_ORIGIN=http://localhost:5173

# Printer Discovery (opcional)
AUTO_DISCOVER_PRINTERS=true
PRINTER_DISCOVERY_INTERVAL=30
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:3000
```

### Paso 3: Instalar Dependencias

```bash
# Terminal 1 - Backend
cd backend
npm install

# Terminal 2 - Frontend
cd frontend
npm install
```

### Paso 4: Ejecutar Migraciones

```bash
cd backend
npm run migrate:up
```

### Paso 5: Iniciar Servicios

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend estará en: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend estará en: `http://localhost:5173`

### Paso 6: Acceder a la Aplicación

1. Abre tu navegador en: `http://localhost:5173`
2. Inicia sesión (necesitarás crear un usuario primero)

---

## Opción 2: Docker Compose (Más fácil)

### Paso 1: Crear archivo `.env` en la raíz

```bash
# .env
POSTGRES_DB=pos_system
POSTGRES_USER=pos_admin
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_PORT=5432

REDIS_PASSWORD=tu_redis_password_seguro
REDIS_PORT=6379

JWT_SECRET=tu_jwt_secret_super_seguro
JWT_REFRESH_SECRET=otro_secret_diferente

BACKEND_PORT=3000
FRONTEND_PORT=5173

STRIPE_SECRET_KEY=sk_test_...
SQUARE_ACCESS_TOKEN=sandbox-token
MERCADOPAGO_ACCESS_TOKEN=TEST-...

CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3000
```

### Paso 2: Iniciar con Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Paso 3: Ejecutar Migraciones

```bash
# Entrar al contenedor del backend
docker-compose exec backend npm run migrate:up
```

### Paso 4: Acceder

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api/docs`

---

## Opción 3: Solo Backend (para probar API)

```bash
cd backend
npm install
npm run build
npm start
```

API disponible en: `http://localhost:3000`
Swagger UI: `http://localhost:3000/api/docs`

---

## Crear Usuario Inicial

### Opción A: Usando Swagger UI

1. Ve a `http://localhost:3000/api/docs`
2. Busca el endpoint `POST /api/v1/auth/register`
3. Necesitarás autenticarte primero (crear un usuario manualmente en la BD)

### Opción B: Script de Seed (si existe)

```bash
cd backend
npm run seed
```

### Opción C: SQL Directo

```sql
-- Conectar a PostgreSQL
psql -U postgres -d pos_system

-- Insertar restaurante primero
INSERT INTO restaurants (id, name, address, phone, email)
VALUES (gen_random_uuid(), 'Mi Restaurante', 'Calle 123', '+1234567890', 'rest@example.com')
RETURNING id;

-- Insertar usuario (reemplaza restaurant_id y password_hash)
-- Password: "admin123" (hash con bcrypt)
INSERT INTO users (id, restaurant_id, email, password_hash, name, role, active)
VALUES (
  gen_random_uuid(),
  'TU_RESTAURANT_ID_AQUI',
  'admin@restaurant.com',
  '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Hash de "admin123"
  'Administrador',
  'admin',
  true
);
```

### Opción D: Usando API directamente

```bash
# Primero crear restaurante (si no existe)
curl -X POST http://localhost:3000/api/v1/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Restaurante",
    "address": "Calle 123",
    "phone": "+1234567890",
    "email": "rest@example.com"
  }'

# Luego crear usuario (necesitas token de admin o modificar la BD directamente)
```

---

## Verificar que Todo Funciona

### 1. Verificar Backend

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Ver Swagger
open http://localhost:3000/api/docs
```

### 2. Verificar Frontend

```bash
# Abrir en navegador
open http://localhost:5173
```

### 3. Probar Login

- Email: `admin@restaurant.com`
- Password: `admin123` (o el que hayas configurado)

---

## Solución de Problemas

### Error: "Cannot connect to database"

- Verifica que PostgreSQL esté corriendo: `pg_isready`
- Verifica las credenciales en `.env`
- Verifica que la base de datos exista

### Error: "Port already in use"

- Cambia el puerto en `.env` o detén el proceso que usa el puerto
- Backend: `PORT=3001`
- Frontend: Modifica `vite.config.ts`

### Error: "Migration failed"

```bash
# Ver estado de migraciones
cd backend
npm run migrate list

# Resetear migraciones (CUIDADO: borra datos)
npm run migrate:reset
```

### Error: "Module not found"

```bash
# Reinstalar dependencias
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

---

## Comandos Útiles

```bash
# Backend
cd backend
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm run start        # Producción
npm run migrate:up   # Ejecutar migraciones
npm run lint         # Linter

# Frontend
cd frontend
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter

# Docker
docker-compose up -d           # Iniciar servicios
docker-compose down            # Detener servicios
docker-compose logs -f backend # Ver logs del backend
docker-compose exec backend bash # Entrar al contenedor
```

---

## URLs Importantes

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

---

## Próximos Pasos

1. ✅ Iniciar servicios
2. ✅ Crear usuario inicial
3. ✅ Iniciar sesión
4. ✅ Crear restaurante (si no existe)
5. ✅ Crear menú
6. ✅ Crear items de inventario
7. ✅ Crear proveedores
8. ✅ Probar crear orden
9. ✅ Probar pagos

¡Listo para usar! 🎉









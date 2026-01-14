# 🚀 Iniciar la Aplicación - sistemaPOS

## ✅ Configuración Completada

Tu `.env` ya está configurado correctamente:
- **Usuario**: `juang`
- **Base de datos**: `pos_system`
- **URL**: `postgresql://juang@localhost:5432/pos_system`

## 🎯 Iniciar la Aplicación

### Paso 1: Iniciar Backend

```bash
cd /Users/juang/Documents/sistemaPOS/backend
npm run dev
```

Deberías ver:
```
✅ Backend listening on http://localhost:3000
📚 Swagger UI: http://localhost:3000/api/docs
```

### Paso 2: Iniciar Frontend (Nueva Terminal)

```bash
cd /Users/juang/Documents/sistemaPOS/frontend
npm run dev
```

Deberías ver:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Paso 3: Acceder a la Aplicación

Abre tu navegador en: **http://localhost:5173**

---

## 👤 Crear Usuario Inicial

Si aún no tienes un usuario, créalo en PostgreSQL:

```bash
psql -U juang -d pos_system
```

```sql
-- 1. Ver si existe restaurante
SELECT id, name FROM restaurants LIMIT 1;

-- Si no existe, crear uno:
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
  '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
  'Administrador',
  'admin',
  true,
  NOW()
);
```

**Login:**
- Email: `admin@restaurant.com`
- Password: `admin123`

---

## 🔍 Verificar que Todo Funciona

### Backend
```bash
curl http://localhost:3000/health
# Debe responder: {"ok":true,"ts":...}
```

### Swagger UI
Abre: http://localhost:3000/api/docs

### Frontend
Abre: http://localhost:5173

---

## 📝 Comandos Rápidos

```bash
# Backend
cd backend
npm run dev          # Desarrollo
npm run build        # Compilar
npm run migrate:up   # Migraciones

# Frontend
cd frontend
npm run dev          # Desarrollo
npm run build        # Build producción
```

---

## 🆘 Si Algo Falla

### Error: "Cannot connect to database"
```bash
# Verificar PostgreSQL
pg_isready

# Probar conexión
psql -U juang -d pos_system -c "SELECT 1;"
```

### Error: "Port already in use"
```bash
# Ver qué usa el puerto
lsof -ti:3000
lsof -ti:5173

# Matar proceso
kill -9 $(lsof -ti:3000)
```

### Error: "Module not found"
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

¡Listo para usar! 🎉








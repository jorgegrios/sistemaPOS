# Backend Completo - Guía de Uso

## 🎯 Resumen de lo Completado

✅ **Opción A Implementada (3 horas)**
- ✅ Migraciones de BD (node-pg-migrate)
- ✅ Seed data con datos iniciales
- ✅ Rutas de órdenes (CRUD completo)
- ✅ Rutas de menus/items
- ✅ JWT autenticación con roles

## 🚀 Inicio Rápido

### 1. Setup Inicial

```bash
cd /Users/juang/Documents/sistemaPOS/backend

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

### 2. Inicializar Base de Datos

```bash
# Desde raíz del proyecto
docker-compose up -d

# Esperar a que PostgreSQL esté listo (~5s)
sleep 5

# Ejecutar migraciones
cd backend
npm run migrate:up

# Crear seed data (restaurante de prueba, usuarios, menus)
npm run seed
```

### 3. Iniciar Backend

```bash
npm run dev    # Development con auto-reload
# o
npm start      # Production
```

Backend disponible en: `http://localhost:3000`

## 📋 API Reference Rápida

### Autenticación

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "waiter@testrestaurant.com",
    "password": "password_waiter"
  }'

# Response: { token: "eyJhbG...", user: {...} }

# 2. Copiar token y usarlo en peticiones subsecuentes
TOKEN="eyJhbG..."
```

### Órdenes

```bash
# Crear orden
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "table-uuid",
    "waiterId": "waiter-uuid",
    "items": [
      {
        "menuItemId": "item-uuid",
        "name": "Spaghetti Carbonara",
        "price": 16.99,
        "quantity": 2,
        "notes": "Sin ajo"
      }
    ]
  }'

# Listar órdenes
curl -X GET "http://localhost:3000/api/v1/orders?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# Ver detalles
curl -X GET http://localhost:3000/api/v1/orders/{orderId} \
  -H "Authorization: Bearer $TOKEN"

# Actualizar orden
curl -X PUT http://localhost:3000/api/v1/orders/{orderId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "tip": 10.00}'

# Agregar item a orden existente
curl -X POST http://localhost:3000/api/v1/orders/{orderId}/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"menuItemId": "...", "name": "Tiramisu", "price": 7.99, "quantity": 1}'
```

### Menus

```bash
# Listar menus de restaurante
curl -X GET http://localhost:3000/api/v1/menus/{restaurantId}

# Ver menu completo con items
curl -X GET http://localhost:3000/api/v1/menus/{restaurantId}/{menuId}

# Crear item (requiere autenticación)
curl -X POST http://localhost:3000/api/v1/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "category-uuid",
    "name": "Pizza Margarita",
    "description": "Clásica pizza italiana",
    "price": 14.99,
    "available": true
  }'

# Actualizar precio/disponibilidad
curl -X PUT http://localhost:3000/api/v1/menus/{itemId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": 15.99, "available": false}'
```

## 👥 Usuarios de Prueba

Al ejecutar `npm run seed` se crean automáticamente:

| Email | Contraseña | Rol | Permisos |
|-------|-----------|-----|---------|
| admin@testrestaurant.com | password_admin | admin | Crear usuarios, admin del sistema |
| manager@testrestaurant.com | password_manager | manager | Reportes, configuración |
| waiter@testrestaurant.com | password_waiter | waiter | Crear/ver órdenes |
| cashier@testrestaurant.com | password_cashier | cashier | Procesar pagos |

## 🗄️ Estructura de Base de Datos

```
Restaurants
  ├─ Menus
  │   ├─ Categories
  │   │   └─ Items (price, available)
  │   └─ Orders
  │       ├─ Order Items (qty, price)
  │       └─ Payment Transactions
  ├─ Tables
  ├─ Users (con roles)
  └─ Payment Terminals
```

## 🔐 JWT Tokens

- **Formato**: Bearer token
- **Duración**: 24 horas
- **Header requerido**: `Authorization: Bearer {token}`
- **Payload**: id, email, name, role, restaurantId

## 📝 Migraciones

```bash
# Ver estado
npm run migrate -- up

# Deshacer última migración
npm run migrate:down

# Reset total (down + up)
npm run migrate:reset
```

## 🧪 Testing Rápido

```bash
# 1. Login como waiter
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"waiter@testrestaurant.com","password":"password_waiter"}' | jq -r '.token')

# 2. Listar órdenes
curl -s -X GET http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Ver menus
curl -s -X GET http://localhost:3000/api/v1/menus/{restaurantId} | jq '.'
```

## 📊 Logs y Debugging

```bash
# Ver logs del backend
docker-compose logs -f backend

# Conectar a PostgreSQL
docker-compose exec postgres psql -U pos -d pos_dev

# Comandos útiles en psql
\dt                          # Ver todas las tablas
SELECT * FROM users;         # Ver usuarios
SELECT * FROM orders;        # Ver órdenes
\q                          # Salir
```

## ✅ Checklist de Producción

- [ ] JWT_SECRET configurado en .env (no use default)
- [ ] DATABASE_URL apunta a BD productiva
- [ ] HTTPS habilitado (no HTTP)
- [ ] Rate limiting configurado
- [ ] Logs centralizados (Sentry, DataDog, etc.)
- [ ] Webhooks registrados en proveedores
- [ ] Backups de BD programados
- [ ] Monitoreo de errores activado
- [ ] Tests E2E ejecutados
- [ ] Load testing realizado

## 🔄 Próximos Pasos Opcionales

1. **Swagger UI** (30 min)
   ```bash
   npm install swagger-ui-express
   # Agregar en index.ts
   ```

2. **PayPal Webhooks** (30 min)
   - Implementar verificación de firma

3. **Frontend PWA** (3-4 horas)
   - UI React para tomar órdenes
   - Seleccionar items del menú
   - Procesar pagos

4. **E2E Tests** (2 horas)
   - Playwright tests
   - Flujo completo: login → crear orden → pagar

5. **Monitoreo** (1 hora)
   - Sentry para errors
   - DataDog para APM

## ❓ Troubleshooting

### "jwt malformed"
→ Token incorrecto o expirado, login de nuevo

### "Order not found"
→ Verificar que orderId sea válido (UUID)

### Database connection refused
→ `docker-compose ps` → verificar postgres está corriendo

### "Role user is not authorized"
→ Solo admin puede crear usuarios, usar cuenta admin

## 📚 Documentación

- `/docs/PAYMENT_FLOW.md` - Flujo de pagos
- `/docs/WEBHOOK_TESTING.md` - Testing webhooks
- `/QUICKSTART.md` - Setup rápido
- `/backend/README.md` - API reference

---

**✨ Backend completamente funcional y listo para frontend!**

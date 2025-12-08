# 📚 Swagger UI Documentation

## Quick Start

Después de iniciar el backend, accede a:

```
http://localhost:3000/api/docs
```

## Características

✅ **Documentación Interactiva** - Visualiza todos los endpoints  
✅ **Try It Out** - Prueba los endpoints directamente desde el navegador  
✅ **Autorización JWT** - Configura el token de autenticación  
✅ **Request/Response Examples** - Ve ejemplos de requests y responses  
✅ **Schemas** - Documentación de todas las estructuras de datos  

## Uso Básico

### 1. Login para Obtener Token JWT

1. Abre http://localhost:3000/api/docs
2. Busca el endpoint `POST /api/v1/auth/login`
3. Click en "Try it out"
4. Ingresa las credenciales:
```json
{
  "email": "waiter@testrestaurant.com",
  "password": "password_waiter"
}
```
5. Click en "Execute"
6. Copia el `token` de la respuesta

### 2. Autorizar en Swagger

1. Click en el botón "Authorize" (arriba a la derecha)
2. En el campo de Bearer token, pega: `tu_token_aqui`
3. Click en "Authorize"
4. Ahora puedes usar endpoints protegidos

### 3. Probar Endpoints

Todos los endpoints están organizados por categorías (tags):

- **Authentication** - Login, register, verify token
- **Orders** - Crear, listar, actualizar órdenes
- **Menus** - Gestión de menus e items
- **Payments** - Procesar pagos y reembolsos
- **Webhooks** - Endpoints para webhooks de proveedores
- **Health** - Health check del servidor

## Endpoints Disponibles

### Authentication (Sin autenticación)

```
POST   /api/v1/auth/login                  - Login con email/password
POST   /api/v1/auth/register               - Registrar nuevo usuario (admin-only)
POST   /api/v1/auth/verify                 - Verificar validez del token
POST   /api/v1/auth/logout                 - Logout del usuario
```

### Orders (Requiere JWT)

```
POST   /api/v1/orders                      - Crear nueva orden
GET    /api/v1/orders                      - Listar todas las órdenes
GET    /api/v1/orders/{orderId}            - Obtener detalles de una orden
PUT    /api/v1/orders/{orderId}            - Actualizar orden (status, tip, discount)
DELETE /api/v1/orders/{orderId}            - Cancelar orden
POST   /api/v1/orders/{orderId}/items      - Agregar item a una orden
```

### Menus (GET sin autenticación, POST/PUT/DELETE con JWT)

```
GET    /api/v1/menus/{restaurantId}       - Listar menus de un restaurante
GET    /api/v1/menus/{restaurantId}/{menuId} - Obtener menu con items
POST   /api/v1/menus                      - Crear nuevo item de menu
PUT    /api/v1/menus/{id}                 - Actualizar item de menu
DELETE /api/v1/menus/{id}                 - Eliminar item de menu
```

### Payments (Requiere JWT)

```
POST   /api/v1/payments/process            - Procesar pago
GET    /api/v1/payments/{paymentId}        - Obtener detalles del pago
POST   /api/v1/payments/{paymentId}/refund - Reembolsar pago
```

### Webhooks (Sin autenticación)

```
POST   /api/v1/webhooks/stripe             - Webhook de Stripe
POST   /api/v1/webhooks/square             - Webhook de Square
POST   /api/v1/webhooks/mercado-pago       - Webhook de Mercado Pago
POST   /api/v1/webhooks/paypal             - Webhook de PayPal
```

### Health

```
GET    /health                             - Health check del servidor
```

## Test Users (Disponibles después de `npm run seed`)

```
Email: admin@testrestaurant.com
Password: password_admin
Role: admin

Email: manager@testrestaurant.com
Password: password_manager
Role: manager

Email: waiter@testrestaurant.com
Password: password_waiter
Role: waiter

Email: cashier@testrestaurant.com
Password: password_cashier
Role: cashier
```

## Ejemplo: Crear y Pagar una Orden

### Paso 1: Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "waiter@testrestaurant.com",
    "password": "password_waiter"
  }'
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "waiter@testrestaurant.com",
    "name": "Test Waiter",
    "role": "waiter",
    "restaurantId": "uuid"
  }
}
```

### Paso 2: Crear Orden
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "restaurant-uuid",
    "tableId": "table-uuid",
    "waiterId": "waiter-uuid",
    "items": [
      {
        "menuItemId": "item-uuid",
        "quantity": 2
      }
    ]
  }'
```

### Paso 3: Obtener Detalles de Orden
```bash
curl -X GET http://localhost:3000/api/v1/orders/{orderId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Paso 4: Procesar Pago
```bash
curl -X POST http://localhost:3000/api/v1/payments/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-uuid",
    "provider": "stripe",
    "amount": 110.00,
    "currency": "USD",
    "token": "payment-token-from-stripe",
    "metadata": {"description": "Restaurant order"}
  }'
```

## Troubleshooting

### "No authorization value has been provided"
- Necesitas hacer login primero y obtener el token
- Usa el endpoint `/api/v1/auth/login`
- Luego copia el token y autoriza en Swagger

### "404 Not Found"
- Verifica que el servidor esté ejecutándose: `npm run dev`
- Confirma que la ruta sea correcta (check endpoint path)
- Verifica que uses los UUIDs correctos

### "401 Unauthorized"
- El token puede haber expirado (válido por 24 horas)
- Obtén un nuevo token con login

### CORS Error
- El backend está configurado para CORS `*`
- Si persiste, verifica headers en `src/index.ts`

## Ver la Especificación OpenAPI Completa

La especificación completa está disponible en:

```
GET http://localhost:3000/api/docs.json
```

También puedes ver el archivo fuente en:
```
backend/src/swagger.ts
```

## Archivo de Especificación

El archivo `backend/src/swagger.ts` contiene la especificación OpenAPI 3.0 completa con:
- Descripción de todos los endpoints
- Schemas de request/response
- Ejemplos de datos
- Información de seguridad (JWT)
- Tags para organizar endpoints

Si necesitas actualizar la documentación, edita este archivo y el cambio se reflejará inmediatamente en Swagger UI.

---

**¡Listo! Ahora puedes explorar toda la API interactivamente en http://localhost:3000/api/docs** 🚀

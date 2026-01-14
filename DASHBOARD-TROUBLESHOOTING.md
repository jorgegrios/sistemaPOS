# Solución de Problemas - Dashboard "Failed to Fetch"

## Problema
El Dashboard muestra el error "Failed to fetch" al intentar cargar el resumen del día.

## Soluciones

### 1. Verificar que el Backend esté corriendo

```bash
cd backend
npm run dev
```

El backend debe estar corriendo en `http://localhost:3000`

### 2. Verificar que la migración de `restaurant_config` esté ejecutada

```bash
cd backend
npm run migrate:up
```

Esto creará la tabla `restaurant_config` necesaria para almacenar la base inicial de caja.

### 3. Verificar la conexión a la base de datos

Asegúrate de que el archivo `backend/.env` tenga la configuración correcta:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_base_datos
```

### 4. Verificar que el token de autenticación sea válido

El Dashboard requiere autenticación. Asegúrate de estar logueado correctamente.

### 5. Verificar la consola del navegador

Abre las herramientas de desarrollador (F12) y revisa:
- **Console**: Para ver errores de JavaScript
- **Network**: Para ver si la petición al endpoint `/api/v1/dashboard/daily-summary` está fallando

### 6. Verificar logs del backend

Revisa los logs del backend para ver si hay errores SQL o de conexión:

```bash
# En la terminal donde corre el backend
# Deberías ver logs como:
# [Dashboard] Getting daily summary for restaurant: ...
# [Dashboard] Summary generated: ...
```

## Endpoint del Dashboard

El endpoint es:
```
GET /api/v1/dashboard/daily-summary
```

Requiere autenticación JWT (header `Authorization: Bearer <token>`)

## Estructura de la respuesta

```json
{
  "date": "2024-01-15",
  "totalOrders": 10,
  "completedOrders": 8,
  "pendingOrders": 2,
  "cancelledOrders": 0,
  "totalSales": 1250.50,
  "cashAmount": 500.00,
  "cardAmount": 750.50,
  "kitchenSales": 800.00,
  "barSales": 450.50,
  "baseAmount": 100.00,
  "orders": [...]
}
```

## Si el problema persiste

1. Verifica que todas las tablas existan en la base de datos:
   - `orders`
   - `order_items`
   - `payment_transactions`
   - `menu_items`
   - `menu_categories`
   - `restaurant_config` (puede no existir si no se ejecutó la migración)

2. Verifica que haya datos en las tablas (al menos algunas órdenes del día)

3. Revisa los logs del backend para errores específicos de SQL








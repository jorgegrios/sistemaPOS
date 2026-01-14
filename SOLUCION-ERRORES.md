# Solución de Errores - Dashboard y CreateOrderPage

## Errores Encontrados

### 1. "Failed to fetch" / "net::ERR_FAILED"
**Causa**: El backend no está corriendo o no está accesible en `http://localhost:3000`

**Solución**:
```bash
# Terminal 1: Iniciar el backend
cd backend
npm run dev
```

El backend debe estar corriendo y mostrar algo como:
```
Server running on port 3000
```

### 2. "menuItems is not defined" en CreateOrderPage
**Causa**: Caché del navegador con código antiguo

**Solución**:
1. Limpia la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
2. O reinicia el servidor de desarrollo del frontend:
```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
cd frontend
npm run dev
```

### 3. "pendingOrders is not defined" en DashboardPage
**Causa**: Caché del navegador con código antiguo

**Solución**: Igual que el error anterior, limpiar caché o reiniciar el servidor.

### 4. "Stripe is not configured" (503 Service Unavailable)
**Causa**: Stripe no está configurado en el backend

**Solución**: Esto es normal si no has configurado Stripe. El sistema funcionará sin Stripe, pero los pagos con tarjeta no estarán disponibles. Para configurar Stripe:

1. Agrega las variables de entorno en `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

2. Reinicia el backend

## Pasos para Iniciar el Sistema Correctamente

### 1. Iniciar el Backend
```bash
cd backend
npm run dev
```

Verifica que veas:
- `Server running on port 3000`
- Sin errores de conexión a la base de datos

### 2. Iniciar el Frontend
```bash
cd frontend
npm run dev
```

Verifica que veas:
- `Local: http://localhost:5173`

### 3. Verificar la Base de Datos
Asegúrate de que PostgreSQL esté corriendo y que la conexión esté correcta en `backend/.env`:
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_base_datos
```

### 4. Ejecutar Migraciones (si es necesario)
```bash
cd backend
npm run migrate:up
```

## Verificación Rápida

1. **Backend corriendo**: Abre `http://localhost:3000/api/v1/health` en el navegador. Deberías ver una respuesta JSON.

2. **Frontend corriendo**: Abre `http://localhost:5173`. Deberías ver la página de login.

3. **Base de datos**: Verifica que PostgreSQL esté corriendo:
```bash
psql -U usuario -d nombre_base_datos -c "SELECT 1;"
```

## Si los Errores Persisten

1. **Limpia completamente la caché**:
   - Cierra todas las pestañas del navegador
   - Abre las herramientas de desarrollador (F12)
   - Click derecho en el botón de recargar → "Vaciar caché y recargar de forma forzada"

2. **Reinicia ambos servidores**:
   - Detén el backend (Ctrl+C)
   - Detén el frontend (Ctrl+C)
   - Inicia ambos de nuevo

3. **Verifica los logs**:
   - Revisa la consola del navegador (F12 → Console)
   - Revisa los logs del backend en la terminal

4. **Verifica la conexión**:
   - Asegúrate de que el backend esté en `http://localhost:3000`
   - Asegúrate de que el frontend esté en `http://localhost:5173`
   - Verifica que no haya firewalls bloqueando las conexiones








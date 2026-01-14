# Iniciar el Backend

## Problema
Si ves errores como "Failed to fetch" o "ERR_FAILED" en la consola del navegador, significa que el backend no está corriendo.

## Solución

### 1. Abre una terminal y navega al directorio del backend:
```bash
cd /Users/juang/Documents/sistemaPOS/backend
```

### 2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

### 3. Verifica que veas:
```
Server running on port 3000
Database connected
```

### 4. Si hay errores de conexión a la base de datos:
- Verifica que PostgreSQL esté corriendo
- Verifica que el archivo `backend/.env` tenga la configuración correcta:
  ```env
  DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_base_datos
  ```

### 5. Si hay errores de dependencias:
```bash
cd backend
npm install
```

## Verificación Rápida

Abre en tu navegador: `http://localhost:3000/api/v1/health`

Deberías ver una respuesta JSON. Si no ves nada, el backend no está corriendo.

## Nota sobre Stripe

El error "Stripe is not configured" (503) es normal si no has configurado Stripe. El sistema funcionará sin Stripe, pero los pagos con tarjeta no estarán disponibles.








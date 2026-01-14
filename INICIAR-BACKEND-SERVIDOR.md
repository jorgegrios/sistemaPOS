# 🚀 Guía: Iniciar Backend en el Servidor

Esta guía explica cómo iniciar el backend del sistema POS en un servidor de producción.

---

## 📋 Opciones Disponibles

### 1️⃣ **Desarrollo Local** (Solo para pruebas)
### 2️⃣ **Producción con PM2** ⭐ (Recomendado para servidor)
### 3️⃣ **Producción con npm** (Simple, sin gestión de procesos)
### 4️⃣ **Docker** (Si usas contenedores)

---

## 🎯 Opción 1: Desarrollo Local

**Solo para desarrollo y pruebas locales:**

```bash
cd /Users/juang/Documents/sistemaPOS/backend
npm run dev
```

- ✅ Auto-reload cuando cambias código
- ✅ Logs detallados
- ❌ Se detiene si cierras la terminal
- ❌ No reinicia automáticamente si falla

**Puerto:** `http://localhost:3000`

---

## ⭐ Opción 2: Producción con PM2 (RECOMENDADO)

PM2 es un gestor de procesos que mantiene el backend corriendo, reinicia automáticamente si falla, y gestiona logs.

### Paso 1: Instalar PM2 (si no lo tienes)

```bash
npm install -g pm2
```

### Paso 2: Compilar el Backend

```bash
cd /Users/juang/Documents/sistemaPOS/backend
npm install
npm run build
```

### Paso 3: Crear Directorio de Logs

```bash
mkdir -p logs
```

### Paso 4: Verificar Variables de Entorno

Asegúrate de tener un archivo `.env` en `/Users/juang/Documents/sistemaPOS/backend/` con:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/pos_system
JWT_SECRET=tu_secret_jwt_aqui
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=production
```

### Paso 5: Iniciar con PM2

```bash
cd /Users/juang/Documents/sistemaPOS/backend
pm2 start ecosystem.config.js
```

### Paso 6: Verificar Estado

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs sistema-pos-backend

# Ver información detallada
pm2 info sistema-pos-backend
```

### Comandos PM2 Útiles

```bash
# Detener la aplicación
pm2 stop sistema-pos-backend

# Reiniciar la aplicación
pm2 restart sistema-pos-backend

# Eliminar de PM2
pm2 delete sistema-pos-backend

# Ver logs
pm2 logs sistema-pos-backend

# Monitoreo en tiempo real
pm2 monit

# Guardar configuración para auto-inicio
pm2 save
pm2 startup  # Sigue las instrucciones que aparecen
```

### Verificar que Funciona

```bash
# Verificar que responde
curl http://localhost:3000/health

# O en el navegador
# http://localhost:3000/health
```

---

## 🔧 Opción 3: Producción con npm (Simple)

**Para servidores simples sin PM2:**

### Paso 1: Compilar

```bash
cd /Users/juang/Documents/sistemaPOS/backend
npm install
npm run build
```

### Paso 2: Iniciar

```bash
npm start
```

**⚠️ Problema:** Se detiene si cierras la terminal. Usa `nohup` o `screen`:

```bash
# Con nohup (ejecuta en segundo plano)
nohup npm start > logs/backend.log 2>&1 &

# O con screen
screen -S backend
npm start
# Presiona Ctrl+A luego D para desconectar
```

---

## 🐳 Opción 4: Docker

Si usas Docker Compose:

```bash
cd /Users/juang/Documents/sistemaPOS
docker-compose up -d backend
```

Ver logs:
```bash
docker-compose logs -f backend
```

---

## ✅ Verificación Post-Inicio

Después de iniciar, verifica que todo funciona:

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Debería responder:
```json
{"status":"ok","timestamp":"2024-01-11T..."}
```

### 2. Swagger UI

Abre en el navegador:
```
http://localhost:3000/api/docs
```

### 3. Login de Prueba

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testrestaurant.com",
    "password": "password_admin"
  }'
```

---

## 🔍 Troubleshooting

### Error: "Cannot find module"
```bash
cd backend
npm install
npm run build
```

### Error: "Port 3000 already in use"
```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# O cambiar el puerto en .env
PORT=3001
```

### Error: "Database connection refused"
- Verifica que PostgreSQL esté corriendo
- Verifica `DATABASE_URL` en `.env`
- Prueba la conexión:
```bash
psql $DATABASE_URL
```

### PM2 no inicia
```bash
# Ver logs de error
pm2 logs sistema-pos-backend --err

# Verificar que dist/index.js existe
ls -la backend/dist/index.js
```

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```bash
# Con PM2
pm2 logs sistema-pos-backend

# Con Docker
docker-compose logs -f backend

# Con npm (si usas nohup)
tail -f logs/backend.log
```

### Verificar Uso de Recursos

```bash
# Con PM2
pm2 monit

# Con sistema
top -p $(pgrep -f "node.*dist/index.js")
```

---

## 🔄 Actualizar el Backend

Cuando hagas cambios:

```bash
cd /Users/juang/Documents/sistemaPOS/backend

# 1. Detener (si usas PM2)
pm2 stop sistema-pos-backend

# 2. Actualizar código (git pull, etc.)

# 3. Instalar dependencias (si hay cambios)
npm install

# 4. Recompilar
npm run build

# 5. Reiniciar
pm2 restart sistema-pos-backend

# 6. Verificar logs
pm2 logs sistema-pos-backend
```

---

## 🌐 Configurar Nginx (Opcional)

Si quieres usar un dominio y HTTPS:

```nginx
server {
    listen 80;
    server_name api.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📝 Resumen Rápido (PM2)

```bash
# 1. Compilar
cd backend && npm install && npm run build

# 2. Iniciar
pm2 start ecosystem.config.js

# 3. Verificar
pm2 status
curl http://localhost:3000/health

# 4. Ver logs
pm2 logs sistema-pos-backend
```

---

**✅ ¡Listo! Tu backend debería estar corriendo en el servidor.**



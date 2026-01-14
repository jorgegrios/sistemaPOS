# 🌐 Configuración de Red - Frontend

Esta guía explica cómo el frontend está configurado para conectarse al backend cuando se accede desde otros dispositivos en la red WiFi.

---

## ✅ Configuración Actual

El frontend está configurado para:

1. **Escuchar en todas las interfaces de red** (`0.0.0.0`)
2. **Detectar automáticamente** si se accede desde el mismo dispositivo o desde otro
3. **Usar la IP correcta** del backend según el contexto
4. **Proxy inteligente** que funciona tanto local como remotamente

---

## 🔧 Cómo Funciona

### Detección Automática

El frontend detecta automáticamente el contexto:

1. **Mismo dispositivo** (`localhost` o `127.0.0.1`):
   - Usa el proxy de Vite: `/api/v1`
   - Más eficiente y rápido

2. **Otro dispositivo** (IP de red, ej: `192.168.1.100`):
   - Construye la URL directamente: `http://192.168.1.100:3000/api/v1`
   - Se conecta directamente al backend sin proxy

### Configuración del Proxy

El proxy de Vite está configurado para:
- Apuntar a la IP local del servidor (no solo `localhost`)
- Funcionar cuando se accede desde el mismo dispositivo
- Permitir conexiones directas cuando se accede desde otro dispositivo

---

## 🚀 Uso

### Desarrollo Local (Mismo Dispositivo)

```bash
cd frontend
npm run dev
```

Accede desde el mismo dispositivo:
- `http://localhost:5173`
- El frontend usará el proxy automáticamente

### Acceso desde Otro Dispositivo

1. **Inicia el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Obtén la IP del servidor:**
   ```bash
   # En Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # En Windows
   ipconfig
   ```

3. **Accede desde otro dispositivo:**
   ```
   http://TU_IP_LOCAL:5173
   ```

4. **El frontend detectará automáticamente** que está en otro dispositivo y se conectará directamente al backend usando la IP.

---

## ⚙️ Configuración Avanzada

### Variables de Entorno

Puedes configurar manualmente la URL del backend:

**`frontend/.env`:**
```env
# Opción 1: URL completa del backend
VITE_API_URL=http://192.168.1.100:3000/api/v1

# Opción 2: Puerto del backend (si usas IP diferente)
VITE_BACKEND_PORT=3000
```

### Configuración del Proxy (vite.config.ts)

El proxy está configurado para usar la IP local automáticamente:

```typescript
proxy: {
  '/api': {
    target: `http://${LOCAL_IP}:3000`,
    changeOrigin: true,
    rewrite: (path) => path
  }
}
```

---

## 🔍 Verificación

### 1. Verificar que el Frontend Escucha en la Red

Al iniciar el frontend, deberías ver:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

### 2. Verificar la Conexión al Backend

Abre la consola del navegador (F12) y verifica:

- **Mismo dispositivo:** Las requests van a `/api/v1/...`
- **Otro dispositivo:** Las requests van a `http://192.168.1.100:3000/api/v1/...`

### 3. Probar la Conexión

1. Abre `http://TU_IP:5173` desde otro dispositivo
2. Intenta hacer login
3. Verifica en la consola del navegador que las requests se están haciendo correctamente

---

## 🐛 Troubleshooting

### Error: "Failed to fetch" o "Network Error"

**Causa:** El frontend no puede conectarse al backend.

**Solución:**
1. Verifica que el backend esté corriendo y escuchando en `0.0.0.0`
2. Verifica que el puerto 3000 esté abierto en el firewall
3. Verifica que ambos dispositivos estén en la misma red WiFi
4. Prueba acceder directamente al backend: `http://TU_IP:3000/health`

### Error: "CORS policy blocked"

**Causa:** El backend está bloqueando las conexiones CORS.

**Solución:**
1. Verifica la configuración de CORS en el backend
2. Asegúrate de que el backend permita conexiones desde la IP del frontend
3. En desarrollo, el backend debería permitir todas las conexiones

### El Frontend No Detecta la IP Correcta

**Causa:** La detección automática no funcionó.

**Solución:**
1. Configura manualmente `VITE_API_URL` en `frontend/.env`:
   ```env
   VITE_API_URL=http://TU_IP_BACKEND:3000/api/v1
   ```
2. Reinicia el servidor de desarrollo

### Proxy No Funciona

**Causa:** El proxy de Vite solo funciona cuando se accede desde el mismo dispositivo.

**Solución:**
- Esto es normal. Cuando accedes desde otro dispositivo, el frontend se conecta directamente al backend (sin proxy).
- El proxy solo se usa cuando accedes desde `localhost`.

---

## 📱 Ejemplo Completo

### Escenario: Acceso desde Tablet

1. **Servidor (Mac/PC):**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   # Backend en: http://192.168.1.100:3000
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   # Frontend en: http://192.168.1.100:5173
   ```

2. **Tablet (misma red WiFi):**
   - Abre navegador
   - Ve a: `http://192.168.1.100:5173`
   - El frontend detectará que está en otro dispositivo
   - Se conectará automáticamente a: `http://192.168.1.100:3000/api/v1`

3. **Resultado:**
   - ✅ Login funciona
   - ✅ Todas las requests van al backend correcto
   - ✅ No hay errores de CORS
   - ✅ Todo funciona como si fuera local

---

## 🔐 Seguridad

### Desarrollo

- ✅ Permite conexiones desde cualquier dispositivo en la red local
- ⚠️ No usar en producción sin configuración adecuada

### Producción

- ✅ Configurar `VITE_API_URL` con la URL del backend de producción
- ✅ Usar HTTPS en producción
- ✅ Configurar CORS en el backend para orígenes específicos

---

## 📝 Resumen

- ✅ Frontend escucha en `0.0.0.0` (todas las interfaces)
- ✅ Detección automática de contexto (mismo dispositivo vs otro)
- ✅ Proxy inteligente para mismo dispositivo
- ✅ Conexión directa para otros dispositivos
- ✅ Configuración flexible mediante variables de entorno

**¡El frontend está listo para funcionar desde cualquier dispositivo en la red!** 🎉



# 🔧 Solución: "Failed to fetch"

Esta guía te ayudará a diagnosticar y solucionar el error "Failed to fetch" cuando accedes desde otro dispositivo.

---

## 🔍 Diagnóstico Paso a Paso

### Paso 1: Verificar que el Backend Esté Corriendo

```bash
# En el servidor, verifica que el backend esté corriendo
cd backend
npm run dev
```

**Debes ver:**
```
✅ Backend listening on:
   - Local: http://localhost:3000
   - Red local: http://192.168.1.8:3000
```

Si no ves esto, el backend no está corriendo. Inícialo primero.

---

### Paso 2: Verificar Acceso Directo al Backend

Desde el otro dispositivo, intenta acceder directamente al backend:

```
http://TU_IP_BACKEND:3000/health
```

**Ejemplo:** `http://192.168.1.8:3000/health`

**Debe responder:**
```json
{"ok": true, "ts": 1234567890}
```

**Si no responde:**
- El backend no está accesible desde la red
- Verifica que el backend esté escuchando en `0.0.0.0`
- Verifica que el firewall permita conexiones en el puerto 3000

---

### Paso 3: Verificar la URL que Usa el Frontend

Abre la consola del navegador (F12) en el otro dispositivo y verifica:

1. Ve a la pestaña **"Console"**
2. Busca errores de red
3. Ve a la pestaña **"Network"**
4. Intenta hacer una acción (ej: login)
5. Busca la request que falla
6. Verifica la URL que está usando

**URL esperada cuando accedes desde otro dispositivo:**
```
http://192.168.1.8:3000/api/v1/auth/login
```

**Si la URL es incorrecta:**
- El frontend no está detectando correctamente la IP
- Necesitas configurar `VITE_API_URL` manualmente

---

### Paso 4: Verificar CORS

Si ves errores de CORS en la consola, el backend está bloqueando las conexiones.

**Solución:** Verifica que el backend permita CORS (ya configurado, pero verifica que esté funcionando).

---

## 🔧 Soluciones

### Solución 1: Configurar VITE_API_URL Manualmente

Si el frontend no detecta correctamente la IP, configura manualmente:

**1. Obtén la IP del backend:**
```bash
# En el servidor
ifconfig | grep "inet " | grep -v 127.0.0.1
# O
ipconfig  # Windows
```

**2. Crea/edita `frontend/.env`:**
```env
VITE_API_URL=http://192.168.1.8:3000/api/v1
```

**Reemplaza `192.168.1.8` con tu IP real.**

**3. Reinicia el frontend:**
```bash
cd frontend
# Detén el servidor (Ctrl+C)
npm run dev
```

**4. Prueba de nuevo desde el otro dispositivo**

---

### Solución 2: Verificar que el Backend Esté Escuchando en 0.0.0.0

**Verifica en `backend/src/index.ts`:**

```typescript
server.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

**Debe decir `'0.0.0.0'`, no `'localhost'` o `'127.0.0.1'`.**

Si está mal, cámbialo y reinicia el backend.

---

### Solución 3: Verificar Firewall

**En Mac:**
```bash
# Verificar si hay firewall activo
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Si está activo, permitir Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

**En Linux:**
```bash
# Permitir puerto 3000
sudo ufw allow 3000
sudo ufw allow 5173
```

**En Windows:**
- Ve a "Windows Defender Firewall"
- Permite Node.js y los puertos 3000 y 5173

---

### Solución 4: Verificar que Ambos Estén en la Misma Red

**En el servidor:**
```bash
# Verifica tu IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**En el otro dispositivo:**
- Verifica que esté conectado a la misma red WiFi
- Verifica la IP del dispositivo (debe estar en el mismo rango, ej: `192.168.1.x`)

---

### Solución 5: Agregar Logging para Diagnosticar

Agrega logging temporal para ver qué URL está usando el frontend:

**En `frontend/src/utils/api-config.ts`, agrega:**

```typescript
export function getApiBaseUrl(): string {
  // ... código existente ...
  
  const url = /* resultado final */;
  console.log('[API Config] URL base:', url);
  console.log('[API Config] Hostname:', window.location.hostname);
  console.log('[API Config] Es localhost:', isLocalhost);
  
  return url;
}
```

Esto te mostrará en la consola qué URL está usando el frontend.

---

## 🐛 Troubleshooting Específico

### Error: "Network request failed"

**Causa:** El frontend no puede alcanzar el backend.

**Soluciones:**
1. Verifica que el backend esté corriendo
2. Verifica que ambos estén en la misma red
3. Verifica el firewall
4. Configura `VITE_API_URL` manualmente

### Error: "CORS policy blocked"

**Causa:** El backend está bloqueando las conexiones CORS.

**Soluciones:**
1. Verifica que el backend permita CORS (ya configurado)
2. Verifica que `NODE_ENV=development` o `CORS_ORIGIN` esté configurado
3. Reinicia el backend

### Error: "Connection refused"

**Causa:** El backend no está escuchando en la IP correcta.

**Soluciones:**
1. Verifica que el backend esté escuchando en `0.0.0.0`
2. Verifica que el puerto 3000 esté abierto
3. Verifica que no haya otro proceso usando el puerto 3000

### La URL es Correcta pero Sigue Fallando

**Causa:** Puede ser un problema de red o firewall.

**Soluciones:**
1. Prueba hacer ping desde el otro dispositivo:
   ```bash
   ping 192.168.1.8
   ```
2. Prueba acceder directamente al backend desde el navegador:
   ```
   http://192.168.1.8:3000/health
   ```
3. Si el ping funciona pero el navegador no, es un problema de firewall

---

## ✅ Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] El backend está corriendo
- [ ] El backend muestra "Red local: http://TU_IP:3000"
- [ ] Puedes acceder a `http://TU_IP:3000/health` desde el otro dispositivo
- [ ] Ambos dispositivos están en la misma red WiFi
- [ ] El firewall permite conexiones en los puertos 3000 y 5173
- [ ] `VITE_API_URL` está configurado correctamente (si es necesario)
- [ ] El backend está escuchando en `0.0.0.0`
- [ ] No hay errores en la consola del navegador

---

## 📝 Ejemplo de Configuración Correcta

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
```

### Frontend (.env)
```env
VITE_API_URL=http://192.168.1.8:3000/api/v1
```

**Reemplaza `192.168.1.8` con tu IP real.**

---

## 🚀 Solución Rápida (Recomendada)

**1. Obtén tu IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**2. Configura el frontend:**
```bash
cd frontend
echo "VITE_API_URL=http://TU_IP:3000/api/v1" > .env
```

**3. Reinicia el frontend:**
```bash
npm run dev
```

**4. Prueba desde el otro dispositivo:**
```
http://TU_IP:5173
```

---

**Si después de seguir estos pasos sigue fallando, comparte:**
- El error exacto de la consola del navegador
- La URL que está intentando usar el frontend
- Si puedes acceder a `http://TU_IP:3000/health` desde el otro dispositivo



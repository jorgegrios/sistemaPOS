# 📱 Guía de Acceso desde Red WiFi

Esta guía explica cómo interpretar las direcciones que muestra Vite y cómo acceder desde otros dispositivos.

---

## 📡 Direcciones Mostradas por Vite

Cuando inicias el frontend con `npm run dev`, Vite muestra todas las interfaces de red disponibles:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.8:5173/
➜  Network: http://192.168.1.9:5173/
➜  Network: http://100.118.141.86:5173/
```

### ¿Qué significa cada una?

#### 1. **Local: http://localhost:5173/**
- ✅ Solo funciona desde el mismo dispositivo
- ✅ Usa proxy automático de Vite
- ✅ Más rápido para desarrollo local
- ❌ No funciona desde otros dispositivos

#### 2. **Network: http://192.168.1.8:5173/** ⭐ (Recomendada)
- ✅ IP de tu red WiFi local
- ✅ Funciona desde cualquier dispositivo en la misma red WiFi
- ✅ El frontend detectará automáticamente que estás en otro dispositivo
- ✅ Se conectará al backend usando esta IP

#### 3. **Network: http://192.168.1.9:5173/**
- Puede ser otra interfaz de red (Ethernet, segunda WiFi, etc.)
- Usa esta si los dispositivos están en esa red específica

#### 4. **Network: http://100.118.141.86:5173/**
- Probablemente una VPN o red virtual
- Solo funciona si estás conectado a esa red específica
- Generalmente no usar para acceso local

---

## 🚀 Cómo Acceder desde Otro Dispositivo

### Paso 1: Identifica la IP Correcta

Usa la IP que corresponde a tu red WiFi local (generalmente `192.168.x.x` o `10.x.x.x`).

**Ejemplo:** `http://192.168.1.8:5173/`

### Paso 2: Asegúrate de que Ambos Estén en la Misma Red

- ✅ Ambos dispositivos deben estar en la misma red WiFi
- ✅ Verifica que el firewall permita conexiones en el puerto 5173

### Paso 3: Accede desde el Otro Dispositivo

1. Abre el navegador en el otro dispositivo (tablet, teléfono, otra computadora)
2. Ingresa la URL: `http://192.168.1.8:5173/`
3. El frontend se cargará automáticamente

### Paso 4: Verifica la Conexión

El frontend detectará automáticamente que estás en otro dispositivo y:
- ✅ Se conectará al backend usando: `http://192.168.1.8:3000/api/v1`
- ✅ No usará el proxy (porque no puede)
- ✅ Todo debería funcionar normalmente

---

## 🔍 Verificar que Funciona

### 1. Desde el Mismo Dispositivo

```bash
# Abre en el navegador
http://localhost:5173
```

- Debería cargar normalmente
- Las requests van a `/api/v1/...` (proxy)

### 2. Desde Otro Dispositivo

```bash
# Abre en el navegador del otro dispositivo
http://192.168.1.8:5173
```

- Debería cargar normalmente
- Las requests van a `http://192.168.1.8:3000/api/v1/...` (directo)

### 3. Verificar en la Consola del Navegador

Abre las herramientas de desarrollador (F12) y verifica:

**Mismo dispositivo:**
```
Request URL: http://localhost:5173/api/v1/auth/login
```

**Otro dispositivo:**
```
Request URL: http://192.168.1.8:3000/api/v1/auth/login
```

---

## 🐛 Troubleshooting

### No Puedo Acceder desde Otro Dispositivo

**Problema:** Error de conexión o página no carga.

**Soluciones:**
1. Verifica que ambos dispositivos estén en la misma red WiFi
2. Verifica que el firewall permita conexiones en el puerto 5173
3. Prueba con otra IP de la lista (puede que tu dispositivo esté en otra red)
4. Verifica que el frontend esté corriendo

### Error: "Failed to fetch" o "Network Error"

**Problema:** El frontend no puede conectarse al backend.

**Soluciones:**
1. Verifica que el backend esté corriendo en `http://192.168.1.8:3000`
2. Prueba acceder directamente al backend: `http://192.168.1.8:3000/health`
3. Verifica que el backend esté escuchando en `0.0.0.0` (ya configurado)
4. Verifica la configuración de CORS en el backend

### Múltiples IPs - ¿Cuál Usar?

**Problema:** Vite muestra varias IPs y no sabes cuál usar.

**Solución:**
1. Usa la IP que empieza con `192.168.x.x` o `10.x.x.x` (red local)
2. Evita IPs que empiecen con `100.x.x.x` o `172.x.x.x` (pueden ser VPNs)
3. Prueba cada una hasta encontrar la que funciona

### El Frontend Carga pero No se Conecta al Backend

**Problema:** La página carga pero las requests fallan.

**Solución:**
1. Verifica en la consola del navegador qué URL está usando
2. Asegúrate de que el backend esté corriendo en esa IP
3. Verifica que el backend permita CORS desde esa IP
4. Prueba configurar manualmente `VITE_API_URL` en `frontend/.env`:
   ```env
   VITE_API_URL=http://192.168.1.8:3000/api/v1
   ```

---

## 📝 Ejemplo Completo

### Escenario: Acceso desde Tablet

**Servidor (Mac/PC):**
```bash
# Terminal 1: Backend
cd backend
npm run dev
# Backend muestra: http://192.168.1.8:3000

# Terminal 2: Frontend
cd frontend
npm run dev
# Frontend muestra:
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.1.8:5173/
```

**Tablet (misma red WiFi):**
1. Abre navegador
2. Ve a: `http://192.168.1.8:5173`
3. El frontend se carga
4. Intenta hacer login
5. ✅ Todo funciona

**Verificación:**
- Abre consola del navegador (F12)
- Ve a la pestaña "Network"
- Intenta hacer login
- Verifica que las requests vayan a: `http://192.168.1.8:3000/api/v1/auth/login`

---

## ✅ Resumen

- ✅ **Múltiples IPs es normal** - Vite muestra todas las interfaces de red
- ✅ **Usa la IP de tu WiFi local** (generalmente `192.168.x.x`)
- ✅ **El frontend detecta automáticamente** si estás en otro dispositivo
- ✅ **Se conecta directamente al backend** usando la IP correcta
- ✅ **No requiere configuración adicional** - todo es automático

**¡Todo está funcionando correctamente!** 🎉



# 🌐 Configuración de Red - Backend

Esta guía explica cómo el backend está configurado para aceptar conexiones de red.

---

## ✅ Configuración Actual

El backend está configurado para:

1. **Escuchar en todas las interfaces de red** (`0.0.0.0`)
2. **Aceptar conexiones CORS** desde cualquier origen en desarrollo
3. **Configurable para producción** mediante variables de entorno

---

## 🔧 Configuración de CORS

### Desarrollo (NODE_ENV=development)

En modo desarrollo, el backend **acepta conexiones desde cualquier origen**, incluyendo:
- `localhost`
- IPs de la red local (ej: `192.168.1.100`)
- Cualquier dispositivo en la misma red

**No requiere configuración adicional.**

### Producción

En producción, puedes configurar orígenes permitidos mediante la variable de entorno `CORS_ORIGIN`.

#### Opción 1: Permitir todas las conexiones

```env
# .env
CORS_ORIGIN=*
```

O simplemente no definir `CORS_ORIGIN` (por defecto permite todas).

#### Opción 2: Permitir orígenes específicos

```env
# .env
CORS_ORIGIN=http://192.168.1.100:5173,http://192.168.1.101:5173,https://mi-dominio.com
```

Puedes especificar múltiples orígenes separados por comas.

---

## 📋 Características de CORS

### Headers Permitidos

- `Content-Type`
- `Authorization` (para JWT tokens)
- `X-Requested-With`

### Métodos HTTP Permitidos

- `GET`
- `POST`
- `PUT`
- `DELETE`
- `PATCH`
- `OPTIONS`

### Credentials

Las cookies y headers de autenticación están habilitados (`credentials: true`).

---

## 🚀 Cómo Usar

### 1. Desarrollo Local

```bash
cd backend
npm run dev
```

El backend estará disponible en:
- `http://localhost:3000` (desde la misma máquina)
- `http://TU_IP_LOCAL:3000` (desde otros dispositivos en la red)

### 2. Producción

```bash
# Configurar .env
CORS_ORIGIN=https://mi-dominio.com,https://app.mi-dominio.com

# Compilar y ejecutar
npm run build
npm start
```

---

## 🔍 Verificar Configuración

Al iniciar el backend, verás en la consola:

```
✅ Backend listening on:
   - Local: http://localhost:3000
   - Red local: http://192.168.1.100:3000
🌐 CORS: Permite todas las conexiones (desarrollo)
```

O en producción:

```
🌐 CORS: Orígenes permitidos: https://mi-dominio.com,https://app.mi-dominio.com
```

---

## 📱 Acceso desde Dispositivos Móviles

### En la misma red WiFi:

1. **Obtén la IP local del servidor:**
   ```bash
   # En Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # En Windows
   ipconfig
   ```

2. **Accede desde tu dispositivo móvil:**
   ```
   http://TU_IP_LOCAL:3000
   ```

3. **Configura el frontend para usar esa IP:**
   ```env
   # frontend/.env
   VITE_API_URL=http://TU_IP_LOCAL:3000/api/v1
   ```

---

## 🔐 Seguridad

### Desarrollo

- ✅ Permite todas las conexiones (útil para testing)
- ⚠️ No usar en producción sin configuración

### Producción

- ✅ Configurar `CORS_ORIGIN` con orígenes específicos
- ✅ Usar HTTPS en producción
- ✅ Validar orígenes en cada request

---

## 🐛 Troubleshooting

### Error: "CORS policy blocked"

**Solución:**
1. Verifica que `CORS_ORIGIN` esté configurado correctamente
2. En desarrollo, asegúrate de que `NODE_ENV=development`
3. Verifica que el origen del frontend coincida con los permitidos

### No puedo acceder desde otro dispositivo

**Solución:**
1. Verifica que el backend esté escuchando en `0.0.0.0` (ya configurado)
2. Verifica que el firewall permita conexiones en el puerto 3000
3. Asegúrate de que ambos dispositivos estén en la misma red

### Error de conexión

**Solución:**
1. Verifica la IP del servidor: `ifconfig` o `ipconfig`
2. Verifica que el puerto 3000 esté abierto
3. Prueba desde el mismo dispositivo primero: `http://localhost:3000/health`

---

## 📝 Ejemplo de Configuración Completa

### Backend (.env)

```env
# Servidor
PORT=3000
NODE_ENV=development

# CORS (opcional en desarrollo)
CORS_ORIGIN=*

# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/pos_system

# JWT
JWT_SECRET=tu-secret-key-aqui
```

### Frontend (.env)

```env
# Para desarrollo local
VITE_API_URL=http://localhost:3000/api/v1

# Para acceso desde red local
# VITE_API_URL=http://192.168.1.100:3000/api/v1
```

---

## ✅ Resumen

- ✅ Backend escucha en `0.0.0.0` (todas las interfaces)
- ✅ CORS configurado para desarrollo y producción
- ✅ Permite conexiones desde cualquier dispositivo en la red
- ✅ Configurable mediante variables de entorno
- ✅ Seguro y flexible

**¡El backend está listo para aceptar conexiones de red!** 🎉



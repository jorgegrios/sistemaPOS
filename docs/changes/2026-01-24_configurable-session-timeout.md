# Make Session Timeout Configurable per Company

**Fecha**: 2026-01-24  
**Tipo**: Enhancement  
**Componentes**: Backend (Migration, Auth API), Frontend (Auth Context)

## 🎯 Objective

Hacer que el timeout de sesión sea configurable por empresa en vez de estar hardcodeado.

## ✅ Implementation

### 1. Database Migration

**File**: `backend/migrations/1737735114000_add-session-timeout-to-companies.js`

- ✅ Agregado campo `session_timeout_minutes` a tabla `companies`
- ✅ Tipo: `integer`, NOT NULL, DEFAULT 20
- ✅ Comentario descriptivo

### 2. Backend - Login Response

**File**: `backend/src/routes/auth.ts`

Actualizado endpoint `/v1/auth/login`:
- ✅ Query a `companies` para obtener `session_timeout_minutes`
- ✅ Incluido `sessionTimeoutMinutes` en respuesta de login
- ✅ Valor por defecto: 20 minutos si no está configurado

### 3. Frontend - Auth Service

**File**: `frontend/src/services/auth-service.ts`

- ✅ Agregado `sessionTimeoutMinutes` a interfaces `User` y `LoginResponse`
- ✅ Guardado en localStorage al login
- ✅ Método `getSessionTimeout()` para recuperar valor

### 4. Frontend - Auth Context

**File**: `frontend/src/contexts/auth-context.tsx`

- ✅ Estado `sessionTimeout` con default de 20 minutos
- ✅ useEffect para actualizar timeout cuando user cambia
- ✅ `useInactivityTimeout` usa valor dinámico
- ✅ Log en consola del timeout configurado

## 📊 Configuration

### Por SQL

```sql
-- Ver configuración actual
SELECT id, name, slug, session_timeout_minutes FROM companies;

-- Configurar timeout para una empresa
UPDATE companies 
SET session_timeout_minutes = 30 
WHERE slug = 'mi-restaurante';
```

### Ejemplos de Configuración

| Tipo de Empresa | Timeout Sugerido |
|-----------------|------------------|
| Restaurante pequeño | 15-20 minutos |
| Restaurante grande | 20-30 minutos |
| Oficina corporativa | 30-60 minutos |
| Kiosco público | 5-10 minutos |

## 🔧 How It Works

1. Usuario hace login
2. Backend consulta `session_timeout_minutes` de la empresa
3. Retorna valor en respuesta de login
4. Frontend guarda en localStorage
5. AuthProvider usa valor dinámico en `useInactivityTimeout`
6. Timer se configura automáticamente

## 🧪 Testing

### 1. Ejecutar Migración

```bash
npm run migrate:up
```

### 2. Configurar Empresa

```sql
UPDATE companies 
SET session_timeout_minutes = 1 
WHERE slug = 'default';
```

### 3. Probar

1. Login con usuario
2. Verificar en Network tab: `sessionTimeoutMinutes: 1`
3. Verificar en localStorage: `sessionTimeoutMinutes`
4. Esperar 1 minuto sin actividad
5. Verificar que aparece advertencia

### 4. Verificar Logs

```
[Auth] Session timeout set to 1 minutes from company settings
[Auth] Inactivity warning triggered
```

## 🎯 Benefits

- ✅ **Configurable**: Cada empresa define su timeout
- ✅ **Flexible**: Fácil ajustar por SQL
- ✅ **Default seguro**: 20 minutos si no configurado
- ✅ **Sin código**: Solo configuración en BD
- ✅ **Backward compatible**: Funciona con empresas existentes

## 📝 Future Enhancement

Agregar UI en settings page para que admins configuren el timeout sin SQL.

# Implement Session Timeout and Auto-Logout

**Fecha**: 2026-01-24  
**Tipo**: Security Feature  
**Componentes**: Frontend (Auth Context, Custom Hook, Modal)

## 🎯 Objective

Implementar cierre automático de sesión después de 20 minutos de inactividad para prevenir acceso no autorizado.

## ✅ Implementation

### 1. Custom Hook - useInactivityTimeout

**File**: `frontend/src/hooks/useInactivityTimeout.ts` (NUEVO)

- ✅ Detecta eventos de usuario (mouse, keyboard, touch, scroll, click)
- ✅ Resetea timer automáticamente con cualquier actividad
- ✅ Configurable: timeout y warning period
- ✅ Cleanup automático al desmontar

### 2. Warning Modal Component

**File**: `frontend/src/components/InactivityWarningModal.tsx` (NUEVO)

- ✅ Modal con countdown de 30 segundos
- ✅ Dos opciones: "Continuar Sesión" o "Cerrar Sesión"
- ✅ Animación pulse para llamar atención
- ✅ Diseño responsive

### 3. Integration in AuthProvider

**File**: `frontend/src/contexts/auth-context.tsx`

Integrado timeout con configuración:
- **20 minutos** de inactividad → Muestra advertencia
- **30 segundos** de advertencia → Logout automático
- Logs en consola para debugging

## 🔧 Configuration

### Tiempos Configurados

```typescript
timeoutMinutes: 20,  // 20 minutos de inactividad
warningSeconds: 30,  // 30 segundos de advertencia
```

### Eventos Detectados

- `mousedown` - Click del mouse
- `keydown` - Teclas presionadas
- `scroll` - Scroll en página
- `touchstart` - Touch en dispositivos móviles
- `click` - Clicks en general

## 📊 User Flow

```
Usuario trabajando normalmente
    ↓
20 minutos sin actividad
    ↓
⏰ Modal aparece: "Sesión por expirar en 30 segundos"
    ↓
Usuario tiene 2 opciones:
    ├─ Click "Continuar Sesión" → Timer se resetea, continúa trabajando
    └─ Click "Cerrar Sesión" → Logout inmediato
    ↓
Si no hace nada (30 segundos)
    ↓
Logout automático → Redirect a /login
```

## 🎯 Benefits

- ✅ **Seguridad mejorada**: Previene acceso no autorizado
- ✅ **Advertencia clara**: 30 segundos para responder
- ✅ **Detección inteligente**: Cualquier actividad resetea timer
- ✅ **UX amigable**: Modal visual con countdown
- ✅ **Logs detallados**: Fácil debugging

## 🧪 Testing

### Escenarios de Prueba

1. **Inactividad total**:
   - No tocar nada por 20 minutos
   - Verificar modal de advertencia aparece
   - Esperar 30 segundos
   - Verificar logout automático y redirect a /login

2. **Continuar sesión**:
   - Esperar 20 minutos
   - Click en "Continuar Sesión"
   - Verificar modal desaparece
   - Verificar timer se resetea

3. **Actividad constante**:
   - Mover mouse cada 15 minutos
   - Verificar que nunca aparece advertencia

4. **Logout manual**:
   - Esperar advertencia
   - Click en "Cerrar Sesión"
   - Verificar logout inmediato

## 📝 Logs

En consola verás:
```
[Auth] Inactivity warning triggered
[Auth] User chose to stay logged in
[Auth] Auto-logout due to inactivity
```

## ⚙️ Customization

Para ajustar tiempos, editar en `auth-context.tsx`:

```typescript
const { resetTimer } = useInactivityTimeout({
  timeoutMinutes: 20,  // Cambiar aquí
  warningSeconds: 30,  // Cambiar aquí
  // ...
});
```

# Add Stripe Payment to CashierPage

**Fecha**: 2026-01-24  
**Tipo**: Feature Integration  
**Componentes**: Frontend (CashierPage, StripePaymentModal), Backend (Integration)

## 🎯 Objective

Agregar Stripe como método de pago funcional en la página `/cashier`, conectándolo con el `StripeProvider` ya implementado.

## ✅ Implementation

### 1. StripePaymentModal Component

**File**: `frontend/src/components/StripePaymentModal.tsx` (NUEVO)

- ✅ Modal con campos para tarjeta (número, vencimiento, CVC)
- ✅ Botón "Usar Tarjeta de Prueba" para testing rápido
- ✅ Validación de campos
- ✅ Estado de procesamiento
- ✅ Diseño responsive y touch-friendly

### 2. CashierPage Integration

**File**: `frontend/src/pages/CashierPage.tsx`

**Cambios realizados:**
- ✅ Importado `StripePaymentModal`
- ✅ Agregado estado `showStripeModal`
- ✅ Modificado `handleProcessPayment()` para mostrar modal cuando `paymentMethod === 'card'`
- ✅ Creado `handleStripePaymentSuccess()` para procesar pago con Stripe
- ✅ Agregado modal al render

### 3. Payment Service Types

**File**: `frontend/src/domains/payments/service.ts`

- ✅ Agregado campo `cardToken?: string` a `CreatePaymentRequest`
- ✅ Permite enviar Stripe payment method ID al backend

### 4. Backend Integration

**Ya existente** (implementado anteriormente):
- ✅ `StripeProvider` en `backend/src/domains/payments/providers.ts`
- ✅ `PaymentProviderFactory` configurado
- ✅ Credenciales de Stripe en `.env`

## 🔧 Configuration

### Habilitar Stripe para Empresa

Ejecutar SQL:
```sql
UPDATE companies 
SET payment_settings = '{"type": "stripe"}'::jsonb
WHERE slug = 'default';
```

Script: `docs/changes/configure-stripe-company.sql`

## 📊 User Flow

```
Usuario en CashierPage
    ↓
Selecciona mesa con orden
    ↓
Click en botón "💳 Tarjeta"
    ↓
Se abre StripePaymentModal
    ↓
Usuario ingresa datos de tarjeta (o usa tarjeta de prueba)
    ↓
Click "Pagar $XX.XX"
    ↓
Frontend crea payment con cardToken
    ↓
Backend usa StripeProvider.processPayment()
    ↓
Stripe procesa el pago
    ↓
Orden se marca como pagada
    ↓
Mesa cambia a estado "Pagada"
```

## 🧪 Testing

### 1. Tarjeta de Prueba

En el modal, click en "🧪 Usar Tarjeta de Prueba":
- Número: `4242 4242 4242 4242`
- Vencimiento: `12/25`
- CVC: `123`

### 2. Flujo Completo

1. Ir a `/cashier`
2. Seleccionar una mesa con orden
3. Click en botón "💳 Tarjeta"
4. Ingresar tarjeta de prueba
5. Click "Pagar"
6. Verificar:
   - Toast: "✅ Pago con Stripe procesado exitosamente"
   - Orden cerrada
   - Mesa en estado "Pagada"

### 3. Verificar en Stripe Dashboard

https://dashboard.stripe.com/test/payments

Deberías ver el pago procesado.

## 🎨 UI Features

- **Modal responsive**: Funciona en móvil y desktop
- **Botón de prueba**: Rellena automáticamente tarjeta de prueba
- **Validación visual**: Campos requeridos
- **Loading state**: Botón muestra "Procesando..." durante pago
- **Seguridad visual**: Mensaje "🔒 Pago seguro procesado por Stripe"

## 🎯 Benefits

- ✅ Pagos reales con tarjeta de crédito/débito
- ✅ Integración completa con Stripe
- ✅ UI intuitiva y fácil de usar
- ✅ Testing simple con tarjetas de prueba
- ✅ Mismo flujo que otros métodos de pago

## 📝 Next Steps (Optional)

### Mejoras Futuras

1. **Stripe Elements**: Integrar componentes oficiales de Stripe para captura segura
   ```bash
   npm install @stripe/stripe-js @stripe/react-stripe-js
   ```

2. **Guardar tarjetas**: Permitir guardar métodos de pago para clientes frecuentes

3. **3D Secure**: Soporte automático para autenticación adicional

4. **Múltiples monedas**: Configurar según ubicación del restaurante

## ⚠️ Important Notes

1. **Test Mode**: Actualmente usa credenciales de prueba
2. **Payment Method ID**: Por ahora usa `pm_card_visa` (token de prueba)
3. **Production**: Para producción, implementar Stripe.js real
4. **PCI Compliance**: Nunca almacenar números de tarjeta completos

## 🔗 Related Files

- `frontend/src/components/StripePaymentModal.tsx` - Modal de pago
- `frontend/src/pages/CashierPage.tsx` - Integración
- `frontend/src/domains/payments/service.ts` - Tipos actualizados
- `backend/src/domains/payments/providers.ts` - StripeProvider
- `docs/changes/configure-stripe-company.sql` - Script de configuración

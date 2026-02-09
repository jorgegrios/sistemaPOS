# Configure Stripe Payment Integration

**Fecha**: 2026-01-24  
**Tipo**: Feature  
**Componentes**: Backend (Payments), Frontend (Configuration)

## 🎯 Objective

Integrar Stripe como proveedor de pagos usando credenciales de prueba.

## ✅ Implementation

### 1. Backend - Environment Variables

**File**: `.env`

Agregadas credenciales de Stripe:
```env
STRIPE_SECRET_KEY=sk_test_51Sj7p33sc7AfEjdV...
STRIPE_WEBHOOK_SECRET=whsec_f495a2c0bfd4e3279d1cdd408d0ac0312f402485025ce82bbe3938d924c41aa2
```

### 2. Backend - StripeProvider Implementation

**File**: `backend/src/domains/payments/providers.ts`

- ✅ Implementada clase `StripeProvider`
- ✅ Integración con Stripe SDK v12.14.0
- ✅ Procesamiento de pagos con Payment Intents
- ✅ Manejo de errores robusto
- ✅ Logging detallado

**Características**:
- Convierte montos a centavos automáticamente
- Confirma pagos inmediatamente
- Retorna tarjeta enmascarada (************4242)
- Maneja errores de Stripe (card_declined, etc.)

### 3. Backend - PaymentProviderFactory

Actualizado para usar `StripeProvider` real:
```typescript
case 'stripe':
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        console.warn('[PaymentProviderFactory] Stripe key not found');
        return new MockProvider();
    }
    return new StripeProvider(stripeKey);
```

### 4. Frontend - Environment Variables

**File**: `frontend/.env`

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Sj7p33sc7AfEjdV...
```

## 🔧 Configuration

### Habilitar Stripe para una empresa

```sql
UPDATE companies 
SET payment_settings = jsonb_set(
    COALESCE(payment_settings, '{}'::jsonb),
    '{type}',
    '"stripe"'
)
WHERE id = 'your-company-id';
```

## 🧪 Testing

### Tarjetas de Prueba

| Escenario | Número | CVV | Fecha |
|-----------|--------|-----|-------|
| Éxito | 4242 4242 4242 4242 | 123 | Cualquier futura |
| Decline | 4000 0000 0000 0002 | 123 | Cualquier futura |
| 3D Secure | 4000 0025 0000 3155 | 123 | Cualquier futura |

### Verificación

1. **Logs del backend**:
```
[PaymentProviderFactory] Using Stripe Provider
[StripeProvider] Processing payment of $50.00...
[StripeProvider] Payment intent created: pi_xxxxx, status: succeeded
```

2. **Stripe Dashboard**: https://dashboard.stripe.com/test/payments

## 🎯 Benefits

- ✅ Pagos con tarjeta reales
- ✅ Soporte 3D Secure
- ✅ Dashboard de Stripe
- ✅ Webhooks disponibles
- ✅ Fácil cambio entre proveedores

## 📝 Next Steps

1. Configurar webhook endpoint (opcional)
2. Habilitar Stripe para empresas específicas
3. Probar con tarjetas de prueba

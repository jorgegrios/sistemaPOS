# Changelog - Sistema POS Restaurante

Este documento registra todos los cambios y adiciones realizados al proyecto.

## Formato

Cada cambio se documenta en un archivo individual en `docs/changes/` con el formato:
- `YYYY-MM-DD_descripcion-breve.md`

## Índice de Cambios

### 2026-01-24

1. [Manual Table Status Management](changes/2026-01-24_manual-table-status-management.md)
   - Implementación de UI para cambio manual de estado de mesas
   - Estados: available, occupied, reserved, dirty, paid

2. [Auto-Update Table Status After Payment](changes/2026-01-24_auto-update-table-status-after-payment.md)
   - Actualización automática de estado de mesa a "paid" después de confirmar pago
   - Integrado en PaymentsService

3. [Fix Table Status Inconsistency](changes/2026-01-24_fix-table-status-inconsistency.md)
   - Corregida inconsistencia de estados entre CashierPage y CreateOrderPage
   - Unificada lógica de determinación de estado
   - Agregados indicadores visuales para todos los estados especiales

4. [Fix Active Order After Payment](changes/2026-01-24_fix-active-order-after-payment.md)
   - Corregido: mesas pagadas ahora muestran estado "Pagada" en vez de "Con Orden"
   - Agregada verificación de `payment_status` en `getTablesWithOrders()`
   - Nuevos productos después de pago crean orden nueva

5. [Fix Language Change Button](changes/2026-01-24_fix-language-change-button.md)
   - Corregido: botón de cambio de idioma ahora funciona inmediatamente
   - Función `toggleLanguage` ahora es asíncrona y fuerza recarga
   - Idioma persiste correctamente en localStorage

6. [Add Missing Translations](changes/2026-01-24_add-missing-translations.md)
   - Agregadas traducciones faltantes para estados de mesa
   - Reemplazados textos hardcodeados en CreateOrderPage con t()
   - Soporte completo para inglés y español

7. [Stripe Payment Integration](changes/2026-01-24_stripe-payment-integration.md)
   - Implementada integración con Stripe como proveedor de pagos
   - Agregada clase StripeProvider con procesamiento de Payment Intents
   - Configuradas credenciales de prueba en .env
   - Soporte para tarjetas de crédito/débito

8. [Session Timeout and Auto-Logout](changes/2026-01-24_session-timeout-auto-logout.md)
   - Implementado timeout de sesión por inactividad (20 minutos)
   - Agregado modal de advertencia con countdown (30 segundos)
   - Logout automático para prevenir acceso no autorizado
   - Detección inteligente de actividad del usuario

9. [Configurable Session Timeout per Company](changes/2026-01-24_configurable-session-timeout.md)
   - Timeout de sesión ahora configurable por empresa en BD
   - Agregado campo `session_timeout_minutes` a tabla companies
   - Backend retorna timeout en login response
   - Frontend usa valor dinámico automáticamente

10. [Stripe Payment Integration in CashierPage](changes/2026-01-24_stripe-cashier-integration.md)
   - Agregado Stripe como método de pago en /cashier
   - Creado componente StripePaymentModal
   - Integrado con StripeProvider backend
   - Soporte para tarjetas de prueba y producción

---

**Nota**: Cada documento de cambio incluye:
- Objetivo del cambio
- Archivos modificados
- Código agregado/modificado
- Instrucciones de testing
- Consideraciones técnicas

# Add Missing Translations to CreateOrderPage

**Fecha**: 2026-01-24  
**Tipo**: Bugfix  
**Componentes**: Frontend (CreateOrderPage, i18n)

## 🐛 Problem

CreateOrderPage mostraba textos en español incluso cuando el idioma estaba configurado en inglés.

## 🔍 Root Cause

Los textos de estado de mesa estaban hardcodeados en español:
- "Con Orden"
- "Pagada"
- "Sucia"
- "Reservada"

## ✅ Solution

### 1. Agregadas traducciones faltantes

**Files**: 
- `frontend/src/locales/en/translation.json`
- `frontend/src/locales/es/translation.json`

Agregadas claves en sección `orders`:
```json
"table_select": "Select a Table" / "Selecciona una Mesa",
"table_select_hint": "Choose the table..." / "Elige la mesa...",
"back_to_tables": "Back to Tables" / "Volver a Mesas",
"with_order": "With Order" / "Con Orden",
"paid": "Paid" / "Pagada",
"dirty": "Dirty" / "Sucia",
"reserved": "Reserved" / "Reservada"
```

### 2. Actualizado CreateOrderPage

**File**: `frontend/src/pages/CreateOrderPage.tsx`

Reemplazados textos hardcodeados con llamadas a `t()`:

```typescript
// Antes
statusLabel = 'Con Orden';
statusLabel = 'Pagada';
statusLabel = 'Sucia';
statusLabel = 'Reservada';

// Después
statusLabel = t('orders.with_order');
statusLabel = t('orders.paid');
statusLabel = t('orders.dirty');
statusLabel = t('orders.reserved');
```

## 🎯 Benefits

- ✅ Textos cambian correctamente según idioma seleccionado
- ✅ Soporte completo para inglés y español
- ✅ Consistencia en toda la aplicación

## 🧪 Testing

1. Cambiar idioma a inglés (botón 🌐 EN)
2. Ir a página de pedidos
3. Verificar textos en inglés:
   - "Select a Table"
   - "With Order"
   - "Paid", "Dirty", "Reserved"
4. Cambiar a español
5. Verificar textos en español

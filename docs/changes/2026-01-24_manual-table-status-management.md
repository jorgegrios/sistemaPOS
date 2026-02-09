# Manual Table Status Management

**Fecha**: 2026-01-24  
**Tipo**: Feature  
**Componentes**: Frontend (UI)

## Objetivo

Implementar UI para que los meseros puedan cambiar manualmente el estado de las mesas mediante botones.

## Estados de Mesa

- `available` - Libre (🟢)
- `occupied` - Ocupada (🔴)
- `reserved` - Reservada (🟡)
- `dirty` - Necesita Limpieza (🟠)
- `paid` - Pagada (💰)

## Archivos Modificados

### Frontend

1. **`frontend/src/pages/TablesPage.tsx`**
   - Actualizado para usar `tablesDomainService`
   - Agregados botones de cambio rápido de estado
   - Indicadores visuales con colores y emojis

2. **`frontend/src/pages/TablePage.tsx`**
   - Actualizado para usar `tablesDomainService`
   - Botones de selección de estado (5 estados)
   - Visual feedback mejorado

## Código Clave

### Cambio de Estado
```typescript
const handleStatusChange = async (tableId: string, newStatus: string) => {
  await tablesDomainService.updateTable(tableId, { status: newStatus as any });
  toast.success(`Mesa marcada como: ${statusLabels[newStatus]}`);
  loadTables();
};
```

### Configuración Visual
```typescript
const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string; emoji: string }> = {
    available: { label: 'Libre', color: 'bg-green-100 text-green-700 border-green-300', emoji: '🟢' },
    occupied: { label: 'Ocupada', color: 'bg-red-100 text-red-700 border-red-300', emoji: '🔴' },
    reserved: { label: 'Reservada', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', emoji: '🟡' },
    dirty: { label: 'Necesita Limpieza', color: 'bg-orange-100 text-orange-700 border-orange-300', emoji: '🟠' },
    paid: { label: 'Pagada', color: 'bg-blue-100 text-blue-700 border-blue-300', emoji: '💰' }
  };
  return configs[status] || configs.available;
};
```

## Idempotencia

✅ **Mantenida**: Se reutilizó infraestructura existente
- API: `/v2/tables` (existente)
- Servicio: `tablesDomainService` (existente)
- Estados: Ya existían en base de datos
- **NO se modificó backend**

## Testing

1. Navegar a `/tables`
2. Verificar que cada mesa muestra su estado con color correcto
3. Hacer clic en botones de cambio de estado
4. Confirmar que el estado cambia y persiste al recargar

## Notas Técnicas

- Se eliminaron archivos antiguos que se habían modificado por error
- Se revirtieron cambios en rutas `/v1/tables` (deprecadas)
- Se usó arquitectura de dominios existente

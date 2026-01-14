# Sistema de Impresión de Minutas - Cocina y Bar

## 📋 Descripción

El sistema automáticamente imprime tickets (minutas) para cocina y bar cuando se crea una orden. Los items se clasifican automáticamente según su categoría.

## 🎯 Funcionalidades

### Impresión Automática
- ✅ Se imprime automáticamente cuando se crea una orden
- ✅ Separación automática entre items de cocina y bar
- ✅ Formato optimizado para impresoras térmicas
- ✅ Notificaciones en tiempo real vía Socket.io

### Clasificación de Items
Los items se clasifican automáticamente según la categoría del menú:
- **Cocina**: Items con `metadata.type = 'kitchen'` o sin metadata (default)
- **Bar**: Items con `metadata.type = 'bar'` o `metadata.type = 'drinks'`

### Formato de Tickets
Los tickets incluyen:
- Número de orden
- Mesa
- Hora de creación
- Items agrupados por categoría
- Notas especiales
- Timestamp de generación

## 🔧 Configuración

### 1. Configurar Categorías de Menú

Para que los items vayan al bar, configura la metadata de la categoría:

```sql
UPDATE menu_categories 
SET metadata = '{"type": "bar"}'::jsonb 
WHERE name = 'Bebidas';
```

O para cocina:
```sql
UPDATE menu_categories 
SET metadata = '{"type": "kitchen"}'::jsonb 
WHERE name = 'Platos Principales';
```

### 2. Migración de Base de Datos

Ejecuta la migración para crear la tabla de tickets:

```bash
npm run migrate:up
```

Esto creará:
- Tabla `kitchen_tickets` para tracking
- Columna `metadata` en `menu_categories`

## 📡 Socket.io Events

### Cliente se conecta a cocina:
```javascript
socket.emit('join_kitchen');
socket.on('kitchen_order', (data) => {
  // Recibir nueva orden para cocina
});
```

### Cliente se conecta a bar:
```javascript
socket.emit('join_bar');
socket.on('bar_order', (data) => {
  // Recibir nueva orden para bar
});
```

### Marcar ticket como completado:
```javascript
socket.emit('ticket_complete', {
  orderId: '...',
  type: 'kitchen' // o 'bar'
});
```

## 🖨️ Integración con Impresoras Térmicas

✅ **IMPLEMENTADO** - El sistema ahora soporta impresoras físicas automáticamente.

### Configuración

1. **Instala la dependencia** (ya instalada):
```bash
npm install node-thermal-printer
```

2. **Configura variables de entorno** en `.env`:
```bash
KITCHEN_PRINTER_INTERFACE=tcp://192.168.1.100:9100
KITCHEN_PRINTER_ENABLED=true
BAR_PRINTER_INTERFACE=tcp://192.168.1.101:9100
BAR_PRINTER_ENABLED=true
```

3. **Reinicia el servidor** - Las impresoras se inicializan automáticamente.

### Tipos de Impresoras Soportadas

- ✅ **Impresoras de Red (TCP/IP)** - Recomendado
- ✅ **Impresoras USB** - Linux, Windows, macOS
- ✅ **Impresoras Serial** - Puerto serie

### Ver Documentación Completa

Ver `README-PRINTERS.md` para:
- Configuración detallada
- Solución de problemas
- Endpoints API
- Ejemplos de uso

## 📊 Endpoints API

### Imprimir Tickets Manualmente
```bash
POST /api/v1/orders/:id/print-tickets
```

### Marcar Ticket como Completado
```bash
POST /api/v1/orders/:id/complete-ticket
Body: { "type": "kitchen" | "bar" }
```

## 🔄 Flujo de Trabajo

1. **Mesero crea orden** → `POST /api/v1/orders`
2. **Sistema clasifica items** → Cocina vs Bar
3. **Se imprimen tickets** → Automáticamente
4. **Notificación Socket.io** → Cocina/Bar reciben notificación
5. **Cocina/Bar completan** → Marcan ticket como completado
6. **Sistema actualiza estado** → Tracking completo

## 📝 Ejemplo de Ticket

```
╔═══════════════════════════════╗
║      COCINA / KITCHEN         ║
╠═══════════════════════════════╣
Orden: ORD-1234567890
Mesa: T5
Hora: 14:30:25
───────────────────────────────

[PLATOS PRINCIPALES]
2x Pollo a la Parrilla
   Nota: Sin cebolla
1x Pasta Carbonara

[BEBIDAS]
1x Agua Mineral

───────────────────────────────
Ticket generado: 15/01/2024, 14:30:25
╚═══════════════════════════════╝
```

## 🚀 Próximos Pasos

1. **Integrar impresoras físicas** - Conectar con impresoras térmicas reales
2. **KDS Integration** - Kitchen Display System para pantallas
3. **Reimpresión** - Permitir reimprimir tickets perdidos
4. **Estadísticas** - Tiempos de preparación y métricas
5. **Alertas** - Notificaciones cuando tickets están pendientes mucho tiempo

## 📚 Referencias

- [ESC/POS Protocol](https://reference.epson-biz.com/modules/ref_escpos/)
- [Socket.io Rooms](https://socket.io/docs/v4/rooms/)
- [node-thermal-printer](https://github.com/Klemen1337/node-thermal-printer)


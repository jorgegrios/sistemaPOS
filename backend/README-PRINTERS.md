# Integración con Impresoras Físicas

## 🖨️ Descripción

El sistema ahora soporta impresoras térmicas físicas para imprimir tickets de cocina y bar automáticamente cuando se crean órdenes.

## 📦 Dependencias Instaladas

- `node-thermal-printer` - Librería para impresoras ESC/POS

## ⚙️ Configuración

### Opción 1: Descubrimiento Automático (Recomendado) 🎯

El sistema puede detectar e instalar impresoras automáticamente. Ver `README-PRINTER-DISCOVERY.md` para más detalles.

```bash
# Habilitar descubrimiento automático
AUTO_DISCOVER_PRINTERS=true
```

### Opción 2: Configuración Manual

Si prefieres configurar manualmente, agrega estas variables a tu archivo `.env`:

```bash
# Impresora de Cocina
KITCHEN_PRINTER_INTERFACE=tcp://192.168.1.100:9100
KITCHEN_PRINTER_ENABLED=true

# Impresora de Bar
BAR_PRINTER_INTERFACE=tcp://192.168.1.101:9100
BAR_PRINTER_ENABLED=true
```

### Tipos de Interfaces Soportadas

#### 1. Impresoras de Red (TCP/IP) - Recomendado
```bash
KITCHEN_PRINTER_INTERFACE=tcp://192.168.1.100:9100
```
- **IP**: Dirección IP de la impresora
- **Puerto**: Generalmente 9100 (puerto estándar para impresoras de red)

#### 2. Impresoras USB
```bash
KITCHEN_PRINTER_INTERFACE=/dev/usb/lp0  # Linux
KITCHEN_PRINTER_INTERFACE=COM3           # Windows
KITCHEN_PRINTER_INTERFACE=/dev/tty.usbserial  # macOS
```

#### 3. Impresoras Serial
```bash
KITCHEN_PRINTER_INTERFACE=/dev/ttyS0  # Linux
KITCHEN_PRINTER_INTERFACE=COM1        # Windows
```

### Tipos de Impresoras Soportadas

El sistema soporta las siguientes marcas (configurado automáticamente como EPSON por defecto):
- **EPSON** (default)
- **STAR**
- **TANCA**
- **DARUMA**
- **BROTHER**
- **CUSTOM**

Para cambiar el tipo, modifica el código en `src/services/printerService.ts` o agrega variable de entorno (requiere modificación del código).

## 🔧 Configuración de Impresoras

### 1. Encontrar la IP de tu Impresora

#### En Windows:
1. Abre el Panel de Control → Dispositivos e Impresoras
2. Click derecho en la impresora → Propiedades
3. Ve a la pestaña "Puertos"
4. Busca la IP en la lista de puertos

#### En Linux/macOS:
```bash
# Escanear red local
nmap -p 9100 192.168.1.0/24

# O verificar si la impresora responde
telnet 192.168.1.100 9100
```

### 2. Configurar la Impresora en la Red

1. **Accede al panel de configuración de la impresora** (generalmente vía navegador web: `http://IP_IMPRESORA`)
2. **Configura IP estática** (recomendado)
3. **Habilita el puerto 9100** (Raw Printing / AppSocket)
4. **Verifica conectividad**:
   ```bash
   ping 192.168.1.100
   telnet 192.168.1.100 9100
   ```

### 3. Probar la Impresora

Usa el endpoint de prueba:
```bash
curl -X POST http://localhost:3000/api/v1/printers/kitchen/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📡 Endpoints API

### Listar Impresoras Configuradas
```bash
GET /api/v1/printers
```

Respuesta:
```json
{
  "printers": [
    {
      "name": "Kitchen Printer",
      "type": "kitchen",
      "interface": "tcp://192.168.1.100:9100",
      "printerType": "epson",
      "enabled": true,
      "connected": true,
      "status": "online"
    }
  ]
}
```

### Obtener Estado de una Impresora
```bash
GET /api/v1/printers/:type/status
```

Ejemplo:
```bash
GET /api/v1/printers/kitchen/status
GET /api/v1/printers/bar/status
```

### Enviar Test Print
```bash
POST /api/v1/printers/:type/test
```

Ejemplo:
```bash
POST /api/v1/printers/kitchen/test
POST /api/v1/printers/bar/test
```

### Imprimir Contenido Personalizado
```bash
POST /api/v1/printers/:type/print
Content-Type: application/json

{
  "content": "Texto a imprimir\nLínea 2\nLínea 3"
}
```

## 🔄 Flujo de Impresión Automática

1. **Mesero crea orden** → `POST /api/v1/orders`
2. **Sistema clasifica items** → Cocina vs Bar
3. **Se intenta imprimir físicamente** → Si la impresora está disponible
4. **Fallback a consola** → Si la impresora no está disponible
5. **Tracking en BD** → Todos los tickets se guardan

## 🛠️ Solución de Problemas

### La impresora no imprime

1. **Verificar conectividad**:
   ```bash
   ping IP_IMPRESORA
   telnet IP_IMPRESORA 9100
   ```

2. **Verificar estado de la impresora**:
   ```bash
   GET /api/v1/printers/kitchen/status
   ```

3. **Revisar logs del servidor**:
   ```bash
   tail -f logs/app.log
   ```

4. **Probar impresión manual**:
   ```bash
   echo "TEST" | nc IP_IMPRESORA 9100
   ```

### Error: "Printer not connected"

- Verifica que la impresora esté encendida
- Verifica la IP y puerto en las variables de entorno
- Verifica que el firewall permita conexiones al puerto 9100
- Prueba con `telnet IP 9100` desde el servidor

### Error: "Timeout"

- Aumenta el timeout en `printerService.ts`:
  ```typescript
  options: {
    timeout: 10000  // 10 segundos
  }
  ```

### Caracteres especiales no se muestran correctamente

- Cambia el `characterSet` en la configuración:
  ```typescript
  characterSet: CharacterSet.PC852_LATIN2  // Para español
  ```

## 📋 Formato de Tickets

Los tickets se imprimen con el siguiente formato:

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

───────────────────────────────
NOTA: Sin gluten
───────────────────────────────
15/01/2024, 14:30:25
╚═══════════════════════════════╝
```

## 🔐 Seguridad

- Las rutas de impresoras requieren autenticación JWT (`verifyToken`)
- Las impresoras deben estar en una red privada/VLAN
- Considera usar firewall para restringir acceso al puerto 9100

## 📚 Referencias

- [node-thermal-printer GitHub](https://github.com/Klemen1337/node-thermal-printer)
- [ESC/POS Protocol](https://reference.epson-biz.com/modules/ref_escpos/)
- [Impresoras Térmicas Comunes](https://www.epson.com/products/printers/thermal-printers)

## 🚀 Próximos Pasos

1. **Múltiples Impresoras por Tipo** - Soporte para varias impresoras de cocina
2. **Reimpresión** - Endpoint para reimprimir tickets perdidos
3. **Estadísticas** - Tracking de impresiones exitosas/fallidas
4. **Notificaciones** - Alertas cuando impresoras están offline
5. **Auto-reconexión** - Reintentar conexión automáticamente


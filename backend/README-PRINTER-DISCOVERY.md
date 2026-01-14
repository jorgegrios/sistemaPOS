# 🔍 Descubrimiento Automático de Impresoras

## 📋 Descripción

El sistema ahora detecta e instala automáticamente las impresoras térmicas en la red, sin necesidad de configuración manual. Funciona como un sistema plug-and-play.

## ✨ Funcionalidades

### Detección Automática
- ✅ **Escaneo de red** - Detecta impresoras en la red local
- ✅ **Auto-configuración** - Asigna impresoras a cocina/bar automáticamente
- ✅ **Detección de tipo** - Identifica el tipo de impresora (EPSON, STAR, etc.)
- ✅ **Persistencia** - Guarda configuración en base de datos
- ✅ **Escaneo periódico** - Opcional, detecta nuevas impresoras automáticamente

### Asignación Inteligente
- Primera impresora encontrada → Cocina
- Segunda impresora encontrada → Bar
- Si hay nombres en la impresora, detecta por palabras clave (kitchen, bar, cocina, bebidas)

## 🚀 Uso

### 1. Descubrimiento Automático al Iniciar

El sistema escanea automáticamente la red al iniciar (por defecto habilitado):

```bash
# Habilitado por defecto
AUTO_DISCOVER_PRINTERS=true

# Deshabilitar si prefieres configuración manual
AUTO_DISCOVER_PRINTERS=false
```

### 2. Descubrimiento Manual vía API

```bash
# Iniciar escaneo manual
POST /api/v1/printers/discover

# Con opciones personalizadas
POST /api/v1/printers/discover
Content-Type: application/json

{
  "ipRange": "192.168.1.0/24",
  "ports": [9100, 515, 631],
  "timeout": 2000
}
```

### 3. Ver Impresoras Descubiertas

```bash
GET /api/v1/printers/discovered
```

Respuesta:
```json
{
  "printers": [
    {
      "ip": "192.168.1.100",
      "port": 9100,
      "type": "kitchen",
      "printerType": "epson",
      "status": "online",
      "interface": "tcp://192.168.1.100:9100",
      "lastSeen": "2024-01-15T14:30:00Z"
    },
    {
      "ip": "192.168.1.101",
      "port": 9100,
      "type": "bar",
      "printerType": "epson",
      "status": "online",
      "interface": "tcp://192.168.1.101:9100",
      "lastSeen": "2024-01-15T14:30:00Z"
    }
  ]
}
```

### 4. Asignar Impresora Manualmente

Si el sistema no asignó correctamente, puedes hacerlo manualmente:

```bash
POST /api/v1/printers/kitchen/assign
Content-Type: application/json

{
  "interface": "tcp://192.168.1.100:9100"
}
```

## ⚙️ Configuración

### Variables de Entorno

```bash
# Habilitar descubrimiento automático al iniciar
AUTO_DISCOVER_PRINTERS=true

# Escaneo periódico (opcional, en minutos)
PRINTER_DISCOVERY_INTERVAL=30

# Rango de IP a escanear (opcional, por defecto detecta automáticamente)
PRINTER_DISCOVERY_IP_RANGE=192.168.1.0/24

# Puertos a escanear (opcional, por defecto: 9100, 515, 631)
PRINTER_DISCOVERY_PORTS=9100,515,631
```

### Escaneo Periódico

Para detectar nuevas impresoras automáticamente:

```bash
# Escanear cada 30 minutos
PRINTER_DISCOVERY_INTERVAL=30

# Escanear cada hora
PRINTER_DISCOVERY_INTERVAL=60

# Deshabilitar escaneo periódico (solo al iniciar)
# No configurar PRINTER_DISCOVERY_INTERVAL
```

## 🔄 Flujo de Trabajo

1. **Al iniciar el servidor**:
   - Carga configuraciones existentes de BD
   - Si `AUTO_DISCOVER_PRINTERS=true`, escanea la red
   - Auto-configura impresoras encontradas
   - Inicializa servicio de impresión

2. **Durante operación**:
   - Si `PRINTER_DISCOVERY_INTERVAL` está configurado, escanea periódicamente
   - Actualiza estado de impresoras
   - Detecta nuevas impresoras

3. **Al crear orden**:
   - Usa impresoras auto-configuradas
   - Si no hay impresoras, fallback a consola

## 📊 Base de Datos

El sistema crea dos tablas automáticamente:

### `printer_configs`
Almacena la configuración activa de impresoras:
- `type`: 'kitchen' o 'bar'
- `interface`: Dirección de la impresora
- `auto_discovered`: Si fue detectada automáticamente

### `discovered_printers`
Almacena todas las impresoras descubiertas:
- Historial de impresoras encontradas
- Estado y última vez vista
- Permite tracking de disponibilidad

## 🛠️ Solución de Problemas

### No se detectan impresoras

1. **Verificar conectividad**:
   ```bash
   ping IP_IMPRESORA
   telnet IP_IMPRESORA 9100
   ```

2. **Verificar firewall**:
   - El servidor debe poder hacer conexiones salientes
   - Puerto 9100 debe estar abierto en la red

3. **Verificar rango de IP**:
   ```bash
   # Verificar que el rango sea correcto
   GET /api/v1/printers/discovered
   ```

4. **Escaneo manual con opciones**:
   ```bash
   POST /api/v1/printers/discover
   {
     "ipRange": "192.168.1.0/24",
     "ports": [9100],
     "timeout": 5000
   }
   ```

### Impresoras detectadas pero no asignadas

1. **Asignar manualmente**:
   ```bash
   POST /api/v1/printers/kitchen/assign
   { "interface": "tcp://192.168.1.100:9100" }
   ```

2. **Verificar nombres**:
   - Si las impresoras tienen nombres, el sistema intenta detectar por palabras clave
   - "kitchen", "cocina" → Cocina
   - "bar", "bebidas" → Bar

### Escaneo muy lento

- Reduce el rango de IP:
  ```bash
  PRINTER_DISCOVERY_IP_RANGE=192.168.1.0/24  # Solo 254 IPs
  ```

- Reduce puertos a escanear:
  ```bash
  PRINTER_DISCOVERY_PORTS=9100  # Solo puerto común
  ```

- Aumenta timeout:
  ```bash
  # En el request
  { "timeout": 1000 }  # 1 segundo por IP
  ```

## 📝 Ejemplo Completo

```bash
# 1. Iniciar servidor (auto-descubre)
npm start

# 2. Ver impresoras descubiertas
curl http://localhost:3000/api/v1/printers/discovered \
  -H "Authorization: Bearer TOKEN"

# 3. Ver impresoras configuradas
curl http://localhost:3000/api/v1/printers \
  -H "Authorization: Bearer TOKEN"

# 4. Probar impresión
curl -X POST http://localhost:3000/api/v1/printers/kitchen/test \
  -H "Authorization: Bearer TOKEN"

# 5. Crear orden (se imprime automáticamente)
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "table-1",
    "waiterId": "waiter-1",
    "items": [...]
  }'
```

## 🎯 Ventajas

1. **Sin configuración manual** - Todo automático
2. **Plug and Play** - Conecta impresora y funciona
3. **Auto-recuperación** - Detecta impresoras que se reconectan
4. **Tracking completo** - Historial de todas las impresoras
5. **Flexible** - Puedes deshabilitar y usar configuración manual

## 📚 Referencias

- [node-thermal-printer](https://github.com/Klemen1337/node-thermal-printer)
- [Network Printer Discovery](https://en.wikipedia.org/wiki/Network_printer_discovery)








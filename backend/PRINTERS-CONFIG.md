# Configuración de Impresoras - Variables de Entorno

## Variables Requeridas

Agrega estas variables a tu archivo `.env`:

```bash
# ============================================
# CONFIGURACIÓN DE IMPRESORAS TÉRMICAS
# ============================================

# Impresora de Cocina
# Formato TCP/IP: tcp://IP:PUERTO
# Formato USB: /dev/usb/lp0 (Linux) o COM3 (Windows)
KITCHEN_PRINTER_INTERFACE=tcp://192.168.1.100:9100
KITCHEN_PRINTER_ENABLED=true

# Impresora de Bar
BAR_PRINTER_INTERFACE=tcp://192.168.1.101:9100
BAR_PRINTER_ENABLED=true
```

## Ejemplos de Configuración

### Impresora de Red (Recomendado)
```bash
KITCHEN_PRINTER_INTERFACE=tcp://192.168.1.100:9100
BAR_PRINTER_INTERFACE=tcp://192.168.1.101:9100
```

### Impresora USB (Linux)
```bash
KITCHEN_PRINTER_INTERFACE=/dev/usb/lp0
BAR_PRINTER_INTERFACE=/dev/usb/lp1
```

### Impresora USB (Windows)
```bash
KITCHEN_PRINTER_INTERFACE=COM3
BAR_PRINTER_INTERFACE=COM4
```

### Impresora USB (macOS)
```bash
KITCHEN_PRINTER_INTERFACE=/dev/tty.usbserial
BAR_PRINTER_INTERFACE=/dev/tty.usbserial-141
```

### Deshabilitar Impresora Temporalmente
```bash
KITCHEN_PRINTER_ENABLED=false
BAR_PRINTER_ENABLED=false
```

## Verificación

Después de configurar, reinicia el servidor y verifica:

```bash
# Ver estado de impresoras
curl http://localhost:3000/api/v1/printers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Probar impresión
curl -X POST http://localhost:3000/api/v1/printers/kitchen/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```









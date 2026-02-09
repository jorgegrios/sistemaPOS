# Credenciales de Usuarios de Prueba

Sistema POS - Usuarios predefinidos para testing

**Company ID (Slug):** `default`

## Usuarios Disponibles

| Rol | Email | Password | Descripción |
|-----|-------|----------|-------------|
| **Admin** | admin@restaurant.com | admin123 | Administrador del sistema |
| **Manager** | gerente@restaurant.com | gerente123 | Gerente del restaurante |
| **Waiter** | mesero@restaurant.com | mesero123 | Mesero/Camarero |
| **Cashier** | cajero@restaurant.com | cajero123 | Cajero |
| **Kitchen** | cocinero@restaurant.com | cocinero123 | Personal de cocina |
| **Bartender** | bartender@restaurant.com | bartender123 | Bartender/Barman |

## Roles y Permisos

- **admin**: Acceso completo al sistema
- **manager**: Gestión del restaurante, reportes, configuración
- **waiter**: Tomar órdenes, gestionar mesas
- **cashier**: Procesar pagos, cerrar caja
- **kitchen**: Kitchen Display System (KDS), preparar órdenes
- **bartender**: Bar Display System, preparar bebidas

## Notas

- Todos los usuarios pertenecen a la compañía con slug `default`
- Los passwords son solo para desarrollo/testing
- En producción, cambiar todas las credenciales

## Usuario Legacy

Existe también un usuario legacy:
- **Email:** admin@test.com
- **Password:** password
- **Rol:** admin

Este usuario se mantiene por compatibilidad pero se recomienda usar `admin@restaurant.com`.

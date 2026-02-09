# Documentación del Proyecto - Sistema POS Restaurante

## 📁 Estructura de Documentación

```
docs/
├── README.md                    # Este archivo
├── CHANGELOG.md                 # Índice de todos los cambios
└── changes/                     # Documentos individuales de cambios
    ├── 2026-01-24_manual-table-status-management.md
    ├── 2026-01-24_auto-update-table-status-after-payment.md
    └── ... (futuros cambios)
```

## 📝 Formato de Documentación

Cada cambio o adición al proyecto se documenta en un archivo individual con:

### Nombre del Archivo
`YYYY-MM-DD_descripcion-breve.md`

### Contenido Estándar
- **Fecha**: Fecha del cambio
- **Tipo**: Feature, Enhancement, Bugfix, Refactor, etc.
- **Componentes**: Backend, Frontend, Database, etc.
- **Objetivo**: Descripción clara del cambio
- **Archivos Modificados**: Lista de archivos afectados
- **Código Clave**: Snippets importantes
- **Testing**: Instrucciones de verificación
- **Notas Técnicas**: Consideraciones especiales

## 🔍 Cómo Usar Esta Documentación

### Para Buscar un Cambio Específico
1. Consulta `CHANGELOG.md` para ver el índice
2. Abre el archivo individual del cambio que te interesa

### Para Documentar un Nuevo Cambio
1. Crear archivo en `docs/changes/` con formato `YYYY-MM-DD_descripcion.md`
2. Seguir el formato estándar
3. Actualizar `CHANGELOG.md` con entrada en el índice

## 📊 Tipos de Cambios

- **Feature**: Nueva funcionalidad
- **Enhancement**: Mejora de funcionalidad existente
- **Bugfix**: Corrección de errores
- **Refactor**: Reestructuración de código sin cambiar funcionalidad
- **Documentation**: Cambios solo en documentación
- **Performance**: Optimizaciones de rendimiento
- **Security**: Mejoras de seguridad

## 🎯 Principios de Documentación

1. **Claridad**: Explicar QUÉ se hizo y POR QUÉ
2. **Completitud**: Incluir todos los archivos modificados
3. **Reproducibilidad**: Instrucciones claras de testing
4. **Contexto**: Notas técnicas y edge cases
5. **Concisión**: Directo al punto, sin redundancia

## 📚 Documentos Relacionados

- `BACKEND_COMPLETE.md` - Guía completa del backend
- `README.md` (raíz) - Documentación general del proyecto
- `frontend/README.md` - Documentación del frontend
- `backend/README.md` - Documentación del backend

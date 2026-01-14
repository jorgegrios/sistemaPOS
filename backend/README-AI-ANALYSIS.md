# 🤖 Análisis con Inteligencia Artificial

## Descripción

Sistema de análisis inteligente que proporciona insights sobre ventas y compras del restaurante usando Inteligencia Artificial.

## Características

- ✅ Análisis automático de ventas y compras
- ✅ Recomendaciones accionables generadas por IA
- ✅ Métricas clave: ganancia neta, margen de ganancia
- ✅ Productos más vendidos
- ✅ Análisis de tendencias
- ✅ Solo visible para administradores

## Configuración

### 1. Configurar OpenAI (Opcional pero Recomendado)

Para obtener análisis más avanzados con IA, agrega tu API key de OpenAI:

```bash
# En backend/.env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Nota**: Si no configuras OpenAI, el sistema funcionará con análisis básico automático.

### 2. Obtener API Key de OpenAI

1. Ve a https://platform.openai.com/
2. Crea una cuenta o inicia sesión
3. Ve a API Keys
4. Crea una nueva key
5. Cópiala y agrégala a tu `.env`

## Uso

### En el Dashboard

1. Inicia sesión como **administrador**
2. Ve al **Dashboard**
3. Verás una sección "Análisis con Inteligencia Artificial"
4. Haz clic en **"Obtener Análisis"**
5. El sistema analizará:
   - Ventas de los últimos 30 días
   - Compras de los últimos 30 días
   - Generará insights y recomendaciones

### Datos Analizados

- **Ventas**:
  - Ingresos totales
  - Órdenes completadas/pendientes
  - Valor promedio por orden
  - Productos más vendidos
  - Ingresos por día

- **Compras**:
  - Total gastado
  - Órdenes recibidas/pendientes
  - Valor promedio por orden
  - Principales proveedores
  - Gastos por día

- **Análisis IA**:
  - Análisis detallado del negocio
  - Recomendaciones específicas
  - Identificación de oportunidades
  - Alertas de problemas

## Endpoints

### GET /api/v1/ai-analysis/insights

Obtiene insights completos del negocio.

**Query Parameters**:
- `days` (opcional): Número de días a analizar (default: 30)

**Response**:
```json
{
  "sales": {
    "totalRevenue": 5000.00,
    "totalOrders": 150,
    "completedOrders": 140,
    "pendingOrders": 10,
    "averageOrderValue": 35.71,
    "topSellingItems": [...],
    "revenueByDay": [...]
  },
  "purchases": {
    "totalSpent": 2000.00,
    "totalOrders": 20,
    "receivedOrders": 18,
    "pendingOrders": 2,
    "averageOrderValue": 111.11,
    "topSuppliers": [...],
    "spendingByDay": [...]
  },
  "aiAnalysis": "Análisis detallado generado por IA...",
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ],
  "profitMargin": 60.0,
  "netProfit": 3000.00
}
```

## Funcionamiento sin OpenAI

Si no configuras OpenAI, el sistema:
- ✅ Funciona perfectamente
- ✅ Proporciona análisis básico automático
- ✅ Genera recomendaciones basadas en reglas
- ✅ Calcula todas las métricas

## Seguridad

- Solo administradores pueden acceder
- Requiere autenticación JWT
- Los datos se filtran por restaurante

## Costos de OpenAI

- Modelo usado: `gpt-4o-mini` (económico)
- Costo aproximado: ~$0.01 por análisis
- Puedes configurar límites en tu cuenta de OpenAI

## Troubleshooting

### Error: "OpenAI API key not found"
- El sistema funcionará con análisis básico
- Para análisis avanzado, configura `OPENAI_API_KEY`

### Error: "Failed to load AI analysis"
- Verifica tu conexión a internet
- Revisa los logs del backend
- El sistema intentará análisis básico como fallback

## Mejoras Futuras

- Análisis predictivo
- Comparación con períodos anteriores
- Alertas automáticas
- Exportación de reportes
- Análisis por categorías de productos








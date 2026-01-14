/**
 * AI Analysis Service
 * Provides AI-powered insights for sales and purchases
 */

import { Pool } from 'pg';
import OpenAI from 'openai';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize OpenAI (optional - will work without it but with limited functionality)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
}

interface PurchaseData {
  totalSpent: number;
  totalOrders: number;
  receivedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topSuppliers: Array<{ name: string; orders: number; totalSpent: number }>;
  spendingByDay: Array<{ date: string; spent: number; orders: number }>;
}

export interface BusinessInsights {
  sales: SalesData;
  purchases: PurchaseData;
  aiAnalysis: string;
  recommendations: string[];
  profitMargin: number;
  netProfit: number;
}

class AIAnalysisService {
  /**
   * Get sales data for analysis
   */
  async getSalesData(restaurantId: string, days: number = 30): Promise<SalesData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get orders - First check if restaurant_id column exists
    const ordersResult = await pool.query(
      `SELECT o.*, 
        COUNT(oi.id) as item_count,
        SUM(oi.quantity) as total_items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.created_at >= $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [startDate]
    );

    const orders = ordersResult.rows;
    const completedOrders = orders.filter((o: any) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Get top selling items
    const itemsResult = await pool.query(
      `SELECT oi.name, 
        SUM(oi.quantity) as total_quantity,
        SUM(oi.price * oi.quantity) as total_revenue
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'completed'
         AND o.created_at >= $1
       GROUP BY oi.name
       ORDER BY total_quantity DESC
       LIMIT 10`,
      [startDate]
    );

    // Get revenue by day
    const dailyResult = await pool.query(
      `SELECT 
        DATE(o.created_at) as date,
        SUM(o.total) as revenue,
        COUNT(o.id) as orders
       FROM orders o
       WHERE o.status = 'completed'
         AND o.created_at >= $1
       GROUP BY DATE(o.created_at)
       ORDER BY date DESC`,
      [startDate]
    );

    return {
      totalRevenue,
      totalOrders,
      completedOrders: completedOrders.length,
      pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
      averageOrderValue,
      topSellingItems: itemsResult.rows.map((row: any) => ({
        name: row.name,
        quantity: parseInt(row.total_quantity),
        revenue: parseFloat(row.total_revenue)
      })),
      revenueByDay: dailyResult.rows.map((row: any) => ({
        date: row.date.toISOString().split('T')[0],
        revenue: parseFloat(row.revenue || 0),
        orders: parseInt(row.orders)
      }))
    };
  }

  /**
   * Get purchase data for analysis
   */
  async getPurchaseData(restaurantId: string, days: number = 30): Promise<PurchaseData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get purchase orders
    const ordersResult = await pool.query(
      `SELECT po.*, s.name as supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.restaurant_id = $1 
         AND po.created_at >= $2
       ORDER BY po.created_at DESC`,
      [restaurantId, startDate]
    );

    const orders = ordersResult.rows;
    const receivedOrders = orders.filter((o: any) => o.status === 'received');
    const totalSpent = receivedOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = receivedOrders.length > 0 ? totalSpent / receivedOrders.length : 0;

    // Get top suppliers
    const suppliersResult = await pool.query(
      `SELECT s.name,
        COUNT(po.id) as order_count,
        SUM(po.total_amount) as total_spent
       FROM suppliers s
       INNER JOIN purchase_orders po ON s.id = po.supplier_id
       WHERE po.restaurant_id = $1 
         AND po.status = 'received'
         AND po.created_at >= $2
       GROUP BY s.id, s.name
       ORDER BY total_spent DESC
       LIMIT 10`,
      [restaurantId, startDate]
    );

    // Get spending by day
    const dailyResult = await pool.query(
      `SELECT 
        DATE(po.created_at) as date,
        SUM(po.total_amount) as spent,
        COUNT(po.id) as orders
       FROM purchase_orders po
       WHERE po.restaurant_id = $1 
         AND po.status = 'received'
         AND po.created_at >= $2
       GROUP BY DATE(po.created_at)
       ORDER BY date DESC`,
      [restaurantId, startDate]
    );

    return {
      totalSpent,
      totalOrders,
      receivedOrders: receivedOrders.length,
      pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
      averageOrderValue,
      topSuppliers: suppliersResult.rows.map((row: any) => ({
        name: row.name,
        orders: parseInt(row.order_count),
        totalSpent: parseFloat(row.total_spent || 0)
      })),
      spendingByDay: dailyResult.rows.map((row: any) => ({
        date: row.date.toISOString().split('T')[0],
        spent: parseFloat(row.spent || 0),
        orders: parseInt(row.orders)
      }))
    };
  }

  /**
   * Generate AI analysis using OpenAI
   */
  async generateAIAnalysis(sales: SalesData, purchases: PurchaseData): Promise<{ analysis: string; recommendations: string[] }> {
    // If OpenAI is not configured, return basic analysis
    if (!openai) {
      return this.generateBasicAnalysis(sales, purchases);
    }

    try {
      const prompt = `Eres un analista de negocios experto. Analiza los siguientes datos de un restaurante y proporciona:
1. Un análisis detallado de las ventas y compras
2. Recomendaciones específicas y accionables

DATOS DE VENTAS (últimos 30 días):
- Ingresos totales: $${sales.totalRevenue.toFixed(2)}
- Órdenes completadas: ${sales.completedOrders}
- Órdenes pendientes: ${sales.pendingOrders}
- Valor promedio por orden: $${sales.averageOrderValue.toFixed(2)}
- Productos más vendidos: ${sales.topSellingItems.slice(0, 5).map(i => `${i.name} (${i.quantity} unidades)`).join(', ')}

DATOS DE COMPRAS (últimos 30 días):
- Total gastado: $${purchases.totalSpent.toFixed(2)}
- Órdenes recibidas: ${purchases.receivedOrders}
- Órdenes pendientes: ${purchases.pendingOrders}
- Valor promedio por orden: $${purchases.averageOrderValue.toFixed(2)}
- Principales proveedores: ${purchases.topSuppliers.slice(0, 3).map(s => `${s.name} ($${s.totalSpent.toFixed(2)})`).join(', ')}

MARGEN DE GANANCIA: ${((sales.totalRevenue - purchases.totalSpent) / sales.totalRevenue * 100).toFixed(2)}%

Proporciona:
1. Un análisis profesional en español (2-3 párrafos)
2. 5 recomendaciones específicas y accionables

Responde en formato JSON:
{
  "analysis": "análisis detallado aquí",
  "recommendations": ["recomendación 1", "recomendación 2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un analista de negocios experto especializado en restaurantes. Proporciona análisis claros y recomendaciones accionables.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Try to parse JSON response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            analysis: parsed.analysis || response,
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
          };
        }
      } catch {
        // If JSON parsing fails, return the raw response
      }

      return {
        analysis: response,
        recommendations: []
      };
    } catch (error: any) {
      console.error('[AI Analysis] Error calling OpenAI:', error);
      return this.generateBasicAnalysis(sales, purchases);
    }
  }

  /**
   * Generate basic analysis without AI
   */
  private generateBasicAnalysis(sales: SalesData, purchases: PurchaseData): { analysis: string; recommendations: string[] } {
    const profit = sales.totalRevenue - purchases.totalSpent;
    const profitMargin = sales.totalRevenue > 0 ? (profit / sales.totalRevenue * 100) : 0;

    let analysis = `Análisis de Negocio (Últimos 30 días)\n\n`;
    analysis += `VENTAS: Has generado $${sales.totalRevenue.toFixed(2)} en ingresos con ${sales.completedOrders} órdenes completadas. `;
    analysis += `El valor promedio por orden es de $${sales.averageOrderValue.toFixed(2)}. `;
    
    if (sales.topSellingItems.length > 0) {
      analysis += `Tu producto más vendido es "${sales.topSellingItems[0].name}" con ${sales.topSellingItems[0].quantity} unidades vendidas. `;
    }
    
    analysis += `\n\nCOMPRAS: Has gastado $${purchases.totalSpent.toFixed(2)} en compras con ${purchases.receivedOrders} órdenes recibidas. `;
    analysis += `El valor promedio por orden de compra es de $${purchases.averageOrderValue.toFixed(2)}. `;
    
    analysis += `\n\nGANANCIAS: Tu margen de ganancia es del ${profitMargin.toFixed(2)}% con una ganancia neta de $${profit.toFixed(2)}.`;

    const recommendations: string[] = [];
    
    if (profitMargin < 20) {
      recommendations.push('Considera revisar los precios de tus productos para mejorar el margen de ganancia');
    }
    
    if (sales.pendingOrders > 5) {
      recommendations.push(`Tienes ${sales.pendingOrders} órdenes pendientes. Prioriza completarlas para mejorar el flujo de caja`);
    }
    
    if (sales.averageOrderValue < 20) {
      recommendations.push('Considera estrategias para aumentar el valor promedio por orden (combos, recomendaciones)');
    }
    
    if (purchases.pendingOrders > 3) {
      recommendations.push(`Tienes ${purchases.pendingOrders} órdenes de compra pendientes. Revisa su estado`);
    }
    
    if (sales.topSellingItems.length > 0) {
      recommendations.push(`Aprovecha el éxito de "${sales.topSellingItems[0].name}" - considera promociones o aumentar el inventario`);
    }

    return { analysis, recommendations };
  }

  /**
   * Get comprehensive business insights
   */
  async getBusinessInsights(restaurantId: string, days: number = 30): Promise<BusinessInsights> {
    const [sales, purchases] = await Promise.all([
      this.getSalesData(restaurantId, days),
      this.getPurchaseData(restaurantId, days)
    ]);

    const netProfit = sales.totalRevenue - purchases.totalSpent;
    const profitMargin = sales.totalRevenue > 0 ? (netProfit / sales.totalRevenue * 100) : 0;

    const { analysis, recommendations } = await this.generateAIAnalysis(sales, purchases);

    return {
      sales,
      purchases,
      aiAnalysis: analysis,
      recommendations,
      profitMargin,
      netProfit
    };
  }
}

export default new AIAnalysisService();


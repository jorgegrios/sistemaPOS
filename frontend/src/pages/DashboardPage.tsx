/**
 * Dashboard Page
 * Overview of recent orders, statistics, and quick actions
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { dashboardService, DailySummary } from '../services/dashboard-service';
import { aiAnalysisService, BusinessInsights } from '../services/ai-analysis-service';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<BusinessInsights | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAISection, setShowAISection] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailType, setDetailType] = useState<'total' | 'base' | 'cash' | 'card' | 'kitchen' | 'bar' | null>(null);
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadDailySummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const summary = await dashboardService.getDailySummary();
        setDailySummary(summary);
      } catch (err: any) {
        console.error('Error loading daily summary:', err);
        const errorMsg = err?.message || 'Error al cargar resumen del día';
        setError(errorMsg);
        toast.error(errorMsg);
        // Set empty summary to prevent crash
        setDailySummary({
          date: new Date().toISOString().split('T')[0],
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          totalSales: 0,
          cashAmount: 0,
          cardAmount: 0,
          kitchenSales: 0,
          barSales: 0,
          baseAmount: 0,
          orders: []
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDailySummary();
    }
  }, [user]);

  const loadAIAnalysis = async () => {
    if (!isAdmin) return;
    
    try {
      setLoadingAI(true);
      const insights = await aiAnalysisService.getInsights(30);
      setAiInsights(insights);
      setShowAISection(true);
    } catch (err) {
      console.error('Error loading AI analysis:', err);
      toast.error('Error al cargar análisis con IA');
    } finally {
      setLoadingAI(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCardClick = (type: 'total' | 'base' | 'cash' | 'card' | 'kitchen' | 'bar') => {
    setDetailType(type);
    setShowDetailModal(true);
  };

  const getDetailContent = () => {
    if (!dailySummary || !detailType) return null;

    switch (detailType) {
      case 'total':
        const completedOrdersList = dailySummary.orders.filter(o => o.status === 'completed');
        return {
          title: 'Detalle de Ventas Totales',
          icon: '💰',
          total: dailySummary.totalSales,
          items: completedOrdersList.map(order => ({
            label: `Orden ${order.orderNumber}`,
            value: `$${order.total.toFixed(2)}`,
            items: order.items.length,
            status: order.status,
            paymentStatus: order.paymentStatus
          }))
        };
      
      case 'cash':
        // Mostrar órdenes pagadas (asumiendo que las pagadas en efectivo son una proporción)
        const paidOrders = dailySummary.orders.filter(o => o.paymentStatus === 'paid');
        // Calcular proporción aproximada basada en el total
        const cashProportion = dailySummary.totalSales > 0 
          ? dailySummary.cashAmount / dailySummary.totalSales 
          : 0;
        const estimatedCashOrders = Math.round(paidOrders.length * cashProportion);
        const cashOrders = paidOrders.slice(0, estimatedCashOrders);
        
        return {
          title: 'Detalle de Pagos en Efectivo',
          icon: '💵',
          total: dailySummary.cashAmount,
          items: cashOrders.length > 0 ? cashOrders.map(order => ({
            label: `Orden ${order.orderNumber}`,
            value: `$${order.total.toFixed(2)}`,
            items: order.items.length,
            status: 'Pagado en efectivo'
          })) : [{
            label: 'Total en efectivo',
            value: `$${dailySummary.cashAmount.toFixed(2)}`,
            description: `${paidOrders.length} órdenes pagadas (proporción estimada)`
          }]
        };
      
      case 'card':
        const cardOrders = dailySummary.orders.filter(o => o.paymentStatus === 'paid');
        return {
          title: 'Detalle de Pagos con Tarjeta',
          icon: '💳',
          total: dailySummary.cardAmount,
          items: cardOrders.length > 0 ? cardOrders.map(order => ({
            label: `Orden ${order.orderNumber}`,
            value: `$${order.total.toFixed(2)}`,
            items: order.items.length,
            status: 'Pagado con tarjeta'
          })) : [{
            label: 'Total con tarjeta',
            value: `$${dailySummary.cardAmount.toFixed(2)}`,
            description: `${cardOrders.length} órdenes pagadas`
          }]
        };
      
      case 'kitchen':
        const kitchenItems = dailySummary.orders
          .filter(o => o.status === 'completed')
          .flatMap(o => o.items.filter(item => item.categoryType === 'kitchen'))
          .reduce((acc: Record<string, { quantity: number; revenue: number }>, item) => {
            if (!acc[item.name]) {
              acc[item.name] = { quantity: 0, revenue: 0 };
            }
            acc[item.name].quantity += item.quantity;
            acc[item.name].revenue += item.price * item.quantity;
            return acc;
          }, {});
        return {
          title: 'Detalle de Ventas de Cocina',
          icon: '👨‍🍳',
          total: dailySummary.kitchenSales,
          items: Object.entries(kitchenItems)
            .map(([name, data]) => ({
              label: name,
              value: `${data.quantity} unidades`,
              revenue: `$${data.revenue.toFixed(2)}`
            }))
            .sort((a, b) => parseFloat(b.revenue.replace('$', '')) - parseFloat(a.revenue.replace('$', '')))
        };
      
      case 'bar':
        const barItems = dailySummary.orders
          .filter(o => o.status === 'completed')
          .flatMap(o => o.items.filter(item => item.categoryType === 'bar'))
          .reduce((acc: Record<string, { quantity: number; revenue: number }>, item) => {
            if (!acc[item.name]) {
              acc[item.name] = { quantity: 0, revenue: 0 };
            }
            acc[item.name].quantity += item.quantity;
            acc[item.name].revenue += item.price * item.quantity;
            return acc;
          }, {});
        return {
          title: 'Detalle de Ventas de Bar',
          icon: '🍸',
          total: dailySummary.barSales,
          items: Object.entries(barItems)
            .map(([name, data]) => ({
              label: name,
              value: `${data.quantity} unidades`,
              revenue: `$${data.revenue.toFixed(2)}`
            }))
            .sort((a, b) => parseFloat(b.revenue.replace('$', '')) - parseFloat(a.revenue.replace('$', '')))
        };
      
      case 'base':
        return {
          title: 'Información de Base Inicial',
          icon: '🏦',
          total: dailySummary.baseAmount,
          items: [{
            label: 'Base Inicial',
            value: `$${dailySummary.baseAmount.toFixed(2)}`,
            description: 'Fondo inicial de caja para el día'
          }]
        };
      
      default:
        return null;
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text mb-2">
          📊 Dashboard
        </h1>
        <p className="text-gray-700 text-sm sm:text-base font-medium">
          Resumen del día - {dailySummary ? formatDate(dailySummary.date) : 'Cargando...'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Cargando resumen del día...</p>
        </div>
      ) : dailySummary ? (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Total Vendido */}
            <button
              onClick={() => handleCardClick('total')}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-xl p-4 sm:p-5 lg:p-6 border-4 border-green-300 hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer text-left active:scale-100 btn-touch"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm font-medium">Total Vendido</p>
                <span className="text-3xl">💰</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-green-700">${dailySummary.totalSales.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-2">{dailySummary.completedOrders} órdenes completadas</p>
              <p className="text-xs text-green-600 mt-2 font-medium">Click para ver detalles →</p>
            </button>

            {/* Base Inicial */}
            <button
              onClick={() => handleCardClick('base')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-xl p-4 sm:p-5 lg:p-6 border-4 border-blue-300 hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer text-left active:scale-100 relative btn-touch"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm font-medium">Base Inicial</p>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const amount = prompt('Ingresa la base inicial de caja:', dailySummary.baseAmount.toString());
                        if (amount !== null && !isNaN(parseFloat(amount))) {
                          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/dashboard/cash-base`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('pos_token')}`
                            },
                            body: JSON.stringify({ amount: parseFloat(amount) })
                          })
                            .then(res => res.json())
                            .then(() => {
                              toast.success('Base inicial actualizada');
                              window.location.reload();
                            })
                            .catch(() => toast.error('Error al actualizar base'));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium z-10"
                      title="Editar base inicial"
                    >
                      ✏️
                    </button>
                  )}
                  <span className="text-3xl">🏦</span>
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-blue-700">${dailySummary.baseAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-2">Fondo inicial de caja</p>
              <p className="text-xs text-blue-600 mt-2 font-medium">Click para ver detalles →</p>
            </button>

            {/* Efectivo */}
            <button
              onClick={() => handleCardClick('cash')}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-xl p-4 sm:p-5 lg:p-6 border-4 border-yellow-300 hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer text-left active:scale-100 btn-touch"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm font-medium">Efectivo</p>
                <span className="text-3xl">💵</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-yellow-700">${dailySummary.cashAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-2">Pagos en efectivo</p>
              <p className="text-xs text-yellow-600 mt-2 font-medium">Click para ver detalles →</p>
            </button>

            {/* Tarjetas */}
            <button
              onClick={() => handleCardClick('card')}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-xl p-4 sm:p-5 lg:p-6 border-4 border-purple-300 hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer text-left active:scale-100 btn-touch"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm font-medium">Tarjetas</p>
                <span className="text-3xl">💳</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-purple-700">${dailySummary.cardAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-2">Pagos con tarjeta</p>
              <p className="text-xs text-purple-600 mt-2 font-medium">Click para ver detalles →</p>
            </button>
          </div>

          {/* Kitchen and Bar Sales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Ventas Cocina */}
            <button
              onClick={() => handleCardClick('kitchen')}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-xl p-4 sm:p-5 lg:p-6 border-4 border-orange-300 hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer text-left active:scale-100 btn-touch"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">👨‍🍳</span>
                  <span>Ventas Cocina</span>
                </h3>
              </div>
              <p className="text-4xl font-bold text-orange-700 mb-2">${dailySummary.kitchenSales.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total vendido en cocina</p>
              <p className="text-xs text-orange-600 mt-2 font-medium">Click para ver detalles →</p>
            </button>

            {/* Ventas Bar */}
            <button
              onClick={() => handleCardClick('bar')}
              className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-xl p-4 sm:p-5 lg:p-6 border-4 border-cyan-300 hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer text-left active:scale-100 btn-touch"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">🍸</span>
                  <span>Ventas Bar</span>
                </h3>
              </div>
              <p className="text-4xl font-bold text-cyan-700 mb-2">${dailySummary.barSales.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total vendido en bar</p>
              <p className="text-xs text-cyan-600 mt-2 font-medium">Click para ver detalles →</p>
            </button>
          </div>

          {/* Orders Summary */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl mb-4 sm:mb-6 lg:mb-8 border-4 border-indigo-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Resumen de Órdenes del Día</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-300 shadow-md">
                  <p className="text-gray-700 text-sm sm:text-base font-semibold">Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{dailySummary.totalOrders}</p>
                </div>
                <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border-2 border-green-300 shadow-md">
                  <p className="text-gray-700 text-sm sm:text-base font-semibold">Completadas</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700 mt-2">{dailySummary.completedOrders}</p>
                </div>
                <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl border-2 border-yellow-300 shadow-md">
                  <p className="text-gray-700 text-sm sm:text-base font-semibold">Pendientes</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-700 mt-2">{dailySummary.pendingOrders}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-gray-600 text-sm font-medium">Canceladas</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{dailySummary.cancelledOrders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Órdenes del Día</h2>
              <button
                onClick={() => navigate('/orders')}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Ver Todas →
              </button>
            </div>

            {dailySummary.orders.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No hay órdenes hoy</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Orden #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pago</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.orders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} items</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">${order.total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.paymentStatus === 'paid'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* AI Analysis Section - Admin Only */}
      {isAdmin && (
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg border-2 border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🤖</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Análisis con Inteligencia Artificial</h2>
                <p className="text-gray-600 text-sm">Insights inteligentes sobre ventas y compras</p>
              </div>
            </div>
            {!showAISection && (
              <button
                onClick={loadAIAnalysis}
                disabled={loadingAI}
                className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch flex items-center gap-2"
              >
                {loadingAI ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>Obtener Análisis</span>
                  </>
                )}
              </button>
            )}
          </div>

          {showAISection && aiInsights && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-sm text-gray-600">Ganancia Neta</p>
                  <p className={`text-2xl font-bold ${aiInsights.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${aiInsights.netProfit.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-sm text-gray-600">Margen de Ganancia</p>
                  <p className={`text-2xl font-bold ${aiInsights.profitMargin >= 20 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {aiInsights.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-sm text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${aiInsights.sales.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-sm text-gray-600">Gastos Totales</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${aiInsights.purchases.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>💡</span>
                  <span>Análisis Inteligente</span>
                </h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {aiInsights.aiAnalysis}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {aiInsights.recommendations.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📋</span>
                    <span>Recomendaciones</span>
                  </h3>
                  <ul className="space-y-2">
                    {aiInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Top Selling Items */}
              {aiInsights.sales.topSellingItems.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Productos Más Vendidos</h3>
                  <div className="space-y-2">
                    {aiInsights.sales.topSellingItems.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} unidades vendidas</p>
                        </div>
                        <p className="font-bold text-green-600">${item.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowAISection(false);
                  setAiInsights(null);
                }}
                className="btn-outline px-4 py-2 rounded-lg text-sm"
              >
                Ocultar Análisis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailType && dailySummary && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const detail = getDetailContent();
              if (!detail) return null;

              return (
                <>
                  <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{detail.icon}</span>
                      <h2 className="text-2xl font-bold">{detail.title}</h2>
                    </div>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition"
                    >
                      ×
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Total</p>
                      <p className="text-4xl font-bold text-gray-800">${detail.total.toFixed(2)}</p>
                    </div>

                    {detail.items && detail.items.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Detalles</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {detail.items.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">{item.label}</p>
                                  {item.value && (
                                    <p className="text-sm text-gray-600 mt-1">{item.value}</p>
                                  )}
                                  {item.items && (
                                    <p className="text-xs text-gray-500 mt-1">{item.items} items</p>
                                  )}
                                  {item.revenue && (
                                    <p className="text-sm font-bold text-green-600 mt-1">{item.revenue}</p>
                                  )}
                                  {item.status && (
                                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                                      item.status === 'completed' || item.status === 'Pagado en efectivo' || item.status === 'Pagado con tarjeta'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {item.status}
                                    </span>
                                  )}
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No hay datos disponibles</p>
                      </div>
                    )}
                  </div>

                  <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-xl flex justify-end">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="btn-primary px-6 py-2 rounded-lg font-semibold btn-touch"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

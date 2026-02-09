/**
 * Order Detail Page
 * View complete order details with items, payment status, and actions
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, Order } from '../services/order-service';
import { getApiBaseUrl } from '../utils/api-config';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [orderData, historyData] = await Promise.all([
          orderService.getOrder(id),
          orderService.getOrderHistory(id)
        ]);
        setOrder(orderData);
        setHistory(historyData.history);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleCompleteOrder = async () => {
    if (!order || !id) return;

    try {
      setProcessing(true);
      await orderService.completeOrder(id);
      // Reload everything
      const [updatedOrder, updatedHistory] = await Promise.all([
        orderService.getOrder(id),
        orderService.getOrderHistory(id)
      ]);
      setOrder(updatedOrder);
      setHistory(updatedHistory.history);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to complete order';
      setError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !id) return;

    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setProcessing(true);
      await orderService.cancelOrder(id);
      navigate('/orders');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel order';
      setError(errorMsg);
      setProcessing(false);
    }
  };

  const handlePayOrder = () => {
    if (!order || !id) return;
    navigate(`/orders/${id}/pay`);
  };

  const handleRequestCheck = async () => {
    if (!order || !id) return;

    if (!confirm('¿Deseas solicitar la cuenta para esta orden? Se generará un ticket para el cliente.')) {
      return;
    }

    try {
      setProcessing(true);
      const result = await orderService.requestCheck(id);
      // Reload order and history
      const [updatedOrder, updatedHistory] = await Promise.all([
        orderService.getOrder(id),
        orderService.getOrderHistory(id)
      ]);
      setOrder(updatedOrder);
      setHistory(updatedHistory.history);
      alert(result.message || 'Cuenta solicitada exitosamente. El ticket ha sido generado.');
      // Optionally open receipt in new window
      const apiUrl = getApiBaseUrl();
      window.open(`${apiUrl}/orders/${id}/receipt`, '_blank');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al solicitar la cuenta';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📝', label: 'Borrador' },
      sent_to_kitchen: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🍳', label: 'En Cocina' },
      served: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🍽️', label: 'Servido' },
      closed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅', label: 'Completada' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅', label: 'Completada' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: '✕', label: 'Cancelada' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏳', label: 'Pendiente' }
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '?', label: status };
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit border`}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      paid: { bg: 'bg-green-100', text: 'text-green-700' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      failed: { bg: 'bg-red-100', text: 'text-red-700' }
    };
    const badge = badges[paymentStatus] || badges.pending;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold capitalize border`}>
        {paymentStatus}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🌀</div>
          <p className="text-gray-500 text-lg font-bold">Cargando detalles de la orden...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 shadow-lg">
          <p className="text-red-700 text-2xl font-bold mb-4">Error</p>
          <p className="text-red-600 font-medium">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition shadow-md active:scale-95"
          >
            ← Volver a Órdenes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-b-4 border-indigo-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <button
              onClick={() => navigate('/orders')}
              className="text-indigo-600 hover:text-indigo-800 font-bold mb-4 flex items-center gap-2 transition hover:translate-x-[-4px]"
            >
              ← Volver a Órdenes
            </button>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Orden {order.orderNumber}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="text-gray-500 flex items-center gap-1 font-medium">
                📅 {new Date(order.createdAt).toLocaleString()}
              </span>
              <span className="text-gray-500 flex items-center gap-1 font-medium">
                📍 Mesa {order.tableId || 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-center px-4 border-r border-gray-200">
              <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Estado</p>
              <div className="flex justify-center">{getStatusBadge(order.status)}</div>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Pago</p>
              <div className="flex justify-center">{getPaymentStatusBadge(order.paymentStatus || 'pending')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📋</span> Productos de la Orden
              </h2>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-inner">
                          {item.quantity}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg uppercase tracking-tight">{item.name}</h3>
                          {item.notes && (
                            <p className="text-sm text-amber-600 font-medium mt-1 flex items-center gap-1 grayscale-[0.5]">
                              <span>📝</span> {item.notes}
                            </p>
                          )}
                          {item.seatNumber && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded border border-blue-100">
                              Asiento {item.seatNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-indigo-600">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-gray-400 font-bold tracking-tighter uppercase">${item.price.toFixed(2)} c/u</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 font-bold italic">
                No hay productos en esta orden
              </div>
            )}
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>🕒</span> Historial de Auditoría (Tiempos)
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {history.length > 0 ? (
                  history.map((step, idx) => (
                    <div key={step.id} className="relative pl-10">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 
                        ${idx === 0 ? 'bg-indigo-500 animate-pulse' : 'bg-gray-300'}`}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-black text-gray-800 uppercase text-sm tracking-tight">
                            {idx === history.length - 1 ? 'Creada como ' : 'Cambio a '}
                            <span className="text-indigo-600">
                              {getStatusBadge(step.new_status).props.children[1]}
                            </span>
                          </p>
                          {step.user_name && (
                            <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                              Por: <span className="text-gray-600">{step.user_name}</span>
                            </p>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-mono text-sm font-bold text-gray-700">
                            {new Date(step.created_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            {new Date(step.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-center py-4">Sin registros de auditoría</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Actions */}
        <div className="space-y-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>💰</span> Resumen de Totales
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-gray-600 font-bold">
                <span className="uppercase text-xs tracking-widest">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-bold">
                <span className="uppercase text-xs tracking-widest">Impuestos (10%)</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t-2 border-gray-50 flex justify-between items-end">
                <span className="text-gray-900 font-black uppercase text-sm tracking-widest">Total Final</span>
                <span className="text-4xl font-black text-green-600 leading-none">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Acciones de Gestión</h2>

            {order.status === 'draft' && (
              <button
                onClick={() => navigate('/orders/new')}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-indigo-200 transition active:scale-95"
              >
                🍳 Enviar a Cocina
              </button>
            )}

            {order.status !== 'closed' && order.status !== 'cancelled' && (
              <button
                onClick={() => navigate(`/orders/new?tableId=${order.tableId}`)}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-orange-200 transition active:scale-95"
              >
                📝 Modificar Orden
              </button>
            )}

            {order.status !== 'closed' && order.status !== 'cancelled' && order.paymentStatus !== 'paid' && (
              <button
                onClick={handlePayOrder}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-green-200 transition active:scale-95"
              >
                💳 Procesar Pago
              </button>
            )}

            {order.status !== 'closed' && order.status !== 'cancelled' && (
              <button
                onClick={handleCancelOrder}
                className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-black uppercase tracking-widest text-xs border border-red-100 hover:bg-red-100 transition active:scale-95"
              >
                ✕ Cancelar Orden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


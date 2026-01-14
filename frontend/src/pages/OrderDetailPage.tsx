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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orderData = await orderService.getOrder(id);
        setOrder(orderData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load order';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleCompleteOrder = async () => {
    if (!order || !id) return;

    try {
      setProcessing(true);
      await orderService.completeOrder(id);
      // Reload order to get updated status
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
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
      // Reload order to get updated status
      const updatedOrder = await orderService.getOrder(id);
      setOrder(updatedOrder);
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
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✓' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏳' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: '✕' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit`}>
        <span>{badge.icon}</span>
        {status}
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
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold capitalize`}>
        {paymentStatus}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 text-lg font-semibold mb-2">Error</p>
          <p className="text-red-600">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center gap-2"
          >
            ← Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Order {order.orderNumber}</h1>
          <p className="text-gray-600 mt-1">
            Created: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            {getStatusBadge(order.status)}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Payment</p>
            {getPaymentStatusBadge(order.paymentStatus || 'pending')}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-semibold">
                          {item.quantity}x
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No items in this order</p>
            )}
          </div>
        </div>

        {/* Order Summary & Actions */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.tip > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tip</span>
                  <span>${order.tip.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Actions</h2>
            <div className="space-y-3">
              {/* Request Check Button - Only for waiters and if check not already requested */}
              {order.status === 'pending' && order.paymentStatus !== 'paid' && !order.checkRequestedAt && (
                <button
                  onClick={handleRequestCheck}
                  disabled={processing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50"
                >
                  🧾 Solicitar Cuenta
                </button>
              )}

              {/* Show if check already requested */}
              {order.checkRequestedAt && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-700 text-sm font-semibold text-center">
                    🧾 Cuenta Solicitada
                  </p>
                  <p className="text-purple-600 text-xs text-center mt-1">
                    Solicitada: {new Date(order.checkRequestedAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => {
                      const apiUrl = getApiBaseUrl();
                      window.open(`${apiUrl}/orders/${id}/receipt`, '_blank');
                    }}
                    className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition duration-200"
                  >
                    Ver/Imprimir Recibo
                  </button>
                </div>
              )}

              {order.status === 'pending' && order.paymentStatus !== 'paid' && (
                <button
                  onClick={handlePayOrder}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50"
                >
                  💳 Process Payment
                </button>
              )}

              {order.status === 'pending' && (
                <button
                  onClick={handleCompleteOrder}
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50"
                >
                  ✓ Complete Order
                </button>
              )}

              {order.status === 'pending' && order.paymentStatus !== 'paid' && (
                <button
                  onClick={handleCancelOrder}
                  disabled={processing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50"
                >
                  ✕ Cancel Order
                </button>
              )}

              {order.paymentStatus === 'paid' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm font-semibold text-center">
                    ✓ Order Paid
                  </p>
                  {order.paidAt && (
                    <p className="text-green-600 text-xs text-center mt-1">
                      Paid on {new Date(order.paidAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Number</span>
                <span className="font-medium text-gray-800">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Table ID</span>
                <span className="font-medium text-gray-800">{order.tableId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Waiter ID</span>
                <span className="font-medium text-gray-800">{order.waiterId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items Count</span>
                <span className="font-medium text-gray-800">
                  {order.items?.length || 0} items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


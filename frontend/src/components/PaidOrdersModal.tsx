/**
 * Paid Orders Modal
 * Shows all paid orders with payment details and cancelled items
 */

import React, { useEffect, useState } from 'react';
import { cashierService, PaidOrder } from '../services/cashier-service';
import { toast } from 'sonner';

interface PaidOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaidOrdersModal: React.FC<PaidOrdersModalProps> = ({
  isOpen,
  onClose
}) => {
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState<PaidOrder | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPaidOrders();
    }
  }, [isOpen, selectedDate]);

  const loadPaidOrders = async () => {
    try {
      setLoading(true);
      const dateToSend = selectedDate || undefined;
      console.log('[PaidOrdersModal] Loading paid orders for date:', dateToSend || 'ALL');
      console.log('[PaidOrdersModal] Date string format:', selectedDate);
      
      const data = await cashierService.getPaidOrders(dateToSend, 100, 0);
      console.log('[PaidOrdersModal] Received data:', data);
      console.log('[PaidOrdersModal] Total orders:', data.total);
      console.log('[PaidOrdersModal] Orders array length:', data.orders?.length || 0);
      console.log('[PaidOrdersModal] Orders array:', data.orders);
      
      setOrders(data.orders || []);
      
      if (!data.orders || data.orders.length === 0) {
        console.log('[PaidOrdersModal] No orders found');
        if (selectedDate) {
          toast.info(`No hay órdenes pagadas para la fecha ${new Date(selectedDate).toLocaleDateString('es-ES')}. Prueba con otra fecha o haz clic en "Todas" para ver todas las órdenes.`);
        } else {
          toast.info('No hay órdenes pagadas en el sistema');
        }
      } else {
        toast.success(`${data.orders.length} ${data.orders.length === 1 ? 'orden encontrada' : 'órdenes encontradas'}`);
      }
    } catch (error: any) {
      console.error('[PaidOrdersModal] Error loading paid orders:', error);
      console.error('[PaidOrdersModal] Error details:', error.message, error.stack);
      toast.error(`Error al cargar órdenes pagadas: ${error.message || 'Error desconocido'}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  console.log('[PaidOrdersModal] Rendering modal, orders:', orders.length, 'loading:', loading, 'selectedDate:', selectedDate);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">💳 Órdenes Pagadas</h2>
            <p className="text-blue-100 text-sm">
              {selectedDate ? `Filtro: ${new Date(selectedDate).toLocaleDateString('es-ES')}` : 'Todas las órdenes'} - {orders.length} {orders.length === 1 ? 'orden pagada' : 'órdenes pagadas'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                console.log('[PaidOrdersModal] Date changed to:', e.target.value);
                setSelectedDate(e.target.value);
              }}
              className="px-3 py-2 rounded-lg border-2 border-white/30 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => {
                console.log('[PaidOrdersModal] Clearing date filter');
                setSelectedDate('');
              }}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold btn-touch transition"
              title="Ver todas las órdenes"
            >
              📅 Todas
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition btn-touch"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Orders List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="p-4 space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full p-4 rounded-xl border-2 transition text-left ${
                      selectedOrder?.id === order.id
                        ? 'bg-indigo-50 border-indigo-500 shadow-lg'
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-800">
                          Orden {order.orderNumber}
                        </p>
                        {order.tableNumber && (
                          <p className="text-sm text-gray-600">Mesa {order.tableNumber}</p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {new Date(order.paidAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>{order.items.length} items</span>
                      {order.cancelledItems.length > 0 && (
                        <span className="text-red-600 font-semibold">
                          ⚠️ {order.cancelledItems.length} cancelados
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {order.payments.map((payment) => (
                        <span
                          key={payment.id}
                          className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700"
                        >
                          {payment.method === 'cash' ? '💵' : '💳'} ${payment.amount.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No hay órdenes pagadas para esta fecha
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="w-1/2 overflow-y-auto bg-gray-50">
            {selectedOrder ? (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Orden {selectedOrder.orderNumber}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Mesa</p>
                      <p className="font-semibold text-gray-800">
                        {selectedOrder.tableNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mesero</p>
                      <p className="font-semibold text-gray-800">
                        {selectedOrder.waiterName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pagado</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(selectedOrder.paidAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-bold text-green-600 text-lg">
                        ${selectedOrder.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payments */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3">Pagos</h4>
                  <div className="space-y-2">
                    {selectedOrder.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-800 capitalize">
                            {payment.method === 'cash' ? '💵 Efectivo' : payment.method === 'card' ? '💳 Tarjeta' : payment.method}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <p className="font-bold text-gray-800">
                          ${payment.amount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3">
                    Productos ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                          item.isCancelled
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${item.isCancelled ? 'text-red-600 line-through' : 'text-gray-800'}`}>
                            {item.name}
                            {item.isCancelled && (
                              <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                CANCELADO
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.quantity}x ${item.price.toFixed(2)}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-400 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <p className={`font-bold ${item.isCancelled ? 'text-red-600' : 'text-gray-800'}`}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancelled Items Summary */}
                {selectedOrder.cancelledItems.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <h4 className="font-bold text-red-800 mb-3">
                      ⚠️ Productos Cancelados ({selectedOrder.cancelledItems.length})
                    </h4>
                    <div className="space-y-2 mb-3">
                      {selectedOrder.cancelledItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white p-2 rounded border border-red-200 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-red-700 line-through">
                              {item.name}
                            </p>
                            <p className="text-xs text-red-600">
                              {item.quantity}x ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-bold text-red-700">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-red-200 flex items-center justify-between">
                      <p className="font-bold text-red-800">Total Cancelado:</p>
                      <p className="text-xl font-bold text-red-700">
                        ${selectedOrder.cancelledItemsTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Descuento:</span>
                        <span className="font-semibold text-red-600">
                          -${selectedOrder.discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Impuesto:</span>
                      <span className="font-semibold">${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    {selectedOrder.tip > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Propina:</span>
                        <span className="font-semibold">${selectedOrder.tip.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-300 flex justify-between">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        ${selectedOrder.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-4xl mb-4">📋</p>
                  <p>Selecciona una orden para ver detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold btn-touch transition active:scale-95"
          >
            Cerrar
          </button>
          <button
            onClick={loadPaidOrders}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold btn-touch transition active:scale-95"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};


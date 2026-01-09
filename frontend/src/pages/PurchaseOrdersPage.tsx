/**
 * Purchase Orders Page
 * List and manage purchase orders
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { purchaseService, PurchaseOrder } from '../services/purchase-service';

export const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | PurchaseOrder['status']>('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await purchaseService.getPurchaseOrders({
        status: filter === 'all' ? undefined : filter
      });
      setOrders(data);
    } catch (error) {
      toast.error('Error loading purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PurchaseOrder['status']) => {
    const labels: Record<PurchaseOrder['status'], string> = {
      draft: 'Borrador',
      sent: 'Enviada',
      confirmed: 'Confirmada',
      received: 'Recibida',
      cancelled: 'Cancelada'
    };
    return labels[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading purchase orders...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Órdenes de Compra</h1>
          <p className="text-gray-600">Gestiona tus órdenes de compra</p>
        </div>
        <button
          onClick={() => navigate('/purchases/orders/new')}
          className="btn-primary px-4 py-3 rounded-lg font-semibold btn-touch flex items-center gap-2"
        >
          <span>➕</span>
          <span>Nueva Orden</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } btn-touch`}
        >
          Todas
        </button>
        {(['draft', 'sent', 'confirmed', 'received', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
              filter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } btn-touch`}
          >
            {getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg shadow-md border-2 p-4 hover:shadow-lg transition cursor-pointer btn-touch"
            onClick={() => navigate(`/purchases/orders/${order.id}`)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Subtotal:</span>
                <span className="ml-2 font-semibold">${order.subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Impuesto:</span>
                <span className="ml-2 font-semibold">${order.tax.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-semibold text-green-600">${order.total.toFixed(2)}</span>
              </div>
              {order.expectedDeliveryDate && (
                <div>
                  <span className="text-gray-600">Entrega:</span>
                  <span className="ml-2">
                    {new Date(order.expectedDeliveryDate).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay órdenes de compra</p>
          <button
            onClick={() => navigate('/purchases/orders/new')}
            className="mt-4 btn-primary px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Crear Primera Orden
          </button>
        </div>
      )}
    </div>
  );
};



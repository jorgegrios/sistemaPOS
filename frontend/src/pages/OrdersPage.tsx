/**
 * Orders Page
 * List all orders with filtering and actions
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { orderService, Order } from '../services/order-service';

type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const result = await orderService.getOrders({
          restaurantId: user?.restaurantId,
          status: statusFilter === 'all' ? undefined : statusFilter
        });
        setOrders(result.orders);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load orders';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (user?.restaurantId) {
      loadOrders();
    }
  }, [user?.restaurantId, statusFilter]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string; border: string }> = {
      completed: { bg: 'bg-gradient-to-r from-green-400 to-emerald-500', text: 'text-white', icon: '✓', border: 'border-green-500' },
      pending: { bg: 'bg-gradient-to-r from-yellow-400 to-orange-500', text: 'text-white', icon: '⏳', border: 'border-yellow-500' },
      cancelled: { bg: 'bg-gradient-to-r from-red-400 to-rose-500', text: 'text-white', icon: '✕', border: 'border-red-500' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`${badge.bg} ${badge.text} ${badge.border} border-2 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit shadow-md`}>
        <span>{badge.icon}</span>
        {status === 'completed' ? 'Completada' : status === 'pending' ? 'Pendiente' : 'Cancelada'}
      </span>
    );
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text mb-2">
            📦 Órdenes
          </h1>
          <p className="text-gray-700 text-sm sm:text-base font-medium">Gestiona todas las órdenes</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/orders/new')}
            className="btn-primary px-5 sm:px-6 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg transition duration-200 active:scale-95 btn-touch-lg flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl w-full sm:w-auto"
          >
            <span className="text-2xl">📦</span>
            <span>Nueva Orden</span>
          </button>
          {user?.role !== 'waiter' && (
            <button
              onClick={() => navigate('/menu')}
              className="btn-success px-5 sm:px-6 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg transition duration-200 active:scale-95 btn-touch-lg flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl w-full sm:w-auto"
            >
              <span className="text-2xl">🍽️</span>
              <span>Menú</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl p-4 sm:p-5 mb-4 sm:mb-6 border-4 border-indigo-200">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {['all', 'pending', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as StatusFilter)}
              className={`px-5 py-3 sm:px-6 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition duration-200 capitalize active:scale-95 shadow-lg border-2 btn-touch ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-blue-400 shadow-xl scale-105'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 active:from-gray-300 active:to-gray-400 border-gray-300'
              }`}
            >
              {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendientes' : status === 'completed' ? 'Completadas' : 'Canceladas'}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-red-50 to-rose-100 border-4 border-red-300 rounded-xl shadow-lg">
          <p className="text-red-700 text-sm sm:text-base font-bold">Error al cargar órdenes: {error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl overflow-hidden border-4 border-indigo-200">
        {loading ? (
          <div className="p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <p className="text-gray-700 text-lg font-bold">Cargando órdenes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center bg-gradient-to-br from-purple-50 to-pink-100">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-700 text-lg sm:text-xl font-bold mb-4">No se encontraron órdenes</p>
            <button
              onClick={() => navigate('/orders/new')}
              className="inline-block bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-bold shadow-xl border-2 border-blue-400 btn-touch-lg"
            >
              Crear Primera Orden
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-white">#</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-white">Orden #</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-white">Items</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-white">Total</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-white">Estado</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-white hidden sm:table-cell">Creada</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-bold text-white">Acción</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={order.id} className="border-b-2 border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 font-medium">{idx + 1}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-bold text-gray-800">{order.orderNumber}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{order.items?.length || 0} items</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-bold text-green-700">${order.total.toFixed(2)}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm">{getStatusBadge(order.status)}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition duration-200 active:scale-95 shadow-md border-2 border-blue-400 btn-touch"
                        >
                          Ver
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => navigate(`/orders/${order.id}/pay`)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition duration-200 active:scale-95 shadow-md border-2 border-green-400 btn-touch"
                          >
                            Pagar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

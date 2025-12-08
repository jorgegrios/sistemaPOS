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
          status: statusFilter === 'all' ? undefined : (statusFilter as any)
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Orders</h1>
          <p className="text-gray-600">Manage all orders</p>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
        >
          + New Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as StatusFilter)}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 capitalize ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">Failed to load orders: {error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No orders found</p>
            <button
              onClick={() => navigate('/orders/new')}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Create First Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} items</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => navigate(`/orders/${order.id}/pay`)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Pay
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

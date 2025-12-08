/**
 * Dashboard Page
 * Overview of recent orders, statistics, and quick actions
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { orderService, Order } from '../services/order-service';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const result = await orderService.getOrders({
          restaurantId: user?.restaurantId,
          limit: 10
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
  }, [user?.restaurantId]);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedToday = orders.filter(o => o.status === 'completed').length;
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm font-medium">Pending Orders</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingOrders}</p>
          <p className="text-xs text-gray-400 mt-2">Awaiting completion</p>
        </div>

        {/* Completed Orders */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-medium">Completed Today</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{completedToday}</p>
          <p className="text-xs text-gray-400 mt-2">Total completed</p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">From completed orders</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/orders/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-6 text-center transition duration-200"
        >
          <p className="text-2xl mb-2">📦</p>
          <p className="font-bold">New Order</p>
          <p className="text-blue-100 text-sm mt-1">Create a new order</p>
        </button>

        <button
          onClick={() => navigate('/menu')}
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow p-6 text-center transition duration-200"
        >
          <p className="text-2xl mb-2">🍽️</p>
          <p className="font-bold">View Menu</p>
          <p className="text-green-100 text-sm mt-1">Browse menu items</p>
        </button>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
        </div>

        {error && (
          <div className="p-6 text-red-600 text-center">
            <p>Failed to load orders: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
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
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orders.length > 5 && (
          <div className="p-6 border-t border-gray-200 text-center">
            <button
              onClick={() => navigate('/orders')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Orders →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

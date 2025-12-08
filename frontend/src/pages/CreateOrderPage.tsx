/**
 * Create Order Page
 * Create new orders by selecting items from menu
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { menuService, MenuItem } from '../services/menu-service';
import { orderService, Order } from '../services/order-service';

interface CartItem extends MenuItem {
  cartQuantity: number;
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [tableId, setTableId] = useState('');
  const [tables] = useState(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);
        const menus = await menuService.getMenus(user?.restaurantId || '');
        if (menus.length > 0) {
          const details = await menuService.getMenuDetail(
            user?.restaurantId || '',
            menus[0].id
          );
          setMenuItems((details.items || []).filter(item => item.available));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load menu';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (user?.restaurantId) {
      loadMenu();
    }
  }, [user?.restaurantId]);

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(ci => ci.id === item.id);
    if (existingItem) {
      setCart(cart.map(ci =>
        ci.id === item.id ? { ...ci, cartQuantity: ci.cartQuantity + 1 } : ci
      ));
    } else {
      setCart([...cart, { ...item, cartQuantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(ci => (ci.id === id ? { ...ci, cartQuantity: quantity } : ci)));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(ci => ci.id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCreateOrder = async () => {
    if (!tableId) {
      setError('Please select a table');
      return;
    }

    if (cart.length === 0) {
      setError('Please add items to the order');
      return;
    }

    try {
      setCreatingOrder(true);
      const order = await orderService.createOrder({
        restaurantId: user?.restaurantId || '',
        tableId,
        waiterId: user?.id || '',
        items: cart.map(item => ({
          menuItemId: item.id,
          quantity: item.cartQuantity
        }))
      });

      navigate(`/orders/${order.id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMsg);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/orders')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Orders
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Create New Order</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2">
          {/* Table Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Table
            </label>
            <div className="grid grid-cols-4 gap-2">
              {tables.map(table => (
                <button
                  key={table}
                  onClick={() => setTableId(table)}
                  className={`py-3 rounded-lg font-medium transition duration-200 ${
                    tableId === table
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {table}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition duration-200"
                >
                  <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-blue-600">${item.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm">No items added yet</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                        className="w-6 h-6 bg-gray-300 rounded text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold">{item.cartQuantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                        className="w-6 h-6 bg-gray-300 rounded text-xs font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-red-600 hover:text-red-800 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Create Order Button */}
            <button
              onClick={handleCreateOrder}
              disabled={creatingOrder || cart.length === 0 || !tableId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              {creatingOrder ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

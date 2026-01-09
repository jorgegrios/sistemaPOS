/**
 * Create Order Page
 * Create new orders by selecting items from menu
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { menuService, MenuItem } from '../services/menu-service';
import { orderService } from '../services/order-service';
import { tableService } from '../services/table-service';
import { toast } from 'sonner';

interface CartItem extends MenuItem {
  cartQuantity: number;
}

interface MenuCategoryWithItems {
  id: string;
  name: string;
  displayOrder: number;
  items: MenuItem[];
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [menuCategories, setMenuCategories] = useState<MenuCategoryWithItems[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [tableId, setTableId] = useState('');
  const [tables, setTables] = useState<Array<{ id: string; tableNumber: string; capacity: number }>>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load tables
        try {
          const tablesData = await tableService.getTables();
          setTables(tablesData.map(t => ({ id: t.id, tableNumber: t.tableNumber, capacity: t.capacity })));
        } catch (err) {
          console.error('Error loading tables:', err);
          // Fallback to default tables if service fails
          setTables([
            { id: 'T1', tableNumber: 'T1', capacity: 4 },
            { id: 'T2', tableNumber: 'T2', capacity: 4 },
            { id: 'T3', tableNumber: 'T3', capacity: 4 },
            { id: 'T4', tableNumber: 'T4', capacity: 4 }
          ]);
        }

        // Load menu
        const response = await menuService.getMenus(user?.restaurantId || '');
        // El API retorna { menus: [...] }, necesitamos extraer el array
        const menusArray = Array.isArray(response) ? response : (response as any).menus || [];
        
        if (menusArray.length > 0) {
          const details = await menuService.getMenuDetail(
            user?.restaurantId || '',
            menusArray[0].id
          );
          
          // Organizar categorías con sus items
          const categories: MenuCategoryWithItems[] = [];
          if (details.categories && Array.isArray(details.categories)) {
            details.categories.forEach((category: any) => {
              const availableItems = (category.items || []).filter((item: MenuItem) => item.available);
              if (availableItems.length > 0) {
                categories.push({
                  id: category.id,
                  name: category.name,
                  displayOrder: category.displayOrder || 0,
                  items: availableItems
                });
                // Las categorías inician cerradas por defecto
              }
            });
          }
          
          // Ordenar por displayOrder
          categories.sort((a, b) => a.displayOrder - b.displayOrder);
          setMenuCategories(categories);
        } else {
          setMenuCategories([]);
          toast.info('No hay menús disponibles. Crea un menú primero en "Gestionar Menú"');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (user?.restaurantId) {
      loadData();
    }
  }, [user?.restaurantId]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const addToCart = (item: MenuItem) => {
    if (!item.available) {
      toast.error(`${item.name} is not available`);
      return;
    }
    
    const existingItem = cart.find(ci => ci.id === item.id);
    if (existingItem) {
      setCart(cart.map(ci =>
        ci.id === item.id ? { ...ci, cartQuantity: ci.cartQuantity + 1 } : ci
      ));
      toast.success(`Added ${item.name} to cart`);
    } else {
      setCart([...cart, { ...item, cartQuantity: 1 }]);
      toast.success(`Added ${item.name} to cart`);
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
    const item = cart.find(ci => ci.id === id);
    setCart(cart.filter(ci => ci.id !== id));
    if (item) {
      toast.info(`Removed ${item.name} from cart`);
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCreateOrder = async () => {
    if (!tableId) {
      const errorMsg = 'Please select a table';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (cart.length === 0) {
      const errorMsg = 'Please add items to the order';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setCreatingOrder(true);
      setError(null);
      
      // Prepare items with all required fields
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.cartQuantity,
        notes: item.description || undefined
      }));

      const order = await orderService.createOrder({
        restaurantId: user?.restaurantId || '',
        tableId,
        waiterId: user?.id || '',
        items: orderItems
      });

      toast.success(`Order ${order.orderNumber || order.id} created successfully!`);
      
      // Navigate to order detail after a short delay
      setTimeout(() => {
        navigate(`/orders/${order.id}`);
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMsg);
      toast.error(errorMsg);
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 sm:mb-6 lg:mb-8">
        <button
          onClick={() => navigate('/orders')}
          className="text-blue-600 hover:text-blue-800 active:text-blue-900 font-bold btn-touch self-start px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 shadow-md text-base sm:text-lg"
        >
          ← Volver a Órdenes
        </button>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
          📦 Crear Nueva Orden
        </h1>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-red-50 to-rose-100 border-4 border-red-300 rounded-xl shadow-lg">
          <p className="text-red-700 text-sm sm:text-base font-bold">{error}</p>
        </div>
      )}

      {/* Success indicator when cart has items */}
      {cart.length > 0 && !error && (
        <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-green-50 to-emerald-100 border-4 border-green-300 rounded-xl shadow-lg">
          <p className="text-green-700 text-sm sm:text-base font-bold">
            🛒 {cart.length} {cart.length === 1 ? 'item' : 'items'} en el carrito • Total: ${total.toFixed(2)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Quick Access Menu Button - Hidden for waiters */}
          {user?.role !== 'waiter' && (
            <div>
              <button
                onClick={() => navigate('/menu')}
                className="w-full btn-success px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition duration-200 active:scale-95 btn-touch-lg flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl"
              >
                <span className="text-xl sm:text-2xl">🍽️</span>
                <span>View Full Menu</span>
                <span className="text-base sm:text-lg">→</span>
              </button>
            </div>
          )}

          {/* Table Selection */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-xl p-4 sm:p-5 lg:p-6 border-4 border-blue-300">
            <label className="block text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-lg sm:text-xl">📍</span>
              <span>Seleccionar Mesa</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setTableId(table.id)}
                  className={`py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg transition duration-200 active:scale-95 shadow-md btn-touch relative ${
                    tableId === table.id
                      ? 'bg-blue-600 text-white shadow-lg scale-105 border-2 border-blue-700'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 active:from-gray-200 active:to-gray-300 border-2 border-gray-200'
                  }`}
                  title={`${table.tableNumber} - ${table.capacity} personas`}
                >
                  <div className="flex flex-col items-center">
                    <span>{table.tableNumber}</span>
                    <span className="text-xs opacity-75 mt-1">👥 {table.capacity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items by Category - Right below table selection */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">📋</span>
                <span>Productos del Menú</span>
              </h2>
              {user?.role !== 'waiter' && (
                <button
                  onClick={() => navigate('/menu/manage')}
                  className="btn-outline px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition duration-200 active:scale-95 btn-touch flex items-center gap-1 sm:gap-2"
                >
                  <span>Gestionar Menú</span>
                  <span>→</span>
                </button>
              )}
            </div>
            {menuCategories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <p className="text-gray-500 text-lg mb-2 font-semibold">No hay productos disponibles</p>
                <p className="text-gray-400 text-sm mb-4">Agrega productos al menú para poder crear órdenes</p>
                {user?.role !== 'waiter' && (
                  <button
                    onClick={() => navigate('/menu/manage')}
                    className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch"
                  >
                    Ir a Gestionar Menú
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {menuCategories.map(category => (
                  <div key={category.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    {/* Category Header - Touch-friendly */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 active:from-blue-200 active:to-blue-300 p-4 sm:p-5 flex items-center justify-between transition duration-200 btn-touch-lg"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3 flex-1">
                        <span className="text-xl sm:text-2xl min-w-[24px] sm:min-w-[28px]">
                          {expandedCategories.has(category.id) ? '▼' : '▶'}
                        </span>
                        <span className="flex-1 text-left">{category.name}</span>
                        <span className="text-xs sm:text-sm font-normal text-gray-600 bg-white px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                          {category.items.length} {category.items.length === 1 ? 'producto' : 'productos'}
                        </span>
                      </h3>
                    </button>
                    
                    {/* Category Items - Responsive grid */}
                    {expandedCategories.has(category.id) && (
                      <div className="p-3 sm:p-4 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {category.items.map(item => (
                            <div
                              key={item.id}
                              className="border-2 rounded-xl p-4 sm:p-5 transition duration-200 cursor-pointer bg-white border-green-200 hover:shadow-xl active:shadow-lg hover:border-green-300 active:scale-95 btn-touch"
                              onClick={() => addToCart(item)}
                            >
                              <div className="flex items-start justify-between mb-2 sm:mb-3">
                                <h4 className="font-bold text-gray-800 text-base sm:text-lg md:text-xl flex-1 pr-2">{item.name}</h4>
                              </div>
                              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 min-h-[36px] sm:min-h-[40px] line-clamp-2">{item.description || 'Sin descripción'}</p>
                              <div className="flex items-center justify-between pt-3 border-t border-gray-200 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500">Precio</span>
                                  <span className="text-xl sm:text-2xl font-bold text-blue-600">${item.price.toFixed(2)}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="btn-success px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition duration-200 active:scale-95 btn-touch shadow-md hover:shadow-lg whitespace-nowrap"
                                >
                                  <span className="flex items-center gap-1 sm:gap-2">
                                    <span>+</span>
                                    <span className="hidden sm:inline">Agregar</span>
                                  </span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-xl p-4 sm:p-6 sticky top-4 sm:top-6 border-2 border-blue-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🛒</span>
              Order Summary
            </h2>

            {/* Cart Items */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm">No items added yet</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">{item.name}</p>
                      <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                        className="w-12 h-12 sm:w-10 sm:h-10 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg text-xl sm:text-lg font-bold transition duration-200 active:scale-95 shadow-md hover:shadow-lg"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-bold text-lg sm:text-base bg-blue-100 text-blue-700 rounded-lg py-2">{item.cartQuantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                        className="w-12 h-12 sm:w-10 sm:h-10 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg text-xl sm:text-lg font-bold transition duration-200 active:scale-95 shadow-md hover:shadow-lg"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 w-12 h-12 sm:w-10 sm:h-10 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-bold text-lg sm:text-base flex items-center justify-center transition duration-200 active:scale-95 shadow-md hover:shadow-lg"
                        aria-label="Remove item"
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
              className="w-full btn-primary text-white font-bold py-5 px-6 rounded-xl transition duration-200 active:scale-95 btn-touch-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              {creatingOrder ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin text-2xl">⏳</span>
                  <span>Creating Order...</span>
                </span>
              ) : (
                <>
                  <span className="text-2xl">✅</span>
                  <span>Create Order ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                </>
              )}
            </button>
            
            {!tableId && (
              <p className="text-red-600 text-sm font-semibold text-center mt-3 flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>Please select a table first</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

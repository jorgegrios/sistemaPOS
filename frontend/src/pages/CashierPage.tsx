/**
 * Cashier Page
 * Cashier view with active tables and payment calculator
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { cashierService, ActiveTable } from '../services/cashier-service';
import { paymentService } from '../services/payment-service';
import { orderService, Order } from '../services/order-service';
import { menuService, MenuItem } from '../services/menu-service';
import { toast } from 'sonner';

export const CashierPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTables, setActiveTables] = useState<ActiveTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<ActiveTable | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; orderNumber: string; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Order detail modal state
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Current date and time state
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Payment calculator state
  const [display, setDisplay] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [tip, setTip] = useState(0);
  
  // Product cart for general payments (no table selected)
  interface CartItem {
    item: MenuItem;
    quantity: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadActiveTables();
    // Refresh every 5 seconds for real-time updates (multi-user support)
    const interval = setInterval(loadActiveTables, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedOrder && user?.restaurantId) {
      loadMenu();
    }
  }, [selectedOrder, user?.restaurantId]);

  useEffect(() => {
    // Update display when cart changes
    if (!selectedOrder && cart.length > 0) {
      const total = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
      setDisplay(total.toFixed(2));
    } else if (!selectedOrder && cart.length === 0) {
      setDisplay('0');
    }
  }, [cart, selectedOrder]);

  const loadActiveTables = async () => {
    try {
      setLoading(true);
      const tables = await cashierService.getActiveTables();
      setActiveTables(tables);
    } catch (err) {
      console.error('Error loading active tables:', err);
      toast.error('Error al cargar mesas activas');
    } finally {
      setLoading(false);
    }
  };

  const loadMenu = async () => {
    if (!user?.restaurantId) return;
    try {
      setLoadingMenu(true);
      const menusResponse = await menuService.getMenus(user.restaurantId);
      // Handle both array and object with menus property
      let menus: any[] = [];
      if (Array.isArray(menusResponse)) {
        menus = menusResponse;
      } else if (menusResponse && typeof menusResponse === 'object' && 'menus' in menusResponse) {
        menus = (menusResponse as any).menus || [];
      }
      
      if (!Array.isArray(menus) || menus.length === 0) {
        console.log('No menus found');
        setMenuItems([]);
        return;
      }

      let allItems: MenuItem[] = [];
      // Load items from all menus
      for (const menu of menus) {
        try {
          const menuDetail = await menuService.getMenuDetail(user.restaurantId, menu.id);
          if (menuDetail?.items && Array.isArray(menuDetail.items)) {
            allItems = [...allItems, ...menuDetail.items.filter(item => item.available)];
          }
        } catch (menuErr) {
          console.error(`Error loading menu ${menu.id}:`, menuErr);
          // Continue with other menus
        }
      }
      // Sort by name
      allItems.sort((a, b) => a.name.localeCompare(b.name));
      setMenuItems(allItems);
    } catch (err) {
      console.error('Error loading menu:', err);
      toast.error('Error al cargar el menú');
      setMenuItems([]);
    } finally {
      setLoadingMenu(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => 
          c.item.id === item.id 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => 
      prev.map(c => 
        c.item.id === itemId 
          ? { ...c, quantity }
          : c
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDisplay('0');
  };

  // Calculate filtered products - ensure it always returns an array
  const filteredProducts = React.useMemo(() => {
    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return [];
    }
    if (!productSearch || !productSearch.trim()) {
      return menuItems;
    }
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [menuItems, productSearch]);

  const handleTableSelect = (table: ActiveTable) => {
    setSelectedTable(table);
    setCart([]); // Clear cart when selecting a table
    if (table.orders.length > 0) {
      const firstOrder = table.orders[0];
      setSelectedOrder({
        id: firstOrder.id,
        orderNumber: firstOrder.orderNumber,
        total: firstOrder.total
      });
      setDisplay(firstOrder.total.toFixed(2));
      setTip(0);
    } else {
      setSelectedOrder(null);
      setDisplay('0');
    }
  };

  const handleOrderSelect = async (order: { id: string; orderNumber: string; total: number }) => {
    // Check if this order has check requested - if so, show detail modal
    const tableOrder = selectedTable?.orders.find(o => o.id === order.id);
    if (tableOrder?.checkRequestedAt) {
      // Load full order details and show modal
      try {
        const fullOrder = await orderService.getOrder(order.id);
        setOrderDetail(fullOrder);
        setShowOrderModal(true);
      } catch (err) {
        console.error('Error loading order details:', err);
        toast.error('Error al cargar detalles de la orden');
      }
    } else {
      // Normal selection for payment
      setSelectedOrder(order);
      setDisplay(order.total.toFixed(2));
      setTip(0);
    }
  };

  const handleCancelTicket = async () => {
    if (!orderDetail) return;

    if (!confirm('¿Deseas cancelar el ticket para esta orden? El mesero podrá volver a solicitarlo.')) {
      return;
    }

    try {
      setProcessing(true);
      await orderService.cancelCheck(orderDetail.id);
      toast.success('Ticket cancelado exitosamente');
      setShowOrderModal(false);
      setOrderDetail(null);
      await loadActiveTables();
    } catch (err: any) {
      console.error('Error canceling ticket:', err);
      toast.error(err.message || 'Error al cancelar el ticket');
    } finally {
      setProcessing(false);
    }
  };

  // Calculator functions
  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    if (selectedOrder) {
      setDisplay(selectedOrder.total.toFixed(2));
      setTip(0);
    } else {
      setDisplay('0');
    }
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      const newDisplay = display.slice(0, -1);
      setDisplay(newDisplay);
    } else {
      setDisplay('0');
    }
  };

  const handleTipPercentage = (percentage: number) => {
    if (!selectedOrder) {
      // For general payments, calculate tip based on current display amount
      const currentAmount = parseFloat(display) || 0;
      const tipAmount = (currentAmount * percentage) / 100;
      setTip(tipAmount);
      setDisplay((currentAmount + tipAmount).toFixed(2));
      return;
    }
    const tipAmount = (selectedOrder.total * percentage) / 100;
    setTip(tipAmount);
    const total = selectedOrder.total + tipAmount;
    setDisplay(total.toFixed(2));
  };

  const handleProcessPayment = async () => {
    const amount = parseFloat(display);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido para el pago');
      return;
    }

    try {
      setProcessing(true);

      // For cash payments, process directly (works with or without order)
      if (paymentMethod === 'cash') {
        // Generate UUID for general payments if no order selected
        const generateId = () => {
          if (selectedOrder?.id) return selectedOrder.id;
          // Use crypto.randomUUID() if available, otherwise generate simple unique ID
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return `general-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        };
        const generalOrderId = generateId();
        const idempotencyKey = `cash-payment-${generalOrderId}-${Date.now()}`;
        
        const paymentData = {
          orderId: generalOrderId, // Use orderId if selected, else generate new UUID for general payment
          amount: amount, // Keep as decimal for backend (will be converted internally if needed)
          currency: 'USD',
          method: 'cash' as const,
          provider: 'stripe' as const, // Backend handles cash internally, any provider works
          paymentMethodId: `cash-${Date.now()}`,
          idempotencyKey: idempotencyKey,
          tip: tip || 0,
          metadata: {
            ...(selectedOrder ? { orderNumber: selectedOrder.orderNumber } : {}),
            description: selectedOrder ? `Pago orden ${selectedOrder.orderNumber}` : cart.length > 0 
              ? `Pago general - ${cart.map(c => `${c.quantity}x ${c.item.name}`).join(', ')}`
              : 'Pago general - Servicio adicional',
            tip: tip || 0,
            paymentMethod: 'cash',
            type: selectedOrder ? 'order' : 'general',
            provider: 'cash' // Custom provider indicator in metadata for reporting
          }
        };

        const response = await paymentService.processPayment(paymentData);
        
        if (response.status === 'succeeded') {
          toast.success(selectedOrder 
            ? `Pago registrado correctamente para orden ${selectedOrder.orderNumber}`
            : 'Pago general registrado correctamente'
          );
          setSelectedTable(null);
          setSelectedOrder(null);
          setSelectedTable(null);
          setDisplay('0');
          setTip(0);
          setCart([]);
          setProductSearch('');
          setShowProductSelector(false);
          await loadActiveTables();
        } else {
          toast.error('Error al procesar el pago');
        }
      } else {
        // For card payments
        if (selectedOrder) {
          // Navigate to payment page for specific order
          navigate(`/orders/${selectedOrder.id}/pay`);
        } else {
          // For general card payments, require products in cart
          if (cart.length === 0) {
            toast.error('Para pagos con tarjeta, selecciona productos o una orden primero');
            setProcessing(false);
            return;
          }
          // For general card payments with products, we could create a temporary order
          // For now, inform user they need to select an order for card payments
          toast.error('Para pagos con tarjeta, por favor selecciona una orden de una mesa primero');
        }
      }
    } catch (err: any) {
      console.error('Error processing payment:', err);
      toast.error(err.message || 'Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header - Minimal for cashiers */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg border-b-4 border-indigo-400 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">💰 Caja</h1>
            <p className="text-xs sm:text-sm text-indigo-100">Cajero: {user?.name}</p>
          </div>
          {/* Date and Time */}
          <div className="flex flex-col items-end gap-1 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-white/30">
            <p className="text-white text-sm sm:text-base font-bold">
              {currentDateTime.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-white text-base sm:text-lg font-bold">
              {currentDateTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('pos_token');
              window.location.href = '/login';
            }}
            className="bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white px-5 py-3 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 btn-touch border-2 border-indigo-400"
          >
            🚪 Salir
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Active Tables */}
        <div className="w-full lg:w-1/2 border-r-0 lg:border-r-4 border-purple-300 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-lg sm:text-xl">📍</span>
              <span>Mesas</span>
            </h2>
            <button
              onClick={loadActiveTables}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-sm sm:text-base rounded-xl font-bold transition duration-200 btn-touch shadow-lg border-2 border-blue-400"
            >
              🔄 Actualizar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando mesas...</p>
            </div>
          ) : activeTables.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="text-4xl sm:text-5xl mb-4">📍</div>
              <p className="text-gray-500 text-lg font-semibold">No hay mesas configuradas</p>
              <p className="text-gray-400 text-sm">Configura mesas en el panel de administración</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {activeTables
                .sort((a, b) => {
                  // Sort: tables with check requested first, then active tables, then inactive
                  const aHasCheckRequested = a.orders.some(o => o.checkRequestedAt);
                  const bHasCheckRequested = b.orders.some(o => o.checkRequestedAt);
                  
                  if (aHasCheckRequested && !bHasCheckRequested) return -1;
                  if (!aHasCheckRequested && bHasCheckRequested) return 1;
                  if (a.isActive && !b.isActive) return -1;
                  if (!a.isActive && b.isActive) return 1;
                  return parseInt(a.tableNumber) - parseInt(b.tableNumber);
                })
                .map(table => {
                  const isActive = table.isActive;
                  const hasCheckRequested = table.orders.some(o => o.checkRequestedAt);
                  const totalAmount = table.orders.reduce((sum, o) => sum + o.total, 0);
                  
                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableSelect(table)}
                      className={`p-4 sm:p-6 rounded-xl shadow-lg border-2 transition-all duration-200 btn-touch-lg relative ${
                        selectedTable?.id === table.id
                          ? 'bg-blue-600 text-white border-blue-700 scale-105'
                          : isActive
                          ? hasCheckRequested
                            ? 'bg-purple-100 border-purple-500 hover:border-purple-600 hover:shadow-xl animate-pulse'
                            : 'bg-green-50 border-green-400 hover:border-green-500 hover:shadow-xl'
                          : 'bg-gray-100 border-gray-300 hover:border-gray-400 hover:shadow-xl'
                      }`}
                    >
                      {hasCheckRequested && selectedTable?.id !== table.id && (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                          🧾
                        </div>
                      )}
                      <div className="text-center w-full">
                        <div className="text-lg sm:text-xl mb-2">📍</div>
                        <h3 className={`font-bold text-xl sm:text-2xl mb-2 ${
                          selectedTable?.id === table.id
                            ? 'text-white'
                            : isActive
                            ? 'text-green-800'
                            : 'text-gray-600'
                        }`}>
                          {table.tableNumber}
                          {hasCheckRequested && (
                            <span className="ml-1.5 text-sm">🧾</span>
                          )}
                        </h3>
                        {isActive ? (
                          <div className={`mt-2 pt-2 border-t ${
                            selectedTable?.id === table.id
                              ? 'border-white border-opacity-30'
                              : 'border-green-300'
                          }`}>
                            <p className={`text-xs sm:text-sm font-semibold mb-1 ${
                              selectedTable?.id === table.id
                                ? 'text-white'
                                : 'text-green-800'
                            }`}>
                              ✓ Activa
                            </p>
                            <p className={`text-xs sm:text-sm font-semibold mb-1 ${
                              selectedTable?.id === table.id
                                ? 'text-white opacity-90'
                                : 'text-green-700'
                            }`}>
                              {table.orders.length} {table.orders.length === 1 ? 'orden' : 'órdenes'}
                              {hasCheckRequested && (
                                <span className="ml-1 text-purple-600">🧾</span>
                              )}
                            </p>
                            <p className={`text-base sm:text-lg font-bold ${
                              selectedTable?.id === table.id
                                ? 'text-white'
                                : 'text-green-700'
                            }`}>
                              ${totalAmount.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <div className={`mt-2 pt-2 border-t ${
                            selectedTable?.id === table.id
                              ? 'border-white border-opacity-30'
                              : 'border-gray-300'
                          }`}>
                            <p className={`text-xs sm:text-sm font-semibold ${
                              selectedTable?.id === table.id
                                ? 'text-white opacity-75'
                                : 'text-gray-500'
                            }`}>
                              ○ Disponible
                            </p>
                          </div>
                        )}
                      </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Table Orders */}
          {selectedTable && (
            <div className="mt-6 bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl">📍</span>
                <span>Mesa {selectedTable.tableNumber}</span>
                {selectedTable.isActive ? (
                  <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-bold rounded-lg border-2 border-green-300">
                    ✓ Activa
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-bold rounded-lg border-2 border-gray-300">
                    ○ Disponible
                  </span>
                )}
              </h3>
              {selectedTable.orders.length > 0 ? (
                <div className="space-y-3">
                  {selectedTable.orders
                    .sort((a, b) => {
                      // Sort: check requested first, then by creation date
                      if (a.checkRequestedAt && !b.checkRequestedAt) return -1;
                      if (!a.checkRequestedAt && b.checkRequestedAt) return 1;
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .map(order => {
                      const hasCheckRequested = !!order.checkRequestedAt;
                      return (
                        <button
                          key={order.id}
                          onClick={() => handleOrderSelect({
                            id: order.id,
                            orderNumber: order.orderNumber,
                            total: order.total
                          })}
                          className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left btn-touch ${
                            selectedOrder?.id === order.id
                              ? hasCheckRequested
                                ? 'bg-purple-100 border-purple-500 shadow-lg scale-105'
                                : 'bg-blue-50 border-blue-500 shadow-md'
                              : hasCheckRequested
                              ? 'bg-purple-50 border-purple-400 hover:border-purple-500 shadow-md animate-pulse'
                              : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-gray-800">{order.orderNumber}</p>
                                {hasCheckRequested && (
                                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                    🧾 Cuenta Solicitada
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{order.itemCount} items</p>
                              {hasCheckRequested && order.checkRequestedAt && (
                                <p className="text-xs text-purple-600 mt-1">
                                  Solicitada: {new Date(order.checkRequestedAt).toLocaleTimeString('es-ES')}
                                </p>
                              )}
                            </div>
                            <p className={`text-lg font-bold ${
                              hasCheckRequested ? 'text-purple-700' : 'text-blue-600'
                            }`}>
                              ${order.total.toFixed(2)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No hay órdenes pendientes</p>
                  <p className="text-sm text-gray-400 mt-1">Esta mesa está disponible</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Payment Calculator */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-y-auto p-3 sm:p-4 lg:p-6 border-t-4 lg:border-t-0 lg:border-l-4 border-purple-300">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl shadow-lg">
            <span className="text-xl sm:text-2xl">💰</span>
            <span>Registrar Pago</span>
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {/* Order Info - Only show if order is selected */}
            {selectedOrder && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl shadow-xl p-4 sm:p-6 border-4 border-blue-400">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Orden</p>
                    <p className="text-xl font-bold text-gray-800">{selectedOrder.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-blue-600">${selectedOrder.total.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
              setSelectedTable(null);
              setDisplay('0');
              setTip(0);
              setCart([]);
              setProductSearch('');
              setShowProductSelector(false);
              setProductSearch('');
              setShowProductSelector(false);
                  }}
                  className="w-full mt-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 btn-touch"
                >
                  Limpiar Selección
                </button>
              </div>
            )}

            {/* Product Selector - Only show if no order selected */}
            {!selectedOrder && (
              <>
                {/* Cart Summary */}
                {cart.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-xl p-4 sm:p-6 border-4 border-green-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800">🛒 Carrito ({cart.length} {cart.length === 1 ? 'producto' : 'productos'})</h3>
                      <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-800 font-semibold text-sm btn-touch px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 border-2 border-red-200"
                      >
                        Limpiar
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {cart.map(cartItem => (
                        <div key={cartItem.item.id} className="flex items-center justify-between bg-white rounded-lg p-3 border-2 border-green-200">
                          <div className="flex-1">
                            <p className="font-semibold text-sm sm:text-base text-gray-800">{cartItem.item.name}</p>
                            <p className="text-xs text-gray-600">${cartItem.item.price.toFixed(2)} c/u</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                              className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold btn-touch border-2 border-red-300"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={cartItem.quantity}
                              onChange={(e) => updateQuantity(cartItem.item.id, parseInt(e.target.value) || 1)}
                              className="w-12 text-center font-bold text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                            <button
                              onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                              className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-bold btn-touch border-2 border-green-300"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(cartItem.item.id)}
                              className="ml-2 text-red-600 hover:text-red-800 text-lg font-bold btn-touch"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="ml-3 text-right">
                            <p className="font-bold text-sm sm:text-base text-gray-800">
                              ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t-2 border-green-300 flex justify-between items-center">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="text-xl font-bold text-green-700">${display}</span>
                    </div>
                  </div>
                )}

                {/* Product Selector */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl shadow-xl p-4 sm:p-6 border-4 border-orange-300">
                  <button
                    onClick={async () => {
                      const newState = !showProductSelector;
                      setShowProductSelector(newState);
                      // Always try to load menu if opening and no items loaded
                      if (newState && (!menuItems || menuItems.length === 0) && user?.restaurantId && !loadingMenu) {
                        console.log('Loading menu on button click...');
                        await loadMenu();
                      }
                    }}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold text-base sm:text-lg transition duration-200 active:scale-95 shadow-lg border-2 border-orange-400 btn-touch-lg"
                  >
                    {showProductSelector ? '✕ Cerrar Productos' : '📦 Seleccionar Productos'}
                    {loadingMenu && ' (Cargando...)'}
                  </button>
                </div>

                {/* Product List */}
                {showProductSelector && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-xl p-4 sm:p-6 border-4 border-blue-300 mt-4">
                    {/* Search Bar */}
                    <div className="mb-4">
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="🔍 Buscar producto..."
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-base shadow-md"
                      />
                    </div>

                    {/* Products List */}
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {loadingMenu ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 font-medium mb-2">Cargando productos...</p>
                          <div className="animate-spin text-2xl">⏳</div>
                        </div>
                      ) : menuItems.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 font-medium mb-2">No hay productos disponibles</p>
                          <p className="text-sm text-gray-500">Crea productos en el menú primero</p>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 font-medium mb-2">No se encontraron productos</p>
                          <p className="text-sm text-gray-500">Intenta con otro término de búsqueda</p>
                          <button
                            onClick={() => setProductSearch('')}
                            className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium btn-touch"
                          >
                            Limpiar búsqueda
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredProducts.map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                addToCart(item);
                                toast.success(`${item.name} agregado al carrito`);
                              }}
                              className="w-full text-left p-4 bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition duration-200 btn-touch shadow-md hover:shadow-lg active:scale-95"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-base sm:text-lg text-gray-800 flex-1">
                                  {item.name}
                                </span>
                                <span className="font-bold text-base sm:text-lg text-blue-600 ml-4 whitespace-nowrap">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Display */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 sm:p-8 border-4 border-green-400">
              <div className="text-right">
                <p className="text-green-300 text-sm sm:text-base mb-2 font-semibold">Monto a Pagar</p>
                <p className="text-4xl sm:text-6xl font-bold text-green-400 font-mono drop-shadow-lg">
                  ${display}
                </p>
                {selectedOrder && tip > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Base: ${selectedOrder.total.toFixed(2)} + Propina: ${tip.toFixed(2)} = ${(selectedOrder.total + tip).toFixed(2)}
                  </p>
                )}
                {!selectedOrder && tip > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Base: ${(parseFloat(display) - tip).toFixed(2)} + Propina: ${tip.toFixed(2)} = ${display}
                  </p>
                )}
                {!selectedOrder && tip === 0 && cart.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {cart.length} {cart.length === 1 ? 'producto' : 'productos'} seleccionado{cart.length > 1 ? 's' : ''}
                  </p>
                )}
                {!selectedOrder && tip === 0 && cart.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Ingresa el monto manualmente o selecciona productos
                  </p>
                )}
              </div>
            </div>

            {/* Tip Buttons - Always available, but calculated differently */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl shadow-xl p-4 sm:p-6 border-4 border-yellow-300">
              <p className="text-sm font-semibold text-gray-700 mb-3">Propina Rápida</p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[0, 10, 15, 20].map(percent => {
                  const baseAmount = selectedOrder ? selectedOrder.total : (parseFloat(display) || 0);
                  const tipAmount = (baseAmount * percent) / 100;
                  const isSelected = Math.abs(tip - tipAmount) < 0.01; // Compare with small tolerance for floating point
                  
                  return (
                    <button
                      key={percent}
                      onClick={() => handleTipPercentage(percent)}
                      className={`py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition duration-200 active:scale-95 btn-touch ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {percent}%
                    </button>
                  );
                })}
              </div>
              {tip > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Propina: ${tip.toFixed(2)}
                </p>
              )}
            </div>

              {/* Calculator */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-xl shadow-xl p-4 sm:p-6 border-4 border-indigo-300">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      onClick={() => handleNumber(num.toString())}
                      className="py-4 sm:py-6 bg-gradient-to-br from-white to-gray-100 hover:from-blue-100 hover:to-blue-200 active:from-blue-200 active:to-blue-300 rounded-xl font-bold text-xl sm:text-2xl transition duration-200 active:scale-95 shadow-lg border-2 border-gray-300 hover:border-blue-400 text-gray-800"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleClear}
                    className="py-4 sm:py-6 bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 active:from-red-600 active:to-red-800 text-white rounded-xl font-bold text-base sm:text-lg transition duration-200 active:scale-95 shadow-lg border-2 border-red-300"
                  >
                    C
                  </button>
                  <button
                    onClick={() => handleNumber('0')}
                    className="py-4 sm:py-6 bg-gradient-to-br from-white to-gray-100 hover:from-blue-100 hover:to-blue-200 active:from-blue-200 active:to-blue-300 rounded-xl font-bold text-xl sm:text-2xl transition duration-200 active:scale-95 shadow-lg border-2 border-gray-300 hover:border-blue-400 text-gray-800"
                  >
                    0
                  </button>
                  <button
                    onClick={handleDecimal}
                    className="py-4 sm:py-6 bg-gradient-to-br from-white to-gray-100 hover:from-blue-100 hover:to-blue-200 active:from-blue-200 active:to-blue-300 rounded-xl font-bold text-xl sm:text-2xl transition duration-200 active:scale-95 shadow-lg border-2 border-gray-300 hover:border-blue-400 text-gray-800"
                  >
                    .
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="py-4 sm:py-6 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 active:from-yellow-600 active:to-orange-700 text-white rounded-xl font-bold text-base sm:text-lg transition duration-200 active:scale-95 shadow-lg border-2 border-yellow-300"
                  >
                    ⌫
                  </button>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl shadow-xl p-4 sm:p-6 border-4 border-teal-300">
                <p className="text-base sm:text-lg font-bold text-gray-800 mb-4">💳 Método de Pago</p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-5 sm:py-6 rounded-xl font-bold text-base sm:text-lg transition duration-200 active:scale-95 shadow-lg border-4 ${
                      paymentMethod === 'cash'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl border-green-400 scale-105'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border-gray-300'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl block mb-2">💵</span>
                    <span>Efectivo</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-5 sm:py-6 rounded-xl font-bold text-base sm:text-lg transition duration-200 active:scale-95 shadow-lg border-4 ${
                      paymentMethod === 'card'
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-xl border-blue-400 scale-105'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border-gray-300'
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl block mb-2">💳</span>
                    <span>Tarjeta</span>
                  </button>
                </div>
              </div>

            {/* Process Payment Button - Always Active */}
            <button
              onClick={handleProcessPayment}
              disabled={processing}
              className={`w-full py-6 sm:py-7 rounded-xl font-bold text-lg sm:text-xl transition duration-200 active:scale-95 shadow-2xl border-4 ${
                processing
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed border-gray-300'
                  : paymentMethod === 'cash'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:from-green-700 active:to-emerald-800 text-white border-green-400 hover:shadow-2xl'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 active:from-blue-700 active:to-cyan-800 text-white border-blue-400 hover:shadow-2xl'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>Procesando...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-2xl">✓</span>
                  <span>
                    Registrar Pago {paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                    {selectedOrder ? ` - ${selectedOrder.orderNumber}` : ' - General'}
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal - Shows when clicking on order with check requested */}
      {showOrderModal && orderDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Detalle del Ticket</h2>
                <p className="text-sm text-gray-600 mt-1">Orden: {orderDetail.orderNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setOrderDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition duration-200 btn-touch"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Check Requested Badge */}
              {orderDetail.checkRequestedAt && (
                <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🧾</span>
                    <p className="font-bold text-purple-800">Cuenta Solicitada</p>
                  </div>
                  <p className="text-sm text-purple-700">
                    Solicitada: {new Date(orderDetail.checkRequestedAt).toLocaleString('es-ES')}
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Items de la Orden</h3>
                <div className="space-y-3">
                  {orderDetail.items && orderDetail.items.length > 0 ? (
                    orderDetail.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-semibold">
                              {item.quantity}x
                            </span>
                            <div>
                              <p className="font-semibold text-gray-800">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                              )}
                              {'notes' in item && item.notes && (
                                <p className="text-xs text-gray-400 mt-1 italic">Nota: {item.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">${item.price.toFixed(2)} c/u</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay items en esta orden</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${orderDetail.subtotal.toFixed(2)}</span>
                </div>
                {orderDetail.tax > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Impuesto</span>
                    <span>${orderDetail.tax.toFixed(2)}</span>
                  </div>
                )}
                {orderDetail.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento</span>
                    <span>-${orderDetail.discount.toFixed(2)}</span>
                  </div>
                )}
                {orderDetail.tip > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Propina</span>
                    <span>${orderDetail.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span>${orderDetail.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedOrder({
                      id: orderDetail.id,
                      orderNumber: orderDetail.orderNumber,
                      total: orderDetail.total
                    });
                    setDisplay(orderDetail.total.toFixed(2));
                    setTip(0);
                    setShowOrderModal(false);
                    setOrderDetail(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 btn-touch"
                >
                  💳 Procesar Pago
                </button>
                <button
                  onClick={handleCancelTicket}
                  disabled={processing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50 btn-touch"
                >
                  {processing ? 'Cancelando...' : '❌ Cancelar Ticket'}
                </button>
                <button
                  onClick={() => {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
                    window.open(`${apiUrl}/orders/${orderDetail.id}/receipt`, '_blank');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 btn-touch"
                >
                  🖨️ Ver Recibo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


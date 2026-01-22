/**
 * Cashier Page - Touch-First POS Design
 * 100% touchscreen-optimized cashier interface
 * Adaptive design: Mobile → Tablet → Desktop
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/auth-context';
import { cashierService, ActiveTable } from '../services/cashier-service';
import { paymentsDomainService, PaymentMethod } from '../domains/payments/service';
import { ordersDomainService, OrderWithItems } from '../domains/orders/service';
import { tablesDomainService } from '../domains/tables/service';
import { menuService, MenuItem } from '../services/menu-service';
import { toast } from 'sonner';
import { CashRegisterSummaryModal } from '../components/CashRegisterSummaryModal';
import { PaidOrdersModal } from '../components/PaidOrdersModal';
import { CashSession } from '../services/cashier-service';
import { Modal } from '../components/Modal';

type TableStatus = 'available' | 'active' | 'ready_to_pay' | 'paid';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export const CashierPage: React.FC = () => {
  const { user } = useAuth();

  // Tables state
  const [activeTables, setActiveTables] = useState<ActiveTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<ActiveTable | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment state
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [tip, setTip] = useState(0);
  const [tipPercentage, setTipPercentage] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [processing, setProcessing] = useState(false);

  // Order items state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // UI state
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadValue, setNumpadValue] = useState('');
  const [numpadContext, setNumpadContext] = useState<'tip' | 'amount' | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<'tables' | 'payment'>('tables');

  // General payment (no table) state
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number }>>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Modals state
  const [showCashRegisterSummary, setShowCashRegisterSummary] = useState(false);
  const [showPaidOrders, setShowPaidOrders] = useState(false);
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState('');

  // Update date and time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load active tables
  useEffect(() => {
    checkSession();
    loadActiveTables();
    const interval = setInterval(loadActiveTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkSession = async () => {
    try {
      const session = await cashierService.getCurrentSession();
      setCurrentSession(session);
      if (!session) {
        setShowOpenSessionModal(true);
      }
    } catch (err) {
      console.error('Error checking cash session:', err);
    }
  };

  const handleOpenSession = async () => {
    if (!openingBalanceInput || isNaN(parseFloat(openingBalanceInput))) {
      toast.error('Ingrese un monto inicial válido');
      return;
    }
    try {
      setProcessing(true);
      const session = await cashierService.openSession(parseFloat(openingBalanceInput));
      setCurrentSession(session);
      setShowOpenSessionModal(false);
      toast.success('Caja abierta exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al abrir caja');
    } finally {
      setProcessing(false);
    }
  };

  // Load menu for general payments
  useEffect(() => {
    if (user?.restaurantId && !selectedOrder) {
      loadMenu();
    }
  }, [user?.restaurantId, selectedOrder]);

  // Auto-load order when table is selected
  useEffect(() => {
    if (selectedTable && selectedTable.orders && selectedTable.orders.length > 0) {
      loadAllOrdersForTable(selectedTable);
    } else if (selectedTable && (!selectedTable.orders || selectedTable.orders.length === 0)) {
      // Table selected but no orders - clear everything
      setSelectedOrder(null);
      setOrderItems([]);
      resetPayment();
    }
  }, [selectedTable]);

  // Calculate totals when order items or tip change
  useEffect(() => {
    if (selectedOrder && orderItems.length > 0) {
      const newSubtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setSubtotal(newSubtotal);
      setTax(newSubtotal * 0.1); // 10% tax
    } else if (cart.length > 0) {
      const newSubtotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
      setSubtotal(newSubtotal);
      setTax(newSubtotal * 0.1);
    } else {
      setSubtotal(0);
      setTax(0);
    }
  }, [orderItems, cart, selectedOrder]);

  // Calculate total with tip
  useEffect(() => {
    setTotal(subtotal + tax + tip);
  }, [subtotal, tax, tip]);

  const loadActiveTables = async () => {
    try {
      setLoading(true);
      const tables = await cashierService.getActiveTables();
      // Filtrar mesas: solo incluir órdenes con payment_status = 'pending' y status válido
      // Esto asegura que mesas liberadas no muestren órdenes
      const filteredTables = tables.map(table => {
        const validOrders = table.orders.filter(order =>
          order.paymentStatus === 'pending' &&
          order.orderStatus !== 'closed' &&
          order.orderStatus !== 'cancelled'
        );

        return {
          ...table,
          orders: validOrders,
          isActive: validOrders.length > 0 // Actualizar isActive basado en órdenes filtradas
        };
      });

      // Debug logging
      console.log('[CashierPage] Loaded tables:', filteredTables.length);
      filteredTables.forEach(table => {
        if (table.orders.length > 0) {
          console.log(`[CashierPage] Table ${table.tableNumber}: ${table.orders.length} orders, isActive: ${table.isActive}`);
        }
      });

      setActiveTables(filteredTables);
    } catch (err) {
      console.error('Error loading active tables:', err);
      toast.error('Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  };

  /*
  const loadOrderDetails = async (orderId: string) => {
    // ... (rest of the function)
  };
  */

  // Load all orders for a table and combine their items
  const loadAllOrdersForTable = async (table: ActiveTable) => {
    if (!table.orders || table.orders.length === 0) {
      setSelectedOrder(null);
      setOrderItems([]);
      resetPayment();
      return;
    }

    try {
      // Load all orders for the table
      const allOrders = await Promise.all(
        table.orders.map(order => ordersDomainService.getOrderWithItems(order.id))
      );

      // Combine all items from all orders
      const allItems: OrderItem[] = [];
      let totalSubtotal = 0;
      let totalTax = 0;
      let totalTotal = 0;

      allOrders.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            allItems.push({
              id: item.id,
              name: item.productName || `Producto ${item.productId.substring(0, 8)}`,
              quantity: item.quantity,
              price: item.priceSnapshot
            });
          });
        }
        totalSubtotal += order.subtotal;
        totalTax += order.tax;
        totalTotal += order.total;
      });

      // Use the first order as the selected order (for reference)
      setSelectedOrder(allOrders[0]);
      setOrderItems(allItems);
      setSubtotal(totalSubtotal);
      setTax(totalTax);
      setTip(0);

      // Switch to payment view on mobile
      if (window.innerWidth < 768) {
        setViewMode('payment');
      }
    } catch (err) {
      console.error('Error loading orders for table:', err);
      toast.error('Error al cargar órdenes de la mesa');
    }
  };

  const loadMenu = async () => {
    if (!user?.restaurantId) return;
    try {
      const menusResponse = await menuService.getMenus(user.restaurantId);
      let menus: any[] = [];
      if (Array.isArray(menusResponse)) {
        menus = menusResponse;
      } else if (menusResponse && typeof menusResponse === 'object' && 'menus' in menusResponse) {
        menus = (menusResponse as any).menus || [];
      }

      if (!Array.isArray(menus) || menus.length === 0) {
        setMenuItems([]);
        return;
      }

      let allItems: MenuItem[] = [];
      for (const menu of menus) {
        try {
          const menuDetail = await menuService.getMenuDetail(user.restaurantId, menu.id);
          if (menuDetail?.items && Array.isArray(menuDetail.items)) {
            allItems = [...allItems, ...menuDetail.items.filter(item => item.available)];
          }
        } catch (menuErr) {
          console.error(`Error loading menu ${menu.id}:`, menuErr);
        }
      }
      allItems.sort((a, b) => a.name.localeCompare(b.name));
      setMenuItems(allItems);
    } catch (err) {
      console.error('Error loading menu:', err);
      setMenuItems([]);
    }
  };

  const getTableStatus = (table: ActiveTable): TableStatus => {
    // Mesa disponible si no está activa O si no tiene órdenes pendientes
    if (!table.isActive || !table.orders || table.orders.length === 0) return 'available';

    // Verificar si alguna orden está servida (todos los items preparados/entregados)
    const hasServedOrder = table.orders.some(o =>
      o.orderStatus === 'served' ||
      (o.servedCount !== undefined && o.itemCount > 0 && o.servedCount === o.itemCount)
    );

    // Si tiene orden servida, está lista para pagar (verde)
    if (hasServedOrder) return 'ready_to_pay';

    // Si tiene check solicitado, también está lista para pagar
    const hasCheckRequested = table.orders.some(o => o.checkRequestedAt);
    if (hasCheckRequested) return 'ready_to_pay';

    return 'active';
  };

  const resetPayment = () => {
    setSubtotal(0);
    setTax(0);
    setTip(0);
    setTipPercentage(null);
    setTotal(0);
    setPaymentMethod('cash');
    setShowNumpad(false);
    setNumpadValue('');
    setNumpadContext(null);
  };

  const handleTableSelect = (table: ActiveTable) => {
    setSelectedTable(table);
    setCart([]); // Clear cart
    setShowProductSelector(false);

    // Load all orders for the table and combine their items
    loadAllOrdersForTable(table);
  };

  const handleTipQuickSelect = (percentage: number) => {
    const baseAmount = subtotal + tax;
    const tipAmount = (baseAmount * percentage) / 100;
    setTip(tipAmount);
    setTipPercentage(percentage);
    setShowNumpad(false);
  };

  const handleTipCustom = () => {
    setNumpadContext('tip');
    setNumpadValue(tip > 0 ? tip.toFixed(2) : '');
    setShowNumpad(true);
  };

  const handleNumpadConfirm = () => {
    const value = parseFloat(numpadValue) || 0;
    if (numpadContext === 'tip') {
      setTip(value);
      setTipPercentage(null); // Custom tip
    }
    setShowNumpad(false);
    setNumpadValue('');
    setNumpadContext(null);
  };

  const handleProcessPayment = async () => {
    if (!currentSession) {
      toast.error('Debe abrir la caja antes de procesar pagos');
      setShowOpenSessionModal(true);
      return;
    }

    if (total <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }

    try {
      setProcessing(true);

      if (selectedOrder) {
        // Payment for specific order using domain service
        try {
          // Create payment using domain service
          // Note: Cash payments are auto-processed by the backend
          const payment = await paymentsDomainService.createPayment({
            orderId: selectedOrder.id,
            method: paymentMethod,
            amount: total, // Already includes tip
            currency: 'USD'
          });

          // For cash payments, ensure it's processed (backend auto-processes, but we verify)
          // The processPayment endpoint is now idempotent, so it's safe to call even if already completed
          if (paymentMethod === 'cash' && payment.status === 'pending') {
            await paymentsDomainService.processPayment(payment.id);
          }

          // Close order after payment (if all items served)
          try {
            await ordersDomainService.closeOrder(selectedOrder.id);
            toast.success('Orden cerrada exitosamente');

            // Free the table after closing the order
            if (selectedOrder.tableId) {
              try {
                await tablesDomainService.freeTable(selectedOrder.tableId);
                toast.success('Mesa liberada y disponible');
              } catch (freeErr: any) {
                console.error('Error freeing table:', freeErr);
                toast.warning('Pago procesado pero no se pudo liberar la mesa automáticamente');
              }
            }
          } catch (closeErr: any) {
            // Order cannot be closed yet (items not served, etc.)
            console.log('Order cannot be closed yet:', closeErr.message);
            toast.warning('Pago procesado. La orden se cerrará cuando todos los items sean servidos.');
          }

          toast.success(`Pago ${paymentMethod === 'cash' ? 'en efectivo' : 'con tarjeta'} registrado exitosamente`);

          // Clear selection and reset payment state
          setSelectedTable(null);
          setSelectedOrder(null);
          setOrderItems([]);
          resetPayment();

          // Wait a moment for backend to process, then reload tables
          // This ensures the table status is updated correctly
          setTimeout(async () => {
            await loadActiveTables();
          }, 500);
        } catch (paymentErr: any) {
          toast.error(paymentErr.message || 'Error al procesar el pago');
          throw paymentErr;
        }
      } else if (cart.length > 0) {
        // General payment with products (no order)
        // For general payments without order, we create a payment record
        // Note: In a full implementation, you might want to create a "general order" first
        toast.info('Pago general: Esta funcionalidad requiere una orden. Por favor selecciona productos desde el menú de administración.');
        setProcessing(false);
        return;
      } else {
        toast.error('Selecciona una orden o productos para pagar');
      }
    } catch (err: any) {
      console.error('Error processing payment:', err);
      toast.error(err.message || 'Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return menuItems;
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [menuItems, productSearch]);

  // Group tables by status for mobile view
  const tablesByStatus = useMemo(() => {
    const grouped = {
      ready_to_pay: [] as ActiveTable[],
      active: [] as ActiveTable[],
      available: [] as ActiveTable[]
    };

    activeTables.forEach(table => {
      const status = getTableStatus(table);
      if (status === 'ready_to_pay') {
        grouped.ready_to_pay.push(table);
      } else if (status === 'active') {
        grouped.active.push(table);
      } else {
        grouped.available.push(table);
      }
    });

    return grouped;
  }, [activeTables]);

  const suggestedTip = useMemo(() => {
    const base = subtotal + tax;
    return {
      '10%': (base * 0.1),
      '15%': (base * 0.15),
      '20%': (base * 0.2)
    };
  }, [subtotal, tax]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Header - Compact */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg border-b-4 border-indigo-400 px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">💰 Caja</h1>
          <p className="text-xs text-indigo-100 truncate">Cajero: {user?.name}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => setShowCashRegisterSummary(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm btn-touch transition active:scale-95 flex items-center gap-2"
          >
            💰 Cuadre de Caja
          </button>
          <button
            onClick={() => setShowPaidOrders(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm btn-touch transition active:scale-95 flex items-center gap-2"
          >
            💳 Órdenes Pagadas
          </button>
          <div className="flex flex-col items-end gap-1 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg border-2 border-white/30">
            <p className="text-white text-xs font-semibold">
              {currentDateTime.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-white text-sm font-bold">
              {currentDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('pos_token');
            window.location.href = '/login';
          }}
          className="ml-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm btn-touch transition active:scale-95"
        >
          🚪 Salir
        </button>
      </header>

      {/* Main Content - Adaptive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Tables Panel - Adaptive */}
        <div className={`${viewMode === 'payment' ? 'hidden' : 'flex'
          } lg:flex flex-col w-full lg:w-1/2 border-r-0 lg:border-r-4 border-indigo-300 bg-white/90 backdrop-blur-sm overflow-hidden`}>
          <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">📍</span>
                <span>Mesas</span>
              </h2>
              <button
                onClick={loadActiveTables}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm btn-touch transition active:scale-95"
              >
                🔄
              </button>
            </div>

            {/* Mobile: Tabs for table status */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setViewMode('tables')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap btn-touch ${viewMode === 'tables'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700'
                  }`}
              >
                Mesas ({activeTables.length})
              </button>
              {selectedOrder && (
                <button
                  onClick={() => setViewMode('payment')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm whitespace-nowrap btn-touch"
                >
                  💳 Pago
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Cargando mesas...</p>
              </div>
            ) : activeTables.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📍</div>
                <p className="text-gray-500 font-semibold">No hay mesas configuradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {/* Priority: Tables ready to pay */}
                {tablesByStatus.ready_to_pay.map(table => (
                  <TableCard
                    key={table.id}
                    table={table}
                    status="ready_to_pay"
                    isSelected={selectedTable?.id === table.id}
                    onClick={() => handleTableSelect(table)}
                  />
                ))}

                {/* Active tables */}
                {tablesByStatus.active.map(table => (
                  <TableCard
                    key={table.id}
                    table={table}
                    status="active"
                    isSelected={selectedTable?.id === table.id}
                    onClick={() => handleTableSelect(table)}
                  />
                ))}

                {/* Available tables */}
                {tablesByStatus.available.map(table => (
                  <TableCard
                    key={table.id}
                    table={table}
                    status="available"
                    isSelected={selectedTable?.id === table.id}
                    onClick={() => handleTableSelect(table)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Payment Panel - Always Visible on Desktop, Toggle on Mobile */}
        <div className={`${viewMode === 'tables' && window.innerWidth < 1024 ? 'hidden' : 'flex'
          } flex-col w-full lg:w-1/2 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 overflow-hidden`}>
          {/* Payment Summary - Always Visible and Priority */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 sm:p-6 shadow-2xl border-b-4 border-green-400">
            <p className="text-sm sm:text-base font-semibold mb-2 opacity-90">TOTAL A PAGAR</p>
            <p className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono drop-shadow-lg">
              ${total.toFixed(2)}
            </p>
            {selectedOrder && (
              <p className="text-xs sm:text-sm mt-2 opacity-75">
                Orden: {selectedOrder.id.substring(0, 8)}
              </p>
            )}
            {!selectedOrder && cart.length > 0 && (
              <p className="text-xs sm:text-sm mt-2 opacity-75">
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Order Items / Cart */}
            {(selectedOrder || cart.length > 0) && (
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3 text-lg">
                  {selectedOrder ? 'Items de la Orden' : 'Carrito'}
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(selectedOrder ? orderItems : cart.map(c => ({
                    id: c.item.id,
                    name: c.item.name,
                    quantity: c.quantity,
                    price: c.item.price
                  }))).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">
                          {item.quantity}x ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-bold text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Subtotal and Tax */}
                <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Impuesto (10%)</span>
                    <span className="font-semibold text-gray-800">${tax.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Product Selector for General Payments */}
            {!selectedOrder && (
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
                <button
                  onClick={() => {
                    setShowProductSelector(!showProductSelector);
                    if (!showProductSelector && menuItems.length === 0) {
                      loadMenu();
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-bold text-base btn-touch transition active:scale-95"
                >
                  {showProductSelector ? '✕ Cerrar' : '📦 Seleccionar Productos'}
                </button>

                {showProductSelector && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="🔍 Buscar..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-3 text-base"
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredProducts.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
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
                            toast.success(`${item.name} agregado`);
                          }}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition btn-touch"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">{item.name}</span>
                            <span className="font-bold text-blue-600">${item.price.toFixed(2)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                {cart.length > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-2">
                    {cart.map(cartItem => (
                      <div key={cartItem.item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-800">{cartItem.item.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (cartItem.quantity > 1) {
                                setCart(prev => prev.map(c =>
                                  c.item.id === cartItem.item.id
                                    ? { ...c, quantity: c.quantity - 1 }
                                    : c
                                ));
                              } else {
                                setCart(prev => prev.filter(c => c.item.id !== cartItem.item.id));
                              }
                            }}
                            className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold btn-touch"
                          >
                            -
                          </button>
                          <span className="font-bold text-gray-800 w-8 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => {
                              setCart(prev => prev.map(c =>
                                c.item.id === cartItem.item.id
                                  ? { ...c, quantity: c.quantity + 1 }
                                  : c
                              ));
                            }}
                            className="w-10 h-10 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-bold btn-touch"
                          >
                            +
                          </button>
                          <button
                            onClick={() => {
                              setCart(prev => prev.filter(c => c.item.id !== cartItem.item.id));
                            }}
                            className="ml-2 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold btn-touch"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tip Section - Intelligent Touch-Friendly */}
            <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-yellow-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-lg">💡 Propina</h3>
                {tip > 0 ? (
                  <p className="text-lg font-bold text-green-600">${tip.toFixed(2)}</p>
                ) : tipPercentage === 0 ? (
                  <p className="text-lg font-bold text-gray-500">Sin propina</p>
                ) : null}
              </div>

              {/* Quick Tip Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {/* Sin Propina (0%) */}
                <button
                  onClick={() => handleTipQuickSelect(0)}
                  className={`py-4 rounded-xl font-bold text-base transition active:scale-95 btn-touch ${tipPercentage === 0
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  0%
                  <p className="text-xs mt-1">Sin propina</p>
                </button>
                {Object.entries(suggestedTip).map(([percent, amount]) => (
                  <button
                    key={percent}
                    onClick={() => handleTipQuickSelect(parseInt(percent))}
                    className={`py-4 rounded-xl font-bold text-base transition active:scale-95 btn-touch ${tipPercentage === parseInt(percent)
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {percent}
                    <p className="text-xs mt-1">${amount.toFixed(2)}</p>
                  </button>
                ))}
              </div>

              {/* Custom Tip Button */}
              <button
                onClick={handleTipCustom}
                className="w-full py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl font-semibold btn-touch transition active:scale-95"
              >
                {tip > 0 && tipPercentage === null
                  ? `Cambiar: $${tip.toFixed(2)}`
                  : 'Personalizar Propina'}
              </button>
            </div>

            {/* Payment Method - Touch Cards */}
            <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3 text-lg">💳 Método de Pago</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-6 rounded-xl font-bold text-lg transition active:scale-95 btn-touch border-4 ${paymentMethod === 'cash'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400 shadow-xl'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  <span className="text-4xl block mb-2">💵</span>
                  <span>Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`py-6 rounded-xl font-bold text-lg transition active:scale-95 btn-touch border-4 ${paymentMethod === 'card'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-blue-400 shadow-xl'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  <span className="text-4xl block mb-2">💳</span>
                  <span>Tarjeta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Final Payment Button - Sticky on Mobile */}
          <div className="p-4 bg-white border-t-4 border-indigo-400 shadow-2xl lg:shadow-none">
            <button
              onClick={handleProcessPayment}
              disabled={processing || total <= 0}
              className={`w-full py-6 rounded-xl font-bold text-xl transition active:scale-95 shadow-2xl border-4 ${processing || total <= 0
                ? 'bg-gray-400 text-white cursor-not-allowed border-gray-300'
                : paymentMethod === 'cash'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-blue-400'
                }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin text-2xl">⏳</span>
                  <span>Procesando...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-2xl">✓</span>
                  <span>
                    {paymentMethod === 'cash' ? '💵' : '💳'} Cobrar ${total.toFixed(2)}
                    {paymentMethod === 'cash' ? ' en Efectivo' : ' con Tarjeta'}
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Numpad Modal - Contextual */}
      {showNumpad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b-2 border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">
                {numpadContext === 'tip' ? 'Propina Personalizada' : 'Editar Monto'}
              </h3>
              <button
                onClick={() => {
                  setShowNumpad(false);
                  setNumpadValue('');
                  setNumpadContext(null);
                }}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-700 btn-touch"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-900 rounded-xl">
                <p className="text-green-400 text-4xl font-bold font-mono text-right">
                  ${numpadValue || '0.00'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => setNumpadValue(prev => prev === '0' ? num.toString() : prev + num)}
                    className="py-6 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-2xl btn-touch transition active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setNumpadValue('');
                    setNumpadContext(null);
                    setShowNumpad(false);
                  }}
                  className="py-6 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold btn-touch transition active:scale-95"
                >
                  C
                </button>
                <button
                  onClick={() => setNumpadValue(prev => prev + '0')}
                  className="py-6 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-2xl btn-touch transition active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={() => setNumpadValue(prev => prev.includes('.') ? prev : prev + '.')}
                  className="py-6 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-2xl btn-touch transition active:scale-95"
                >
                  .
                </button>
              </div>

              <button
                onClick={handleNumpadConfirm}
                className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg btn-touch transition active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CashRegisterSummaryModal
        isOpen={showCashRegisterSummary}
        onClose={() => setShowCashRegisterSummary(false)}
      />
      <PaidOrdersModal
        isOpen={showPaidOrders}
        onClose={() => setShowPaidOrders(false)}
      />

      {/* Opening Session Modal */}
      <Modal
        isOpen={showOpenSessionModal}
        title="💰 Apertura de Caja"
        onClose={currentSession ? () => setShowOpenSessionModal(false) : undefined}
      >
        <div className="space-y-4">
          <p className="text-gray-600">Ingrese el monto inicial de efectivo en caja para comenzar el turno.</p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Monto Inicial ($)</label>
            <input
              type="number"
              value={openingBalanceInput}
              onChange={(e) => setOpeningBalanceInput(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-xl font-mono focus:border-indigo-500 outline-none transition"
              autoFocus
            />
          </div>
          <button
            onClick={handleOpenSession}
            disabled={processing}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg btn-touch transition active:scale-95 disabled:bg-gray-400"
          >
            {processing ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

// Table Card Component
const TableCard: React.FC<{
  table: ActiveTable;
  status: TableStatus;
  isSelected: boolean;
  onClick: () => void;
}> = ({ table, status, isSelected, onClick }) => {
  // Force available status if table is not active or has no orders
  const isActuallyAvailable = !table.isActive || !table.orders || table.orders.length === 0;
  const actualStatus = isActuallyAvailable ? 'available' : status;

  // Only calculate total if table has orders and is active
  const totalAmount = (!isActuallyAvailable && table.isActive && table.orders && table.orders.length > 0)
    ? table.orders.reduce((sum, o) => sum + o.total, 0)
    : 0;
  const hasCheckRequested = table.orders && table.orders.length > 0
    ? table.orders.some(o => o.checkRequestedAt)
    : false;

  const getStatusConfig = () => {
    switch (actualStatus) {
      case 'ready_to_pay':
        // Verde para órdenes servidas/preparadas (listas para cobrar)
        return {
          bg: 'bg-gradient-to-br from-green-100 to-emerald-100',
          border: 'border-green-500',
          icon: '✅',
          label: 'Lista para Cobrar',
          textColor: 'text-green-800'
        };
      case 'active':
        return {
          bg: 'bg-gradient-to-br from-blue-100 to-cyan-100',
          border: 'border-blue-500',
          icon: '🍽️',
          label: 'En Consumo',
          textColor: 'text-blue-800'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
          border: 'border-gray-400',
          icon: '🪑',
          label: 'Disponible',
          textColor: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <button
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-xl shadow-lg border-2 transition-all duration-200 btn-touch-lg min-h-[120px] flex flex-col justify-between ${isSelected
        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-700 scale-105 shadow-2xl'
        : `${config.bg} ${config.border} ${config.textColor} hover:shadow-xl`
        }`}
    >
      <div className="text-center">
        <div className="text-3xl sm:text-4xl mb-2">{config.icon}</div>
        <h3 className={`font-bold text-xl sm:text-2xl mb-1 ${isSelected ? 'text-white' : config.textColor
          }`}>
          {table.tableNumber}
        </h3>
        {hasCheckRequested && !isSelected && actualStatus !== 'available' && (
          <span className="inline-block px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full animate-pulse">
            🧾 Cuenta
          </span>
        )}
      </div>

      {actualStatus !== 'available' && !isActuallyAvailable && table.isActive && table.orders && table.orders.length > 0 && (
        <div className={`mt-2 pt-2 border-t ${isSelected ? 'border-white/30' : 'border-gray-300'
          }`}>
          <p className={`text-xs font-semibold mb-1 ${isSelected ? 'text-white/90' : config.textColor
            }`}>
            {config.label}
          </p>
          {table.orders.length > 0 && (
            <p className={`text-sm font-semibold ${isSelected ? 'text-white' : config.textColor
              }`}>
              {table.orders.length} {table.orders.length === 1 ? 'orden' : 'órdenes'}
            </p>
          )}
          {totalAmount > 0 && (
            <p className={`text-lg sm:text-xl font-bold ${isSelected ? 'text-white' : config.textColor
              }`}>
              ${totalAmount.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {actualStatus === 'available' && (
        <div className={`mt-2 pt-2 border-t ${isSelected ? 'border-white/30' : 'border-gray-300'
          }`}>
          <p className={`text-xs font-semibold ${isSelected ? 'text-white/75' : 'text-gray-500'
            }`}>
            ○ Disponible
          </p>
          <p className={`text-xs ${isSelected ? 'text-white/60' : 'text-gray-400'
            }`}>
            $0.00
          </p>
        </div>
      )}
    </button>
  );
};

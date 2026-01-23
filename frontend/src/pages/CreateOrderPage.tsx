/**
 * Create Order Page - Waiter View
 * Rediseñado desde cero - Simple y robusto
 * Touch-First POS Design following ALDELO specification
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import {
  ordersDomainService,
  OrderWithItems,
  AddItemsRequest
} from '../domains/orders/service';
import {
  tablesDomainService,
  TableWithOrder
} from '../domains/tables/service';
import {
  productsDomainService,
  Product
} from '../domains/products/service';
import { menuService } from '../services/menu-service';
import { toast } from 'sonner';
import { ProductCustomizationModal } from '../components/ProductCustomizationModal';
import { useTranslation } from 'react-i18next';

interface ProductCustomization {
  excludedIngredients: string[]; // Ingredientes excluidos
  additions: Array<{ modifierId: string; name: string; priceDelta: number }>; // Adiciones agregadas
}

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  customization?: ProductCustomization; // Personalizaciones del producto
  seatNumber: number; // Seat number for split checks
}

interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  items: Product[];
  metadata?: {
    type?: string;
    location?: string;
    [key: string]: any;
  };
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Estado simple
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderWithItems | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingToKitchen, setSendingToKitchen] = useState(false);
  const [showTableSelection, setShowTableSelection] = useState(true); // Controla si mostrar selección de mesas o vista de pedidos
  const [selectedSeat, setSelectedSeat] = useState(1); // Default to Seat 1
  const [maxSeat, setMaxSeat] = useState(1); // Track maximum seat number used

  // Offline State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Estado para modal de personalización
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [productToCustomize, setProductToCustomize] = useState<Product | null>(null);
  const [availableModifiers, setAvailableModifiers] = useState<Array<{ id: string; name: string; priceDelta: number; active: boolean; createdAt: string }>>([]);
  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();

    // Polling simple para actualizar mesas cada 10 segundos
    const interval = setInterval(loadTables, 10000);
    return () => clearInterval(interval);
  }, [user?.restaurantId]);

  const loadInitialData = async () => {
    if (!user?.restaurantId) return;

    try {
      setLoading(true);
      await Promise.all([loadTables(), loadProducts()]);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    if (!user?.restaurantId) return;

    try {
      // SIEMPRE usar el estado del backend - sobrescribe cualquier estado local
      const tablesList = await tablesDomainService.getTablesWithOrders(user.restaurantId);

      // DEBUG: Log para verificar qué está devolviendo el backend
      console.log('[Frontend] Tables loaded from backend:', tablesList.length, 'tables');
      const tablesWithActiveOrders = tablesList.filter(t => t.activeOrderId);
      console.log('[Frontend] Tables with activeOrderId:', tablesWithActiveOrders.length);
      tablesWithActiveOrders.forEach(t => {
        console.log(`  - Mesa ${t.name}: activeOrderId = ${t.activeOrderId?.substring(0, 8)}`);
      });

      // IMPORTANTE: El backend solo devuelve activeOrderId para órdenes 'draft' o 'sent_to_kitchen'
      // Si una orden está 'served', el backend NO la incluirá en activeOrderId
      // Forzar que activeOrderId sea null si está vacío o undefined
      const cleanedTablesList = tablesList.map(table => ({
        ...table,
        // Asegurar que activeOrderId solo existe si es válido
        activeOrderId: (table.activeOrderId && typeof table.activeOrderId === 'string' && table.activeOrderId.trim() !== '')
          ? table.activeOrderId
          : undefined
      }));

      setTables(cleanedTablesList);

      // Si hay una mesa seleccionada, actualizar su referencia y orden actual
      if (selectedTableId) {
        const updatedTable = cleanedTablesList.find(t => t.id === selectedTableId);

        // Si la mesa NO tiene activeOrderId en el backend, limpiar la orden actual
        // Esto puede pasar si la orden cambió a 'served' o 'closed'
        if (!updatedTable?.activeOrderId) {
          // Mesa ya no tiene orden activa - limpiar orden actual si existe
          if (currentOrder) {
            console.log('[Tables] Mesa ya no tiene orden activa en backend - limpiando orden actual');
            setCurrentOrder(null);
            setCart([]);
          }
        } else if (updatedTable.activeOrderId) {
          // Mesa tiene orden activa según el backend
          // Si tenemos la orden cargada, verificar que siga siendo válida
          if (currentOrder && currentOrder.id === updatedTable.activeOrderId) {
            // Orden ya cargada - recargarla para obtener el estado actualizado
            try {
              const updatedOrder = await ordersDomainService.getOrderWithItems(updatedTable.activeOrderId);

              // Si la orden cambió a 'served' o 'closed', el backend ya no la incluirá en activeOrderId
              // Pero si estamos aquí, es porque aún está activa según el backend
              setCurrentOrder(updatedOrder);

              // Si la orden cambió a 'served', mostrar notificación
              if (updatedOrder.status === 'served' && currentOrder.status !== 'served') {
                toast.success('✅ Pedidos entregados por la cocina');
                // Nota: En el siguiente poll, el backend no devolverá esta orden como activa
              }
            } catch (err) {
              console.error('Error reloading order:', err);
            }
          } else if (!currentOrder) {
            // Mesa tiene orden pero no la tenemos cargada - cargarla
            loadOrderForTable(updatedTable.activeOrderId);
          }
        }
      }
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

  const loadProducts = async () => {
    if (!user?.restaurantId) return;

    try {
      // Cargar productos activos
      const products = await productsDomainService.getActiveProducts();

      // DEBUG: Log productos para verificar que tienen nombres
      console.log('[CreateOrderPage] Products loaded:', products.length);
      if (products.length > 0) {
        console.log('[CreateOrderPage] First product sample:', {
          id: products[0].id,
          name: products[0].name,
          categoryId: products[0].categoryId,
          basePrice: products[0].basePrice
        });
      }

      // Validar que los productos tengan nombres, si no, loguear advertencia
      const productsWithoutNames = products.filter(p => !p.name || p.name.trim() === '');
      if (productsWithoutNames.length > 0) {
        console.warn(`[CreateOrderPage] Found ${productsWithoutNames.length} products without names:`, productsWithoutNames.map(p => ({ id: p.id, name: p.name })));
      }

      // Cargar estructura de menú
      const menusResponse = await menuService.getMenus(user.restaurantId);
      const menusArray = Array.isArray(menusResponse) ? menusResponse : (menusResponse as any).menus || [];

      if (menusArray.length > 0) {
        const menuDetail = await menuService.getMenuDetail(user.restaurantId, menusArray[0].id);

        // Organizar productos por categoría
        const categoriesMap = new Map<string, MenuCategory>();

        if (menuDetail.categories && Array.isArray(menuDetail.categories)) {
          console.log('[CreateOrderPage] Categorías del menú:', menuDetail.categories.map((c: any) => ({ id: c.id, name: c.name })));

          menuDetail.categories.forEach((cat: any) => {
            const categoryProducts = products.filter(p => p.categoryId === cat.id);

            // DEBUG: Log para cada categoría
            console.log(`[CreateOrderPage] Categoría "${cat.name}": ${categoryProducts.length} productos`);

            // IMPORTANTE: Incluir TODAS las categorías, incluso si no tienen productos (necesario para "Adiciones")
            categoriesMap.set(cat.id, {
              id: cat.id,
              name: cat.name,
              displayOrder: cat.displayOrder || 0,
              metadata: cat.metadata || {},
              items: categoryProducts
            });
          });
        }

        const sortedCategories = Array.from(categoriesMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
        console.log('[CreateOrderPage] Categorías finales cargadas:', sortedCategories.map(c => ({ id: c.id, name: c.name, itemsCount: c.items.length })));
        setCategories(sortedCategories);

        // Seleccionar primera categoría por defecto
        if (sortedCategories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(sortedCategories[0].id);
        }
      } else {
        // Si no hay menú estructurado, mostrar todos los productos en una categoría
        if (products.length > 0) {
          setCategories([{
            id: 'all',
            name: 'Todos los productos',
            displayOrder: 0,
            items: products
          }]);
          setSelectedCategoryId('all');
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Error al cargar productos');
    }
  };

  const loadOrderForTable = async (orderId: string) => {
    try {
      const order = await ordersDomainService.getOrderWithItems(orderId);

      // IMPORTANTE: Solo considerar la orden como "activa" si está en 'draft' o 'sent_to_kitchen'
      // Si está 'served', 'closed', o 'cancelled', NO debería tener activeOrderId
      if (order.status === 'served' || order.status === 'closed' || order.status === 'cancelled') {
        console.warn('[Order] Orden en estado no activo:', order.status);
        // Si la orden está en un estado no activo, limpiar el estado local
        // El backend no debería haberla incluido en activeOrderId, pero por seguridad
        setCurrentOrder(null);
        setCart([]);
        // Recargar tablas para obtener el estado correcto del backend
        await loadTables();
        return;
      }

      setCurrentOrder(order);

      // Si hay items en la orden, cargarlos solo si es necesario (verificación de estado)
      if (order.items.length > 0) {
        const allProducts = await productsDomainService.getActiveProducts();
        const productMap = new Map(allProducts.map(p => [p.id, p]));

        // No sobrescribir el carrito si ya tenemos items pendientes localmente
        // y la orden ya está en cocina/servida. Esto permite adiciones.
        if (order.status === 'draft') {
          const cartItems: CartItem[] = order.items.map(item => {
            const product = productMap.get(item.productId) || {
              id: item.productId,
              name: item.productName || `Producto ${item.productId.substring(0, 8)}`,
              categoryId: '',
              basePrice: item.priceSnapshot,
              active: true
            } as Product;

            return {
              product,
              quantity: item.quantity,
              notes: item.notes || undefined,
              seatNumber: item.seatNumber || 1
            };
          });

          setCart(cartItems);
        } else {
          // Si la orden ya está en cocina, el cart local representa NUEVAS adiciones
          // No limpiamos el cart, permitimos que el usuario siga agregando
          console.log('[CreateOrderPage] Orden en cocina - manteniendo cart local para adiciones');
        }
      }
    } catch (err: any) {
      console.error('Error loading order:', err);
      // Si la orden no existe o fue cerrada, limpiar estado
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        setCurrentOrder(null);
        setCart([]);
        // Recargar tablas para obtener el estado correcto
        await loadTables();
      } else {
        toast.error(err.message || 'Error al cargar orden');
      }
    }
  };

  const handleTableSelect = async (table: TableWithOrder) => {
    setSelectedTableId(table.id);
    setCart([]);
    setShowTableSelection(false); // Cambiar a vista de pedidos

    if (table.activeOrderId) {
      // Mesa tiene orden activa - cargarla
      await loadOrderForTable(table.activeOrderId);
    } else {
      // Mesa libre - limpiar orden actual
      setCurrentOrder(null);
    }
  };

  const handleAddProduct = async (product: Product) => {
    if (!product.active) {
      toast.error(`${product.name} no está disponible`);
      return;
    }

    // Si el producto es de la categoría "Adiciones" y hay un producto seleccionado para customizar
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    const isAdditionProduct = selectedCategory?.name.toLowerCase() === 'adiciones';

    if (isAdditionProduct && productToCustomize) {
      // Agregar como adición al producto del carrito
      const cartItemIndex = cart.findIndex(item => item.product.id === productToCustomize.id);

      if (cartItemIndex >= 0) {
        const updatedCart = [...cart];
        const cartItem = updatedCart[cartItemIndex];

        if (!cartItem.customization) {
          cartItem.customization = {
            excludedIngredients: [],
            additions: []
          };
        }

        // Verificar si la adición ya existe
        const additionExists = cartItem.customization.additions.some(
          add => add.modifierId === product.id || add.name === product.name
        );

        if (!additionExists) {
          cartItem.customization.additions.push({
            modifierId: product.id,
            name: product.name,
            priceDelta: product.basePrice
          });

          setCart(updatedCart);
          toast.success(`${product.name} agregada como adición (+$${product.basePrice.toFixed(2)})`);
          // NO regresar automáticamente - permitir agregar más adiciones
        } else {
          toast.info(`${product.name} ya está agregada como adición`);
        }
      } else {
        toast.error('Producto original no encontrado en el carrito');
        // Solo regresar si el producto original ya no existe en el carrito
        setProductToCustomize(null);
        const previousCategory = categories.find(cat =>
          cat.items.some(p => p.id === productToCustomize?.id)
        );
        if (previousCategory) {
          setSelectedCategoryId(previousCategory.id);
        } else if (categories.length > 0) {
          setSelectedCategoryId(categories[0].id);
        }
      }
      return;
    }

    // Flujo normal: agregar producto principal
    if (!selectedTableId) {
      toast.error('Selecciona una mesa primero');
      return;
    }

    const selectedTable = tables.find(t => t.id === selectedTableId);
    if (!selectedTable) {
      toast.error('Mesa no encontrada');
      return;
    }

    // Crear orden si no existe
    let order = currentOrder;
    if (!order) {
      try {
        const newOrder = await ordersDomainService.createOrder({
          tableId: selectedTable.id,
          waiterId: user?.id || ''
        });

        // Crear objeto OrderWithItems local
        order = {
          id: newOrder.id,
          tableId: newOrder.tableId,
          waiterId: newOrder.waiterId,
          status: newOrder.status,
          subtotal: 0,
          tax: 0,
          total: 0,
          createdAt: newOrder.createdAt,
          items: []
        };

        setCurrentOrder(order);
        setTimeout(() => loadTables(), 500);
      } catch (err: any) {
        console.error('Error creating order:', err);
        toast.error(err.message || 'Error al crear orden');
        return;
      }
    }

    // Obtener ingredientes (prioriza metadata, luego parsea descripción)
    getProductIngredients(product);

    // Agregar producto directamente al carrito con ingredientes incluidos por defecto
    const newCartItem: CartItem = {
      product,
      quantity: 1,
      customization: {
        excludedIngredients: [], // Todos los ingredientes incluidos por defecto
        additions: [] // Sin adiciones por defecto
      },
      seatNumber: selectedSeat
    };

    // Verificar si el producto ya está en el carrito (para EL MISMO ASIENTO)
    const existingItemIndex = cart.findIndex(item =>
      item.product.id === product.id && item.seatNumber === selectedSeat
    );
    if (existingItemIndex >= 0) {
      // Si ya existe, aumentar cantidad
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
      toast.success(`${product.name} agregado (cantidad: ${updatedCart[existingItemIndex].quantity})`);
    } else {
      // Si no existe, agregarlo
      setCart([...cart, newCartItem]);
      toast.success(`${product.name} agregado al pedido`);
    }
  };

  const handleConfirmCustomization = async (customization: ProductCustomization) => {
    if (!productToCustomize) {
      return;
    }

    // Encontrar el item en el carrito y actualizar sus adiciones
    const itemIndex = cart.findIndex(item => item.product.id === productToCustomize.id);
    if (itemIndex >= 0) {
      const updatedCart = [...cart];
      if (!updatedCart[itemIndex].customization) {
        updatedCart[itemIndex].customization = {
          excludedIngredients: [],
          additions: []
        };
      }

      // Agregar las nuevas adiciones (sin duplicar)
      customization.additions.forEach(newAdd => {
        const exists = updatedCart[itemIndex].customization!.additions.some(
          add => add.modifierId === newAdd.modifierId
        );
        if (!exists) {
          updatedCart[itemIndex].customization!.additions.push(newAdd);
        }
      });

      setCart(updatedCart);
      toast.success('Adiciones agregadas');
    }

    setCustomizationModalOpen(false);
    setProductToCustomize(null);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const handleRemoveProduct = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    setCart(cart.filter(item => item.product.id !== productId));

    if (item) {
      toast.info(`${item.product.name} eliminado`);
    }
  };

  const handleCancelItem = async (itemId: string, productName: string, isDraft: boolean) => {
    if (!currentOrder) return;

    if (!isDraft) {
      // Pedir confirmación para items ya enviados
      if (!window.confirm(`¿Seguro que quieres cancelar "${productName}"? Se notificará a la cocina.`)) {
        return;
      }
    }

    try {
      setLoading(true);
      await ordersDomainService.cancelOrderItem(currentOrder.id, itemId);
      toast.success(isDraft ? 'Producto eliminado' : 'Producto cancelado');

      // Recargar orden para actualizar totales y lista
      await loadOrderForTable(currentOrder.id);
    } catch (err: any) {
      console.error('Error cancelling item:', err);
      toast.error(err.message || 'Error al cancelar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToKitchen = async () => {
    if (!currentOrder) {
      toast.error('No hay orden activa');
      return;
    }

    if (cart.length === 0) {
      toast.error('Agrega productos a la orden primero');
      return;
    }

    try {
      setSendingToKitchen(true);

      // NO eliminar items previos si la orden ya está en cocina
      // El backend ahora permite añadir items a órdenes 'sent_to_kitchen'
      if (currentOrder.status === 'draft') {
        try {
          await ordersDomainService.removeAllItemsFromOrder(currentOrder.id);
        } catch (err) {
          // Ignorar si no hay items para eliminar
        }
      }

      // Agregar items del cart a la orden con customizaciones
      const itemsRequest: AddItemsRequest = {
        items: cart.map(item => {
          // Crear nota con información de personalización
          const customizationNotes: string[] = [];
          if (item.customization?.excludedIngredients && item.customization.excludedIngredients.length > 0) {
            customizationNotes.push(`Sin: ${item.customization.excludedIngredients.join(', ')}`);
          }
          if (item.customization?.additions && item.customization.additions.length > 0) {
            customizationNotes.push(`Con: ${item.customization.additions.map(a => a.name).join(', ')}`);
          }
          const notes = customizationNotes.length > 0 ? customizationNotes.join(' | ') : undefined;

          return {
            productId: item.product.id,
            quantity: item.quantity,
            notes: notes,
            seatNumber: item.seatNumber
          };
        })
      };

      await ordersDomainService.addItemsToOrder(currentOrder.id, itemsRequest);

      // Enviar a cocina
      const updatedOrder = await ordersDomainService.sendToKitchen(currentOrder.id);

      // Recargar orden completa para obtener el estado actualizado
      const fullOrder = await ordersDomainService.getOrderWithItems(updatedOrder.id);
      setCurrentOrder(fullOrder);

      // Verificar si hay productos de cocina y bar en la orden
      let hasKitchenItems = false;
      let hasBarItems = false;

      for (const item of fullOrder.items) {
        // Buscar el producto en las categorías para determinar si es de cocina o bar
        for (const category of categories) {
          const product = category.items.find(p => p.id === item.productId);
          if (product) {
            const categoryMetadata = category.metadata || {};
            const categoryName = category.name.toLowerCase();

            // Verificar metadata primero
            const itemType = categoryMetadata.type || categoryMetadata.location || '';
            let isBarItem = false;

            if (itemType === 'bar' || itemType === 'drinks') {
              isBarItem = true;
            } else {
              // Si no hay metadata, verificar por nombre de categoría
              const barCategoryNames = ['bebida', 'bebidas', 'coctel', 'cocteles', 'bar', 'drinks', 'cocktail', 'cocktails', 'cerveza', 'cervezas', 'vino', 'vinos', 'licor', 'licores'];
              if (barCategoryNames.some(name => categoryName.includes(name))) {
                isBarItem = true;
              }
            }

            if (isBarItem) {
              hasBarItems = true;
            } else {
              hasKitchenItems = true;
            }
            break;
          }
        }
      }

      // Determinar mensaje según los tipos de productos
      let message = 'Orden enviada';
      if (hasKitchenItems && hasBarItems) {
        message = 'Orden enviada a cocina y bar 🍳🍹';
      } else if (hasKitchenItems) {
        message = 'Orden enviada a cocina 🍳';
      } else if (hasBarItems) {
        message = 'Orden enviada a bar 🍹';
      }

      // Limpiar cart local
      setCart([]);

      // Recargar mesas para actualizar estado
      await loadTables();

      toast.success(message);
    } catch (err: any) {
      console.error('Error sending to kitchen:', err);
      toast.error(err.message || 'Error al enviar a cocina');
    } finally {
      setSendingToKitchen(false);
    }
  };

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const categoryProducts = selectedCategory?.items || [];
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Calcular subtotal incluyendo adiciones
  // Calcular subtotal de adiciones/carrito
  const cartSubtotal = cart.reduce((sum, item) => {
    const basePrice = item.product.basePrice * item.quantity;
    const additionsPrice = (item.customization?.additions.reduce((addSum, add) => addSum + add.priceDelta, 0) || 0) * item.quantity;
    return sum + basePrice + additionsPrice;
  }, 0);

  // Totales finales (Orden Confirmada + Adiciones)
  // Si la orden es draft, el cart contiene todo. Si es sent, el cart solo contiene adiciones.
  const confirmedSubtotal = (currentOrder && currentOrder.status !== 'draft') ? (currentOrder.subtotal || 0) : 0;
  const subtotal = confirmedSubtotal + cartSubtotal;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-xl font-bold text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-bold animate-pulse flex-shrink-0">
          ⚠️ Modo Offline - Conexión Perdida. Los pedidos se guardarán localmente.
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-md px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
          🍽️ Toma de Pedidos
        </h1>
        <div className="flex items-center gap-2">
          {/* Botón para volver a selección de mesas */}
          {!showTableSelection && (
            <button
              onClick={() => {
                setShowTableSelection(true);
                setSelectedTableId(null);
                setCart([]);
                setCurrentOrder(null);
              }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px] flex items-center gap-2"
            >
              <span>←</span>
              <span className="hidden sm:inline">{t('orders.back_to_tables', 'Volver a Mesas')}</span>
            </button>
          )}
          {/* Botón de carrito en móvil */}
          {!showTableSelection && cart.length > 0 && (
            <button
              onClick={() => setShowMobileCart(!showMobileCart)}
              className="md:hidden relative px-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px] flex items-center gap-2"
            >
              <span>🛒</span>
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cart.length}
              </span>
            </button>
          )}
          <button
            onClick={() => navigate('/orders')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px]"
          >
            {t('nav.orders')}
          </button>

        </div>
      </div>

      {/* Vista de Selección de Mesas */}
      {showTableSelection ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                {t('orders.table_select', 'Selecciona una Mesa')}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                {t('orders.table_select_hint', 'Elige la mesa para comenzar a tomar el pedido')}
              </p>
            </div>


            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {tables.map(table => {
                const hasActiveOrderId = table.activeOrderId &&
                  typeof table.activeOrderId === 'string' &&
                  table.activeOrderId.trim() !== '';
                const isActive = hasActiveOrderId === true;

                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableSelect(table)}
                    className={`
                      relative p-4 sm:p-5 rounded-xl font-bold transition-all duration-200 active:scale-95
                      min-h-[100px] sm:min-h-[120px] flex flex-col items-center justify-center
                      shadow-lg hover:shadow-xl
                      ${isActive
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white ring-4 ring-green-300'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border-2 border-gray-300 hover:border-indigo-400'
                      }
                    `}
                  >
                    <span className="text-3xl sm:text-4xl mb-2">{isActive ? '🟢' : '⚪'}</span>
                    <span className="text-base sm:text-lg font-semibold text-center leading-tight">
                      {table.name || `Mesa ${table.id.substring(0, 6)}`}
                    </span>
                    {isActive && (
                      <>
                        <span className="absolute top-2 right-2 w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></span>
                        <span className="text-xs sm:text-sm mt-2 opacity-90">Con Orden</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Vista de Pedidos - 3 Columnas Iguales */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Columna 1: Categorías (Horizontal en móvil, Vertical en desktop) */}
          <div className="w-full md:w-1/4 lg:w-1/5 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-1.5">
                <span className="text-base sm:text-lg">🍽️</span>
                <span>Categorías</span>
              </h2>
              {selectedTable && (
                <p className="hidden md:block text-xs text-gray-600 mt-1">
                  Mesa: <span className="font-semibold">{selectedTable.name}</span>
                </p>
              )}

              {/* Selector de Asientos */}
              {!showTableSelection && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: maxSeat }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setSelectedSeat(i + 1)}
                      className={`
                        px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors
                        ${selectedSeat === i + 1
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                      `}
                    >
                      Silla {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const newSeat = maxSeat + 1;
                      setMaxSeat(newSeat);
                      setSelectedSeat(newSeat);
                    }}
                    className="px-2 py-1 rounded-full bg-gray-100 text-indigo-600 font-bold text-xs hover:bg-indigo-50 border border-indigo-200"
                  >
                    + Silla
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-x-auto md:overflow-y-auto p-2 sm:p-3 scrollbar-hide scroll-touch">
              <div className="flex md:flex-col gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`
                      px-4 py-2.5 sm:px-4 sm:py-3 rounded-lg font-semibold text-sm text-center md:text-left
                      transition-all duration-200 active:scale-95 min-h-[40px] md:min-h-[48px]
                      whitespace-nowrap md:whitespace-normal flex-shrink-0
                      ${selectedCategoryId === category.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }
                    `}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Columna 2: Productos - Ocupa el resto en móvil */}
          <div className="flex-1 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="p-2 sm:p-3 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                    {productToCustomize ? (
                      <>
                        <span className="text-blue-600">➕ Adiciones:</span>
                        <span className="ml-1">{productToCustomize.name}</span>
                      </>
                    ) : selectedCategory ? (
                      <>
                        <span className="text-indigo-600">{selectedCategory.name}</span>
                        {categoryProducts.length > 0 && (
                          <span className="ml-2 text-xs text-gray-500">({categoryProducts.length})</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">Platos</span>
                    )}
                  </h2>
                </div>
                {productToCustomize && (
                  <button
                    onClick={() => {
                      setProductToCustomize(null);
                      const previousCategory = categories.find(cat =>
                        cat.items.some(p => p.id === productToCustomize.id)
                      );
                      if (previousCategory) {
                        setSelectedCategoryId(previousCategory.id);
                      } else if (categories.length > 0) {
                        setSelectedCategoryId(categories[0].id);
                      }
                    }}
                    className="px-2 py-1.5 bg-gray-200 text-gray-700 rounded font-semibold text-xs active:scale-95 min-h-[36px] hover:bg-gray-300 transition flex-shrink-0"
                  >
                    ← Volver
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-3 scroll-touch">
              {selectedCategoryId ? (
                categoryProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoryProducts.map(product => {
                      const isAddingAdditions = productToCustomize !== null;
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleAddProduct(product)}
                          className={`
                            rounded-lg p-2 shadow-sm hover:shadow-md active:scale-95
                            transition-all duration-200 border
                            min-h-[90px] sm:min-h-[100px] flex flex-col justify-between
                            ${!product.active ? 'opacity-50' : ''}
                            ${isAddingAdditions
                              ? 'bg-blue-50 border-blue-300 hover:border-blue-400'
                              : 'bg-white border-gray-200 hover:border-indigo-300'
                            }
                          `}
                        >
                          <div className="flex-1 flex flex-col justify-start">
                            <h3 className={`font-bold text-xs sm:text-sm mb-1 line-clamp-2 min-h-[2rem] flex items-start leading-tight ${isAddingAdditions ? 'text-blue-800' : 'text-gray-800'
                              }`}>
                              {product.name && product.name.trim() ? (
                                <>
                                  {isAddingAdditions && <span className="mr-1 text-xs">➕</span>}
                                  {product.name}
                                </>
                              ) : (
                                <span className="text-red-600 italic text-xs">
                                  Sin nombre
                                </span>
                              )}
                            </h3>
                            {product.description && product.description.trim() && (
                              <p className={`text-[10px] sm:text-xs line-clamp-2 leading-tight ${isAddingAdditions ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                {product.description}
                              </p>
                            )}
                          </div>
                          <div className="mt-auto pt-1 border-t border-gray-200">
                            <p className={`font-bold text-sm sm:text-base ${isAddingAdditions ? 'text-blue-600' : 'text-indigo-600'
                              }`}>
                              {isAddingAdditions ? '+' : ''}${(product.basePrice || 0).toFixed(2)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">🍽️</div>
                    <p className="text-gray-600 font-medium text-sm">No hay productos en esta categoría</p>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-600 font-medium text-sm mb-2">Selecciona una categoría</p>
                  <p className="text-xs text-gray-500">Elige una categoría para ver los platos</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna 3: Orden Activa / Carrito */}
          <div className={`
            ${showMobileCart ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'}
            w-full md:w-1/3 lg:w-1/4 bg-white md:border-l border-gray-200 flex flex-col overflow-hidden flex-shrink-0
          `}>
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Orden Activa</h2>
                {selectedTable && (
                  <p className="text-xs text-indigo-100">
                    Mesa: {selectedTable.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="md:hidden w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-3 scroll-touch">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-600 font-medium">El carrito está vacío</p>
                  <p className="text-sm text-gray-500 mt-2">Agrega productos de la lista</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, cartIndex) => {
                    // Parsear ingredientes incluidos del producto
                    const includedIngredients = getProductIngredients(item.product);

                    return (
                      <div
                        key={item.product.id}
                        className="bg-white rounded-lg p-2 border border-gray-300 shadow-sm"
                      >
                        {/* Header del producto */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-xs mb-0.5 leading-tight">
                              {item.product.name}
                            </h3>
                            {item.product.description && (
                              <p className="text-[9px] text-gray-500 line-clamp-1">
                                {item.product.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveProduct(item.product.id)}
                            className="ml-1 w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center font-bold active:scale-95 min-h-[24px] min-w-[24px] text-[10px] flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Lista de ingredientes incluidos */}
                        {includedIngredients.length > 0 && (
                          <div className="mb-2 p-1.5 bg-gray-50 rounded border border-gray-200">
                            <p className="text-[9px] font-semibold text-gray-700 mb-1">🍽️ Incluye:</p>
                            <div className="space-y-1">
                              {includedIngredients.map((ingredient, idx) => {
                                const isExcluded = item.customization?.excludedIngredients.includes(ingredient) || false;
                                return (
                                  <label
                                    key={idx}
                                    className={`
                                    flex items-center gap-1 p-1 rounded cursor-pointer transition-all
                                    min-h-[28px] active:scale-95
                                    ${isExcluded
                                        ? 'bg-red-50 border border-red-200'
                                        : 'bg-green-50 border border-green-200'
                                      }
                                  `}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!isExcluded}
                                      onChange={() => {
                                        const updatedCart = [...cart];
                                        const currentItem = updatedCart[cartIndex];

                                        if (!currentItem.customization) {
                                          currentItem.customization = {
                                            excludedIngredients: [],
                                            additions: []
                                          };
                                        }

                                        if (isExcluded) {
                                          // Quitar de excluidos (incluir ingrediente)
                                          currentItem.customization.excludedIngredients =
                                            currentItem.customization.excludedIngredients.filter(ing => ing !== ingredient);
                                        } else {
                                          // Agregar a excluidos (quitar ingrediente)
                                          if (!currentItem.customization.excludedIngredients.includes(ingredient)) {
                                            currentItem.customization.excludedIngredients.push(ingredient);
                                          }
                                        }

                                        setCart(updatedCart);
                                      }}
                                      className="w-3 h-3 rounded border border-gray-300 checked:bg-green-500 checked:border-green-500 cursor-pointer flex-shrink-0"
                                    />
                                    <span className={`text-[9px] font-medium flex-1 leading-tight ${isExcluded ? 'text-red-600 line-through' : 'text-green-700'}`}>
                                      {ingredient}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Botón para agregar adiciones */}
                        <div className="mb-2">
                          <button
                            onClick={() => {
                              // Debug: Log categorías disponibles
                              console.log('[CreateOrderPage] Total categorías disponibles:', categories.length);
                              console.log('[CreateOrderPage] Nombres de categorías:', categories.map(c => c.name));
                              console.log('[CreateOrderPage] Categorías con detalles:', categories.map(c => ({ id: c.id, name: c.name, itemsCount: c.items.length })));

                              // Buscar categoría "Adiciones" (búsqueda más flexible)
                              const adicionesCategory = categories.find(cat => {
                                const normalizedName = cat.name.toLowerCase().trim();
                                // Normalizar nombres comunes
                                return normalizedName === 'adiciones' ||
                                  normalizedName === 'adición' ||
                                  normalizedName === 'adicion' ||
                                  normalizedName === 'adicione' ||
                                  normalizedName.includes('adicione') ||
                                  normalizedName.startsWith('adicione');
                              });

                              if (adicionesCategory) {
                                console.log('[CreateOrderPage] ✅ Categoría "Adiciones" encontrada:', {
                                  id: adicionesCategory.id,
                                  name: adicionesCategory.name,
                                  itemsCount: adicionesCategory.items.length,
                                  items: adicionesCategory.items.map(i => ({ id: i.id, name: i.name }))
                                });
                                // Cambiar la vista para mostrar productos de "Adiciones"
                                setSelectedCategoryId(adicionesCategory.id);
                                // Guardar referencia al item del carrito para agregar adiciones
                                setProductToCustomize(item.product);
                                toast.info(`Selecciona las adiciones del menú (${adicionesCategory.items.length} disponibles)`);
                              } else {
                                console.error('[CreateOrderPage] ❌ Categoría "Adiciones" NO encontrada');
                                console.error('[CreateOrderPage] Categorías disponibles:', categories.map(c => ({ id: c.id, name: c.name, itemsCount: c.items.length })));
                                toast.error(`Categoría "Adiciones" no encontrada. Categorías disponibles: ${categories.map(c => c.name).join(', ')}. Por favor, ejecuta el seed nuevamente.`);
                              }
                            }}
                            className="w-full py-1.5 px-2 bg-blue-500 text-white rounded font-semibold text-[10px] flex items-center justify-center gap-1 active:scale-95 min-h-[32px] hover:bg-blue-600 transition"
                          >
                            <span className="text-xs">➕</span>
                            <span>Adiciones</span>
                          </button>
                        </div>

                        {/* Mostrar adiciones agregadas */}
                        {item.customization && item.customization.additions.length > 0 && (
                          <div className="mb-2 p-1.5 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-[9px] font-semibold text-blue-700 mb-1">➕ Adiciones:</p>
                            <div className="space-y-0.5">
                              {item.customization.additions.map((add, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[9px]">
                                  <span className="text-blue-600 truncate flex-1 min-w-0">{add.name}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-blue-700 font-semibold">+${add.priceDelta.toFixed(2)}</span>
                                    <button
                                      onClick={() => {
                                        const updatedCart = [...cart];
                                        const currentItem = updatedCart[cartIndex];
                                        if (currentItem.customization) {
                                          currentItem.customization.additions =
                                            currentItem.customization.additions.filter((_, i) => i !== idx);
                                          setCart(updatedCart);
                                        }
                                      }}
                                      className="w-4 h-4 bg-red-400 text-white rounded flex items-center justify-center text-[8px] active:scale-95 flex-shrink-0"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Controles de cantidad y precio */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 bg-red-500 text-white rounded font-bold active:scale-95 min-h-[28px] min-w-[28px] text-xs"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-bold text-xs bg-indigo-100 text-indigo-700 rounded py-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 bg-green-500 text-white rounded font-bold active:scale-95 min-h-[28px] min-w-[28px] text-xs"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-indigo-600 text-xs">
                            ${(() => {
                              const basePrice = item.product.basePrice * item.quantity;
                              const additionsPrice = (item.customization?.additions.reduce((sum, add) => sum + add.priceDelta, 0) || 0) * item.quantity;
                              return (basePrice + additionsPrice).toFixed(2);
                            })()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mostrar items ya enviados a cocina */}
              {currentOrder && currentOrder.status !== 'draft' && currentOrder.items.length > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-gray-300">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">
                      {currentOrder.status === 'served' ? '✅ Pedidos Entregados' : t('orders.in_preparation')}
                    </h3>
                    {currentOrder.status === 'served' && (
                      <span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                        Entregado
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {currentOrder.items.map(item => {
                      // Determinar si el item es de bar o cocina
                      let isBarItem = false;
                      for (const category of categories) {
                        const product = category.items.find(p => p.id === item.productId);
                        if (product) {
                          const categoryMetadata = category.metadata || {};
                          const categoryName = category.name.toLowerCase();

                          // Verificar metadata primero
                          const itemType = categoryMetadata.type || categoryMetadata.location || '';
                          if (itemType === 'bar' || itemType === 'drinks') {
                            isBarItem = true;
                          } else {
                            // Si no hay metadata, verificar por nombre de categoría
                            // Categorías comunes de bar: Bebidas, Cocteles, Bar, Drinks, etc.
                            const barCategoryNames = ['bebida', 'bebidas', 'coctel', 'cocteles', 'bar', 'drinks', 'cocktail', 'cocktails', 'cerveza', 'cervezas', 'vino', 'vinos', 'licor', 'licores'];
                            if (barCategoryNames.some(name => categoryName.includes(name))) {
                              isBarItem = true;
                            }
                          }
                          break;
                        }
                      }

                      // Colores y estilos según si es de cocina o bar
                      const getItemStyles = () => {
                        if (item.status === 'served') {
                          return 'bg-green-50 border-green-400 shadow-md';
                        } else if (item.status === 'prepared') {
                          return isBarItem
                            ? 'bg-green-100 border-green-300'
                            : 'bg-green-100 border-green-300';
                        } else if (item.status === 'sent') {
                          return isBarItem
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-orange-50 border-orange-300';
                        }
                        return 'bg-gray-50 border-gray-200';
                      };

                      const getBadgeStyles = () => {
                        if (item.status === 'served') {
                          return 'bg-green-500 text-white shadow-lg';
                        } else if (item.status === 'prepared') {
                          return 'bg-green-400 text-white';
                        } else if (item.status === 'sent') {
                          return isBarItem
                            ? 'bg-blue-500 text-white'
                            : 'bg-orange-500 text-white';
                        }
                        return 'bg-gray-300 text-gray-700';
                      };

                      const getStatusText = () => {
                        if (item.status === 'served') {
                          return '✅ Entregado';
                        } else if (item.status === 'prepared') {
                          return '✓ Listo';
                        } else if (item.status === 'sent') {
                          return isBarItem ? '🍹 En Bar' : '🍳 En Cocina';
                        }
                        return '⏸️ Pendiente';
                      };

                      return (
                        <div
                          key={item.id}
                          className={`rounded-lg p-3 border-2 transition-all duration-200 ${getItemStyles()}`}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">
                                {item.productName || (item.productId ? `Producto ${item.productId.substring(0, 8)}` : 'Producto')}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Cantidad: <span className="font-bold text-base">{item.quantity}</span>
                              </p>
                              {item.notes && (
                                <p className="text-xs text-gray-500 italic mt-1 truncate">
                                  📝 {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {currentOrder && currentOrder.status !== 'closed' && (
                                <button
                                  onClick={() => handleCancelItem(item.id, item.productName || 'Producto', false)}
                                  className="w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold active:scale-95 shadow-sm hover:bg-red-200 transition-colors"
                                  title="Cancelar plato"
                                >
                                  ✕
                                </button>
                              )}
                              <span className={`px-2 py-1.5 rounded-lg text-xs font-bold min-w-[90px] text-center flex-shrink-0 ${getBadgeStyles()}`}>
                                {getStatusText()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {currentOrder.status === 'served' && (
                    <div className="mt-4 p-3 bg-green-100 border-2 border-green-400 rounded-lg">
                      <p className="text-green-800 font-bold text-sm text-center">
                        ✅ Todos los pedidos de cocina han sido entregados
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resumen y Botones - Fijo en la parte inferior */}
            {(cart.length > 0 || currentOrder) && (
              <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA (10%):</span>
                    <span className="font-semibold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                    <span>Total:</span>
                    <span className="text-indigo-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Mostrar botón si hay items en el carrito (nuevos o draft) */}
                {cart.length > 0 && (
                  <button
                    onClick={handleSendToKitchen}
                    disabled={sendingToKitchen}
                    className={`
                    w-full py-4 rounded-xl font-bold text-lg transition-all duration-200
                    min-h-[52px] active:scale-95
                    ${sendingToKitchen
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl'
                      }
                  `}
                  >
                    {sendingToKitchen ? 'Enviando...' : (currentOrder && currentOrder.status !== 'draft') ? 'Enviar Adiciones a Cocina 🍳' : 'Enviar a Cocina y/o Bar 🍳🍹'}
                  </button>
                )}

                {/* Mostrar mensaje si la orden ya fue enviada y el carrito está vacío */}
                {currentOrder && currentOrder.status !== 'draft' && cart.length === 0 && (
                  <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-lg text-center">
                    <p className="text-blue-800 font-semibold text-sm">
                      {currentOrder.status === 'sent_to_kitchen' ? '⏳ Orden enviada a cocina' :
                        currentOrder.status === 'served' ? '✅ Orden servida' :
                          `Estado: ${currentOrder.status}`}
                    </p>
                    {currentOrder.status === 'sent_to_kitchen' && (
                      <p className="text-xs text-blue-600 mt-1">
                        Los productos ya están siendo preparados
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mostrar mensaje cuando orden está servida */}
            {currentOrder && currentOrder.status === 'served' && currentOrder.items.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-green-50">
                <div className="text-center p-4 bg-green-100 border-2 border-green-400 rounded-xl">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="font-bold text-green-800 text-base mb-1">
                    Pedidos Entregados
                  </p>
                  <p className="text-sm text-green-700">
                    La cocina ha entregado todos los pedidos
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Panel de Carrito Móvil - Overlay */}
          {showMobileCart && (
            <>
              <div
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowMobileCart(false)}
              ></div>
              <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 z-50 max-h-[70vh] flex flex-col rounded-t-xl">
                <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between rounded-t-xl">
                  <h2 className="text-lg font-bold text-white">Orden Activa ({cart.length})</h2>
                  <button
                    onClick={() => setShowMobileCart(false)}
                    className="w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center font-bold active:scale-95"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🛒</div>
                      <p className="text-gray-600 font-medium text-sm">El carrito está vacío</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item, cartIndex) => {
                        const includedIngredients = getProductIngredients(item.product);
                        return (
                          <div
                            key={item.product.id}
                            className="bg-white rounded-lg p-2 border border-gray-300 shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-xs mb-0.5 leading-tight">
                                  {item.product.name}
                                </h3>
                              </div>
                              <button
                                onClick={() => handleRemoveProduct(item.product.id)}
                                className="ml-1 w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center font-bold active:scale-95 min-h-[24px] min-w-[24px] text-[10px] flex-shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                            {includedIngredients.length > 0 && (
                              <div className="mb-2 p-1.5 bg-gray-50 rounded border border-gray-200">
                                <p className="text-[9px] font-semibold text-gray-700 mb-1">🍽️ Incluye:</p>
                                <div className="space-y-1">
                                  {includedIngredients.slice(0, 3).map((ingredient, idx) => {
                                    const isExcluded = item.customization?.excludedIngredients.includes(ingredient) || false;
                                    return (
                                      <div
                                        key={idx}
                                        className={`text-[9px] p-1 rounded ${isExcluded ? 'bg-red-50 text-red-600 line-through' : 'bg-green-50 text-green-700'}`}
                                      >
                                        {ingredient}
                                      </div>
                                    );
                                  })}
                                  {includedIngredients.length > 3 && (
                                    <p className="text-[8px] text-gray-500">+{includedIngredients.length - 3} más</p>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                  className="w-7 h-7 bg-red-500 text-white rounded font-bold active:scale-95 min-h-[28px] min-w-[28px] text-xs"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-bold text-xs bg-indigo-100 text-indigo-700 rounded py-1">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                  className="w-7 h-7 bg-green-500 text-white rounded font-bold active:scale-95 min-h-[28px] min-w-[28px] text-xs"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-bold text-indigo-600 text-xs">
                                ${(() => {
                                  const basePrice = item.product.basePrice * item.quantity;
                                  const additionsPrice = (item.customization?.additions.reduce((sum, add) => sum + add.priceDelta, 0) || 0) * item.quantity;
                                  return (basePrice + additionsPrice).toFixed(2);
                                })()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">IVA (10%):</span>
                        <span className="font-semibold">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2">
                        <span>Total:</span>
                        <span className="text-indigo-600">${total.toFixed(2)}</span>
                      </div>
                    </div>
                    {(!currentOrder || currentOrder.status === 'draft') && (
                      <button
                        onClick={() => {
                          handleSendToKitchen();
                          setShowMobileCart(false);
                        }}
                        disabled={sendingToKitchen}
                        className={`
                        w-full py-3 rounded-xl font-bold text-base transition-all duration-200
                        min-h-[48px] active:scale-95
                        ${sendingToKitchen
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                          }
                      `}
                      >
                        {sendingToKitchen ? 'Enviando...' : 'Enviar a Cocina y/o Bar 🍳🍹'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Personalización de Producto */}
      {productToCustomize && (
        <ProductCustomizationModal
          product={productToCustomize}
          availableModifiers={availableModifiers}
          includedIngredients={productToCustomize ? getProductIngredients(productToCustomize) : []}
          isOpen={customizationModalOpen}
          onClose={() => {
            setCustomizationModalOpen(false);
            setProductToCustomize(null);
          }}
          onConfirm={handleConfirmCustomization}
        />
      )}
    </div>
  );
};

// Función helper para obtener ingredientes de un producto
// Prioriza ingredientes guardados en metadata, luego parsea desde descripción
const getProductIngredients = (product: Product): string[] => {
  // 1. Primero intentar obtener ingredientes desde metadata (si fueron identificados por el agente)
  if (product.metadata && product.metadata.ingredients && Array.isArray(product.metadata.ingredients)) {
    return product.metadata.ingredients.map((ing: any) => String(ing));
  }

  // 2. Si no hay ingredientes en metadata, parsear desde la descripción (fallback)
  return parseIngredientsFromDescription(product.description || '');
};

// Función helper para parsear ingredientes de la descripción (fallback)
// Mejora: Separa mejor los ingredientes considerando múltiples separadores
const parseIngredientsFromDescription = (description: string): string[] => {
  if (!description) return [];

  let text = description.trim();

  // Remover palabras comunes al inicio como "incluye", "contiene", "con", etc.
  text = text.replace(/^(incluye|contiene|con|tiene|viene con|trae)\s*:?\s*/i, '');

  // Reemplazar múltiples separadores comunes por un separador único
  // "y", "con", ",", "y con", "más", "además", etc.
  text = text.replace(/\s*(y|con|y con|más|además|incluye|también|o|ó)\s+/gi, '|SEPARADOR|');

  // Separar por comas también
  text = text.replace(/,/g, '|SEPARADOR|');

  // Separar por el separador personalizado
  const parts = text.split('|SEPARADOR|').map(p => p.trim()).filter(p => p.length > 0);

  const ingredients: string[] = [];

  parts.forEach(part => {
    // Limpiar cada parte
    let cleaned = part.trim();

    // Remover números y cantidades al inicio (ej: "tres tacos" -> "tacos", "2 hamburguesas" -> "hamburguesas")
    cleaned = cleaned.replace(/^\d+\s+/, ''); // "2 hamburguesas" -> "hamburguesas"
    cleaned = cleaned.replace(/^(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|una|un)\s+/i, ''); // "tres tacos" -> "tacos"

    // Remover palabras comunes al inicio
    cleaned = cleaned.replace(/^(con|sin|de|la|el|las|los|del|de la|de los|de las)\s+/i, '');

    // Limpiar espacios múltiples
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remover caracteres especiales innecesarios al inicio y final
    cleaned = cleaned.replace(/^[.,;:\-\s]+|[.,;:\-\s]+$/g, '');

    // Solo agregar si tiene al menos 2 caracteres y no es solo números
    if (cleaned && cleaned.length >= 2 && !/^\d+$/.test(cleaned)) {
      ingredients.push(cleaned);
    }
  });

  // Si aún no tenemos ingredientes, intentar dividir por espacios si la descripción es corta
  if (ingredients.length === 0 && description.length < 100 && !description.includes(',')) {
    const words = description.trim().split(/\s+/).filter(w => w.length > 3);
    if (words.length <= 5) {
      ingredients.push(...words);
    }
  }

  // Si todavía no tenemos ingredientes, usar la descripción completa (limpiada)
  if (ingredients.length === 0 && description.length < 100) {
    const cleaned = description.replace(/^(incluye|contiene|con)\s*:?\s*/i, '').trim();
    if (cleaned) {
      ingredients.push(cleaned);
    }
  }

  // Eliminar duplicados (case-insensitive)
  const uniqueIngredients: string[] = [];
  const seen = new Set<string>();

  ingredients.forEach(ing => {
    const lower = ing.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueIngredients.push(ing);
    }
  });

  return uniqueIngredients;
};

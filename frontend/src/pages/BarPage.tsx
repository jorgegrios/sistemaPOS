/**
 * Bar Page (Bar Display System)
 * Touch-First POS Design for Bar Staff
 * 100% touchscreen-optimized bar interface
 * RULE: Bar only sees items with status = 'sent' or 'prepared' from bar categories
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { barDomainService, BarOrder } from '../domains/bar/service';
import { toast } from 'sonner';

export const BarPage: React.FC = () => {
  const [barOrders, setBarOrders] = useState<BarOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparingItem, setPreparingItem] = useState<string | null>(null);
  const navigate = useNavigate();

  // Poll for bar orders every 3 seconds
  useEffect(() => {
    loadBarOrders();
    const interval = setInterval(loadBarOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadBarOrders = async () => {
    try {
      const orders = await barDomainService.getBarOrders();
      setBarOrders(orders);
    } catch (err: any) {
      console.error('Error loading bar orders:', err);
      if (!loading) {
        toast.error('Error al cargar órdenes de bar');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPrepared = async (orderItemId: string) => {
    try {
      setPreparingItem(orderItemId);
      await barDomainService.markItemPrepared(orderItemId);
      toast.success('Item marcado como preparado');
      
      // Reload orders
      await loadBarOrders();
    } catch (err: any) {
      console.error('Error marking item as prepared:', err);
      toast.error(err.message || 'Error al marcar item como preparado');
    } finally {
      setPreparingItem(null);
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'prepared':
        return 'bg-green-100 border-green-400 text-green-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getItemStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'En Preparación';
      case 'prepared':
        return 'Preparado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🍹</div>
          <p className="text-xl font-bold text-gray-700">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">🍹 Bar</h1>
          <p className="text-sm text-blue-100 mt-1">
            {barOrders.length} {barOrders.length === 1 ? 'orden activa' : 'órdenes activas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/bar/served')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px] flex items-center gap-2"
          >
            ✅ Órdenes Entregadas
          </button>
          <button
            onClick={loadBarOrders}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px]"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Bar Orders - Grid de 4 columnas */}
      <div className="p-4">
        {barOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">✅</div>
            <p className="text-2xl font-bold text-gray-700 mb-2">
              ¡No hay órdenes pendientes!
            </p>
            <p className="text-gray-500">
              Todas las órdenes están preparadas o servidas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {barOrders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-xl shadow-xl p-4 border-4 border-blue-300 flex flex-col"
              >
                {/* Order Header */}
                <div className="mb-4 pb-4 border-b-2 border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">
                    📍 Mesa {order.tableNumber}
                  </h2>
                  <p className="text-xs text-gray-600 mb-2">
                    Orden: {order.orderNumber.substring(0, 12)}
                  </p>
                  <div className="text-xs text-gray-500 space-y-1 pb-2 border-b border-gray-200">
                    <p className="font-semibold text-gray-700">
                      📅 Tomada: <span className="font-normal">
                        {new Date(order.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} {new Date(order.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Order Items - Scrollable */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                  {order.items.map((item) => {
                    const isPreparing = preparingItem === item.id;
                    const isPrepared = item.status === 'prepared';
                    
                    return (
                      <div
                        key={item.id}
                        className={`
                          rounded-lg p-3 border-2 transition-all duration-200
                          ${getItemStatusColor(item.status)}
                          ${isPreparing ? 'opacity-50' : ''}
                          ${isPrepared ? 'opacity-75' : ''}
                        `}
                      >
                        <div className="mb-2">
                          <h3 className="text-base font-bold mb-1">
                            {item.productName}
                          </h3>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">
                              Cantidad: <span className="text-lg">{item.quantity}</span>
                            </span>
                            <span className={`
                              px-2 py-1 rounded font-bold text-xs
                              ${item.status === 'sent' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-green-500 text-white'
                              }
                            `}>
                              {getItemStatusText(item.status)}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs italic mt-1 opacity-90">
                              📝 {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Action Button - Only for 'sent' items */}
                        {item.status === 'sent' && (
                          <button
                            onClick={() => handleMarkPrepared(item.id)}
                            disabled={isPreparing}
                            className={`
                              w-full py-2 rounded-lg font-bold text-sm transition-all duration-200 active:scale-95
                              min-h-[44px]
                              ${isPreparing
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl'
                              }
                            `}
                          >
                            {isPreparing ? (
                              <span className="flex items-center justify-center gap-1">
                                <span className="animate-spin">⏳</span>
                                <span>Marcando...</span>
                              </span>
                            ) : (
                              <span>✅ Preparado</span>
                            )}
                          </button>
                        )}

                        {/* Already Prepared Indicator */}
                        {item.status === 'prepared' && (
                          <div className="w-full py-2 rounded-lg bg-green-500 text-white text-center font-bold text-sm">
                            ✓ Preparado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};






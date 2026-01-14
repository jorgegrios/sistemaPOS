/**
 * Served Orders Page
 * Display orders that have been served (all items prepared and served)
 * Touch-First POS Design for Kitchen Staff
 * 4-column grid layout
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kitchenDomainService, KitchenOrder } from '../domains/kitchen/service';
import { toast } from 'sonner';

export const ServedOrdersPage: React.FC = () => {
  const [servedOrders, setServedOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Poll for served orders every 5 seconds
  useEffect(() => {
    loadServedOrders();
    const interval = setInterval(loadServedOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadServedOrders = async () => {
    try {
      const orders = await kitchenDomainService.getServedOrders();
      setServedOrders(orders);
    } catch (err: any) {
      console.error('Error loading served orders:', err);
      if (!loading) {
        toast.error('Error al cargar órdenes entregadas');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">✅</div>
          <p className="text-xl font-bold text-gray-700">Cargando órdenes entregadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/kitchen')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px] flex items-center gap-2"
          >
            ← Volver a Cocina
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">✅ Órdenes Entregadas</h1>
            <p className="text-sm text-green-100 mt-1">
              {servedOrders.length} {servedOrders.length === 1 ? 'orden entregada' : 'órdenes entregadas'}
            </p>
          </div>
        </div>
        <button
          onClick={loadServedOrders}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px]"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Served Orders - Grid de 4 columnas */}
      <div className="p-4">
        {servedOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📋</div>
            <p className="text-2xl font-bold text-gray-700 mb-2">
              No hay órdenes entregadas
            </p>
            <p className="text-gray-500">
              Las órdenes entregadas aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {servedOrders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-xl shadow-xl p-4 border-4 border-green-300 flex flex-col"
              >
                {/* Order Header */}
                <div className="mb-4 pb-4 border-b-2 border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">
                    📍 Mesa {order.tableNumber}
                  </h2>
                  <p className="text-xs text-gray-600 mb-2">
                    Orden: {order.orderNumber.substring(0, 12)}
                  </p>
                  <div className="text-xs text-gray-600 space-y-1.5 mt-2 pb-2 border-b border-gray-200">
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
                    {order.servedAt && (
                      <p className="font-semibold text-green-700">
                        ✅ Entregada: <span className="font-normal">
                          {new Date(order.servedAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} {new Date(order.servedAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items - Scrollable */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg p-3 border-2 bg-green-50 border-green-400 text-green-800"
                    >
                      <div className="mb-2">
                        <h3 className="text-base font-bold mb-1">
                          {item.productName}
                        </h3>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">
                            Cantidad: <span className="text-lg">{item.quantity}</span>
                          </span>
                          <span className="px-2 py-1 rounded font-bold text-xs bg-green-500 text-white">
                            Entregado
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs italic mt-1 opacity-90">
                            📝 {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="w-full py-2 rounded-lg bg-green-500 text-white text-center font-bold text-sm">
                        ✓ Entregado
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

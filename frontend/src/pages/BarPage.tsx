/**
 * Bar Page (BDS - Bar Display System)
 * Touch-First POS Design for Bar Staff
 * RULE: Bar only sees items with status = 'sent' or 'prepared' and station = 'bar'
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kitchenDomainService, KitchenOrder } from '../domains/kitchen/service';
import { toast } from 'sonner';

export const BarPage: React.FC = () => {
  const [barOrders, setBarOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparingItem, setPreparingItem] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0); // Offset in ms: Server - Local
  const navigate = useNavigate();

  // Poll for bar orders every 3 seconds
  useEffect(() => {
    loadBarOrders();
    const interval = setInterval(loadBarOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update current time every second for the counters
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadBarOrders = async () => {
    try {
      const response = await kitchenDomainService.getKitchenOrders('bar');
      const orders = response.orders || [];
      const serverTime = response.serverTime;

      if (serverTime) {
        const sTime = new Date(serverTime).getTime();
        const lTime = Date.now();
        setTimeOffset(sTime - lTime);
      }

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

  const calculateElapsedTime = (createdAt: string) => {
    // Defensive: ensure we have a valid timestamp
    if (!createdAt) {
      console.warn('[Bar] Invalid createdAt:', createdAt);
      return { text: '0:00', minutes: 0, totalSeconds: 0 };
    }

    const start = new Date(createdAt).getTime();

    // Check if date parsing failed (returns NaN)
    if (isNaN(start)) {
      console.warn('[Bar] Failed to parse createdAt:', createdAt);
      return { text: '0:00', minutes: 0, totalSeconds: 0 };
    }

    // FIXED: PostgreSQL stores in UTC, Colombia is UTC-5
    const COLOMBIA_OFFSET = 5 * 60 * 60 * 1000; // 5 hours
    const localStart = start - COLOMBIA_OFFSET;

    const now = Date.now();
    const diff = now - localStart;
    const actualDiff = diff < 0 ? 0 : diff;

    const hours = Math.floor(actualDiff / 3600000);
    const minutes = Math.floor((actualDiff % 3600000) / 60000);
    const seconds = Math.floor((actualDiff % 60000) / 1000);

    return {
      text: hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`,
      minutes: hours * 60 + minutes,
      totalSeconds: Math.floor(actualDiff / 1000)
    };
  };

  const getTimerColor = (minutes: number) => {
    if (minutes >= 20) return 'text-red-600 bg-red-100 border-red-200 animate-pulse';
    if (minutes >= 10) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const handleMarkPrepared = async (orderItemId: string) => {
    try {
      setPreparingItem(orderItemId);
      await kitchenDomainService.markItemPrepared(orderItemId);
      toast.success('Bebida marcada como preparada');
      await loadBarOrders();
    } catch (err: any) {
      console.error('Error marking item as prepared:', err);
      toast.error(err.message || 'Error al marcar bebida como preparada');
    } finally {
      setPreparingItem(null);
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'prepared': return 'bg-green-100 border-green-400 text-green-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getItemStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'En Preparación';
      case 'prepared': return 'Listo';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🍹</div>
          <p className="text-xl font-bold text-gray-700">Cargando bar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">🍹 Bar</h1>
          <p className="text-sm text-blue-100 mt-1">
            {barOrders.length} {barOrders.length === 1 ? 'bebida pendiente' : 'bebidas pendientes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBarOrders}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-sm transition active:scale-95 min-h-[44px]"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Bar Orders Grid */}
      <div className="p-4">
        {barOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🥂</div>
            <p className="text-2xl font-bold text-gray-700 mb-2">¡Salinas limpias!</p>
            <p className="text-gray-500">No hay bebidas por preparar ahora mismo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {barOrders.map((order) => {
              const elapsed = calculateElapsedTime(order.createdAt);
              const timerColorClass = getTimerColor(elapsed.minutes);

              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-xl shadow-xl p-4 border-4 border-blue-300 flex flex-col"
                >
                  <div className="mb-4 pb-4 border-b-2 border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-4 py-2 rounded-2xl font-black text-xl border-2 ${timerColorClass}`}>
                        {elapsed.text}
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Mesa</span>
                        <span className="text-2xl font-black text-gray-900">
                          {order.tableNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Orden</h3>
                      <p className="font-mono text-xs font-bold text-gray-600">{order.orderNumber}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg p-3 border-2 transition-all duration-200 ${getItemStatusColor(item.status)}`}
                      >
                        <div className="mb-2">
                          <h3 className="text-base font-bold mb-1">
                            {item.productName}
                            {item.seatNumber && (
                              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-bold">
                                Silla {item.seatNumber}
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">Cantidad: <span className="text-lg">{item.quantity}</span></span>
                            <span className={`px-2 py-1 rounded font-bold text-xs ${item.status === 'sent' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                              {getItemStatusText(item.status)}
                            </span>
                          </div>
                          {item.notes && <p className="text-xs italic mt-1 opacity-90">📝 {item.notes}</p>}
                        </div>

                        {item.status === 'sent' && (
                          <button
                            onClick={() => handleMarkPrepared(item.id)}
                            disabled={preparingItem === item.id}
                            className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm shadow-lg active:scale-95 transition min-h-[44px]"
                          >
                            {preparingItem === item.id ? 'Marcando...' : '✅ Listo'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

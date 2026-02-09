/**
 * Kitchen Page (KDS - Kitchen Display System)
 * Touch-First POS Design for Kitchen Staff
 * 100% touchscreen-optimized kitchen interface
 * RULE: Kitchen only sees items with status = 'sent' or 'prepared'
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kitchenDomainService, KitchenOrder } from '../domains/kitchen/service';
import { toast } from 'sonner';

export const KitchenPage: React.FC = () => {
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparingItem, setPreparingItem] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0);

  // New State for Stations
  const [stations, setStations] = useState<{ id: string, name: string }[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');

  const navigate = useNavigate();

  // 1. Load Stations on Mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const fetchedStations = await kitchenDomainService.getStations();
        setStations(fetchedStations);

        // Auto-select first station if none selected
        if (fetchedStations.length > 0 && !selectedStationId) {
          // Try to find "Cocina" or default
          const defaultStation = fetchedStations.find(s => s.isDefault) || fetchedStations[0];
          setSelectedStationId(defaultStation.id);
        }
      } catch (err) {
        console.error("Error fetching stations:", err);
        toast.error("Error al cargar estaciones");
      }
    };
    fetchStations();
  }, []); // Run once

  // Poll for kitchen orders every 3 seconds
  // DEPENDENCY: selectedStationId
  useEffect(() => {
    if (!selectedStationId) return;

    loadKitchenOrders();
    const interval = setInterval(loadKitchenOrders, 3000);
    return () => clearInterval(interval);
  }, [selectedStationId]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadKitchenOrders = async () => {
    if (!selectedStationId) return;

    try {
      // Pass selectedStationId
      const response = await kitchenDomainService.getKitchenOrders(selectedStationId);
      const orders = response.orders || [];
      const serverTime = response.serverTime;

      if (serverTime) {
        const sTime = new Date(serverTime).getTime();
        const lTime = Date.now();
        setTimeOffset(sTime - lTime);
      }

      setKitchenOrders(orders);
    } catch (err: any) {
      console.error('Error loading kitchen orders:', err);
      if (!loading) {
        toast.error('Error al cargar órdenes de cocina');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateElapsedTime = (createdAt: string) => {
    if (!createdAt) return { text: '0:00', minutes: 0, totalSeconds: 0 };
    const start = new Date(createdAt).getTime();
    if (isNaN(start)) return { text: '0:00', minutes: 0, totalSeconds: 0 };

    const COLOMBIA_OFFSET = 5 * 60 * 60 * 1000;
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

  const handleMarkPrepared = async (id: string, isTask: boolean = false) => {
    try {
      setPreparingItem(id);
      if (isTask) {
        await kitchenDomainService.markTaskPrepared(id);
      } else {
        await kitchenDomainService.markItemPrepared(id);
      }
      toast.success(isTask ? 'Componente listo' : 'Item marcado como preparado');
      await loadKitchenOrders();
    } catch (err: any) {
      console.error('Error marking as prepared:', err);
      toast.error(err.message || 'Error al actualizar estado');
    } finally {
      setPreparingItem(null);
    }
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'prepared': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading && stations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🍳</div>
          <p className="text-xl font-bold text-gray-700">Cargando Cocina...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 shadow-xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              🍳 KDS <span className="text-orange-500">PRO</span>
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              {kitchenOrders.length} {kitchenOrders.length === 1 ? 'orden' : 'órdenes'}
            </p>
          </div>

          {/* Station Selector */}
          <div className="relative">
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="appearance-none bg-gray-800 text-white font-bold py-2 pl-4 pr-10 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 hover:bg-gray-700 transition cursor-pointer"
            >
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/kitchen/served')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition active:scale-95 border border-gray-700"
          >
            ✅ Entregadas
          </button>
          <button
            onClick={loadKitchenOrders}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition active:rotate-180 duration-500"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 sm:p-6">
        {kitchenOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-inner border-4 border-dashed border-gray-200">
            <div className="text-8xl mb-6">✨</div>
            <p className="text-4xl font-black text-gray-800 uppercase tracking-tighter">
              ¡Estación Limpia!
            </p>
            <p className="text-gray-400 font-bold mt-2">No hay pedidos pendientes para {stations.find(s => s.id === selectedStationId)?.name}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {kitchenOrders.map((order) => {
              const elapsed = calculateElapsedTime(order.createdAt);
              const timerColorClass = getTimerColor(elapsed.minutes);

              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border-b-8 border-gray-200 hover:border-indigo-500 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="p-5 bg-gray-50 border-b border-gray-100">
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

                  {/* Items List */}
                  <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[450px]">
                    {order.items.map((item) => {
                      // Check if item has tasks
                      const hasTasks = item.tasks && item.tasks.length > 0;

                      if (hasTasks) {
                        return (
                          <div key={item.id} className="border-2 border-dashed border-gray-300 rounded-2xl p-3 bg-gray-50/50">
                            <h4 className="text-sm font-black text-gray-700 uppercase mb-2 pl-1 border-l-4 border-indigo-500">
                              {item.productName} <span className="text-gray-400 text-xs">x{item.quantity}</span>
                            </h4>
                            <div className="space-y-2">
                              {item.tasks!.map(task => {
                                const isPreparing = preparingItem === task.id;
                                return (
                                  <div key={task.id}
                                    className={`
                                                    rounded-xl p-3 border-2 transition-all duration-200
                                                    ${getItemStatusColor(task.status)}
                                                    ${isPreparing ? 'opacity-50 grayscale' : ''}
                                                `}
                                  >
                                    <div className="flex justify-between items-center gap-2 mb-2">
                                      <span className="font-bold text-base">{task.componentName}</span>
                                      {task.status === 'prepared' && <span>✓</span>}
                                    </div>

                                    {task.status === 'sent' && (
                                      <button
                                        onClick={() => handleMarkPrepared(task.id, true)}
                                        disabled={isPreparing}
                                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold uppercase text-xs shadow-sm"
                                      >
                                        {isPreparing ? '...' : 'LISTO'}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Legacy Single Item Rendering
                      const isPreparing = preparingItem === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`
                            rounded-2xl p-4 border-2 transition-all duration-200
                            ${getItemStatusColor(item.status)}
                            ${isPreparing ? 'opacity-50 grayscale' : ''}
                          `}
                        >
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <div className="flex-1">
                              <h4 className="text-lg font-black text-gray-900 uppercase leading-tight">
                                {item.productName}
                              </h4>
                              {item.notes && (
                                <p className="text-xs font-bold text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded-md inline-block">
                                  ⚠️ {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="bg-white text-gray-900 w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-sm border border-gray-100">
                              {item.quantity}
                            </div>
                          </div>

                          {item.status === 'sent' && (
                            <button
                              onClick={() => handleMarkPrepared(item.id, false)}
                              disabled={isPreparing}
                              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
                            >
                              {isPreparing ? '⏳ ...' : '✅ LISTO'}
                            </button>
                          )}

                          {item.status === 'prepared' && (
                            <div className="w-full py-3 bg-green-100 text-green-700 text-center rounded-xl font-black text-xs uppercase tracking-widest border border-green-200">
                              ✓ PREPARADO
                            </div>
                          )}
                        </div>
                      );
                    })}
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


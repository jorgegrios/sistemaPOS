/**
 * Stock Alerts Page
 * View low stock alerts
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { inventoryService, StockAlert } from '../services/inventory-service';

export const StockAlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getStockAlerts();
      setAlerts(data);
    } catch (error) {
      toast.error('Error loading alerts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: StockAlert['status']) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-300';
      case 'critical': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusLabel = (status: StockAlert['status']) => {
    switch (status) {
      case 'out_of_stock': return 'Sin Stock';
      case 'critical': return 'Crítico';
      default: return 'Bajo';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
        >
          ← Volver
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Alertas de Stock</h1>
        <p className="text-gray-600 mt-1">
          {alerts.length} {alerts.length === 1 ? 'item' : 'items'} requieren atención
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-lg text-gray-600">No hay alertas de stock</p>
          <p className="text-sm text-gray-500 mt-2">Todos los items tienen stock suficiente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.inventoryItemId}
              className="bg-white rounded-lg shadow-md border-2 p-4 hover:shadow-lg transition cursor-pointer btn-touch"
              onClick={() => navigate(`/inventory/${alert.inventoryItemId}`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{alert.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Stock Actual:</span>
                      <span className="ml-2 font-semibold text-red-600">
                        {alert.currentStock}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Stock Mínimo:</span>
                      <span className="ml-2 font-semibold">{alert.minStock}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Punto de Reorden:</span>
                      <span className="ml-2 font-semibold">{alert.reorderPoint}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(alert.status)}`}>
                  {getStatusLabel(alert.status)}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/purchases/orders/new?itemId=${alert.inventoryItemId}`);
                  }}
                  className="btn-primary px-4 py-2 rounded-lg text-sm font-medium btn-touch"
                >
                  Crear Orden de Compra
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};








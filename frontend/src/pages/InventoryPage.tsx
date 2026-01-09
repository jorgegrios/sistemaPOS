/**
 * Inventory Page
 * List and manage inventory items
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { inventoryService, InventoryItem, StockAlert } from '../services/inventory-service';

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lowStock' | 'active'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, alertsData] = await Promise.all([
        inventoryService.getInventoryItems({
          active: filter === 'active' ? true : undefined,
          lowStock: filter === 'lowStock' ? true : undefined
        }),
        inventoryService.getStockAlerts()
      ]);
      setItems(itemsData);
      setAlerts(alertsData);
    } catch (error) {
      toast.error('Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem): 'ok' | 'low' | 'critical' => {
    if (item.currentStock === 0) return 'critical';
    if (item.reorderPoint && item.currentStock <= item.reorderPoint) return 'low';
    if (item.minStock && item.currentStock <= item.minStock) return 'critical';
    return 'ok';
  };

  const getStatusColor = (status: 'ok' | 'low' | 'critical') => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Inventario</h1>
          <p className="text-gray-600">Gestiona productos e ingredientes</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate('/inventory/new')}
            className="btn-primary px-4 py-3 rounded-lg font-semibold btn-touch flex items-center gap-2"
          >
            <span>➕</span>
            <span>Nuevo Item</span>
          </button>
          <button
            onClick={() => navigate('/inventory/alerts')}
            className="btn-danger px-4 py-3 rounded-lg font-semibold btn-touch flex items-center gap-2 relative"
          >
            <span>⚠️</span>
            <span>Alertas</span>
            {alerts.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } btn-touch`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('lowStock')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'lowStock' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } btn-touch`}
        >
          Stock Bajo
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } btn-touch`}
        >
          Activos
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const status = getStockStatus(item);
          return (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md border-2 p-4 hover:shadow-lg transition cursor-pointer btn-touch"
              onClick={() => navigate(`/inventory/${item.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                  {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
                  {item.category && (
                    <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {item.category}
                    </span>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                  {status === 'critical' ? 'Crítico' : status === 'low' ? 'Bajo' : 'OK'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-semibold text-gray-800">
                    {item.currentStock} {item.unit}
                  </span>
                </div>
                {item.minStock && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mínimo:</span>
                    <span className="text-gray-700">{item.minStock} {item.unit}</span>
                  </div>
                )}
                {item.reorderPoint && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Punto de Reorden:</span>
                    <span className="text-gray-700">{item.reorderPoint} {item.unit}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Costo Unitario:</span>
                  <span className="font-semibold text-green-600">${item.costPerUnit.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/inventory/${item.id}/adjust`);
                  }}
                  className="flex-1 btn-primary py-2 rounded-lg text-sm font-medium btn-touch"
                >
                  Ajustar Stock
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/inventory/${item.id}`);
                  }}
                  className="flex-1 btn-success py-2 rounded-lg text-sm font-medium btn-touch"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay items en el inventario</p>
          <button
            onClick={() => navigate('/inventory/new')}
            className="mt-4 btn-primary px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Crear Primer Item
          </button>
        </div>
      )}
    </div>
  );
};


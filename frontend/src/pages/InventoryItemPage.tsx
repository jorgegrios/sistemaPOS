/**
 * Inventory Item Detail Page
 * View and edit inventory item details
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { inventoryService, InventoryItem, InventoryMovement } from '../services/inventory-service';

export const InventoryItemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});

  useEffect(() => {
    if (id) {
      loadItem();
    }
  }, [id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventoryItem(id!);
      setItem(data.item);
      setMovements(data.movements);
      setFormData(data.item);
    } catch (error) {
      toast.error('Error loading item');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      await inventoryService.updateInventoryItem(id, formData);
      toast.success('Item actualizado');
      setEditing(false);
      loadItem();
    } catch (error) {
      toast.error('Error updating item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{item.name}</h1>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="btn-primary px-4 py-2 rounded-lg btn-touch"
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {/* Item Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            {editing ? (
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{item.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            {editing ? (
              <input
                type="text"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{item.sku || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            {editing ? (
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{item.category || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
            {editing ? (
              <input
                type="text"
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{item.unit}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
            <p className="text-gray-800 font-semibold text-xl">{item.currentStock} {item.unit}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
            {editing ? (
              <input
                type="number"
                value={formData.minStock || ''}
                onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{item.minStock || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Punto de Reorden</label>
            {editing ? (
              <input
                type="number"
                value={formData.reorderPoint || ''}
                onChange={(e) => setFormData({ ...formData, reorderPoint: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{item.reorderPoint || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario</label>
            {editing ? (
              <input
                type="number"
                step="0.01"
                value={formData.costPerUnit || ''}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800 font-semibold">${item.costPerUnit.toFixed(2)}</p>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={handleSave}
              className="btn-success px-6 py-2 rounded-lg btn-touch"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setFormData(item);
              }}
              className="btn-danger px-6 py-2 rounded-lg btn-touch"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Acciones</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/inventory/${id}/adjust`)}
            className="btn-primary px-4 py-2 rounded-lg btn-touch"
          >
            Ajustar Stock
          </button>
          <button
            onClick={() => navigate(`/inventory/${id}/movements`)}
            className="btn-success px-4 py-2 rounded-lg btn-touch"
          >
            Ver Movimientos
          </button>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Movimientos Recientes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Fecha</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-right py-2">Cantidad</th>
                <th className="text-right py-2">Costo</th>
                <th className="text-left py-2">Notas</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 10).map((movement) => (
                <tr key={movement.id} className="border-b">
                  <td className="py-2 text-sm">{new Date(movement.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                      {movement.type}
                    </span>
                  </td>
                  <td className="py-2 text-right font-semibold">
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </td>
                  <td className="py-2 text-right">
                    {movement.unitCost ? `$${movement.unitCost.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2 text-sm text-gray-600">{movement.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && (
            <p className="text-center py-4 text-gray-500">No hay movimientos</p>
          )}
        </div>
      </div>
    </div>
  );
};









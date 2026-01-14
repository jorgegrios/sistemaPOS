/**
 * Create Inventory Item Page
 * Create new inventory items
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { inventoryService } from '../services/inventory-service';

export const CreateInventoryItemPage: React.FC = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'unit',
    currentStock: '0',
    minStock: '',
    maxStock: '',
    reorderPoint: '',
    costPerUnit: '0',
    supplierId: '',
    location: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) {
      toast.error('Nombre y unidad son requeridos');
      return;
    }

    try {
      setCreating(true);
      const item = await inventoryService.createInventoryItem({
        name: formData.name,
        sku: formData.sku || undefined,
        category: formData.category || undefined,
        unit: formData.unit,
        currentStock: parseFloat(formData.currentStock) || 0,
        minStock: formData.minStock ? parseFloat(formData.minStock) : undefined,
        maxStock: formData.maxStock ? parseFloat(formData.maxStock) : undefined,
        reorderPoint: formData.reorderPoint ? parseFloat(formData.reorderPoint) : undefined,
        costPerUnit: parseFloat(formData.costPerUnit) || 0,
        supplierId: formData.supplierId || undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined
      });
      toast.success('Item creado correctamente');
      navigate(`/inventory/${item.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error creating item');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
        >
          ← Volver
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Nuevo Item de Inventario</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: Tomate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: TOM-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: Vegetales"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad *
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: kg, liter, unit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Inicial
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Mínimo
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Punto de Reorden
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Unitario
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: cocina, almacén"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={creating}
            className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch flex-1"
          >
            {creating ? 'Creando...' : 'Crear Item'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="btn-danger px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};








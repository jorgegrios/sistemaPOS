/**
 * Adjust Stock Page
 * Adjust inventory stock levels
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { inventoryService, InventoryItem } from '../services/inventory-service';

export const AdjustStockPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'adjustment' as 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'waste' | 'return',
    quantity: '',
    unitCost: '',
    notes: ''
  });

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
    } catch (error) {
      toast.error('Error loading item');
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.quantity) return;

    try {
      setAdjusting(true);
      await inventoryService.adjustStock(id, {
        quantity: parseFloat(formData.quantity),
        type: formData.type,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
        notes: formData.notes || undefined
      });
      toast.success('Stock ajustado correctamente');
      navigate(`/inventory/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error adjusting stock');
    } finally {
      setAdjusting(false);
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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/inventory/${id}`)}
          className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
        >
          ← Volver
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Ajustar Stock</h1>
        <p className="text-gray-600 mt-1">{item.name}</p>
        <p className="text-lg font-semibold mt-2">
          Stock Actual: <span className="text-blue-600">{item.currentStock} {item.unit}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="purchase">Compra (Entrada)</option>
              <option value="sale">Venta (Salida)</option>
              <option value="adjustment">Ajuste Manual</option>
              <option value="transfer">Transferencia</option>
              <option value="waste">Desperdicio</option>
              <option value="return">Devolución</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad ({item.unit})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0.00"
            />
            {formData.type === 'adjustment' && (
              <p className="text-sm text-gray-500 mt-1">
                Nuevo stock será: {formData.quantity || item.currentStock} {item.unit}
              </p>
            )}
            {(formData.type === 'purchase' || formData.type === 'return') && formData.quantity && (
              <p className="text-sm text-green-600 mt-1">
                Nuevo stock será: {item.currentStock + parseFloat(formData.quantity)} {item.unit}
              </p>
            )}
            {(formData.type === 'sale' || formData.type === 'waste') && formData.quantity && (
              <p className="text-sm text-red-600 mt-1">
                Nuevo stock será: {Math.max(0, item.currentStock - parseFloat(formData.quantity))} {item.unit}
              </p>
            )}
          </div>

          {(formData.type === 'purchase' || formData.type === 'return') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Unitario (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
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
            disabled={adjusting}
            className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch flex-1"
          >
            {adjusting ? 'Ajustando...' : 'Ajustar Stock'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/inventory/${id}`)}
            className="btn-danger px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};









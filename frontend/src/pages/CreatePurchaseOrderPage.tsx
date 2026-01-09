/**
 * Create Purchase Order Page
 * Create new purchase order
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { purchaseService, Supplier } from '../services/purchase-service';
import { inventoryService, InventoryItem } from '../services/inventory-service';

export const CreatePurchaseOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: searchParams.get('supplierId') || '',
    expectedDeliveryDate: '',
    notes: ''
  });
  const [items, setItems] = useState<Array<{
    inventoryItemId?: string;
    name: string;
    quantity: string;
    unit: string;
    unitCost: string;
    notes: string;
  }>>([{ inventoryItemId: '', name: '', quantity: '', unit: '', unitCost: '', notes: '' }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersData, itemsData] = await Promise.all([
        purchaseService.getSuppliers(true),
        inventoryService.getInventoryItems({ active: true })
      ]);
      setSuppliers(suppliersData);
      setInventoryItems(itemsData);
    } catch (error) {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { inventoryItemId: '', name: '', quantity: '', unit: '', unitCost: '', notes: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If inventory item selected, auto-fill name and unit
    if (field === 'inventoryItemId' && value) {
      const item = inventoryItems.find(i => i.id === value);
      if (item) {
        newItems[index].name = item.name;
        newItems[index].unit = item.unit;
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unitCost) || 0;
      return sum + (qty * cost);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }

    const validItems = items.filter(item => item.name && item.quantity && item.unitCost);
    if (validItems.length === 0) {
      toast.error('Agrega al menos un item');
      return;
    }

    try {
      setCreating(true);
      const orderData = await purchaseService.createPurchaseOrder({
        supplierId: formData.supplierId,
        items: validItems.map(item => ({
          inventoryItemId: item.inventoryItemId || undefined,
          name: item.name,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitCost: parseFloat(item.unitCost),
          notes: item.notes || undefined
        })),
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        notes: formData.notes || undefined
      });
      toast.success('Orden de compra creada');
      navigate(`/purchases/orders/${orderData.order.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error creating purchase order');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  const subtotal = calculateTotal();
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/purchases/orders')}
          className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
        >
          ← Volver
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Nueva Orden de Compra</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Supplier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor *
            </label>
            <select
              required
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecciona un proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="btn-success px-4 py-2 rounded-lg btn-touch text-sm"
              >
                + Agregar Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item de Inventario (opcional)
                      </label>
                      <select
                        value={item.inventoryItemId}
                        onChange={(e) => updateItem(index, 'inventoryItemId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Seleccionar...</option>
                        {inventoryItems.map((invItem) => (
                          <option key={invItem.id} value={invItem.id}>
                            {invItem.name} ({invItem.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Nombre del item"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="kg, liter, unit"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Costo Unitario *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas
                      </label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Notas opcionales"
                      />
                    </div>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-2 btn-danger px-4 py-2 rounded-lg btn-touch text-sm"
                    >
                      Eliminar Item
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Entrega Esperada
              </label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuesto (10%):</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={creating}
            className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch flex-1"
          >
            {creating ? 'Creando...' : 'Crear Orden de Compra'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/purchases/orders')}
            className="btn-danger px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};


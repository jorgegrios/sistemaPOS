/**
 * Purchase Order Detail Page
 * View purchase order details and receive items
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { purchaseService, PurchaseOrder, PurchaseOrderItem, Supplier } from '../services/purchase-service';

export const PurchaseOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await purchaseService.getPurchaseOrder(id!);
      setOrder(data.order);
      setItems(data.items);
      
      // Load supplier
      const supplierData = await purchaseService.getSupplier(data.order.supplierId);
      setSupplier(supplierData);

      // Initialize received quantities
      const initialQuantities: Record<string, string> = {};
      data.items.forEach(item => {
        initialQuantities[item.id] = String(item.receivedQuantity || item.quantity);
      });
      setReceivedQuantities(initialQuantities);
    } catch (error) {
      toast.error('Error loading purchase order');
      navigate('/purchases/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!id) return;

    const receivedItems = items.map(item => ({
      itemId: item.id,
      receivedQuantity: parseFloat(receivedQuantities[item.id] || '0')
    })).filter(item => item.receivedQuantity > 0);

    if (receivedItems.length === 0) {
      toast.error('Ingresa las cantidades recibidas');
      return;
    }

    try {
      setReceiving(true);
      await purchaseService.receivePurchaseOrder(id, { receivedItems });
      toast.success('Orden recibida correctamente. Inventario actualizado.');
      loadOrder();
    } catch (error: any) {
      toast.error(error.message || 'Error receiving order');
    } finally {
      setReceiving(false);
    }
  };

  const updateStatus = async (status: PurchaseOrder['status']) => {
    if (!id) return;

    try {
      await purchaseService.updatePurchaseOrderStatus(id, status);
      toast.success('Estado actualizado');
      loadOrder();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const canReceive = order.status === 'confirmed' || order.status === 'sent';
  const isReceived = order.status === 'received';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/purchases/orders')}
          className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
        >
          ← Volver
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{order.orderNumber}</h1>
            <p className="text-gray-600 mt-1">
              Proveedor: {supplier?.name || 'N/A'}
            </p>
          </div>
          <div className="flex gap-2">
            {!isReceived && (
              <>
                {order.status === 'draft' && (
                  <button
                    onClick={() => updateStatus('sent')}
                    className="btn-primary px-4 py-2 rounded-lg btn-touch"
                  >
                    Enviar
                  </button>
                )}
                {canReceive && (
                  <button
                    onClick={handleReceive}
                    disabled={receiving}
                    className="btn-success px-4 py-2 rounded-lg btn-touch"
                  >
                    {receiving ? 'Recibiendo...' : 'Recibir Orden'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              order.status === 'received' ? 'bg-green-100 text-green-800' :
              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
              order.status === 'sent' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status === 'received' ? 'Recibida' :
               order.status === 'confirmed' ? 'Confirmada' :
               order.status === 'sent' ? 'Enviada' :
               order.status === 'cancelled' ? 'Cancelada' :
               'Borrador'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
            <p className="font-semibold">${order.subtotal.toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impuesto</label>
            <p className="font-semibold">${order.tax.toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
            <p className="font-semibold text-green-600 text-lg">${order.total.toFixed(2)}</p>
          </div>
          {order.expectedDeliveryDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entrega Esperada</label>
              <p>{new Date(order.expectedDeliveryDate).toLocaleDateString('es-ES')}</p>
            </div>
          )}
          {order.receivedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recibida</label>
              <p>{new Date(order.receivedAt).toLocaleDateString('es-ES')}</p>
            </div>
          )}
        </div>
        {order.notes && (
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <p className="text-gray-800">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Items</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border-2 border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  {item.inventoryItemId && (
                    <p className="text-sm text-gray-600">Item de inventario vinculado</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="ml-2 font-semibold">{item.quantity} {item.unit}</span>
                </div>
                <div>
                  <span className="text-gray-600">Costo Unitario:</span>
                  <span className="ml-2 font-semibold">${item.unitCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="ml-2 font-semibold">
                    ${(item.quantity * item.unitCost).toFixed(2)}
                  </span>
                </div>
                {canReceive && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad Recibida
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={receivedQuantities[item.id] || ''}
                      onChange={(e) => setReceivedQuantities({
                        ...receivedQuantities,
                        [item.id]: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      max={item.quantity}
                    />
                  </div>
                )}
                {isReceived && (
                  <div>
                    <span className="text-gray-600">Recibido:</span>
                    <span className={`ml-2 font-semibold ${
                      item.receivedQuantity === item.quantity ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {item.receivedQuantity} {item.unit}
                    </span>
                  </div>
                )}
              </div>
              {item.notes && (
                <p className="mt-2 text-sm text-gray-600">Notas: {item.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};








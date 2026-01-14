/**
 * Supplier Detail Page
 * View and edit supplier details
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { purchaseService, Supplier } from '../services/purchase-service';

export const SupplierPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  useEffect(() => {
    if (id) {
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const data = await purchaseService.getSupplier(id!);
      setSupplier(data);
      setFormData(data);
    } catch (error) {
      toast.error('Error loading supplier');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      await purchaseService.updateSupplier(id, formData);
      toast.success('Proveedor actualizado');
      setEditing(false);
      loadSupplier();
    } catch (error) {
      toast.error('Error updating supplier');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate('/suppliers')}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
          >
            ← Volver
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{supplier.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="btn-primary px-4 py-2 rounded-lg btn-touch"
          >
            {editing ? 'Cancelar' : 'Editar'}
          </button>
          <button
            onClick={() => navigate(`/purchases/orders/new?supplierId=${id}`)}
            className="btn-success px-4 py-2 rounded-lg btn-touch"
          >
            Nueva Orden
          </button>
        </div>
      </div>

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
              <p className="text-gray-800">{supplier.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            {editing ? (
              <select
                value={formData.active !== undefined ? String(formData.active) : 'true'}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                supplier.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {supplier.active ? 'Activo' : 'Inactivo'}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
            {editing ? (
              <input
                type="text"
                value={formData.contactName || ''}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{supplier.contactName || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {editing ? (
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{supplier.email || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            {editing ? (
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{supplier.phone || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
            {editing ? (
              <input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{supplier.taxId || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            {editing ? (
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{supplier.address || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Términos de Pago</label>
            {editing ? (
              <input
                type="text"
                value={formData.paymentTerms || ''}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-800">{supplier.paymentTerms || 'N/A'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            {editing ? (
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            ) : (
              <p className="text-gray-800">{supplier.notes || 'N/A'}</p>
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
                setFormData(supplier);
              }}
              className="btn-danger px-6 py-2 rounded-lg btn-touch"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Orders from this supplier */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Órdenes de Compra</h2>
        <button
          onClick={() => navigate(`/purchases/orders?supplierId=${id}`)}
          className="btn-primary px-4 py-2 rounded-lg btn-touch"
        >
          Ver Todas las Órdenes
        </button>
      </div>
    </div>
  );
};








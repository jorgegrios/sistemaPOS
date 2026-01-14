/**
 * Create Supplier Page
 * Create new supplier
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { purchaseService } from '../services/purchase-service';

export const CreateSupplierPage: React.FC = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setCreating(true);
      const supplier = await purchaseService.createSupplier(formData);
      toast.success('Proveedor creado correctamente');
      navigate(`/suppliers/${supplier.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error creating supplier');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/suppliers')}
          className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
        >
          ← Volver
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Nuevo Proveedor</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
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
              placeholder="Ej: Proveedor ABC"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Contacto
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="contacto@proveedor.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / NIT
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="123456789"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Calle 123, Ciudad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Términos de Pago
            </label>
            <input
              type="text"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ej: Net 30, Pago inmediato"
            />
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
              placeholder="Notas adicionales sobre el proveedor..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={creating}
            className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch flex-1"
          >
            {creating ? 'Creando...' : 'Crear Proveedor'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/suppliers')}
            className="btn-danger px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};








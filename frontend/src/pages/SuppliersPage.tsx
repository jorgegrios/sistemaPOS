/**
 * Suppliers Page
 * List and manage suppliers
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { purchaseService, Supplier } from '../services/purchase-service';

export const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, [activeOnly]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await purchaseService.getSuppliers(activeOnly);
      setSuppliers(data);
    } catch (error) {
      toast.error('Error loading suppliers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Proveedores</h1>
          <p className="text-gray-600">Gestiona tus proveedores</p>
        </div>
        <button
          onClick={() => navigate('/suppliers/new')}
          className="btn-primary px-4 py-3 rounded-lg font-semibold btn-touch flex items-center gap-2"
        >
          <span>➕</span>
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-gray-700">Solo activos</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-white rounded-lg shadow-md border-2 p-4 hover:shadow-lg transition cursor-pointer btn-touch"
            onClick={() => navigate(`/suppliers/${supplier.id}`)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-gray-800">{supplier.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                supplier.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {supplier.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {supplier.contactName && (
                <div>
                  <span className="text-gray-600">Contacto:</span>
                  <span className="ml-2 font-semibold">{supplier.contactName}</span>
                </div>
              )}
              {supplier.email && (
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="ml-2">{supplier.phone}</span>
                </div>
              )}
              {supplier.paymentTerms && (
                <div>
                  <span className="text-gray-600">Términos:</span>
                  <span className="ml-2">{supplier.paymentTerms}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/purchases/orders/new?supplierId=${supplier.id}`);
                }}
                className="w-full btn-primary py-2 rounded-lg text-sm font-medium btn-touch"
              >
                Crear Orden de Compra
              </button>
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay proveedores</p>
          <button
            onClick={() => navigate('/suppliers/new')}
            className="mt-4 btn-primary px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Crear Primer Proveedor
          </button>
        </div>
      )}
    </div>
  );
};








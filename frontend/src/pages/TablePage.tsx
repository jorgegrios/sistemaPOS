/**
 * Table Page
 * Edit a single table
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tablesDomainService, Table } from '../domains/tables/service';
import { toast } from 'sonner';

export const TablePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ tableNumber: '', capacity: '4', status: 'available' });

  useEffect(() => {
    if (id) {
      loadTable();
    }
  }, [id]);

  const loadTable = async () => {
    try {
      setLoading(true);
      const data = await tablesDomainService.getTable(id!);
      setTable(data);
      setFormData({
        tableNumber: data.name,
        capacity: data.capacity.toString(),
        status: data.status
      });
    } catch (err) {
      toast.error('Error al cargar mesa');
      navigate('/tables');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      await tablesDomainService.updateTable(id, {
        name: formData.tableNumber,
        capacity: parseInt(formData.capacity),
        status: formData.status as any
      });
      toast.success('Mesa actualizada correctamente');
      navigate('/tables');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar mesa');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!table) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tables')}
          className="text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium btn-touch mb-4"
        >
          ← Volver a Mesas
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Editar Mesa</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Mesa *
            </label>
            <input
              type="text"
              required
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad (Personas) *
            </label>
            <input
              type="number"
              required
              min="1"
              max="20"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            />
            <p className="text-xs text-gray-500 mt-1">Número de personas que puede acomodar esta mesa</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Estado Actual
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'available' })}
                className={`px-4 py-3 rounded-lg text-sm font-bold transition duration-200 active:scale-95 btn-touch border-2 ${formData.status === 'available'
                  ? 'bg-green-100 text-green-700 border-green-400 shadow-md'
                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                  }`}
              >
                🟢 Libre
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'occupied' })}
                className={`px-4 py-3 rounded-lg text-sm font-bold transition duration-200 active:scale-95 btn-touch border-2 ${formData.status === 'occupied'
                  ? 'bg-red-100 text-red-700 border-red-400 shadow-md'
                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                  }`}
              >
                🔴 Ocupada
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'reserved' })}
                className={`px-4 py-3 rounded-lg text-sm font-bold transition duration-200 active:scale-95 btn-touch border-2 ${formData.status === 'reserved'
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-400 shadow-md'
                  : 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50'
                  }`}
              >
                🟡 Reservada
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'dirty' })}
                className={`px-4 py-3 rounded-lg text-sm font-bold transition duration-200 active:scale-95 btn-touch border-2 ${formData.status === 'dirty'
                  ? 'bg-orange-100 text-orange-700 border-orange-400 shadow-md'
                  : 'bg-white text-orange-700 border-orange-300 hover:bg-orange-50'
                  }`}
              >
                🟠 Necesita Limpieza
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'paid' })}
                className={`px-4 py-3 rounded-lg text-sm font-bold transition duration-200 active:scale-95 btn-touch border-2 ${formData.status === 'paid'
                  ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-md'
                  : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                  }`}
              >
                💰 Pagada
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/tables')}
            className="flex-1 btn-outline px-4 py-2 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary px-4 py-2 rounded-lg font-semibold btn-touch"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};


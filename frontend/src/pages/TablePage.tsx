/**
 * Table Page
 * Edit a single table
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tableService, Table } from '../services/table-service';
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
      const data = await tableService.getTable(id!);
      setTable(data);
      setFormData({
        tableNumber: data.tableNumber,
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
      await tableService.updateTable(id, {
        tableNumber: formData.tableNumber,
        capacity: parseInt(formData.capacity),
        status: formData.status
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            >
              <option value="available">Disponible</option>
              <option value="occupied">Ocupada</option>
            </select>
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


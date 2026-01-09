/**
 * Tables Page
 * Manage dining tables
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { tableService, Table } from '../services/table-service';
import { toast } from 'sonner';

export const TablesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ tableNumber: '', capacity: '4' });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await tableService.getTables();
      setTables(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar mesas';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tableNumber || !formData.capacity) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await tableService.createTable(formData.tableNumber, parseInt(formData.capacity));
      toast.success('Mesa creada correctamente');
      setShowCreateModal(false);
      setFormData({ tableNumber: '', capacity: '4' });
      loadTables();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear mesa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa?')) {
      return;
    }

    try {
      await tableService.deleteTable(id);
      toast.success('Mesa eliminada correctamente');
      loadTables();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar mesa');
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">Solo administradores y gerentes pueden gestionar mesas</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Gestionar Mesas</h1>
          <p className="text-gray-600 text-sm sm:text-base">Administra las mesas del restaurante</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition duration-200 active:scale-95 btn-touch-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mt-4 sm:mt-0"
        >
          <span className="text-xl sm:text-2xl">➕</span>
          <span>Nueva Mesa</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tables Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Cargando mesas...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">🪑</div>
          <p className="text-gray-500 text-lg mb-2 font-semibold">No hay mesas creadas</p>
          <p className="text-gray-400 text-sm mb-4">Crea tu primera mesa para comenzar</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Crear Primera Mesa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {tables.map(table => (
            <div
              key={table.id}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-200 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    Mesa {table.tableNumber}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm">👥 Capacidad:</span>
                      <span className="font-semibold text-gray-800">{table.capacity} personas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm">Estado:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          table.status === 'available'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {table.status === 'available' ? 'Disponible' : 'Ocupada'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/tables/${table.id}`)}
                  className="flex-1 btn-outline px-4 py-2 rounded-lg font-semibold text-sm transition duration-200 active:scale-95 btn-touch"
                >
                  Editar
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="btn-danger px-4 py-2 rounded-lg font-semibold text-sm transition duration-200 active:scale-95 btn-touch"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Nueva Mesa</h2>
            <form onSubmit={handleCreate}>
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
                    placeholder="Ej: T1, MESA-1, etc."
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
                    placeholder="4"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número de personas que puede acomodar esta mesa</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ tableNumber: '', capacity: '4' });
                  }}
                  className="flex-1 btn-outline px-4 py-2 rounded-lg font-semibold btn-touch"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary px-4 py-2 rounded-lg font-semibold btn-touch"
                >
                  Crear Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



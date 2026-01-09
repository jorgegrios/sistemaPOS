/**
 * Create User Page
 * Create new user (admin only)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { userService } from '../services/user-service';

export const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'waiter' as 'admin' | 'manager' | 'cashier' | 'waiter',
    phone: '',
    permissions: {} as Record<string, boolean>
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">Solo administradores pueden crear usuarios</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Email, contraseña y nombre son requeridos');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setCreating(true);
      await userService.createUser(formData);
      toast.success('Usuario creado correctamente');
      navigate('/users');
    } catch (error: any) {
      toast.error(error.message || 'Error creating user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/users')}
          className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
        >
          ← Volver
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Nuevo Usuario</h1>
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
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="usuario@restaurant.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="waiter">Mesero</option>
                <option value="cashier">Cajero</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
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
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permisos Personalizados
            </label>
            <div className="space-y-2">
              {[
                { key: 'canCreateOrders', label: 'Crear Órdenes' },
                { key: 'canProcessPayments', label: 'Procesar Pagos' },
                { key: 'canViewReports', label: 'Ver Reportes' },
                { key: 'canManageInventory', label: 'Gestionar Inventario' },
                { key: 'canManageSuppliers', label: 'Gestionar Proveedores' }
              ].map((perm) => (
                <label key={perm.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.permissions[perm.key] || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: {
                        ...formData.permissions,
                        [perm.key]: e.target.checked
                      }
                    })}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-700">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={creating}
            className="btn-primary px-6 py-3 rounded-lg font-semibold btn-touch flex-1"
          >
            {creating ? 'Creando...' : 'Crear Usuario'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="btn-danger px-6 py-3 rounded-lg font-semibold btn-touch"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};



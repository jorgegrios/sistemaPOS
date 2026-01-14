/**
 * User Detail Page
 * View and edit user details
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { userService, UserListItem } from '../services/user-service';

export const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<UserListItem>>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await userService.getUser(id!);
      setUser(data);
      setFormData(data);
    } catch (error) {
      toast.error('Error loading user');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = currentUser?.role === 'admin' || 
                  (currentUser?.role === 'manager' && user?.role !== 'admin' && user?.role !== 'manager') ||
                  currentUser?.id === id;

  const handleSave = async () => {
    if (!id) return;

    try {
      await userService.updateUser(id, formData);
      toast.success('Usuario actualizado');
      setEditing(false);
      loadUser();
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  const handleChangePassword = async () => {
    if (!id) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await userService.changePassword(id, {
        currentPassword: currentUser?.id === id ? passwordData.currentPassword : undefined,
        newPassword: passwordData.newPassword
      });
      toast.success('Contraseña actualizada');
      setChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Error changing password');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      cashier: 'Cajero',
      waiter: 'Mesero'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/users')}
          className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
        >
          ← Volver
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
          {canEdit && (
            <button
              onClick={() => setEditing(!editing)}
              className="btn-primary px-4 py-2 rounded-lg btn-touch"
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
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
              <p className="text-gray-800">{user.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-800">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            {editing && (currentUser?.role === 'admin') ? (
              <select
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="waiter">Mesero</option>
                <option value="cashier">Cajero</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
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
              <p className="text-gray-800">{user.phone || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            {editing && (currentUser?.role === 'admin' || currentUser?.role === 'manager') ? (
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
                user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.active ? 'Activo' : 'Inactivo'}
              </span>
            )}
          </div>

          {user.lastLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Último Acceso</label>
              <p className="text-gray-800">
                {new Date(user.lastLogin).toLocaleString('es-ES')}
              </p>
            </div>
          )}
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
                setFormData(user);
              }}
              className="btn-danger px-6 py-2 rounded-lg btn-touch"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      {canEdit && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Cambiar Contraseña</h2>
            <button
              onClick={() => setChangingPassword(!changingPassword)}
              className="btn-primary px-4 py-2 rounded-lg btn-touch text-sm"
            >
              {changingPassword ? 'Cancelar' : 'Cambiar Contraseña'}
            </button>
          </div>

          {changingPassword && (
            <div className="space-y-4">
              {currentUser?.id === id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual *
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required={currentUser?.id === id}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="btn-success px-6 py-2 rounded-lg btn-touch"
              >
                Actualizar Contraseña
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};








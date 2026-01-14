/**
 * Users Page
 * List and manage users
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { userService, UserListItem } from '../services/user-service';

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadUsers();
    }
  }, [user, filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers({
        active: filter === 'all' ? undefined : filter === 'active'
      });
      setUsers(data);
    } catch (error) {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
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

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">No tienes permisos para ver esta página</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Usuarios</h1>
          <p className="text-gray-600">Gestiona usuarios del sistema</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/users/new')}
            className="btn-primary px-4 py-3 rounded-lg font-semibold btn-touch flex items-center gap-2"
          >
            <span>➕</span>
            <span>Nuevo Usuario</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } btn-touch`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } btn-touch`}
        >
          Activos
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'inactive' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } btn-touch`}
        >
          Inactivos
        </button>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((userItem) => (
          <div
            key={userItem.id}
            className="bg-white rounded-lg shadow-md border-2 p-4 hover:shadow-lg transition cursor-pointer btn-touch"
            onClick={() => navigate(`/users/${userItem.id}`)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{userItem.name}</h3>
                <p className="text-sm text-gray-600">{userItem.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(userItem.role)}`}>
                {getRoleLabel(userItem.role)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {userItem.phone && (
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="ml-2">{userItem.phone}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className={`ml-2 font-semibold ${userItem.active ? 'text-green-600' : 'text-red-600'}`}>
                  {userItem.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {userItem.lastLogin && (
                <div>
                  <span className="text-gray-600">Último acceso:</span>
                  <span className="ml-2 text-xs">
                    {new Date(userItem.lastLogin).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/users/${userItem.id}`);
                }}
                className="w-full btn-success py-2 rounded-lg text-sm font-medium btn-touch"
              >
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay usuarios</p>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/users/new')}
              className="mt-4 btn-primary px-6 py-3 rounded-lg font-semibold btn-touch"
            >
              Crear Primer Usuario
            </button>
          )}
        </div>
      )}
    </div>
  );
};









/**
 * App Layout
 * Main layout with header and sidebar navigation
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  

  // Para waiters, solo mostrar Orders
  // Para cashiers, no mostrar nada (tienen vista especial)
  const navItems: NavItem[] = user?.role === 'waiter' 
    ? [
        { label: 'Orders', path: '/orders', icon: '📦' }
      ]
    : user?.role === 'cashier'
    ? [] // Cashiers no ven menú lateral
    : [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' },
        { label: 'Orders', path: '/orders', icon: '📦' },
        { label: 'Gestionar Menú', path: '/menu/manage', icon: '✏️' },
        { label: 'Payments', path: '/payments', icon: '💳' },
        { label: 'Inventario', path: '/inventory', icon: '📦' },
        { label: 'Compras', path: '/purchases/orders', icon: '🛒' },
        ...(user?.role === 'admin' || user?.role === 'manager' ? [
          { label: 'Mesas', path: '/tables', icon: '🪑' },
          { label: 'Usuarios', path: '/users', icon: '👥' },
          { label: 'Costos de Platos', path: '/menu-costs', icon: '💰' }
        ] : []),
        ...(user?.role === 'admin' ? [
          { label: 'Settings', path: '/settings', icon: '⚙️' }
        ] : [])
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Para cashiers, layout sin sidebar
  if (user?.role === 'cashier') {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-40 w-64 h-screen bg-white shadow-lg transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">POS</h1>
          <p className="text-xs text-gray-500 mt-1">Point of Sale</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-4 rounded-lg hover:bg-blue-50 active:bg-blue-100 text-gray-700 hover:text-blue-600 transition duration-150 flex items-center gap-3 btn-touch"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium text-base">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info with Date and Time */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          {/* Date and Time */}
          <div className="mb-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-blue-200">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">
                {currentTime.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-base sm:text-lg text-gray-800 font-bold">
                {currentTime.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="mb-3">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-lg transition duration-150 font-medium btn-touch"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
        {/* Mobile Menu Button - Floating */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white btn-touch shadow-xl border-2 border-white/30"
          aria-label="Toggle menu"
        >
          <span className="text-2xl">{sidebarOpen ? '✕' : '☰'}</span>
        </button>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

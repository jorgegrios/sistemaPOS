/**
 * App Layout
 * Main layout with header and sidebar navigation
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useOrientation } from '../hooks/useOrientation';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const orientation = useOrientation();
  
  // Detectar si es tablet (ancho entre 768px y 1024px)
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1024;
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detectar si estamos en Dashboard
  const isDashboard = location.pathname === '/dashboard';
  
  // Para waiters, solo mostrar Orders
  // Para cashiers, no mostrar nada (tienen vista especial)
  // Para kitchen, no mostrar Dashboard, Orders ni Payments
  // Para bartender, solo mostrar Inventario y Compras
  const userRole = user?.role;
  
  const navItems: NavItem[] = userRole === 'waiter' 
    ? [
        { label: 'Orders', path: '/orders', icon: '📦' }
      ]
    : userRole === 'cashier'
    ? [] // Cashiers no ven menú lateral
    : userRole === 'bartender'
    ? [
        // Bartender solo ve: Inventario y Compras
        { label: 'Inventario', path: '/inventory', icon: '📦' },
        { label: 'Compras', path: '/purchases/orders', icon: '🛒' }
      ]
    : userRole === 'kitchen'
    ? [
        // Kitchen solo ve: Menú, Inventario, Compras (sin Dashboard, Orders, Payments)
        { label: 'Menú', path: '/menu/manage', icon: '✏️' },
        { label: 'Inventario', path: '/inventory', icon: '📦' },
        { label: 'Compras', path: '/purchases/orders', icon: '🛒' },
        ...(userRole === 'admin' || userRole === 'manager' ? [
          { label: 'Mesas', path: '/tables', icon: '🪑' },
          { label: 'Usuarios', path: '/users', icon: '👥' },
          { label: 'Costos', path: '/menu-costs', icon: '💰' }
        ] : []),
        ...(userRole === 'admin' ? [
          { label: 'Settings', path: '/settings', icon: '⚙️' }
        ] : [])
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' },
        { label: 'Orders', path: '/orders', icon: '📦' },
        { label: 'Menú', path: '/menu/manage', icon: '✏️' },
        { label: 'Payments', path: '/payments', icon: '💳' },
        { label: 'Inventario', path: '/inventory', icon: '📦' },
        { label: 'Compras', path: '/purchases/orders', icon: '🛒' },
        ...(userRole === 'admin' || userRole === 'manager' ? [
          { label: 'Mesas', path: '/tables', icon: '🪑' },
          { label: 'Usuarios', path: '/users', icon: '👥' },
          { label: 'Costos', path: '/menu-costs', icon: '💰' }
        ] : []),
        ...(userRole === 'admin' ? [
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

  // Si es Dashboard, mantener el sidebar original
  if (isDashboard) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar para Dashboard */}
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
                className={`w-full text-left px-4 py-4 rounded-lg hover:bg-blue-50 active:bg-blue-100 text-gray-700 hover:text-blue-600 transition duration-150 flex items-center gap-3 btn-touch ${
                  location.pathname === item.path ? 'bg-blue-100 text-blue-600' : ''
                }`}
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
        <div className={`flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen ${
          isTablet ? 'tablet-layout' : ''
        } ${orientation.isLandscape ? 'landscape-mode' : 'portrait-mode'}`}>
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
  }

  // Para todas las demás páginas, mostrar header horizontal compacto
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Horizontal Compacto */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="px-3 py-2 sm:px-4 sm:py-2">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Logo Compacto */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                POS
              </h1>
            </div>

            {/* Navegación Horizontal - Scrollable */}
            <nav className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide px-1 sm:px-2 min-w-0">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-all duration-150 min-h-[36px] sm:min-h-[40px] flex-shrink-0 active:scale-95 ${
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md font-semibold'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-blue-600 active:bg-gray-300'
                  }`}
                >
                  <span className="text-base sm:text-lg">{item.icon}</span>
                  <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Información de Usuario y Fecha/Hora - Compacto */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Fecha y Hora - Solo hora en móvil */}
              <div className="flex flex-col items-end text-right">
                <p className="hidden sm:block text-xs text-gray-600 font-semibold">
                  {currentTime.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short'
                  })}
                </p>
                <p className="text-xs sm:text-sm text-gray-800 font-bold">
                  {currentTime.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Info Usuario - Solo en desktop */}
              <div className="hidden lg:flex flex-col items-end text-right border-r border-gray-300 pr-2">
                <p className="text-xs text-gray-500 truncate max-w-[100px]">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>

              {/* Botón Logout Compacto */}
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-lg transition duration-150 font-medium text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] whitespace-nowrap flex items-center gap-1.5 sm:gap-2 active:scale-95"
              >
                <span className="text-base sm:text-lg">🚪</span>
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Sin sidebar, todo el ancho */}
      <main className={`flex-1 overflow-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 ${
        isTablet ? 'tablet-layout' : ''
      } ${orientation.isLandscape ? 'landscape-mode' : 'portrait-mode'}`}>
        <Outlet />
      </main>
    </div>
  );
};

/**
 * App Layout
 * Main layout with header and sidebar navigation
 */

import React, { useState } from 'react';
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

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Orders', path: '/orders', icon: '📦' },
    { label: 'Menu', path: '/menu', icon: '🍽️' },
    { label: 'Payments', path: '/payments', icon: '💳' },
    ...(user?.role === 'admin' ? [
      { label: 'Settings', path: '/settings', icon: '⚙️' }
    ] : [])
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition duration-150 flex items-center gap-3"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-3">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition duration-150 font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>

          <div className="flex-1"></div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </header>

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

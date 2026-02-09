/**
 * Login Page
 * User authentication page with email/password form
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useTranslation } from 'react-i18next';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState('mesero1@restaurant.com');
  const [password, setPassword] = useState('mesero123');
  const [companySlug, setCompanySlug] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password, companySlug);
      navigate('/app');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('login.error');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4 relative">
      {/* Floating Language Switcher */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm border border-white/20 transition font-bold flex items-center gap-2"
        >
          🌐 {i18n.language === 'es' ? 'English' : 'Español'}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Sistema POS</h1>
          <p className="text-blue-100">{t('login.title')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('login.subtitle')}</h2>

          {/* Error Messages */}
          {(error || authError) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error || authError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Slug Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company ID (Slug)
              </label>
              <input
                type="text"
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="default"
                required
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder={t('login.email')}
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder={t('login.password')}
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span> {t('login.logging_in')}
                </span>
              ) : (
                t('login.button')
              )}
            </button>
          </form>


          {/* Test Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 font-semibold mb-2">Credenciales de Prueba (Company: default):</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Mesero:</strong> mesero1@restaurant.com / mesero123</p>
              <p><strong>Cajero:</strong> cajero@restaurant.com / cajero123</p>
              <p><strong>Cocina:</strong> cocinero@restaurant.com / cocinero123</p>
              <p><strong>Bar:</strong> bartender@restaurant.com / bartender123</p>
              <p><strong>Gerente:</strong> gerente@restaurant.com / gerente123</p>
              <p><strong>Admin:</strong> admin@restaurant.com / admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          Sistema POS v1.0.0 • Backend API Running
        </p>
      </div>
    </div>
  );
};

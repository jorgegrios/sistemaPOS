/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User } from '../services/auth-service';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import { InactivityWarningModal } from '../components/InactivityWarningModal';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, companySlug: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(20); // Default 20 minutes

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const result = await authService.verifyToken();
          if (result.valid && result.user) {
            setUser(result.user);
          } else {
            authService.logout();
          }
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Update session timeout when user logs in
  useEffect(() => {
    if (user) {
      const timeout = authService.getSessionTimeout();
      setSessionTimeout(timeout);
      console.log(`[Auth] Session timeout set to ${timeout} minutes from company settings`);
    }
  }, [user]);

  const login = async (email: string, password: string, companySlug: string) => {
    try {
      setError(null);
      const response = await authService.login({ email, password, companySlug });
      setUser(response.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Inactivity timeout - use dynamic value from company settings
  const { resetTimer } = useInactivityTimeout({
    timeoutMinutes: sessionTimeout, // DYNAMIC from company settings
    warningSeconds: 30,
    onWarning: () => {
      console.log('[Auth] Inactivity warning triggered');
      setShowWarning(true);
    },
    onTimeout: async () => {
      console.log('[Auth] Auto-logout due to inactivity');
      setShowWarning(false);
      await logout();
      window.location.href = '/login';
    }
  });

  const handleStayLoggedIn = () => {
    console.log('[Auth] User chose to stay logged in');
    setShowWarning(false);
    resetTimer();
  };

  const handleLogoutFromWarning = async () => {
    console.log('[Auth] User chose to logout from warning');
    setShowWarning(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
      {user && (
        <InactivityWarningModal
          isOpen={showWarning}
          secondsRemaining={30}
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={handleLogoutFromWarning}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

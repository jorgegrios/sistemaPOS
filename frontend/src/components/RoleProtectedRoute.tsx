/**
 * Role Protected Route
 * Ensures only users with specific roles can access certain routes
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  blockedRoles?: string[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  blockedRoles = ['waiter']
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is blocked
  if (blockedRoles.includes(user.role)) {
    // Cashiers go to cashier page, others to orders
    if (user.role === 'cashier') {
      return <Navigate to="/cashier" replace />;
    }
    return <Navigate to="/orders" replace />;
  }

  // Check if user role is allowed (if specified)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/orders" replace />;
  }

  return <>{children}</>;
};


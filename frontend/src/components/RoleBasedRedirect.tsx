/**
 * Role Based Redirect
 * Redirects users to appropriate page based on their role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

export const RoleBasedRedirect: React.FC = () => {
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

  // Redirect based on role
  if ((user.role as string) === 'cashier') {
    return <Navigate to="/cashier" replace />;
  } else if ((user.role as string) === 'kitchen') {
    return <Navigate to="/kitchen" replace />;
  } else if ((user.role as string) === 'bartender') {
    return <Navigate to="/bar" replace />;
  } else if (user.role === 'waiter') {
    return <Navigate to="/orders/new" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};




import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, 
  redirectTo = '/dashboard' 
}) => {
  const { session } = useStore();
  const isAuthenticated = !!session.email;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && session.role && !allowedRoles.includes(session.role)) {
    // If not authorized, redirect to dashboard or specified path
    console.warn(`Access denied for role: ${session.role}. Required roles: ${allowedRoles.join(', ')}`);
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

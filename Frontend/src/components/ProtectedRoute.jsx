import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

/**
 * ProtectedRoute
 * Redirects to /login if the user is not authenticated.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) return null; // App.js shows full-screen loader

  return user
    ? children
    : <Navigate to="/login" replace />;
}

/**
 * RoleRoute
 * Redirects to the correct dashboard if the user has the wrong role.
 * Accepts role="student" or role="teacher" (admin also passes teacher check).
 */
export function RoleRoute({ children, role }) {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  const allowed =
    role === 'teacher'
      ? ['teacher', 'admin'].includes(user.role)
      : user.role === role;

  if (!allowed) {
    const redirect = user.role === 'student'
      ? '/student/dashboard'
      : '/teacher/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return children;
}

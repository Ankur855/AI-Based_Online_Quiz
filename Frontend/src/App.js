import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import useAuthStore from './context/authStore';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';

import LoginPage        from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TakeQuiz         from './pages/TakeQuiz';

export default function App() {
  const { init, user, loading } = useAuthStore();

  // Restore session from localStorage on first load
  useEffect(() => {
    init();
  }, []);

  // Show nothing while checking auth token
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading AdaptIQ...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Toast notifications — top-right, 3 s duration */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'inherit',
            fontSize: '14px',
            borderRadius: '10px',
          },
        }}
      />

      <Routes>
        {/* ── Public ───────────────────────────────────── */}
        <Route
          path="/login"
          element={
            user
              ? <Navigate to={user.role === 'student' ? '/student/dashboard' : '/teacher/dashboard'} replace />
              : <LoginPage />
          }
        />

        {/* ── Student ──────────────────────────────────── */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute role="student">
                <StudentDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz/:quizId"
          element={
            <ProtectedRoute>
              <TakeQuiz />
            </ProtectedRoute>
          }
        />

        {/* ── Teacher ──────────────────────────────────── */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute role="teacher">
                <TeacherDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ── Fallback ─────────────────────────────────── */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

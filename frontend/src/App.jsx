import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> :
            user.role === 'agent' ? <Navigate to="/agent" replace /> :
            <Navigate to="/dashboard" replace />
          ) : <LoginPage />
        }
      />

      {/* Customer */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-ticket"
        element={
          <ProtectedRoute roles={['customer']}>
            <CreateTicket />
          </ProtectedRoute>
        }
      />

      {/* Agent */}
      <Route
        path="/agent"
        element={
          <ProtectedRoute roles={['agent']}>
            <AgentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* Ticket Detail — accessible by all roles */}
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

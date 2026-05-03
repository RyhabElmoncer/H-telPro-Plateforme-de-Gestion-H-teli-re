import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import BookingPage from './pages/client/BookingPage';
import PaymentPage from './pages/client/PaymentPage';
import MyReservationsPage from './pages/client/MyReservationsPage';
import ProfilePage from './pages/client/ProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRooms from './pages/admin/AdminRooms';
import AdminReservations from './pages/admin/AdminReservations';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import AdminNotifications from './pages/admin/AdminNotifications';

import Layout from './components/shared/Layout';
import AdminLayout from './components/admin/AdminLayout';
import './index.css';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (user) {
    if (user.role === 'admin' || user.role === 'receptionist') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/rooms" element={<Layout><RoomsPage /></Layout>} />
      <Route path="/rooms/:id" element={<Layout><RoomDetailPage /></Layout>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Client routes */}
      <Route path="/book/:roomId" element={<ProtectedRoute roles={['client']}><Layout><BookingPage /></Layout></ProtectedRoute>} />
      <Route path="/payment/:reservationId" element={<ProtectedRoute roles={['client']}><Layout><PaymentPage /></Layout></ProtectedRoute>} />
      <Route path="/my-reservations" element={<ProtectedRoute roles={['client']}><Layout><MyReservationsPage /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute roles={['client', 'admin', 'receptionist']}><Layout><ProfilePage /></Layout></ProtectedRoute>} />

      {/* Admin / Receptionist routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin', 'receptionist']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/rooms" element={<ProtectedRoute roles={['admin', 'receptionist']}><AdminLayout><AdminRooms /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/reservations" element={<ProtectedRoute roles={['admin', 'receptionist']}><AdminLayout><AdminReservations /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute roles={['admin', 'receptionist']}><AdminLayout><AdminPayments /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminNotifications /></AdminLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

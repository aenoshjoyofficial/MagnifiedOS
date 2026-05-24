import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Providers from './components/Providers';
import AuthGuard from './components/Auth/AuthGuard';
import LayoutWrapper from './components/Layout/LayoutWrapper';

// Pages
import LoginPage from './app/login/page';
import SignupPage from './app/signup/page';
import ForgotPasswordPage from './app/forgot-password/page';
import ResetPasswordPage from './app/reset-password/page';
import DashboardPage from './app/admin/page';
import UsersPage from './app/admin/users/page';
import UserDetailPage from './app/admin/users/[id]/page';
import ProgramBuilderPage from './app/admin/program-builder/page';
import SessionManagerPage from './app/admin/sessions/page';
import BookingsPage from './app/admin/bookings/page';
import ChamberPlaceholderPage from './app/admin/chambers/page';

const App = () => {
  return (
    <Providers>
      <LayoutWrapper>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route path="/" element={<AuthGuard><Navigate to="/admin" replace /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/admin/users" element={<AuthGuard><UsersPage /></AuthGuard>} />
          <Route path="/admin/users/:id" element={<AuthGuard><UserDetailPage /></AuthGuard>} />
          <Route path="/admin/program-builder" element={<AuthGuard><ProgramBuilderPage /></AuthGuard>} />
          <Route path="/admin/sessions" element={<AuthGuard><SessionManagerPage /></AuthGuard>} />
          <Route path="/admin/bookings" element={<AuthGuard><BookingsPage /></AuthGuard>} />
          <Route path="/admin/chambers/:chamberId" element={<AuthGuard><ChamberPlaceholderPage /></AuthGuard>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </LayoutWrapper>
    </Providers>
  );
};

export default App;

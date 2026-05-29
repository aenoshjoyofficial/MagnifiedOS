import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Providers from './components/Providers';
import AuthGuard from './components/Auth/AuthGuard';
import LayoutWrapper from './components/Layout/LayoutWrapper';

// Pages
import LoginPage from './app/login/page';
import ForgotPasswordPage from './app/forgot-password/page';
import ResetPasswordPage from './app/reset-password/page';
import DashboardPage from './app/dashboard/page';
import MyProgramPage from './app/program/page';
import TodayPracticePage from './app/today/page';
import ProgressPage from './app/progress/page';
import SessionsPage from './app/sessions/page';
import ProfilePage from './app/profile/page';
import CommunityPage from './app/community/page';
import SettingsPage from './app/settings/page';

const App = () => {
  return (
    <Providers>
      <LayoutWrapper>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route path="/" element={<AuthGuard><Navigate to="/dashboard" replace /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/program" element={<AuthGuard><MyProgramPage /></AuthGuard>} />
          <Route path="/today" element={<AuthGuard><TodayPracticePage /></AuthGuard>} />
          <Route path="/progress" element={<AuthGuard><ProgressPage /></AuthGuard>} />
          <Route path="/sessions" element={<AuthGuard><SessionsPage /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
          <Route path="/community" element={<AuthGuard><CommunityPage /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />

          {/* Catch all - Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </LayoutWrapper>
    </Providers>
  );
};

export default App;

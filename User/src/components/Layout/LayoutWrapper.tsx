import React, { useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUIStore } from '@/store/useStore';
import { useLocation } from 'react-router-dom';
import { DashboardTour } from '../Onboarding/DashboardTour';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const pathname = location.pathname;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile, setSidebarOpen]);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0B0F' }}>
      <DashboardTour />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Topbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default LayoutWrapper;

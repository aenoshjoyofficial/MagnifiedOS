import React, { useEffect } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useAuthStore } from '@/store/useStore';
import { ShieldAlert } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, []); // Initialize once on mount

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0F' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  // Allow access to public routes
  const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Redirect to login ONLY if loading is finished and no user exists
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user exists but profile doesn't (and we aren't loading), we should probably wait or try to fetch
  if (!profile) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0F' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  // Redirect to login if user is not an admin
  if (profile.role !== 'admin') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0F', p: 3, textAlign: 'center' }}>
        <ShieldAlert size={64} color="#f44336" style={{ marginBottom: 24 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Access Denied</Typography>
        <Typography sx={{ color: '#B0B0B0', mb: 4 }}>You do not have administrative privileges to access this area.</Typography>
        <Button variant="contained" component={Link} to="/login" sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F' }}>Back to Login</Button>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;

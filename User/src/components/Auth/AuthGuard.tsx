import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Stack } from '@mui/material';
import { useAuthStore } from '@/store/useStore';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading, initialize, signOut } = useAuthStore();
  const location = useLocation();

  // Track whether the profile load has timed out
  const [profileTimedOut, setProfileTimedOut] = useState(false);

  useEffect(() => {
    initialize();
  }, []); // Only initialize once on mount

  // Start a 10-second timeout when loading finishes but profile is still missing
  useEffect(() => {
    if (!loading && user && !profile) {
      setProfileTimedOut(false); // Reset on each attempt
      const timer = setTimeout(() => setProfileTimedOut(true), 10000);
      return () => clearTimeout(timer);
    }
    // Profile loaded successfully — clear any timeout state
    if (profile) setProfileTimedOut(false);
  }, [loading, user, profile]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0F' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  // Allow access to public routes
  const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];
  if (PUBLIC_ROUTES.includes(location.pathname)) {
    return <>{children}</>;
  }

  // Redirect to login ONLY if loading is finished and no user exists
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user exists but profile hasn't loaded — show spinner while waiting,
  // or an error card with recovery options after the timeout
  if (!profile) {
    if (!profileTimedOut) {
      // Still within the 10s window — show spinner
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0F' }}>
          <CircularProgress sx={{ color: '#D4AF37' }} />
        </Box>
      );
    }

    // Timed out — show a recoverable error state instead of being stuck forever
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B0B0F',
          p: 3
        }}
      >
        <Box
          sx={{
            maxWidth: 420,
            width: '100%',
            p: 4,
            borderRadius: '20px',
            backgroundColor: 'rgba(11, 59, 50, 0.4)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 212, 163, 0.2)',
            textAlign: 'center'
          }}
        >
          <ShieldAlert size={48} color="#D4AF37" style={{ marginBottom: 16 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1, fontFamily: '"Playfair Display", serif' }}
          >
            Profile Could Not Load
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#B0B0B0', mb: 4, lineHeight: 1.7 }}
          >
            We were unable to load your profile. This may be a temporary network issue.
            Please try again or sign out and log back in.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              startIcon={<RefreshCw size={16} />}
              onClick={() => {
                setProfileTimedOut(false);
                initialize();
              }}
              sx={{
                backgroundColor: '#D4AF37',
                color: '#0B0B0F',
                fontWeight: 800,
                py: 1.5,
                borderRadius: '10px',
                '&:hover': { backgroundColor: '#B8962D' }
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              startIcon={<LogOut size={16} />}
              onClick={() => signOut()}
              sx={{
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#B0B0B0',
                py: 1.5,
                borderRadius: '10px',
                '&:hover': { borderColor: '#D4AF37', color: '#D4AF37' }
              }}
            >
              Sign Out
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  // Redirect to login if user is not a member (admins are also allowed)
  if (profile.role !== 'member' && profile.role !== 'admin') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0F', p: 3, textAlign: 'center' }}>
        <ShieldAlert size={64} color="#f44336" style={{ marginBottom: 24 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Access Denied</Typography>
        <Typography sx={{ color: '#B0B0B0', mb: 4 }}>You must be a registered member to access this OS.</Typography>
        <Button variant="contained" component={Link} to="/login" sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F' }}>Back to Login</Button>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;

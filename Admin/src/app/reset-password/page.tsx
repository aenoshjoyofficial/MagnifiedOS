'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stack, 
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setMounted(true);
    const checkStatus = async () => {
      // 1. Check for errors in the URL hash
      const hash = window.location.hash;
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const errorMsg = params.get('error_description') || params.get('error') || 'Invalid recovery link.';
        setError(decodeURIComponent(errorMsg).replace(/\+/g, ' '));
        return;
      }

      // 2. Check user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!hash.includes('access_token')) {
          navigate('/login');
        }
      }
    };
    checkStatus();
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update administrative password.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1a1a2e 0%, #0B0B0F 100%)',
        p: 3
      }}
    >
      <Paper 
        elevation={24}
        sx={{ 
          p: 5, 
          width: '100%', 
          maxWidth: 450, 
          borderRadius: 4,
          backgroundColor: 'rgba(18, 18, 23, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ShieldCheck size={40} color="#D4AF37" />
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 900, 
              color: '#D4AF37', 
              letterSpacing: -1,
              mb: 1
            }}
          >
            UPDATE SECURITY
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            Set a new secure access protocol for your administrative account.
          </Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 4 }}>
            <Alert severity="error" sx={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5252', border: '1px solid rgba(211, 47, 47, 0.2)' }}>
              {error}
            </Alert>
            {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid')) && (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/forgot-password')}
                sx={{ 
                  mt: 2, 
                  borderColor: '#D4AF37', 
                  color: '#D4AF37',
                  '&:hover': { borderColor: '#B8962D', backgroundColor: 'rgba(212, 175, 55, 0.05)' }
                }}
              >
                Request New Recovery Link
              </Button>
            )}
          </Box>
        )}

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 4, backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#4caf50', border: '1px solid rgba(46, 125, 50, 0.2)' }}>
              Security protocol updated. Redirecting to command center...
            </Alert>
            <CircularProgress size={24} sx={{ color: '#D4AF37' }} />
          </Box>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} color="#666" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} color="#666" />
                      </InputAdornment>
                    ),
                  }
                }}
              />

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ 
                  py: 1.5,
                  backgroundColor: '#D4AF37', 
                  color: '#0B0B0F',
                  fontWeight: 800,
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#B8962D' },
                  '&.Mui-disabled': { backgroundColor: 'rgba(212, 175, 55, 0.2)' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Update'}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default AdminResetPassword;

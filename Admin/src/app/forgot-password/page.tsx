'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stack, 
  Link as MuiLink,
  InputAdornment,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch recovery link. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
            <KeyRound size={40} color="#D4AF37" />
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
            ADMIN RECOVERY
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            Enter your administrative email to request a secure reset link.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5252', border: '1px solid rgba(211, 47, 47, 0.2)' }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 4, backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#4caf50', border: '1px solid rgba(46, 125, 50, 0.2)' }}>
              Recovery link has been dispatched. Please check your inbox.
            </Alert>
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="outlined"
              startIcon={<ArrowLeft size={18} />}
              sx={{ 
                py: 1.5, 
                borderRadius: 2, 
                borderColor: 'rgba(212, 175, 55, 0.3)', 
                color: '#D4AF37',
                '&:hover': { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.05)' }
              }}
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleResetRequest}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={20} color="#666" />
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <MuiLink 
                  component={Link} 
                  to="/login" 
                  sx={{ 
                    color: '#666', 
                    fontSize: '0.875rem', 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    '&:hover': { color: '#D4AF37' }
                  }}
                >
                  <ArrowLeft size={16} />
                  Return to Login
                </MuiLink>
              </Box>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default AdminForgotPassword;

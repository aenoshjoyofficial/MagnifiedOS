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
  CircularProgress
} from '@mui/material';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const MemberForgotPassword = () => {
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
      setError(err.message || 'Failed to dispatch recovery link.');
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
        sx={{ 
          p: 5, 
          width: '100%', 
          maxWidth: 420, 
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <KeyRound size={40} color="#D4AF37" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#D4AF37', letterSpacing: -1, mb: 1 }}>
            RECOVERY
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            Enter your member email to request a reset link.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5252' }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 4, backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#4caf50' }}>
              Check your inbox for the recovery link.
            </Alert>
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="outlined"
              startIcon={<ArrowLeft size={18} />}
              sx={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleResetRequest}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Member Email"
                variant="filled"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Mail size={20} color="#D4AF37" /></InputAdornment>,
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
                  '&:hover': { backgroundColor: '#B8962D' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'SEND RECOVERY LINK'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <MuiLink 
                  component={Link} 
                  to="/login" 
                  sx={{ color: '#666', fontSize: '0.875rem', textDecoration: 'none', '&:hover': { color: '#D4AF37' } }}
                >
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

export default MemberForgotPassword;

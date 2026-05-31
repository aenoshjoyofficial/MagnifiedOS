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
        background: 'radial-gradient(circle at center, #041C16 0%, #040D0C 100%)',
        p: 3
      }}
    >
      <Paper 
        sx={{ 
          p: 5, 
          width: '100%', 
          maxWidth: 420, 
          borderRadius: '24px',
          backgroundColor: 'rgba(7, 24, 21, 0.45)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0, 212, 163, 0.15)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <KeyRound size={40} color="#D4AF37" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#D4AF37', letterSpacing: -1, mb: 1, fontFamily: '"Playfair Display", serif' }}>
            RECOVERY
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Enter your member email to request a reset link.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5252', borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 4, backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', borderRadius: '12px', fontWeight: 700 }}>
              Check your inbox for the recovery link.
            </Alert>
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="outlined"
              startIcon={<ArrowLeft size={18} />}
              sx={{ borderColor: 'rgba(0, 212, 163, 0.3)', color: '#00D4A3', borderRadius: '30px' }}
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
                  background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
                  color: '#040D0C',
                  fontWeight: 800,
                  borderRadius: '30px',
                  boxShadow: '0 4px 15px rgba(0, 212, 163, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'SEND RECOVERY LINK'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <MuiLink 
                  component={Link} 
                  to="/login" 
                  sx={{ color: '#666', fontSize: '0.875rem', textDecoration: 'none', '&:hover': { color: '#00D4A3' } }}
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

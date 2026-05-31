import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton, 
  Alert,
  CircularProgress
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in as admin, redirect to dashboard
  if (user && !loading) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { data, error: authError } = await signIn(email, password);
      
      if (authError) throw authError;

      // Force a quick profile fetch to check role before redirecting
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single();

      if (profile?.role !== 'admin') {
        throw new Error('Access denied. This portal is restricted to administrators.');
      }

      // If we reach here, they are an admin
      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.message || 'Invalid administrative credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1a1a24 0%, #0b0b0f 100%)',
      p: 3
    }}>
      <Paper sx={{ 
        p: 5, 
        width: '100%', 
        maxWidth: 400, 
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(212, 175, 55, 0.1)',
        borderRadius: 4,
        textAlign: 'center'
      }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'inline-flex', 
            p: 2, 
            borderRadius: 3, 
            backgroundColor: 'rgba(212, 175, 55, 0.1)', 
            mb: 2 
          }}>
            <ShieldCheck size={40} color="#D4AF37" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -1, mb: 1 }}>
            ADMIN <span style={{ color: '#D4AF37' }}>OS</span>
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            Shribodhi Existence Administrative Portal
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336', textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Admin Email"
              variant="filled"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Mail size={18} color="#D4AF37" /></InputAdornment>
                }
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="filled"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Lock size={18} color="#D4AF37" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#666' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={isSubmitting}
              sx={{ 
                py: 2, 
                backgroundColor: '#D4AF37', 
                color: '#0B0B0F', 
                fontWeight: 800,
                fontSize: '1rem',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#B8962D' },
                '&.Mui-disabled': { backgroundColor: 'rgba(212, 175, 55, 0.2)' }
              }}
            >
              {isSubmitting ? <CircularProgress size={24} sx={{ color: '#0B0B0F' }} /> : 'ACCESS DASHBOARD'}
            </Button>
          </Stack>
        </form>

        <Typography variant="caption" sx={{ display: 'block', mt: 4, color: '#444', fontWeight: 600 }}>
          SECURE ENCRYPTED SESSION • SHRIBODHI EXISTENCE
        </Typography>
      </Paper>
    </Box>
  );
};

// Help MUI types by adding Stack which was missing in the code above but used
import { Stack } from '@mui/material';

export default AdminLogin;

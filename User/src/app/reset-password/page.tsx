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

const MemberResetPassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const checkStatus = async () => {
      const hash = window.location.hash;
      if (hash.includes('error=')) {
        setError('Invalid or expired recovery link.');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !hash.includes('access_token')) {
        navigate('/login');
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
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update member password.');
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
            <ShieldCheck size={40} color="#D4AF37" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#D4AF37', letterSpacing: -1, mb: 1 }}>
            NEW PASSWORD
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            Set your new secure access credentials.
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
              Security updated. Entering dashboard...
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
                variant="filled"
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Lock size={20} color="#D4AF37" /></InputAdornment>,
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
                variant="filled"
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Lock size={20} color="#D4AF37" /></InputAdornment>,
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'CONFIRM UPDATE'}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default MemberResetPassword;

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
  CircularProgress,
  Stack,
  Link
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff, User, ShieldPlus } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { useNavigate, Navigate, Link as RouterLink } from 'react-router-dom';

const AdminSignup = () => {
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuthStore();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect to dashboard
  if (user && !loading) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!fullName || !email || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: authError } = await signUp(email, password, fullName);
      
      if (authError) throw authError;

      setSuccess(true);
      // Note: Admin role will need to be granted via SQL or default trigger
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      setIsSubmitting(false);
    }
  };

  if (success) {
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
          maxWidth: 450, 
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
              backgroundColor: 'rgba(76, 175, 80, 0.1)', 
              mb: 2 
            }}>
              <Mail size={40} color="#4CAF50" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>Check your email</Typography>
            <Typography sx={{ color: '#B0B0B0' }}>
              We've sent a verification link to <strong>{email}</strong>. Please confirm your email to activate your administrative account.
            </Typography>
          </Box>
          <Button 
            component={RouterLink} 
            to="/login"
            fullWidth 
            variant="outlined"
            sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: '#B0B0B0' }}
          >
            Back to Login
          </Button>
        </Paper>
      </Box>
    );
  }

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
        maxWidth: 450, 
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
            <ShieldPlus size={40} color="#D4AF37" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -1, mb: 1 }}>
            ADMIN <span style={{ color: '#D4AF37' }}>ONBOARDING</span>
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            Create your administrative access credentials
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336', textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Full Name"
              variant="filled"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><User size={18} color="#D4AF37" /></InputAdornment>
                }
              }}
            />
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
                mt: 2,
                backgroundColor: '#D4AF37', 
                color: '#0B0B0F', 
                fontWeight: 800,
                fontSize: '1rem',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#B8962D' },
                '&.Mui-disabled': { backgroundColor: 'rgba(212, 175, 55, 0.2)' }
              }}
            >
              {isSubmitting ? <CircularProgress size={24} sx={{ color: '#0B0B0F' }} /> : 'CREATE ACCOUNT'}
            </Button>
          </Stack>
        </form>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Already have access? {' '}
            <Link component={RouterLink} to="/login" sx={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Login here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminSignup;

'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stack,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Bell, 
  Shield, 
  Eye, 
  Moon, 
  Database,
  Smartphone,
  Lock,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
const Settings = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const [success, setSuccess] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailUpdates: true,
    publicProfile: false,
    darkMode: true,
    biometricAuth: true
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSuccess(true);
  };

  return (
    <Box sx={{ maxWidth: 800, py: 1 }}>
      <Box sx={{ mb: 5 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            mb: 1, 
            fontFamily: '"Playfair Display", serif',
            letterSpacing: '0.01em',
            textShadow: '0 2px 10px rgba(0, 212, 163, 0.1)'
          }}
        >
          System Settings
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>Configure your experience and neural interface parameters.</Typography>
      </Box>

      <Stack spacing={4}>
        {/* Notifications */}
        <Paper sx={{ p: 0, overflow: 'hidden', backgroundColor: 'rgba(7, 24, 21, 0.35)', border: '1px solid rgba(0, 212, 163, 0.15)', borderRadius: '24px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <Box sx={{ p: 3, backgroundColor: 'rgba(0, 212, 163, 0.05)', borderBottom: '1px solid rgba(0, 212, 163, 0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.15rem' }}>
              <Bell size={20} color="#D4AF37" /> Notifications
            </Typography>
          </Box>
          <List sx={{ px: 2 }}>
            <ListItem sx={{ py: 2.25 }}>
              <ListItemText 
                primary="Push Notifications" 
                secondary="Receive real-time alerts for scheduled protocols and community events." 
              />
              <Switch 
                checked={settings.pushNotifications} 
                onChange={() => handleToggle('pushNotifications')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00D4A3' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00D4A3' } }}
              />
            </ListItem>
            <Divider sx={{ opacity: 0.05, backgroundColor: 'rgba(0, 212, 163, 0.15)' }} />
            <ListItem sx={{ py: 2.25 }}>
              <ListItemText 
                primary="Email Updates" 
                secondary="Weekly summaries of your neural growth and system updates." 
              />
              <Switch 
                checked={settings.emailUpdates} 
                onChange={() => handleToggle('emailUpdates')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00D4A3' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00D4A3' } }}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Security & Privacy */}
        <Paper sx={{ p: 0, overflow: 'hidden', backgroundColor: 'rgba(7, 24, 21, 0.35)', border: '1px solid rgba(0, 212, 163, 0.15)', borderRadius: '24px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <Box sx={{ p: 3, backgroundColor: 'rgba(0, 212, 163, 0.05)', borderBottom: '1px solid rgba(0, 212, 163, 0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.15rem' }}>
              <Shield size={20} color="#D4AF37" /> Security & Privacy
            </Typography>
          </Box>
          <List sx={{ px: 2 }}>
            <ListItem sx={{ py: 2.25 }}>
              <ListItemText 
                primary="Public Profile" 
                secondary="Allow other members in the collective to see your progress and identity." 
              />
              <Switch 
                checked={settings.publicProfile} 
                onChange={() => handleToggle('publicProfile')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00D4A3' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00D4A3' } }}
              />
            </ListItem>
            <Divider sx={{ opacity: 0.05, backgroundColor: 'rgba(0, 212, 163, 0.15)' }} />
            <ListItem sx={{ py: 2.25 }}>
              <ListItemText 
                primary="Biometric Authentication" 
                secondary="Use FaceID or TouchID to secure your session data." 
              />
              <Switch 
                checked={settings.biometricAuth} 
                onChange={() => handleToggle('biometricAuth')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00D4A3' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00D4A3' } }}
              />
            </ListItem>
            <Divider sx={{ opacity: 0.05, backgroundColor: 'rgba(0, 212, 163, 0.15)' }} />
            <ListItem 
              component={Button} 
              sx={{ py: 2.25, textAlign: 'left', width: '100%', color: '#D4AF37', textTransform: 'none', justifyContent: 'flex-start', borderTop: 'none', borderRadius: 0 }}
            >
              <ListItemIcon><Lock size={20} color="#D4AF37" /></ListItemIcon>
              <ListItemText primary="Change Master Password" />
            </ListItem>
          </List>
        </Paper>

        {/* Advanced Settings */}
        <Paper sx={{ p: 0, overflow: 'hidden', backgroundColor: 'rgba(7, 24, 21, 0.35)', border: '1px solid rgba(0, 212, 163, 0.15)', borderRadius: '24px', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <Box sx={{ p: 3, backgroundColor: 'rgba(0, 212, 163, 0.05)', borderBottom: '1px solid rgba(0, 212, 163, 0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.15rem' }}>
              <Database size={20} color="#D4AF37" /> Data & Storage
            </Typography>
          </Box>
          <List sx={{ px: 2 }}>
            <ListItem sx={{ py: 2.25 }}>
              <ListItemText 
                primary="Export Neural Data" 
                secondary="Download a complete archive of your journey metrics and task history." 
              />
              <Button variant="outlined" color="primary" size="small" sx={{ borderRadius: '20px', textTransform: 'none', px: 3 }}>Export</Button>
            </ListItem>
            <Divider sx={{ opacity: 0.05, backgroundColor: 'rgba(0, 212, 163, 0.15)' }} />
            <ListItem sx={{ py: 2.25 }}>
              <ListItemText 
                primary="Clear Session Cache" 
                secondary="Flush local data to resolve synchronization issues." 
              />
              <Button variant="outlined" size="small" color="error" sx={{ borderRadius: '20px', textTransform: 'none', px: 3 }}>Clear</Button>
            </ListItem>
          </List>
        </Paper>

        <Box sx={{ pt: 2, pb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            variant="contained" 
            onClick={handleSave}
            sx={{ 
              background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)', 
              color: '#040D0C', 
              fontWeight: 800, 
              px: 6, 
              py: 1.75,
              borderRadius: '30px',
              boxShadow: '0 4px 15px rgba(0, 212, 163, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
              }
            }}
          >
            Save Preferences
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleLogout}
            startIcon={<LogOut size={18} />}
            sx={{ px: 4, py: 1.75, borderRadius: '30px', textTransform: 'none', fontWeight: 700 }}
          >
            Sign Out of All Devices
          </Button>
        </Box>
      </Stack>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%', backgroundColor: '#D4AF37', color: '#040D0C', fontWeight: 800, borderRadius: '16px' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;

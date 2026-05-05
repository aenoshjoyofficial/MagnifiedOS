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

const Settings = () => {
  const [success, setSuccess] = useState(false);
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
    <Box sx={{ maxWidth: 800 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>System Settings</Typography>
        <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Configure your experience and neural interface parameters.</Typography>
      </Box>

      <Stack spacing={3}>
        {/* Notifications */}
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Bell size={20} color="#D4AF37" /> Notifications
            </Typography>
          </Box>
          <List sx={{ px: 2 }}>
            <ListItem sx={{ py: 2 }}>
              <ListItemText 
                primary="Push Notifications" 
                secondary="Receive real-time alerts for scheduled protocols and community events." 
              />
              <Switch 
                checked={settings.pushNotifications} 
                onChange={() => handleToggle('pushNotifications')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#D4AF37' } }}
              />
            </ListItem>
            <Divider sx={{ opacity: 0.05 }} />
            <ListItem sx={{ py: 2 }}>
              <ListItemText 
                primary="Email Updates" 
                secondary="Weekly summaries of your neural growth and system updates." 
              />
              <Switch 
                checked={settings.emailUpdates} 
                onChange={() => handleToggle('emailUpdates')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#D4AF37' } }}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Security & Privacy */}
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Shield size={20} color="#D4AF37" /> Security & Privacy
            </Typography>
          </Box>
          <List sx={{ px: 2 }}>
            <ListItem sx={{ py: 2 }}>
              <ListItemText 
                primary="Public Profile" 
                secondary="Allow other members in the collective to see your progress and identity." 
              />
              <Switch 
                checked={settings.publicProfile} 
                onChange={() => handleToggle('publicProfile')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#D4AF37' } }}
              />
            </ListItem>
            <Divider sx={{ opacity: 0.05 }} />
            <ListItem sx={{ py: 2 }}>
              <ListItemText 
                primary="Biometric Authentication" 
                secondary="Use FaceID or TouchID to secure your session data." 
              />
              <Switch 
                checked={settings.biometricAuth} 
                onChange={() => handleToggle('biometricAuth')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#D4AF37' } }}
              />
            </ListItem>
            <Divider sx={{ opacity: 0.05 }} />
            <ListItem 
              component={Button} 
              sx={{ py: 2, textAlign: 'left', width: '100%', color: '#D4AF37', textTransform: 'none', justifyContent: 'flex-start' }}
            >
              <ListItemIcon><Lock size={20} color="#D4AF37" /></ListItemIcon>
              <ListItemText primary="Change Master Password" />
            </ListItem>
          </List>
        </Paper>

        {/* Advanced Settings */}
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Database size={20} color="#D4AF37" /> Data & Storage
            </Typography>
          </Box>
          <List sx={{ px: 2 }}>
            <ListItem sx={{ py: 2 }}>
              <ListItemText 
                primary="Export Neural Data" 
                secondary="Download a complete archive of your journey metrics and task history." 
              />
              <Button variant="outlined" size="small">Export</Button>
            </ListItem>
            <Divider sx={{ opacity: 0.05 }} />
            <ListItem sx={{ py: 2 }}>
              <ListItemText 
                primary="Clear Session Cache" 
                secondary="Flush local data to resolve synchronization issues." 
              />
              <Button variant="outlined" size="small" color="error">Clear</Button>
            </ListItem>
          </List>
        </Paper>

        <Box sx={{ pt: 2, pb: 6, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="contained" 
            onClick={handleSave}
            sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F', fontWeight: 700, px: 6, py: 1.5 }}
          >
            Save Preferences
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<LogOut size={18} />}
            sx={{ px: 4 }}
          >
            Sign Out of All Devices
          </Button>
        </Box>
      </Stack>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%', backgroundColor: '#4CAF50', color: '#fff' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;

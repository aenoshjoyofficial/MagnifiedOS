'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Stack,
  Avatar,
  Button,
  TextField,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  CreditCard,
  Save
} from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { useMyProfile, useUpdateProfile } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

const Profile = () => {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = React.useState<string | null>(user?.id || null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    const findUserId = async () => {
      if (user?.id) {
        setTargetUserId(user.id);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'aenoshjoy@gmail.com')
        .single();
      if (data) setTargetUserId(data.id);
    };
    findUserId();
  }, [user]);

  const { data: profile, isLoading } = useMyProfile(targetUserId || '');
  const updateProfileMutation = useUpdateProfile();

  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!targetUserId) return;
    try {
      await updateProfileMutation.mutateAsync({
        userId: targetUserId,
        updates: {
          full_name: formData.fullName,
          email: formData.email
        }
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Profile & Identity</Typography>
        <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Manage your personal details and system settings.</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Avatar 
              src={profile?.avatar_url} 
              sx={{ width: 120, height: 120, mx: 'auto', mb: 3, bgcolor: '#D4AF37', fontSize: '3rem', fontWeight: 800 }}
            >
              {profile?.full_name?.[0] || 'A'}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{profile?.full_name || 'Aenosh Joy'}</Typography>
            <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 700, mb: 3 }}>{profile?.role?.toUpperCase() || 'MEMBER'}</Typography>
            <Button variant="outlined" fullWidth sx={{ mb: 1 }}>Change Avatar</Button>
            <Typography variant="caption" sx={{ color: '#666' }}>Member since {new Date(profile?.created_at).toLocaleDateString()}</Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>General Information</Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>FULL NAME</Typography>
                <TextField 
                  fullWidth 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>EMAIL ADDRESS</Typography>
                <TextField 
                  fullWidth 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </Box>
              <Box sx={{ pt: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Save size={18} />}
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F', fontWeight: 700, px: 4 }}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Stack>

            <Divider sx={{ my: 4, opacity: 0.05 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#B0B0B0', fontWeight: 700 }}>JOURNEY STATS</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{new Date(profile?.created_at).toLocaleDateString()}</Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>Joined Date</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Member</Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>Account Type</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(212, 175, 55, 0.05)', textAlign: 'center', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#D4AF37' }}>Active</Typography>
                  <Typography variant="caption" sx={{ color: '#D4AF37', opacity: 0.7 }}>Journey Status</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%', backgroundColor: '#4CAF50', color: '#fff' }}>
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;

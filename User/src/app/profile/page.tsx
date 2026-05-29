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
  Save,
  Trash2,
  Upload,
  Camera
} from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { useMyProfile, useUpdateProfile } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

const Profile = () => {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = React.useState<string | null>(user?.id || null);
  const [success, setSuccess] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Both fields are required.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !targetUserId) return;

    try {
      setIsUploadingAvatar(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${targetUserId}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfileMutation.mutateAsync({
        userId: targetUserId,
        updates: { avatar_url: publicUrl }
      });

      setSuccess(true);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Error uploading avatar. Make sure the "avatars" bucket exists and is public.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!targetUserId || !profile?.avatar_url) return;

    try {
      setIsUploadingAvatar(true);

      // Update profile to remove avatar URL
      await updateProfileMutation.mutateAsync({
        userId: targetUserId,
        updates: { avatar_url: null }
      });

      setSuccess(true);
    } catch (err) {
      console.error('Error deleting avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: 'var(--emerald-primary)' }} />
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
            <Box sx={{ position: 'relative', width: 120, height: 120, mx: 'auto', mb: 3 }}>
              <Avatar 
                src={profile?.avatar_url} 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: 'var(--emerald-primary)', 
                  fontSize: '3rem', 
                  fontWeight: 800,
                  boxShadow: 'var(--emerald-glow)'
                }}
              >
                {isUploadingAvatar ? <CircularProgress size={40} sx={{ color: '#fff' }} /> : (profile?.full_name?.[0] || 'A')}
              </Avatar>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{profile?.full_name || 'Aenosh Joy'}</Typography>
            <Typography variant="body2" sx={{ color: 'var(--emerald-primary)', fontWeight: 700, mb: 3 }}>{profile?.role?.toUpperCase() || 'MEMBER'}</Typography>
            
            <Stack spacing={1}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<Camera size={18} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                sx={{ borderColor: 'var(--emerald-mid)', color: 'white' }}
              >
                {profile?.avatar_url ? 'Change Picture' : 'Upload Picture'}
              </Button>
              
              {profile?.avatar_url && (
                <Button 
                  variant="text" 
                  fullWidth 
                  color="error"
                  startIcon={<Trash2 size={18} />}
                  onClick={handleDeleteAvatar}
                  disabled={isUploadingAvatar}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Remove Picture
                </Button>
              )}
            </Stack>
            
            <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#666' }}>
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </Typography>
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
                  sx={{ backgroundColor: 'var(--emerald-primary)', color: '#0B0B0F', fontWeight: 700, px: 4 }}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Stack>

            <Divider sx={{ my: 4, opacity: 0.05 }} />

            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Security & Password</Typography>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }}>
                {passwordError}
              </Alert>
            )}
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 3, backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50' }}>
                Password updated successfully!
              </Alert>
            )}
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>NEW PASSWORD</Typography>
                <TextField 
                  fullWidth 
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>CONFIRM NEW PASSWORD</Typography>
                <TextField 
                  fullWidth 
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
              </Box>
              <Box sx={{ pt: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={handlePasswordChange}
                  disabled={isUpdatingPassword}
                  sx={{ backgroundColor: 'var(--emerald-primary)', color: '#0B0B0F', fontWeight: 700, px: 4 }}
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </Box>
            </Stack>

            <Divider sx={{ my: 4, opacity: 0.05 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#B0B0B0', fontWeight: 700 }}>JOURNEY STATS</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</Typography>
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
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'var(--emerald-mid)', textAlign: 'center', border: '1px solid var(--emerald-primary)', opacity: 0.8 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--emerald-primary)' }}>Active</Typography>
                  <Typography variant="caption" sx={{ color: 'var(--emerald-primary)', opacity: 0.7 }}>Journey Status</Typography>
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

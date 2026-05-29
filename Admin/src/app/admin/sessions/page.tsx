'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Stack, 
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Plus, 
  Calendar, 
  Video, 
  Users, 
  Clock,
  Edit,
  Trash2,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import { useAdminSessions, useSaveAdminSession, useDeleteAdminSession, useUploadAsset, CollectiveSession } from '@/lib/queries';

const SessionManager = () => {
  const { data: sessions, isLoading } = useAdminSessions();
  const saveSessionMutation = useSaveAdminSession();
  const deleteSessionMutation = useDeleteAdminSession();
  const uploadAssetMutation = useUploadAsset();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<CollectiveSession> | null>(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const handleOpenDialog = (session?: CollectiveSession) => {
    if (session) {
      setEditingSession(session);
    } else {
      setEditingSession({
        title: '',
        host_name: '',
        session_type: 'Group Call',
        start_time: new Date().toISOString().slice(0, 16),
        duration_minutes: 60,
        meeting_link: '',
        is_published: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSession(null);
  };

  const handleSave = async () => {
    if (!editingSession) return;
    try {
      await saveSessionMutation.mutateAsync(editingSession);
      setNotification({ open: true, message: 'Session saved successfully!', severity: 'success' });
      handleCloseDialog();
    } catch (err) {
      setNotification({ open: true, message: 'Failed to save session.', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteSessionMutation.mutateAsync(id);
      setNotification({ open: true, message: 'Session deleted.', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to delete session.', severity: 'error' });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `host-${Date.now()}.${fileExt}`;
      const bucket = 'program-assets';
      
      const publicUrl = await uploadAssetMutation.mutateAsync({
        file,
        bucket,
        path: `hosts/${fileName}`
      });

      setEditingSession(prev => ({ ...prev, host_avatar_url: publicUrl }));
      setNotification({ open: true, message: 'Avatar uploaded!', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Upload failed.', severity: 'error' });
    }
  };

  const filteredSessions = sessions?.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.host_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || s.session_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Session Manager</Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Schedule and manage collective events and mentorship calls.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />} 
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: '#D4AF37', 
            color: '#0B0B0F', 
            fontWeight: 700,
            '&:hover': { backgroundColor: '#B8962D' }
          }}
        >
          Schedule Session
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField 
            placeholder="Search by title or host..." 
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Stack direction="row" spacing={1}>
            {['All', 'Group Call', 'Live Practice', 'Q&A', 'Mentorship'].map((type) => (
              <Chip 
                key={type}
                label={type}
                onClick={() => setTypeFilter(type)}
                sx={{ 
                  backgroundColor: typeFilter === type ? '#D4AF37' : 'rgba(255, 255, 255, 0.05)',
                  color: typeFilter === type ? '#0B0B0F' : '#B0B0B0',
                  fontWeight: 700,
                  '&:hover': { backgroundColor: typeFilter === type ? '#B8962D' : 'rgba(255, 255, 255, 0.08)' }
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#D4AF37' }} /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: '#B0B0B0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' } }}>
                <TableCell>Session Details</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSessions?.map((session) => (
                <TableRow key={session.id} sx={{ '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)' } }}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{session.title}</Typography>
                    {session.meeting_link && (
                      <Typography variant="caption" sx={{ color: '#D4AF37', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Video size={12} /> {session.meeting_link.substring(0, 30)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={session.host_avatar_url} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{session.host_name[0]}</Avatar>
                      <Typography variant="body2">{session.host_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={session.session_type} 
                      size="small" 
                      sx={{ 
                        backgroundColor: session.session_type === 'Group Call' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                        color: session.session_type === 'Group Call' ? '#2196F3' : '#4CAF50',
                        fontWeight: 700,
                        fontSize: '0.65rem'
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={14} color="#666" />
                        {new Date(session.start_time).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666' }}>
                        <Clock size={12} />
                        {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes}m)
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={session.is_published ? 'Published' : 'Draft'} 
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: session.is_published ? '#D4AF37' : '#444', color: session.is_published ? '#D4AF37' : '#444' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={() => handleOpenDialog(session)} sx={{ color: '#B0B0B0' }}><Edit size={18} /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(session.id)} sx={{ color: 'rgba(244, 67, 54, 0.3)', '&:hover': { color: '#f44336' } }}><Trash2 size={18} /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {(!sessions || sessions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#444' }}>
                    No sessions scheduled yet. Click "Schedule Session" to start.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{ 
          paper: { sx: { backgroundColor: '#121217', border: '1px solid rgba(255, 255, 255, 0.1)' } } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#D4AF37' }}>
          {editingSession?.id ? 'Edit Session' : 'Schedule New Session'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={editingSession?.host_avatar_url} 
                  sx={{ width: 80, height: 80, border: '2px solid rgba(212, 175, 55, 0.3)' }}
                >
                  {editingSession?.host_name?.[0] || 'H'}
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  id="host-avatar-upload"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
                <label htmlFor="host-avatar-upload">
                  <IconButton 
                    size="small"
                    component="span"
                    sx={{ 
                      position: 'absolute', 
                      bottom: -5, 
                      right: -5, 
                      backgroundColor: '#D4AF37', 
                      color: '#0B0B0F',
                      '&:hover': { backgroundColor: '#B8962D' }
                    }}
                  >
                    {uploadAssetMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <Plus size={14} />}
                  </IconButton>
                </label>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 700 }}>HOST AVATAR</Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>Upload a clear photo of the session host.</Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Session Title"
              value={editingSession?.title || ''}
              onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Host Name"
                  value={editingSession?.host_name || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, host_name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Session Type"
                  value={editingSession?.session_type || 'Group Call'}
                  onChange={(e) => setEditingSession({ ...editingSession, session_type: e.target.value })}
                >
                  <MenuItem value="Group Call">Group Call</MenuItem>
                  <MenuItem value="Live Practice">Live Practice</MenuItem>
                  <MenuItem value="Q&A">Q&A</MenuItem>
                  <MenuItem value="Mentorship">Mentorship</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 8 }}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Start Time"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={editingSession?.start_time?.slice(0, 16) || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, start_time: new Date(e.target.value).toISOString() })}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (min)"
                  value={editingSession?.duration_minutes || 60}
                  onChange={(e) => setEditingSession({ ...editingSession, duration_minutes: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Meeting Link (Zoom/Google Meet)"
              value={editingSession?.meeting_link || ''}
              onChange={(e) => setEditingSession({ ...editingSession, meeting_link: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editingSession?.description || ''}
              onChange={(e) => setEditingSession({ ...editingSession, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#B0B0B0' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saveSessionMutation.isPending || !editingSession?.title}
            sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F', fontWeight: 700, '&:hover': { backgroundColor: '#B8962D' } }}
          >
            {saveSessionMutation.isPending ? 'Saving...' : 'Save Session'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionManager;

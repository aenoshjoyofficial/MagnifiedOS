'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Avatar, 
  Chip, 
  IconButton, 
  TextField, 
  InputAdornment, 
  Button, 
  LinearProgress, 
  Stack, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  Menu, 
  ListItemIcon, 
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserX, 
  RefreshCw, 
  Plus, 
  X, 
  Mail, 
  Lock, 
  Eye, 
  UserCircle, 
  Settings 
} from 'lucide-react';
import { useUsers, usePrograms, useEnrollUser, useCreateUser, useUpdateUser } from '@/lib/queries';

const UserManagement = () => {
  const navigate = useNavigate();
  
  // Live Data Hooks
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useUsers();
  const { data: programs, isLoading: isLoadingPrograms } = usePrograms();
  const enrollUserMutation = useEnrollUser();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const [activeUserForMenu, setActiveUserForMenu] = useState<any>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    programId: '',
    password: '',
    createPasswordLater: true
  });

  const [editUser, setEditUser] = useState({
    fullName: '',
    email: ''
  });

  const handleOpenAddUser = () => {
    setFormError(null);
    setIsAddUserOpen(true);
  };
  const handleCloseAddUser = () => {
    setIsAddUserOpen(false);
    setFormError(null);
  };

  const handleOpenEdit = () => {
    if (selectedUser) {
      setEditUser({
        fullName: selectedUser.full_name || '',
        email: selectedUser.email || ''
      });
      setIsEditOpen(true);
      setIsDetailOpen(false);
    }
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setFormError(null);
  };
  
  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveUserForMenu(user);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveUserForMenu(null);
  };

  const handleViewProgress = () => {
    if (activeUserForMenu) {
      navigate(`/admin/users/${activeUserForMenu.id}`);
    }
    handleMenuClose();
  };

  const handleOpenDetail = () => {
    setSelectedUser(activeUserForMenu);
    setIsDetailOpen(true);
    handleMenuClose();
  };

  const handleCloseDetail = () => setIsDetailOpen(false);

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    try {
      await updateUserMutation.mutateAsync({
        userId: selectedUser.id,
        updates: {
          full_name: editUser.fullName,
          email: editUser.email
        }
      });
      handleCloseEdit();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user.');
    }
  };

  const handleAddUserSubmit = async () => {
    if (!newUser.email || !newUser.programId) return;
    
    // Validate password if not creating later
    if (!newUser.createPasswordLater && newUser.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setFormError(null);

    try {
      await createUserMutation.mutateAsync({
        email: newUser.email,
        password: newUser.password || 'TemporaryPassword123!',
        fullName: newUser.name,
        programId: newUser.programId
      });
      
      handleCloseAddUser();
      setNewUser({
        name: '',
        email: '',
        programId: '',
        password: '',
        createPasswordLater: true
      });
    } catch (err: any) {
      console.error('--- CREATION FAILED ---');
      console.error('Message:', err.message);
      console.error('Status:', err.status);
      console.error('Details:', JSON.stringify(err, null, 2));
      
      const msg = err.message || 'An unexpected error occurred during user creation.';
      if (msg.toLowerCase().includes('weak')) {
        setFormError('The password is too weak. Please use at least 6 characters.');
      } else {
        setFormError(msg);
      }
    }
  };

  if (isLoadingUsers) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>User Management</Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Manage member access and monitor progress.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={handleOpenAddUser}
          sx={{ 
            backgroundColor: '#D4AF37', 
            color: '#0B0B0F', 
            fontWeight: 700,
            '&:hover': { backgroundColor: '#B8962D' } 
          }}
        >
          Add User
        </Button>
      </Box>

      {usersError && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}>
          Failed to load users. Please check your Supabase connection.
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <TextField 
          fullWidth 
          size="small" 
          placeholder="Search by name or email..." 
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#666" />
                </InputAdornment>
              ),
            }
          }}
        />
        <Button variant="outlined" startIcon={<Filter size={18} />} sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: '#B0B0B0' }}>Filter</Button>
      </Paper>

      <Paper sx={{ overflow: 'hidden', width: '100%' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 700 }}>MEMBER</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 700 }}>STATUS</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 700 }}>ASSIGNED PROGRAM</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 700 }}>LAST ACTIVE</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 700 }}>PROGRESS</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users?.map((user, i) => {
                const enrollment = user.enrollments?.[0];
                const totalTasks = 60; // Mock total for now
                const completedTasks = enrollment?.task_completions?.length || 0;
                const progress = Math.round((completedTasks / totalTasks) * 100) || 0;

                return (
                  <TableRow key={user.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton 
                          onClick={(e) => handleAvatarClick(e, user)}
                          sx={{ p: 0, '&:hover': { opacity: 0.8 } }}
                        >
                          <Avatar src={user.avatar_url} sx={{ bgcolor: i % 2 === 0 ? '#D4AF37' : '#2196F3', color: '#0B0B0F', fontWeight: 700 }}>
                            {user.full_name?.[0] || user.email?.[0]}
                          </Avatar>
                        </IconButton>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.full_name || 'Anonymous'}</Typography>
                          <Typography variant="caption" sx={{ color: '#B0B0B0' }}>{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={enrollment?.status || 'No Program'} 
                        size="small" 
                        sx={{ 
                          backgroundColor: enrollment?.status === 'active' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: enrollment?.status === 'active' ? '#4CAF50' : '#B0B0B0',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          textTransform: 'capitalize'
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{enrollment?.programs?.title || 'None'}</TableCell>
                    <TableCell sx={{ color: '#B0B0B0', fontSize: '0.85rem' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={progress} sx={{ width: 60, height: 4, borderRadius: 2, backgroundColor: 'rgba(212, 175, 55, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#D4AF37' } }} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <IconButton size="small" sx={{ color: '#666' }} title="Reset Progress"><RefreshCw size={16} /></IconButton>
                        <IconButton size="small" sx={{ color: '#666' }} title="Disable User"><UserX size={16} /></IconButton>
                        <IconButton size="small" sx={{ color: '#B0B0B0' }}><MoreVertical size={16} /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Tile Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#121217',
              backgroundImage: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              minWidth: 180,
              mt: 1
            }
          }
        }}
      >
        <MenuItem onClick={handleViewProgress} sx={{ py: 1.5 }}>
          <ListItemIcon><Eye size={18} color="#D4AF37" /></ListItemIcon>
          <ListItemText primary="View Progress" slotProps={{ primary: { sx: { fontWeight: 700 } } }} />
        </MenuItem>
        <MenuItem onClick={handleOpenDetail} sx={{ py: 1.5 }}>
          <ListItemIcon><UserCircle size={18} color="#B0B0B0" /></ListItemIcon>
          <ListItemText primary="Quick Profile" slotProps={{ primary: { sx: { fontWeight: 600, color: '#B0B0B0' } } }} />
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
          <ListItemIcon><Settings size={18} color="#B0B0B0" /></ListItemIcon>
          <ListItemText primary="User Settings" slotProps={{ primary: { sx: { fontWeight: 600, color: '#B0B0B0' } } }} />
        </MenuItem>
      </Menu>

      {/* Add User Dialog */}
      <Dialog 
        open={isAddUserOpen} 
        onClose={handleCloseAddUser}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#121217',
              backgroundImage: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800 }}>Add New Member</Typography>
          <IconButton onClick={handleCloseAddUser} size="small" sx={{ color: '#B0B0B0' }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>FULL NAME</Typography>
              <TextField 
                fullWidth 
                placeholder="e.g. John Doe" 
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>EMAIL ADDRESS</Typography>
              <TextField 
                fullWidth 
                placeholder="name@example.com" 
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Mail size={16} color="#666" /></InputAdornment>
                  }
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>ASSIGN PROGRAM</Typography>
              <FormControl fullWidth>
                <Select
                  value={newUser.programId}
                  onChange={(e) => setNewUser({...newUser, programId: e.target.value})}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) return <Typography sx={{ color: '#666' }}>Select a program...</Typography>;
                    const prog = programs?.find(p => p.id === selected);
                    return prog ? prog.title : 'Selected';
                  }}
                >
                  <MenuItem value="" style={{ display: 'none' }}>
                    Select a program...
                  </MenuItem>
                  {isLoadingPrograms ? (
                    <MenuItem disabled><CircularProgress size={20} sx={{ mr: 2 }} /> Loading...</MenuItem>
                  ) : (
                    programs?.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={newUser.createPasswordLater}
                    onChange={(e) => setNewUser({...newUser, createPasswordLater: e.target.checked})}
                    sx={{ color: '#666', '&.Mui-checked': { color: '#D4AF37' } }}
                  />
                }
                label={<Typography variant="body2" sx={{ color: '#B0B0B0' }}>Create password later (send invitation email)</Typography>}
              />
            </Box>
            {!newUser.createPasswordLater && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>PASSWORD</Typography>
                <TextField 
                  fullWidth 
                  type="password"
                  placeholder="Set initial password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><Lock size={16} color="#666" /></InputAdornment>
                    }
                  }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseAddUser} sx={{ color: '#B0B0B0' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddUserSubmit}
            disabled={!newUser.email || !newUser.programId || enrollUserMutation.isPending}
            sx={{ 
              backgroundColor: '#D4AF37', 
              color: '#0B0B0F', 
              fontWeight: 700,
              px: 4,
              '&:hover': { backgroundColor: '#B8962D' },
              '&.Mui-disabled': { backgroundColor: 'rgba(212, 175, 55, 0.2)', color: 'rgba(11, 11, 15, 0.5)' }
            }}
          >
            {enrollUserMutation.isPending ? 'Enrolling...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Profile Dialog */}
      <Dialog 
        open={isDetailOpen} 
        onClose={handleCloseDetail}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#121217',
              backgroundImage: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800 }}>Member Profile</Typography>
          <IconButton onClick={handleCloseDetail} size="small" sx={{ color: '#B0B0B0' }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedUser && (
            <Stack spacing={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar src={selectedUser.avatar_url} sx={{ width: 80, height: 80, fontSize: '2rem', bgcolor: '#D4AF37', color: '#0B0B0F', fontWeight: 800 }}>
                  {selectedUser.full_name?.[0] || selectedUser.email?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedUser.full_name || 'Anonymous'}</Typography>
                  <Typography variant="body1" sx={{ color: '#B0B0B0' }}>{selectedUser.email}</Typography>
                  <Chip 
                    label={selectedUser.enrollments?.[0]?.status || 'No Program'} 
                    size="small" 
                    sx={{ 
                      mt: 1,
                      backgroundColor: selectedUser.enrollments?.[0]?.status === 'active' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      color: selectedUser.enrollments?.[0]?.status === 'active' ? '#4CAF50' : '#B0B0B0',
                      fontWeight: 700,
                      textTransform: 'capitalize'
                    }} 
                  />
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#B0B0B0', fontWeight: 700 }}>PROGRAM ENGAGEMENT</Typography>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>{selectedUser.enrollments?.[0]?.programs?.title || 'None'}</Typography>
                    <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                      {Math.round(((selectedUser.enrollments?.[0]?.task_completions?.length || 0) / 60) * 100)}% COMPLETE
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.round(((selectedUser.enrollments?.[0]?.task_completions?.length || 0) / 60) * 100)} 
                    sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(212, 175, 55, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#D4AF37' } }} 
                  />
                </Paper>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button fullWidth variant="contained" onClick={() => { handleAvatarClick({ currentTarget: null } as any, selectedUser); handleViewProgress(); }} sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F', fontWeight: 700, '&:hover': { backgroundColor: '#B8962D' } }}>View Full Progress</Button>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={handleOpenEdit}
                  sx={{ color: '#B0B0B0', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDetail} fullWidth sx={{ color: '#666' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={isEditOpen} 
        onClose={handleCloseEdit}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#121217',
              backgroundImage: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Member Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>FULL NAME</Typography>
              <TextField 
                fullWidth 
                value={editUser.fullName}
                onChange={(e) => setEditUser({...editUser, fullName: e.target.value})}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>EMAIL ADDRESS</Typography>
              <TextField 
                fullWidth 
                value={editUser.email}
                onChange={(e) => setEditUser({...editUser, email: e.target.value})}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseEdit} sx={{ color: '#666' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleEditSubmit}
            disabled={updateUserMutation.isPending}
            sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F', fontWeight: 700 }}
          >
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;




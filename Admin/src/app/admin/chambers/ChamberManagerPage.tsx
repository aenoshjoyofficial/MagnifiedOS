import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Edit2,
  Settings,
  Info
} from 'lucide-react';
import { useChambers, useSaveChamber } from '@/lib/queries';
import * as LucideIcons from 'lucide-react';

const getChamberIconComponent = (iconName: string | undefined) => {
  if (!iconName) return LucideIcons.Brain;
  const IconComp = (LucideIcons as any)[iconName];
  return IconComp || LucideIcons.Brain;
};

const ChamberManagerPage = () => {
  const navigate = useNavigate();
  const { data: chambers = [], isLoading, isRefetching } = useChambers();
  const saveChamberMutation = useSaveChamber();

  // Edit modal state
  const [editingChamber, setEditingChamber] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editOrder, setEditOrder] = useState<number>(0);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleOpenEdit = (chamber: any) => {
    setEditingChamber(chamber);
    setEditTitle(chamber.title || '');
    setEditIcon(chamber.icon || 'Brain');
    setEditColor(chamber.color_accent || '#10B981');
    setEditOrder(chamber.display_order || 0);
    setIsEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingChamber(null);
    setIsEditDialogOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingChamber) return;
    try {
      await saveChamberMutation.mutateAsync({
        id: editingChamber.id,
        title: editTitle.trim(),
        icon: editIcon.trim(),
        color_accent: editColor.trim(),
        display_order: editOrder
      });
      setNotification({ open: true, message: 'Chamber settings saved successfully!', severity: 'success' });
      handleCloseEdit();
    } catch (err: any) {
      console.error('Failed to save chamber settings:', err);
      setNotification({ open: true, message: err?.message || 'Failed to save settings. Please try again.', severity: 'error' });
    }
  };

  const handleToggle = async (chamber: any, field: 'visible' | 'active' | 'coming_soon' | 'premium_only', value: boolean) => {
    try {
      await saveChamberMutation.mutateAsync({
        id: chamber.id,
        [field]: value
      });
      setNotification({ open: true, message: `Chamber status "${field}" updated successfully!`, severity: 'success' });
    } catch (err: any) {
      console.error(`Failed to update chamber ${field}:`, err);
      setNotification({ open: true, message: err?.message || 'Failed to update status. Please try again.', severity: 'error' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === chambers.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentChamber = chambers[index];
    const targetChamber = chambers[targetIndex];

    try {
      const currentOrder = currentChamber.display_order;
      const targetOrder = targetChamber.display_order;

      await saveChamberMutation.mutateAsync({
        id: targetChamber.id,
        display_order: currentOrder
      });

      await saveChamberMutation.mutateAsync({
        id: currentChamber.id,
        display_order: targetOrder
      });
      setNotification({ open: true, message: 'Chamber display order updated successfully!', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to reorder chambers:', err);
      setNotification({ open: true, message: err?.message || 'Failed to save new order. Please try again.', severity: 'error' });
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
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      
      {/* Header & Navigation */}
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Breadcrumbs sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.5)' }}>
            <MuiLink href="/admin" onClick={(e) => { e.preventDefault(); navigate('/admin'); }} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#D4AF37' } }}>
              Admin Home
            </MuiLink>
            <Typography color="#D4AF37" sx={{ fontWeight: 600 }}>Chamber Management</Typography>
          </Breadcrumbs>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif', color: '#FFFFFF' }}>
            Chamber Navigation & Visibility System
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/admin')}
          sx={{
            borderColor: 'rgba(212, 175, 55, 0.3)',
            color: '#D4AF37',
            '&:hover': {
              borderColor: '#D4AF37',
              backgroundColor: 'rgba(212, 175, 55, 0.05)'
            }
          }}
        >
          Back to Home
        </Button>
      </Box>

      {/* Info Alert */}
      <Box sx={{ 
        mb: 4, 
        p: 2.5, 
        borderRadius: '16px', 
        backgroundColor: 'rgba(16, 185, 129, 0.05)', 
        border: '1px solid rgba(16, 185, 129, 0.2)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2
      }}>
        <Info size={20} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
        <Box>
          <Typography variant="body2" sx={{ color: '#EAEAEA', fontWeight: 600, mb: 0.5 }}>
            Production Safety Active
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1.5 }}>
            Chambers configured here synchronize in real-time across both the Admin Sidebar and the member's User Dashboard. Toggling visibility hides chambers without deleting any of their content, tasks, or user progression history.
          </Typography>
        </Box>
      </Box>

      {/* Chambers List Card */}
      <Paper sx={{ 
        p: 3, 
        backgroundColor: '#030712', 
        borderColor: 'rgba(16, 185, 129, 0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 700, letterSpacing: '0.05em' }}>
            Sacred Chambers list
          </Typography>
          {(isRefetching || saveChamberMutation.isPending) && (
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: '#10B981' }} />
              <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>Syncing changes...</Typography>
            </Box>
          )}
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: 'rgba(16, 185, 129, 0.04)' }}>
              <TableRow>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Order</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Chamber Title</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>Slug Key</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }} align="center">Visible</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }} align="center">Active</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }} align="center">Coming Soon</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }} align="center">Premium</TableCell>
                <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chambers.map((chamber, index) => {
                const IconComponent = getChamberIconComponent(chamber.icon);
                
                return (
                  <TableRow 
                    key={chamber.id}
                    sx={{ 
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                      borderBottom: '1px solid rgba(16, 185, 129, 0.05)',
                      opacity: chamber.visible ? 1 : 0.6
                    }}
                  >
                    {/* Display Order Controls */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ minWidth: 24, fontWeight: 700, color: '#EAEAEA' }}>
                          {chamber.display_order}
                        </Typography>
                        <IconButton 
                          size="small" 
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          sx={{ color: '#D4AF37', '&.Mui-disabled': { color: 'rgba(255,255,255,0.05)' } }}
                        >
                          <ArrowUp size={16} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          disabled={index === chambers.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          sx={{ color: '#D4AF37', '&.Mui-disabled': { color: 'rgba(255,255,255,0.05)' } }}
                        >
                          <ArrowDown size={16} />
                        </IconButton>
                      </Box>
                    </TableCell>

                    {/* Title with Icon */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: '8px', 
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.15)',
                          color: chamber.color_accent || '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <IconComponent size={20} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: '#FFFFFF' }}>{chamber.title}</Typography>
                          {!chamber.visible && (
                            <Typography variant="caption" sx={{ color: '#FF4B4B', display: 'block', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Hidden from Members
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Slug */}
                    <TableCell sx={{ fontFamily: 'monospace', color: '#94A3B8' }}>{chamber.slug}</TableCell>

                    {/* Visible Toggle */}
                    <TableCell align="center">
                      <Tooltip title={chamber.visible ? "Visible in user dashboard" : "Hidden from user dashboard"} arrow>
                        <Switch
                          size="small"
                          checked={chamber.visible}
                          onChange={(e) => handleToggle(chamber, 'visible', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#10B981' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10B981' }
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Active Toggle */}
                    <TableCell align="center">
                      <Tooltip title={chamber.active ? "Allows users to click and practice" : "Blocks entry, allows admin preview"} arrow>
                        <Switch
                          size="small"
                          checked={chamber.active}
                          onChange={(e) => handleToggle(chamber, 'active', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#10B981' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10B981' }
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Coming Soon Toggle */}
                    <TableCell align="center">
                      <Tooltip title={chamber.coming_soon ? "User sees 'Coming Soon' placeholder" : "Available immediately"} arrow>
                        <Switch
                          size="small"
                          checked={chamber.coming_soon}
                          onChange={(e) => handleToggle(chamber, 'coming_soon', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#D4AF37' }
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Premium Toggle */}
                    <TableCell align="center">
                      <Tooltip title={chamber.premium_only ? "Reserved for Premium Subscribers" : "Open access"} arrow>
                        <Switch
                          size="small"
                          checked={chamber.premium_only}
                          onChange={(e) => handleToggle(chamber, 'premium_only', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#D4AF37' }
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Rename, change icon or color">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenEdit(chamber)}
                            sx={{ color: '#94A3B8', '&:hover': { color: '#D4AF37' } }}
                          >
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Manage chamber tasks (Pool)">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/admin/chambers/${chamber.slug}`)}
                            sx={{ color: '#94A3B8', '&:hover': { color: '#10B981' } }}
                          >
                            <Settings size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Settings Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onClose={handleCloseEdit}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#061A14',
              borderColor: 'rgba(212, 175, 55, 0.25)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '16px',
              p: 1.5,
              width: '100%',
              maxWidth: 480
            }
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', color: '#D4AF37', fontWeight: 800 }}>
          Edit Chamber Settings
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1.5 }}>
            <TextField
              label="Display Name / Title"
              fullWidth
              variant="outlined"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              slotProps={{
                inputLabel: { sx: { color: 'rgba(255,255,255,0.6)' } }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: '#10B981' },
                  '&.Mui-focused fieldset': { borderColor: '#10B981' }
                }
              }}
            />
            <TextField
              label="Lucide Icon (e.g. Brain, Wind, Award, Moon)"
              fullWidth
              variant="outlined"
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              slotProps={{
                inputLabel: { sx: { color: 'rgba(255,255,255,0.6)' } }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: '#10B981' },
                  '&.Mui-focused fieldset': { borderColor: '#10B981' }
                }
              }}
            />
            <TextField
              label="Color Accent Hex Code (e.g. #10B981)"
              fullWidth
              variant="outlined"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              slotProps={{
                inputLabel: { sx: { color: 'rgba(255,255,255,0.6)' } }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: '#10B981' },
                  '&.Mui-focused fieldset': { borderColor: '#10B981' }
                }
              }}
            />
            <TextField
              label="Display Order (Integer)"
              type="number"
              fullWidth
              variant="outlined"
              value={editOrder}
              onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
              slotProps={{
                inputLabel: { sx: { color: 'rgba(255,255,255,0.6)' } }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: '#10B981' },
                  '&.Mui-focused fieldset': { borderColor: '#10B981' }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={handleCloseEdit} 
            sx={{ color: '#94A3B8' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveEdit}
            disabled={saveChamberMutation.isPending}
            sx={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={4000} 
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity} 
          sx={{ 
            width: '100%', 
            backgroundColor: notification.severity === 'error' ? '#ef5350' : '#10B981', 
            color: 'white',
            fontWeight: 800,
            borderRadius: '16px'
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChamberManagerPage;

import React, { useState } from 'react';
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
  Stack, 
  TextField, 
  MenuItem, 
  CircularProgress,
  Tooltip,
  Button
} from '@mui/material';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Search,
  Filter,
  ExternalLink,
  Mail
} from 'lucide-react';
import { useAdminBookings, useUpdateBookingStatus } from '@/lib/queries';

const BookingsManager = () => {
  const { data: bookings, isLoading } = useAdminBookings();
  const updateStatusMutation = useUpdateBookingStatus();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'rgba(76, 175, 80, 0.1)', text: '#4CAF50' };
      case 'completed': return { bg: 'rgba(33, 150, 243, 0.1)', text: '#2196F3' };
      case 'cancelled': return { bg: 'rgba(244, 67, 54, 0.1)', text: '#f44336' };
      default: return { bg: 'rgba(255, 255, 255, 0.05)', text: '#B0B0B0' };
    }
  };

  const filteredBookings = bookings?.filter((b: any) => {
    const matchesSearch = b.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         b.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Member Bookings</Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Manage private mentorship assessments and one-on-one sessions.</Typography>
        </Box>
      </Box>

      {/* Filters & Search */}
      <Paper sx={{ p: 2, mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField 
            placeholder="Search by member name or email..." 
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1 }}
            slotProps={{
              input: {
                startAdornment: <Search size={18} style={{ marginRight: 8, color: '#666' }} />,
              }
            }}
          />
          <Stack direction="row" spacing={1}>
            {['all', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <Chip 
                key={status}
                label={status.toUpperCase()}
                onClick={() => setStatusFilter(status)}
                sx={{ 
                  backgroundColor: statusFilter === status ? '#D4AF37' : 'rgba(255, 255, 255, 0.05)',
                  color: statusFilter === status ? '#0B0B0F' : '#B0B0B0',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  '&:hover': { backgroundColor: statusFilter === status ? '#B8962D' : 'rgba(255, 255, 255, 0.08)' }
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
                <TableCell>Member</TableCell>
                <TableCell>Session Type</TableCell>
                <TableCell>Scheduled For</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings?.map((booking: any) => {
                const statusStyles = getStatusColor(booking.status);
                return (
                  <TableRow key={booking.id} sx={{ '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          src={booking.profiles?.avatar_url} 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            '& img': {
                              objectFit: 'cover',
                              objectPosition: 'center 20%'
                            }
                          }}
                        >
                          {booking.profiles?.full_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{booking.profiles?.full_name}</Typography>
                          <Typography variant="caption" sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Mail size={12} /> {booking.profiles?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#D4AF37' }}>{booking.session_type}</Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>{booking.duration_minutes} Minutes</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#EAEAEA' }}>
                          <Calendar size={14} color="#D4AF37" />
                          <Typography variant="body2">{new Date(booking.start_time).toLocaleDateString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#B0B0B0' }}>
                          <Clock size={14} />
                          <Typography variant="caption">{new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={booking.status.toUpperCase()} 
                        size="small" 
                        sx={{ 
                          backgroundColor: statusStyles.bg, 
                          color: statusStyles.text, 
                          fontWeight: 800,
                          fontSize: '0.65rem'
                        }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        {booking.status === 'confirmed' && (
                          <>
                            <Tooltip title="Mark as Completed">
                              <IconButton 
                                size="small" 
                                onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                sx={{ color: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.05)', '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' } }}
                              >
                                <CheckCircle2 size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel Booking">
                              <IconButton 
                                size="small" 
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                sx={{ color: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.05)', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
                              >
                                <XCircle size={18} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <IconButton size="small" sx={{ color: '#B0B0B0' }}><ExternalLink size={18} /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredBookings?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center' }}>
                    <Typography sx={{ color: '#666' }}>No bookings found matching your criteria.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default BookingsManager;

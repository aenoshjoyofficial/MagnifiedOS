'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Users, 
  Activity, 
  CheckCircle, 
  Plus,
  ArrowUpRight,
  MoreVertical
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardStats, useUsers } from '@/lib/queries';

const AdminDashboard = () => {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: users, isLoading: isLoadingUsers } = useUsers();

  const dashboardStats = [
    { label: 'Total Members', value: stats?.totalMembers || 0, icon: Users, change: '+0%', color: '#2196F3' },
    { label: 'Active Enrollments', value: stats?.activeEnrollments || 0, icon: Activity, change: '+0%', color: '#4CAF50' },
    { label: 'Total Completions', value: stats?.totalCompletions || 0, icon: CheckCircle, change: '+0%', color: '#D4AF37' },
  ];

  const recentUsers = users?.slice(0, 5) || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Admin Command Center</Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Monitor growth and system engagement.</Typography>
        </Box>
        <Button 
          component={Link}
          to="/admin/program-builder"
          variant="contained" 
          startIcon={<Plus size={18} />}
          sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F', '&:hover': { backgroundColor: '#B8962D' } }}
        >
          Create Program
        </Button>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardStats.map((stat, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Paper sx={{ p: 3 }}>
              {isLoadingStats ? (
                <CircularProgress size={24} sx={{ color: '#D4AF37' }} />
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: `${stat.color}10`, color: stat.color }}>
                      <stat.icon size={24} />
                    </Box>
                    <Chip 
                      label={stat.change} 
                      size="small" 
                      sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', fontWeight: 700 }} 
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{stat.value.toLocaleString()}</Typography>
                  <Typography variant="body2" sx={{ color: '#B0B0B0', fontWeight: 600 }}>{stat.label}</Typography>
                </>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Enrollments */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Recent Enrollments</Typography>
              <Button component={Link} to="/admin/users" size="small" endIcon={<ArrowUpRight size={14} />} sx={{ color: '#D4AF37' }}>View All</Button>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#B0B0B0', fontWeight: 700, fontSize: '0.75rem' }}>USER</TableCell>
                    <TableCell sx={{ color: '#B0B0B0', fontWeight: 700, fontSize: '0.75rem' }}>PROGRAM</TableCell>
                    <TableCell sx={{ color: '#B0B0B0', fontWeight: 700, fontSize: '0.75rem' }}>START DATE</TableCell>
                    <TableCell sx={{ color: '#B0B0B0', fontWeight: 700, fontSize: '0.75rem' }}>PROGRESS</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress sx={{ color: '#D4AF37' }} /></TableCell></TableRow>
                  ) : (
                    recentUsers.map((user, i) => {
                      const enrollment = user.enrollments?.[0];
                      const progress = Math.round(((enrollment?.task_completions?.length || 0) / 60) * 100);
                      
                      return (
                        <TableRow key={user.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={user.avatar_url} sx={{ width: 32, height: 32, bgcolor: '#D4AF37', color: '#0B0B0F', fontSize: '0.8rem', fontWeight: 700 }}>
                                {user.full_name?.[0] || user.email[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{user.full_name || 'Anonymous'}</Typography>
                                <Typography variant="caption" sx={{ color: '#B0B0B0' }}>{user.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{enrollment?.programs?.title || 'None'}</TableCell>
                          <TableCell sx={{ color: '#B0B0B0' }}>
                            {enrollment?.started_at ? new Date(enrollment.started_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={progress} sx={{ width: 60, height: 4, borderRadius: 2, backgroundColor: 'rgba(212, 175, 55, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#D4AF37' } }} />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{progress}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton component={Link} to={`/admin/users/${user.id}`} size="small" sx={{ color: '#B0B0B0' }}><MoreVertical size={16} /></IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Insights */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Strategic Insights</Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 700, mb: 0.5 }}>SYSTEM STATUS</Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                  All systems operational. Live data feed from Supabase is active and synchronized.
                </Typography>
              </Box>
              <Divider sx={{ opacity: 0.05 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#4CAF50', fontWeight: 700, mb: 0.5 }}>RECENT GROWTH</Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                  Member enrollment is steady. Total active participants: {stats?.activeEnrollments || 0}.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;


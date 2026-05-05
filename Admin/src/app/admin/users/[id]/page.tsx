'use client';

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  IconButton, 
  Stack, 
  Avatar, 
  Chip, 
  LinearProgress,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  Circle,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useUserProgress } from '@/lib/queries';

const UserDetail = () => {
  const params = useParams();
  const navigate = useNavigate();
  const userId = params.id as string;

  const { data: userData, isLoading, error } = useUserProgress(userId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  if (!userData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">User not found or no access.</Typography>
        <Button onClick={() => navigate('/admin/users')} sx={{ mt: 2 }}>Back to Users</Button>
      </Box>
    );
  }

  const enrollment = userData.enrollments?.[0];
  const program = enrollment?.programs;
  const completions = enrollment?.task_completions || [];
  
  // Calculate stats
  const totalTasks = program?.modules?.reduce((acc: number, mod: any) => 
    acc + mod.lessons.reduce((lAcc: number, lesson: any) => lAcc + lesson.tasks.length, 0), 0) || 1;
  const completedCount = completions.length;
  const overallProgress = Math.round((completedCount / totalTasks) * 100);

  // Map modules
  const modules = program?.modules?.map((mod: any) => {
    const modTasks = mod.lessons.flatMap((l: any) => l.tasks);
    const modCompleted = modTasks.filter((t: any) => completions.some((c: any) => c.task_id === t.id));
    const progress = modTasks.length > 0 ? Math.round((modCompleted.length / modTasks.length) * 100) : 0;
    
    return {
      id: mod.id,
      title: mod.title,
      progress: progress,
      tasks: `${modCompleted.length}/${modTasks.length}`,
      status: progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'
    };
  }) || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton 
          onClick={() => navigate('/admin/users')}
          sx={{ color: '#B0B0B0', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{userData.full_name || 'Anonymous'}</Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Member detailed progress and engagement insights.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar 
                src={userData.avatar_url}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 2, 
                  bgcolor: '#D4AF37', 
                  color: '#0B0B0F', 
                  fontSize: '2.5rem', 
                  fontWeight: 800,
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)'
                }}
              >
                {userData.full_name?.[0] || userData.email[0]}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{userData.full_name || 'Anonymous'}</Typography>
              <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>{userData.email}</Typography>
              <Chip label={userData.role || 'Member'} size="small" sx={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', fontWeight: 700 }} />
            </Box>
            
            <Divider sx={{ my: 3, opacity: 0.1 }} />
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Joined On</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {new Date(userData.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Assigned Program</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{program?.title || 'None'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Enrollment Status</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                  {enrollment?.status || 'Inactive'}
                </Typography>
              </Box>
            </Stack>

            <Button fullWidth variant="outlined" sx={{ mt: 4, borderColor: 'rgba(255, 255, 255, 0.1)', color: '#B0B0B0' }}>Edit Member Details</Button>
          </Paper>
        </Grid>

        {/* Metrics Grid */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3}>
            {/* Overall Progress */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.05 }}><TrendingUp size={100} /></Box>
                <Typography variant="subtitle2" sx={{ color: '#B0B0B0', fontWeight: 700, mb: 1 }}>OVERALL PROGRESS</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#D4AF37' }}>{overallProgress}%</Typography>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 700 }}>OF PROGRAM</Typography>
                </Box>
                <LinearProgress variant="determinate" value={overallProgress} sx={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(212, 175, 55, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#D4AF37' } }} />
              </Paper>
            </Grid>

            {/* Engagement metrics */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.05 }}><Activity size={100} /></Box>
                <Typography variant="subtitle2" sx={{ color: '#B0B0B0', fontWeight: 700, mb: 1 }}>ENGAGEMENT</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#4CAF50' }}>{completedCount}</Typography>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 700 }}>TASKS COMPLETED</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Active since {enrollment?.started_at ? new Date(enrollment.started_at).toLocaleDateString() : 'N/A'}</Typography>
              </Paper>
            </Grid>

            {/* Task Stats */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle2 size={20} color="#D4AF37" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Completion Heatmap</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>{completedCount} / {totalTasks}</Typography>
                </Box>
                <Grid container spacing={2}>
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <Grid key={day} size="grow">
                      <Box sx={{ 
                        aspectRatio: '1/1', 
                        borderRadius: 1, 
                        backgroundColor: day <= 5 ? '#D4AF37' : 'rgba(255, 255, 255, 0.05)',
                        opacity: day <= 5 ? 0.3 + (day * 0.1) : 1
                      }} />
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="caption" sx={{ color: '#666', mt: 2, display: 'block', textAlign: 'center' }}>Last 7 days activity (Real data coming soon)</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Module Progress List */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Module Breakdown</Typography>
            <Stack spacing={2}>
              {modules.map((module: any) => (
                <Box 
                  key={module.id} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  {module.progress === 100 ? (
                    <CheckCircle2 color="#4CAF50" size={24} />
                  ) : module.progress > 0 ? (
                    <Activity color="#D4AF37" size={24} />
                  ) : (
                    <Circle color="#666" size={24} />
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{module.title}</Typography>
                      <Typography variant="caption" sx={{ color: '#B0B0B0', fontWeight: 700 }}>{module.tasks}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={module.progress} sx={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', '& .MuiLinearProgress-bar': { backgroundColor: module.progress === 100 ? '#4CAF50' : '#D4AF37' } }} />
                  </Box>
                  <Chip 
                    label={module.status} 
                    size="small" 
                    sx={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 800,
                      backgroundColor: module.status === 'Completed' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      color: module.status === 'Completed' ? '#4CAF50' : '#B0B0B0'
                    }} 
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Recent Activity</Typography>
            <Stack spacing={3}>
              {completions.slice(0, 5).map((comp: any, i: number) => (
                <Box key={comp.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                  {i < completions.slice(0, 5).length - 1 && (
                    <Box sx={{ position: 'absolute', left: 11, top: 24, bottom: -16, width: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
                  )}
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    zIndex: 1
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D4AF37' }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Task Completed</Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>{new Date(comp.completed_at).toLocaleString()}</Typography>
                  </Box>
                </Box>
              ))}
              {completions.length === 0 && (
                <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>No recent activity found.</Typography>
              )}
            </Stack>
            <Button fullWidth sx={{ mt: 4, color: '#D4AF37', fontWeight: 700 }}>View Full Activity Log</Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetail;


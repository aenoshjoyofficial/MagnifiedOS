'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Stack,
  LinearProgress,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { useMyEnrollment } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

const Progress = () => {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = React.useState<string | null>(user?.id || null);

  React.useEffect(() => {
    const findUserId = async () => {
      if (user?.id) {
        setTargetUserId(user.id);
        return;
      }
      // No hardcoded email fallback - unauthenticated users are handled by AuthGuard
    };
    findUserId();
  }, [user]);

  const { data: enrollment, isLoading } = useMyEnrollment(targetUserId || '');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  const program = enrollment?.programs;
  const completions = enrollment?.task_completions || [];
  
  // Calculate Streak
  const calculateStreak = () => {
    if (completions.length === 0) return 0;
    
    // Get unique dates from completions (YYYY-MM-DD)
    const dates = [...new Set(completions.map((c: any) => 
      new Date(c.completed_at).toISOString().split('T')[0]
    ))] as string[];
    dates.sort().reverse();
    
    let streak = 0;
    let today = new Date().toISOString().split('T')[0];
    let yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
    
    // If the latest completion wasn't today or yesterday, streak is 0
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    
    // Iterate through dates to find consecutive days
    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(new Date(dates[0]).getDate() - i);
      
      if (currentDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const { totalTasks, completedCount, completedKeys } = React.useMemo(() => {
    const taskMap: Record<string, { title: string; dayNumber: number }> = {};
    const allTaskKeys = new Set<string>();
    
    program?.modules?.forEach((mod: any) => {
      mod.lessons?.forEach((les: any) => {
        les.tasks?.forEach((task: any) => {
          taskMap[task.id] = {
            title: task.title,
            dayNumber: les.day_number
          };
          allTaskKeys.add(`${les.day_number}_${task.title}`);
        });
      });
    });
    
    const completedKeys = new Set<string>();
    completions.forEach((c: any) => {
      const tInfo = taskMap[c.task_id];
      if (tInfo) {
        completedKeys.add(`${tInfo.dayNumber}_${tInfo.title}`);
      }
    });
    
    return {
      totalTasks: allTaskKeys.size || 60,
      completedCount: completedKeys.size,
      completedKeys
    };
  }, [program, completions]);
  
  const progressPercent = Math.round((completedCount / totalTasks) * 100);
  const currentStreak = calculateStreak();

  const stats = [
    { label: 'Total Completions', value: completedCount, icon: CheckCircle2, color: '#4CAF50' },
    { label: 'Current Streak', value: `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`, icon: Zap, color: '#FF9800' },
    { label: 'Neural Expansion', value: `${progressPercent}%`, icon: TrendingUp, color: '#D4AF37' },
    { label: 'Milestones', value: Math.floor(completedCount / 10), icon: Award, color: '#2196F3' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Growth Metrics</Typography>
        <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Quantifying your evolution and neural integration.</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                backgroundColor: `${stat.color}10`, 
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <stat.icon size={24} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{stat.value}</Typography>
              <Typography variant="body2" sx={{ color: '#B0B0B0', fontWeight: 600 }}>{stat.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Module Breakdown</Typography>
            <Stack spacing={4}>
              {program?.modules?.map((module: any) => {
                const modTasks = module.lessons?.flatMap((l: any) => l.tasks || []) || [];
                const modCompletions = modTasks.filter((t: any) => {
                  const lesson = module.lessons.find((l: any) => l.tasks?.some((tk: any) => tk.id === t.id));
                  return completedKeys.has(`${lesson?.day_number || 1}_${t.title}`);
                });
                const modPercent = modTasks.length > 0 ? Math.round((modCompletions.length / modTasks.length) * 100) : 0;

                return (
                  <Box key={module.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{module.title}</Typography>
                      <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 700 }}>{modPercent}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={modPercent} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4, 
                        backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                        '& .MuiLinearProgress-bar': { backgroundColor: '#D4AF37' } 
                      }} 
                    />
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 4, height: '100%', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Consistency Map</Typography>
            
            {/* Generate last 28 days */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {[...Array(28)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - i));
                const dateStr = date.toISOString().split('T')[0];
                
                const dayCompletions = completions.filter((c: any) => 
                  new Date(c.completed_at).toISOString().split('T')[0] === dateStr
                );
                
                const hasCompletions = dayCompletions.length > 0;
                const intensity = Math.min(1, dayCompletions.length / 3); // Max color at 3 completions

                return (
                  <Tooltip 
                    key={i} 
                    title={`${date.toLocaleDateString()}: ${dayCompletions.length} tasks`}
                    arrow
                    placement="top"
                  >
                    <Box 
                      sx={{ 
                        aspectRatio: '1/1', 
                        borderRadius: 1, 
                        backgroundColor: hasCompletions ? '#D4AF37' : 'rgba(255, 255, 255, 0.05)',
                        opacity: hasCompletions ? (0.3 + intensity * 0.7) : 1,
                        cursor: 'pointer',
                        transition: 'transform 0.1s',
                        '&:hover': { transform: 'scale(1.1)', zIndex: 1 }
                      }} 
                    />
                  </Tooltip>
                );
              })}
            </Box>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#666' }}>28 Days Ago</Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>Today</Typography>
            </Box>

            <Typography variant="body2" sx={{ color: '#B0B0B0', mt: 3, textAlign: 'center' }}>
              Your daily commitment to neural rewiring is visible here. Every block represents a step toward your higher self.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Progress;

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
import { useProgramEngine } from '@/lib/programEngine';
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
    };
    findUserId();
  }, [user]);

  const engine = useProgramEngine(targetUserId || '');
  const isLoading = engine.isLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  const program = engine.program;
  const enrollment = engine.enrollment;
  const visibleModules = engine.visibleModules;
  const completedKeys = engine.completedKeys;
  const completedCount = engine.completedTasksCount;
  const totalTasks = engine.totalTasksCount;
  const progressPercent = engine.programCompletionPercent;
  const currentStreak = engine.currentStreak;
  const completions = engine.getCompletedTasks();

  const stats = [
    { label: 'Total Completions', value: completedCount, icon: CheckCircle2, color: '#00D4A3' },
    { label: 'Current Streak', value: `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`, icon: Zap, color: '#D4AF37' },
    { label: 'Neural Expansion', value: `${progressPercent}%`, icon: TrendingUp, color: '#00D4A3' },
    { label: 'Milestones', value: Math.floor(completedCount / 10), icon: Award, color: '#F0D27A' },
  ];

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ mb: 5 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            mb: 1, 
            fontFamily: '"Playfair Display", serif',
            letterSpacing: '0.01em',
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
            textShadow: '0 2px 10px rgba(0, 212, 163, 0.1)'
          }}
        >
          Growth Metrics
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-secondary)', fontSize: { xs: '0.9rem', sm: '1rem' } }}>Quantifying your evolution and neural integration.</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Paper 
              sx={{ 
                p: { xs: 2.5, sm: 3 }, 
                textAlign: 'center', 
                backgroundColor: 'rgba(7, 24, 21, 0.35)', 
                backdropFilter: 'blur(16px)',
                borderRadius: '24px',
                border: '1px solid rgba(0, 212, 163, 0.15)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'rgba(0, 212, 163, 0.35)',
                  boxShadow: '0 8px 25px rgba(0, 212, 163, 0.1)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                backgroundColor: `${stat.color}15`, 
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: `0 0 15px ${stat.color}15`
              }}>
                <stat.icon size={22} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontFamily: '"Playfair Display", serif', color: '#FFFFFF' }}>{stat.value}</Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper 
            sx={{ 
              p: { xs: 3, sm: 4.5 }, 
              height: '100%',
              backgroundColor: 'rgba(7, 24, 21, 0.35)', 
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
              border: '1px solid rgba(0, 212, 163, 0.15)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, fontFamily: '"Playfair Display", serif' }}>Module Breakdown</Typography>
            <Stack spacing={3.5}>
              {visibleModules?.map((module: any) => {
                const modTasks = module.lessons?.flatMap((l: any) => l.tasks || []) || [];
                const modCompletions = modTasks.filter((t: any) => {
                  const lesson = module.lessons.find((l: any) => l.tasks?.some((tk: any) => tk.id === t.id));
                  return completedKeys.has(`${lesson?.day_number || 1}_${t.title}`);
                });
                const modPercent = modTasks.length > 0 ? Math.round((modCompletions.length / modTasks.length) * 100) : 0;

                return (
                  <Box key={module.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#EAEAEA' }}>{module.title}</Typography>
                      <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 700 }}>{modPercent}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={modPercent} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4, 
                        backgroundColor: 'rgba(212, 175, 55, 0.05)', 
                        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00D4A3 0%, #D4AF37 100%)' } 
                      }} 
                    />
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            sx={{ 
              p: { xs: 3, sm: 4.5 }, 
              height: '100%', 
              background: 'linear-gradient(135deg, rgba(7, 24, 21, 0.45) 0%, rgba(4, 13, 12, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(0, 212, 163, 0.15)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, fontFamily: '"Playfair Display", serif' }}>Consistency Map</Typography>
            
            {/* Generate last 28 days */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
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
                        borderRadius: '6px', 
                        backgroundColor: hasCompletions ? '#00D4A3' : 'rgba(255, 255, 255, 0.04)',
                        boxShadow: hasCompletions ? '0 0 10px rgba(0, 212, 163, 0.3)' : 'none',
                        opacity: hasCompletions ? (0.4 + intensity * 0.6) : 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          transform: 'scale(1.15)', 
                          zIndex: 1,
                          backgroundColor: hasCompletions ? '#39E7C0' : 'rgba(255, 255, 255, 0.08)'
                        }
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

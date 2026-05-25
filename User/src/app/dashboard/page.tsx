import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  LinearProgress,
  Avatar,
  IconButton,
  CircularProgress
} from '@mui/material';
import { 
  Flame, 
  Play, 
  BookOpen, 
  Calendar, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { useMyEnrollment } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = React.useState<string | null>(user?.id || null);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const findUserId = async () => {
      const email = user?.email || 'aenoshjoy@gmail.com';
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (data) {
        setTargetUserId(data.id);
        setProfile(data);
      }
    };
    findUserId();
  }, [user]);

  const { data: enrollment, isLoading } = useMyEnrollment(targetUserId || '');

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const program = enrollment?.programs;
  const completions = enrollment?.task_completions || [];
  
  // Build a map of taskId to title and dayNumber, and get unique tasks
  const { totalTasks, completedCount } = React.useMemo(() => {
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
      totalTasks: allTaskKeys.size || 1, // Fallback to avoid division by zero
      completedCount: completedKeys.size
    };
  }, [program, completions]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }
  
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  
  // Dynamic Duration: Max day_number from lessons
  const totalDays = program?.modules?.reduce((acc: number, mod: any) => {
    const maxModDay = mod.lessons?.reduce((lMax: number, lesson: any) => Math.max(lMax, lesson.day_number || 0), 0) || 0;
    return Math.max(acc, maxModDay);
  }, 0) || program?.duration_days || 30;

  // Current Day: Based on latest completed task's lesson day or days since start
  const startedAt = enrollment?.started_at ? new Date(enrollment.started_at) : new Date();
  const calendarDays = Math.max(1, Math.floor((new Date().getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  // We'll use calendar days as the "current day" but capped at total days
  const currentDay = Math.min(calendarDays, totalDays);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Good {getTimeGreeting()}, {profile?.full_name?.split(' ')[0] || 'Explorer'}
        </Typography>
        <Typography variant="body1" sx={{ color: '#B0B0B0' }}>
          Welcome back to your daily expansion.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper 
            sx={{ 
              p: 4, 
              height: '100%', 
              background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.9) 0%, rgba(10, 10, 15, 1) 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {enrollment ? (
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="overline" sx={{ color: '#D4AF37', fontWeight: 700, letterSpacing: 2 }}>
                  CURRENT PROGRAM
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, mb: 1 }}>
                  {program?.title || 'Program Title'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 4, maxWidth: '80%' }}>
                  {program?.description || 'Deep neural rewiring for emotional sovereignty and cognitive clarity.'}
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Day {currentDay} of {totalDays}</Typography>
                    <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 600 }}>{progressPercent}% Complete</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercent} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#D4AF37',
                        borderRadius: 4,
                      }
                    }} 
                  />
                </Box>

                <Button 
                  component={Link}
                  to="/today"
                  variant="contained" 
                  startIcon={<Play size={18} fill="currentColor" />}
                  sx={{ 
                    backgroundColor: '#D4AF37', 
                    color: '#0B0B0F',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': { backgroundColor: '#B8962D' }
                  }}
                >
                  Continue Today's Practice
                </Button>
              </Box>
            ) : (
              <Box sx={{ position: 'relative', zIndex: 1, py: 4, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>No Active Program</Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 4 }}>
                  Explore our programs to begin your transformation journey.
                </Typography>
                <Button variant="contained" component={Link} to="/program" sx={{ backgroundColor: '#D4AF37', color: '#0B0B0F' }}>Explore Programs</Button>
              </Box>
            )}

            <Box 
              sx={{ 
                position: 'absolute', 
                top: -20, 
                right: -20, 
                width: 200, 
                height: 200, 
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
                zIndex: 0
              }} 
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 4, height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box 
              sx={{ 
                mx: 'auto',
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Flame size={40} color="#D4AF37" fill="#D4AF37" />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>{completedCount > 0 ? 5 : 0}</Typography>
            <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 600, mb: 2 }}>DAY STREAK</Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
              Consistency is the key to neural rewiring.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 2 }}>Quick Actions</Typography>
          <Grid container spacing={2}>
            {[
              { label: 'View Program', icon: BookOpen, path: '/program' },
              { label: 'Sessions', icon: Calendar, path: '/sessions' },
              { label: 'Stats', icon: TrendingUp, path: '/progress' },
            ].map((action) => (
              <Grid size={{ xs: 12, sm: 4 }} key={action.label}>
                <Paper 
                  component={Link}
                  to={action.path}
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'rgba(212, 175, 55, 0.5)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <action.icon size={24} color="#D4AF37" />
                    <Typography sx={{ fontWeight: 600 }}>{action.label}</Typography>
                  </Box>
                  <ArrowRight size={18} color="#B0B0B0" />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;


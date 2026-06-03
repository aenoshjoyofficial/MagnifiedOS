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
      if (user?.id) {
        setTargetUserId(user.id);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
      // No fallback to hardcoded email - if user is not authenticated, show empty state
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

  // Calculate streak from real task completion dates
  const calculateStreak = React.useCallback(() => {
    if (!completions || completions.length === 0) return 0;

    const formatNYDate = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = formatter.formatToParts(d);
      const y = parts.find(p => p.type === 'year')!.value;
      const m = parts.find(p => p.type === 'month')!.value;
      const day = parts.find(p => p.type === 'day')!.value;
      return `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const getNYMidnight = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = formatter.formatToParts(d);
      const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
      const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-indexed
      const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
      return new Date(Date.UTC(year, month, day));
    };

    // Collect unique calendar dates (YYYY-MM-DD) from completions in Eastern Time
    const dates = [...new Set(
      completions.map((c: any) => {
        return formatNYDate(new Date(c.completed_at));
      })
    )] as string[];
    dates.sort().reverse(); // Most recent first

    // Build today and yesterday with time zeroed out in Eastern Time
    const todayNYDate = getNYMidnight(new Date());
    const today = formatNYDate(todayNYDate);

    const yesterdayNYDate = new Date(todayNYDate);
    yesterdayNYDate.setDate(todayNYDate.getDate() - 1);
    const yesterday = formatNYDate(yesterdayNYDate);

    // Streak is broken if no completions today or yesterday in Eastern Time
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    // Count consecutive days going backward from the most recent completion
    let streak = 0;
    const baseDate = new Date(dates[0] + 'T00:00:00');
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(baseDate);
      expectedDate.setDate(baseDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];

      if (dates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [completions]);

  const currentStreak = calculateStreak();
  
  // Build a map of taskId to title and dayNumber, and get unique tasks
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
      totalTasks: allTaskKeys.size || 1, // Fallback to avoid division by zero
      completedCount: completedKeys.size,
      completedKeys
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

  // Current Day: Based on first uncompleted unlocked day, or calendar days since start
  const startedAt = enrollment?.started_at ? new Date(enrollment.started_at) : new Date();
  const calendarDays = (() => {
    if (!enrollment) return 1;
    const getNYDate = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = formatter.formatToParts(d);
      const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
      const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-indexed
      const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
      return new Date(Date.UTC(year, month, day));
    };
    const startNY = getNYDate(startedAt);
    const todayNY = getNYDate(new Date());
    return Math.max(1, Math.floor((todayNY.getTime() - startNY.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  })();

  const currentDay = React.useMemo(() => {
    if (!program?.modules) return Math.min(calendarDays, totalDays);

    const allLessons = program.modules.flatMap((m: any) => m.lessons || [])
      .sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0)) || [];

    if (allLessons.length === 0) return Math.min(calendarDays, totalDays);

    // Lock helper: A lesson D is locked if D > calendarDays AND any previous day is incomplete
    const isLocked = (dayNum: number) => {
      if (dayNum <= 1) return false;
      if (dayNum <= calendarDays) return false;
      const prevLessons = allLessons.filter((l: any) => l.day_number < dayNum);
      return prevLessons.some((l: any) => {
        const tasks = l.tasks || [];
        if (tasks.length === 0) return false;
        const completed = tasks.filter((t: any) => completedKeys.has(`${l.day_number}_${t.title}`));
        return completed.length < tasks.length;
      });
    };

    // Find the first uncompleted unlocked day
    const firstIncompleteUnlocked = allLessons.find((l: any) => {
      if (isLocked(l.day_number)) return false;
      const tasks = l.tasks || [];
      if (tasks.length === 0) return false;
      const completed = tasks.filter((t: any) => completedKeys.has(`${l.day_number}_${t.title}`));
      return completed.length < tasks.length;
    });

    if (firstIncompleteUnlocked) {
      return firstIncompleteUnlocked.day_number;
    }

    // Default to highest unlocked day if all unlocked days are completed
    const unlockedLessons = allLessons.filter((l: any) => !isLocked(l.day_number));
    if (unlockedLessons.length > 0) {
      return unlockedLessons[unlockedLessons.length - 1].day_number;
    }

    return Math.min(calendarDays, totalDays);
  }, [program, calendarDays, totalDays, completedKeys]);

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
          Good {getTimeGreeting()}, {profile?.full_name?.split(' ')[0] || 'Explorer'}
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.02em', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Welcome back to your daily expansion.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper 
            sx={{ 
              p: { xs: 3, sm: 4.5 }, 
              height: '100%', 
              background: 'linear-gradient(135deg, rgba(7, 24, 21, 0.5) 0%, rgba(4, 13, 12, 0.9) 100%)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              border: '1px solid rgba(0, 212, 163, 0.18)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 212, 163, 0.08)',
            }}
          >
            {enrollment ? (
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="overline" sx={{ color: '#D4AF37', fontWeight: 800, letterSpacing: '0.15em', fontFamily: '"Outfit", sans-serif' }}>
                  CURRENT PROGRAM
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    mt: 1.5, 
                    mb: 1.5, 
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                    fontFamily: '"Playfair Display", serif',
                    letterSpacing: '0.01em'
                  }}
                >
                  {program?.title || 'Program Title'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 4, maxWidth: { xs: '100%', sm: '85%' }, lineHeight: 1.6 }}>
                  {program?.description || 'Deep neural rewiring for emotional sovereignty and cognitive clarity.'}
                </Typography>

                <Box sx={{ mb: 4.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: '0.02em', color: '#EAEAEA' }}>
                      Day {currentDay} of {totalDays} Integration
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                      {progressPercent}% Complete
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercent} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'rgba(212, 175, 55, 0.05)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #00D4A3 0%, #D4AF37 100%)',
                        borderRadius: 4,
                      }
                    }} 
                  />
                </Box>

                <Button 
                  component={Link}
                  to={`/today?day=${currentDay}`}
                  variant="contained" 
                  color="primary"
                  startIcon={<Play size={18} fill="currentColor" />}
                  sx={{ 
                    px: { xs: 3, sm: 5 },
                    py: 1.75,
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    borderRadius: '30px',
                    boxShadow: '0 4px 20px rgba(0, 212, 163, 0.25)',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Continue Today's Practice
                </Button>
              </Box>
            ) : (
              <Box sx={{ position: 'relative', zIndex: 1, py: 4, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, fontFamily: '"Playfair Display", serif' }}>No Active Program</Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 4 }}>
                  Explore our programs to begin your transformation journey.
                </Typography>
                <Button variant="contained" color="primary" component={Link} to="/program">Explore Programs</Button>
              </Box>
            )}

            <Box 
              sx={{ 
                position: 'absolute', 
                top: -20, 
                right: -20, 
                width: 250, 
                height: 250, 
                background: 'radial-gradient(circle, rgba(0, 212, 163, 0.12) 0%, transparent 70%)',
                zIndex: 0
              }} 
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            sx={{ 
              p: { xs: 3, sm: 4.5 }, 
              height: '100%', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(7, 24, 21, 0.4) 0%, rgba(4, 13, 12, 0.85) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(0, 212, 163, 0.15)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(212, 175, 55, 0.05)',
            }}
          >
            <Box 
              sx={{ 
                mx: 'auto',
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                backgroundColor: 'rgba(212, 175, 55, 0.06)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                boxShadow: '0 0 25px rgba(212, 175, 55, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}
            >
              <Flame size={42} color="#D4AF37" fill="#D4AF37" />
            </Box>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 0.5, fontFamily: '"Playfair Display", serif', color: '#FFFFFF' }}>
              {currentStreak}
            </Typography>
            <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 800, letterSpacing: '0.15em', mb: 2, fontFamily: '"Outfit", sans-serif' }}>
              DAY STREAK
            </Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0', lineHeight: 1.5 }}>
              Consistency is the key to neural rewiring.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800, 
              mb: 2.5, 
              mt: 3, 
              fontFamily: '"Playfair Display", serif',
              letterSpacing: '0.02em'
            }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
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
                    borderRadius: '20px',
                    backgroundColor: 'rgba(7, 24, 21, 0.35)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(0, 212, 163, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                      borderColor: 'rgba(0, 212, 163, 0.45)',
                      boxShadow: '0 8px 30px rgba(0, 212, 163, 0.18)',
                      backgroundColor: 'rgba(7, 24, 21, 0.5)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <action.icon size={22} color="#00D4A3" />
                    <Typography sx={{ fontWeight: 700, color: '#EAEAEA', fontSize: '0.95rem' }}>{action.label}</Typography>
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


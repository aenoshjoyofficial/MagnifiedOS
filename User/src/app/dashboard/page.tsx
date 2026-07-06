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
import { useMyLastCompletedEnrollment, useStartNewCycle } from '@/lib/queries';
import { useProgramEngine } from '@/lib/programEngine';
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
    };
    findUserId();
  }, [user]);

  const { data: completedEnrollment, isLoading: isCompletedLoading } = useMyLastCompletedEnrollment(targetUserId || '');
  const startNewCycleMutation = useStartNewCycle();

  const engine = useProgramEngine(targetUserId || '');
  const isLoading = engine.isLoading || isCompletedLoading;

  const enrollment = engine.enrollment;
  const program = engine.program;

  const {
    currentDay,
    totalDays,
    progressPercent,
    prevIncompleteDaysCount
  } = engine.getProgramSummary();
  const currentStreak = engine.currentStreak;

  const getTimeGreeting = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 5,
        gap: 2
      }}>
        <Box>
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
        <Box sx={{ 
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src="/logo.png" 
            alt="Magnified Existence Logo" 
            style={{ 
              width: '64px', 
              height: '64px', 
              objectFit: 'contain',
              borderRadius: '50%',
              border: '2px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.08) rotate(5deg)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.45)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.25)';
            }}
          />
        </Box>
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
                      Day {currentDay} of {totalDays} Integration{enrollment?.cycle_number && ` (Cycle ${enrollment.cycle_number})`}
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

                {prevIncompleteDaysCount > 0 && (
                  <Box sx={{ 
                    mb: 4, 
                    p: 2.5, 
                    borderRadius: '16px', 
                    backgroundColor: 'rgba(212, 175, 55, 0.05)', 
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: '#D4AF37', 
                      boxShadow: '0 0 10px #D4AF37, 0 0 20px #D4AF37' 
                    }} />
                    <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                      You have {prevIncompleteDaysCount} incomplete previous practice{prevIncompleteDaysCount > 1 ? 's' : ''} to catch up.
                    </Typography>
                  </Box>
                )}

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
            ) : completedEnrollment ? (
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="overline" sx={{ color: '#D4AF37', fontWeight: 800, letterSpacing: '0.15em', fontFamily: '"Outfit", sans-serif' }}>
                  PROGRAM COMPLETED
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
                  {completedEnrollment.programs?.title || 'Casey June Protocol'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 4, maxWidth: { xs: '100%', sm: '85%' }, lineHeight: 1.6 }}>
                  You have successfully integrated all evolution protocols for Cycle {completedEnrollment.cycle_number || 1}.
                </Typography>
                <Button 
                  onClick={async () => {
                    await startNewCycleMutation.mutateAsync({
                      userId: completedEnrollment.user_id,
                      programId: completedEnrollment.program_id,
                      cycleNumber: (completedEnrollment.cycle_number || 1) + 1
                    });
                  }}
                  disabled={startNewCycleMutation.isPending}
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
                  {startNewCycleMutation.isPending ? 'Starting...' : 'Start New Cycle'}
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


'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Button,
  Stack,
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  PlayCircle,
  Trophy,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Mic,
  FileText
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import AudioTask from '@/components/Tasks/AudioTask';
import VideoTask from '@/components/Tasks/VideoTask';
import TextTask from '@/components/Tasks/TextTask';
import ImageTask from '@/components/Tasks/ImageTask';
import PdfTask from '@/components/Tasks/PdfTask';
import GalleryTask from '@/components/Tasks/GalleryTask';
import ChecklistTask from '@/components/Tasks/ChecklistTask';
import { useAuthStore } from '@/store/useStore';
import { useCompleteTask, useCompleteEnrollment, useStartNewCycle } from '@/lib/queries';
import { useProgramEngine } from '@/lib/programEngine';
import { supabase } from '@/lib/supabase';
import { Snackbar, Alert } from '@mui/material';



const TodayPractice = () => {
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

  const engine = useProgramEngine(targetUserId || '');
  const isLoading = engine.isLoading;
  const completeTaskMutation = useCompleteTask();
  const completeEnrollmentMutation = useCompleteEnrollment();
  const startNewCycleMutation = useStartNewCycle();

  const [hasLoadedInitial, setHasLoadedInitial] = React.useState(false);
  const [isDaySubmitted, setIsDaySubmitted] = React.useState(false);
  const [completedCycleInfo, setCompletedCycleInfo] = React.useState<any>(null);
  const [visibleInstructions, setVisibleInstructions] = React.useState<Record<string, boolean>>({});

  const [notification, setNotification] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const toggleInstruction = (windowName: string) => {
    setVisibleInstructions(prev => ({
      ...prev,
      [windowName]: !prev[windowName]
    }));
  };

  const [searchParams] = useSearchParams();
  const dayParam = searchParams.get('day');

  const program = engine.program;
  const enrollment = engine.enrollment;
  const chambers = engine.chambers;
  const completedKeys = engine.completedKeys;
  const daysSinceStart = engine.daysSinceStart;
  const totalDays = engine.totalDays;

  const viewedDay = React.useMemo(() => {
    if (dayParam) return Math.min(parseInt(dayParam, 10), totalDays);
    return engine.activeDay;
  }, [dayParam, engine.activeDay, totalDays]);

  const allLessons = React.useMemo(() => {
    return engine.getDailyLessons(viewedDay);
  }, [engine, viewedDay]);

  const currentLesson = React.useMemo(() => {
    return engine.getCurrentLesson(viewedDay);
  }, [engine, viewedDay]);

  const tasks = React.useMemo(() => {
    return engine.getDailyTasks(viewedDay);
  }, [engine, viewedDay]);

  const { completedTasks, isDayComplete } = React.useMemo(() => {
    const list = tasks.filter((t: any) => completedKeys.has(`${viewedDay}_${t.title}`));
    const complete = list.length === tasks.length && tasks.length > 0;
    return {
      completedTasks: list,
      isDayComplete: complete
    };
  }, [tasks, completedKeys, viewedDay]);

  React.useEffect(() => {
    if (enrollment) {
      const isPastDay = viewedDay < daysSinceStart && viewedDay < totalDays;
      setIsDaySubmitted(isPastDay ? isDayComplete : false);
      setHasLoadedInitial(true);
    }
  }, [enrollment, viewedDay, isDayComplete, daysSinceStart, totalDays]);

  const tasksCompleted = engine.completedTasksCount;
  const totalProgramTasks = engine.totalTasksCount;

  const handleFinishDay = async () => {
    console.log("Finish Day clicked");
    try {
      if (viewedDay === totalDays && enrollment) {
        const pct = Math.round((tasksCompleted / totalProgramTasks) * 100);
        const cycleInfo = {
          cycle_number: enrollment.cycle_number || 1,
          program_title: program?.title || 'Program',
          user_id: enrollment.user_id,
          program_id: enrollment.program_id
        };
        await completeEnrollmentMutation.mutateAsync({
          enrollmentId: enrollment.id,
          cycleNumber: enrollment.cycle_number || 1,
          startedAt: enrollment.started_at,
          userId: enrollment.user_id,
          programId: enrollment.program_id,
          tasksCompleted,
          totalTasks: totalProgramTasks,
          completionPercentage: pct
        });
        setCompletedCycleInfo(cycleInfo);
      }
      setIsDaySubmitted(true);
      showNotification("Day completion recorded successfully!", "success");
    } catch (err: any) {
      console.error("Day completion failed:", err);
      showNotification(err?.message || "Failed to complete day. Please check your connection and try again.", "error");
    }
  };



  const visibleOrderedChambers = React.useMemo(() => {
    return engine.getVisibleChambers();
  }, [engine]);

  // IMPORTANT: lockedTaskIds must be declared BEFORE any early returns to satisfy Rules of Hooks
  const lockedTaskIds = React.useMemo(() => {
    const orderedTasks: any[] = [];
    visibleOrderedChambers.forEach((chamber: any) => {
      const module = engine.visibleModules.find((m: any) => {
        const foundChamber = engine.getChamberForModule(m);
        return foundChamber && foundChamber.id === chamber.id;
      });
      if (module) {
        const lesson = module.lessons?.find((l: any) => l.day_number === viewedDay);
        if (lesson && lesson.tasks) {
          const sortedTasks = [...lesson.tasks].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
          orderedTasks.push(...sortedTasks);
        }
      }
    });

    const lockedSet = new Set<string>();
    let foundFirstUncompleted = false;

    orderedTasks.forEach((t: any) => {
      const isTaskComp = completedKeys.has(`${viewedDay}_${t.title}`);
      if (!isTaskComp) {
        if (!foundFirstUncompleted) {
          foundFirstUncompleted = true;
        } else {
          lockedSet.add(t.id);
        }
      }
    });

    return lockedSet;
  }, [visibleOrderedChambers, engine.visibleModules, viewedDay, completedKeys]);

  const handleTaskComplete = async (taskId: string) => {
    if (!enrollment) return;
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task) return;
    if (completedKeys.has(`${viewedDay}_${task.title}`)) return;

    if (lockedTaskIds.has(taskId)) {
      showNotification("First complete the previous task in order to complete this task.", "warning");
      return;
    }

    // Prevent duplicate parallel requests if the mutation is already in progress for this task
    if (completeTaskMutation.isPending && completeTaskMutation.variables?.taskId === taskId) {
      return;
    }
    
    try {
      await completeTaskMutation.mutateAsync({
        enrollmentId: enrollment.id,
        taskId: taskId,
        userId: user?.id
      });
      showNotification(`Task "${task.title}" completed! Next task unlocked.`, "success");
    } catch (err: any) {
      console.error("Task completion failed:", err);
      showNotification(err?.message || "Failed to save task completion. Please try again.", "error");
    }
  };

  // Early returns must come AFTER all hooks
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  // Render Program Complete screen if final day was completed and submitted
  if (isDaySubmitted && viewedDay === totalDays && completedCycleInfo) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', pb: 10, pt: 5, px: 2 }}>
        <Box 
          sx={{ 
            p: 6, 
            borderRadius: '24px', 
            backgroundColor: 'rgba(7, 24, 21, 0.45)', 
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(212, 175, 55, 0.3)', 
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(212, 175, 55, 0.1)',
            textAlign: 'center'
          }}
        >
          <Trophy size={64} color="#D4AF37" style={{ marginBottom: 24, filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.4))' }} />
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800, 
              color: '#D4AF37', 
              mb: 2, 
              fontFamily: '"Playfair Display", serif',
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}
          >
            Protocol Completed
          </Typography>
          <Typography variant="body1" sx={{ color: '#EAEAEA', mb: 1, fontWeight: 700, fontSize: '1.1rem' }}>
            Congratulations! You have completed {completedCycleInfo.program_title}.
          </Typography>
          <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 800, letterSpacing: '0.05em', fontFamily: '"Outfit", sans-serif' }}>
              CURRENT CYCLE: {completedCycleInfo.cycle_number}
            </Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
              COMPLETION DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 5, lineHeight: 1.6 }}>
            Your daily evolution protocols have been successfully integrated. You can now choose to restart the program as a new cycle.
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              onClick={async () => {
                await startNewCycleMutation.mutateAsync({
                  userId: completedCycleInfo.user_id,
                  programId: completedCycleInfo.program_id,
                  cycleNumber: completedCycleInfo.cycle_number + 1
                });
                window.location.href = '/dashboard';
              }}
              disabled={startNewCycleMutation.isPending}
              sx={{ 
                background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
                color: '#040D0C',
                px: 5,
                py: 2,
                fontSize: '1rem',
                fontWeight: 800,
                borderRadius: '30px',
                textTransform: 'none',
                boxShadow: '0 8px 32px rgba(0, 212, 163, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
                  boxShadow: '0 12px 40px rgba(0, 212, 163, 0.45)',
                }
              }}
            >
              {startNewCycleMutation.isPending ? 'Starting...' : 'Start New Cycle'}
            </Button>
            <Button 
              variant="outlined" 
              component={Link} 
              to="/dashboard" 
              sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.2)', 
                color: '#EAEAEA',
                borderRadius: '30px',
                px: 5,
                py: 2,
                fontWeight: 850,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#EAEAEA',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              Return to Dashboard
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (!enrollment) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">No active enrollment found.</Typography>
        <Button component={Link} to="/dashboard" sx={{ mt: 2 }}>Back to Dashboard</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button 
            component={Link} 
            to="/dashboard" 
            startIcon={<ChevronLeft size={18} />}
            sx={{ color: '#B0B0B0', p: 0, minWidth: 0, '&:hover': { background: 'transparent', color: '#EAEAEA' } }}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Typography variant="overline" sx={{ color: '#D4AF37', fontWeight: 700, letterSpacing: 2 }}>
          DAY {viewedDay} • {currentLesson?.title?.toUpperCase() || 'PRACTICE'}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          justifyContent: 'space-between',
          gap: 2, 
          mt: 0.5, 
          mb: 3 
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800, 
              flexGrow: 1,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              fontFamily: '"Playfair Display", serif',
              letterSpacing: '0.01em',
              color: '#FFFFFF'
            }}
          >
            {currentLesson?.title || 'Daily Integration'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
            <IconButton 
              disabled={viewedDay <= 0}
              component={Link}
              to={`/today?day=${viewedDay - 1}`}
              sx={{ color: '#D4AF37', '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.05)' } }}
            >
              <ChevronLeft size={20} />
            </IconButton>
            <IconButton 
              disabled={viewedDay >= totalDays || (viewedDay >= daysSinceStart && !isDayComplete)}
              component={Link}
              to={`/today?day=${viewedDay + 1}`}
              sx={{ color: '#D4AF37', '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.05)' } }}
            >
              <ChevronRight size={20} />
            </IconButton>
          </Box>
        </Box>

        {/* Daily Progress (Moved to Top) */}
        <Box 
          sx={{ 
            p: 2.5, 
            borderRadius: 4, 
            backgroundColor: 'rgba(5, 35, 30, 0.25)', 
            border: '1px solid rgba(0, 212, 163, 0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Daily Progress</Typography>
            <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 600 }}>{completedTasks.length}/{tasks.length} Tasks</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'rgba(212, 175, 55, 0.05)',
              '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00D4A3 0%, #D4AF37 100%)' }
            }} 
          />
        </Box>
      </Box>

      {visibleOrderedChambers && visibleOrderedChambers.length > 0 ? (
        <Stack spacing={4} sx={{ mb: 6 }}>
          {visibleOrderedChambers.map((chamber: any) => {
            const module = engine.visibleModules.find((m: any) => {
              const foundChamber = engine.getChamberForModule(m);
              return foundChamber && foundChamber.id === chamber.id;
            });
            if (!module) return null;

            const lesson = module.lessons?.find((l: any) => l.day_number === viewedDay);
            if (!lesson) return null;

            const lessonTasks = lesson.tasks || [];
            if (lessonTasks.length === 0) return null;

            const sortedTasks = [...lessonTasks].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

            return (
              <Box key={chamber.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Premium Accentuated Chamber Header */}
                <Box 
                  sx={{ 
                    borderLeft: '4px solid',
                    borderColor: '#00D4A3',
                    pl: 3,
                    py: 1.25,
                    textAlign: 'left',
                    background: 'linear-gradient(90deg, rgba(0, 212, 163, 0.04) 0%, transparent 100%)',
                    borderRadius: '0 16px 16px 0',
                    borderBottom: '1px solid rgba(0, 212, 163, 0.05)',
                    mb: 1
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#D4AF37', 
                      fontWeight: 800, 
                      letterSpacing: '0.15em', 
                      textTransform: 'uppercase',
                      display: 'block',
                      fontFamily: '"Outfit", sans-serif'
                    }}
                  >
                    CHAMBER {chamber.display_order}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: '#FFFFFF', 
                      fontWeight: 800, 
                      fontSize: '1.4rem', 
                      mt: 0.5, 
                      fontFamily: '"Playfair Display", serif', 
                      letterSpacing: '0.02em',
                      textShadow: '0 2px 10px rgba(0, 212, 163, 0.15)'
                    }}
                  >
                    {chamber.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#F0D27A', fontSize: '0.85rem', mt: 0.5, fontWeight: 600, letterSpacing: '0.02em', opacity: 0.9 }}>
                    Anchor: {lesson.title}
                  </Typography>

                  {lesson.description && (
                    <Box sx={{ mt: 1.5 }}>
                      <Button 
                        onClick={() => toggleInstruction(chamber.id)} 
                        sx={{ 
                          color: '#D4AF37', 
                          fontSize: '0.75rem', 
                          p: 0, 
                          minWidth: 0, 
                          textTransform: 'none', 
                          fontWeight: 700,
                          '&:hover': { background: 'transparent', textDecoration: 'underline' } 
                        }}
                      >
                        {visibleInstructions[chamber.id] ? 'Hide Instructions' : 'View Instructions'}
                      </Button>
                      {visibleInstructions[chamber.id] && (
                        <Box 
                          sx={{ 
                            mt: 2, 
                            p: 2.5, 
                            borderRadius: '16px', 
                            backgroundColor: 'rgba(7, 24, 21, 0.25)', 
                            border: '1px dashed rgba(212, 175, 55, 0.2)', 
                            color: '#B0B0B0', 
                            fontSize: '0.85rem', 
                            lineHeight: 1.6,
                            textAlign: 'left',
                            '& ul, & ol': { pl: 3, my: 0.5 },
                            '& p': { my: 0.5 }
                          }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: lesson.description }} />
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Nested Tasks for this chamber */}
                <Stack spacing={1.5} sx={{ pl: { xs: 1.5, sm: 3 } }}>
                  {sortedTasks.map((task: any) => {
                    const globalIndex = tasks.findIndex((t: any) => t.id === task.id);
                    return (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        index={globalIndex} 
                        isCompleted={completedKeys.has(`${viewedDay}_${task.title}`)}
                        isLocked={lockedTaskIds.has(task.id)}
                        isPending={completeTaskMutation.isPending && completeTaskMutation.variables?.taskId === task.id}
                        onComplete={() => handleTaskComplete(task.id)} 
                      />
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Typography sx={{ textAlign: 'center', py: 4, color: '#666' }}>No active chambers or tasks found for today.</Typography>
      )}

      {/* Global Actions */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        {isDaySubmitted ? (
          viewedDay === totalDays ? (
            null
          ) : (
            <Box 
              sx={{ 
                p: 4.5, 
                borderRadius: '24px', 
                backgroundColor: 'rgba(7, 24, 21, 0.45)', 
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(212, 175, 55, 0.3)', 
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(212, 175, 55, 0.1)',
                textAlign: 'center'
              }}
            >
              <Trophy size={48} color="#D4AF37" style={{ marginBottom: 16 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#D4AF37', mb: 1, fontFamily: '"Playfair Display", serif' }}>Day Complete!</Typography>
              <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 3 }}>
                You have successfully integrated today's neural protocols.
              </Typography>
              <Button 
                variant="outlined" 
                component={Link} 
                to="/dashboard" 
                sx={{ 
                  borderColor: '#00D4A3', 
                  color: '#00D4A3',
                  borderRadius: '30px',
                  px: 4.5,
                  fontWeight: 800,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#39E7C0',
                    backgroundColor: 'rgba(0, 212, 163, 0.05)',
                  }
                }}
              >
                Return to Dashboard
              </Button>
            </Box>
          )
        ) : (
          <Button 
            variant="contained" 
            disabled={!isDayComplete || completeEnrollmentMutation.isPending}
            onClick={handleFinishDay}
            sx={{ 
              background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
              color: '#040D0C',
              px: 6,
              py: 2,
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: '30px',
              boxShadow: isDayComplete ? '0 8px 32px rgba(0, 212, 163, 0.25)' : 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
                boxShadow: '0 12px 40px rgba(0, 212, 163, 0.45)',
                transform: 'translateY(-1px)',
              },
              '&.Mui-disabled': { background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.2)' }
            }}
          >
            {completeEnrollmentMutation.isPending ? 'Completing Cycle...' : 
              isDayComplete ? (viewedDay === totalDays ? 'Complete Cycle & Submit Program' : 'Submit Day Practice') : 'Complete All Tasks to Finish Day'}
          </Button>
        )}
      </Box>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity} 
          sx={{ 
            width: '100%', 
            backgroundColor: notification.severity === 'error' ? '#ef5350' : notification.severity === 'warning' ? '#ff9800' : '#D4AF37', 
            color: '#040D0C',
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

const isExternalVideo = (url: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('vimeo.com') ||
    lowerUrl.endsWith('.mp4') ||
    lowerUrl.includes('.mp4?')
  );
};

const TaskCard = ({ task, index, isCompleted, isLocked, isPending, onComplete }: { task: any, index: number, isCompleted: boolean, isLocked: boolean, isPending: boolean, onComplete: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const mainUrl = task.content?.url || '';
  const resourceUrl = task.content?.resource_url || '';

  const isMainVideo = isExternalVideo(mainUrl);
  const isResourceVideo = isExternalVideo(resourceUrl);

  const showVideo = isMainVideo || isResourceVideo;
  const videoUrl = isMainVideo ? mainUrl : (isResourceVideo ? resourceUrl : '');
  const showAudio = task.type === 'audio' && mainUrl && !isMainVideo;

  const renderTaskContent = () => {
    if (showVideo && showAudio) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <AudioTask url={mainUrl} onComplete={onComplete} disabled={isLocked || isPending} />
          <VideoTask url={videoUrl} onComplete={onComplete} disabled={isLocked || isPending} />
        </Box>
      );
    }

    if (showVideo) {
      return <VideoTask url={videoUrl} onComplete={onComplete} disabled={isLocked || isPending} />;
    }

    switch (task.type) {
      case 'audio':
        return <AudioTask url={mainUrl || resourceUrl} onComplete={onComplete} disabled={isLocked || isPending} />;
      case 'video':
        return <VideoTask url={mainUrl || resourceUrl} onComplete={onComplete} disabled={isLocked || isPending} />;
      case 'text':
        if (task.content?.format === 'gallery' || (task.content?.images && task.content.images.length > 0)) {
          const galleryImages = task.content?.images || (mainUrl ? [mainUrl] : []);
          return <GalleryTask images={galleryImages} description={task.content?.text || task.description} onComplete={onComplete} disabled={isLocked || isPending} />;
        }
        if (task.content?.format === 'image') {
          return <ImageTask url={mainUrl || resourceUrl} description={task.content?.text || task.description} onComplete={onComplete} disabled={isLocked || isPending} />;
        }
        if (task.content?.format === 'pdf') {
          return <PdfTask url={mainUrl || resourceUrl} description={task.content?.text || task.description} onComplete={onComplete} disabled={isLocked || isPending} />;
        }
        return <TextTask content={task.content?.text || task.description} onComplete={onComplete} disabled={isLocked || isPending} />;
      case 'checklist':
        return task.content?.steps?.length > 0
          ? <ChecklistTask 
              key={isCompleted ? 'completed' : 'pending'}
              steps={task.content.steps} 
              onComplete={onComplete} 
              disabled={isLocked || isCompleted || isPending} 
              isCompleted={isCompleted} 
            />
          : null;
      default:
        return <Button onClick={onComplete} disabled={isPending}>Complete Task</Button>;
    }
  };

  return (
    <Box 
      sx={{ 
        p: 2.5, 
        borderRadius: '20px', 
        backgroundColor: isLocked ? 'rgba(5, 23, 20, 0.15)' : 'rgba(7, 24, 21, 0.35)',
        backdropFilter: 'blur(16px)',
        border: '1px solid',
        borderColor: isCompleted ? 'rgba(212, 175, 55, 0.35)' : isLocked ? 'rgba(0, 212, 163, 0.05)' : 'rgba(0, 212, 163, 0.15)',
        opacity: isLocked ? 0.8 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        boxShadow: isCompleted ? '0 8px 32px 0 rgba(212, 175, 55, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        '&:hover': {
          borderColor: isLocked ? 'rgba(0, 212, 163, 0.25)' : 'rgba(0, 212, 163, 0.45)',
          boxShadow: '0 0 25px rgba(0, 212, 163, 0.18)',
          backgroundColor: 'rgba(7, 24, 21, 0.5)',
          transform: 'translateY(-2px)'
        }
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        justifyContent: 'space-between',
        gap: { xs: 2.5, sm: 2 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.75, sm: 2.5 }, flex: 1, minWidth: 0 }}>
          <Box 
            sx={{ 
              width: { xs: 40, sm: 48 }, 
              height: { xs: 40, sm: 48 }, 
              borderRadius: '50%', 
              backgroundColor: isCompleted ? 'rgba(212, 175, 55, 0.08)' : isLocked ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 212, 163, 0.05)',
              border: '1px solid',
              borderColor: isCompleted ? 'rgba(212, 175, 55, 0.25)' : isLocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 212, 163, 0.25)',
              boxShadow: isCompleted ? '0 0 15px rgba(212, 175, 55, 0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isCompleted ? '#D4AF37' : isLocked ? '#666' : '#00D4A3',
              flexShrink: 0,
              mt: 0.25
            }}
          >
            {isCompleted ? (
              <CheckCircle2 size={20} />
            ) : isLocked ? (
              <Lock size={18} />
            ) : task.type === 'checklist' ? (
              <CheckSquare size={18} />
            ) : task.type === 'audio' ? (
              <Mic size={18} />
            ) : task.type === 'text' ? (
              <FileText size={18} />
            ) : (
              <PlayCircle size={18} />
            )}
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.12em', fontFamily: '"Outfit", sans-serif' }}>
              TASK {index + 1} • {((showVideo && showAudio) ? 'AUDIO & VIDEO' : (showVideo ? 'VIDEO' : task.type))?.toUpperCase()}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 750, lineHeight: 1.25, fontSize: { xs: '1rem', sm: '1.15rem' }, color: '#FFFFFF', letterSpacing: '0.01em', mt: 0.25, wordBreak: 'break-word' }}>
              {task.title}
            </Typography>
            {task.type === 'checklist' && task.content?.steps && task.content.steps.length > 0 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setChecklistOpen(!checklistOpen);
                }}
                endIcon={checklistOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                size="small"
                sx={{
                  color: '#D4AF37',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  p: 0,
                  mt: 0.5,
                  minWidth: 0,
                  textTransform: 'none',
                  '&:hover': { background: 'transparent', textDecoration: 'underline' }
                }}
              >
                {checklistOpen ? 'Hide Checklist' : 'View Checklist'}
              </Button>
            )}
          </Box>
        </Box>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: { xs: 'space-between', sm: 'flex-end' }, 
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
            pl: { xs: 7, sm: 0 },
            mt: { xs: 0.5, sm: 0 }
          }} 
          onClick={(e) => e.stopPropagation()}
        >
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
            {task.content?.duration || '5 min'}
          </Typography>
          <Button
            variant={isCompleted ? "contained" : isLocked ? "outlined" : "contained"}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            disabled={isCompleted || isPending}
            startIcon={isCompleted ? <CheckCircle2 size={14} /> : null}
            sx={{
              minWidth: '100px',
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 800,
              py: 0.75,
              px: 2.5,
              transition: 'all 0.3s ease',
              ...(isCompleted ? {
                background: 'linear-gradient(135deg, #D4AF37 0%, #F0D27A 100%)',
                color: '#040D0C',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)',
                '&.Mui-disabled': {
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F0D27A 100%)',
                  color: '#040D0C',
                  opacity: 0.9,
                }
              } : isLocked ? {
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#B0B0B0',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }
              } : {
                background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
                color: '#040D0C',
                boxShadow: '0 4px 12px rgba(0, 212, 163, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
                  boxShadow: '0 6px 16px rgba(0, 212, 163, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(0, 212, 163, 0.3)',
                  color: 'rgba(4, 13, 12, 0.5)',
                }
              })
            }}
          >
            {isCompleted ? 'Done' : isPending ? 'Saving...' : 'Mark Done'}
          </Button>
        </Box>
      </Box>

      {/* Checklist items rendered directly inside the card under the title/header row */}
      {task.type === 'checklist' && task.content?.steps && task.content.steps.length > 0 && checklistOpen && (
        <Box 
          sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
          onClick={(e) => e.stopPropagation()} // Prevent card collapse when interacting with the checklist
        >
          <ChecklistTask 
            key={isCompleted ? 'completed' : 'pending'}
            steps={task.content.steps} 
            onComplete={onComplete} 
            disabled={isLocked || isCompleted || isPending} 
            isCompleted={isCompleted} 
          />
        </Box>
      )}

      {isExpanded && (
        <Box 
          sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
          onClick={(e) => e.stopPropagation()} // Prevent collapse when interacting with content
        >
          {task.description && task.type !== 'text' && (
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#B0B0B0', 
                mb: 3,
                '& p': { mb: 1.5 },
                '& ul, & ol': { pl: 2, mb: 1.5 },
                '& li': { mb: 0.5 }
              }}
              dangerouslySetInnerHTML={{ __html: task.description }}
            />
          )}
          
          <Box sx={{ mt: 2 }}>
            {renderTaskContent()}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TodayPractice;


'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Stack,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  ChevronDown, 
  Lock, 
  CheckCircle2, 
  PlayCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { useMyEnrollment } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

const MyProgram = () => {
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

  const program = enrollment?.programs;
  const completions = enrollment?.task_completions || [];
  
  // Create a map of task ID to its title and day number for easy lookup
  const taskMap = React.useMemo(() => {
    const map: Record<string, { title: string; dayNumber: number }> = {};
    program?.modules?.forEach((mod: any) => {
      mod.lessons?.forEach((les: any) => {
        les.tasks?.forEach((task: any) => {
          map[task.id] = {
            title: task.title,
            dayNumber: les.day_number
          };
        });
      });
    });
    return map;
  }, [program]);

  const completedKeys = React.useMemo(() => {
    const keys = new Set<string>();
    completions.forEach((c: any) => {
      const tInfo = taskMap[c.task_id];
      if (tInfo) {
        keys.add(`${tInfo.dayNumber}_${tInfo.title}`);
      }
    });
    return keys;
  }, [completions, taskMap]);

  // A lesson (Day D) is locked if any previous lesson (Day < D) has uncompleted tasks
  const isLessonLocked = React.useCallback((lesson: any) => {
    const dayNum = lesson.day_number;
    if (dayNum <= 1) return false;
    
    // Find all lessons for days before this one
    const prevLessons = program?.modules?.flatMap((m: any) => m.lessons || [])
      .filter((l: any) => l.day_number < dayNum) || [];
      
    // Check if any task in those previous lessons is not completed
    return prevLessons.some((l: any) => {
      const tasks = l.tasks || [];
      if (tasks.length === 0) return false;
      const completed = tasks.filter((t: any) => completedKeys.has(`${l.day_number}_${t.title}`));
      return completed.length < tasks.length;
    });
  }, [program, completedKeys]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  if (!enrollment) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">No active program found.</Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Please enroll in a program from the admin panel.</Typography>
      </Box>
    );
  }

  // Logic to determine status for modules and days
  const getModuleStatus = (module: any) => {
    const lessons = module.lessons || [];
    if (lessons.length === 0) return 'locked';
    
    // If all lessons in this module are locked, then the module is locked
    const allLessonsLocked = lessons.every((l: any) => isLessonLocked(l));
    if (allLessonsLocked) return 'locked';
    
    const allTasks = lessons.flatMap((l: any) => l.tasks || []);
    if (allTasks.length === 0) return 'locked';
    
    const completedTasks = allTasks.filter((t: any) => {
      const lesson = lessons.find((l: any) => l.tasks?.some((tk: any) => tk.id === t.id));
      return completedKeys.has(`${lesson?.day_number || 1}_${t.title}`);
    });
    
    if (completedTasks.length === allTasks.length) return 'completed';
    if (completedTasks.length > 0) return 'active';
    return 'pending';
  };

  const getDayStatus = (lesson: any) => {
    const tasks = lesson.tasks || [];
    if (tasks.length === 0) return 'pending';
    
    const completedTasks = tasks.filter((t: any) => completedKeys.has(`${lesson.day_number}_${t.title}`));
    
    if (completedTasks.length === tasks.length) return 'completed';
    return 'active';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 5, px: { xs: 2.5, sm: 4, md: 0 }, position: 'relative' }}>
      <Box sx={{ mb: 6, mt: 2, position: 'relative', zIndex: 1 }}>
        <Typography 
          variant="overline" 
          sx={{ 
            color: '#D4AF37', 
            fontWeight: 700, 
            letterSpacing: '0.2em', 
            mb: 1.5, 
            display: 'block',
            fontSize: '0.75rem',
            fontFamily: '"Outfit", sans-serif'
          }}
        >
          Your Sacred Journey
        </Typography>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800, 
            mb: 2.5, 
            fontFamily: '"Playfair Display", serif',
            letterSpacing: '0.01em',
            fontSize: { xs: '2.2rem', sm: '2.8rem' },
            textShadow: '0 4px 20px rgba(0, 212, 163, 0.25)',
            color: '#FFFFFF'
          }}
        >
          {program.title}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'var(--text-secondary)', 
            lineHeight: 1.8, 
            fontSize: '1.05rem',
            maxWidth: '90%',
            mb: 4,
            fontFamily: '"Outfit", sans-serif'
          }}
        >
          {program.description}
        </Typography>
        <Divider sx={{ opacity: 0.15, backgroundColor: '#D4AF37', height: '1px' }} />
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -60, 
            left: -20, 
            width: 400, 
            height: 250, 
            background: 'radial-gradient(circle, rgba(0, 212, 163, 0.12) 0%, transparent 70%)',
            zIndex: 0,
            pointerEvents: 'none',
            filter: 'blur(30px)'
          }} 
        />
      </Box>

      <Stack spacing={0}>
        {program.modules.map((module: any) => {
          const status = getModuleStatus(module);
          return (
            <Accordion 
              key={module.id} 
              defaultExpanded={status === 'active'}
              sx={{ 
                backgroundColor: status === 'locked' ? 'rgba(11, 59, 50, 0.04)' : 'rgba(7, 24, 21, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px !important',
                overflow: 'hidden',
                margin: '0 0 24px 0 !important',
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: status === 'locked' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 212, 163, 0.15)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: status === 'locked' ? 'none' : '0 10px 40px 0 rgba(0, 0, 0, 0.25)',
                '&:hover': status !== 'locked' ? {
                  borderColor: 'rgba(0, 212, 163, 0.4)',
                  boxShadow: '0 12px 30px rgba(0, 212, 163, 0.12), 0 8px 24px rgba(0, 0, 0, 0.3)',
                  backgroundColor: 'rgba(11, 59, 50, 0.15)',
                } : {},
                '&.Mui-expanded': {
                  backgroundColor: 'rgba(7, 24, 21, 0.65)',
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 212, 163, 0.08)',
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ChevronDown color="#D4AF37" size={20} />}
                sx={{ 
                  px: { xs: 3, sm: 4.5 }, 
                  py: { xs: 2.25, sm: 2.75 },
                  '& .MuiAccordionSummary-content': {
                    margin: 0,
                    alignItems: 'center'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, width: '100%' }}>
                  {status === 'completed' ? (
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(0, 212, 163, 0.08)',
                      border: '1px solid rgba(0, 212, 163, 0.35)',
                      boxShadow: '0 0 18px rgba(0, 212, 163, 0.25)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#00D4A3',
                      flexShrink: 0
                    }}>
                      <CheckCircle2 size={18} />
                    </Box>
                  ) : status === 'locked' ? (
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'rgba(255, 255, 255, 0.25)',
                      flexShrink: 0
                    }}>
                      <Lock size={16} />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(212, 175, 55, 0.06)',
                      border: '2px solid #D4AF37',
                      boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#D4AF37',
                      flexShrink: 0
                    }}>
                      <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        backgroundColor: '#00D4A3', 
                        boxShadow: '0 0 10px #00D4A3, 0 0 20px #00D4A3'
                      }} />
                    </Box>
                  )}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      flexGrow: 1, 
                      opacity: status === 'locked' ? 0.45 : 1, 
                      fontSize: '1.2rem', 
                      fontFamily: '"Outfit", sans-serif', 
                      letterSpacing: '0.02em', 
                      ml: 1,
                      color: '#FFFFFF'
                    }}
                  >
                    {module.title}
                  </Typography>
                  {status === 'active' && (
                    <Chip 
                      label="IN PROGRESS" 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                        color: '#D4AF37', 
                        fontWeight: 800, 
                        fontSize: '0.65rem',
                        fontFamily: '"Outfit", sans-serif',
                        letterSpacing: '0.05em'
                      }} 
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 1, pb: 4.5 }}>
                <Box sx={{ position: 'relative', px: { xs: 3, sm: 4.5 } }}>
                  {/* Timeline path line */}
                  <Box sx={{ 
                    position: 'absolute', 
                    left: { xs: '63px', sm: '83px' }, // Perfect center alignment with checkpoint badges
                    top: 0, 
                    bottom: 0, 
                    width: '2px', 
                    background: 'linear-gradient(to bottom, rgba(0, 212, 163, 0.25) 0%, rgba(212, 175, 55, 0.15) 50%, rgba(255, 255, 255, 0.03) 100%)',
                    zIndex: 0
                  }} />
                  
                  <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
                    {module.lessons.map((lesson: any) => {
                      const dayStatus = getDayStatus(lesson);
                      const isLocked = status === 'locked' || isLessonLocked(lesson);
                      const isActiveDay = dayStatus === 'active' && !isLocked;
                      
                      return (
                        <Box 
                          key={lesson.id}
                          {...(!isLocked ? { component: Link, to: `/today?day=${lesson.day_number}` } : {})}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            px: { xs: 2.5, sm: 3.5 },
                            py: 2.5,
                            textDecoration: 'none',
                            color: 'inherit',
                            borderRadius: '16px',
                            border: isLocked ? '1px solid rgba(255, 255, 255, 0.06)' : (isActiveDay ? '2px solid #00D4A3' : '1px solid rgba(0, 212, 163, 0.12)'),
                            backgroundColor: isActiveDay ? 'rgba(0, 212, 163, 0.05)' : (isLocked ? 'rgba(7, 24, 21, 0.1)' : 'rgba(7, 24, 21, 0.25)'),
                            boxShadow: isActiveDay ? '0 8px 30px rgba(0, 212, 163, 0.18), inset 0 0 12px rgba(0, 212, 163, 0.05)' : 'none',
                            opacity: isLocked ? 0.75 : 1,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            ...(isActiveDay ? {
                              '&:before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '4px',
                                backgroundColor: '#D4AF37',
                                boxShadow: '0 0 10px #D4AF37',
                                borderRadius: '16px 0 0 16px'
                              }
                            } : {}),
                            '&:hover': !isLocked ? { 
                              borderColor: 'rgba(0, 212, 163, 0.45)',
                              backgroundColor: 'rgba(0, 212, 163, 0.08)',
                              boxShadow: '0 8px 24px rgba(0, 212, 163, 0.12)',
                              transform: 'translateY(-2px)'
                            } : {}
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                            {/* Circular Milestone Node */}
                            <Box sx={{ 
                              width: 38, 
                              height: 38, 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontFamily: '"Outfit", sans-serif',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              flexShrink: 0,
                              zIndex: 2,
                              transition: 'all 0.3s ease',
                              ...(dayStatus === 'completed' ? {
                                backgroundColor: '#040D0C',
                                border: '1.5px solid #00D4A3',
                                color: '#00D4A3',
                                boxShadow: '0 0 10px rgba(0, 212, 163, 0.2)'
                              } : isLocked ? {
                                backgroundColor: '#040D0C',
                                border: '1.5px solid rgba(255, 255, 255, 0.08)',
                                color: 'rgba(255, 255, 255, 0.3)'
                              } : {
                                // Active
                                backgroundColor: '#040D0C',
                                border: '2px solid #D4AF37',
                                color: '#D4AF37',
                                boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)'
                              })
                            }}>
                              {lesson.day_number}
                            </Box>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: isActiveDay ? 750 : 600, 
                                fontSize: '0.975rem',
                                fontFamily: '"Outfit", sans-serif',
                                color: isLocked ? 'rgba(255, 255, 255, 0.45)' : '#FFFFFF',
                                letterSpacing: '0.010em'
                              }}
                            >
                              {lesson.title}
                            </Typography>
                          </Box>
                          {dayStatus === 'completed' ? (
                            <CheckCircle2 size={18} color="#00D4A3" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 212, 163, 0.4))' }} />
                          ) : isLocked ? (
                            <Lock size={16} color="rgba(255, 255, 255, 0.25)" />
                          ) : (
                            <PlayCircle size={18} color="#D4AF37" style={{ filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.2))' }} />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Box>
  );
};

export default MyProgram;


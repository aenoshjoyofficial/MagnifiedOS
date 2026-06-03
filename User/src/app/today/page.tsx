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
import ChecklistTask from '@/components/Tasks/ChecklistTask';
import { useAuthStore } from '@/store/useStore';
import { useMyEnrollment, useCompleteTask } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

const parseRoutineFromHtml = (html: string) => {
  try {
    if (!html) return null;
    const match = html.match(/<script type="application\/json" id="routine-json">([\s\S]*?)<\/script>/);
    if (match && match[1]) {
      return JSON.parse(match[1].trim());
    }
  } catch (e) {
    console.error('Error parsing routine from HTML:', e);
  }
  return null;
};

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

  const { data: enrollment, isLoading } = useMyEnrollment(targetUserId || '');
  const completeTaskMutation = useCompleteTask();

  const [hasLoadedInitial, setHasLoadedInitial] = React.useState(false);
  const [isDaySubmitted, setIsDaySubmitted] = React.useState(false);
  const [visibleInstructions, setVisibleInstructions] = React.useState<Record<string, boolean>>({});

  const toggleInstruction = (windowName: string) => {
    setVisibleInstructions(prev => ({
      ...prev,
      [windowName]: !prev[windowName]
    }));
  };

  const [searchParams] = useSearchParams();
  const dayParam = searchParams.get('day');

  const program = enrollment?.programs;
  const startedAt = enrollment ? new Date(enrollment.started_at) : new Date();

  // Calculate days since start using America/New_York (Eastern Time) calendar dates.
  // This ensures all users see the exact same day content synchronized to New York time (EST/EDT).
  const daysSinceStart = (() => {
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

  const totalDays = React.useMemo(() => {
    if (!program?.modules) return program?.duration_days || 30;
    return program.modules.reduce((acc: number, mod: any) => {
      const maxModDay = mod.lessons?.reduce((lMax: number, lesson: any) => Math.max(lMax, lesson.day_number || 0), 0) || 0;
      return Math.max(acc, maxModDay);
    }, 0) || program.duration_days || 30;
  }, [program]);

  const allLessons = React.useMemo(() => {
    return program?.modules?.flatMap((m: any) => 
      (m.lessons || []).map((l: any) => ({
        ...l,
        moduleTitle: m.title,
        moduleId: m.id
      }))
    ) || [];
  }, [program]);

  const completions = enrollment?.task_completions || [];

  const completedKeys = React.useMemo(() => {
    const taskMap: Record<string, { title: string; dayNumber: number }> = {};
    program?.modules?.forEach((mod: any) => {
      mod.lessons?.forEach((les: any) => {
        les.tasks?.forEach((task: any) => {
          taskMap[task.id] = { title: task.title, dayNumber: les.day_number };
        });
      });
    });

    const keys = new Set<string>();
    completions.forEach((c: any) => {
      const tInfo = taskMap[c.task_id];
      if (tInfo) {
        keys.add(`${tInfo.dayNumber}_${tInfo.title}`);
      }
    });

    return keys;
  }, [program, completions]);

  const viewedDay = React.useMemo(() => {
    if (dayParam) return Math.min(parseInt(dayParam, 10), totalDays);
    
    if (allLessons.length === 0) return Math.min(daysSinceStart, totalDays);

    const sortedLessons = [...allLessons].sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0));

    // Lock helper: A lesson D is locked if D > daysSinceStart AND any previous day is incomplete
    const isLocked = (dayNum: number) => {
      if (dayNum <= 1) return false;
      if (dayNum <= daysSinceStart) return false;
      const prevLessons = sortedLessons.filter((l: any) => l.day_number < dayNum);
      return prevLessons.some((l: any) => {
        const tasks = l.tasks || [];
        if (tasks.length === 0) return false;
        const completed = tasks.filter((t: any) => completedKeys.has(`${l.day_number}_${t.title}`));
        return completed.length < tasks.length;
      });
    };

    // Find the first uncompleted unlocked day
    const firstIncompleteUnlocked = sortedLessons.find((l: any) => {
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
    const unlockedLessons = sortedLessons.filter((l: any) => !isLocked(l.day_number));
    if (unlockedLessons.length > 0) {
      return unlockedLessons[unlockedLessons.length - 1].day_number;
    }

    return Math.min(daysSinceStart, totalDays);
  }, [dayParam, allLessons, daysSinceStart, totalDays, completedKeys]);

  const currentLesson = React.useMemo(() => {
    if (allLessons.length === 0) return null;
    return allLessons.find((l: any) => l.day_number === viewedDay) || allLessons.find((l: any) => l.day_number === 1) || allLessons[allLessons.length - 1];
  }, [allLessons, viewedDay]);

  const tasks = React.useMemo(() => {
    return allLessons
      .filter((l: any) => l.day_number === viewedDay)
      .flatMap((l: any) => (l.tasks || []).map((t: any) => ({
        ...t,
        moduleTitle: l.moduleTitle,
        moduleId: l.moduleId
      })));
  }, [allLessons, viewedDay]);

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
      setIsDaySubmitted(isDayComplete);
      setHasLoadedInitial(true);
    }
  }, [enrollment, viewedDay, isDayComplete]);

  const handleTaskComplete = async (taskId: string) => {
    if (!enrollment) return;
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task) return;
    if (completedKeys.has(`${viewedDay}_${task.title}`)) return;
    
    await completeTaskMutation.mutateAsync({
      enrollmentId: enrollment.id,
      taskId: taskId
    });
  };

  const parsedRoutine = React.useMemo(() => {
    const dayLessons = allLessons.filter((l: any) => l.day_number === viewedDay);
    const combined: any[] = [];
    const seen = new Set<string>();
    
    // 1. Parse routines from lesson description HTML
    dayLessons.forEach((l: any) => {
      const routine = parseRoutineFromHtml(l.description || '');
      if (routine && routine.length > 0) {
        routine.forEach((item: any) => {
          const key = `${item.window}_${item.system}`;
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(item);
          }
        });
      }
    });

    // 2. Synthesize missing routine cards for any tasks that don't have matching card elements
    const standardWindows = ['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
    dayLessons.forEach((l: any) => {
      const lessonTasks = l.tasks || [];
      lessonTasks.forEach((t: any) => {
        const rawWindow = t.content?.routine_window;
        if (!rawWindow) return;
        const matchingWindow = standardWindows.find(w => w.toLowerCase() === rawWindow.toLowerCase());
        if (!matchingWindow) return;
        
        const systemName = l.moduleTitle || 'Daily Integration';
        
        // Check if there is already a routine item in 'combined' for this window and a matching system name
        const alreadyExists = combined.some((item: any) => {
          if (item.window.toLowerCase() !== matchingWindow.toLowerCase()) return false;
          const itemSys = item.system.trim().toLowerCase();
          const taskSys = systemName.trim().toLowerCase();
          return itemSys.includes(taskSys) || taskSys.includes(itemSys);
        });
        
        if (!alreadyExists) {
          combined.push({
            window: matchingWindow,
            system: systemName,
            anchor: 'Daily Protocol',
            instruction: ''
          });
        }
      });
    });

    // 3. De-duplicate and merge cards with similar system names in the same window (e.g. "Breath Atelier" vs "Chamber: BREATH ATELIER")
    const uniqueCombined: any[] = [];
    combined.forEach((item: any) => {
      const duplicateIdx = uniqueCombined.findIndex((existing: any) => {
        if (existing.window.toLowerCase() !== item.window.toLowerCase()) return false;
        const s1 = existing.system.trim().toLowerCase();
        const s2 = item.system.trim().toLowerCase();
        return s1.includes(s2) || s2.includes(s1);
      });
      
      if (duplicateIdx > -1) {
        const existing = uniqueCombined[duplicateIdx];
        if (item.system.length > existing.system.length) {
          uniqueCombined[duplicateIdx] = {
            ...item,
            instruction: item.instruction || existing.instruction,
            anchor: item.anchor || existing.anchor
          };
        } else {
          uniqueCombined[duplicateIdx] = {
            ...existing,
            instruction: existing.instruction || item.instruction,
            anchor: existing.anchor || item.anchor
          };
        }
      } else {
        uniqueCombined.push(item);
      }
    });

    // 4. Sort uniqueCombined chronologically by window name
    const orderMap: Record<string, number> = {
      'morning': 1,
      'mid-morning': 2,
      'midday': 3,
      'afternoon': 4,
      'evening': 5,
      'night': 6
    };

    uniqueCombined.sort((a: any, b: any) => {
      const orderA = orderMap[a.window.toLowerCase()] || 99;
      const orderB = orderMap[b.window.toLowerCase()] || 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.system.localeCompare(b.system);
    });

    return uniqueCombined.length > 0 ? uniqueCombined : null;
  }, [allLessons, viewedDay]);

  // Helper functions (must be defined before lockedTaskIds useMemo)
  const getTasksForWindow = React.useCallback((windowName: string, systemName?: string) => {
    return tasks.filter((t: any) => {
      const taskWindow = t.content?.routine_window;
      const windowMatch = taskWindow && taskWindow.toLowerCase() === windowName.toLowerCase();
      if (!windowMatch) return false;
      if (!systemName) return true;
      const taskModule = (t.moduleTitle || '').trim().toLowerCase();
      const sysName = systemName.trim().toLowerCase();
      return taskModule.includes(sysName) || sysName.includes(taskModule);
    });
  }, [tasks]);

  const getUnassignedTasks = React.useCallback(() => {
    const routineWindows = ['morning', 'mid-morning', 'midday', 'afternoon', 'evening', 'night'];
    return tasks.filter((t: any) => {
      const taskWindow = t.content?.routine_window;
      return !taskWindow || !routineWindows.includes(taskWindow.toLowerCase());
    });
  }, [tasks]);

  // IMPORTANT: lockedTaskIds must be declared BEFORE any early returns to satisfy Rules of Hooks
  const lockedTaskIds = React.useMemo(() => {
    const orderedTasks: any[] = [];
    if (parsedRoutine) {
      parsedRoutine.forEach((item: any) => {
        const windowTasks = getTasksForWindow(item.window, item.system);
        orderedTasks.push(...windowTasks);
      });
      orderedTasks.push(...getUnassignedTasks());
    } else {
      orderedTasks.push(...tasks);
    }

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
  }, [parsedRoutine, tasks, completedKeys, viewedDay, getTasksForWindow, getUnassignedTasks]);

  // Early returns must come AFTER all hooks
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
              disabled={viewedDay <= 1}
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

      {/* Routine Windows & Nested Tasks */}
      {parsedRoutine ? (
        <Stack spacing={4} sx={{ mb: 6 }}>
          {parsedRoutine.map((item: any, idx: number) => {
            const windowTasks = getTasksForWindow(item.window, item.system);
            if (windowTasks.length === 0) return null;
            return (
              <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Premium Accentuated Chamber Header */}
                <Box 
                  sx={{ 
                    borderLeft: '4px solid',
                    borderColor: windowTasks.length > 0 ? '#00D4A3' : 'rgba(255, 255, 255, 0.15)',
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
                      color: windowTasks.length > 0 ? '#D4AF37' : '#888', 
                      fontWeight: 800, 
                      letterSpacing: '0.15em', 
                      textTransform: 'uppercase',
                      display: 'block',
                      fontFamily: '"Outfit", sans-serif'
                    }}
                  >
                    {item.window}
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
                    {item.system}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#F0D27A', fontSize: '0.85rem', mt: 0.5, fontWeight: 600, letterSpacing: '0.02em', opacity: 0.9 }}>
                    Anchor: {item.anchor}
                  </Typography>

                  {item.instruction && (
                    <Box sx={{ mt: 1.5 }}>
                      <Button 
                        onClick={() => toggleInstruction(item.window)} 
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
                        {visibleInstructions[item.window] ? 'Hide Instructions' : 'View Instructions'}
                      </Button>
                      {visibleInstructions[item.window] && (
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
                          <div dangerouslySetInnerHTML={{ __html: item.instruction }} />
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Nested Tasks for this window */}
                {windowTasks.length > 0 && (
                  <Stack spacing={1.5} sx={{ pl: { xs: 1.5, sm: 3 } }}>
                    {windowTasks.map((task: any) => {
                      const globalIndex = tasks.findIndex((t: any) => t.id === task.id);
                      return (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          index={globalIndex} 
                          isCompleted={completedKeys.has(`${viewedDay}_${task.title}`)}
                          isLocked={lockedTaskIds.has(task.id)}
                          onComplete={() => handleTaskComplete(task.id)} 
                        />
                      );
                    })}
                  </Stack>
                )}
              </Box>
            );
          })}

          {/* Unassigned/General Tasks */}
          {getUnassignedTasks().length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box 
                sx={{ 
                  borderLeft: '3px solid rgba(255, 255, 255, 0.3)',
                  pl: 2.5,
                  py: 0.5,
                  textAlign: 'left'
                }}
              >
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  General Practices
                </Typography>
              </Box>
              <Stack spacing={1.5} sx={{ pl: { xs: 1.5, sm: 3 } }}>
                {getUnassignedTasks().map((task: any) => {
                  const globalIndex = tasks.findIndex((t: any) => t.id === task.id);
                  return (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      index={globalIndex} 
                      isCompleted={completedKeys.has(`${viewedDay}_${task.title}`)}
                      isLocked={lockedTaskIds.has(task.id)}
                      onComplete={() => handleTaskComplete(task.id)} 
                    />
                  );
                })}
              </Stack>
            </Box>
          )}
        </Stack>
      ) : (
        /* Legacy fallback rendering */
        <>
          {currentLesson?.description && (
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#B0B0B0', 
                mb: 4,
                lineHeight: 1.6,
                '& ul, & ol': { pl: 3, my: 1 },
                '& p': { my: 1 }
              }}
              dangerouslySetInnerHTML={{ __html: currentLesson.description }}
            />
          )}

          <Stack spacing={2} sx={{ mb: 6 }}>
            {tasks.map((task: any, index: number) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                isCompleted={completedKeys.has(`${viewedDay}_${task.title}`)}
                isLocked={lockedTaskIds.has(task.id)}
                onComplete={() => handleTaskComplete(task.id)} 
              />
            ))}
            {tasks.length === 0 && (
              <Typography sx={{ textAlign: 'center', py: 4, color: '#666' }}>No tasks found for today.</Typography>
            )}
          </Stack>
        </>
      )}

      {/* Global Actions */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        {isDaySubmitted ? (
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
        ) : (
          <Button 
            variant="contained" 
            disabled={!isDayComplete}
            onClick={() => setIsDaySubmitted(true)}
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
            Complete All Tasks to Finish Day
          </Button>
        )}
      </Box>
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

const TaskCard = ({ task, index, isCompleted, isLocked, onComplete }: { task: any, index: number, isCompleted: boolean, isLocked: boolean, onComplete: () => void }) => {
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
          <AudioTask url={mainUrl} onComplete={onComplete} />
          <VideoTask url={videoUrl} onComplete={onComplete} />
        </Box>
      );
    }

    if (showVideo) {
      return <VideoTask url={videoUrl} onComplete={onComplete} />;
    }

    switch (task.type) {
      case 'audio':
        return <AudioTask url={mainUrl || resourceUrl} onComplete={onComplete} />;
      case 'video':
        return <VideoTask url={mainUrl || resourceUrl} onComplete={onComplete} />;
      case 'text':
        return <TextTask content={task.content?.text || task.description} onComplete={onComplete} />;
      case 'checklist':
        return task.content?.steps?.length > 0
          ? <ChecklistTask steps={task.content.steps} onComplete={onComplete} disabled={isLocked} />
          : null;
      default:
        return <Button onClick={onComplete}>Complete Task</Button>;
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
        opacity: isLocked ? 0.6 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        boxShadow: isCompleted ? '0 8px 32px 0 rgba(212, 175, 55, 0.05)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        '&:hover': !isLocked ? {
          borderColor: 'rgba(0, 212, 163, 0.45)',
          boxShadow: '0 0 25px rgba(0, 212, 163, 0.18)',
          backgroundColor: 'rgba(7, 24, 21, 0.5)',
          transform: 'translateY(-2px)'
        } : {}
      }}
      onClick={() => !isLocked && setIsExpanded(!isExpanded)}
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
          {!isLocked && (
            <Button
              variant="contained"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              disabled={isCompleted}
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
                } : {
                  background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
                  color: '#040D0C',
                  boxShadow: '0 4px 12px rgba(0, 212, 163, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
                    boxShadow: '0 6px 16px rgba(0, 212, 163, 0.4)',
                    transform: 'translateY(-1px)',
                  }
                })
              }}
            >
              {isCompleted ? 'Done' : 'Mark Done'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Checklist items rendered directly inside the card under the title/header row */}
      {task.type === 'checklist' && task.content?.steps && task.content.steps.length > 0 && checklistOpen && (
        <Box 
          sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
          onClick={(e) => e.stopPropagation()} // Prevent card collapse when interacting with the checklist
        >
          <ChecklistTask steps={task.content.steps} onComplete={onComplete} disabled={isLocked} />
        </Box>
      )}

      {isExpanded && !isLocked && (
        <Box 
          sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
          onClick={(e) => e.stopPropagation()} // Prevent collapse when interacting with content
        >
          {task.description && (
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


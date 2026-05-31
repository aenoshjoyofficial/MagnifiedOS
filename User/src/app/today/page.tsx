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
  Trophy
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
  const daysSinceStart = enrollment ? Math.max(1, Math.floor((new Date().getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;
  const viewedDay = dayParam ? parseInt(dayParam, 10) : daysSinceStart;

  const allLessons = React.useMemo(() => {
    return program?.modules?.flatMap((m: any) => 
      (m.lessons || []).map((l: any) => ({
        ...l,
        moduleTitle: m.title,
        moduleId: m.id
      }))
    ) || [];
  }, [program]);

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
  const completions = enrollment?.task_completions || [];

  const { completedTasks, isDayComplete, completedKeys } = React.useMemo(() => {
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

    const list = tasks.filter((t: any) => keys.has(`${viewedDay}_${t.title}`));
    const complete = list.length === tasks.length && tasks.length > 0;
    
    return {
      completedTasks: list,
      isDayComplete: complete,
      completedKeys: keys
    };
  }, [program, completions, tasks, viewedDay]);

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, mb: 3 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, flexGrow: 1 }}>
            {currentLesson?.title || 'Daily Integration'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              disabled={viewedDay <= 1}
              component={Link}
              to={`/today?day=${viewedDay - 1}`}
              sx={{ color: '#D4AF37', '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.05)' } }}
            >
              <ChevronLeft size={20} />
            </IconButton>
            <IconButton 
              disabled={viewedDay >= daysSinceStart}
              component={Link}
              to={`/today?day=${viewedDay + 1}`}
              sx={{ color: '#D4AF37', '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.05)' } }}
            >
              <ChevronRight size={20} />
            </IconButton>
          </Box>
        </Box>

        {/* Daily Progress (Moved to Top) */}
        <Box sx={{ p: 2.5, borderRadius: 3, backgroundColor: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
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
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              '& .MuiLinearProgress-bar': { backgroundColor: '#D4AF37' }
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
                {/* Simplified Left-Accent Section Header */}
                <Box 
                  sx={{ 
                    borderLeft: '3px solid',
                    borderColor: windowTasks.length > 0 ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
                    pl: 2.5,
                    py: 0.5,
                    textAlign: 'left'
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: windowTasks.length > 0 ? '#D4AF37' : '#666', 
                      fontWeight: 800, 
                      letterSpacing: 1.5, 
                      textTransform: 'uppercase',
                      display: 'block'
                    }}
                  >
                    {item.window}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#EAEAEA', fontWeight: 700, fontSize: '1.1rem', mt: 0.5 }}>
                    {item.system}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', fontSize: '0.85rem', mt: 0.5 }}>
                    Anchor: {item.anchor}
                  </Typography>

                  {item.instruction && (
                    <Box sx={{ mt: 1 }}>
                      <Button 
                        onClick={() => toggleInstruction(item.window)} 
                        sx={{ 
                          color: '#D4AF37', 
                          fontSize: '0.75rem', 
                          p: 0, 
                          minWidth: 0, 
                          textTransform: 'none', 
                          '&:hover': { background: 'transparent', textDecoration: 'underline' } 
                        }}
                      >
                        {visibleInstructions[item.window] ? 'Hide Instructions' : 'View Instructions'}
                      </Button>
                      {visibleInstructions[item.window] && (
                        <Box 
                          sx={{ 
                            mt: 1.5, 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                            border: '1px dashed rgba(212, 175, 55, 0.15)', 
                            color: '#B0B0B0', 
                            fontSize: '0.85rem', 
                            lineHeight: 1.5,
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
      <Box sx={{ textAlign: 'center' }}>
        {isDaySubmitted ? (
          <Box sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
            <Trophy size={48} color="#4CAF50" style={{ marginBottom: 16 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#4CAF50', mb: 1 }}>Day Complete!</Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 3 }}>
              You have successfully integrated today's neural protocols.
            </Typography>
            <Button variant="outlined" component={Link} to="/dashboard" sx={{ borderColor: '#4CAF50', color: '#4CAF50' }}>Return to Dashboard</Button>
          </Box>
        ) : (
          <Button 
            variant="contained" 
            disabled={!isDayComplete}
            onClick={() => setIsDaySubmitted(true)}
            sx={{ 
              backgroundColor: '#D4AF37', 
              color: '#0B0B0F',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 800,
              borderRadius: 10,
              boxShadow: isDayComplete ? '0 8px 32px rgba(212, 175, 55, 0.2)' : 'none',
              '&:hover': {
                backgroundColor: '#B8962D',
              },
              '&.Mui-disabled': { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.2)' }
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
        return null;
      default:
        return <Button onClick={onComplete}>Complete Task</Button>;
    }
  };

  return (
    <Box 
      sx={{ 
        p: 2.5, 
        borderRadius: 3, 
        backgroundColor: isLocked ? 'rgba(255, 255, 255, 0.02)' : 'rgba(18, 18, 23, 1)',
        border: '1px solid',
        borderColor: isCompleted ? 'rgba(212, 175, 55, 0.3)' : isLocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
        opacity: isLocked ? 0.6 : 1,
        transition: 'all 0.3s ease',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        '&:hover': !isLocked ? {
          borderColor: 'rgba(212, 175, 55, 0.5)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)'
        } : {}
      }}
      onClick={() => !isLocked && setIsExpanded(!isExpanded)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box 
            sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              backgroundColor: isCompleted ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isCompleted ? '#D4AF37' : '#B0B0B0'
            }}
          >
            {isCompleted ? <CheckCircle2 size={24} /> : isLocked ? <Lock size={24} /> : <PlayCircle size={24} />}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.75rem', letterSpacing: 1 }}>
              TASK {index + 1} • {((showVideo && showAudio) ? 'AUDIO & VIDEO' : (showVideo ? 'VIDEO' : task.type))?.toUpperCase()}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {task.title}
            </Typography>

          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={(e) => e.stopPropagation()}>
          <Typography variant="body2" sx={{ color: '#B0B0B0', fontWeight: 500, mr: 1 }}>
            {task.content?.duration || '5 min'}
          </Typography>
          {!isLocked && (
            <Button
              variant={isCompleted ? "text" : "outlined"}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              disabled={isCompleted}
              startIcon={isCompleted ? <CheckCircle2 size={16} /> : null}
              sx={{
                minWidth: '90px',
                borderColor: isCompleted ? 'transparent' : 'rgba(212, 175, 55, 0.3)',
                color: isCompleted ? '#4CAF50' : '#D4AF37',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '20px',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#D4AF37',
                  backgroundColor: 'rgba(212, 175, 55, 0.05)',
                },
                '&.Mui-disabled': {
                  color: '#4CAF50',
                  borderColor: 'transparent',
                }
              }}
            >
              {isCompleted ? 'Done' : 'Mark Done'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Checklist items rendered directly inside the card under the title/header row */}
      {task.type === 'checklist' && task.content?.steps && task.content.steps.length > 0 && (
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
          <Typography variant="body1" sx={{ color: '#B0B0B0', mb: 3 }}>
            {task.description}
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {renderTaskContent()}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TodayPractice;


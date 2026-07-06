

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Grid,
  CircularProgress,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  Checkbox,
  ListItemText
} from '@mui/material';
import RichTextEditor from '@/components/RichTextEditor';
import { supabase } from '@/lib/supabase';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  MoreVertical as MoreIcon,
  CheckSquare,
  MessageSquare,
  PlayCircle,
  Mic,
  Upload,
  Link as LinkIcon,
  Cpu,
  FolderOpen,
  Users,
  FileText,
  Award,
  UserCheck,
  Copy
} from 'lucide-react';
import {
  useSaveProgram,
  useSaveModule,
  useSaveLesson,
  useProgramDetails,
  usePrograms,
  useSaveTask,
  useDeleteTask,
  useUploadAsset,
  useDeleteModule,
  useDeleteLesson,
  useDeleteProgram,
  useUsers,
  useEnrollUser
} from '@/lib/queries';
import {
  DEFAULT_CHAMBER_SCRIPTS,
  CHAMBERS_INFO,
  WEEK_THEMES,
  CHAMBER_KEYS,
  getChamberScriptForProgram,
  getChamberDayTitlesForProgram,
  getCombinedStepsForDay,
  getChamberWindow,
  generateRoutineHtml,
  ChamberScript,
  ChamberStep,
  getDayOfWeekLabel,
  getDayTheme,
  matchChamberKey
} from '@/lib/chambersData';
import { ProgramImportModal } from '@/components/program-builder/ProgramImportModal';
import { ProgramCloneModal } from '@/components/program-builder/ProgramCloneModal';

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

const ProgramBuilder = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('settings');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const saveProgramMutation = useSaveProgram();
  const saveModuleMutation = useSaveModule();
  const saveLessonMutation = useSaveLesson();
  const saveTaskMutation = useSaveTask();
  const deleteTaskMutation = useDeleteTask();
  const deleteModuleMutation = useDeleteModule();
  const deleteLessonMutation = useDeleteLesson();
  const deleteProgramMutation = useDeleteProgram();
  const uploadAssetMutation = useUploadAsset();
  const { data: allPrograms } = usePrograms();

  const urlProgramId = searchParams.get('id');
  const [programId, setProgramId] = useState<string | null>(urlProgramId);
  const [localModules, setLocalModules] = useState<any[]>([]);
  const [prevProgramId, setPrevProgramId] = useState<string | null>(null);

  const [tempSelectedChamber, setTempSelectedChamber] = useState<{ [day: number]: string }>({});
  const [tempSelectedTask, setTempSelectedTask] = useState<{ [day: number]: string }>({});
  const [tempSelectedWindow, setTempSelectedWindow] = useState<{ [day: number]: string }>({});

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dayToDeleteTasks, setDayToDeleteTasks] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);



  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (programId) {
      params.set('id', programId);
    } else {
      params.delete('id');
    }
    const newParams = params.toString();
    if (searchParams.toString() !== newParams) {
      setSearchParams(params, { replace: true });
    }
  }, [programId, searchParams, setSearchParams]);

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this module and all its lessons?')) return;
    try {
      await deleteModuleMutation.mutateAsync(moduleId);
      setLocalModules(localModules.filter(m => m.id !== moduleId));
      setNotification({ open: true, message: 'Module deleted.', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to delete module.', severity: 'error' });
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await deleteLessonMutation.mutateAsync(lessonId);
      setLocalModules(localModules.map(m =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) } : m
      ));
      setNotification({ open: true, message: 'Lesson deleted.', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to delete lesson.', severity: 'error' });
    }
  };

  const openDeleteAllDialog = (dayNum: number) => {
    setDayToDeleteTasks(dayNum);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    if (dayToDeleteTasks !== null) {
      await handleDeleteAllLessonTasks(dayToDeleteTasks);
    }
    setDeleteConfirmOpen(false);
    setDayToDeleteTasks(null);
  };

  const handleDeleteAllLessonTasks = async (dayNum: number) => {
    try {
      const tasksToDelete: any[] = [];
      localModules.forEach(m => {
        const lesson = m.lessons?.find((l: any) => l.day_number === dayNum);
        lesson?.tasks?.forEach((t: any) => {
          tasksToDelete.push({ id: t.id, lessonId: lesson.id });
        });
      });

      // Check if any of these tasks are completed
      const taskIds = tasksToDelete.map(t => t.id);
      if (taskIds.length > 0) {
        const { data: completions } = await supabase
          .from('task_completions')
          .select('task_id')
          .in('task_id', taskIds);
        
        if (completions && completions.length > 0) {
          setNotification({ open: true, message: 'Some tasks for this day have already been completed by a user. Deletion is disabled.', severity: 'warning' });
          return;
        }
      }

      console.log(`[DEBUG] Deleting all allotted tasks for Day ${dayNum}. Tasks to delete count: ${tasksToDelete.length}`);

      for (const t of tasksToDelete) {
        await deleteTaskMutation.mutateAsync(t.id);
      }

      console.log(`[DEBUG] Deleted task count: ${tasksToDelete.length}`);

      // Update local state by removing these tasks
      const updatedModules = localModules.map(m => {
        return {
          ...m,
          lessons: m.lessons?.map((l: any) => {
            if (l.day_number === dayNum) {
              return {
                ...l,
                tasks: []
              };
            }
            return l;
          }) || []
        };
      });

      setLocalModules(updatedModules);

      // Recompile routine HTML for each lesson on this day
      for (const m of updatedModules) {
        const lesson = m.lessons?.find((l: any) => l.day_number === dayNum);
        if (lesson) {
          await syncLessonRoutine(lesson.id, updatedModules);
        }
      }

      setNotification({ open: true, message: `All allotted tasks for Day ${dayNum} have been deleted.`, severity: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ open: true, message: `Failed to delete lesson tasks: ${err.message || err}`, severity: 'error' });
    }
  };

  const handleDeleteDay = async (dayNum: number) => {
    if (!window.confirm(`Are you sure you want to delete all tasks and the entire Day ${dayNum} allotment?`)) return;
    try {
      // 1. Find all lessons for this day in any modules
      const lessonsToDelete: any[] = [];
      localModules.forEach(m => {
        const lesson = m.lessons?.find((l: any) => l.day_number === dayNum);
        if (lesson) {
          lessonsToDelete.push({ id: lesson.id, moduleId: m.id });
        }
      });

      // 2. Find tasks in these lessons and check if any are completed
      const tasksToDelete: any[] = [];
      lessonsToDelete.forEach(item => {
        const module = localModules.find(m => m.id === item.moduleId);
        const lesson = module?.lessons?.find((l: any) => l.id === item.id);
        lesson?.tasks?.forEach((t: any) => {
          tasksToDelete.push(t.id);
        });
      });

      if (tasksToDelete.length > 0) {
        const { data: completions } = await supabase
          .from('task_completions')
          .select('task_id')
          .in('task_id', tasksToDelete);
        
        if (completions && completions.length > 0) {
          setNotification({ open: true, message: `Some tasks on Day ${dayNum} are already completed by a user. Cannot delete this day.`, severity: 'warning' });
          return;
        }

        // Delete all tasks on this day first (cascade safety)
        for (const taskId of tasksToDelete) {
          await deleteTaskMutation.mutateAsync(taskId);
        }
      }

      // 3. Delete lessons from DB
      for (const item of lessonsToDelete) {
        await deleteLessonMutation.mutateAsync(item.id);
      }

      // 4. Update local state
      setLocalModules(prev => prev.map(m => ({
        ...m,
        lessons: m.lessons?.filter((l: any) => l.day_number !== dayNum) || []
      })));

      // 5. Remove from dayIndices array
      setDayIndices(prev => prev.filter(d => d !== dayNum));

      setNotification({ open: true, message: `Day ${dayNum} allotment deleted successfully!`, severity: 'success' });
    } catch (err) {
      console.error('Failed to delete day:', err);
      setNotification({ open: true, message: 'Failed to delete day allotment.', severity: 'error' });
    }
  };

  const handleClearWindow = async (dayNum: number, windowName: string) => {
    if (!window.confirm(`Are you sure you want to clear all tasks in ${windowName} for Day ${dayNum}?`)) return;

    try {
      const tasksToDelete: any[] = [];
      localModules.forEach(m => {
        const lesson = m.lessons?.find((l: any) => l.day_number === dayNum);
        lesson?.tasks?.forEach((t: any) => {
          if (t.content?.routine_window === windowName) {
            tasksToDelete.push({ id: t.id, lessonId: lesson.id });
          }
        });
      });

      // Check if any of these tasks are completed
      const taskIds = tasksToDelete.map(t => t.id);
      if (taskIds.length > 0) {
        const { data: completions } = await supabase
          .from('task_completions')
          .select('task_id')
          .in('task_id', taskIds);
        
        if (completions && completions.length > 0) {
          setNotification({ open: true, message: 'Some tasks in this window have already been completed by a user. Clearing is disabled.', severity: 'warning' });
          return;
        }
      }

      console.log(`[DEBUG] Clearing window ${windowName} for Day ${dayNum}. Tasks to delete count: ${tasksToDelete.length}`);

      for (const t of tasksToDelete) {
        await deleteTaskMutation.mutateAsync(t.id);
      }

      console.log(`[DEBUG] Deleted task count: ${tasksToDelete.length}`);

      // Update local state by filtering out cleared tasks
      const updatedModules = localModules.map(m => {
        return {
          ...m,
          lessons: m.lessons?.map((l: any) => {
            if (l.day_number === dayNum) {
              return {
                ...l,
                tasks: l.tasks?.filter((t: any) => t.content?.routine_window !== windowName) || []
              };
            }
            return l;
          }) || []
        };
      });

      setLocalModules(updatedModules);

      // Recompile routine HTML for each lesson on this day
      for (const m of updatedModules) {
        const lesson = m.lessons?.find((l: any) => l.day_number === dayNum);
        if (lesson) {
          await syncLessonRoutine(lesson.id, updatedModules);
        }
      }

      setNotification({ open: true, message: `Cleared all tasks in ${windowName} for Day ${dayNum}.`, severity: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ open: true, message: `Failed to clear window: ${err.message || err}`, severity: 'error' });
    }
  };

  const runCleanupSystem = async (modules: any[], durationDays: number) => {
    let ghostCleanupCount = 0;
    const tasksToDelete: string[] = [];

    modules.forEach(m => {
      const chamberKey = matchChamberKey(m.title);
      const isBrokenChamber = !chamberKey;

      m.lessons?.forEach((l: any) => {
        const isInvalidLesson = l.day_number > durationDays || l.day_number < 0;

        l.tasks?.forEach((t: any) => {
          const isLegacy = t.title.includes('Chamber Task') || !!t.title.match(/Chamber Task/i);
          
          // We only automatically delete legacy placeholder tasks in the background.
          // We NEVER delete tasks due to temporary chamber or day number mismatches
          // (which can be caused by client-side cache stale state), preventing data loss.
          if (isLegacy) {
            tasksToDelete.push(t.id);
          }
        });
      });
    });

    if (tasksToDelete.length > 0) {
      console.log(`[DEBUG] Safe Cleanup System: Found ${tasksToDelete.length} stale/ghost/legacy tasks to delete.`);
      for (const id of tasksToDelete) {
        try {
          await deleteTaskMutation.mutateAsync(id);
          ghostCleanupCount++;
        } catch (err) {
          console.error(`[DEBUG] Safe Cleanup System: Failed to delete ghost task ${id}:`, err);
        }
      }
      console.log(`[DEBUG] Ghost task cleanup count: ${ghostCleanupCount}`);
    } else {
      console.log(`[DEBUG] Ghost task cleanup count: 0 (No stale tasks found)`);
    }

    return ghostCleanupCount;
  };

  const { data: programDetails, isLoading: isLoadingDetails } = useProgramDetails(programId || '');

  const [programData, setProgramData] = useState({
    title: '',
    description: '',
    duration_days: 30,
    cover_image: '',
    is_published: false
  });

  const [dayIndices, setDayIndices] = useState<number[]>([1]);
  const [dayTitles, setDayTitles] = useState<{ [day: number]: string }>({});

  useEffect(() => {
    if (localModules) {
      const existingDays = Array.from(new Set(
        localModules.flatMap(m => m.lessons || [])
          .map((l: any) => l.day_number)
          .filter((d: number) => d > 0)
      )).sort((a, b) => a - b);

      if (programId !== prevProgramId) {
        // We switched programs, reset dayIndices completely to the new program's existing days
        setDayIndices(existingDays.length > 0 ? existingDays : [1]);
        setPrevProgramId(programId);
      } else {
        // We are on the same program, merge existingDays with current dayIndices
        setDayIndices(prev => {
          const combined = Array.from(new Set([...prev, ...existingDays])).sort((a, b) => a - b);
          return combined.length > 0 ? combined : [1];
        });
      }

      const titles: { [day: number]: string } = {};
      localModules.forEach(m => {
        m.lessons?.forEach((l: any) => {
          if (l.day_number > 0 && l.title) {
            titles[l.day_number] = l.title;
          }
        });
      });
      // Merge titles so we don't lose any custom titles edited locally
      setDayTitles(prev => ({ ...prev, ...titles }));
    }
  }, [localModules, programId, prevProgramId]);

  const handleUpdateDayTitle = async (dayNum: number, newTitle: string) => {
    try {
      setDayTitles(prev => ({ ...prev, [dayNum]: newTitle }));

      // Update all lessons in the DB for this day number
      for (const m of localModules) {
        const lesson = m.lessons?.find((l: any) => l.day_number === dayNum);
        if (lesson) {
          await saveLessonMutation.mutateAsync({
            id: lesson.id,
            title: newTitle
          });
        }
      }

      // Update local state lesson titles
      setLocalModules(prev => prev.map(m => ({
        ...m,
        lessons: m.lessons?.map((l: any) =>
          l.day_number === dayNum ? { ...l, title: newTitle } : l
        ) || []
      })));
    } catch (err: any) {
      console.error('Failed to update day title:', err);
    }
  };

  const getChambersWithTasksForDay = (dayNum: number) => {
    const list: { chamberKey: string; name: string; tasks: any[] }[] = [];
    CHAMBER_KEYS.forEach(ck => {
      const info = CHAMBERS_INFO[ck as keyof typeof CHAMBERS_INFO];
      const mod = localModules.find(m => matchChamberKey(m.title) === ck);
      if (mod) {
        const lesson = mod.lessons?.find((l: any) => l.day_number === dayNum);
        const tasks = lesson?.tasks || [];
        list.push({
          chamberKey: ck,
          name: info ? info.name : ck.toUpperCase(),
          tasks
        });
      }
    });
    return list;
  };

  const handleUpdateTaskWindow = async (task: any, newWindow: string, dayNum: number) => {
    try {
      // Check if this task is completed
      const { data: completions } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('task_id', task.id);
      
      if (completions && completions.length > 0) {
        setNotification({ open: true, message: 'This task has already been completed by a user. Moving or re-allotting is disabled.', severity: 'warning' });
        return;
      }

      const isUnassigning = newWindow === 'Unassigned';
      let targetLessonId = task.lesson_id;

      if (isUnassigning) {
        let targetModule = localModules.find(m => m.lessons?.some((l: any) => l.id === task.lesson_id));
        if (targetModule) {
          let poolLesson = targetModule.lessons?.find((l: any) => l.day_number === 0);
          if (!poolLesson) {
            poolLesson = await saveLessonMutation.mutateAsync({
              module_id: targetModule.id,
              title: `Chamber Pool`,
              day_number: 0,
              unlock_day: 0
            });
            targetModule.lessons = [...(targetModule.lessons || []), { ...poolLesson, tasks: [] }];
          }
          targetLessonId = poolLesson.id;
        }
      }

      const updatedTask = {
        ...task,
        lesson_id: targetLessonId,
        content: {
          ...(task.content || {}),
          routine_window: isUnassigning ? '' : newWindow
        }
      };

      // 1. Save updated task to DB
      await saveTaskMutation.mutateAsync(updatedTask);

      // 2. Update local state
      const updatedModules = localModules.map(m => {
        return {
          ...m,
          lessons: m.lessons?.map((l: any) => {
            // If unassigning, remove from this day's lesson, add to pool (day_number: 0)
            if (isUnassigning) {
              if (l.day_number === dayNum) {
                return {
                  ...l,
                  tasks: l.tasks?.filter((t: any) => t.id !== task.id) || []
                };
              }
              if (l.id === targetLessonId) {
                return {
                  ...l,
                  tasks: [...(l.tasks || []), updatedTask]
                };
              }
            } else {
              // Just update the window inside the current lesson
              if (l.id === task.lesson_id) {
                return {
                  ...l,
                  tasks: l.tasks?.map((t: any) => t.id === task.id ? updatedTask : t) || []
                };
              }
            }
            return l;
          })
        };
      });
      setLocalModules(updatedModules);

      // 3. Recompile routines for affected lessons
      if (isUnassigning) {
        const sourceLesson = updatedModules.flatMap(m => m.lessons || []).find(l => l.day_number === dayNum && l.module_id === task.module_id);
        if (sourceLesson) {
          await syncLessonRoutine(sourceLesson.id, updatedModules);
        }
        if (targetLessonId) {
          await syncLessonRoutine(targetLessonId, updatedModules);
        }
      } else {
        if (task.lesson_id) {
          await syncLessonRoutine(task.lesson_id, updatedModules);
        }
      }

      setNotification({ open: true, message: 'Task allotment updated and routines synchronized!', severity: 'success' });
    } catch (err) {
      console.error(err);
      setNotification({ open: true, message: 'Failed to update task allotment.', severity: 'error' });
    }
  };

  const handleAllotTask = async (taskId: string, targetModuleId: string, targetDayNum: number, routineWindow: string) => {
    try {
      // Check if this task is completed
      const { data: completions } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('task_id', taskId);
      
      if (completions && completions.length > 0) {
        setNotification({ open: true, message: 'This task has already been completed by a user. Moving is disabled.', severity: 'warning' });
        return;
      }

      const module = localModules.find(m => m.id === targetModuleId);
      if (!module) return;

      // Find or create lesson for this Chamber module on targetDayNum
      let dayLesson = module.lessons?.find((l: any) => l.day_number === targetDayNum);
      if (!dayLesson) {
        // Create lesson on targetDayNum
        dayLesson = await saveLessonMutation.mutateAsync({
          module_id: targetModuleId,
          title: `${module.title} Day ${targetDayNum}`,
          day_number: targetDayNum,
          unlock_day: targetDayNum,
          description: ''
        });
        module.lessons = [...(module.lessons || []), { ...dayLesson, tasks: [] }];
      }

      // Find the task in the pool
      let taskToUpdate: any = null;
      localModules.forEach(m => {
        const poolLesson = m.lessons?.find((l: any) => l.day_number === 0);
        const found = poolLesson?.tasks?.find((t: any) => t.id === taskId);
        if (found) {
          taskToUpdate = found;
        }
      });

      if (!taskToUpdate) return;

      // Update the task to point to the new day lesson and set the window
      const updatedTask = {
        ...taskToUpdate,
        lesson_id: dayLesson.id,
        content: {
          ...(taskToUpdate.content || {}),
          routine_window: routineWindow
        }
      };

      await saveTaskMutation.mutateAsync(updatedTask);

      // In local state, remove task from pool lesson and add to day lesson
      const updatedModules = localModules.map(m => {
        return {
          ...m,
          lessons: m.lessons?.map((l: any) => {
            // Remove from pool
            if (l.day_number === 0) {
              return {
                ...l,
                tasks: l.tasks?.filter((t: any) => t.id !== taskId) || []
              };
            }
            // Add to target day lesson
            if (l.id === dayLesson.id) {
              return {
                ...l,
                tasks: [...(l.tasks || []), updatedTask]
              };
            }
            return l;
          })
        };
      });

      setLocalModules(updatedModules);

      // Recompile routine for this lesson
      await syncLessonRoutine(dayLesson.id, updatedModules);

      setNotification({ open: true, message: 'Task allotted successfully!', severity: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ open: true, message: `Failed to allot task: ${err.message || err}`, severity: 'error' });
    }
  };

  const syncLessonRoutine = async (lessonId: string, updatedModulesList?: any[]) => {
    const modulesSource = updatedModulesList || localModules;
    // 1. Find the lesson and its tasks
    let lesson: any = null;
    let parentModule: any = null;
    modulesSource.forEach(m => {
      const found = m.lessons?.find((l: any) => l.id === lessonId);
      if (found) {
        lesson = found;
        parentModule = m;
      }
    });

    if (!lesson) return;

    // 2. Map tasks to windows
    const routineWindows = ['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
    const routineData = routineWindows.map(windowName => {
      const tasks = lesson.tasks?.filter((t: any) => t.content?.routine_window === windowName) || [];
      if (tasks.length === 0) return null;

      const anchor = tasks.map((t: any) => t.title).join(' · ');
      const instruction = tasks.map((t: any) => {
        const desc = t.description || t.content?.text || '';
        return /<[a-z][\s\S]*>/i.test(desc) ? desc : `<p>${desc}</p>`;
      }).join('');

      // Determine system name
      const systemName = parentModule?.title || 'Daily Integration';

      return {
        window: windowName,
        system: systemName,
        anchor,
        instruction
      };
    }).filter(Boolean);

    // 3. Generate HTML
    const html = generateRoutineHtml(routineData as any);

    // 4. Update DB
    await saveLessonMutation.mutateAsync({
      id: lessonId,
      description: html
    });

    // 5. Update local state description
    setLocalModules(prev => prev.map(m => ({
      ...m,
      lessons: m.lessons?.map((l: any) => 
        l.id === lessonId ? { ...l, description: html } : l
      )
    })));
  };

  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const toggleExpandedModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);

  const toggleExpandedLesson = (lessonId: string) => {
    setExpandedLessons(prev =>
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  // Sync data when switching programs
  useEffect(() => {
    if (programId && programDetails) {
      setProgramData({
        title: programDetails.title || '',
        description: programDetails.description || '',
        duration_days: programDetails.duration_days || 30,
        cover_image: programDetails.cover_image || '',
        is_published: programDetails.is_published || false
      });

      // Log debugging details: Fetched tasks (Task 6)
      const chamberPoolTasks: any[] = [];
      const allottedTasks: any[] = [];
      programDetails.modules?.forEach((m: any) => {
        m.lessons?.forEach((l: any) => {
          if (l.day_number === 0) {
            chamberPoolTasks.push(...(l.tasks || []));
          } else {
            allottedTasks.push(...(l.tasks || []));
          }
        });
      });
      console.log(`[DEBUG] Fetched Chamber Tasks (Pool):`, chamberPoolTasks);
      console.log(`[DEBUG] Fetched Allotted Tasks (Day Lessons):`, allottedTasks);

      // Filter out ghost and stale tasks for UI rendering immediately (Task 2)
      const durationDays = programDetails.duration_days || 30;
      const cleanedModules = (programDetails.modules || []).map((m: any) => {
        const chamberKey = matchChamberKey(m.title);
        if (!chamberKey) {
          return {
            ...m,
            lessons: []
          };
        }

        return {
          ...m,
          lessons: (m.lessons || []).map((l: any) => {
            const isInvalidLesson = l.day_number > durationDays || l.day_number < 0;
            if (isInvalidLesson) {
              return {
                ...l,
                tasks: []
              };
            }

            return {
              ...l,
              tasks: (l.tasks || []).filter((t: any) => {
                const isLegacy = t.title.includes('Chamber Task') || !!t.title.match(/Chamber Task/i);
                return !isLegacy;
              })
            };
          })
        };
      });

      setLocalModules(cleanedModules);

      // Run database cleanup in the background
      runCleanupSystem(programDetails.modules || [], durationDays);
    } else {
      setProgramData({
        title: '',
        description: '',
        duration_days: 30,
        cover_image: '',
        is_published: false
      });
      setLocalModules([]);
    }
  }, [programId, programDetails]); // Only sync when programId changes or details first load

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const handleSave = async (overrides: any = {}) => {
    // Prevent saving if title is empty (unless we are passing a title in overrides)
    if (!programData.title && !overrides.title) return;

    // Prevent multiple simultaneous saves to avoid duplicate records and DB lockups
    if (saveProgramMutation.isPending || publishing) return;

    try {
      const payload = {
        ...programData,
        ...overrides,
        id: programId || undefined
      };

      // Wrap with 30 second timeout to prevent infinite hanging
      const savePromise = saveProgramMutation.mutateAsync(payload);
      const saved = await Promise.race([
        savePromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Save request timed out. Please check your Supabase connection and try again.')), 30000)
        )
      ]);

      // Update local state with the result from the DB
      if (saved) {
        setProgramId(saved.id);
        setProgramData({
          title: saved.title || '',
          description: saved.description || '',
          duration_days: saved.duration_days || 30,
          cover_image: saved.cover_image || '',
          is_published: saved.is_published || false
        });
      }

      return saved;
    } catch (err: any) {
      console.error('Save failed:', err);
      setNotification({
        open: true,
        message: `Failed to save changes: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
      throw err;
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const saved = await handleSave({ is_published: true });
      setNotification({ open: true, message: 'Program published and live!', severity: 'success' });
      if (saved) {
        setActiveTab('created');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setPublishing(true);
      const saved = await handleSave({ is_published: false });
      setNotification({ open: true, message: 'Draft saved successfully.', severity: 'success' });
      if (saved) {
        setActiveTab('created');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!programId) return;
    if (!window.confirm('CRITICAL: Are you sure you want to delete this entire program? This will permanently remove all modules, lessons, and tasks. This action cannot be undone.')) return;

    try {
      await deleteProgramMutation.mutateAsync(programId);
      setNotification({ open: true, message: 'Program deleted successfully.', severity: 'success' });
      setProgramId(null);
      setProgramData({
        title: '',
        description: '',
        duration_days: 30,
        cover_image: '',
        is_published: false
      });
      setActiveTab('settings');
    } catch (err: any) {
      setNotification({ open: true, message: `Failed to delete program: ${err.message}`, severity: 'error' });
    }
  };

  const handleAddModule = async () => {
    if (!programId) {
      setNotification({ open: true, message: 'Please save the program settings first.', severity: 'error' });
      return;
    }

    try {
      const newMod = await saveModuleMutation.mutateAsync({
        program_id: programId,
        title: 'New Module',
        order_index: (localModules.length || 0) + 1
      });
      setLocalModules([...localModules, { ...newMod, lessons: [] }]);
    } catch (err) {
      setNotification({ open: true, message: 'Failed to add module.', severity: 'error' });
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    try {
      const module = localModules.find(m => m.id === moduleId);
      const defaultRoutine = [
        { window: 'Morning', system: 'Mental Clarity + Hydration + Movement', anchor: 'Warm water · 8 breaths · cold rinse · light mobility', instruction: '' },
        { window: 'Mid-Morning', system: 'Activation Sequence', anchor: 'Tai Chi flow · joint articulation · nasal walking', instruction: '' },
        { window: 'Midday', system: 'Strength + Digestion', anchor: 'Largest meal · 10 breaths before eating · slow chewing', instruction: '' },
        { window: 'Afternoon', system: 'Nervous-System Pacing', anchor: 'Midday Reset audio · brown noise · 8-minute breath', instruction: '' },
        { window: 'Evening', system: 'Parasympathetic Descent', anchor: 'Light dinner before 7:30pm · 6 Hz theta · alternate nostril', instruction: '' },
        { window: 'Night', system: 'Sleep Cocoon', anchor: '60-minute descent · delta · darkness · nasal only', instruction: '' }
      ];
      const defaultHtml = generateRoutineHtml(defaultRoutine);

      const newLesson = await saveLessonMutation.mutateAsync({
        module_id: moduleId,
        title: 'New Lesson',
        day_number: (module?.lessons?.length || 0) + 1,
        unlock_day: (module?.lessons?.length || 0) + 1,
        description: defaultHtml
      });

      setLocalModules(prev => prev.map(m =>
        m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), { ...newLesson, tasks: [] }] } : m
      ));
      setNotification({ open: true, message: 'Lesson added!', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to add lesson.', severity: 'error' });
    }
  };

  const handleDeleteTask = async (lessonId: string, taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      const updated = localModules.map(m => ({
        ...m,
        lessons: m.lessons?.map((l: any) => 
          l.id === lessonId ? { ...l, tasks: l.tasks?.filter((t: any) => t.id !== taskId) } : l
        )
      }));
      setLocalModules(updated);
      await syncLessonRoutine(lessonId, updated);
      setNotification({ open: true, message: 'Task removed.', severity: 'success' });
    } catch (err: any) {
      console.error('Task deletion failed:', err);
      setNotification({ open: true, message: `Failed to delete task: ${err.message || 'Unknown error'}`, severity: 'error' });
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setNotification({
        open: true,
        message: `Warning: The file you selected is ${(file.size / 1024 / 1024).toFixed(1)} MB. Cover image files should normally be smaller (under 50 MB) to optimize page loading speed.`,
        severity: 'warning'
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-${programId || 'new'}-${Date.now()}.${fileExt}`;
      const bucket = 'program-assets';

      const publicUrl = await uploadAssetMutation.mutateAsync({
        file,
        bucket,
        path: `covers/${fileName}`
      });

      setProgramData(prev => ({ ...prev, cover_image: publicUrl }));

      // Auto-save if we have an ID
      if (programId) {
        await handleSave({ cover_image: publicUrl });
      }

      setNotification({ open: true, message: 'Cover image uploaded!', severity: 'success' });
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || err?.error_description || String(err);
      if (errMsg.includes('exceeded the maximum allowed size') || errMsg.includes('exceed')) {
        setNotification({ 
          open: true, 
          message: 'Upload failed: File size exceeds the maximum allowed size configured in Supabase.', 
          severity: 'error' 
        });
      } else {
        setNotification({ open: true, message: `Cover upload failed: ${errMsg}`, severity: 'error' });
      }
    }
  };

  const updateModuleTitle = (moduleId: string, title: string) => {
    setLocalModules(prev => prev.map(m => m.id === moduleId ? { ...m, title } : m));
  };

  const updateLessonTitle = (moduleId: string, lessonId: string, title: string) => {
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? {
        ...m,
        lessons: m.lessons.map((l: any) => l.id === lessonId ? { ...l, title } : l)
      } : m
    ));
  };

  const updateLessonDescription = (moduleId: string, lessonId: string, description: string) => {
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? {
        ...m,
        lessons: m.lessons.map((l: any) => l.id === lessonId ? { ...l, description } : l)
      } : m
    ));
  };

  const updateLessonDayNumber = (moduleId: string, lessonId: string, dayNumber: number) => {
    setLocalModules(prev => prev.map(m =>
      m.id === moduleId ? {
        ...m,
        lessons: m.lessons.map((l: any) => l.id === lessonId ? { ...l, day_number: dayNumber, unlock_day: dayNumber } : l)
      } : m
    ));
  };

  const [hasSyncedTasks, setHasSyncedTasks] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [initStatusText, setInitStatusText] = useState('');

  const handleSyncAll = async () => {
    if (!programId || !localModules || localModules.length === 0) return;

    setIsSyncingAll(true);
    setSyncProgress(0);
    try {
      const duration = programData.duration_days || 30;
      const updatedModules = JSON.parse(JSON.stringify(localModules));

      let totalLessons = 0;
      updatedModules.forEach((m: any) => {
        m.lessons?.forEach((l: any) => {
          if (l.day_number > 0) totalLessons++;
        });
      });

      let processed = 0;
      for (const m of updatedModules) {
        if (!m.lessons) continue;
        for (const lesson of m.lessons) {
          if (lesson.day_number <= 0) continue;

          // Compile routine for this single lesson
          const routineWindows = ['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
          const routineData = routineWindows.map(windowName => {
            const tasks = lesson.tasks?.filter((t: any) => t.content?.routine_window === windowName) || [];
            if (tasks.length === 0) return null;

            const anchor = tasks.map((t: any) => t.title).join(' · ');
            const instruction = tasks.map((t: any) => {
              const desc = t.description || t.content?.text || '';
              return /<[a-z][\s\S]*>/i.test(desc) ? desc : `<p>${desc}</p>`;
            }).join('');

            const systemName = m.title || 'Daily Integration';

            return {
              window: windowName,
              system: systemName,
              anchor,
              instruction
            };
          }).filter(Boolean);

          const html = generateRoutineHtml(routineData as any);

          const { tasks, ...payload } = lesson;
          await saveLessonMutation.mutateAsync({
            ...payload,
            description: html
          });
          lesson.description = html;

          processed++;
          setSyncProgress(Math.round((processed / totalLessons) * 100));
        }
      }

      setLocalModules(updatedModules);
      setNotification({ open: true, message: 'All daily routines re-compiled and synchronized!', severity: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ open: true, message: `Failed to sync: ${err.message || err}`, severity: 'error' });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleInitializeProgram = async () => {
    if (!programId) {
      setNotification({ open: true, message: 'Please save the program settings first.', severity: 'error' });
      return;
    }
    if (localModules && localModules.length > 0) {
      if (!window.confirm('WARNING: This program already has modules. Initializing will append 8 Chambers modules. Do you want to proceed?')) {
        return;
      }
    }
    setIsInitializing(true);
    setInitProgress(0);

    try {
      let chambersList = [
        'MENTAL CLARITY',
        'THE FREQUENCY FIELD',
        'FIELD DESIGN',
        'THE LIVING FRAME',
        'THE PLATE',
        'SLEEP COCOON',
        'BREATH ATELIER',
        'THE SIGNATURE'
      ];

      try {
        const { data: dbChambers, error } = await supabase
          .from('chambers')
          .select('title')
          .order('display_order', { ascending: true });
        
        if (!error && dbChambers && dbChambers.length > 0) {
          chambersList = dbChambers.map(c => c.title.toUpperCase());
        }
      } catch (dbErr) {
        console.warn('Could not load chambers dynamically, using hardcoded fallback list:', dbErr);
      }

      const initializedModules: any[] = [];

      for (let i = 0; i < chambersList.length; i++) {
        const chamberTitle = chambersList[i];
        setInitStatusText(`Creating Module: ${chamberTitle}...`);

        // 1. Create Module
        const newMod = await saveModuleMutation.mutateAsync({
          program_id: programId,
          title: chamberTitle,
          order_index: i + 1
        });

        // 2. Create the Chamber Pool Lesson (day_number = 0)
        setInitStatusText(`Creating Pool for ${chamberTitle}...`);
        const poolLesson = await saveLessonMutation.mutateAsync({
          module_id: newMod.id,
          title: `Chamber Pool`,
          day_number: 0,
          unlock_day: 0,
          description: '<p>Chamber tasks pool</p>'
        });

        initializedModules.push({
          ...newMod,
          lessons: [{ ...poolLesson, tasks: [] }]
        });

        setInitProgress(Math.round(((i + 1) / chambersList.length) * 100));
      }

      setLocalModules([...(localModules || []), ...initializedModules]);
      setNotification({ open: true, message: '8 Chambers initialized successfully with generic task pools!', severity: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ open: true, message: `Failed to initialize: ${err.message || err}`, severity: 'error' });
    } finally {
      setIsInitializing(false);
      setInitStatusText('');
    }
  };




  const handleSyncRoutine = async (moduleId: string, lesson: any) => {
    try {
      const module = localModules.find(m => m.id === moduleId);
      if (!module) return;

      const dayNum = lesson.day_number || 1;

      const formatStepsHtml = (s: ChamberScript) => {
        let html = `<strong>When:</strong> ${s.when || 'Varies'} | <strong>Duration:</strong> ${s.duration || 'Varies'}<br/><br/>`;
        if (s.steps && s.steps.length > 0) {
          html += '<strong>Steps:</strong><ul>';
          s.steps.forEach((step: ChamberStep) => {
            let assetLink = '';
            if (step.contentUrl) {
              assetLink = ` (<a href="${step.contentUrl}" target="_blank" style="color:#D4AF37;text-decoration:underline;">View Asset</a>)`;
            }
            html += `<li>[${step.type.toUpperCase()}] ${step.title}${assetLink}</li>`;
          });
          html += '</ul>';
        }
        if (s.directive) {
          html += `<br/><strong>DIRECTIVE:</strong><br/><em>${s.directive}</em>`;
        }
        return html;
      };

      const routineData: Array<{
        window: string;
        system: string;
        anchor: string;
        instruction: string;
        chamberIndex: number;
      }> = [];

      CHAMBER_KEYS.forEach(chamberKey => {
        const script = getChamberScriptForProgram(programId, chamberKey, dayNum);
        // Only include if there are steps or directive
        if ((script.steps && script.steps.length > 0) || script.directive) {
          const info = CHAMBERS_INFO[chamberKey as keyof typeof CHAMBERS_INFO];
          const chamberName = info ? info.name : chamberKey.toUpperCase();
          const defaultAnchor = info ? (info as any).defaultAnchor : 'Varies';
          const window = getChamberWindow(chamberKey, script.when);
          const chamberIndex = CHAMBER_KEYS.indexOf(chamberKey as any);

          routineData.push({
            window,
            system: chamberName,
            anchor: script.duration || defaultAnchor || 'Varies',
            instruction: formatStepsHtml(script),
            chamberIndex
          });
        }
      });

      const orderMap: Record<string, number> = {
        'Morning': 1,
        'Mid-Morning': 2,
        'Midday': 3,
        'Afternoon': 4,
        'Evening': 5,
        'Night': 6
      };

      routineData.sort((a, b) => {
        const orderA = orderMap[a.window] || 99;
        const orderB = orderMap[b.window] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.chamberIndex - b.chamberIndex;
      });

      const cleanRoutineData = routineData.map(({ window, system, anchor, instruction }) => ({
        window,
        system,
        anchor,
        instruction
      }));

      const newDescription = generateRoutineHtml(cleanRoutineData);

      updateLessonDescription(moduleId, lesson.id, newDescription);

      const { tasks, ...payload } = lesson;
      await saveLessonMutation.mutateAsync({
        ...payload,
        description: newDescription
      });

      setNotification({ open: true, message: `Routine combined and synced for Day ${dayNum} from all Chamber scripts.`, severity: 'success' });
    } catch (e) {
      console.error(e);
      setNotification({ open: true, message: 'Failed to sync routine.', severity: 'error' });
    }
  };

  const updateTaskTitle = (lessonId: string, taskId: string, title: string) => {
    setLocalModules(prev => prev.map(m => ({
      ...m,
      lessons: m.lessons?.map((l: any) =>
        l.id === lessonId ? {
          ...l,
          tasks: l.tasks?.map((t: any) => t.id === taskId ? { ...t, title } : t)
        } : l
      )
    })));
  };

  const updateTaskWindow = (lessonId: string, taskId: string, windowName: string) => {
    setLocalModules(prev => prev.map(m => ({
      ...m,
      lessons: m.lessons?.map((l: any) =>
        l.id === lessonId ? {
          ...l,
          tasks: l.tasks?.map((t: any) =>
            t.id === taskId ? {
              ...t,
              content: { ...t.content, routine_window: windowName }
            } : t
          )
        } : l
      )
    })));
  };

  const persistModule = async (module: any) => {
    try {
      // Strip nested lessons before saving
      const { lessons, ...payload } = module;
      await saveModuleMutation.mutateAsync(payload);
      setNotification({ open: true, message: 'Module updated.', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to update module.', severity: 'error' });
    }
  };

  const persistLesson = async (lesson: any) => {
    try {
      // Strip nested tasks before saving
      const { tasks, ...payload } = lesson;
      await saveLessonMutation.mutateAsync(payload);
      setNotification({ open: true, message: 'Lesson updated.', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to update lesson.', severity: 'error' });
    }
  };

  const handleImportSuccess = async (compiled: any) => {
    try {
      const savedProgram = await handleSave({
        title: compiled.metadata.title,
        description: compiled.metadata.description,
        duration_days: compiled.metadata.duration_days
      });

      if (savedProgram) {
        setActiveTab('modules');
        setNotification({
          open: true,
          message: 'Program imported successfully! Click "Sync All Tasks & Routines" to publish lessons and tasks.',
          severity: 'success'
        });
      }
    } catch (err: any) {
      console.error('Import save failed:', err);
      setNotification({
        open: true,
        message: `Import succeeded but failed to save program settings: ${err.message || err}`,
        severity: 'error'
      });
    }
  };

  const handleCloneSuccess = () => {
    setActiveTab('modules');
    setNotification({
      open: true,
      message: 'Program cloned successfully! All modules, lessons, and tasks have been copied.',
      severity: 'success'
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Program Builder</Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Architect the transformation journey.</Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleSaveDraft}
            disabled={saveProgramMutation.isPending || publishing || !programData.title}
            sx={{ color: '#B0B0B0', borderColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            startIcon={saveProgramMutation.isPending || publishing ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            onClick={handlePublish}
            disabled={saveProgramMutation.isPending || publishing || !programData.title}
            sx={{
              backgroundColor: 'var(--emerald-primary)',
              color: '#0B0B0F',
              fontWeight: 700,
              '&:hover': { backgroundColor: 'var(--emerald-light)' },
              '&.Mui-disabled': { backgroundColor: 'var(--emerald-mid)', opacity: 0.5 }
            }}
          >
            {saveProgramMutation.isPending || publishing ? 'Publishing...' : 'Publish Program'}
          </Button>
        </Stack>
      </Box>

      {/* Navigation Tabs (Horizontal Layout) */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 1 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {[
              { id: 'settings', label: 'General Settings', icon: Settings },
              { id: 'modules', label: 'Days & Tasks', icon: GripVertical },
              { id: 'created', label: 'Created Program', icon: FolderOpen },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                startIcon={<tab.icon size={18} />}
                sx={{
                  flex: 1,
                  minWidth: { xs: '100%', sm: 180 },
                  justifyContent: 'center',
                  px: 2,
                  py: 1.5,
                  color: activeTab === tab.id ? 'var(--emerald-primary)' : '#B0B0B0',
                  backgroundColor: activeTab === tab.id ? 'var(--emerald-mid)' : 'transparent',
                  '&:hover': { backgroundColor: 'var(--emerald-dark)' }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Box>

      {/* Content Area */}
      <Box sx={{ width: '100%' }}>
        {/* Program Selector */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            gap: 2, 
            backgroundColor: 'var(--emerald-deep)', 
            border: '1px solid var(--emerald-mid)' 
          }}
        >
          <Typography variant="body2" sx={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>ACTIVE PROGRAM:</Typography>
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { xs: '100%', sm: 300 } }}>
            <Select
              value={programId || 'new'}
              onChange={(e) => setProgramId(e.target.value === 'new' ? null : e.target.value)}
              sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            >
              <MenuItem value="new">+ Create New Program</MenuItem>
              <Divider />
              {programId && !allPrograms?.some(p => p.id === programId) && (
                <MenuItem value={programId} style={{ display: 'none' }}>
                  Loading active program...
                </MenuItem>
              )}
              {allPrograms?.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setIsImportOpen(true)}
            startIcon={<Upload size={14} />}
            sx={{
              color: 'var(--emerald-primary)',
              borderColor: 'var(--emerald-mid)',
              '&:hover': { borderColor: 'var(--emerald-light)', backgroundColor: 'var(--emerald-dark)' }
            }}
          >
            Import Program
          </Button>
          {programId && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsCloneOpen(true)}
              startIcon={<Copy size={14} />}
              sx={{
                color: 'var(--emerald-primary)',
                borderColor: 'var(--emerald-mid)',
                '&:hover': { borderColor: 'var(--emerald-light)', backgroundColor: 'var(--emerald-dark)' }
              }}
            >
              Clone Program
            </Button>
          )}
          {programId && (
            <Stack direction="row" spacing={2} sx={{ ml: 'auto', alignItems: 'center' }}>
              {localModules?.length === 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleInitializeProgram}
                  disabled={isInitializing || isSyncingAll}
                  startIcon={isInitializing ? <CircularProgress size={14} color="inherit" /> : <Cpu size={14} />}
                  sx={{
                    backgroundColor: '#D4AF37',
                    color: '#0B0B0F',
                    fontWeight: 700,
                    '&:hover': { backgroundColor: '#F3CD57' },
                    '&.Mui-disabled': { backgroundColor: 'rgba(212, 175, 55, 0.3)', color: '#666' }
                  }}
                >
                  {isInitializing ? 'Initializing...' : 'Initialize 8 Chambers'}
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={handleSyncAll}
                disabled={isSyncingAll || isInitializing || localModules?.length === 0}
                startIcon={isSyncingAll ? <CircularProgress size={14} color="inherit" /> : <Cpu size={14} />}
                sx={{
                  color: '#D4AF37',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  '&:hover': { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.05)' },
                  '&.Mui-disabled': { borderColor: 'rgba(212, 175, 55, 0.1)', color: '#666' }
                }}
              >
                {isSyncingAll ? `Syncing (${syncProgress}%)` : 'Sync All Tasks & Routines'}
              </Button>
              <Button
                component={Link}
                to={`/admin/chambers/mental-clarity?programId=${programId}&day=1`}
                variant="outlined"
                size="small"
                sx={{
                  color: 'var(--emerald-primary)',
                  borderColor: 'var(--emerald-mid)',
                  '&:hover': { borderColor: 'var(--emerald-light)', backgroundColor: 'var(--emerald-dark)' }
                }}
              >
                Configure Daily Protocols
              </Button>
            </Stack>
          )}
        </Paper>

        {/* Progress Banner for Batch Operations */}
        {(isInitializing || isSyncingAll) && (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 800 }}>
                  {isInitializing ? 'INITIALIZING STANDARD 8 CHAMBERS STRUCTURE' : 'SYNCING ALL LESSONS & TASKS'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                  {isInitializing ? `${initProgress}%` : `${syncProgress}%`}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={isInitializing ? initProgress : syncProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#D4AF37' }
                }}
              />
              {isInitializing && initStatusText && (
                <Typography variant="caption" sx={{ color: '#B0B0B0', fontStyle: 'italic' }}>
                  {initStatusText}
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        {activeTab === 'settings' && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 4 }}>
              {programId ? 'Edit Program Settings' : 'General Settings'}
            </Typography>
            <Stack spacing={4}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>PROGRAM TITLE</Typography>
                <TextField
                  fullWidth
                  placeholder="e.g., Inner Reset: The 30-Day Sovereignty Protocol"
                  value={programData.title}
                  onChange={(e) => setProgramData({ ...programData, title: e.target.value })}
                  onBlur={() => handleSave()}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>DESCRIPTION (RICH TEXT)</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Describe the transformation..."
                  value={programData.description}
                  onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
                  onBlur={() => handleSave()}
                />
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>DURATION (DAYS)</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={programData.duration_days}
                    onChange={(e) => setProgramData({ ...programData, duration_days: parseInt(e.target.value) })}
                    onBlur={() => handleSave()}
                  />
                </Grid>
              </Grid>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>COVER IMAGE</Typography>
                <input
                  type="file"
                  accept="image/*"
                  id="cover-upload"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleCoverImageUpload(file);
                      e.target.value = '';
                    }
                  }}
                />
                <label htmlFor="cover-upload" style={{ width: '100%' }}>
                  <Box
                    sx={{
                      mt: 1,
                      p: programData.cover_image ? 0 : 6,
                      border: '2px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: 'var(--emerald-primary)',
                        backgroundColor: 'var(--emerald-mid)',
                        '& .upload-overlay': { opacity: 1 }
                      }
                    }}
                  >
                    {programData.cover_image ? (
                      <>
                        <img src={programData.cover_image} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        <Box className="upload-overlay" sx={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.3s'
                        }}>
                          <Upload size={32} color="var(--emerald-primary)" />
                          <Typography variant="button" sx={{ mt: 1, color: 'var(--emerald-primary)' }}>Change Image</Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Upload size={40} color="#666" style={{ marginBottom: 12 }} />
                        <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>Select or Drag & Drop</Typography>
                        <Typography variant="caption" sx={{ color: '#444' }}>Recommended size: 1200 x 600 px</Typography>
                      </>
                    )}

                    {uploadAssetMutation.isPending && (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        <CircularProgress sx={{ color: 'var(--emerald-primary)' }} />
                      </Box>
                    )}
                  </Box>
                </label>
              </Box>

              {programId && (
                <>
                  <Divider sx={{ my: 2, opacity: 0.1 }} />
                  <Box sx={{ pt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: '#f44336', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Trash2 size={16} /> DANGER ZONE
                    </Typography>
                    <Paper sx={{ p: 3, border: '1px solid rgba(244, 67, 54, 0.2)', backgroundColor: 'rgba(244, 67, 54, 0.02)' }}>
                      <Typography variant="body2" sx={{ mb: 2, color: '#B0B0B0' }}>
                        Deleting this program will permanently remove all its content and member enrollments. This action is irreversible.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={deleteProgramMutation.isPending ? <CircularProgress size={18} color="error" /> : <Trash2 size={18} />}
                        onClick={handleDeleteProgram}
                        disabled={deleteProgramMutation.isPending}
                        sx={{
                          fontWeight: 700,
                          borderColor: 'rgba(244, 67, 54, 0.5)',
                          '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.05)', borderColor: '#f44336' }
                        }}
                      >
                        {deleteProgramMutation.isPending ? 'Deleting...' : 'Delete Entire Program'}
                      </Button>
                    </Paper>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        )}

        {activeTab === 'modules' && (
          <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Days & Tasks Configuration</Typography>
              <Button
                variant="contained"
                onClick={() => {
                  const nextDay = dayIndices.length > 0 ? Math.max(...dayIndices) + 1 : 1;
                  setDayIndices([...dayIndices, nextDay]);
                }}
                startIcon={<Plus size={16} />}
                sx={{ backgroundColor: 'var(--emerald-primary)', color: '#0B0B0F', fontWeight: 700 }}
              >
                Add Day Allotment
              </Button>
            </Box>

            {!programId ? (
              <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="body1" sx={{ color: '#888' }}>
                  Please select or create a program first to configure its days and tasks.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={4}>
                {(() => {
                  return dayIndices.map((dayNum) => {
                    // Gather all tasks created in any chamber for this day
                    const dayTasks: any[] = [];
                    localModules.forEach(m => {
                      const lesson = m.lessons?.find((l: any) => l.day_number === dayNum);
                      if (lesson) {
                        // Task 6: Temporarily log Lesson ID and Day number
                        console.log(`[DEBUG] Lesson ID: ${lesson.id}, Day number: ${dayNum}`);
                      }
                      lesson?.tasks?.forEach((t: any) => {
                        dayTasks.push({
                          ...t,
                          chamberName: m.title,
                          lessonId: lesson.id
                        });
                      });
                    });

                    return (
                      <Paper 
                        key={dayNum} 
                        sx={{ 
                          p: 3, 
                          border: '1px solid rgba(255, 255, 255, 0.05)', 
                          backgroundColor: 'rgba(255, 255, 255, 0.01)',
                          borderRadius: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flexGrow: 1, mr: 2 }}>
                            <TextField
                              variant="standard"
                              value={dayTitles[dayNum] !== undefined ? dayTitles[dayNum] : `Day ${dayNum}: Protocol Allotment`}
                              onChange={(e) => setDayTitles(prev => ({ ...prev, [dayNum]: e.target.value }))}
                              onBlur={(e) => handleUpdateDayTitle(dayNum, e.target.value)}
                              slotProps={{
                                input: {
                                  sx: {
                                    fontSize: '1.25rem',
                                    fontWeight: 800,
                                    color: 'var(--emerald-primary)',
                                    borderBottom: '1px dashed rgba(16, 185, 129, 0.3)',
                                    '&:hover': { borderBottom: '1px dashed var(--emerald-primary)' }
                                  }
                                }
                              }}
                              fullWidth
                            />
                            <Typography variant="caption" sx={{ color: '#B0B0B0', mt: 1, display: 'block' }}>
                              Rename the title above. Allot tasks configured in the Chambers for this day.
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            {dayTasks.length > 0 && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => openDeleteAllDialog(dayNum)}
                                sx={{
                                  color: '#B0B0B0',
                                  borderColor: 'rgba(255, 255, 255, 0.15)',
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  whiteSpace: 'nowrap',
                                  '&:hover': {
                                    borderColor: '#ff4d4d',
                                    backgroundColor: 'rgba(255, 77, 77, 0.05)',
                                    color: '#ff4d4d'
                                  }
                                }}
                              >
                                Clear All Tasks
                              </Button>
                            )}
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleDeleteDay(dayNum)}
                              sx={{
                                color: '#ff4d4d',
                                borderColor: 'rgba(255, 77, 77, 0.3)',
                                fontWeight: 700,
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  borderColor: '#ff4d4d',
                                  backgroundColor: 'rgba(255, 77, 77, 0.05)',
                                  color: '#f44336'
                                }
                              }}
                            >
                              Delete Day Block
                            </Button>
                          </Box>
                        </Box>

                        {/* Task Allotment Form for this Day */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 3, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#eaeaea' }}>
                            Allot Task:
                          </Typography>

                          {/* 1. Chamber Select */}
                          <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel id={`chamber-select-label-${dayNum}`} sx={{ fontSize: '0.8rem' }}>Chamber</InputLabel>
                            <Select
                              labelId={`chamber-select-label-${dayNum}`}
                              label="Chamber"
                              value={tempSelectedChamber[dayNum] || ''}
                              onChange={(e) => {
                                setTempSelectedChamber(prev => ({ ...prev, [dayNum]: e.target.value }));
                                setTempSelectedTask(prev => ({ ...prev, [dayNum]: '' })); // reset task selection
                              }}
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {localModules.map(m => (
                                <MenuItem key={m.id} value={m.id} sx={{ fontSize: '0.8rem' }}>{m.title}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {/* 2. Task Select */}
                          <FormControl size="small" sx={{ minWidth: 220 }} disabled={!tempSelectedChamber[dayNum]}>
                            <InputLabel id={`task-select-label-${dayNum}`} sx={{ fontSize: '0.8rem' }}>Select Task</InputLabel>
                            <Select
                              labelId={`task-select-label-${dayNum}`}
                              label="Select Task"
                              value={tempSelectedTask[dayNum] || ''}
                              onChange={(e) => setTempSelectedTask(prev => ({ ...prev, [dayNum]: e.target.value }))}
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {(() => {
                                const selectedChamberMod = localModules.find(m => m.id === tempSelectedChamber[dayNum]);
                                const poolLesson = selectedChamberMod?.lessons?.find((l: any) => l.day_number === 0);
                                const poolTasks = poolLesson?.tasks || [];
                                if (poolTasks.length === 0) {
                                  return <MenuItem disabled value="" sx={{ fontSize: '0.8rem' }}>No unallotted tasks in this chamber</MenuItem>;
                                }
                                return poolTasks.map((t: any) => (
                                  <MenuItem key={t.id} value={t.id} sx={{ fontSize: '0.8rem' }}>{t.title}</MenuItem>
                                ));
                              })()}
                            </Select>
                          </FormControl>

                          {/* 3. Routine Window Select */}
                          <FormControl size="small" sx={{ minWidth: 150 }} disabled={!tempSelectedTask[dayNum]}>
                            <InputLabel id={`window-select-label-${dayNum}`} sx={{ fontSize: '0.8rem' }}>Window</InputLabel>
                            <Select
                              labelId={`window-select-label-${dayNum}`}
                              label="Window"
                              value={tempSelectedWindow[dayNum] || 'Morning'}
                              onChange={(e) => setTempSelectedWindow(prev => ({ ...prev, [dayNum]: e.target.value }))}
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night'].map((w) => (
                                <MenuItem key={w} value={w} sx={{ fontSize: '0.8rem' }}>{w}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleAllotTask(
                              tempSelectedTask[dayNum],
                              tempSelectedChamber[dayNum],
                              dayNum,
                              tempSelectedWindow[dayNum] || 'Morning'
                            )}
                            disabled={!tempSelectedTask[dayNum]}
                            sx={{ 
                              backgroundColor: 'var(--emerald-primary)', 
                              color: '#0B0B0F', 
                              fontWeight: 700, 
                              ml: 'auto',
                              '&.Mui-disabled': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'rgba(255, 255, 255, 0.25)'
                              }
                            }}
                          >
                            Allot Task
                          </Button>
                        </Box>

                        <Divider sx={{ mb: 3, opacity: 0.05 }} />

                        <Grid container spacing={3}>
                          {['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night', 'Unassigned'].map((windowName) => {
                            const windowTasks = dayTasks.filter((t: any) => {
                              const taskWindow = t.content?.routine_window || 'Unassigned';
                              if (windowName === 'Unassigned') {
                                return !t.content?.routine_window || t.content?.routine_window === 'Unassigned';
                              }
                              return taskWindow === windowName;
                            });

                            return (
                              <Grid size={{ xs: 12, md: 6 }} key={windowName}>
                                <Paper 
                                  sx={{ 
                                    p: 2, 
                                    backgroundColor: 'rgba(255, 255, 255, 0.01)', 
                                    border: '1px solid rgba(255, 255, 255, 0.03)',
                                    minHeight: 120
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: windowName === 'Unassigned' ? '#888' : '#D4AF37', fontWeight: 800 }}>
                                      {windowName.toUpperCase()} {windowName === 'Unassigned' && '(NOT ALLOTTED)'}
                                    </Typography>
                                    {windowName !== 'Unassigned' && windowTasks.length > 0 && (
                                      <Button
                                        size="small"
                                        startIcon={<Trash2 size={12} />}
                                        onClick={() => handleClearWindow(dayNum, windowName)}
                                        sx={{
                                          color: '#ff4d4d',
                                          fontSize: '0.7rem',
                                          textTransform: 'none',
                                          p: 0.5,
                                          minWidth: 0,
                                          '&:hover': {
                                            backgroundColor: 'rgba(255, 77, 77, 0.05)',
                                            color: '#ff3333'
                                          }
                                        }}
                                      >
                                        Clear Window
                                      </Button>
                                    )}
                                  </Box>

                                  <Stack spacing={2}>
                                    {windowTasks.map((task: any) => (
                                      <Box 
                                        key={task.id} 
                                        sx={{ 
                                          p: 2, 
                                          borderRadius: 1, 
                                          backgroundColor: 'rgba(255,255,255,0.02)', 
                                          border: '1px solid rgba(255,255,255,0.05)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: 2
                                        }}
                                      >
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            {task.title}
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                                            Chamber: {task.chamberName} • {task.type?.toUpperCase()}
                                          </Typography>
                                        </Box>

                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                          <FormControl size="small" sx={{ minWidth: 140 }}>
                                            <Select
                                              value={task.content?.routine_window || 'Unassigned'}
                                              onChange={(e) => handleUpdateTaskWindow(task, e.target.value, dayNum)}
                                              sx={{ backgroundColor: 'rgba(0,0,0,0.2)', fontSize: '0.8rem' }}
                                            >
                                              <MenuItem value="Unassigned" sx={{ fontSize: '0.8rem' }}>Unassigned</MenuItem>
                                              <MenuItem value="Morning" sx={{ fontSize: '0.8rem' }}>Morning</MenuItem>
                                              <MenuItem value="Mid-Morning" sx={{ fontSize: '0.8rem' }}>Mid-Morning</MenuItem>
                                              <MenuItem value="Midday" sx={{ fontSize: '0.8rem' }}>Midday</MenuItem>
                                              <MenuItem value="Afternoon" sx={{ fontSize: '0.8rem' }}>Afternoon</MenuItem>
                                              <MenuItem value="Evening" sx={{ fontSize: '0.8rem' }}>Evening</MenuItem>
                                              <MenuItem value="Night" sx={{ fontSize: '0.8rem' }}>Night</MenuItem>
                                            </Select>
                                          </FormControl>

                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              if (window.confirm('Are you sure you want to permanently delete this task?')) {
                                                handleDeleteTask(task.lessonId || task.lesson_id, task.id);
                                              }
                                            }}
                                            sx={{ color: '#f44336', '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.05)' } }}
                                            title="Permanently Delete Task"
                                          >
                                            <Trash2 size={16} />
                                          </IconButton>
                                        </Stack>
                                      </Box>
                                    ))}

                                    {windowTasks.length === 0 && (
                                      <Typography variant="caption" sx={{ color: '#444', fontStyle: 'italic', display: 'block', textAlign: 'center', py: 2 }}>
                                        No tasks in this window
                                      </Typography>
                                    )}
                                  </Stack>
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Paper>
                    );
                  });
                })()}
              </Stack>
            )}
          </Box>
        )}



        {activeTab === 'created' && (
          <CreatedProgramTab />
        )}
      </Box>

      <ProgramImportModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        programId={programId}
        onImportSuccess={handleImportSuccess}
      />

      <ProgramCloneModal
        open={isCloneOpen}
        onClose={() => setIsCloneOpen(false)}
        targetProgramId={programId}
        onCloneSuccess={handleCloneSuccess}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        slotProps={{
          paper: {
            sx: { 
              backgroundColor: '#121217', 
              border: '1px solid rgba(255, 77, 77, 0.2)', 
              minWidth: { xs: 280, sm: 400 } 
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ff4d4d' }}>
          Delete All Lesson Tasks?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
            This will remove all allotted tasks from this lesson/day. 
            Chamber Pool tasks will NOT be deleted. Only lesson allocations will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: '#B0B0B0' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmDeleteAll}
            sx={{ 
              backgroundColor: '#ff4d4d', 
              color: '#ffffff', 
              fontWeight: 700,
              '&:hover': {
                backgroundColor: '#e60000'
              }
            }}
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const ProgramCurriculumView = ({ programId }: { programId: string }) => {
  const { data: details, isLoading } = useProgramDetails(programId);

  if (isLoading) {
    return <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} sx={{ color: 'var(--emerald-primary)' }} /></Box>;
  }

  if (!details || !details.modules || details.modules.length === 0) {
    return <Typography sx={{ p: 2, color: '#666', fontStyle: 'italic', fontSize: '0.85rem' }}>No modules or tasks created for this program yet.</Typography>;
  }

  return (
    <Stack spacing={2} sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: 1 }}>
      {details.modules.map((mod: any, mIdx: number) => (
        <Box key={mod.id} sx={{ borderLeft: '2px solid var(--emerald-primary)', pl: 2, py: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#EAEAEA', fontSize: '0.9rem' }}>
            Module {mIdx + 1}: {mod.title}
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {mod.lessons?.map((les: any) => (
              <Box key={les.id} sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#B0B0B0', fontSize: '0.8rem' }}>
                  Day {les.day_number}: {les.title}
                </Typography>
                <Stack spacing={0.5} sx={{ pl: 2, mt: 0.5 }}>
                  {les.tasks?.map((task: any, tIdx: number) => (
                    <Typography key={task.id} variant="caption" sx={{ color: '#888', display: 'block' }}>
                      Task {tIdx + 1}: {task.title} ({task.content?.routine_window || 'General'} • {task.type})
                    </Typography>
                  ))}
                  {(!les.tasks || les.tasks.length === 0) && (
                    <Typography variant="caption" sx={{ color: '#444', fontStyle: 'italic' }}>No tasks</Typography>
                  )}
                </Stack>
              </Box>
            ))}
            {(!mod.lessons || mod.lessons.length === 0) && (
              <Typography variant="caption" sx={{ color: '#444', fontStyle: 'italic', pl: 2 }}>No lessons</Typography>
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};

const CreatedProgramTab = () => {
  const { data: allPrograms, isLoading: isLoadingPrograms } = usePrograms();
  const { data: allUsers, isLoading: isLoadingUsers } = useUsers();
  const enrollUserMutation = useEnrollUser();
  const deleteProgramMutation = useDeleteProgram();
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);

  // Assignment state
  const [assigningProgram, setAssigningProgram] = useState<any | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignSnackbar, setAssignSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleDeleteProgram = async (e: React.MouseEvent, program: any) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete the program "${program.title}" and all its modules, lessons, and tasks?`)) {
      try {
        await deleteProgramMutation.mutateAsync(program.id);
        setAssignSnackbar({
          open: true,
          message: `Program "${program.title}" has been deleted successfully!`,
          severity: 'success'
        });
      } catch (err: any) {
        console.error(err);
        setAssignSnackbar({
          open: true,
          message: `Failed to delete program: ${err.message || err}`,
          severity: 'error'
        });
      }
    }
  };

  const handleAssignClick = (e: React.MouseEvent, program: any) => {
    e.stopPropagation();
    setAssigningProgram(program);
    setSelectedUserId('');
  };

  const handleConfirmAssignment = async () => {
    if (!selectedUserId || !assigningProgram) return;
    try {
      await enrollUserMutation.mutateAsync({
        userId: selectedUserId,
        programId: assigningProgram.id
      });
      const userObj = allUsers?.find(u => u.id === selectedUserId);
      setAssignSnackbar({
        open: true,
        message: `Successfully enrolled ${userObj?.full_name || 'user'} in "${assigningProgram.title}"!`,
        severity: 'success'
      });
      setAssigningProgram(null);
    } catch (err: any) {
      console.error(err);
      setAssignSnackbar({
        open: true,
        message: `Failed to enroll user: ${err.message || err}`,
        severity: 'error'
      });
    }
  };

  if (isLoadingPrograms) {
    return <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: 'var(--emerald-primary)' }} /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Created & Saved Programs</Typography>
        <Typography variant="caption" sx={{ color: '#B0B0B0' }}>Inspect curriculum structures and assign programs to users.</Typography>
      </Box>

      {(!allPrograms || allPrograms.length === 0) ? (
        <Typography sx={{ color: '#666', fontStyle: 'italic', textAlign: 'center', py: 4 }}>No programs have been created yet. Go to General Settings to start.</Typography>
      ) : (
        <Stack spacing={2.5}>
          {allPrograms.map((p) => {
            const isExpanded = expandedProgramId === p.id;
            return (
              <Paper
                key={p.id}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isExpanded ? 'var(--emerald-primary)' : 'rgba(255, 255, 255, 0.05)',
                  backgroundColor: 'rgba(18, 18, 23, 0.4)',
                  overflow: 'hidden',
                  transition: 'all 0.3s'
                }}
              >
                {/* Program Header Bar */}
                <Box
                  onClick={() => setExpandedProgramId(isExpanded ? null : p.id)}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' }
                  }}
                >
                  <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 2,
                        backgroundColor: 'rgba(212, 175, 55, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#D4AF37'
                      }}
                    >
                      <Award size={26} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#EAEAEA', fontSize: '1.1rem' }}>
                        {p.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#888', fontSize: '0.8rem', mt: 0.5 }}>
                        Duration: {p.duration_days} Days • Status: {p.is_published ? 'Published' : 'Draft'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={deleteProgramMutation.isPending ? <CircularProgress size={14} sx={{ color: '#f44336' }} /> : <Trash2 size={14} />}
                      onClick={(e) => handleDeleteProgram(e, p)}
                      disabled={deleteProgramMutation.isPending}
                      sx={{
                        borderColor: 'rgba(244, 67, 54, 0.4)',
                        color: '#f44336',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        '&:hover': { 
                          borderColor: '#f44336', 
                          backgroundColor: 'rgba(244, 67, 54, 0.05)' 
                        }
                      }}
                    >
                      {deleteProgramMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<UserCheck size={16} />}
                      onClick={(e) => handleAssignClick(e, p)}
                      sx={{
                        backgroundColor: 'var(--emerald-primary)',
                        color: '#0B0B0F',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        '&:hover': { backgroundColor: 'var(--emerald-light)' }
                      }}
                    >
                      Assign to User
                    </Button>
                    <Box sx={{ color: isExpanded ? 'var(--emerald-primary)' : '#666' }}>
                      {isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                    </Box>
                  </Stack>
                </Box>

                {/* Program Description */}
                {p.description && (
                  <Box sx={{ px: 3, pb: 2, borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ color: '#B0B0B0', fontStyle: 'italic', fontSize: '0.85rem' }}
                      component="div"
                      dangerouslySetInnerHTML={{ __html: p.description }}
                    />
                  </Box>
                )}

                {/* Collapsible Curriculum View */}
                {isExpanded && (
                  <Box sx={{ p: 2.5, backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 800, mb: 2, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      Curriculum Structure
                    </Typography>
                    <ProgramCurriculumView programId={p.id} />
                  </Box>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* User Assignment Dialog */}
      <Dialog
        open={Boolean(assigningProgram)}
        onClose={() => setAssigningProgram(null)}
        slotProps={{
          paper: {
            sx: { backgroundColor: '#121217', border: '1px solid var(--emerald-mid)', minWidth: { xs: 280, sm: 400 } }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'var(--emerald-primary)' }}>
          Assign Program
        </DialogTitle>
        <DialogContent>
          {assigningProgram && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                Select a user to enroll in <strong>{assigningProgram.title}</strong>:
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="user-select-label" sx={{ color: '#888' }}>Select User</InputLabel>
                <Select
                  labelId="user-select-label"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  label="Select User"
                  sx={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                >
                  <MenuItem value="" disabled><em>Choose User</em></MenuItem>
                  {isLoadingUsers ? (
                    <MenuItem disabled>Loading users...</MenuItem>
                  ) : (
                    allUsers?.map(user => {
                      const activeEnroll = user.enrollments?.find(e => e.status === 'active');
                      return (
                        <MenuItem key={user.id} value={user.id}>
                          {user.full_name || 'Name N/A'} ({user.email}) {activeEnroll ? `[Active: ${activeEnroll.programs?.title || 'Program'}]` : '[No Active Program]'}
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAssigningProgram(null)} sx={{ color: '#B0B0B0' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmAssignment}
            disabled={!selectedUserId || enrollUserMutation.isPending}
            sx={{ backgroundColor: 'var(--emerald-primary)', color: '#0B0B0F', fontWeight: 700 }}
          >
            {enrollUserMutation.isPending ? 'Enrolling...' : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={assignSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setAssignSnackbar({ ...assignSnackbar, open: false })}
      >
        <Alert onClose={() => setAssignSnackbar({ ...assignSnackbar, open: false })} severity={assignSnackbar.severity} sx={{ width: '100%' }}>
          {assignSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProgramBuilder;



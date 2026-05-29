

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
  UserCheck
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

  const [taskSelectorAnchor, setTaskSelectorAnchor] = useState<null | HTMLElement>(null);
  const [selectorDay, setSelectorDay] = useState<any>(null);
  const [selectorWindow, setSelectorWindow] = useState<string>('');
  const [selectorChamber, setSelectorChamber] = useState<string>('');
  const [selectorSelectedTaskIds, setSelectorSelectedTaskIds] = useState<string[]>([]);

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
  const { data: programDetails, isLoading: isLoadingDetails } = useProgramDetails(programId || '');

  const [programData, setProgramData] = useState({
    title: '',
    description: '',
    duration_days: 30,
    cover_image: '',
    is_published: false
  });

  const [localModules, setLocalModules] = useState<any[]>([]);

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

  const syncLessonRoutine = async (lessonId: string, updatedModulesList?: any[]) => {
    const modulesSource = updatedModulesList || localModules;
    // 1. Find the lesson and its tasks
    let lesson: any = null;
    modulesSource.forEach(m => {
      const found = m.lessons?.find((l: any) => l.id === lessonId);
      if (found) {
        lesson = found;
      }
    });

    if (!lesson) return;

    // 2. Map tasks to windows
    const routineWindows = ['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
    const routineData = routineWindows.map(windowName => {
      const tasks = lesson.tasks?.filter((t: any) => t.content?.routine_window === windowName) || [];
      if (tasks.length === 0) return null;

      const anchor = tasks.map((t: any) => t.title).join(' · ');
      const instruction = tasks.map((t: any) => `<p>${t.description || t.content?.text || ''}</p>`).join('');

      // Determine system name
      const systemName = windowName === 'Morning' ? 'Mental Clarity' : 
                         windowName === 'Mid-Morning' ? 'The Frequency Field' :
                         windowName === 'Midday' ? 'The Plate' :
                         windowName === 'Afternoon' ? 'Breath Atelier' :
                         windowName === 'Evening' ? 'The Signature' : 'Sleep Cocoon';

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
      setLocalModules(programDetails.modules || []);
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

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleSave = async (overrides: any = {}) => {
    // Prevent saving if title is empty (unless we are passing a title in overrides)
    if (!programData.title && !overrides.title) return;

    // Prevent multiple simultaneous saves for new programs to avoid duplicate records
    if (!programId && saveProgramMutation.isPending) return;

    try {
      const payload = {
        ...programData,
        ...overrides,
        id: programId || undefined
      };

      const saved = await saveProgramMutation.mutateAsync(payload);

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
      await handleSave({ is_published: true });
      setNotification({ open: true, message: 'Program published and live!', severity: 'success' });
    } catch (err) {
      // Error handled in handleSave
    }
  };

  const handleSaveDraft = async () => {
    try {
      await handleSave({ is_published: false });
      setNotification({ open: true, message: 'Draft saved successfully.', severity: 'success' });
    } catch (err) {
      // Error handled in handleSave
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

  const handleAddTask = async (lessonId: string, type: 'checklist' | 'audio' | 'video' | 'text' = 'checklist') => {
    try {
      const newTask = await saveTaskMutation.mutateAsync({
        lesson_id: lessonId,
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type,
        order_index: 0,
        content: {}
      });

      // Update local state to reflect new task
      setLocalModules(prev => prev.map(m => ({
        ...m,
        lessons: m.lessons?.map((l: any) =>
          l.id === lessonId ? { ...l, tasks: [...(l.tasks || []), newTask] } : l
        )
      })));

      setNotification({ open: true, message: 'Task added!', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to add task.', severity: 'error' });
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

  const handleFileUpload = async (lessonId: string, task: any, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}-${Date.now()}.${fileExt}`;
      const bucket = 'program-assets';

      const publicUrl = await uploadAssetMutation.mutateAsync({
        file,
        bucket,
        path: `tasks/${fileName}`
      });

      const updatedTask = {
        ...task,
        content: { ...task.content, url: publicUrl }
      };

      await saveTaskMutation.mutateAsync(updatedTask);

      setLocalModules(prev => prev.map(m => ({
        ...m,
        lessons: m.lessons?.map((l: any) =>
          l.id === lessonId ? {
            ...l,
            tasks: l.tasks?.map((t: any) => t.id === task.id ? updatedTask : t)
          } : l
        )
      })));

      setNotification({ open: true, message: 'File uploaded successfully!', severity: 'success' });
    } catch (err) {
      console.error(err);
      setNotification({ open: true, message: 'Upload failed. Ensure bucket "program-assets" exists.', severity: 'error' });
    }
  };

  const handleCoverImageUpload = async (file: File) => {
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
    } catch (err) {
      console.error(err);
      setNotification({ open: true, message: 'Cover upload failed.', severity: 'error' });
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
      let totalLessons = 0;
      localModules.forEach(m => {
        totalLessons += (m.lessons || []).length;
      });

      if (totalLessons === 0) {
        setNotification({ open: true, message: 'No lessons found to sync.', severity: 'error' });
        setIsSyncingAll(false);
        return;
      }

      let processed = 0;
      const newModules = JSON.parse(JSON.stringify(localModules));

      for (let mIdx = 0; mIdx < newModules.length; mIdx++) {
        const module = newModules[mIdx];
        const moduleChamberKey = matchChamberKey(module.title);

        if (!moduleChamberKey) continue;

        for (let lIdx = 0; lIdx < (module.lessons || []).length; lIdx++) {
          const lesson = module.lessons[lIdx];
          const dayNum = lesson.day_number || 1;

          // 1. Sync Routine Description
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

          const routineData: any[] = [];
          CHAMBER_KEYS.forEach(chamberKey => {
            const script = getChamberScriptForProgram(programId, chamberKey, dayNum);
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
          lesson.description = newDescription;

          const { tasks, ...payload } = lesson;
          await saveLessonMutation.mutateAsync({
            ...payload,
            description: newDescription
          });

          // 2. Sync Tasks
          const steps = getCombinedStepsForDay(programId, dayNum);
          if (steps.length > 0) {
            const existingTasks = lesson.tasks || [];
            const updatedTasksList = [...existingTasks];

            for (let sIdx = 0; sIdx < steps.length; sIdx++) {
              const step = steps[sIdx];
              const existingTaskIndex = updatedTasksList.findIndex(t => t.title === step.title);

              let mappedType: 'checklist' | 'audio' | 'video' | 'text' = 'text';
              if (step.type === 'audio') mappedType = 'audio';
              else if (step.type === 'video') mappedType = 'video';
              else mappedType = 'text';

              const targetContent = {
                routine_window: step.routineWindow,
                url: step.contentUrl || '',
                text: step.textContent || ''
              };

              if (existingTaskIndex >= 0) {
                const existingTask = updatedTasksList[existingTaskIndex];
                const contentDiffers = JSON.stringify(existingTask.content || {}) !== JSON.stringify(targetContent) || existingTask.type !== mappedType;

                if (contentDiffers) {
                  const updatedTask = {
                    ...existingTask,
                    type: mappedType,
                    content: targetContent
                  };
                  await saveTaskMutation.mutateAsync(updatedTask);
                  updatedTasksList[existingTaskIndex] = updatedTask;
                }
              } else {
                const newTask = await saveTaskMutation.mutateAsync({
                  lesson_id: lesson.id,
                  title: step.title,
                  type: mappedType,
                  order_index: sIdx,
                  content: targetContent
                });
                updatedTasksList.push(newTask);
              }
            }
            lesson.tasks = updatedTasksList;
          }

          processed++;
          setSyncProgress(Math.round((processed / totalLessons) * 100));
        }
      }

      setLocalModules(newModules);
      setNotification({ open: true, message: 'All lessons and tasks synced successfully!', severity: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ open: true, message: `Failed to sync all: ${err.message || err}`, severity: 'error' });
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
    const duration = programData.duration_days || 30;
    const chambersList = [
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

        const lessonsList: any[] = [];
        const chamberKey = matchChamberKey(chamberTitle);
        const dayTitles = getChamberDayTitlesForProgram(programId, chamberKey, duration);

        // 2. Create Lessons for this module
        for (let d = 1; d <= duration; d++) {
          setInitStatusText(`Creating Lesson: ${chamberTitle} — Day ${d} of ${duration}...`);

          const dayTitle = dayTitles.find(t => t.day === d)?.title || `Day ${d}`;

          // Generate combined routine HTML
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

          const routineData: any[] = [];
          CHAMBER_KEYS.forEach(ck => {
            const script = getChamberScriptForProgram(programId, ck, d);
            if ((script.steps && script.steps.length > 0) || script.directive) {
              const info = CHAMBERS_INFO[ck as keyof typeof CHAMBERS_INFO];
              const chamberName = info ? info.name : ck.toUpperCase();
              const defaultAnchor = info ? (info as any).defaultAnchor : 'Varies';
              const window = getChamberWindow(ck, script.when);
              const chamberIndex = CHAMBER_KEYS.indexOf(ck as any);

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

          const routineHtml = generateRoutineHtml(cleanRoutineData);

          const newLesson = await saveLessonMutation.mutateAsync({
            module_id: newMod.id,
            title: dayTitle,
            day_number: d,
            unlock_day: d,
            description: routineHtml
          });

          // 3. Sync Tasks for this lesson
          const steps = getCombinedStepsForDay(programId, d);
          const tasksList: any[] = [];
          if (steps.length > 0) {
            for (let sIdx = 0; sIdx < steps.length; sIdx++) {
              const step = steps[sIdx];

              let mappedType: 'checklist' | 'audio' | 'video' | 'text' = 'text';
              if (step.type === 'audio') mappedType = 'audio';
              else if (step.type === 'video') mappedType = 'video';
              else mappedType = 'text';

              const targetContent = {
                routine_window: step.routineWindow,
                url: step.contentUrl || '',
                text: step.textContent || ''
              };

              const newTask = await saveTaskMutation.mutateAsync({
                lesson_id: newLesson.id,
                title: step.title,
                type: mappedType,
                order_index: sIdx,
                content: targetContent
              });
              tasksList.push(newTask);
            }
          }

          lessonsList.push({
            ...newLesson,
            tasks: tasksList
          });

          const currentTotalProcessed = i * duration + d;
          const grandTotal = chambersList.length * duration;
          setInitProgress(Math.round((currentTotalProcessed / grandTotal) * 100));
        }

        initializedModules.push({
          ...newMod,
          lessons: lessonsList
        });
      }

      setLocalModules([...(localModules || []), ...initializedModules]);
      setNotification({ open: true, message: `Successfully initialized standard ${duration}-day structure and synced all tasks/routines!`, severity: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ open: true, message: `Initialization failed: ${err.message || err}`, severity: 'error' });
    } finally {
      setIsInitializing(false);
      setInitStatusText('');
    }
  };

  const syncTasksFromChambers = async () => {
    if (!localModules || localModules.length === 0) return;

    let syncedAny = false;
    const newModules = JSON.parse(JSON.stringify(localModules));

    for (let mIdx = 0; mIdx < newModules.length; mIdx++) {
      const module = newModules[mIdx];
      const moduleChamberKey = matchChamberKey(module.title);

      if (!moduleChamberKey) continue;

      for (let lIdx = 0; lIdx < (module.lessons || []).length; lIdx++) {
        const lesson = module.lessons[lIdx];
        const dayNum = lesson.day_number || 1;
        const steps = getCombinedStepsForDay(programId, dayNum);

        if (steps.length === 0) continue;

        const existingTasks = lesson.tasks || [];
        const updatedTasksList = [...existingTasks];
        let lessonUpdated = false;

        for (let sIdx = 0; sIdx < steps.length; sIdx++) {
          const step = steps[sIdx];

          const existingTaskIndex = updatedTasksList.findIndex(t => t.title === step.title);

          let mappedType: 'checklist' | 'audio' | 'video' | 'text' = 'text';
          if (step.type === 'audio') mappedType = 'audio';
          else if (step.type === 'video') mappedType = 'video';
          else mappedType = 'text';

          const targetContent = {
            routine_window: step.routineWindow,
            url: step.contentUrl || '',
            text: step.textContent || ''
          };

          if (existingTaskIndex >= 0) {
            const existingTask = updatedTasksList[existingTaskIndex];
            const contentDiffers = JSON.stringify(existingTask.content || {}) !== JSON.stringify(targetContent) || existingTask.type !== mappedType;

            if (contentDiffers) {
              const updatedTask = {
                ...existingTask,
                type: mappedType,
                content: targetContent
              };

              await saveTaskMutation.mutateAsync(updatedTask);
              updatedTasksList[existingTaskIndex] = updatedTask;
              lessonUpdated = true;
              syncedAny = true;
            }
          } else {
            const newTask = await saveTaskMutation.mutateAsync({
              lesson_id: lesson.id,
              title: step.title,
              type: mappedType,
              order_index: sIdx,
              content: targetContent
            });

            updatedTasksList.push(newTask);
            lessonUpdated = true;
            syncedAny = true;
          }
        }

        if (lessonUpdated) {
          module.lessons[lIdx] = {
            ...lesson,
            tasks: updatedTasksList
          };
        }
      }
    }

    if (syncedAny) {
      setLocalModules(newModules);
      setNotification({
        open: true,
        message: 'Successfully auto-synced tasks from Chambers configuration.',
        severity: 'success'
      });
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

  const persistTask = async (task: any) => {
    try {
      await saveTaskMutation.mutateAsync(task);
      await syncLessonRoutine(task.lesson_id);
      setNotification({ open: true, message: 'Task updated.', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to update task.', severity: 'error' });
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
            disabled={saveProgramMutation.isPending || !programData.title}
            sx={{ color: '#B0B0B0', borderColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            startIcon={saveProgramMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            onClick={handlePublish}
            disabled={saveProgramMutation.isPending || !programData.title}
            sx={{
              backgroundColor: 'var(--emerald-primary)',
              color: '#0B0B0F',
              fontWeight: 700,
              '&:hover': { backgroundColor: 'var(--emerald-light)' },
              '&.Mui-disabled': { backgroundColor: 'var(--emerald-mid)', opacity: 0.5 }
            }}
          >
            {saveProgramMutation.isPending ? 'Publishing...' : 'Publish Program'}
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
              { id: 'tasks', label: 'Task Engineering', icon: Plus },
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
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'var(--emerald-deep)', border: '1px solid var(--emerald-mid)' }}>
          <Typography variant="body2" sx={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>ACTIVE PROGRAM:</Typography>
          <FormControl size="small" sx={{ minWidth: 300 }}>
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
                    if (file) handleCoverImageUpload(file);
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
                startIcon={<Plus size={18} />}
                onClick={async () => {
                  if (!programId) {
                    setNotification({ open: true, message: 'Please save the program settings first.', severity: 'error' });
                    return;
                  }
                  // 1. Ensure we have a main module for daily protocols
                  let mainMod = localModules.find(m => m.title === 'Daily Protocols' || m.title === 'Program Protocols');
                  if (!mainMod && localModules.length > 0) {
                    mainMod = localModules[0];
                  }
                  if (!mainMod) {
                    try {
                      mainMod = await saveModuleMutation.mutateAsync({
                        program_id: programId,
                        title: 'Daily Protocols',
                        order_index: 1
                      });
                      setLocalModules([ { ...mainMod, lessons: [] } ]);
                    } catch (err) {
                      setNotification({ open: true, message: 'Failed to initialize protocols container.', severity: 'error' });
                      return;
                    }
                  }

                  // 2. Add a new Day (lesson) to this module
                  try {
                    let maxDay = 0;
                    localModules.forEach(m => {
                      m.lessons?.forEach((l: any) => {
                        if (l.day_number > maxDay) maxDay = l.day_number;
                      });
                    });

                    const newDayNumber = maxDay + 1;
                    const defaultRoutine = [
                      { window: 'Morning', system: 'Mental Clarity', anchor: 'Daily focus', instruction: '' },
                      { window: 'Mid-Morning', system: 'Activation', anchor: 'Routine', instruction: '' },
                      { window: 'Midday', system: 'Nutrition', anchor: 'Meal check', instruction: '' },
                      { window: 'Afternoon', system: 'Reset', anchor: 'Audio guide', instruction: '' },
                      { window: 'Evening', system: 'Parasympathetic Descent', anchor: 'Relaxation', instruction: '' },
                      { window: 'Night', system: 'Sleep Cocoon', anchor: 'Sleep prep', instruction: '' }
                    ];
                    const defaultHtml = generateRoutineHtml(defaultRoutine);

                    const newLesson = await saveLessonMutation.mutateAsync({
                      module_id: mainMod.id,
                      title: `Day ${newDayNumber} Protocol`,
                      day_number: newDayNumber,
                      unlock_day: newDayNumber,
                      description: defaultHtml
                    });

                    setLocalModules(prev => prev.map(m => 
                      m.id === mainMod.id ? { ...m, lessons: [...(m.lessons || []), { ...newLesson, tasks: [] }] } : m
                    ));
                    setNotification({ open: true, message: `Day ${newDayNumber} added!`, severity: 'success' });
                  } catch (err) {
                    setNotification({ open: true, message: 'Failed to add Day.', severity: 'error' });
                  }
                }}
                disabled={!programId}
                sx={{ backgroundColor: 'var(--emerald-primary)', color: '#0B0B0F', fontWeight: 700, '&:hover': { backgroundColor: 'var(--emerald-light)' } }}
              >
                Add Day
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
                  const allDays: any[] = [];
                  localModules.forEach(m => {
                    m.lessons?.forEach((l: any) => {
                      allDays.push({ ...l, moduleId: m.id });
                    });
                  });

                  allDays.sort((a, b) => (a.day_number || 0) - (b.day_number || 0));

                  if (allDays.length === 0) {
                    return (
                      <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                        <Typography variant="body1" sx={{ color: '#888', mb: 2 }}>
                          No days/protocols configured for this program yet.
                        </Typography>
                      </Paper>
                    );
                  }

                  return allDays.map((day) => (
                    <Paper 
                      key={day.id} 
                      sx={{ 
                        p: 3, 
                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            label="Day #"
                            value={day.day_number}
                            onChange={(e) => updateLessonDayNumber(day.moduleId, day.id, Math.max(1, parseInt(e.target.value) || 1))}
                            onBlur={() => persistLesson(day)}
                            sx={{ width: 80 }}
                            slotProps={{ htmlInput: { min: 1 } }}
                          />
                          <TextField
                            size="small"
                            label="Day Protocol Title"
                            value={day.title}
                            onChange={(e) => updateLessonTitle(day.moduleId, day.id, e.target.value)}
                            onBlur={() => persistLesson(day)}
                            sx={{ flexGrow: 1, maxWidth: 400 }}
                          />
                        </Box>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteLesson(day.moduleId, day.id)}
                          sx={{ '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.05)' } }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>

                      <Divider sx={{ mb: 3, opacity: 0.05 }} />

                      <Grid container spacing={3}>
                        {['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night'].map((windowName) => {
                          const windowTasks = day.tasks?.filter((t: any) => t.content?.routine_window === windowName) || [];
                          return (
                            <Grid size={{ xs: 12, md: 6 }} key={windowName}>
                              <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                  <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 800 }}>
                                    {windowName.toUpperCase()}
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<Plus size={12} />}
                                    onClick={(e) => {
                                      setTaskSelectorAnchor(e.currentTarget);
                                      setSelectorDay(day);
                                      setSelectorWindow(windowName);
                                      setSelectorChamber('');
                                      setSelectorSelectedTaskIds([]);
                                    }}
                                    sx={{ color: 'var(--emerald-primary)', textTransform: 'none', fontSize: '0.75rem' }}
                                  >
                                    Add Task
                                  </Button>
                                </Box>

                                <Stack spacing={2}>
                                  {windowTasks.map((task: any) => (
                                    <Box 
                                      key={task.id} 
                                      sx={{ 
                                        p: 2, 
                                        borderRadius: 1, 
                                        backgroundColor: 'rgba(255,255,255,0.02)', 
                                        border: '1px solid rgba(255,255,255,0.05)' 
                                      }}
                                    >
                                      <Stack spacing={1.5}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          <TextField
                                            fullWidth
                                            size="small"
                                            label="Task Name"
                                            value={task.title}
                                            onChange={(e) => updateTaskTitle(day.id, task.id, e.target.value)}
                                            onBlur={() => persistTask(task)}
                                          />
                                          <FormControl size="small" sx={{ minWidth: 100 }}>
                                            <Select
                                              value={task.type || 'text'}
                                              onChange={async (e) => {
                                                const newType = e.target.value;
                                                const updated = localModules.map(m => ({
                                                  ...m,
                                                  lessons: m.lessons?.map((l: any) => 
                                                    l.id === day.id ? {
                                                      ...l,
                                                      tasks: l.tasks?.map((t: any) => t.id === task.id ? { ...t, type: newType } : t)
                                                    } : l
                                                  )
                                                }));
                                                setLocalModules(updated);
                                                await persistTask({ ...task, type: newType });
                                              }}
                                            >
                                              <MenuItem value="text">Text</MenuItem>
                                              <MenuItem value="audio">Audio</MenuItem>
                                              <MenuItem value="video">Video</MenuItem>
                                              <MenuItem value="checklist">Checklist</MenuItem>
                                            </Select>
                                          </FormControl>
                                          <IconButton 
                                            color="error" 
                                            size="small"
                                            onClick={() => handleDeleteTask(day.id, task.id)}
                                          >
                                            <Trash2 size={16} />
                                          </IconButton>
                                        </Box>

                                        <TextField
                                          fullWidth
                                          size="small"
                                          label="Instructions / Text Content"
                                          multiline
                                          rows={2}
                                          value={task.content?.text || ''}
                                          onChange={(e) => {
                                            const newText = e.target.value;
                                            setLocalModules(prev => prev.map(m => ({
                                              ...m,
                                              lessons: m.lessons?.map((l: any) => 
                                                l.id === day.id ? {
                                                  ...l,
                                                  tasks: l.tasks?.map((t: any) => 
                                                    t.id === task.id ? { 
                                                      ...t, 
                                                      content: { ...t.content, text: newText } 
                                                    } : t
                                                  )
                                                } : l
                                              )
                                            })));
                                          }}
                                          onBlur={() => persistTask(task)}
                                        />

                                        {(task.type === 'audio' || task.type === 'video') && (
                                          <TextField
                                            fullWidth
                                            size="small"
                                            label="Media URL"
                                            value={task.content?.url || ''}
                                            onChange={(e) => {
                                              const newUrl = e.target.value;
                                              setLocalModules(prev => prev.map(m => ({
                                                ...m,
                                                lessons: m.lessons?.map((l: any) => 
                                                  l.id === day.id ? {
                                                    ...l,
                                                    tasks: l.tasks?.map((t: any) => 
                                                      t.id === task.id ? { 
                                                        ...t, 
                                                        content: { ...t.content, url: newUrl } 
                                                      } : t
                                                    )
                                                  } : l
                                                )
                                              })));
                                            }}
                                            onBlur={() => persistTask(task)}
                                          />
                                        )}
                                      </Stack>
                                    </Box>
                                  ))}

                                  {windowTasks.length === 0 && (
                                    <Typography variant="caption" sx={{ color: '#444', fontStyle: 'italic', display: 'block', textAlign: 'center', py: 1 }}>
                                      No tasks for this window
                                    </Typography>
                                  )}
                                </Stack>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Paper>
                  ));
                })()}
              </Stack>
            )}
          </Box>
        )}

        {activeTab === 'tasks' && (
          <Box sx={{ minHeight: '40vh' }} />
        )}

        {activeTab === 'created' && (
          <CreatedProgramTab />
        )}
      </Box>

      {/* Popover / Menu for Selecting Tasks from Chambers */}
      <Popover
        open={Boolean(taskSelectorAnchor)}
        anchorEl={taskSelectorAnchor}
        onClose={() => {
          setTaskSelectorAnchor(null);
          setSelectorDay(null);
          setSelectorWindow('');
          setSelectorChamber('');
          setSelectorSelectedTaskIds([]);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: { p: 3, width: 320, backgroundColor: '#121217', border: '1px solid var(--emerald-mid)', borderRadius: 2 }
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'var(--emerald-primary)' }}>
          Add Tasks to {selectorWindow}
        </Typography>
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="select-chamber-label" sx={{ color: '#888' }}>Select Chamber</InputLabel>
            <Select
              labelId="select-chamber-label"
              value={selectorChamber}
              label="Select Chamber"
              onChange={(e) => {
                setSelectorChamber(e.target.value);
                setSelectorSelectedTaskIds([]);
              }}
              sx={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              {selectorDay && getChambersWithTasksForDay(selectorDay.day_number).map(c => (
                <MenuItem key={c.chamberKey} value={c.chamberKey} disabled={c.tasks.length === 0}>
                  {c.name} ({c.tasks.length} tasks)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectorChamber && (() => {
            const chambers = getChambersWithTasksForDay(selectorDay.day_number);
            const activeChamber = chambers.find(c => c.chamberKey === selectorChamber);
            const availableTasks = activeChamber?.tasks || [];

            return (
              <FormControl fullWidth size="small" disabled={availableTasks.length === 0}>
                <InputLabel id="select-tasks-label" sx={{ color: '#888' }}>Select Tasks</InputLabel>
                <Select
                  labelId="select-tasks-label"
                  multiple
                  value={selectorSelectedTaskIds}
                  label="Select Tasks"
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectorSelectedTaskIds(typeof val === 'string' ? val.split(',') : val);
                  }}
                  renderValue={(selected) => `${selected.length} task(s) selected`}
                  sx={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                >
                  {availableTasks.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      <Checkbox checked={selectorSelectedTaskIds.indexOf(t.id) > -1} sx={{ color: 'var(--emerald-primary)', '&.Mui-checked': { color: 'var(--emerald-primary)' } }} />
                      <ListItemText primary={t.title} secondary={t.type} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })()}

          <Button
            variant="contained"
            disabled={selectorSelectedTaskIds.length === 0}
            onClick={async () => {
              if (!selectorDay || !selectorChamber) return;
              try {
                const chambers = getChambersWithTasksForDay(selectorDay.day_number);
                const activeChamber = chambers.find(c => c.chamberKey === selectorChamber);
                const tasksToClone = activeChamber?.tasks.filter(t => selectorSelectedTaskIds.includes(t.id)) || [];

                const clonedTasks: any[] = [];
                for (let i = 0; i < tasksToClone.length; i++) {
                  const taskToClone = tasksToClone[i];
                  const newTask = await saveTaskMutation.mutateAsync({
                    id: taskToClone.id, // Update the existing task row in DB instead of creating a new one
                    lesson_id: selectorDay.id,
                    title: taskToClone.title,
                    type: taskToClone.type,
                    description: taskToClone.description || '',
                    content: {
                      ...(taskToClone.content || {}),
                      routine_window: selectorWindow
                    },
                    order_index: (selectorDay.tasks?.length || 0) + i + 1
                  });
                  clonedTasks.push(newTask);
                }

                // Update localModules state
                const updatedModules = localModules.map(m => {
                  let lessons = m.lessons || [];
                  
                  // 1. Remove task from the chamber lesson tasks list
                  lessons = lessons.map((l: any) => {
                    if (l.tasks?.some((t: any) => selectorSelectedTaskIds.includes(t.id))) {
                      return {
                        ...l,
                        tasks: l.tasks.filter((t: any) => !selectorSelectedTaskIds.includes(t.id))
                      };
                    }
                    return l;
                  });

                  // 2. Add task to the main day protocol lesson tasks list
                  if (m.id === selectorDay.moduleId) {
                    lessons = lessons.map((l: any) => {
                      if (l.id === selectorDay.id) {
                        return {
                          ...l,
                          tasks: [...(l.tasks || []), ...clonedTasks]
                        };
                      }
                      return l;
                    });
                  }

                  return { ...m, lessons };
                });

                setLocalModules(updatedModules);
                await syncLessonRoutine(selectorDay.id, updatedModules);
                setNotification({ open: true, message: `Moved ${clonedTasks.length} task(s)!`, severity: 'success' });
                
                // Reset
                setTaskSelectorAnchor(null);
                setSelectorDay(null);
                setSelectorWindow('');
                setSelectorChamber('');
                setSelectorSelectedTaskIds([]);
              } catch (err) {
                console.error(err);
                setNotification({ open: true, message: 'Failed to add selected tasks.', severity: 'error' });
              }
            }}
            sx={{ backgroundColor: 'var(--emerald-primary)', color: '#0B0B0F', fontWeight: 700, '&:hover': { backgroundColor: 'var(--emerald-light)' } }}
          >
            Add Selected Tasks
          </Button>
        </Stack>
      </Popover>

      <ProgramImportModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        programId={programId}
        onImportSuccess={handleImportSuccess}
      />

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
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);

  // Assignment state
  const [assigningProgram, setAssigningProgram] = useState<any | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignSnackbar, setAssignSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
                    <Typography variant="body2" sx={{ color: '#B0B0B0', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      {p.description}
                    </Typography>
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
            sx: { backgroundColor: '#121217', border: '1px solid var(--emerald-mid)', minWidth: 400 }
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



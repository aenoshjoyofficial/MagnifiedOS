import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckSquare,
  PlayCircle,
  Mic,
  FileText,
  Brain,
  Waves,
  Compass,
  Grid as GridIcon,
  Utensils,
  Moon,
  Wind,
  Award,
  Upload,
  Edit,
  Unlock,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  usePrograms,
  useProgramDetails,
  useSaveModule,
  useSaveLesson,
  useSaveTask,
  useDeleteTask,
  useUploadAsset
} from '@/lib/queries';
import { CHAMBERS_INFO, matchChamberKey, generateRoutineHtml } from '@/lib/chambersData';
import RichTextEditor from '@/components/RichTextEditor';

// Map chamber ID to its visual icon
const getChamberIcon = (chamberId: string) => {
  switch (chamberId) {
    case 'mental-clarity': return <Brain size={28} />;
    case 'frequency-field': return <Waves size={28} />;
    case 'field-design': return <Compass size={28} />;
    case 'living-frame': return <GridIcon size={28} />;
    case 'the-plate': return <Utensils size={28} />;
    case 'sleep-cocoon': return <Moon size={28} />;
    case 'breath-atelier': return <Wind size={28} />;
    case 'the-signature': return <Award size={28} />;
    default: return <Brain size={28} />;
  }
};

const ChamberPage = () => {
  const { chamberId = 'mental-clarity' } = useParams<{ chamberId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Extract initial selections from URL parameters
  const [selectedProgramId, setSelectedProgramId] = useState<string>(searchParams.get('programId') || '');
  const dayNumber = 0; // Tasks in chambers are day-independent (Pool)

  // Task creation form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<string>('text');
  const [taskDescription, setTaskDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [checklistSteps, setChecklistSteps] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Task editing form state
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<string>('text');
  const [editDescription, setEditDescription] = useState('');
  const [editContentUrl, setEditContentUrl] = useState('');
  const [editResourceUrl, setEditResourceUrl] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editChecklistSteps, setEditChecklistSteps] = useState('');
  const [editIsUploading, setEditIsUploading] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editGalleryImages, setEditGalleryImages] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Placeholders mapping based on task type
  const placeholders: Record<string, { title: string, url: string, description: string }> = {
    text: {
      title: "e.g. Daily Mindset Focus",
      url: "e.g. https://example.com/mindset-details (Optional)",
      description: "e.g. Read the guidelines and take 3 deep breaths..."
    },
    audio: {
      title: "e.g. Theta Wave Meditation",
      url: "e.g. https://example.com/audio/meditation.mp3",
      description: "e.g. Listen with headphones in a quiet room..."
    },
    video: {
      title: "e.g. Spinal Decompression Routine",
      url: "e.g. https://example.com/videos/spine-flow.mp4",
      description: "e.g. Follow the structural form shown in the video..."
    },
    image: {
      title: "e.g. Morning Joint Articulation Guide",
      url: "e.g. https://example.com/images/joints-routine.png",
      description: "e.g. Complete 10 reps of each joint movement shown in the image..."
    },
    pdf: {
      title: "e.g. Weekly Nutrition Blueprint",
      url: "e.g. https://example.com/guides/nutrition.pdf",
      description: "e.g. Refer to the attached guide for detailed food recipes..."
    },
    checklist: {
      title: "e.g. Daily Habits Checklist",
      url: "e.g. https://example.com/checklist-guide (Optional)",
      description: "e.g. Mark all items as complete to finish today's checklist"
    },
    gallery: {
      title: "e.g. Somatic Flow Sequences",
      url: "",
      description: "e.g. View the visual steps for the spinal decompression gallery..."
    }
  };

  // Fetch queries & mutations
  const { data: programs = [], isLoading: isLoadingPrograms } = usePrograms();
  const { data: programDetails, isLoading: isLoadingDetails } = useProgramDetails(selectedProgramId);
  const saveModuleMutation = useSaveModule();
  const saveLessonMutation = useSaveLesson();
  const saveTaskMutation = useSaveTask();
  const deleteTaskMutation = useDeleteTask();
  const uploadAssetMutation = useUploadAsset();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Handle local file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1000 * 1024 * 1024) {
      const confirmUpload = window.confirm(
        `Warning: The file you selected is ${(file.size / 1024 / 1024).toFixed(1)} MB.\n\n` +
        `Your configured Supabase project file upload limit is 1000 MB. Uploading files larger than this will fail.\n\n` +
        `• If you have increased your Supabase Storage maximum file size limit, click OK to proceed.\n\n` +
        `Do you want to proceed with the upload?`
      );
      if (!confirmUpload) {
        e.target.value = '';
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `chamber-task-${Date.now()}.${fileExt}`;
      const bucket = 'program-assets';
      const storagePath = `tasks/${fileName}`;

      const publicUrl = await uploadAssetMutation.mutateAsync({
        file,
        bucket,
        path: storagePath,
        onProgress: (percent) => {
          setUploadProgress(percent);
        }
      });

      setContentUrl(publicUrl);

      // Auditing/debugging logs
      console.log('[DEBUG UPLOAD] Upload completed successfully:');
      console.log(`- Uploaded file name  : ${file.name}`);
      console.log(`- Uploaded file type  : ${file.type}`);
      console.log(`- Storage path        : ${storagePath}`);
      console.log(`- Generated public URL: ${publicUrl}`);
      console.log(`- Assigned resource URL: ${publicUrl}`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      const errMsg = err?.message || err?.error_description || String(err);
      if (errMsg.includes('exceeded the maximum allowed size') || errMsg.includes('exceed')) {
        setNotification({
          open: true,
          severity: 'error',
          message: `Upload failed: The file size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the maximum allowed size. Please check your Supabase project-level file size limits.`
        });
      } else {
        setNotification({
          open: true,
          severity: 'error',
          message: `Upload failed: ${errMsg}`
        });
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (galleryImages.length + files.length > 20) {
      setNotification({
        open: true,
        severity: 'warning',
        message: "You can upload a maximum of 20 images per gallery."
      });
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newUrls: string[] = [];
      const bucket = 'program-assets';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round((i / files.length) * 100));

        const fileExt = file.name.split('.').pop() || '';
        const fileName = `chamber-task-gallery-${Date.now()}-${i}.${fileExt}`;
        const storagePath = `tasks/${fileName}`;

        const publicUrl = await uploadAssetMutation.mutateAsync({
          file,
          bucket,
          path: storagePath,
        });
        newUrls.push(publicUrl);
      }

      setGalleryImages(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Gallery upload failed:', err);
      setNotification({
        open: true,
        severity: 'error',
        message: `Gallery upload failed: ${err.message || err}`
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  // Keep search params in sync with local states
  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedProgramId) params.programId = selectedProgramId;
    setSearchParams(params);
  }, [selectedProgramId, setSearchParams]);

  // Chamber display info
  const chamberInfo = CHAMBERS_INFO[chamberId as keyof typeof CHAMBERS_INFO] || { name: chamberId.toUpperCase().replace('-', ' ') };

  // Resolve matching module and lesson
  const matchedModule = programDetails?.modules?.find(
    (mod: any) => matchChamberKey(mod.title) === chamberId
  );
  const matchedLesson = matchedModule?.lessons?.find(
    (less: any) => less.day_number === dayNumber
  );

  const allChamberTasks = React.useMemo(() => {
    if (!matchedModule || !matchedModule.lessons) return [];
    const tasksList: any[] = [];
    matchedModule.lessons.forEach((lesson: any) => {
      if (lesson.tasks) {
        lesson.tasks.forEach((task: any) => {
          tasksList.push({
            ...task,
            dayNumber: lesson.day_number,
            lessonTitle: lesson.title
          });
        });
      }
    });
    return tasksList.sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) {
        return a.dayNumber - b.dayNumber;
      }
      return (a.order_index || 0) - (b.order_index || 0);
    });
  }, [matchedModule]);

  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCompletions = async () => {
      if (!allChamberTasks || allChamberTasks.length === 0) {
        setCompletedTaskIds(new Set());
        return;
      }
      const taskIds = allChamberTasks.map((t: any) => t.id);

      const { data, error } = await supabase
        .from('task_completions')
        .select('task_id')
        .in('task_id', taskIds);

      if (error) {
        console.error('Error fetching completions:', error);
        return;
      }

      const completedSet = new Set<string>(data.map((c: any) => c.task_id));
      setCompletedTaskIds(completedSet);
    };

    fetchCompletions();
  }, [allChamberTasks]);

  // Debugging logs to inspect fetch parameters and returned database records
  console.log(`[DEBUG] selectedProgramId:`, selectedProgramId);
  console.log(`[DEBUG] chamberId:`, chamberId);
  console.log(`[DEBUG] matchedModule:`, matchedModule);
  console.log(`[DEBUG] matchedLesson (Day ${dayNumber}):`, matchedLesson);
  console.log(`[DEBUG] returnedTasks:`, matchedLesson?.tasks);
  console.log(`[DEBUG] allChamberTasks:`, allChamberTasks);
  console.log(`[DEBUG] completedTaskIds:`, completedTaskIds);

  // Handle module initialization
  const handleInitializeModule = async () => {
    if (!selectedProgramId) return;
    try {
      await saveModuleMutation.mutateAsync({
        program_id: selectedProgramId,
        title: `Chamber: ${chamberInfo.name}`,
        order_index: (programDetails?.modules?.length || 0) + 1
      });
    } catch (err) {
      console.error('Failed to initialize chamber module:', err);
    }
  };

  // Handle lesson initialization
  const handleInitializeLesson = async () => {
    if (!matchedModule) return;
    try {
      await saveLessonMutation.mutateAsync({
        module_id: matchedModule.id,
        title: `Chamber Pool`,
        day_number: 0,
        unlock_day: 0
      });
    } catch (err) {
      console.error('Failed to initialize pool lesson:', err);
    }
  };

  // Handle task creation
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let targetLessonId = matchedLesson?.id;

    // 1. Auto-create lesson if it doesn't exist yet
    if (!targetLessonId) {
      if (!matchedModule) {
        setNotification({
          open: true,
          severity: 'warning',
          message: 'Please initialize the Chamber Module first before adding tasks.'
        });
        return;
      }
      try {
        const newLesson = await saveLessonMutation.mutateAsync({
          module_id: matchedModule.id,
          title: `Chamber Pool`,
          day_number: 0,
          unlock_day: 0
        });
        targetLessonId = newLesson.id;
      } catch (err) {
        console.error('Failed to auto-create lesson:', err);
        return;
      }
    }

    // 2. Save the task
    try {
      const dbType = (taskType === 'image' || taskType === 'pdf' || taskType === 'gallery') ? 'text' : taskType;
      const urlValue = contentUrl.trim();
      const isYoutubeOrVimeo = urlValue.includes('youtube.com') || urlValue.includes('youtu.be') || urlValue.includes('vimeo.com');

      const stepsArray = taskType === 'checklist'
        ? checklistSteps.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      const taskContent: any = {
        url: taskType === 'gallery' ? (galleryImages[0] || '') : urlValue,
        resource_url: isYoutubeOrVimeo ? urlValue : '',
        format: taskType,
        steps: stepsArray
      };

      if (taskType === 'gallery') {
        taskContent.images = galleryImages;
      }

      await saveTaskMutation.mutateAsync({
        lesson_id: targetLessonId,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        type: dbType as any,
        content: taskContent,
        order_index: (matchedLesson?.tasks?.length || 0) + 1
      });

      setNotification({
        open: true,
        severity: 'success',
        message: 'Task created successfully!'
      });

      // Clear form
      setTaskTitle('');
      setTaskDescription('');
      setContentUrl('');
      setChecklistSteps('');
      setGalleryImages([]);
    } catch (err: any) {
      console.error('Failed to save task:', err);
      const errMsg = err?.message || err?.error_description || String(err);
      setNotification({
        open: true,
        severity: 'error',
        message: `Failed to save task: ${errMsg}`
      });
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTaskMutation.mutateAsync(taskId);
        setNotification({
          open: true,
          severity: 'success',
          message: 'Task deleted successfully!'
        });
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  // Handle task reopening (deleting completions to unlock task)
  const handleReopenTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to reopen this task? This will permanently delete all user completion history for this task to unlock it for editing and deletion.')) {
      try {
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('task_id', taskId);

        if (error) throw error;

        // Update local state to unlock
        setCompletedTaskIds(prev => {
          const updated = new Set(prev);
          updated.delete(taskId);
          return updated;
        });

        setNotification({
          open: true,
          severity: 'success',
          message: 'Task successfully reopened and unlocked.'
        });
      } catch (err: any) {
        console.error('Failed to reopen task:', err);
        setNotification({
          open: true,
          severity: 'error',
          message: `Failed to reopen task: ${err.message || String(err)}`
        });
      }
    }
  };

  // Open the edit task dialog and populate fields
  const handleOpenEditDialog = (task: any) => {
    setEditingTask(task);
    setEditTitle(task.title || '');
    setEditType((task.content?.format || task.type || 'text') as any);
    setEditDescription(task.description || '');
    setEditContentUrl(task.content?.url || '');
    setEditResourceUrl(task.content?.resource_url || '');
    setEditDuration(task.content?.duration || '');
    setEditIsUploading(false);

    // Set edit checklist steps if task contains steps
    const stepsArray = task.content?.steps || [];
    setEditChecklistSteps(stepsArray.join('\n'));

    // Set edit gallery images
    const galleryImgs = task.content?.images || ((task.content?.format === 'image' || task.content?.format === 'gallery') && task.content?.url ? [task.content.url] : []);
    setEditGalleryImages(galleryImgs);

    setIsEditDialogOpen(true);
  };

  // Handle media file upload in the edit form
  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1000 * 1024 * 1024) {
      const confirmUpload = window.confirm(
        `Warning: The file you selected is ${(file.size / 1024 / 1024).toFixed(1)} MB.\n\n` +
        `Your configured Supabase project upload limit is 1000 MB per file.\n\n` +
        `• If you have increased your Supabase Storage maximum file size limit, click OK to proceed.\n\n` +
        `Do you want to proceed with the upload?`
      );
      if (!confirmUpload) {
        e.target.value = '';
        return;
      }
    }

    setEditIsUploading(true);
    setEditUploadProgress(0);
    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `chamber-task-${Date.now()}.${fileExt}`;
      const bucket = 'program-assets';
      const storagePath = `tasks/${fileName}`;

      const publicUrl = await uploadAssetMutation.mutateAsync({
        file,
        bucket,
        path: storagePath,
        onProgress: (percent) => {
          setEditUploadProgress(percent);
        }
      });

      // Update both core URL state and the visible UI Resource URL field immediately
      setEditContentUrl(publicUrl);
      setEditResourceUrl(publicUrl);

      // Auditing/debugging logs
      console.log('[DEBUG EDIT UPLOAD] Upload completed successfully:');
      console.log(`- Uploaded file name  : ${file.name}`);
      console.log(`- Uploaded file type  : ${file.type}`);
      console.log(`- Storage path        : ${storagePath}`);
      console.log(`- Generated public URL: ${publicUrl}`);
      console.log(`- Assigned resource URL: ${publicUrl}`);
    } catch (err: any) {
      console.error('Upload failed:', err);
      const errMsg = err?.message || err?.error_description || String(err);
      if (errMsg.includes('exceeded the maximum allowed size') || errMsg.includes('exceed')) {
        alert(
          `Upload failed: The file size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the maximum allowed size.\n\n` +
          `IMPORTANT: While you updated the bucket limit in your Supabase dashboard, please ensure that you have also increased the project-level file size limit in your Supabase Storage settings (up to 1000 MB or higher).\n\n` +
          `To fix this:\n` +
          `1. Ensure the file size is within your configured Supabase Storage limit, OR\n` +
          `2. Increase the maximum file size limit in your Supabase Storage settings.`
        );
      } else {
        alert(`Upload failed: ${errMsg}`);
      }
    } finally {
      setEditIsUploading(false);
      setEditUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleEditGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (editGalleryImages.length + files.length > 20) {
      alert("You can upload a maximum of 20 images per gallery.");
      e.target.value = '';
      return;
    }

    setEditIsUploading(true);
    setEditUploadProgress(0);

    try {
      const newUrls: string[] = [];
      const bucket = 'program-assets';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setEditUploadProgress(Math.round((i / files.length) * 100));

        const fileExt = file.name.split('.').pop() || '';
        const fileName = `chamber-task-gallery-${Date.now()}-${i}.${fileExt}`;
        const storagePath = `tasks/${fileName}`;

        const publicUrl = await uploadAssetMutation.mutateAsync({
          file,
          bucket,
          path: storagePath,
        });
        newUrls.push(publicUrl);
      }

      setEditGalleryImages(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Gallery upload failed:', err);
      alert(`Gallery upload failed: ${err.message || err}`);
    } finally {
      setEditIsUploading(false);
      setEditUploadProgress(null);
      e.target.value = '';
    }
  };

  // Handle saving the task edits and syncing with siblings
  const handleSaveEdit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!editingTask || !editTitle.trim() || isSaving) return;

    setIsSaving(true);
    console.log('SAVE STARTED');
    try {
      const saveExecution = async () => {
        const urlVal = editContentUrl.trim();
        const resVal = editResourceUrl.trim();
        const isYoutubeOrVimeo = urlVal.includes('youtube.com') || urlVal.includes('youtu.be') || urlVal.includes('vimeo.com') || resVal.includes('youtube.com') || resVal.includes('youtu.be') || resVal.includes('vimeo.com');
        const dbType = (editType === 'image' || editType === 'pdf' || editType === 'gallery') ? 'text' : editType;

        const stepsArray = editType === 'checklist'
          ? editChecklistSteps.split('\n').map(s => s.trim()).filter(Boolean)
          : [];

        // Build core updated content (preserve routine_window if exists)
        const updatedContent: any = {
          ...(editingTask.content || {}),
          url: editType === 'gallery' ? (editGalleryImages[0] || '') : (urlVal || (isYoutubeOrVimeo ? resVal : '')),
          text: editDescription.trim(),
          format: editType,
          resource_url: isYoutubeOrVimeo ? resVal : '',
          duration: editDuration.trim(),
          steps: stepsArray
        };
        if (editingTask.content?.routine_window) {
          updatedContent.routine_window = editingTask.content.routine_window;
        }

        if (editType === 'gallery') {
          updatedContent.images = editGalleryImages;
        } else {
          delete updatedContent.images;
        }

        // 1. Get sibling tasks inside the same module that share the pre-edited title
        let siblingLessonIds: string[] = [];
        if (matchedModule?.id) {
          const { data: moduleLessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('module_id', matchedModule.id);

          const lessonIds = moduleLessons?.map((l: any) => l.id) || [];

          if (lessonIds.length > 0) {
            // Fetch siblings first to merge and preserve their existing routine_window
            const { data: siblingTasks } = await supabase
              .from('tasks')
              .select('id, content, lesson_id')
              .in('lesson_id', lessonIds)
              .eq('title', editingTask.title)
              .neq('id', editingTask.id);

            if (siblingTasks && siblingTasks.length > 0) {
              siblingLessonIds = siblingTasks.map((s: any) => s.lesson_id).filter(Boolean);
              const siblingUpdates = siblingTasks.map(async (sibling: any) => {
                const siblingUpdatedContent = {
                  ...(sibling.content || {}),
                  url: editType === 'gallery' ? (editGalleryImages[0] || '') : (urlVal || (isYoutubeOrVimeo ? resVal : '')),
                  text: editDescription.trim(),
                  format: editType,
                  resource_url: isYoutubeOrVimeo ? resVal : '',
                  duration: editDuration.trim(),
                  steps: stepsArray
                };
                if (sibling.content?.routine_window) {
                  siblingUpdatedContent.routine_window = sibling.content.routine_window;
                }

                if (editType === 'gallery') {
                  siblingUpdatedContent.images = editGalleryImages;
                } else {
                  delete siblingUpdatedContent.images;
                }

                const { error: updErr } = await supabase
                  .from('tasks')
                  .update({
                    title: editTitle.trim(),
                    description: editDescription.trim(),
                    type: dbType,
                    content: siblingUpdatedContent
                  })
                  .eq('id', sibling.id);
                if (updErr) throw updErr;
              });
              await Promise.all(siblingUpdates);
            }
          }
        }
        console.log('SIBLINGS UPDATED');

        // 2. Update the primary editing task (triggers onSuccess/invalidation)
        await saveTaskMutation.mutateAsync({
          id: editingTask.id,
          lesson_id: editingTask.lesson_id,
          title: editTitle.trim(),
          description: editDescription.trim(),
          type: dbType as any,
          content: updatedContent,
          order_index: editingTask.order_index
        });
        console.log('TASK UPDATED');

        // 3. Re-compile the routine HTML descriptions for only the affected daily lessons
        const affectedLessonIds = Array.from(new Set([editingTask.lesson_id, ...siblingLessonIds]));
        if (affectedLessonIds.length > 0) {
          const { data: lessonsWithTasks } = await supabase
            .from('lessons')
            .select(`
              id,
              title,
              day_number,
              tasks (*)
            `)
            .in('id', affectedLessonIds)
            .gt('day_number', 0);

          if (lessonsWithTasks && lessonsWithTasks.length > 0) {
            // Run updates sequentially to prevent connection exhaustion and deadlocks
            for (const lesson of lessonsWithTasks) {
              // Since Step 1 & 2 updated the DB, lesson.tasks contains the updated tasks.
              const routineWindows = ['Morning', 'Mid-Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
              const routineData = routineWindows.map(windowName => {
                const tasks = (lesson.tasks || []).filter((t: any) => {
                  const taskWindow = t.content?.routine_window;
                  return taskWindow && taskWindow.toLowerCase() === windowName.toLowerCase();
                });
                if (tasks.length === 0) return null;

                const anchor = tasks.map((t: any) => t.title).join(' · ');
                const instruction = tasks.map((t: any) => {
                  const desc = t.description || t.content?.text || '';
                  return /<[a-z][\s\S]*>/i.test(desc) ? desc : `<p>${desc}</p>`;
                }).join('');

                const systemName = matchedModule?.title || 'Daily Integration';

                return {
                  window: windowName,
                  system: systemName,
                  anchor,
                  instruction
                };
              }).filter(Boolean);

              const html = generateRoutineHtml(routineData as any);

              const { error: updateError } = await supabase
                .from('lessons')
                .update({ description: html })
                .eq('id', lesson.id);

              if (updateError) {
                console.error(`Error updating description for lesson ID ${lesson.id}:`, updateError);
                throw updateError;
              }
            }
          }
        }
        console.log('LESSONS UPDATED');
      };

      // Race save execution against a 15 second timeout to prevent indefinite hanging
      await Promise.race([
        saveExecution(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Save request timed out. Please check your network and try again.')), 30000)
        )
      ]);

      console.log('CACHE INVALIDATING...');
      await queryClient.invalidateQueries({ queryKey: ['program-details'] });
      console.log('CACHE INVALIDATED');
      console.log('SAVE COMPLETED');

      // Close dialog
      setNotification({
        open: true,
        severity: 'success',
        message: 'Task updated successfully!'
      });
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (err: any) {
      console.error('Failed to save edited task:', err);
      const errMsg = err?.message || err?.error_description || String(err);
      setNotification({
        open: true,
        severity: 'error',
        message: `Failed to save task: ${errMsg}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto', minHeight: '80vh' }}>
      {/* Header Navigation */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          component={Link}
          to="/admin/program-builder"
          startIcon={<ArrowLeft size={16} />}
          sx={{ color: 'var(--emerald-primary)', textTransform: 'none', fontWeight: 600 }}
        >
          Back to Program Builder
        </Button>
      </Box>

      {/* Chamber Identity Banner */}
      <Paper sx={{ p: 4, mb: 4, display: 'flex', alignItems: 'center', gap: 3, border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
        <Box sx={{ p: 2, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald-primary)' }}>
          {getChamberIcon(chamberId)}
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>{chamberInfo.name}</Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Configuring tasks inside the chambers structure.</Typography>
        </Box>
      </Paper>

      <Stack spacing={4}>
        {/* Selector Panel */}
        <Paper sx={{ p: 3, border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>Select Program</Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="program-select-label">Select Program</InputLabel>
                <Select
                  labelId="program-select-label"
                  value={selectedProgramId}
                  label="Select Program"
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                >
                  {selectedProgramId && !programs?.some(p => p.id === selectedProgramId) && (
                    <MenuItem value={selectedProgramId} style={{ display: 'none' }}>
                      Loading program...
                    </MenuItem>
                  )}
                  {isLoadingPrograms ? (
                    <MenuItem disabled><CircularProgress size={20} /></MenuItem>
                  ) : (
                    programs.map((prog) => (
                      <MenuItem key={prog.id} value={prog.id}>{prog.title}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Builder Panel */}
        {!selectedProgramId ? (
          <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="body1" sx={{ color: '#888' }}>
              Please select a program above to start configuring tasks.
            </Typography>
          </Paper>
        ) : isLoadingDetails ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: 'var(--emerald-primary)' }} />
          </Box>
        ) : !matchedModule ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(16, 185, 129, 0.2)' }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
              This chamber's module is not yet initialized in the selected program.
            </Typography>
            <Button
              variant="contained"
              onClick={handleInitializeModule}
              disabled={saveModuleMutation.isPending}
              sx={{ backgroundColor: 'var(--emerald-mid)', color: 'var(--emerald-primary)', fontWeight: 700 }}
            >
              {saveModuleMutation.isPending ? 'Initializing...' : `Initialize Module for ${chamberInfo.name}`}
            </Button>
          </Paper>
        ) : (
          <Stack spacing={4}>
            {/* Task Creation Form */}
            <Paper sx={{ p: 3, border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>Add New Task</Typography>

              <Box component="form" onSubmit={handleAddTask}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Task Title"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder={placeholders[taskType].title}
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel id="task-type-label">Task Type</InputLabel>
                    <Select
                      labelId="task-type-label"
                      value={taskType}
                      label="Task Type"
                      onChange={(e) => setTaskType(e.target.value as any)}
                    >
                      <MenuItem value="text">Written Protocol (Text)</MenuItem>
                      <MenuItem value="audio">Audio Routine</MenuItem>
                      <MenuItem value="video">Video Routine</MenuItem>
                      <MenuItem value="image">Image Protocol</MenuItem>
                      <MenuItem value="pdf">PDF Document</MenuItem>
                      <MenuItem value="gallery">Image Gallery</MenuItem>
                      <MenuItem value="checklist">Checklist</MenuItem>
                    </Select>
                  </FormControl>

                  {taskType === 'checklist' && (
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Checklist Items (One item per line)"
                      value={checklistSteps}
                      onChange={(e) => setChecklistSteps(e.target.value)}
                      multiline
                      rows={4}
                      placeholder="e.g.&#10;Drink 500ml water&#10;Perform joint mobility routine&#10;10 minutes breathwork"
                    />
                  )}

                  <Box>
                    <Typography variant="caption" sx={{ color: '#B0B0B0', mb: 1, display: 'block' }}>
                      {taskType === 'text' ? 'Protocol Text / Instructions' : 'Description / Instruction (Optional)'}
                    </Typography>
                    <RichTextEditor
                      value={taskDescription}
                      onChange={(val) => setTaskDescription(val)}
                      placeholder={taskType === 'text' ? "Enter instructions, routines, formatting with headings/subheadings..." : placeholders[taskType]?.description || ''}
                      maxLength={3000}
                    />
                  </Box>

                  {taskType !== 'gallery' && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Resource Link / URL (Optional)"
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                      placeholder={placeholders[taskType]?.url || ''}
                      disabled={isUploading}
                    />
                  )}

                  {taskType === 'gallery' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={isUploading ? <CircularProgress size={16} /> : <Upload size={16} />}
                          disabled={isUploading}
                          sx={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-mid)' }}
                        >
                          {isUploading ? `Uploading... ${uploadProgress !== null ? `(${uploadProgress}%)` : ''}` : 'Upload Gallery Images'}
                          <input
                            type="file"
                            hidden
                            multiple
                            onChange={handleGalleryFilesChange}
                            accept="image/*"
                          />
                        </Button>
                        {galleryImages.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                            ✓ {galleryImages.length} Images Uploaded
                          </Typography>
                        )}
                      </Box>
                      {isUploading && uploadProgress !== null && (
                        <Box sx={{ width: '100%', mt: 0.5 }}>
                          <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: 'var(--emerald-mid)' } }} />
                        </Box>
                      )}
                      {galleryImages.length > 0 && (
                        <Grid container spacing={1}>
                          {galleryImages.map((imgUrl, idx) => (
                            <Grid key={idx} size={{ xs: 3, sm: 2 }} style={{ position: 'relative' }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  paddingBottom: '100%',
                                  backgroundImage: `url(${imgUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                                sx={{
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  backgroundColor: 'rgba(0,0,0,0.8)',
                                  color: '#ff4d4f',
                                  p: 0.5,
                                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.95)' }
                                }}
                              >
                                <X size={12} />
                              </IconButton>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  )}

                  {taskType !== 'text' && taskType !== 'checklist' && taskType !== 'gallery' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={isUploading ? <CircularProgress size={16} /> : <Upload size={16} />}
                          disabled={isUploading}
                          sx={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-mid)' }}
                        >
                          {isUploading ? `Uploading... ${uploadProgress !== null ? `(${uploadProgress}%)` : ''}` : `Upload ${taskType.toUpperCase()} File`}
                          <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                            accept={
                              taskType === 'audio' ? 'audio/*' :
                                taskType === 'video' ? 'video/*' :
                                  taskType === 'image' ? 'image/*' :
                                    taskType === 'pdf' ? 'application/pdf' :
                                      '*/*'
                            }
                          />
                        </Button>
                        {contentUrl && (
                          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                            ✓ File Attached
                          </Typography>
                        )}
                      </Box>
                      {isUploading && uploadProgress !== null && (
                        <Box sx={{ width: '100%', mt: 0.5 }}>
                          <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: 'var(--emerald-mid)' } }} />
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={saveTaskMutation.isPending ? <CircularProgress size={16} /> : <Plus size={16} />}
                      disabled={saveTaskMutation.isPending || saveLessonMutation.isPending}
                      sx={{
                        backgroundColor: 'var(--emerald-mid)',
                        color: 'var(--emerald-primary)',
                        fontWeight: 700,
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'rgba(255, 255, 255, 0.25)'
                        }
                      }}
                    >
                      {saveTaskMutation.isPending || saveLessonMutation.isPending ? 'Saving...' : 'Add Task to Chamber'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>

            {/* Tasks List */}
            <Paper sx={{ p: 3, border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                Tasks Pool & Allotted Tasks
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {allChamberTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#666', py: 2, textAlign: 'center' }}>
                  No tasks added to this chamber yet. Use the form above to add a task.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {allChamberTasks.map((task: any) => (
                    <Box
                      key={task.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ color: 'var(--emerald-primary)' }}>
                          {task.type === 'checklist' && <CheckSquare size={18} />}
                          {task.type === 'audio' && <Mic size={18} />}
                          {task.type === 'video' && <PlayCircle size={18} />}
                          {task.type === 'text' && <FileText size={18} />}
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                            <Chip
                              label={task.dayNumber === 0 ? "Chamber Pool" : `Day ${task.dayNumber}`}
                              size="small"
                              sx={{
                                backgroundColor: task.dayNumber === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                                color: task.dayNumber === 0 ? 'var(--emerald-primary)' : '#D4AF37',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                height: 20
                              }}
                            />
                          </Box>
                          {task.description && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#B0B0B0',
                                display: 'block',
                                mt: 0.5,
                                '& ul, & ol': { pl: 2.5, my: 0.5 },
                                '& p': { m: 0 }
                              }}
                              component="div"
                              dangerouslySetInnerHTML={{ __html: task.description }}
                            />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {completedTaskIds.has(task.id) && (
                          <IconButton
                            size="small"
                            onClick={() => handleReopenTask(task.id)}
                            title="Reopen Task (Deletes user completion to unlock editing)"
                            sx={{
                              color: '#D4AF37',
                              '&:hover': { color: '#FFD700' }
                            }}
                          >
                            <Unlock size={16} />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(task)}
                          disabled={completedTaskIds.has(task.id)}
                          title={completedTaskIds.has(task.id) ? "Task completed by user. Editing disabled." : "Edit Task"}
                          sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            '&:hover': { color: 'var(--emerald-primary)' },
                            '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.15)' }
                          }}
                        >
                          <Edit size={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deleteTaskMutation.isPending || completedTaskIds.has(task.id)}
                          title={completedTaskIds.has(task.id) ? "Task completed by user. Deletion disabled." : "Delete Task"}
                          sx={{
                            color: 'rgba(244, 67, 54, 0.5)',
                            '&:hover': { color: '#f44336' },
                            '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.15)' }
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        )}
      </Stack>

      {/* Edit Task Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditIsUploading(false);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#1E1E1E',
              backgroundImage: 'none',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF'
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
          Edit Task
        </DialogTitle>
        <Box>
          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                required
                size="small"
                label="Task Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={placeholders[editType]?.title}
              />

              <FormControl fullWidth size="small">
                <InputLabel id="edit-task-type-label" shrink>Task Type</InputLabel>
                <Select
                  labelId="edit-task-type-label"
                  value={editType}
                  label="Task Type"
                  onChange={(e) => setEditType(e.target.value as any)}
                  notched
                >
                  <MenuItem value="text">Written Protocol (Text)</MenuItem>
                  <MenuItem value="audio">Audio Routine</MenuItem>
                  <MenuItem value="video">Video Routine</MenuItem>
                  <MenuItem value="image">Image Protocol</MenuItem>
                  <MenuItem value="pdf">PDF Document</MenuItem>
                  <MenuItem value="gallery">Image Gallery</MenuItem>
                  <MenuItem value="checklist">Checklist</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#B0B0B0', mb: 1, display: 'block' }}>
                  {editType === 'text' ? 'Protocol Text / Instructions' : 'Description / Instruction (Optional)'}
                </Typography>
                <RichTextEditor
                  value={editDescription}
                  onChange={(val) => setEditDescription(val)}
                  placeholder={editType === 'text' ? "Enter instructions, routines, formatting with headings/subheadings..." : placeholders[editType]?.description || ''}
                  maxLength={3000}
                />
              </Box>

              {editType === 'checklist' && (
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Checklist Items (One item per line)"
                  value={editChecklistSteps}
                  onChange={(e) => setEditChecklistSteps(e.target.value)}
                  multiline
                  rows={6}
                  placeholder="e.g.&#10;Drink 500ml water&#10;Perform joint mobility routine&#10;10 minutes breathwork"
                />
              )}

              {editType !== 'text' && editType !== 'checklist' && (
                <>
                  <TextField
                    fullWidth
                    size="small"
                    label="Duration (e.g. 5 min, 10 min)"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 5 min"
                  />

                  {editType !== 'gallery' && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Attached URL / File Link"
                      value={editContentUrl}
                      onChange={(e) => setEditContentUrl(e.target.value)}
                      placeholder={placeholders[editType]?.url || ''}
                      disabled={editIsUploading}
                    />
                  )}

                  {editType !== 'gallery' && (
                    <TextField
                      fullWidth
                      size="small"
                      label="External Reference Video/Page (e.g. YouTube/Vimeo)"
                      value={editResourceUrl}
                      onChange={(e) => setEditResourceUrl(e.target.value)}
                      placeholder="e.g. https://youtube.com/watch?v=..."
                    />
                  )}

                  {editType === 'gallery' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={editIsUploading ? <CircularProgress size={16} /> : <Upload size={16} />}
                          disabled={editIsUploading}
                          sx={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-mid)' }}
                        >
                          {editIsUploading ? `Uploading... ${editUploadProgress !== null ? `(${editUploadProgress}%)` : ''}` : 'Upload Gallery Images'}
                          <input
                            type="file"
                            hidden
                            multiple
                            onChange={handleEditGalleryFilesChange}
                            accept="image/*"
                          />
                        </Button>
                        {editGalleryImages.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                            ✓ {editGalleryImages.length} Images Uploaded
                          </Typography>
                        )}
                      </Box>
                      {editIsUploading && editUploadProgress !== null && (
                        <Box sx={{ width: '100%', mt: 0.5 }}>
                          <LinearProgress variant="determinate" value={editUploadProgress} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: 'var(--emerald-mid)' } }} />
                        </Box>
                      )}
                      {editGalleryImages.length > 0 && (
                        <Grid container spacing={1}>
                          {editGalleryImages.map((imgUrl, idx) => (
                            <Grid key={idx} size={{ xs: 3, sm: 2 }} style={{ position: 'relative' }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  paddingBottom: '100%',
                                  backgroundImage: `url(${imgUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => setEditGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                                sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  backgroundColor: 'rgba(0,0,0,0.8)',
                                  color: '#ff4d4f',
                                  p: 0.5,
                                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.95)' }
                                }}
                              >
                                <X size={12} />
                              </IconButton>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  )}

                  {editType !== 'gallery' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={editIsUploading ? <CircularProgress size={16} /> : <Upload size={16} />}
                          disabled={editIsUploading}
                          sx={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-mid)' }}
                        >
                          {editIsUploading ? `Uploading... ${editUploadProgress !== null ? `(${editUploadProgress}%)` : ''}` : `Upload New ${editType.toUpperCase()} File`}
                          <input
                            type="file"
                            hidden
                            onChange={handleEditFileChange}
                            accept={
                              editType === 'audio' ? 'audio/*' :
                                editType === 'video' ? 'video/*' :
                                  editType === 'image' ? 'image/*' :
                                    editType === 'pdf' ? 'application/pdf' :
                                      '*/*'
                            }
                          />
                        </Button>
                        {editContentUrl && (
                          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                            ✓ File Attached
                          </Typography>
                        )}
                      </Box>
                      {editIsUploading && editUploadProgress !== null && (
                        <Box sx={{ width: '100%', mt: 0.5 }}>
                          <LinearProgress variant="determinate" value={editUploadProgress} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: 'var(--emerald-mid)' } }} />
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, borderTop: '1px solid rgba(255, 255, 255, 0.08)', pt: 2 }}>
            <Button
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditIsUploading(false);
              }}
              sx={{ color: '#B0B0B0' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={editIsUploading || saveTaskMutation.isPending || isSaving}
              onClick={handleSaveEdit}
              sx={{ backgroundColor: 'var(--emerald-mid)', color: 'var(--emerald-primary)', fontWeight: 700 }}
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={4000} 
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity} 
          sx={{ 
            width: '100%', 
            backgroundColor: notification.severity === 'error' ? '#ef5350' : notification.severity === 'warning' ? '#ff9800' : '#10B981', 
            color: 'white',
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

export default ChamberPage;

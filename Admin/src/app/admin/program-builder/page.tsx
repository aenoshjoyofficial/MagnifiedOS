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
  Alert,
  Snackbar
} from '@mui/material';
import RichTextEditor from '@/components/RichTextEditor';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Link as LinkIcon
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
  useDeleteProgram
} from '@/lib/queries';

const ProgramBuilder = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('settings'); 
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
    if (programDetails) {
      setProgramData({
        title: programDetails.title || '',
        description: programDetails.description || '',
        duration_days: programDetails.duration_days || 30,
        cover_image: programDetails.cover_image || '',
        is_published: programDetails.is_published || false
      });
      setLocalModules(programDetails.modules || []);
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
      const newLesson = await saveLessonMutation.mutateAsync({
        module_id: moduleId,
        title: 'New Lesson',
        day_number: (module?.lessons?.length || 0) + 1,
        unlock_day: (module?.lessons?.length || 0) + 1
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
      setLocalModules(prev => prev.map(m => ({
        ...m,
        lessons: m.lessons?.map((l: any) => 
          l.id === lessonId ? { ...l, tasks: l.tasks?.filter((t: any) => t.id !== taskId) } : l
        )
      })));
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
      setNotification({ open: true, message: 'Task updated.', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'Failed to update task.', severity: 'error' });
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

      <Grid container spacing={3}>
        {/* Navigation Tabs */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 1 }}>
            <Stack spacing={0.5}>
              {[
                { id: 'settings', label: 'General Settings', icon: Settings },
                { id: 'modules', label: 'Modules & Lessons', icon: GripVertical },
                { id: 'tasks', label: 'Task Engineering', icon: Plus },
              ].map((tab) => (
                <Button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  startIcon={<tab.icon size={18} />}
                  sx={{ 
                    justifyContent: 'flex-start',
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
        </Grid>

        {/* Content Area */}
        <Grid size={{ xs: 12, md: 9 }}>
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
                {allPrograms?.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

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
                    onChange={(e) => setProgramData({...programData, title: e.target.value})}
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
                    onChange={(e) => setProgramData({...programData, description: e.target.value})}
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
                      onChange={(e) => setProgramData({...programData, duration_days: parseInt(e.target.value)})}
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
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Modules & Lessons</Typography>
                  <Typography variant="caption" sx={{ color: '#B0B0B0' }}>Structure the steps of the transformation.</Typography>
                </Box>
                <Button 
                  size="small" 
                  startIcon={saveModuleMutation.isPending ? <CircularProgress size={14} /> : <Plus size={16} />} 
                  onClick={handleAddModule}
                  disabled={saveModuleMutation.isPending}
                  sx={{ color: 'var(--emerald-primary)', fontWeight: 700 }}
                >
                  Add Module
                </Button>
              </Box>

              {!programId ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>Please save the program settings first to start building modules.</Typography>
                  <Button variant="outlined" onClick={() => setActiveTab('settings')} sx={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-mid)' }}>Return to Settings</Button>
                </Box>
              ) : isLoadingDetails ? (
                <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress size={30} sx={{ color: 'var(--emerald-primary)' }} /></Box>
              ) : (
                <Stack spacing={3}>
                  {localModules?.map((module, mIdx) => (
                    <Paper 
                      key={module.id} 
                      sx={{ 
                        p: 0, 
                        overflow: 'hidden', 
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <Box 
                        onClick={() => toggleExpandedModule(module.id)}
                        sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255, 255, 255, 0.03)', cursor: 'pointer' }}
                      >
                        <IconButton size="small" sx={{ p: 0, color: '#444' }}>
                          {expandedModules.includes(module.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </IconButton>
                        <Typography variant="subtitle2" sx={{ color: 'var(--emerald-primary)', fontWeight: 800 }}>M{mIdx + 1}</Typography>
                        <TextField 
                          fullWidth 
                          variant="standard" 
                          placeholder="Module Title" 
                          value={module.title}
                          onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                          onBlur={() => persistModule(module)}
                          onClick={(e) => e.stopPropagation()} // Prevent collapse when editing title
                          slotProps={{
                            input: {
                              disableUnderline: true,
                              sx: { fontWeight: 700, fontSize: '1rem' }
                            }
                          }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModule(module.id);
                          }}
                          sx={{ color: 'rgba(244, 67, 54, 0.3)', '&:hover': { color: '#f44336' } }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                      <Divider sx={{ opacity: 0.1 }} />
                      {expandedModules.includes(module.id) && (
                        <Box sx={{ p: 2 }}>
                          <Stack spacing={1}>
                            {module.lessons?.map((lesson: any, lIdx: number) => {
                              const isLessonExpanded = expandedLessons.includes(lesson.id);
                              return (
                                <Box 
                                  key={lesson.id} 
                                  sx={{ 
                                    borderRadius: 1.5,
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    mb: 1
                                  }}
                                >
                                  {/* Lesson Header */}
                                  <Box 
                                    sx={{ 
                                      p: 1.5, 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 2 
                                    }}
                                  >
                                    <IconButton 
                                      size="small" 
                                      onClick={() => toggleExpandedLesson(lesson.id)}
                                      sx={{ p: 0, color: 'rgba(255, 255, 255, 0.3)' }}
                                    >
                                      {isLessonExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                    </IconButton>
                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, minWidth: 40 }}>DAY {lesson.day_number}</Typography>
                                    <TextField 
                                      fullWidth 
                                      variant="standard" 
                                      placeholder="Lesson Title" 
                                      value={lesson.title}
                                      onChange={(e) => updateLessonTitle(module.id, lesson.id, e.target.value)}
                                      onBlur={() => persistLesson(lesson)}
                                      slotProps={{
                                        input: {
                                          disableUnderline: true,
                                          sx: { fontSize: '0.9rem', color: '#EAEAEA' }
                                        }
                                      }}
                                    />
                                    <IconButton 
                                      size="small" 
                                      onClick={() => toggleExpandedLesson(lesson.id)}
                                      sx={{ 
                                        color: lesson.description ? 'var(--emerald-primary)' : 'rgba(255, 255, 255, 0.2)',
                                        '&:hover': { color: 'var(--emerald-light)' }
                                      }}
                                      title="Edit Description"
                                    >
                                      <DescriptionIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                      sx={{ color: 'rgba(244, 67, 54, 0.2)', '&:hover': { color: '#f44336' } }}
                                    >
                                      <Trash2 size={14} />
                                    </IconButton>
                                  </Box>

                                  {/* Lesson Description Editor */}
                                  {isLessonExpanded && (
                                    <Box sx={{ px: 2, pb: 2, pt: 0.5, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                      <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DescriptionIcon fontSize="inherit" /> LESSON DESCRIPTION (RICH TEXT)
                                      </Typography>
                                      <RichTextEditor
                                        value={lesson.description || ''}
                                        onChange={(val) => updateLessonDescription(module.id, lesson.id, val)}
                                        onBlur={() => persistLesson(lesson)}
                                        maxLength={1000}
                                        placeholder="Add description or context for this day's practice..."
                                      />
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                            <Button 
                              fullWidth 
                              variant="outlined" 
                              startIcon={saveLessonMutation.isPending ? <CircularProgress size={12} /> : <Plus size={14} />}
                              onClick={() => handleAddLesson(module.id)}
                              disabled={saveLessonMutation.isPending}
                              sx={{ 
                                mt: 1, 
                                py: 1, 
                                border: '1px dashed rgba(255, 255, 255, 0.1)', 
                                color: '#666',
                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--emerald-primary)' }
                              }}
                            >
                              Add Lesson
                            </Button>
                          </Stack>
                        </Box>
                      )}
                    </Paper>
                  ))}
                  
                  {programDetails?.modules?.length === 0 && (
                    <Box sx={{ py: 8, textAlign: 'center', border: '2px dashed rgba(255, 255, 255, 0.05)', borderRadius: 4 }}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>No modules found in this journey yet.</Typography>
                      <Button variant="contained" onClick={handleAddModule} sx={{ backgroundColor: 'var(--emerald-mid)', color: 'var(--emerald-primary)' }}>Create First Module</Button>
                    </Box>
                  )}
                </Stack>
              )}
            </Paper>
          )}

          {activeTab === 'tasks' && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Task Engineering</Typography>
                  <Typography variant="caption" sx={{ color: '#B0B0B0' }}>Define the daily actions and engagements for members.</Typography>
                </Box>
              </Box>

              {!programId ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>Please save the program settings first.</Typography>
                  <Button variant="outlined" onClick={() => setActiveTab('settings')} sx={{ color: 'var(--emerald-primary)' }}>Return to Settings</Button>
                </Box>
              ) : (
                <Stack spacing={4}>
                  {localModules?.map((module, mIdx) => (
                    <Box key={module.id}>
                      <Typography variant="subtitle2" sx={{ color: 'var(--emerald-primary)', fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GripVertical size={14} /> MODULE {mIdx + 1}: {module.title}
                      </Typography>
                      <Stack spacing={2}>
                        {module.lessons?.map((lesson: any, lIdx: number) => (
                          <Paper 
                            key={lesson.id} 
                            sx={{ 
                              p: 2, 
                              backgroundColor: 'rgba(255, 255, 255, 0.01)', 
                              border: '1px solid rgba(255, 255, 255, 0.05)' 
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#B0B0B0' }}>
                                Day {lesson.day_number}: {lesson.title}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" variant="outlined" onClick={() => handleAddTask(lesson.id, 'checklist')} startIcon={<CheckSquare size={14} />} sx={{ fontSize: '0.65rem', py: 0.5 }}>+ Checklist</Button>
                                <Button size="small" variant="outlined" onClick={() => handleAddTask(lesson.id, 'audio')} startIcon={<Mic size={14} />} sx={{ fontSize: '0.65rem', py: 0.5 }}>+ Audio</Button>
                                <Button size="small" variant="outlined" onClick={() => handleAddTask(lesson.id, 'video')} startIcon={<PlayCircle size={14} />} sx={{ fontSize: '0.65rem', py: 0.5 }}>+ Video</Button>
                                <Button size="small" variant="outlined" onClick={() => handleAddTask(lesson.id, 'text')} startIcon={<MessageSquare size={14} />} sx={{ fontSize: '0.65rem', py: 0.5 }}>+ Text</Button>
                              </Box>
                            </Box>
                            
                            <Stack spacing={1}>
                              {lesson.tasks?.map((task: any) => (
                                <Box 
                                  key={task.id} 
                                  sx={{ 
                                    p: 1.5, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2, 
                                    borderRadius: 1, 
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.03)'
                                  }}
                                >
                                  {task.type === 'checklist' && <CheckSquare size={16} color="#4CAF50" />}
                                  {task.type === 'audio' && <Mic size={16} color="#2196F3" />}
                                  {task.type === 'video' && <PlayCircle size={16} color="#f44336" />}
                                  {task.type === 'text' && <MessageSquare size={16} color="var(--emerald-primary)" />}
                                  
                                  <TextField 
                                    fullWidth 
                                    variant="standard" 
                                    value={task.title}
                                    onChange={(e) => updateTaskTitle(lesson.id, task.id, e.target.value)}
                                    onBlur={() => persistTask(task)}
                                    slotProps={{
                                      input: {
                                        disableUnderline: true,
                                        sx: { fontSize: '0.85rem', fontWeight: 600 }
                                      }
                                    }}
                                  />

                                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    {(task.type === 'audio' || task.type === 'video') && (
                                      <Box>
                                        <input
                                          type="file"
                                          accept={task.type === 'audio' ? 'audio/*' : 'video/*'}
                                          id={`upload-${task.id}`}
                                          style={{ display: 'none' }}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(lesson.id, task, file);
                                          }}
                                        />
                                        <label htmlFor={`upload-${task.id}`}>
                                          <IconButton 
                                            size="small" 
                                            component="span" 
                                            sx={{ color: task.content?.url ? 'var(--emerald-primary)' : '#666' }}
                                            title={task.content?.url ? 'Change File' : 'Upload File'}
                                          >
                                            {uploadAssetMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Upload size={14} />}
                                          </IconButton>
                                        </label>
                                      </Box>
                                    )}
                                    
                                    {task.content?.url && (
                                      <IconButton size="small" sx={{ color: 'var(--emerald-primary)' }} onClick={() => window.open(task.content.url, '_blank')}>
                                        <LinkIcon size={14} />
                                      </IconButton>
                                    )}

                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteTask(lesson.id, task.id)} 
                                      sx={{ 
                                        color: 'rgba(244, 67, 54, 0.6)', 
                                        '&:hover': { color: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' } 
                                      }}
                                      title="Delete Task"
                                    >
                                      <Trash2 size={16} />
                                    </IconButton>
                                  </Stack>
                                </Box>
                              ))}
                              
                              {(!lesson.tasks || lesson.tasks.length === 0) && (
                                <Typography variant="caption" sx={{ color: '#444', textAlign: 'center', fontStyle: 'italic', py: 1 }}>
                                  No tasks added to this day yet.
                                </Typography>
                              )}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                      <Divider sx={{ my: 3, opacity: 0.05 }} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({...notification, open: false})}
      >
        <Alert onClose={() => setNotification({...notification, open: false})} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProgramBuilder;


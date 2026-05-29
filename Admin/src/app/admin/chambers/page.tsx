import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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
  Grid
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
  Upload
} from 'lucide-react';
import { 
  usePrograms, 
  useProgramDetails, 
  useSaveModule, 
  useSaveLesson, 
  useSaveTask, 
  useDeleteTask,
  useUploadAsset
} from '@/lib/queries';
import { CHAMBERS_INFO, matchChamberKey } from '@/lib/chambersData';

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
  
  // Extract initial selections from URL parameters
  const [selectedProgramId, setSelectedProgramId] = useState<string>(searchParams.get('programId') || '');
  const [dayNumber, setDayNumber] = useState<number>(Number(searchParams.get('day')) || 1);

  // Task creation form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<'text' | 'audio' | 'video' | 'image' | 'pdf'>('text');
  const [taskDescription, setTaskDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');

  // Placeholders mapping based on task type
  const placeholders = {
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

  // Handle local file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chamber-task-${Date.now()}.${fileExt}`;
      const bucket = 'program-assets';
      
      const publicUrl = await uploadAssetMutation.mutateAsync({
        file,
        bucket,
        path: `tasks/${fileName}`
      });

      setContentUrl(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Ensure bucket "program-assets" exists.');
    } finally {
      setIsUploading(false);
    }
  };

  // Keep search params in sync with local states
  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedProgramId) params.programId = selectedProgramId;
    if (dayNumber) params.day = String(dayNumber);
    setSearchParams(params);
  }, [selectedProgramId, dayNumber, setSearchParams]);

  // Chamber display info
  const chamberInfo = CHAMBERS_INFO[chamberId as keyof typeof CHAMBERS_INFO] || { name: chamberId.toUpperCase().replace('-', ' ') };

  // Resolve matching module and lesson
  const matchedModule = programDetails?.modules?.find(
    (mod: any) => matchChamberKey(mod.title) === chamberId
  );
  const matchedLesson = matchedModule?.lessons?.find(
    (less: any) => less.day_number === dayNumber
  );

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
        title: `Day Protocol ${dayNumber}`,
        day_number: dayNumber,
        unlock_day: dayNumber
      });
    } catch (err) {
      console.error('Failed to initialize day lesson:', err);
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
        alert('Please initialize the Chamber Module first before adding tasks.');
        return;
      }
      try {
        const newLesson = await saveLessonMutation.mutateAsync({
          module_id: matchedModule.id,
          title: `Day Protocol ${dayNumber}`,
          day_number: dayNumber,
          unlock_day: dayNumber
        });
        targetLessonId = newLesson.id;
      } catch (err) {
        console.error('Failed to auto-create lesson:', err);
        return;
      }
    }

    // 2. Save the task
    try {
      const dbType = (taskType === 'image' || taskType === 'pdf') ? 'text' : taskType;
      await saveTaskMutation.mutateAsync({
        lesson_id: targetLessonId,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        type: dbType as any,
        content: { 
          url: contentUrl.trim(),
          format: taskType 
        },
        order_index: (matchedLesson?.tasks?.length || 0) + 1
      });

      // Clear form
      setTaskTitle('');
      setTaskDescription('');
      setContentUrl('');
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTaskMutation.mutateAsync(taskId);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
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
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>Select Program & Target Day</Typography>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Target Day"
                type="number"
                value={dayNumber}
                onChange={(e) => setDayNumber(Math.max(1, Number(e.target.value)))}
                slotProps={{ htmlInput: { min: 1 } }}
              />
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
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    size="small"
                    label="Description / Instruction (Optional)"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    multiline
                    rows={2}
                    placeholder={placeholders[taskType].description}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Resource Link / URL (Optional)"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder={placeholders[taskType].url}
                    disabled={isUploading}
                  />

                  {taskType !== 'text' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={isUploading ? <CircularProgress size={16} /> : <Upload size={16} />}
                        disabled={isUploading}
                        sx={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-mid)' }}
                      >
                        {isUploading ? 'Uploading...' : `Upload ${taskType.toUpperCase()} File`}
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
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={saveTaskMutation.isPending ? <CircularProgress size={16} /> : <Plus size={16} />}
                      disabled={saveTaskMutation.isPending || saveLessonMutation.isPending}
                      sx={{ backgroundColor: 'var(--emerald-mid)', color: 'var(--emerald-primary)', fontWeight: 700 }}
                    >
                      {saveTaskMutation.isPending || saveLessonMutation.isPending ? 'Saving...' : 'Add Task to Day'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>

            {/* Tasks List */}
            <Paper sx={{ p: 3, border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                Current Tasks for Day {dayNumber}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {!matchedLesson || !matchedLesson.tasks || matchedLesson.tasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#666', py: 2, textAlign: 'center' }}>
                  No tasks added for this day yet. Use the form above to add a task.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {matchedLesson.tasks.map((task: any) => (
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
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{task.title}</Typography>
                          {task.description && (
                            <Typography variant="caption" sx={{ color: '#B0B0B0', display: 'block' }}>
                              {task.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={deleteTaskMutation.isPending}
                        sx={{ color: 'rgba(244, 67, 54, 0.5)', '&:hover': { color: '#f44336' } }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default ChamberPage;

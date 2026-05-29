import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Stack, 
  FormControl, 
  Select, 
  MenuItem, 
  TextField, 
  IconButton, 
  Divider,
  InputLabel,
  CircularProgress
} from '@mui/material';
import { 
  Brain, 
  Waves, 
  Compass, 
  Grid as GridIcon, 
  Utensils, 
  Moon, 
  Wind, 
  Award,
  Cpu,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  FileText,
  Upload,
  Link as LinkIcon,
  Music,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { 
  CHAMBERS_INFO, 
  DEFAULT_CHAMBER_SCRIPTS, 
  WEEK_THEMES, 
  CHAMBER_KEYS,
  ChamberScript,
  ChamberStep,
  getChamberScriptForProgram,
  getCombinedStepsForDay,
  getChamberWindow,
  generateRoutineHtml,
  normalizeScript,
  getDayOfWeekLabel,
  getDayTheme,
  saveDayTheme,
  matchChamberKey
} from '@/lib/chambersData';
import { useUploadAsset, usePrograms, useProgramDetails, useSaveLesson, useSaveTask } from '@/lib/queries';

const CHAMBER_ICONS: Record<string, any> = {
  'mental-clarity': Brain,
  'frequency-field': Waves,
  'field-design': Compass,
  'living-frame': GridIcon,
  'the-plate': Utensils,
  'sleep-cocoon': Moon,
  'breath-atelier': Wind,
  'the-signature': Award,
};

const ChamberPage = () => {
  const navigate = useNavigate();
  const { chamberId } = useParams<{ chamberId: string }>();
  const activeChamberId = chamberId ? chamberId.toLowerCase() : '';
  const chamber = CHAMBERS_INFO[activeChamberId as keyof typeof CHAMBERS_INFO];
  
  const [searchParams, setSearchParams] = useSearchParams();
  const urlProgramId = searchParams.get('programId');
  
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [programId, setProgramId] = useState<string | null>(urlProgramId);
  const [scriptData, setScriptData] = useState<ChamberScript>({
    title: '',
    when: '',
    duration: '',
    steps: [],
    directive: ''
  });
  
  const [newStepText, setNewStepText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [dayThemeInput, setDayThemeInput] = useState('');
  const [dayThemes, setDayThemes] = useState<Record<number, string>>({});

  const { data: allPrograms } = usePrograms();
  const { data: programDetails } = useProgramDetails(programId || '');
  const uploadAssetMutation = useUploadAsset();
  const saveLessonMutation = useSaveLesson();
  const saveTaskMutation = useSaveTask();

  const activeProgram = allPrograms?.find(p => p.id === programId);
  const durationDays = activeProgram?.duration_days || 30;

  // Sync programId with searchParams
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (programId) {
      params.set('programId', programId);
    } else {
      params.delete('programId');
    }
    setSearchParams(params, { replace: true });
  }, [programId, searchParams, setSearchParams]);

  // Load script for selected chamber, day and program scope
  useEffect(() => {
    if (!activeChamberId) return;
    const script = getChamberScriptForProgram(programId, activeChamberId, selectedDay);
    setScriptData(script);
    setIsSaved(false);
  }, [activeChamberId, selectedDay, programId]);

  // Sync day theme input and dayThemes dictionary
  useEffect(() => {
    setDayThemeInput(getDayTheme(programId, selectedDay));
    
    const themes: Record<number, string> = {};
    for (let d = 1; d <= durationDays; d++) {
      themes[d] = getDayTheme(programId, d);
    }
    setDayThemes(themes);
  }, [selectedDay, programId, durationDays]);

  const handleDayThemeChange = (newTheme: string) => {
    setDayThemeInput(newTheme);
    saveDayTheme(programId, selectedDay, newTheme);
    setDayThemes(prev => ({ ...prev, [selectedDay]: newTheme }));
  };

  const loadDefault = () => {
    const chamberDefaults = DEFAULT_CHAMBER_SCRIPTS[activeChamberId];
    const weekDayNum = ((selectedDay - 1) % 7) + 1;
    if (chamberDefaults && chamberDefaults[weekDayNum]) {
      setScriptData(normalizeScript(chamberDefaults[weekDayNum], activeChamberId, selectedDay, programId));
    } else {
      setScriptData({
        title: chamber ? `${chamber.name} - Day ${selectedDay}` : `Day ${selectedDay}`,
        when: 'Varies',
        duration: 'Varies',
        steps: [],
        directive: 'Set the direction for this day.'
      });
    }
  };

  if (!chamber) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Chamber Not Found</Typography>
        <Button component={Link} to="/admin" variant="outlined" startIcon={<ArrowLeft size={16} />} sx={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-mid)' }}>
          Back to command center
        </Button>
      </Box>
    );
  }

  const Icon = CHAMBER_ICONS[activeChamberId] || Cpu;

  const syncDatabaseForDay = async (targetDay: number) => {
    if (!programId || !programDetails?.modules) return;

    try {
      for (const module of programDetails.modules) {
        const moduleChamberKey = matchChamberKey(module.title);
        if (!moduleChamberKey) continue;

        const lesson = module.lessons?.find((l: any) => l.day_number === targetDay);
        if (!lesson) continue;

        // 1. Recompile and update the routine description
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
          const script = getChamberScriptForProgram(programId, ck, targetDay);
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

        const newDescription = generateRoutineHtml(cleanRoutineData);
        
        await saveLessonMutation.mutateAsync({
          id: lesson.id,
          module_id: module.id,
          title: lesson.title,
          day_number: lesson.day_number,
          unlock_day: lesson.unlock_day,
          description: newDescription
        });

        // 2. Sync combined tasks
        const steps = getCombinedStepsForDay(programId, targetDay);
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
              }
            } else {
              await saveTaskMutation.mutateAsync({
                lesson_id: lesson.id,
                title: step.title,
                type: mappedType,
                order_index: sIdx,
                content: targetContent
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error auto-syncing day to database:', err);
    }
  };

  const handleSave = async () => {
    const storageKey = programId 
      ? `program_${programId}_chamber_script_${activeChamberId}_day${selectedDay}`
      : `chamber_script_${activeChamberId}_day${selectedDay}`;
    localStorage.setItem(storageKey, JSON.stringify(scriptData));
    
    // Auto-sync database in background when saved
    await syncDatabaseForDay(selectedDay);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setScriptData(prev => ({
      ...prev,
      steps: [...prev.steps, { title: newStepText.trim(), type: 'text', textContent: '' }]
    }));
    setNewStepText('');
  };

  const handleRemoveStep = (idx: number) => {
    setScriptData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateStepTitle = (idx: number, title: string) => {
    setScriptData(prev => {
      const updatedSteps = [...prev.steps];
      updatedSteps[idx] = { ...updatedSteps[idx], title };
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleUpdateStepType = (idx: number, type: 'text' | 'pdf' | 'audio' | 'video' | 'image') => {
    setScriptData(prev => {
      const updatedSteps = [...prev.steps];
      updatedSteps[idx] = { 
        ...updatedSteps[idx], 
        type,
        contentUrl: '',
        textContent: ''
      };
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleUpdateStepTextContent = (idx: number, textContent: string) => {
    setScriptData(prev => {
      const updatedSteps = [...prev.steps];
      updatedSteps[idx] = { ...updatedSteps[idx], textContent };
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleStepFileUpload = async (idx: number, file: File, type: string) => {
    try {
      setUploadingIdx(idx);
      const fileExt = file.name.split('.').pop();
      const fileName = `chamber-${activeChamberId}-day${selectedDay}-step${idx}-${Date.now()}.${fileExt}`;
      const bucket = 'program-assets';
      
      const publicUrl = await uploadAssetMutation.mutateAsync({
        file,
        bucket,
        path: `chambers/${fileName}`
      });
      
      setScriptData(prev => {
        const updatedSteps = [...prev.steps];
        updatedSteps[idx] = {
          ...updatedSteps[idx],
          contentUrl: publicUrl
        };
        return { ...prev, steps: updatedSteps };
      });
    } catch (err) {
      console.error(err);
      alert('Upload failed. Ensure bucket "program-assets" exists.');
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 8 }}>
      {/* Header Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button 
          component={Link} 
          to="/admin/program-builder" 
          startIcon={<ArrowLeft size={16} />}
          sx={{ color: '#B0B0B0', px: 0, '&:hover': { background: 'transparent', color: '#EAEAEA' } }}
        >
          Back to Program Builder
        </Button>
      </Box>

      {/* Title block */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 4, textAlign: 'left' }}>
        <Box 
          sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            backgroundColor: 'rgba(212, 175, 55, 0.05)', 
            border: '1px solid rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D4AF37'
          }}
        >
          <Icon size={30} />
        </Box>
        <Box>
          <Typography variant="overline" sx={{ color: '#D4AF37', fontWeight: 800, letterSpacing: 2 }}>
            CHAMBER {('number' in chamber) ? chamber.number : ''}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {chamber.name}
          </Typography>
        </Box>
      </Box>

      {/* Editor Layout Grid */}
      <Stack spacing={3}>
        {/* Scope, Day Select & Action Panel */}
        <Paper sx={{ p: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 3, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center', flexGrow: 1 }}>
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel id="program-select-label" sx={{ color: '#888' }}>Program Scope</InputLabel>
              <Select
                labelId="program-select-label"
                value={programId || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'new') {
                    navigate('/admin/program-builder');
                  } else {
                    setProgramId(val === 'default' ? null : val);
                  }
                }}
                label="Program Scope"
              >
                <MenuItem value="default"><em>Default / Global Template</em></MenuItem>
                <MenuItem value="new" sx={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>+ Create New Program</MenuItem>
                <Divider />
                {allPrograms?.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="day-select-label" sx={{ color: '#888' }}>Day of Week</InputLabel>
              <Select
                labelId="day-select-label"
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                label="Day of Week"
              >
                {Array.from({ length: durationDays }, (_, i) => i + 1).map(dayNum => {
                  const label = getDayOfWeekLabel(dayNum);
                  const themeStr = dayThemes[dayNum] || getDayTheme(programId, dayNum);
                  return (
                    <MenuItem key={dayNum} value={dayNum}>
                      {label} (Day {dayNum}) — {themeStr}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Day Theme"
              value={dayThemeInput}
              onChange={(e) => handleDayThemeChange(e.target.value)}
              sx={{ minWidth: 180 }}
              placeholder="e.g. Ignition"
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              onClick={loadDefault} 
              sx={{ color: '#B0B0B0', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              Reset to Week 1 Default
            </Button>
            <Button 
              variant="contained" 
              startIcon={isSaved ? <CheckCircle size={16} /> : <Save size={16} />} 
              onClick={handleSave} 
              sx={{ 
                backgroundColor: isSaved ? '#4CAF50' : 'var(--emerald-primary)', 
                color: '#0B0B0F',
                fontWeight: 700,
                '&:hover': { backgroundColor: isSaved ? '#45a049' : 'var(--emerald-light)' }
              }}
            >
              {isSaved ? 'Script Saved!' : 'Save Chamber Script'}
            </Button>
          </Stack>
        </Paper>

        {/* Script Config Editor */}
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileText size={20} color="var(--emerald-primary)" />
            Chamber Routine Configurator
          </Typography>

          <Stack spacing={4}>
            {/* Day Title */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>DAY PROTOCOL TITLE</Typography>
              <TextField 
                fullWidth 
                size="small" 
                placeholder="e.g., Mental Clarity Ignition, Release Walk, etc."
                value={scriptData.title || ''}
                onChange={(e) => setScriptData(prev => ({ ...prev, title: e.target.value }))}
              />
            </Box>

            {/* When / Duration */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>WHEN TO DO IT</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="e.g., Upon waking, Pre-sleep, Mid-day"
                  value={scriptData.when}
                  onChange={(e) => setScriptData(prev => ({ ...prev, when: e.target.value }))}
                />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>DURATION</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="e.g., 12 minutes, 1 hour"
                  value={scriptData.duration}
                  onChange={(e) => setScriptData(prev => ({ ...prev, duration: e.target.value }))}
                />
              </Box>
            </Stack>

            {/* Steps list */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#B0B0B0', fontWeight: 700 }}>CHAMBER STEPS / TIMELINE</Typography>
              <Stack spacing={2} sx={{ mb: 3 }}>
                {scriptData.steps.map((step, idx) => (
                  <Paper 
                    key={idx} 
                    sx={{ 
                      p: 2.5, 
                      backgroundColor: 'rgba(255, 255, 255, 0.01)', 
                      border: '1px solid rgba(255, 255, 255, 0.05)', 
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}
                  >
                    {/* Row 1: Step Index, Title, and Trash Button */}
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 800, minWidth: 24 }}>
                        #{idx + 1}
                      </Typography>
                      <TextField 
                        fullWidth 
                        size="small"
                        label="Step / Task Title"
                        variant="outlined" 
                        value={step.title}
                        onChange={(e) => handleUpdateStepTitle(idx, e.target.value)}
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveStep(idx)} 
                        sx={{ color: 'rgba(244, 67, 54, 0.6)', '&:hover': { color: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Stack>

                    {/* Row 2: Type Dropdown & Type-Specific Content */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id={`step-type-${idx}-label`} sx={{ color: '#888' }}>Type</InputLabel>
                        <Select
                          labelId={`step-type-${idx}-label`}
                          value={step.type || 'text'}
                          label="Type"
                          onChange={(e) => handleUpdateStepType(idx, e.target.value as any)}
                        >
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="pdf">PDF File</MenuItem>
                          <MenuItem value="audio">Audio</MenuItem>
                          <MenuItem value="video">Video</MenuItem>
                          <MenuItem value="image">Image</MenuItem>
                        </Select>
                      </FormControl>

                      {/* Type Specific Fields */}
                      <Box sx={{ flexGrow: 1, width: '100%' }}>
                        {step.type === 'text' && (
                          <TextField
                            fullWidth
                            size="small"
                            label="Text Content / Description"
                            placeholder="Type any instructions or detailed descriptions for this step..."
                            value={step.textContent || ''}
                            onChange={(e) => handleUpdateStepTextContent(idx, e.target.value)}
                          />
                        )}

                        {step.type !== 'text' && (
                          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
                            <input
                              type="file"
                              accept={
                                step.type === 'pdf' ? 'application/pdf' :
                                step.type === 'audio' ? 'audio/*' :
                                step.type === 'video' ? 'video/*' :
                                'image/*'
                              }
                              id={`upload-step-${idx}`}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleStepFileUpload(idx, file, step.type);
                              }}
                            />
                            <label htmlFor={`upload-step-${idx}`}>
                              <Button
                                variant="outlined"
                                component="span"
                                size="small"
                                startIcon={
                                  uploadingIdx === idx ? (
                                    <CircularProgress size={14} color="inherit" />
                                  ) : (
                                    <Upload size={14} />
                                  )
                                }
                                disabled={uploadingIdx === idx}
                                sx={{ 
                                  color: 'var(--emerald-primary)', 
                                  borderColor: 'var(--emerald-mid)',
                                  '&:hover': { borderColor: 'var(--emerald-light)', backgroundColor: 'var(--emerald-dark)' }
                                }}
                              >
                                {step.contentUrl ? 'Change File' : 'Upload Asset'}
                              </Button>
                            </label>

                            {step.contentUrl && (
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => window.open(step.contentUrl, '_blank')} 
                                  sx={{ color: 'var(--emerald-primary)' }}
                                >
                                  <LinkIcon size={16} />
                                </IconButton>
                                <Typography variant="caption" sx={{ color: '#B0B0B0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 250 }}>
                                  {step.contentUrl.split('/').pop()}
                                </Typography>
                              </Stack>
                            )}
                            
                            {!step.contentUrl && uploadingIdx !== idx && (
                              <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                                No file uploaded yet.
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                ))}
                {scriptData.steps.length === 0 && (
                  <Typography variant="caption" sx={{ color: '#555', fontStyle: 'italic', py: 2 }}>
                    No steps added to this day's chamber script.
                  </Typography>
                )}
              </Stack>

              {/* Add step input */}
              <Stack direction="row" spacing={1.5}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Enter a new step details (e.g. 06:30 Open eyes...)"
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep(); } }}
                />
                <Button 
                  variant="outlined" 
                  startIcon={<Plus size={16} />} 
                  onClick={handleAddStep}
                  sx={{ color: 'var(--emerald-primary)', borderColor: 'var(--emerald-mid)', px: 3 }}
                >
                  Add
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ opacity: 0.1 }} />

            {/* Directive */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0', fontWeight: 700 }}>DAILY DIRECTIVE</Typography>
              <TextField 
                fullWidth 
                multiline 
                rows={2} 
                placeholder="The single directive capturing the spirit of the day..."
                value={scriptData.directive}
                onChange={(e) => setScriptData(prev => ({ ...prev, directive: e.target.value }))}
              />
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default ChamberPage;

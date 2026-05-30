import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Stack, 
  IconButton, 
  Alert, 
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  CheckCircle, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  validateWorkbook, 
  compileWorkbook, 
  ProgramJSON
} from '../../lib/programCompiler';
import { useSaveModule, useSaveLesson, useSaveTask } from '../../lib/queries';
import { generateRoutineHtml } from '../../lib/chambersData';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';


interface ProgramImportModalProps {
  open: boolean;
  onClose: () => void;
  programId: string | null;
  onImportSuccess: (compiledData: ProgramJSON) => void;
}

export const ProgramImportModal: React.FC<ProgramImportModalProps> = ({
  open,
  onClose,
  programId,
  onImportSuccess
}) => {
  const queryClient = useQueryClient();
  const saveModuleMutation = useSaveModule();
  const saveLessonMutation = useSaveLesson();
  const saveTaskMutation = useSaveTask();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [compiledData, setCompiledData] = useState<ProgramJSON | null>(null);
  const [success, setSuccess] = useState(false);

  const resetState = () => {
    setFile(null);
    setValidationErrors([]);
    setCompiledData(null);
    setSuccess(false);
    setLoading(false);
    setCompiling(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv') {
        processFile(droppedFile);
      } else {
        setValidationErrors(['Invalid File Type: Only .xlsx and .csv files are supported.']);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFile = (selectedFile: File) => {
    resetState();
    setFile(selectedFile);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          setValidationErrors(['Could not read file data.']);
          setLoading(false);
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 1. Run Validation
        const errors = validateWorkbook(workbook);
        if (errors.length > 0) {
          setValidationErrors(errors);
          setLoading(false);
          return;
        }

        // 2. Run Compilation
        const program = compileWorkbook(workbook);
        setCompiledData(program);
      } catch (err: any) {
        console.error('Error processing Excel file:', err);
        setValidationErrors([`File Parsing Failed: ${err.message || 'Check spreadsheet values and columns format.'}`]);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setValidationErrors(['Error reading file.']);
      setLoading(false);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleCompile = async () => {
    if (!programId || !compiledData) return;

    const mapExcelTaskTypeToDBType = (excelType: string): 'audio' | 'video' | 'text' | 'checklist' => {
      const t = String(excelType || '').toLowerCase().trim();
      if (t === 'audio') return 'audio';
      if (t === 'video') return 'video';
      if (['checklist', 'movement', 'breath', 'ritual', 'somatic', 'mobility', 'meal', 'nutrition'].includes(t)) {
        return 'checklist';
      }
      return 'text';
    };

    try {
      setCompiling(true);
      setLoading(true);
      setValidationErrors([]);

      // STEP 1 CLEANUP START
      console.log("STEP 1 CLEANUP START");
      const { error: deleteError } = await supabase
        .from('modules')
        .delete()
        .eq('program_id', programId);

      if (deleteError) {
        throw new Error(`Failed to clean up old program modules: ${deleteError.message}`);
      }

      // Log counts
      const modulesCount = compiledData.modules.length;
      let lessonsCount = 0;
      let tasksCount = 0;
      compiledData.modules.forEach(m => {
        lessonsCount += m.lessons.length;
        m.lessons.forEach(l => {
          tasksCount += l.tasks.length;
        });
      });
      console.log("modules:", modulesCount);
      console.log("lessons:", lessonsCount);
      console.log("tasks:", tasksCount);

      // STEP 2 MODULE CREATE
      console.log("STEP 2 MODULE CREATE");
      for (const mod of compiledData.modules) {
        const { data: savedModule, error: modErr } = await supabase
          .from('modules')
          .insert({
            program_id: programId,
            title: mod.title,
            order_index: mod.order_index
          })
          .select()
          .single();

        if (modErr) throw modErr;

        // Ensure the Chamber Pool lesson (day_number = 0) is created for this module first
        const { data: poolLesson, error: poolErr } = await supabase
          .from('lessons')
          .insert({
            module_id: savedModule.id,
            title: `Chamber Pool`,
            day_number: 0,
            unlock_day: 0,
            description: '<p>Chamber tasks pool</p>'
          })
          .select()
          .single();

        if (poolErr) throw poolErr;

        // STEP 3 LESSON CREATE
        console.log("STEP 3 LESSON CREATE");
        // Batch insert the rest of the lessons
        const lessonsToInsert = mod.lessons.map(lesson => {
          const compiledRoutine = lesson.routine.map(r => ({
            window: r.window,
            system: r.system,
            anchor: r.anchor,
            instruction: r.instruction
          }));
          const routineHtml = generateRoutineHtml(compiledRoutine);

          return {
            module_id: savedModule.id,
            title: lesson.title,
            day_number: lesson.day_number,
            unlock_day: lesson.day_number,
            description: routineHtml
          };
        });

        const { data: savedLessons, error: lessonsErr } = await supabase
          .from('lessons')
          .insert(lessonsToInsert)
          .select();

        if (lessonsErr) throw lessonsErr;

        const lessonIdMap = new Map<number, string>();
        savedLessons.forEach(l => {
          lessonIdMap.set(l.day_number, l.id);
        });

        // STEP 4 TASK INSERT
        console.log("STEP 4 TASK INSERT");
        const tasksToInsert: any[] = [];
        for (const lesson of mod.lessons) {
          const targetLessonId = lessonIdMap.get(lesson.day_number);
          if (!targetLessonId) continue;

          for (const task of lesson.tasks) {
            const dbType = mapExcelTaskTypeToDBType(task.type);

            // 1. Populate the Chamber Task Pool (Day 0) with a master task
            tasksToInsert.push({
              lesson_id: poolLesson.id,
              title: task.title,
              type: dbType,
              order_index: task.order_index,
              content: {
                routine_window: '', // pool tasks are unallotted
                url: task.content.url || '',
                text: task.content.text || '',
                duration: task.content.duration || '5 min',
                format: task.type // preserve original Excel sub-type
              }
            });

            // 2. Populate the target Day lesson with the allotted task
            tasksToInsert.push({
              lesson_id: targetLessonId,
              title: task.title,
              type: dbType,
              order_index: task.order_index,
              content: {
                routine_window: task.content.routine_window || 'Morning',
                url: task.content.url || '',
                text: task.content.text || '',
                duration: task.content.duration || '5 min',
                format: task.type
              }
            });
          }
        }

        if (tasksToInsert.length > 0) {
          const { error: tasksErr } = await supabase
            .from('tasks')
            .insert(tasksToInsert);

          if (tasksErr) throw tasksErr;
        }
      }

      // STEP 5 MEDIA INSERT
      console.log("STEP 5 MEDIA INSERT");

      // STEP 6 COMPLETE
      console.log("STEP 6 COMPLETE");

      // Invalidate the cache once at the very end
      queryClient.invalidateQueries({ queryKey: ['program-details', programId] });

      setSuccess(true);
      setTimeout(() => {
        onImportSuccess(compiledData);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to import program to database:', err);
      const errMsg = err.message || 'Could not save program structure to Supabase.';
      if (typeof window !== 'undefined') {
        alert(`Error: ${errMsg}`); // toast.error fallback
      }
      setValidationErrors([`Database Write Failed: ${errMsg}`]);
    } finally {
      setCompiling(false);
      setLoading(false);
    }
  };

  // Calculate task count for preview
  const getTaskCount = (): number => {
    if (!compiledData) return 0;
    let count = 0;
    compiledData.modules.forEach(m => {
      m.lessons.forEach(l => {
        count += l.tasks.length;
      });
    });
    return count;
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading || compiling ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: '#121217',
            border: '1px solid var(--emerald-mid)',
            borderRadius: 3,
            color: '#EAEAEA'
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, pb: 1 }}>
        <Typography variant="h6" sx={{ color: 'var(--emerald-primary)', fontWeight: 800 }}>
          Import Program Excel
        </Typography>
        {!loading && !compiling && (
          <IconButton onClick={handleClose} sx={{ color: '#666', '&:hover': { color: '#B0B0B0' } }}>
            <X size={20} />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', py: 3 }}>
        {!programId ? (
          <Alert severity="warning" sx={{ backgroundColor: 'rgba(239, 83, 80, 0.05)', color: '#EF5350', border: '1px solid rgba(239, 83, 80, 0.2)' }}>
            <strong>Active Program Required:</strong> Please select or save a program in General Settings before importing. We need a valid Program ID to map Chamber script storage scoped keys.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {/* File Drop Target */}
            {!file && !loading && !compiling && (
              <Box
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                sx={{
                  border: dragActive ? '2px dashed var(--emerald-primary)' : '2px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  p: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: dragActive ? 'var(--emerald-mid)' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'var(--emerald-primary)',
                    backgroundColor: 'rgba(16, 185, 129, 0.03)'
                  }
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                />
                <Upload size={40} color="#666" style={{ marginBottom: 12 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Drag & Drop Excel file
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  or click to select from your files (.xlsx, .csv)
                </Typography>
              </Box>
            )}

            {/* Loading Indicator */}
            {(loading || compiling) && (
              <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress sx={{ color: 'var(--emerald-primary)' }} />
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                  {compiling ? 'Compiling program, modules, lessons, and tasks...' : 'Processing and validating workbook...'}
                </Typography>
              </Box>
            )}

            {/* Validation Errors Panel */}
            {validationErrors.length > 0 && (
              <Box sx={{ border: '1px solid rgba(244, 67, 54, 0.3)', backgroundColor: 'rgba(244, 67, 54, 0.03)', borderRadius: 2, p: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 1.5 }}>
                  <AlertTriangle size={18} color="#f44336" style={{ marginTop: 2 }} />
                  <Typography variant="subtitle2" sx={{ color: '#f44336', fontWeight: 800 }}>
                    Validation Failed ({validationErrors.length} Errors)
                  </Typography>
                </Stack>
                <Box sx={{ maxHeight: 150, overflowY: 'auto', pr: 1 }}>
                  <Stack spacing={0.5}>
                    {validationErrors.map((err, i) => (
                      <Typography key={i} variant="caption" sx={{ color: '#B0B0B0', display: 'block', fontFamily: 'monospace' }}>
                        • {err}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={resetState} 
                  sx={{ mt: 2, color: '#f44336', borderColor: 'rgba(244, 67, 54, 0.3)', '&:hover': { borderColor: '#f44336' } }}
                >
                  Clear and Retry
                </Button>
              </Box>
            )}

            {/* Success Success Panel */}
            {success && (
              <Box sx={{ border: '1px solid rgba(76, 175, 80, 0.3)', backgroundColor: 'rgba(76, 175, 80, 0.03)', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <CheckCircle size={48} color="#4CAF50" style={{ margin: '0 auto 12px' }} />
                <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 800, mb: 0.5 }}>
                  Program Compiled Successfully
                </Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                  Scoping localStorage scripts created. Updating parent workspace layout...
                </Typography>
              </Box>
            )}

            {/* Preview Sheet Panel */}
            {compiledData && !success && (
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 800, mb: 2, fontSize: '0.75rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                  FILE LOADED: {file?.name}
                </Typography>
                <Paper sx={{ p: 3, border: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>PROGRAM TITLE</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: 'var(--emerald-primary)' }}>
                        {compiledData.metadata.title || 'Untitled Program'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>DESCRIPTION</Typography>
                      <Typography variant="body2" sx={{ color: '#B0B0B0', fontStyle: 'italic', maxLines: 2, overflow: 'hidden' }}>
                        {compiledData.metadata.description || 'No description provided.'}
                      </Typography>
                    </Box>
                    <Divider sx={{ opacity: 0.05 }} />
                    <Stack direction="row" spacing={4}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>CHAMBER MODULES</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {compiledData.modules.length}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>TOTAL DAYS (LESSONS)</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {compiledData.metadata.duration_days}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>TASKS GENERATED</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {getTaskCount()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>
                <Button 
                  size="small"
                  variant="text" 
                  onClick={resetState} 
                  sx={{ mt: 1, color: '#666', '&:hover': { color: '#B0B0B0' }, textTransform: 'none' }}
                >
                  Upload different file
                </Button>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Button 
          onClick={handleClose} 
          disabled={loading || compiling}
          sx={{ color: '#B0B0B0' }}
        >
          Cancel
        </Button>
        {compiledData && !success && programId && (
          <Button 
            variant="contained" 
            onClick={handleCompile}
            disabled={loading || compiling}
            sx={{ 
              backgroundColor: 'var(--emerald-primary)', 
              color: '#0B0B0F', 
              fontWeight: 700,
              '&:hover': { backgroundColor: 'var(--emerald-light)' }
            }}
          >
            {compiling ? 'Compiling...' : 'Compile Program'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

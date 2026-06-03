import React, { useState } from 'react';
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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Copy, 
  X, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { usePrograms } from '../../lib/queries';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface ProgramCloneModalProps {
  open: boolean;
  onClose: () => void;
  targetProgramId: string | null;
  onCloneSuccess: () => void;
}

export const ProgramCloneModal: React.FC<ProgramCloneModalProps> = ({
  open,
  onClose,
  targetProgramId,
  onCloneSuccess
}) => {
  const queryClient = useQueryClient();
  const { data: allPrograms } = usePrograms();
  const [sourceProgramId, setSourceProgramId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const resetState = () => {
    setSourceProgramId('');
    setErrors([]);
    setSuccess(false);
    setLoading(false);
    setCloning(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleClone = async () => {
    if (!targetProgramId || !sourceProgramId) return;

    try {
      setCloning(true);
      setLoading(true);
      setErrors([]);

      // 1. Fetch source program modules, lessons, and tasks
      const { data: sourceModules, error: fetchErr } = await supabase
        .from('modules')
        .select(`
          *,
          lessons (
            *,
            tasks (*)
          )
        `)
        .eq('program_id', sourceProgramId)
        .order('order_index', { ascending: true })
        .order('day_number', { foreignTable: 'lessons', ascending: true })
        .order('order_index', { foreignTable: 'lessons.tasks', ascending: true });

      if (fetchErr) throw fetchErr;

      // 2. Fetch source program settings to copy description and duration
      const { data: sourceProg, error: progErr } = await supabase
        .from('programs')
        .select('*')
        .eq('id', sourceProgramId)
        .single();

      if (progErr) throw progErr;

      // 3. Clean up (delete) existing modules in the target program
      const { error: deleteError } = await supabase
        .from('modules')
        .delete()
        .eq('program_id', targetProgramId);

      if (deleteError) {
        throw new Error(`Failed to clean up target program modules: ${deleteError.message}`);
      }

      // 4. Update target program settings (description, duration_days, etc.)
      const { error: updateProgErr } = await supabase
        .from('programs')
        .update({
          description: sourceProg.description,
          duration_days: sourceProg.duration_days,
          cover_image: sourceProg.cover_image
        })
        .eq('id', targetProgramId);

      if (updateProgErr) throw updateProgErr;

      // 5. Clone modules, lessons, and tasks
      for (const mod of sourceModules || []) {
        const { data: savedModule, error: modErr } = await supabase
          .from('modules')
          .insert({
            program_id: targetProgramId,
            title: mod.title,
            order_index: mod.order_index
          })
          .select()
          .single();

        if (modErr) throw modErr;

        if (mod.lessons && mod.lessons.length > 0) {
          // Batch insert lessons
          const lessonsToInsert = mod.lessons.map((lesson: any) => ({
            module_id: savedModule.id,
            title: lesson.title,
            description: lesson.description,
            day_number: lesson.day_number,
            unlock_day: lesson.unlock_day
          }));

          const { data: savedLessons, error: lessonsErr } = await supabase
            .from('lessons')
            .insert(lessonsToInsert)
            .select();

          if (lessonsErr) throw lessonsErr;

          // Map old lesson ID to new lesson ID
          const lessonIdMap = new Map<string, string>();
          mod.lessons.forEach((l: any) => {
            const savedLesson = savedLessons.find((sl: any) => sl.day_number === l.day_number);
            if (savedLesson) {
              lessonIdMap.set(l.id, savedLesson.id);
            }
          });

          // Prepare tasks to insert
          const tasksToInsert: any[] = [];
          mod.lessons.forEach((l: any) => {
            const newLessonId = lessonIdMap.get(l.id);
            if (newLessonId && l.tasks && l.tasks.length > 0) {
              l.tasks.forEach((t: any) => {
                tasksToInsert.push({
                  lesson_id: newLessonId,
                  title: t.title,
                  description: t.description,
                  type: t.type,
                  content: t.content,
                  duration_seconds: t.duration_seconds,
                  order_index: t.order_index
                });
              });
            }
          });

          if (tasksToInsert.length > 0) {
            const { error: tasksErr } = await supabase
              .from('tasks')
              .insert(tasksToInsert);

            if (tasksErr) throw tasksErr;
          }
        }
      }

      // 6. Invalidate target program details cache
      queryClient.invalidateQueries({ queryKey: ['program-details', targetProgramId] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });

      setSuccess(true);
      setTimeout(() => {
        onCloneSuccess();
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error('Failed to clone program:', err);
      setErrors([err.message || 'Could not copy program structure to Supabase.']);
    } finally {
      setCloning(false);
      setLoading(false);
    }
  };

  const eligiblePrograms = allPrograms?.filter(p => p.id !== targetProgramId) || [];

  return (
    <Dialog 
      open={open} 
      onClose={loading || cloning ? undefined : handleClose}
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
          Clone Program
        </Typography>
        {!loading && !cloning && (
          <IconButton onClick={handleClose} sx={{ color: '#666', '&:hover': { color: '#B0B0B0' } }}>
            <X size={20} />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', py: 3 }}>
        {!targetProgramId ? (
          <Alert severity="warning" sx={{ backgroundColor: 'rgba(239, 83, 80, 0.05)', color: '#EF5350', border: '1px solid rgba(239, 83, 80, 0.2)' }}>
            <strong>Active Program Required:</strong> Please select or save a program in General Settings before cloning.
          </Alert>
        ) : (
          <Stack spacing={3}>
            {/* Warning Alert */}
            {!success && (
              <Alert 
                severity="warning" 
                icon={<AlertTriangle size={20} />}
                sx={{ 
                  backgroundColor: 'rgba(212, 175, 55, 0.05)', 
                  color: '#D4AF37', 
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  fontWeight: 600
                }}
              >
                Warning: Cloning will overwrite and delete all existing modules, lessons, and tasks in the target program. This action cannot be undone.
              </Alert>
            )}

            {/* Selection Form */}
            {!loading && !cloning && !success && (
              <Box>
                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
                  Select the source program you wish to copy all modules, lessons, and tasks from:
                </Typography>
                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                  <InputLabel id="source-program-select-label" sx={{ color: '#666' }}>Source Program</InputLabel>
                  <Select
                    labelId="source-program-select-label"
                    label="Source Program"
                    value={sourceProgramId}
                    onChange={(e) => setSourceProgramId(e.target.value)}
                    sx={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: '#EAEAEA',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--emerald-mid)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--emerald-primary)' }
                    }}
                  >
                    {eligiblePrograms.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                    ))}
                    {eligiblePrograms.length === 0 && (
                      <MenuItem disabled value="">No other programs available to clone</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Loading Indicator */}
            {(loading || cloning) && !success && (
              <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress sx={{ color: 'var(--emerald-primary)' }} />
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                  Copying program modules, lessons, and tasks...
                </Typography>
              </Box>
            )}

            {/* Errors Panel */}
            {errors.length > 0 && (
              <Box sx={{ border: '1px solid rgba(244, 67, 54, 0.3)', backgroundColor: 'rgba(244, 67, 54, 0.03)', borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#f44336', fontWeight: 800, mb: 1 }}>
                  Cloning Failed
                </Typography>
                {errors.map((err, i) => (
                  <Typography key={i} variant="caption" sx={{ color: '#B0B0B0', display: 'block' }}>
                    • {err}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Success Panel */}
            {success && (
              <Box sx={{ border: '1px solid rgba(76, 175, 80, 0.3)', backgroundColor: 'rgba(76, 175, 80, 0.03)', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <CheckCircle size={48} color="#4CAF50" style={{ margin: '0 auto 12px' }} />
                <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 800, mb: 0.5 }}>
                  Program Cloned Successfully
                </Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                  All modules, lessons, and tasks copied. Refreshing workspace view...
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Button 
          onClick={handleClose} 
          disabled={loading || cloning}
          sx={{ color: '#B0B0B0' }}
        >
          Cancel
        </Button>
        {!success && targetProgramId && sourceProgramId && (
          <Button 
            variant="contained" 
            onClick={handleClone}
            disabled={loading || cloning}
            startIcon={<Copy size={16} />}
            sx={{ 
              backgroundColor: 'var(--emerald-primary)', 
              color: '#0B0B0F', 
              fontWeight: 700,
              '&:hover': { backgroundColor: 'var(--emerald-light)' }
            }}
          >
            {cloning ? 'Cloning...' : 'Clone Program'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

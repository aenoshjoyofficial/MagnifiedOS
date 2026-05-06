'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  ChevronDown, 
  Lock, 
  CheckCircle2, 
  PlayCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { useMyEnrollment } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

const MyProgram = () => {
  const { user } = useAuthStore();
  const [targetUserId, setTargetUserId] = React.useState<string | null>(user?.id || null);

  React.useEffect(() => {
    const findUserId = async () => {
      if (user?.id) {
        setTargetUserId(user.id);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'aenoshjoy@gmail.com')
        .single();
      if (data) setTargetUserId(data.id);
    };
    findUserId();
  }, [user]);

  const { data: enrollment, isLoading } = useMyEnrollment(targetUserId || '');

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
        <Typography variant="h5">No active program found.</Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Please enroll in a program from the admin panel.</Typography>
      </Box>
    );
  }

  const program = enrollment.programs;
  const completions = enrollment.task_completions || [];
  
  // Logic to determine status for modules and days
  const getModuleStatus = (module: any) => {
    const allTasks = module.lessons.flatMap((l: any) => l.tasks);
    if (allTasks.length === 0) return 'locked';
    
    const completedTasks = allTasks.filter((t: any) => completions.some((c: any) => c.task_id === t.id));
    
    if (completedTasks.length === allTasks.length) return 'completed';
    if (completedTasks.length > 0) return 'active';
    return 'pending';
  };

  const getDayStatus = (lesson: any) => {
    const tasks = lesson.tasks;
    if (tasks.length === 0) return 'pending';
    
    const completedTasks = tasks.filter((t: any) => completions.some((c: any) => c.task_id === t.id));
    
    if (completedTasks.length === tasks.length) return 'completed';
    return 'active';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{program.title}</Typography>
        <Typography variant="body1" sx={{ color: '#B0B0B0' }}>
          {program.description}
        </Typography>
      </Box>

      <Stack spacing={2}>
        {program.modules.map((module: any) => {
          const status = getModuleStatus(module);
          return (
            <Accordion 
              key={module.id} 
              defaultExpanded={status === 'active'}
              sx={{ 
                backgroundColor: 'rgba(18, 18, 23, 0.5)',
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: status === 'locked' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(212, 175, 55, 0.1)',
              }}
            >
              <AccordionSummary 
                expandIcon={<ChevronDown color="#D4AF37" />}
                sx={{ px: 3, py: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {status === 'completed' ? (
                    <CheckCircle2 size={20} color="#4CAF50" />
                  ) : status === 'locked' ? (
                    <Lock size={20} color="#666" />
                  ) : (
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #D4AF37' }} />
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1, opacity: status === 'locked' ? 0.5 : 1 }}>
                    {module.title}
                  </Typography>
                  {status === 'active' && (
                    <Chip label="IN PROGRESS" size="small" sx={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', fontWeight: 700, fontSize: '0.65rem' }} />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Stack>
                  {module.lessons.map((lesson: any) => {
                    const dayStatus = getDayStatus(lesson);
                    const isLocked = status === 'locked';
                    
                    return (
                      <Box 
                        key={lesson.id}
                        {...(!isLocked ? { component: Link, to: '/today' } : {})}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          px: 6,
                          py: 2,
                          textDecoration: 'none',
                          color: 'inherit',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          opacity: isLocked ? 0.4 : 1,
                          transition: 'background 0.2s',
                          '&:hover': !isLocked ? { backgroundColor: 'rgba(212, 175, 55, 0.03)' } : {}
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 700, minWidth: 30 }}>
                            D{lesson.day_number}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {lesson.title}
                          </Typography>
                        </Box>
                        {dayStatus === 'completed' ? (
                          <CheckCircle2 size={18} color="#4CAF50" />
                        ) : isLocked ? (
                          <Lock size={18} color="#666" />
                        ) : (
                          <PlayCircle size={18} color="#D4AF37" />
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Box>
  );
};

export default MyProgram;


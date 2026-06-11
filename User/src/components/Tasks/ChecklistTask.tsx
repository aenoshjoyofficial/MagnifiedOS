'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Checkbox, 
  Stack,
  LinearProgress
} from '@mui/material';
import { CheckCircle2 } from 'lucide-react';

interface ChecklistTaskProps {
  steps: string[];
  onComplete: () => void;
  disabled?: boolean;
  isCompleted?: boolean;
}

const ChecklistTask = ({ steps, onComplete, disabled = false, isCompleted = false }: ChecklistTaskProps) => {
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(new Array(steps.length).fill(isCompleted));

  const handleToggle = (index: number) => {
    if (disabled) {
      onComplete();
      return;
    }
    
    const newChecked = [...checkedSteps];
    newChecked[index] = !newChecked[index];
    setCheckedSteps(newChecked);

    if (newChecked.every(step => step)) {
      onComplete();
    }
  };

  const completedCount = checkedSteps.filter(Boolean).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  if (steps.length === 0) return null;

  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.7rem', letterSpacing: 0.5 }}>
            {completedCount} OF {steps.length} STEPS COMPLETE
          </Typography>
          <Typography variant="caption" sx={{ color: '#B0B0B0', fontWeight: 700, fontSize: '0.7rem' }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 3, 
            borderRadius: 1.5,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #00D4A3 0%, #D4AF37 100%)' }
          }} 
        />
      </Box>

      <Stack spacing={0.75}>
        {steps.map((step, index) => (
          <Box 
            key={index}
            onClick={() => handleToggle(index)}
            sx={{ 
              p: 1, 
              borderRadius: 1.5, 
              backgroundColor: checkedSteps[index] ? 'rgba(212, 175, 55, 0.03)' : 'rgba(255, 255, 255, 0.01)',
              border: '1px solid',
              borderColor: checkedSteps[index] ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              opacity: disabled ? 0.7 : 1,
              '&:hover': !disabled ? {
                borderColor: 'rgba(212, 175, 55, 0.3)',
                backgroundColor: 'rgba(212, 175, 55, 0.02)'
              } : {}
            }}
          >
            <Checkbox 
              checked={checkedSteps[index]} 
              disabled={disabled}
              size="small"
              sx={{ 
                p: 0,
                mt: 0.25,
                color: 'rgba(212, 175, 55, 0.3)',
                '&.Mui-checked': { color: '#D4AF37' },
                '&.Mui-disabled': { color: checkedSteps[index] ? '#D4AF37' : 'rgba(255, 255, 255, 0.05)' }
              }}
            />
            <Typography sx={{ 
              color: checkedSteps[index] ? '#888' : '#DAE0E6',
              textDecoration: checkedSteps[index] ? 'line-through' : 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
              lineHeight: 1.4,
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              flexGrow: 1
            }}>
              {step}
            </Typography>
          </Box>
        ))}
      </Stack>

      {progress === 100 && (
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#D4AF37' }}>
          <CheckCircle2 size={16} />
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>ALL STEPS COMPLETED</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChecklistTask;

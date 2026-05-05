'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Checkbox, 
  FormControlLabel, 
  Stack,
  LinearProgress
} from '@mui/material';
import { CheckCircle2 } from 'lucide-react';

interface ChecklistTaskProps {
  steps: string[];
  onComplete: () => void;
}

const ChecklistTask = ({ steps, onComplete }: ChecklistTaskProps) => {
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(new Array(steps.length).fill(false));

  const handleToggle = (index: number) => {
    const newChecked = [...checkedSteps];
    newChecked[index] = !newChecked[index];
    setCheckedSteps(newChecked);

    if (newChecked.every(step => step)) {
      onComplete();
    }
  };

  const completedCount = checkedSteps.filter(Boolean).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 700 }}>
            {completedCount} OF {steps.length} COMPLETE
          </Typography>
          <Typography variant="caption" sx={{ color: '#B0B0B0', fontWeight: 700 }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 4, 
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& .MuiLinearProgress-bar': { backgroundColor: '#D4AF37' }
          }} 
        />
      </Box>

      <Stack spacing={1}>
        {steps.map((step, index) => (
          <Box 
            key={index}
            onClick={() => handleToggle(index)}
            sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              backgroundColor: checkedSteps[index] ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              border: '1px solid',
              borderColor: checkedSteps[index] ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'rgba(212, 175, 55, 0.4)',
                backgroundColor: 'rgba(212, 175, 55, 0.03)'
              }
            }}
          >
            <FormControlLabel
              control={
                <Checkbox 
                  checked={checkedSteps[index]} 
                  sx={{ 
                    color: 'rgba(212, 175, 55, 0.3)',
                    '&.Mui-checked': { color: '#D4AF37' }
                  }}
                />
              }
              label={
                <Typography sx={{ 
                  color: checkedSteps[index] ? '#EAEAEA' : '#B0B0B0',
                  textDecoration: checkedSteps[index] ? 'line-through' : 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}>
                  {step}
                </Typography>
              }
              sx={{ m: 0, pointerEvents: 'none' }}
            />
          </Box>
        ))}
      </Stack>

      {progress === 100 && (
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#D4AF37' }}>
          <CheckCircle2 size={20} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>ALL STEPS COMPLETED</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChecklistTask;

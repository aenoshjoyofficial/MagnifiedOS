'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Divider
} from '@mui/material';
import { CheckCircle2 } from 'lucide-react';

interface TextTaskProps {
  content: string;
  onComplete: () => void;
}

const TextTask = ({ content, onComplete }: TextTaskProps) => {
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <Box>
      <Box 
        sx={{ 
          color: '#EAEAEA',
          lineHeight: 1.8,
          fontSize: '1.1rem',
          mb: 4,
          '& p': { mb: 2 },
          '& strong': { color: '#D4AF37', fontWeight: 700 }
        }}
      >
        <Typography variant="body1" component="div">
          {content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3, opacity: 0.1 }} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained"
          onClick={() => { setIsCompleted(true); onComplete(); }}
          startIcon={isCompleted ? <CheckCircle2 size={18} /> : null}
          sx={{ 
            backgroundColor: isCompleted ? 'transparent' : '#D4AF37',
            color: isCompleted ? '#D4AF37' : '#0B0B0F',
            px: 4,
            py: 1.5,
            fontWeight: 800,
            '&:hover': { 
              backgroundColor: isCompleted ? 'rgba(212, 175, 55, 0.05)' : '#B8962D',
              borderColor: isCompleted ? '#D4AF37' : 'transparent'
            },
            border: isCompleted ? '1px solid #D4AF37' : 'none'
          }}
        >
          {isCompleted ? 'DAY CONTENT READ' : 'MARK AS READ'}
        </Button>
      </Box>
    </Box>
  );
};

export default TextTask;

'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button
} from '@mui/material';
import { CheckCircle2 } from 'lucide-react';

interface VideoTaskProps {
  url: string;
  onComplete: () => void;
}

const VideoTask = ({ url, onComplete }: VideoTaskProps) => {
  const [isCompleted, setIsCompleted] = useState(false);

  // Simple YouTube ID extraction
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.split('v=')[1] || url.split('/').pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  return (
    <Box>
      <Box 
        sx={{ 
          position: 'relative', 
          width: '100%', 
          paddingTop: '56.25%', // 16:9 Aspect Ratio
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#000',
          mb: 3
        }}
      >
        <iframe
          src={getEmbedUrl(url)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant={isCompleted ? "text" : "outlined"}
          onClick={() => { setIsCompleted(true); onComplete(); }}
          startIcon={isCompleted ? <CheckCircle2 size={18} /> : null}
          sx={{ 
            color: isCompleted ? '#D4AF37' : '#B0B0B0',
            borderColor: isCompleted ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
            fontWeight: 700,
            '&:hover': { 
              borderColor: '#D4AF37',
              backgroundColor: 'rgba(212, 175, 55, 0.05)'
            }
          }}
        >
          {isCompleted ? 'COMPLETED' : 'MARK COMPLETE'}
        </Button>
      </Box>
    </Box>
  );
};

export default VideoTask;

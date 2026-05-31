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

  // Robust YouTube and Vimeo ID extraction
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // YouTube Shorts
    const shortsMatch = url.match(/\/shorts\/([^"&?\/ ]{11})/i);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(?:channels\/[^\/]+\/|groups\/[^\/]+\/|album\/[^\/]+\/video\/|showcase\/[^\/]+\/video\/|video\/|manage\/videos\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };


  const isRawVideo = url.toLowerCase().endsWith('.mp4') || 
                     url.toLowerCase().includes('.mp4?') || 
                     url.toLowerCase().endsWith('.webm') || 
                     url.toLowerCase().endsWith('.ogg');

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
        {isRawVideo ? (
          <video
            src={url}
            controls
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0
            }}
          />
        ) : (
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
        )}
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

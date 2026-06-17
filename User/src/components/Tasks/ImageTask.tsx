'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Divider
} from '@mui/material';
import { CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface ImageTaskProps {
  url: string;
  description: string;
  onComplete: () => void;
  disabled?: boolean;
}

const ImageTask = ({ url, description, onComplete, disabled = false }: ImageTaskProps) => {
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <Box>
      {/* Description Text */}
      {description && (
        <Box 
          sx={{ 
            color: '#EAEAEA',
            lineHeight: 1.8,
            fontSize: '1.1rem',
            mb: 3,
            '& p': { mb: 2 },
            '& strong': { color: '#D4AF37', fontWeight: 700 }
          }}
        >
          <Typography variant="body1" component="div">
            {/<[a-z][\s\S]*>/i.test(description) ? (
              <div dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              description.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))
            )}
          </Typography>
        </Box>
      )}

      {/* Image Display */}
      {url ? (
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 175, 55, 0.05)',
            mb: 4,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(212, 175, 55, 0.4)',
              transform: 'scale(1.005)'
            }
          }}
        >
          <img 
            src={url} 
            alt="Task Visual Protocol" 
            style={{ 
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '650px',
              objectFit: 'contain',
              margin: '0 auto'
            }} 
          />
        </Box>
      ) : (
        <Box 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            backgroundColor: 'rgba(255,255,255,0.02)', 
            borderRadius: 3,
            border: '1px dashed rgba(255,255,255,0.1)',
            mb: 4,
            color: '#888'
          }}
        >
          <ImageIcon size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <Typography variant="body2">No task image URL configured.</Typography>
        </Box>
      )}

      <Divider sx={{ mb: 3, opacity: 0.1 }} />

      {/* Completion Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained"
          onClick={() => {
            if (disabled) {
              onComplete();
              return;
            }
            setIsCompleted(true);
            onComplete();
          }}
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
          {isCompleted ? 'IMAGE SEEN' : 'MARK AS SEEN'}
        </Button>
      </Box>
    </Box>
  );
};

export default ImageTask;

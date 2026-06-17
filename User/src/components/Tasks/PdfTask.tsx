'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Divider,
  Stack
} from '@mui/material';
import { CheckCircle2, FileText, ExternalLink, Download } from 'lucide-react';

interface PdfTaskProps {
  url: string;
  description: string;
  onComplete: () => void;
  disabled?: boolean;
}

const PdfTask = ({ url, description, onComplete, disabled = false }: PdfTaskProps) => {
  const [isCompleted, setIsCompleted] = useState(false);

  // Extract a clean file name from the URL
  const getFileName = (fileUrl: string) => {
    try {
      if (!fileUrl) return 'protocol.pdf';
      const decoded = decodeURIComponent(fileUrl);
      const filename = decoded.substring(decoded.lastIndexOf('/') + 1);
      // Remove any timestamp or suffix if it starts with chamber-task-
      return filename || 'protocol.pdf';
    } catch (e) {
      return 'protocol.pdf';
    }
  };

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

      {/* PDF View Container */}
      {url ? (
        <Box 
          sx={{ 
            mb: 4,
            borderRadius: '16px',
            backgroundColor: 'rgba(7, 24, 21, 0.25)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 175, 55, 0.05)',
            overflow: 'hidden',
            transition: 'border-color 0.3s ease, transform 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(212, 175, 55, 0.4)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          {/* Header Action Bar */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2, 
              backgroundColor: 'rgba(212, 175, 55, 0.05)', 
              borderBottom: '1px solid rgba(212, 175, 55, 0.15)'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
              <FileText size={20} color="#D4AF37" />
              <Typography variant="body2" sx={{ color: '#EAEAEA', fontWeight: 700 }}>
                PDF Document Protocol
              </Typography>
            </Box>
            <Button
              variant="text"
              size="small"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<ExternalLink size={14} />}
              sx={{ 
                color: '#D4AF37', 
                fontWeight: 800, 
                textTransform: 'none',
                fontSize: '0.75rem',
                '&:hover': {
                  backgroundColor: 'rgba(212, 175, 55, 0.1)'
                }
              }}
            >
              Open in New Tab
            </Button>
          </Box>

          {/* Premium Preview Place Card */}
          <Box 
            sx={{ 
              p: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.2)'
            }}
          >
            {/* Visual Document Layout */}
            <Box 
              sx={{ 
                position: 'relative',
                width: 72,
                height: 88,
                borderRadius: '8px',
                border: '2px solid #D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}
            >
              <FileText size={36} color="#D4AF37" />
              <Box 
                sx={{ 
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  backgroundColor: '#D4AF37',
                  color: '#0B0B0F',
                  fontWeight: 900,
                  fontSize: '0.65rem',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  letterSpacing: '0.05em'
                }}
              >
                PDF
              </Box>
            </Box>

            <Typography 
              variant="h6" 
              sx={{ 
                color: '#FFFFFF', 
                fontWeight: 750, 
                mb: 1, 
                fontSize: '1.1rem',
                fontFamily: '"Outfit", sans-serif',
                px: 2,
                wordBreak: 'break-all'
              }}
            >
              {getFileName(url)}
            </Typography>
            
            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 4, fontSize: '0.85rem' }}>
              Document Protocol ready for download or offline review.
            </Typography>

            {/* Glowing Action Button */}
            <Button
              variant="contained"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<ExternalLink size={16} />}
              sx={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8962D 100%)',
                color: '#0B0B0F',
                px: 4.5,
                py: 1.5,
                borderRadius: '30px',
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(212, 175, 55, 0.25)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #F0D27A 0%, #D4AF37 100%)',
                  boxShadow: '0 12px 30px rgba(212, 175, 55, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Open PDF Protocol
            </Button>
          </Box>
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
          <FileText size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <Typography variant="body2">No PDF URL configured.</Typography>
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
          {isCompleted ? 'DOCUMENT READ' : 'MARK AS READ'}
        </Button>
      </Box>
    </Box>
  );
};

export default PdfTask;

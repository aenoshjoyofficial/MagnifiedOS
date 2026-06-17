'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Divider
} from '@mui/material';
import { CheckCircle2, FileText, ExternalLink } from 'lucide-react';

interface PdfTaskProps {
  url: string;
  description: string;
  onComplete: () => void;
  disabled?: boolean;
}

const PdfTask = ({ url, description, onComplete, disabled = false }: PdfTaskProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Dynamically detect mobile screen sizes to apply different layouts
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extract a clean file name from the URL
  const getFileName = (fileUrl: string) => {
    try {
      if (!fileUrl) return 'protocol.pdf';
      const decoded = decodeURIComponent(fileUrl);
      const filename = decoded.substring(decoded.lastIndexOf('/') + 1);
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
        <Box sx={{ mb: 4 }}>
          {isMobile ? (
            /* Mobile View: Render action card with optional smaller iframe */
            <Box 
              sx={{ 
                borderRadius: '16px',
                backgroundColor: 'rgba(7, 24, 21, 0.25)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                overflow: 'hidden',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Box 
                sx={{ 
                  position: 'relative',
                  width: 64,
                  height: 76,
                  borderRadius: '6px',
                  border: '2px solid #D4AF37',
                  backgroundColor: 'rgba(212, 175, 55, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <FileText size={32} color="#D4AF37" />
                <Box 
                  sx={{ 
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    backgroundColor: '#D4AF37',
                    color: '#0B0B0F',
                    fontWeight: 900,
                    fontSize: '0.6rem',
                    px: 0.5,
                    borderRadius: '2px'
                  }}
                >
                  PDF
                </Box>
              </Box>

              <Typography 
                variant="subtitle1" 
                sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1, wordBreak: 'break-all', px: 2 }}
              >
                {getFileName(url)}
              </Typography>

              <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 3, fontSize: '0.85rem' }}>
                Tap below to view the PDF document protocol in a new tab.
              </Typography>

              <Button
                variant="contained"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<ExternalLink size={16} />}
                sx={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8962D 100%)',
                  color: '#0B0B0F',
                  px: 4,
                  py: 1.25,
                  borderRadius: '30px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  boxShadow: '0 6px 20px rgba(212, 175, 55, 0.25)',
                  mb: 3,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #F0D27A 0%, #D4AF37 100%)'
                  }
                }}
              >
                Open PDF Protocol
              </Button>

              {/* Embedded viewer frame on mobile (if supported by device) */}
              <Box 
                sx={{ 
                  width: '100%', 
                  height: '350px', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(255, 255, 255, 0.05)' 
                }}
              >
                <iframe 
                  src={`${url}#toolbar=0`} 
                  title="Mobile PDF Viewer"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }}
                />
              </Box>
            </Box>
          ) : (
            /* Desktop View: Render full-size 800px inline iframe */
            <Box 
              sx={{ 
                borderRadius: '16px',
                backgroundColor: 'rgba(7, 24, 21, 0.25)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                overflow: 'hidden'
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
                    {getFileName(url)}
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

              {/* Full height 800px Inline Iframe */}
              <Box sx={{ width: '100%', height: '800px', backgroundColor: '#1E1E1E' }}>
                <iframe 
                  src={`${url}#toolbar=0`} 
                  title="Desktop PDF Viewer"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }}
                />
              </Box>
            </Box>
          )}
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

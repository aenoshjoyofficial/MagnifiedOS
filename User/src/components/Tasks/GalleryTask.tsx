'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Dialog,
  Zoom
} from '@mui/material';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface GalleryTaskProps {
  images: string[];
  description: string;
  onComplete: () => void;
  disabled?: boolean;
}

const GalleryTask = ({ images = [], description, onComplete, disabled = false }: GalleryTaskProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const imageList = Array.isArray(images) ? images.filter(Boolean) : [];

  const handleNext = () => {
    if (imageList.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % imageList.length);
    setZoomScale(1.0); // Reset zoom on image change
  };

  const handlePrev = () => {
    if (imageList.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    setZoomScale(1.0); // Reset zoom on image change
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keypresses if typing in inputs
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape' && lightboxOpen) {
        handleCloseLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, imageList.length, lightboxOpen]);

  // Touch handlers for mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50; // min distance in px
    if (diff > swipeThreshold) {
      handleNext();
    } else if (diff < -swipeThreshold) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleOpenLightbox = () => {
    setZoomScale(1.0);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.25, 1.0));
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
  };

  if (imageList.length === 0) {
    return (
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
        <Typography variant="body2">No images configured for this gallery.</Typography>
      </Box>
    );
  }

  const currentImage = imageList[activeIndex];

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

      {/* Main Slideshow Container */}
      <Box
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          position: 'relative',
          width: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 175, 55, 0.05)',
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '350px'
        }}
      >
        {/* Slideshow Image */}
        <Box
          onClick={handleOpenLightbox}
          sx={{
            position: 'relative',
            width: '100%',
            cursor: 'zoom-in',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={currentImage}
            alt={`Task Visual Protocol ${activeIndex + 1}`}
            loading="lazy"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '550px',
              objectFit: 'contain',
              margin: '0 auto'
            }}
          />

          {/* Maximize Icon Overlay */}
          <IconButton
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(11, 11, 15, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              zIndex: 2,
              '&:hover': {
                backgroundColor: 'rgba(11, 11, 15, 0.8)',
                borderColor: '#D4AF37'
              }
            }}
          >
            <Maximize2 size={16} />
          </IconButton>
        </Box>

        {/* Previous/Next Arrows (Only if multiple images exist) */}
        {imageList.length > 1 && (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              sx={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(11, 11, 15, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                zIndex: 2,
                '&:hover': {
                  backgroundColor: 'rgba(11, 11, 15, 0.8)',
                  borderColor: '#D4AF37'
                }
              }}
            >
              <ChevronLeft size={20} />
            </IconButton>

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              sx={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(11, 11, 15, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                zIndex: 2,
                '&:hover': {
                  backgroundColor: 'rgba(11, 11, 15, 0.8)',
                  borderColor: '#D4AF37'
                }
              }}
            >
              <ChevronRight size={20} />
            </IconButton>
          </>
        )}
      </Box>

      {/* Image Counter Indicator */}
      {imageList.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 4
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#D4AF37',
              fontWeight: 800,
              backgroundColor: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              px: 2,
              py: 0.5,
              borderRadius: '20px',
              fontSize: '0.85rem'
            }}
          >
            {activeIndex + 1} / {imageList.length}
          </Typography>
        </Box>
      )}

      {/* Lightbox / Zoom Dialog */}
      <Dialog
        fullScreen
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'rgba(11, 11, 15, 0.96)',
              backdropFilter: 'blur(20px)',
              backgroundImage: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#FFFFFF',
              position: 'relative',
              p: 0,
              m: 0
            }
          }
        }}
      >
        {/* Top Control Bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: 'rgba(11, 11, 15, 0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            zIndex: 10
          }}
        >
          <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 800 }}>
            {activeIndex + 1} / {imageList.length}
          </Typography>

          {/* Zoom controls */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton onClick={handleZoomOut} disabled={zoomScale <= 1.0} sx={{ color: '#FFFFFF' }}>
              <ZoomOut size={18} />
            </IconButton>
            <Typography variant="body2" sx={{ width: 45, textAlign: 'center', fontWeight: 700 }}>
              {Math.round(zoomScale * 100)}%
            </Typography>
            <IconButton onClick={handleZoomIn} disabled={zoomScale >= 3.0} sx={{ color: '#FFFFFF' }}>
              <ZoomIn size={18} />
            </IconButton>
            <IconButton onClick={handleResetZoom} disabled={zoomScale === 1.0} sx={{ color: '#FFFFFF', ml: 1 }}>
              <RotateCcw size={16} />
            </IconButton>
          </Box>

          <IconButton
            onClick={handleCloseLightbox}
            sx={{
              color: '#FFFFFF',
              '&:hover': { color: '#D4AF37' }
            }}
          >
            <X size={24} />
          </IconButton>
        </Box>

        {/* Lightbox Image Viewport */}
        <Box
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            p: 4,
            pt: '80px'
          }}
        >
          <img
            src={currentImage}
            alt={`Task Visual Zoom ${activeIndex + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '90%',
              objectFit: 'contain',
              transform: `scale(${zoomScale})`,
              transition: 'transform 0.15s ease-out',
              cursor: zoomScale > 1.0 ? 'grab' : 'zoom-out'
            }}
            onClick={handleCloseLightbox}
          />
        </Box>

        {/* Lightbox Arrows (Only if multiple images exist) */}
        {imageList.length > 1 && (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              sx={{
                position: 'absolute',
                left: 24,
                top: '55%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                zIndex: 10,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderColor: '#D4AF37'
                }
              }}
            >
              <ChevronLeft size={28} />
            </IconButton>

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              sx={{
                position: 'absolute',
                right: 24,
                top: '55%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                zIndex: 10,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderColor: '#D4AF37'
                }
              }}
            >
              <ChevronRight size={28} />
            </IconButton>
          </>
        )}
      </Dialog>

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
          {isCompleted ? 'GALLERY VIEWED' : 'MARK AS VIEWED'}
        </Button>
      </Box>
    </Box>
  );
};

export default GalleryTask;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack, 
  IconButton,
  MobileStepper
} from '@mui/material';
import { X, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

interface Step {
  title: string;
  description: string;
  targetId?: string; // Optional element ID to highlight (if missing, renders center overlay)
}

const TOUR_STEPS: Step[] = [
  {
    title: "Welcome to Magnified Existence",
    description: "Your gateway to inner alignment, high performance, and neural expansion. Let's take a quick 1-minute journey to introduce you to your new Magnified OS workspace."
  },
  {
    title: "Dashboard Overview",
    description: "This is your core operational center. Visualize your streak metrics, daily progress summaries, and upcoming practices all at a single glance.",
    targetId: "tour-dashboard"
  },
  {
    title: "Today's Practice",
    description: "Your daily customized alignment ritual is housed here. Access your active morning, afternoon, and evening practices every day to remain in momentum.",
    targetId: "tour-todays-practice"
  },
  {
    title: "Programs & Chambers",
    description: "Deep dive into your enrolled modules, curriculum, and targeted exercises. Unlock new chambers as your journey unfolds.",
    targetId: "tour-my-program"
  },
  {
    title: "Sessions & Bookings",
    description: "Schedule live interactive practices, check availability slots, and manage your custom 1-on-1 consultations directly with the scheduling calendar.",
    targetId: "tour-sessions"
  },
  {
    title: "Progress Tracking",
    description: "Detailed analytics on your training history. Watch your consistency metrics climb and track your milestones over time.",
    targetId: "tour-progress"
  },
  {
    title: "Onboarding Complete!",
    description: "You're all set to begin. Take action, stay consistent, and expand your presence. We wish you an exceptional journey ahead!"
  }
];

export const DashboardTour = () => {
  const { user, profile, setProfileField } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [showTour, setShowTour] = useState(false);

  // Resize and scroll listener ref to update spotlight cutout reactively
  const resizeTimer = useRef<number | null>(null);

  // Check if tour should run
  useEffect(() => {
    if (!profile) return;
    
    // Check Supabase profiles.has_seen_tour first, fall back to localStorage
    const hasSeenTourLocal = localStorage.getItem(`has_seen_tour_${profile.id}`) === 'true';
    const hasSeenTourDB = profile.has_seen_tour === true;

    if (!hasSeenTourDB && !hasSeenTourLocal && location.pathname === '/dashboard') {
      setShowTour(true);
    }
  }, [profile, location.pathname]);

  // Recalculate target element position whenever activeStep or window sizes change
  const updateHighlight = () => {
    const step = TOUR_STEPS[activeStep];
    if (step && step.targetId) {
      const element = document.getElementById(step.targetId);
      if (element) {
        // Auto-scroll target element into view nicely
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        
        // Small delay to allow scroll to complete before drawing box
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setHighlightRect(rect);
        }, 150);
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  };

  useEffect(() => {
    if (!showTour) return;

    updateHighlight();

    const handleResizeOrScroll = () => {
      if (resizeTimer.current) window.cancelAnimationFrame(resizeTimer.current);
      resizeTimer.current = window.requestAnimationFrame(() => {
        updateHighlight();
      });
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
      if (resizeTimer.current) window.cancelAnimationFrame(resizeTimer.current);
    };
  }, [activeStep, showTour]);

  const handleFinish = async () => {
    setShowTour(false);
    if (!user) return;

    // 1. Sync value to Supabase
    try {
      await supabase
        .from('profiles')
        .update({ has_seen_tour: true })
        .eq('id', user.id);
    } catch (err) {
      console.warn("Could not sync has_seen_tour to DB profiles table. Falling back to local storage.", err);
    }

    // 2. Fall back/backup with local storage to prevent double tours if table schema was pending
    localStorage.setItem(`has_seen_tour_${user.id}`, 'true');

    // 3. Update state locally
    setProfileField('has_seen_tour', true);
  };

  const handleNext = () => {
    const step = TOUR_STEPS[activeStep];
    
    // Auto-navigate to targeted route to demo the corresponding view
    if (activeStep === 1) navigate('/program');
    else if (activeStep === 2) navigate('/today');
    else if (activeStep === 3) navigate('/sessions');
    else if (activeStep === 4) navigate('/progress');
    else if (activeStep === 5) navigate('/dashboard');

    if (activeStep < TOUR_STEPS.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    // Auto-navigate back to coordinate with view
    if (activeStep === 2) navigate('/dashboard');
    else if (activeStep === 3) navigate('/program');
    else if (activeStep === 4) navigate('/today');
    else if (activeStep === 5) navigate('/sessions');
    else if (activeStep === 6) navigate('/progress');

    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  if (!showTour) return null;

  const currentStep = TOUR_STEPS[activeStep];
  const isLastStep = activeStep === TOUR_STEPS.length - 1;

  // Determine popup coordinates.
  // If target element exists, place next to it, otherwise place in center of screen.
  const popupStyles: React.CSSProperties = highlightRect 
    ? {
        position: 'fixed',
        top: Math.max(20, Math.min(window.innerHeight - 300, highlightRect.top - 20)),
        left: highlightRect.right + 24 + 320 > window.innerWidth
          ? Math.max(20, highlightRect.left - 340) // Place left if no space on right
          : highlightRect.right + 24,
        width: 320,
        zIndex: 100000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: Math.min(420, window.innerWidth - 32),
        zIndex: 100000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      };

  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'auto' }}>
      
      {/* Background Mask Overlay */}
      {/* If there is a targeted element spotlight, render the glow mask frame, else full screen dim */}
      {highlightRect ? (
        <Box 
          sx={{
            position: 'fixed',
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            borderRadius: '10px',
            border: '2px solid #D4AF37',
            boxShadow: '0 0 0 9999px rgba(11, 11, 15, 0.8), 0 0 15px rgba(212, 175, 55, 0.4)',
            zIndex: 99999,
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      ) : (
        <Box 
          sx={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 11, 15, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            transition: 'all 0.3s ease'
          }}
        />
      )}

      {/* Tour Dialogue Box */}
      <Card 
        sx={{
          ...popupStyles,
          backgroundColor: 'rgba(20, 35, 32, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 163, 0.25)',
          boxShadow: '0 12px 40px rgba(0, 212, 163, 0.15)',
          borderRadius: '16px',
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isLastStep ? (
                <CheckCircle2 size={20} color="#00D4A3" />
              ) : (
                <Sparkles size={20} color="#D4AF37" />
              )}
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: isLastStep ? '#00D4A3' : '#D4AF37', 
                  fontWeight: 800, 
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem'
                }}
              >
                {isLastStep ? "Expansion Awaits" : `Step ${activeStep + 1} of ${TOUR_STEPS.length}`}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleFinish} 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.4)', 
                '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.05)' } 
              }}
            >
              <X size={18} />
            </IconButton>
          </Box>

          {/* Title & Body */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800, 
              color: '#FFFFFF', 
              mb: 1.5,
              fontFamily: '"Playfair Display", serif',
              fontSize: '1.25rem'
            }}
          >
            {currentStep.title}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#B0B0B0', 
              lineHeight: 1.7, 
              mb: 3,
              fontSize: '0.9rem' 
            }}
          >
            {currentStep.description}
          </Typography>

          {/* Navigation Stepper & Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Skip Link (hide on last step) */}
            {!isLastStep ? (
              <Button 
                variant="text" 
                onClick={handleFinish} 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.4)', 
                  fontWeight: 600, 
                  fontSize: '0.8rem',
                  p: 0,
                  '&:hover': { color: '#D4AF37', backgroundColor: 'transparent' }
                }}
              >
                Skip Tour
              </Button>
            ) : (
              <Box />
            )}

            {/* Step Controls */}
            <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
              {activeStep > 0 && (
                <IconButton 
                  size="small" 
                  onClick={handlePrev}
                  sx={{ 
                    color: '#00D4A3', 
                    border: '1px solid rgba(0, 212, 163, 0.3)',
                    '&:hover': { backgroundColor: 'rgba(0, 212, 163, 0.05)' } 
                  }}
                >
                  <ChevronLeft size={16} />
                </IconButton>
              )}
              
              <Button 
                variant="contained" 
                onClick={handleNext}
                endIcon={isLastStep ? null : <ChevronRight size={16} />}
                sx={{ 
                  backgroundColor: '#00D4A3', 
                  color: '#051714',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  px: 2.5,
                  py: 0.75,
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: '#00B389' }
                }}
              >
                {isLastStep ? "Complete Tour" : "Next"}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

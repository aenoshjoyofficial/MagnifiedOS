'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Slider, 
  Stack, 
  Button,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack,
  Volume2,
  CheckCircle2
} from 'lucide-react';

interface AudioTaskProps {
  url: string;
  onComplete: () => void;
}

const AudioTask = ({ url, onComplete }: AudioTaskProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  }, [audioRef.current?.readyState]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);
      
      // Auto-complete at 90%
      if (!isCompleted && duration > 0 && (current / duration) >= 0.9) {
        setIsCompleted(true);
        onComplete();
      }
    }
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newValue as number;
      setCurrentTime(newValue as number);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Box sx={{ p: 3, backgroundColor: 'rgba(212, 175, 55, 0.03)', borderRadius: 3, border: '1px solid rgba(212, 175, 55, 0.1)' }}>
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />
      
      <Stack spacing={3}>
        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <IconButton onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10; }} sx={{ color: '#B0B0B0' }}>
            <SkipBack size={24} />
          </IconButton>
          
          <IconButton 
            onClick={togglePlay} 
            sx={{ 
              width: 64, 
              height: 64, 
              backgroundColor: '#D4AF37', 
              color: '#0B0B0F',
              '&:hover': { backgroundColor: '#B8962D' }
            }}
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          </IconButton>

          <IconButton onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10; }} sx={{ color: '#B0B0B0' }}>
            <SkipForward size={24} />
          </IconButton>
        </Box>

        {/* Progress */}
        <Box>
          <Slider
            value={currentTime}
            max={duration}
            onChange={handleSliderChange}
            sx={{
              color: '#D4AF37',
              height: 6,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                '&:before': {
                  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                },
                '&:hover, &.Mui-active': {
                  boxShadow: '0 0 0 8px rgba(212, 175, 55, 0.16)',
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.28,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#B0B0B0', fontWeight: 600 }}>
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#B0B0B0', fontWeight: 600 }}>
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>

        {/* Bottom Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ color: '#B0B0B0', fontWeight: 700 }}>SPEED</Typography>
            <Select
              value={playbackRate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPlaybackRate(val);
                if(audioRef.current) audioRef.current.playbackRate = val;
              }}
              size="small"
              sx={{ 
                height: 32, 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#D4AF37',
                fontWeight: 700,
                fontSize: '0.8rem',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
              }}
            >
              <MenuItem value={1}>1x</MenuItem>
              <MenuItem value={1.5}>1.5x</MenuItem>
              <MenuItem value={2}>2x</MenuItem>
            </Select>
          </Box>

          <Button 
            onClick={() => { setIsCompleted(true); onComplete(); }}
            startIcon={isCompleted ? <CheckCircle2 size={18} /> : null}
            sx={{ 
              color: isCompleted ? '#D4AF37' : '#B0B0B0',
              fontWeight: 700,
              fontSize: '0.8rem',
              '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.05)' }
            }}
          >
            {isCompleted ? 'COMPLETED' : 'MARK COMPLETE'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default AudioTask;

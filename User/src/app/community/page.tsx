'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Avatar,
  Stack,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  Users, 
  MessageSquare, 
  Heart 
} from 'lucide-react';
import { useCommunity } from '@/lib/queries';

const Community = () => {
  const { data: members, isLoading } = useCommunity();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            mb: 0.5,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
            fontFamily: '"Playfair Display", serif'
          }}
        >
          The Collective
        </Typography>
        <Typography variant="body1" sx={{ color: '#B0B0B0', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Connect with fellow explorers on the path of expansion.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {members?.map((member) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={member.id}>
            <Paper 
              sx={{ 
                p: { xs: 3, sm: 4 }, 
                position: 'relative', 
                overflow: 'hidden', 
                backgroundColor: 'rgba(7, 24, 21, 0.35)', 
                border: '1px solid rgba(0, 212, 163, 0.15)', 
                borderRadius: '24px',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                '&:hover': { 
                  borderColor: 'rgba(0, 212, 163, 0.45)', 
                  backgroundColor: 'rgba(7, 24, 21, 0.45)',
                  boxShadow: '0 8px 30px rgba(0, 212, 163, 0.15)',
                  transform: 'translateY(-4px)'
                } 
              }}
            >
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar 
                  src={member.avatar_url} 
                  sx={{ width: 80, height: 80, bgcolor: '#D4AF37', color: '#0B0B0F', fontSize: '1.5rem', fontWeight: 850, border: '2px solid rgba(212, 175, 55, 0.3)' }}
                >
                  {member.full_name?.[0]}
                </Avatar>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{member.full_name || 'Anonymous Member'}</Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Joined {new Date(member.created_at).toLocaleDateString()}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    icon={<Heart size={14} />} 
                    label="Active" 
                    size="small" 
                    sx={{ backgroundColor: 'rgba(0, 212, 163, 0.1)', color: '#00D4A3', fontWeight: 700 }} 
                  />
                  <Chip 
                    icon={<MessageSquare size={14} />} 
                    label="Connect" 
                    size="small" 
                    clickable
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#EAEAEA' }} 
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {members?.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Users size={48} color="#666" style={{ marginBottom: 16 }} />
          <Typography variant="h6" sx={{ color: '#B0B0B0' }}>You are the first pioneer in this collective.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default Community;

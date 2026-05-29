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
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>The Collective</Typography>
        <Typography variant="body1" sx={{ color: '#B0B0B0' }}>Connect with fellow explorers on the path of expansion.</Typography>
      </Box>

      <Grid container spacing={3}>
        {members?.map((member) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={member.id}>
            <Paper sx={{ p: 3, position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', transition: 'all 0.3s ease', '&:hover': { borderColor: 'rgba(212, 175, 55, 0.3)', backgroundColor: 'rgba(212, 175, 55, 0.02)' } }}>
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar 
                  src={member.avatar_url} 
                  sx={{ width: 80, height: 80, bgcolor: '#D4AF37', color: '#0B0B0F', fontSize: '1.5rem', fontWeight: 800 }}
                >
                  {member.full_name?.[0]}
                </Avatar>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{member.full_name || 'Anonymous Member'}</Typography>
                  <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Joined {new Date(member.created_at).toLocaleDateString()}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    icon={<Heart size={14} />} 
                    label="Active" 
                    size="small" 
                    sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', fontWeight: 700 }} 
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

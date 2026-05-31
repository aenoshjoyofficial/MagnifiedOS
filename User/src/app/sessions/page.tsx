'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button,
  Stack,
  Avatar,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Calendar, 
  Video, 
  Users, 
  Clock,
  ExternalLink,
  CheckCircle2,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSessions, useCreateBooking } from '@/lib/queries';
import { useAuthStore } from '@/store/useStore';

const Sessions = () => {
  const { user } = useAuthStore();
  const { data: sessions, isLoading } = useSessions();
  const createBookingMutation = useCreateBooking();
  const [waitlisted, setWaitlisted] = useState<string[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Booking State
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Date, 2: Time

  const upcomingSessions = sessions?.filter((s: any) => new Date(s.start_time) > new Date()) || [];

  const handleJoinWaitlist = (id: string) => {
    if (waitlisted.includes(id)) return;
    setWaitlisted([...waitlisted, id]);
    setSuccessMsg('You have been successfully added to the waitlist!');
  };

  const handleBookSession = async () => {
    if (!user) {
      setSuccessMsg('❌ Please log in to book a mentorship session.');
      return;
    }
    if (!selectedDate || !selectedTime) return;
    
    try {
      // Create a date object for May 2026
      const bookingDate = new Date(2026, 4, selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes));

      await createBookingMutation.mutateAsync({
        user_id: user?.id,
        mentor_name: 'Dr. Aris Thorne',
        start_time: bookingDate.toISOString(),
        duration_minutes: 45,
        session_type: 'Mentorship Assessment'
      });

      setCalendarOpen(false);
      setBookingStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setSuccessMsg('✨ Mentorship Confirmed! Your private session has been scheduled successfully.');
    } catch (err: any) {
      console.error(err);
      setSuccessMsg(`❌ Booking Failed: ${err.message || 'Please check your connection and RLS policies.'}`);
    }
  };

  const handleScheduleSubmit = () => {
    setBookingOpen(false);
    setSuccessMsg('Mentorship assessment scheduled! Check your email for details.');
  };

  return (
    <Box>
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        gap: 2 
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              mb: 0.5,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              fontFamily: '"Playfair Display", serif'
            }}
          >
            Collective Sessions
          </Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Synchronous expansion with the Existence community.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Upcoming Live Events</Typography>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#D4AF37' }} /></Box>
          ) : (
            <Stack spacing={3}>
              {upcomingSessions.map((session: any) => (
                <Paper key={session.id} sx={{ p: { xs: 2.5, sm: 3.5 }, backgroundColor: 'rgba(7, 24, 21, 0.35)', border: '1px solid rgba(0, 212, 163, 0.15)', borderRadius: '24px', backdropFilter: 'blur(16px)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(0, 212, 163, 0.45)', boxShadow: '0 8px 30px rgba(0, 212, 163, 0.15)' } }}>
                  <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 'auto' }}>
                      <Avatar 
                        src={session.host_avatar_url} 
                        sx={{ width: 80, height: 80, borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.1)' }}
                      >
                        {session.host_name[0]}
                      </Avatar>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={session.session_type} 
                            size="small" 
                            sx={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', fontWeight: 700, fontSize: '0.65rem' }} 
                          />
                          <Chip 
                            label={`${session.attendees || 0} registered`} 
                            size="small" 
                            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#B0B0B0', fontWeight: 700, fontSize: '0.65rem' }} 
                          />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{session.title}</Typography>
                        <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Hosted by {session.host_name}</Typography>
                        <Stack direction="row" spacing={3} sx={{ pt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Clock size={16} color="#D4AF37" />
                            <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
                              {new Date(session.start_time).toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })} ({session.duration_minutes} min)
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 'auto' }}>
                      <Button 
                        variant={waitlisted.includes(session.id) ? "outlined" : "contained"}
                        onClick={() => handleJoinWaitlist(session.id)}
                        startIcon={waitlisted.includes(session.id) ? <CheckCircle2 size={16} /> : null}
                        sx={{ 
                          width: { xs: '100%', sm: 'auto' },
                          borderColor: waitlisted.includes(session.id) ? '#D4AF37' : 'transparent',
                          color: waitlisted.includes(session.id) ? '#D4AF37' : '#040D0C',
                          fontWeight: 800,
                          borderRadius: '20px',
                          textTransform: 'none',
                          background: waitlisted.includes(session.id) ? 'transparent' : 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
                          boxShadow: waitlisted.includes(session.id) ? 'none' : '0 4px 12px rgba(0, 212, 163, 0.2)',
                          '&:hover': { 
                            borderColor: waitlisted.includes(session.id) ? '#F0D27A' : 'transparent',
                            background: waitlisted.includes(session.id) ? 'rgba(212, 175, 55, 0.05)' : 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
                            boxShadow: waitlisted.includes(session.id) ? 'none' : '0 6px 16px rgba(0, 212, 163, 0.4)',
                            transform: 'translateY(-1px)'
                          },
                          '&.Mui-disabled': {
                            color: '#D4AF37',
                            borderColor: '#D4AF37',
                          }
                        }}
                      >
                        {waitlisted.includes(session.id) ? 'Waitlisted' : 'Join Session'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              {upcomingSessions.length === 0 && (
                <Box sx={{ py: 8, textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2 }}>
                  <Typography sx={{ color: '#666' }}>No upcoming collective sessions at this time.</Typography>
                </Box>
              )}
            </Stack>
          )}
        </Grid>
 
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 3, sm: 4.5 }, height: '100%', backgroundColor: 'rgba(7, 24, 21, 0.35)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '24px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.04) 0%, transparent 100%)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>One-on-One Mentorship</Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 4 }}>
              Accelerate your evolution with a private session. Our elite mentors specialize in neuro-architecting and high-performance states.
            </Typography>
            <Stack spacing={2}>
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                startIcon={<CalendarDays size={18} />}
                onClick={() => setCalendarOpen(true)}
                sx={{ 
                  py: 1.75, 
                  fontWeight: 800,
                  borderRadius: '30px'
                }}
              >
                View Availability
              </Button>
              <Button fullWidth variant="text" endIcon={<ExternalLink size={14} />} sx={{ color: '#D4AF37' }}>Meet our Mentors</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Schedule Dialog */}
      <Dialog 
        open={bookingOpen} 
        onClose={() => setBookingOpen(false)}
        slotProps={{ 
          paper: { 
            sx: { backgroundColor: '#040D0C', border: '1px solid rgba(0, 212, 163, 0.2)', borderRadius: '24px', minWidth: { xs: '90%', sm: 400 }, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)' } 
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#D4AF37', fontFamily: '"Playfair Display", serif' }}>Schedule Assessment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField select fullWidth label="Select Mentor" defaultValue="aris" variant="filled">
              <MenuItem value="aris">Dr. Aris Thorne (Neural integration)</MenuItem>
              <MenuItem value="marcus">Marcus Vane (Breathwork)</MenuItem>
              <MenuItem value="sarah">Sarah Jenkins (Mindset)</MenuItem>
            </TextField>
            <TextField select fullWidth label="Timezone" defaultValue="utc" variant="filled">
              <MenuItem value="utc">UTC (Universal Time)</MenuItem>
              <MenuItem value="est">EST (Eastern Time)</MenuItem>
              <MenuItem value="pst">PST (Pacific Time)</MenuItem>
            </TextField>
            <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
              Your current program level qualifies you for one private assessment per module.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setBookingOpen(false)} sx={{ color: '#B0B0B0', fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleScheduleSubmit}
            sx={{ 
              background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
              color: '#040D0C',
              fontWeight: 800,
              borderRadius: '30px',
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
              }
            }}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Calendar Dialog */}
      <Dialog 
        open={calendarOpen} 
        onClose={() => setCalendarOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{ 
          paper: { 
            sx: { backgroundColor: '#040D0C', border: '1px solid rgba(0, 212, 163, 0.2)', borderRadius: '24px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)' } 
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarDays size={24} color="#D4AF37" />
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif' }}>
                {bookingStep === 1 ? 'Select Date - May 2026' : `Select Time - May ${selectedDate}, 2026`}
              </Typography>
            </Box>
            {bookingStep === 2 && (
              <Button size="small" onClick={() => setBookingStep(1)} sx={{ color: '#D4AF37', fontWeight: 700 }}>Back to Calendar</Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 400 }}>
          {bookingStep === 1 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <Box key={day} sx={{ p: { xs: 0.5, sm: 1.5 }, textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#888', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{day}</Typography>
                </Box>
              ))}
              {[...Array(31)].map((_, i) => {
                const day = i + 1;
                const daySessions = sessions?.filter((s: any) => new Date(s.start_time).getDate() === day);
                const isBusy = daySessions && daySessions.length > 0;
                const isSelected = selectedDate === day;

                return (
                  <Box 
                    key={i} 
                    onClick={() => {
                      setSelectedDate(day);
                      setBookingStep(2);
                    }}
                    sx={{ 
                      minHeight: { xs: 50, sm: 100 }, 
                      p: { xs: 0.5, sm: 1 }, 
                      borderRight: '1px solid rgba(255, 255, 255, 0.05)', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.1)' : (isBusy ? 'rgba(255, 255, 255, 0.02)' : 'transparent'),
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)' }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isSelected ? '#D4AF37' : '#B0B0B0', 
                        fontWeight: isSelected || isBusy ? 800 : 400,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {day}
                    </Typography>
                    {isBusy && (
                      <Stack spacing={0.5} sx={{ mt: 0.5, alignItems: 'center' }}>
                        {daySessions.map((s: any) => (
                          <Tooltip key={s.id} title={`${s.session_type}: ${s.title}`}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mt: 0.5 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef5350' }} />
                              </Box>
                              <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%' }}>
                                <Chip 
                                  label="BUSY" 
                                  size="small" 
                                  sx={{ height: 16, fontSize: '0.5rem', backgroundColor: 'rgba(239, 83, 80, 0.1)', color: '#ef5350', fontWeight: 900, border: '1px solid rgba(239, 83, 80, 0.2)' }} 
                                />
                              </Box>
                            </Box>
                          </Tooltip>
                        ))}
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ p: 4 }}>
              <Typography variant="subtitle2" sx={{ color: '#B0B0B0', mb: 3 }}>Available slots for your private assessment:</Typography>
              <Grid container spacing={2}>
                {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map((time) => {
                  // Check if this time slot is busy
                  const isSlotBusy = sessions?.some((s: any) => {
                    const sTime = new Date(s.start_time);
                    return sTime.getDate() === selectedDate && sTime.getHours() === parseInt(time.split(':')[0]);
                  });

                  return (
                    <Grid key={time} size={{ xs: 6, sm: 4 }}>
                      <Button
                        fullWidth
                        disabled={isSlotBusy}
                        variant={selectedTime === time ? "contained" : "outlined"}
                        onClick={() => setSelectedTime(time)}
                        sx={{ 
                          py: 2, 
                          borderRadius: '12px',
                          borderColor: isSlotBusy ? 'rgba(255, 255, 255, 0.05)' : (selectedTime === time ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)'),
                          backgroundColor: selectedTime === time ? '#D4AF37' : 'transparent',
                          color: isSlotBusy ? '#333' : (selectedTime === time ? '#0B0B0F' : '#EAEAEA'),
                          textDecoration: isSlotBusy ? 'line-through' : 'none',
                          '&:hover': {
                            borderColor: isSlotBusy ? 'rgba(255, 255, 255, 0.05)' : '#D4AF37',
                            backgroundColor: selectedTime === time ? '#D4AF37' : 'rgba(212, 175, 55, 0.05)'
                          }
                        }}
                      >
                        {time} {isSlotBusy && '(Busy)'}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
              <Box sx={{ mt: 6, p: 3, borderRadius: '16px', backgroundColor: 'rgba(212, 175, 55, 0.04)', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 700, mb: 0.5, fontFamily: '"Outfit", sans-serif' }}>Mentorship Note:</Typography>
                <Typography variant="caption" sx={{ color: '#B0B0B0', lineHeight: 1.5 }}>
                  Private assessments are 45 minutes long and focus on your specific neural architecture progress. Please ensure you have completed the prerequisite tasks for this module.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Button onClick={() => { setCalendarOpen(false); setBookingStep(1); }} sx={{ color: '#B0B0B0', fontWeight: 700 }}>Cancel</Button>
          {bookingStep === 2 && (
            <Button 
              variant="contained" 
              onClick={handleBookSession}
              disabled={!selectedTime || createBookingMutation.isPending}
              sx={{ 
                background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
                color: '#040D0C',
                fontWeight: 800,
                borderRadius: '30px',
                px: 3.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
                }
              }}
            >
              {createBookingMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg('')}>
        <Alert 
          onClose={() => setSuccessMsg('')} 
          severity={successMsg.includes('❌') ? 'error' : 'success'} 
          sx={{ 
            width: '100%', 
            backgroundColor: successMsg.includes('❌') ? '#ef5350' : '#D4AF37', 
            color: '#040D0C',
            fontWeight: 800,
            borderRadius: '16px'
          }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Sessions;

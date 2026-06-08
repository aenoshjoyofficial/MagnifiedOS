import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Divider,
  Badge,
  useTheme,
  Button,
  useMediaQuery
} from '@mui/material';
import { 
  Bell, 
  Settings, 
  User, 
  LogOut,
  ChevronDown,
  Menu as MenuIcon
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useUIStore } from '@/store/useStore';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/queries';

const Topbar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toggleSidebar } = useUIStore();
  const { user, signOut } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notiAnchorEl, setNotiAnchorEl] = useState<null | HTMLElement>(null);
  const [profile, setProfile] = useState<any>(null);

  const targetUserId = profile?.id || user?.id || '';
  const { data: notifications = [] } = useNotifications(targetUserId);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleLogout = async () => {
    handleClose();
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  return (
    <Box
      sx={{
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, md: 4 },
        backgroundColor: 'rgba(4, 13, 12, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 212, 163, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {isMobile && (
          <IconButton onClick={toggleSidebar} sx={{ color: '#D4AF37', p: 0.5 }}>
            <MenuIcon size={24} />
          </IconButton>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#EAEAEA', fontSize: { xs: '1.05rem', sm: '1.25rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getPageTitle()}
          </Typography>
          <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 500, letterSpacing: 0.5, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
            INNER RESET PROGRAM
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
        <IconButton 
          onClick={(e) => setNotiAnchorEl(e.currentTarget)} 
          sx={{ color: '#B0B0B0', '&:hover': { color: '#D4AF37' } }}
        >
          <Badge 
            badgeContent={notifications.filter((n: any) => !n.is_read).length} 
            color="primary" 
            sx={{ '& .MuiBadge-badge': { backgroundColor: '#D4AF37', color: '#0B0B0F' } }}
          >
            <Bell size={20} />
          </Badge>
        </IconButton>

        <Menu
          anchorEl={notiAnchorEl}
          open={Boolean(notiAnchorEl)}
          onClose={() => setNotiAnchorEl(null)}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                width: { xs: 280, sm: 320 },
                maxHeight: 480,
                backgroundColor: '#121217',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                display: 'flex',
                flexDirection: 'column',
              }
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="subtitle1" sx={{ color: '#EAEAEA', fontWeight: 800 }}>
              Notifications
            </Typography>
            {notifications.some((n: any) => !n.is_read) && (
              <Button 
                size="small" 
                onClick={async () => {
                  if (targetUserId) {
                    await markAllReadMutation.mutateAsync(targetUserId);
                  }
                }}
                sx={{ 
                  color: '#D4AF37', 
                  fontSize: '0.75rem', 
                  fontWeight: 700,
                  textTransform: 'none',
                  p: 0,
                  minWidth: 0,
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Mark all as read
              </Button>
            )}
          </Box>
          <Box sx={{ overflowY: 'auto', flex: 1, py: 1 }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              notifications.map((n: any) => (
                <MenuItem 
                  key={n.id}
                  onClick={async () => {
                    if (!n.is_read && targetUserId) {
                      await markReadMutation.mutateAsync({ userId: targetUserId, notificationId: n.id });
                    }
                  }}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    gap: 0.5,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                    backgroundColor: n.is_read ? 'transparent' : 'rgba(212, 175, 55, 0.03)',
                    '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.05)' },
                    whiteSpace: 'normal'
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: n.is_read ? '#B0B0B0' : '#EAEAEA', fontWeight: n.is_read ? 500 : 700, fontSize: '0.85rem' }}>
                      {n.title}
                    </Typography>
                    {!n.is_read && (
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D4AF37', mt: 0.5, flexShrink: 0 }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5, whiteSpace: 'normal', lineHeight: 1.3, textAlign: 'left' }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#555', fontSize: '0.7rem' }}>
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                  </Typography>
                </MenuItem>
              ))
            )}
          </Box>
        </Menu>

        <Box 
          onClick={handleMenu}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            cursor: 'pointer',
            p: 0.5,
            pr: 1,
            borderRadius: 10,
            transition: 'background 0.2s',
            '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.05)' }
          }}
        >
          <Avatar 
            src={profile?.avatar_url}
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: '#D4AF37',
              color: '#0B0B0F',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: '2px solid rgba(212, 175, 55, 0.2)',
              '& img': {
                objectFit: 'cover',
                objectPosition: 'center 20%'
              }
            }}
          >
            {profile?.full_name?.[0] || 'A'}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="subtitle2" sx={{ color: '#EAEAEA', lineHeight: 1, fontWeight: 600 }}>
              {profile?.full_name || 'Aenosh Joy'}
            </Typography>
          </Box>
          <ChevronDown size={16} color="#B0B0B0" />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                backgroundColor: '#121217',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                '& .MuiMenuItem-root': {
                  py: 1.5,
                  px: 2,
                  fontSize: '0.9rem',
                  color: '#EAEAEA',
                  '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.05)' }
                }
              }
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem component={Link} to="/profile" onClick={handleClose}>
            <ListItemIcon sx={{ color: '#B0B0B0', minWidth: 35 }}>
              <User size={18} />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem component={Link} to="/settings" onClick={handleClose}>
            <ListItemIcon sx={{ color: '#B0B0B0', minWidth: 35 }}>
              <Settings size={18} />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider sx={{ my: 1, opacity: 0.1, backgroundColor: '#D4AF37' }} />
          <MenuItem onClick={handleLogout} sx={{ color: '#FF4B4B !important' }}>
            <ListItemIcon sx={{ color: '#FF4B4B', minWidth: 35 }}>
              <LogOut size={18} />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;

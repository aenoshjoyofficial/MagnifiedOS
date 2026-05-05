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
  useTheme
} from '@mui/material';
import { 
  Bell, 
  Settings, 
  User, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useStore';

const Topbar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const theme = useTheme();
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profile, setProfile] = useState<any>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const email = user?.email || 'aenoshjoy@gmail.com';
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (data) setProfile(data);
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
        px: 4,
        backgroundColor: 'rgba(11, 11, 15, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#EAEAEA', fontSize: '1.25rem' }}>
          {getPageTitle()}
        </Typography>
        <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 500, letterSpacing: 0.5 }}>
          INNER RESET PROGRAM
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton sx={{ color: '#B0B0B0', '&:hover': { color: '#D4AF37' } }}>
          <Badge badgeContent={3} color="primary" sx={{ '& .MuiBadge-badge': { backgroundColor: '#D4AF37', color: '#0B0B0F' } }}>
            <Bell size={20} />
          </Badge>
        </IconButton>

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
              border: '2px solid rgba(212, 175, 55, 0.2)'
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
          <MenuItem onClick={handleClose} sx={{ color: '#FF4B4B !important' }}>
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

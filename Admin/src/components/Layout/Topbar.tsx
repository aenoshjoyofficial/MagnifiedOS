'use client';

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
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/useStore';

const Topbar = () => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toggleSidebar } = useUIStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getPageTitle = () => {
    const segments = pathname.split('/');
    const path = segments[segments.length - 1];
    if (!path || path === 'admin') return 'Admin Dashboard';
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
        backgroundColor: 'rgba(11, 11, 15, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
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
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#EAEAEA', fontSize: '1.25rem' }}>
            {getPageTitle()}
          </Typography>
          <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 500, letterSpacing: 0.5 }}>
            MAGNIFIED ADMIN SYSTEM
          </Typography>
        </Box>
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
            AD
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="subtitle2" sx={{ color: '#EAEAEA', lineHeight: 1, fontWeight: 600 }}>
              Admin User
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
          <MenuItem onClick={handleClose}>
            <ListItemIcon sx={{ color: '#B0B0B0', minWidth: 35 }}>
              <User size={18} />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleClose}>
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

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  LayoutDashboard, 
  Users,
  PlusCircle,
  Calendar,
  CheckSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  Waves,
  Compass,
  Grid as GridIcon,
  Utensils,
  Moon,
  Wind,
  Award
} from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/useStore';

const navItems = [
  { label: 'Admin Home', path: '/admin', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Program Builder', path: '/admin/program-builder', icon: PlusCircle },
  { label: 'Collective Sessions', path: '/admin/sessions', icon: Calendar },
  { label: 'Member Bookings', path: '/admin/bookings', icon: CheckSquare },
];

const chamberItems = [
  { label: 'Mental Clarity', path: '/admin/chambers/mental-clarity', icon: Brain },
  { label: 'The Frequency Field', path: '/admin/chambers/frequency-field', icon: Waves },
  { label: 'Field Design', path: '/admin/chambers/field-design', icon: Compass },
  { label: 'The Living Frame', path: '/admin/chambers/living-frame', icon: GridIcon },
  { label: 'The Plate', path: '/admin/chambers/the-plate', icon: Utensils },
  { label: 'Breath Atelier', path: '/admin/chambers/breath-atelier', icon: Wind },
  { label: 'The Signature', path: '/admin/chambers/the-signature', icon: Award },
  { label: 'Sleep Cocoon', path: '/admin/chambers/sleep-cocoon', icon: Moon },
];

const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { signOut } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerWidth = isSidebarOpen ? 260 : 80;

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? isSidebarOpen : undefined}
      onClose={isMobile ? toggleSidebar : undefined}
      sx={{
        width: isMobile ? 0 : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? 260 : drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#0B0B0F',
          borderRight: '1px solid rgba(212, 175, 55, 0.1)',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: (isSidebarOpen || isMobile) ? 'space-between' : 'center', minHeight: '80px' }}>
        {(isSidebarOpen || isMobile) ? (
          <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo.png" 
              alt="Magnified Existence Logo" 
              style={{ 
                width: '32px', 
                height: '32px', 
                objectFit: 'contain',
                borderRadius: '50%',
                border: '1.5px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)'
              }} 
            />
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#D4AF37', letterSpacing: '0.05em', fontSize: '1rem', fontFamily: '"Outfit", sans-serif' }}>
              MAGNIFIED ADMIN
            </Typography>
          </Link>
        ) : (
          <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/logo.png" 
              alt="Magnified Existence Logo" 
              style={{ 
                width: '34px', 
                height: '34px', 
                objectFit: 'contain',
                borderRadius: '50%',
                border: '1.5px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)'
              }} 
            />
          </Link>
        )}
        {(isSidebarOpen || isMobile) && (
          <IconButton onClick={toggleSidebar} size="small" sx={{ color: '#D4AF37' }}>
            {isMobile ? (
              <ChevronLeft size={20} />
            ) : (
              isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />
            )}
          </IconButton>
        )}
      </Box>

      <List sx={{ px: 1.5 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <ListItem key={item.path} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <Tooltip title={!isSidebarOpen ? item.label : ''} placement="right">
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: isSidebarOpen ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    color: isActive ? '#D4AF37' : '#EAEAEA',
                    '&:hover': {
                      backgroundColor: 'rgba(212, 175, 55, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isSidebarOpen ? 2 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? '#D4AF37' : 'inherit',
                    }}
                  >
                    <Icon size={22} />
                  </ListItemIcon>
                  {isSidebarOpen && (
                    <ListItemText 
                      primary={item.label} 
                      slotProps={{
                        primary: { 
                          sx: {
                            fontWeight: isActive ? 600 : 400,
                            fontSize: '0.95rem'
                          }
                        }
                      }} 
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 1.5, opacity: 0.05, backgroundColor: 'rgba(212, 175, 55, 0.2)' }} />

      {isSidebarOpen && (
        <Typography 
          variant="caption" 
          sx={{ 
            px: 3, 
            pt: 1, 
            pb: 1, 
            display: 'block', 
            color: 'rgba(212, 175, 55, 0.4)', 
            fontWeight: 800, 
            letterSpacing: 1.5, 
            textTransform: 'uppercase' 
          }}
        >
          Chambers
        </Typography>
      )}

      <List sx={{ px: 1.5 }}>
        {chamberItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <ListItem key={item.path} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <Tooltip title={!isSidebarOpen ? item.label : ''} placement="right">
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 40,
                    justifyContent: isSidebarOpen ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    color: isActive ? '#D4AF37' : '#B0B0B0',
                    '&:hover': {
                      backgroundColor: 'rgba(212, 175, 55, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isSidebarOpen ? 2 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? '#D4AF37' : 'inherit',
                    }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  {isSidebarOpen && (
                    <ListItemText 
                      primary={item.label} 
                      slotProps={{
                        primary: { 
                          sx: {
                            fontWeight: isActive ? 600 : 400,
                            fontSize: '0.85rem'
                          }
                        }
                      }} 
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', mb: 2, px: 1.5 }}>
        <Divider sx={{ mb: 2, opacity: 0.1, backgroundColor: '#D4AF37' }} />
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => signOut()}
            sx={{
              minHeight: 48,
              justifyContent: isSidebarOpen ? 'initial' : 'center',
              px: 2.5,
              borderRadius: 2,
              color: '#B0B0B0',
              '&:hover': {
                color: '#FF4B4B',
                backgroundColor: 'rgba(255, 75, 75, 0.05)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: isSidebarOpen ? 2 : 'auto',
                justifyContent: 'center',
                color: 'inherit',
              }}
            >
              <LogOut size={22} />
            </ListItemIcon>
            {isSidebarOpen && <ListItemText primary="Logout" />}
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

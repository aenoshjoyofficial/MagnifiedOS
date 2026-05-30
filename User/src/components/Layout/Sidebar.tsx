import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  BookOpen, 
  Star, 
  LineChart, 
  Calendar, 
  User, 
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/useStore';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Program', path: '/program', icon: BookOpen },
  { label: "Today's Practice", path: '/today', icon: Star, highlight: true },
  { label: 'Progress', path: '/progress', icon: LineChart },
  { label: 'Sessions', path: '/sessions', icon: Calendar },
  { label: 'Community', path: '/community', icon: Users },
];

const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { signOut } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

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
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: (isSidebarOpen || isMobile) ? 'space-between' : 'center' }}>
        {(isSidebarOpen || isMobile) && (
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#D4AF37', letterSpacing: -0.5 }}>
              MAGNIFIED
            </Typography>
          </Link>
        )}
        <IconButton onClick={toggleSidebar} size="small" sx={{ color: '#D4AF37' }}>
          {isMobile ? (
            <ChevronLeft size={20} />
          ) : (
            isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />
          )}
        </IconButton>
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
                    border: item.highlight && isActive ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isSidebarOpen ? 2 : 'auto',
                      justifyContent: 'center',
                      color: isActive || item.highlight ? '#D4AF37' : 'inherit',
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
                  {item.highlight && isSidebarOpen && !isActive && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#D4AF37' }} />
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
            onClick={handleLogout}
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

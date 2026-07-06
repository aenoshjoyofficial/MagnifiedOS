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
  useMediaQuery,
  Switch
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
import { useChambers } from '@/lib/queries';
import * as LucideIcons from 'lucide-react';

const getChamberIconComponent = (iconName: string | undefined) => {
  if (!iconName) return LucideIcons.Brain;
  const IconComp = (LucideIcons as any)[iconName];
  return IconComp || LucideIcons.Brain;
};

const navItems = [
  { label: 'Admin Home', path: '/admin', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: Users },
  { label: 'Program Builder', path: '/admin/program-builder', icon: PlusCircle },
  { label: 'Collective Sessions', path: '/admin/sessions', icon: Calendar },
  { label: 'Member Bookings', path: '/admin/bookings', icon: CheckSquare },
];



const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { signOut } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: chambers } = useChambers();
  const [showHidden, setShowHidden] = React.useState(() => localStorage.getItem('show_hidden_chambers') === 'true');

  const handleToggleHidden = () => {
    setShowHidden(prev => {
      const newVal = !prev;
      localStorage.setItem('show_hidden_chambers', String(newVal));
      return newVal;
    });
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
              MAGNIFIED EXISTENCE ADMIN
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

      {isSidebarOpen ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 1, pb: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(212, 175, 55, 0.4)', 
              fontWeight: 800, 
              letterSpacing: 1.5, 
              textTransform: 'uppercase' 
            }}
          >
            Chambers
          </Typography>
          <Tooltip title="Show/Hide hidden chambers in sidebar" placement="top">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>Show Hidden</Typography>
              <Switch 
                size="small" 
                checked={showHidden} 
                onChange={handleToggleHidden} 
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#D4AF37' }
                }}
              />
            </Box>
          </Tooltip>
        </Box>
      ) : null}

      <List sx={{ px: 1.5 }}>
        {(chambers || []).filter(c => c.visible || showHidden).map((chamber) => {
          const path = `/admin/chambers/${chamber.slug}`;
          const isActive = pathname === path;
          const Icon = getChamberIconComponent(chamber.icon);

          return (
            <ListItem key={chamber.id} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <Tooltip title={!isSidebarOpen ? chamber.title : ''} placement="right">
                <ListItemButton
                  component={Link}
                  to={path}
                  sx={{
                    minHeight: 40,
                    justifyContent: isSidebarOpen ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    color: isActive ? '#D4AF37' : '#B0B0B0',
                    opacity: chamber.visible ? 1 : 0.5,
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
                      primary={chamber.title} 
                      secondary={!chamber.visible ? "Hidden" : undefined}
                      slotProps={{
                        primary: { 
                          sx: {
                            fontWeight: isActive ? 600 : 400,
                            fontSize: '0.85rem'
                          }
                        },
                        secondary: {
                          sx: {
                            fontSize: '0.7rem',
                            color: 'rgba(212, 175, 55, 0.5)'
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

        <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
          <Tooltip title={!isSidebarOpen ? "Configure Chambers" : ''} placement="right">
            <ListItemButton
              component={Link}
              to="/admin/chambers"
              sx={{
                minHeight: 40,
                justifyContent: isSidebarOpen ? 'initial' : 'center',
                px: 2.5,
                borderRadius: 2,
                backgroundColor: pathname === '/admin/chambers' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                color: pathname === '/admin/chambers' ? '#D4AF37' : '#B0B0B0',
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
                  color: pathname === '/admin/chambers' ? '#D4AF37' : 'inherit',
                }}
              >
                <LucideIcons.Settings size={20} />
              </ListItemIcon>
              {isSidebarOpen && (
                <ListItemText 
                  primary="Configure Chambers" 
                  slotProps={{
                    primary: { 
                      sx: {
                        fontWeight: pathname === '/admin/chambers' ? 600 : 400,
                        fontSize: '0.85rem',
                        fontStyle: 'italic'
                      }
                    }
                  }} 
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
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

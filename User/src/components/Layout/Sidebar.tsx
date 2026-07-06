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
import { useChambers } from '@/lib/queries';
import { useProgramEngine } from '@/lib/programEngine';
import * as LucideIcons from 'lucide-react';

const getChamberIconComponent = (iconName: string | undefined) => {
  if (!iconName) return LucideIcons.Brain;
  const IconComp = (LucideIcons as any)[iconName];
  return IconComp || LucideIcons.Brain;
};

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Program', path: '/program', icon: BookOpen },
  { label: "Today's Practice", path: '/today', icon: Star, highlight: true },
  { label: 'Progress', path: '/progress', icon: LineChart },
  { label: 'Sessions', path: '/sessions', icon: Calendar },
];

const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { signOut } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: chambers } = useChambers();
  const { user } = useAuthStore();
  const engine = useProgramEngine(user?.id || '');
  const activeChambers = engine.getVisibleChambers();

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
          backgroundColor: 'rgba(5, 23, 20, 0.65)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 212, 163, 0.15)',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: (isSidebarOpen || isMobile) ? 'space-between' : 'center', minHeight: '80px' }}>
        {(isSidebarOpen || isMobile) ? (
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              MAGNIFIED EXISTENCE
            </Typography>
          </Link>
        ) : (
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
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
                  id={`tour-${item.label.toLowerCase().replace("'", "").replace(" ", "-")}`}
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: isSidebarOpen ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    backgroundColor: isActive ? 'rgba(0, 212, 163, 0.08)' : 'transparent',
                    color: isActive ? '#00D4A3' : '#EAEAEA',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 212, 163, 0.04)',
                    },
                    border: item.highlight && isActive ? '1px solid rgba(0, 212, 163, 0.25)' : 'none',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isSidebarOpen ? 2 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? '#00D4A3' : item.highlight ? '#D4AF37' : 'inherit',
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

      {activeChambers.length > 0 && (
        <>
          <Divider sx={{ my: 1.5, opacity: 0.1, backgroundColor: '#00D4A3' }} />
          {isSidebarOpen && (
            <Typography 
              variant="caption" 
              sx={{ 
                px: 3, 
                pt: 1, 
                pb: 1, 
                display: 'block', 
                color: 'rgba(0, 212, 163, 0.4)', 
                fontWeight: 850, 
                letterSpacing: 1.5, 
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                fontFamily: '"Outfit", sans-serif'
              }}
            >
              Chambers
            </Typography>
          )}

          <List sx={{ px: 1.5 }}>
            {activeChambers.map((chamber) => {
              const path = `/program?chamber=${chamber.slug}`;
              const isActive = pathname === '/program' && location.search.includes(chamber.slug);
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
                        backgroundColor: isActive ? 'rgba(0, 212, 163, 0.08)' : 'transparent',
                        color: isActive ? '#00D4A3' : '#B0B0B0',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 212, 163, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: isSidebarOpen ? 2 : 'auto',
                          justifyContent: 'center',
                          color: isActive ? '#00D4A3' : 'inherit',
                        }}
                      >
                        <Icon size={20} />
                      </ListItemIcon>
                      {isSidebarOpen && (
                        <ListItemText 
                          primary={chamber.title} 
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
        </>
      )}

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

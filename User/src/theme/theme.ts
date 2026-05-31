import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    emerald: {
      main: string;
      light: string;
      mid: string;
      dark: string;
      deep: string;
    };
    gold: {
      main: string;
      light: string;
      glow: string;
    };
  }
  interface PaletteOptions {
    emerald?: {
      main?: string;
      light?: string;
      mid?: string;
      dark?: string;
      deep?: string;
    };
    gold?: {
      main?: string;
      light?: string;
      glow?: string;
    };
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D4A3', // Emerald Primary
      light: '#39E7C0', // Emerald Light
      dark: '#05231E', // Emerald Dark
    },
    secondary: {
      main: '#D4AF37', // Gold Primary
      light: '#F0D27A', // Soft Gold
    },
    background: {
      default: '#040D0C', // Deep Emerald Black
      paper: '#071815', // Rich Emerald Night
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
    },
    emerald: {
      main: '#00D4A3',
      light: '#39E7C0',
      mid: '#0B3B32',
      dark: '#05231E',
      deep: '#02120F',
    },
    gold: {
      main: '#D4AF37',
      light: '#F0D27A',
      glow: 'rgba(212, 175, 55, 0.3)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    h5: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    h6: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    body1: {
      letterSpacing: '0.01em',
    },
    body2: {
      letterSpacing: '0.01em',
    },
    button: {
      letterSpacing: '0.02em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30, // Softer pill design
          textTransform: 'none',
          fontWeight: 750,
          padding: '10px 24px',
          transition: 'all 0.3s ease-in-out',
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            background: 'linear-gradient(135deg, #00D4A3 0%, #0B3B32 100%)',
            color: '#040D0C',
            fontWeight: 800,
            boxShadow: '0 4px 15px rgba(0, 212, 163, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #39E7C0 0%, #00D4A3 100%)',
              boxShadow: '0 6px 22px rgba(0, 212, 163, 0.45)',
              transform: 'translateY(-1px)',
            },
          },
        },
        {
          props: { variant: 'contained', color: 'secondary' },
          style: {
            background: 'linear-gradient(135deg, #D4AF37 0%, #F0D27A 100%)',
            color: '#040D0C',
            fontWeight: 800,
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #F0D27A 0%, #D4AF37 100%)',
              boxShadow: '0 6px 22px rgba(212, 175, 55, 0.45)',
              transform: 'translateY(-1px)',
            },
          },
        },
        {
          props: { variant: 'outlined', color: 'primary' },
          style: {
            borderColor: 'rgba(0, 212, 163, 0.4)',
            color: '#00D4A3',
            '&:hover': {
              borderColor: '#00D4A3',
              backgroundColor: 'rgba(0, 212, 163, 0.05)',
            },
          },
        },
        {
          props: { variant: 'outlined', color: 'secondary' },
          style: {
            borderColor: 'rgba(212, 175, 55, 0.4)',
            color: '#D4AF37',
            '&:hover': {
              borderColor: '#D4AF37',
              backgroundColor: 'rgba(212, 175, 55, 0.05)',
            },
          },
        },
      ],
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(7, 24, 21, 0.45)', // Emerald-tinted glassmorphism
          backdropFilter: 'blur(24px)',
          borderRadius: 20,
          border: '1px solid rgba(0, 212, 163, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(5, 35, 30, 0.25)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 212, 163, 0.12)',
          borderRadius: 20,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'rgba(0, 212, 163, 0.4)',
            boxShadow: '0 0 25px rgba(0, 212, 163, 0.15)',
          },
        },
      },
    },
  },
});

export default theme;

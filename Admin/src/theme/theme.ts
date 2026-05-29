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
      main: '#10B981', // Emerald Primary
      light: '#34D399', // Emerald Light
      dark: '#061A14', // Emerald Dark
    },
    secondary: {
      main: '#D4AF37', // Gold Primary
      light: '#F5D76E', // Gold Light
    },
    background: {
      default: '#0B0B0F', // Deep
      paper: '#030712', // Night
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
    },
    emerald: {
      main: '#10B981',
      light: '#34D399',
      mid: '#0B2A22',
      dark: '#061A14',
      deep: '#020C0A',
    },
    gold: {
      main: '#D4AF37',
      light: '#F5D76E',
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
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
            },
          },
        },
      ],
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#030712',
          borderRadius: 16,
          border: '1px solid #0B2A22',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#061A14',
          border: '1px solid #0B2A22',
          '&:hover': {
            borderColor: '#10B981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
          },
        },
      },
    },
  },
});

export default theme;

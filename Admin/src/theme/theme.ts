import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#D4AF37', // Gold Accent
    },
    background: {
      default: '#0B0B0F',
      paper: '#121217',
    },
    text: {
      primary: '#EAEAEA',
      secondary: '#B0B0B0',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#121217',
          borderRadius: 12,
          border: '1px solid rgba(212, 175, 55, 0.1)',
        },
      },
    },
  },
});

export default theme;

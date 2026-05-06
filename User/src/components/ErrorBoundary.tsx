import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#0B0B0F',
            color: '#FFFFFF',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 800 }}>Something went wrong</Typography>
          <Typography variant="body1" sx={{ mb: 4, color: '#B0B0B0', maxWidth: 500 }}>
            We encountered an unexpected error. Please try refreshing the page or contact support if the issue persists.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ 
              backgroundColor: 'var(--emerald-primary)', 
              color: '#0B0B0F',
              fontWeight: 700,
              '&:hover': { backgroundColor: 'var(--emerald-light)' }
            }}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

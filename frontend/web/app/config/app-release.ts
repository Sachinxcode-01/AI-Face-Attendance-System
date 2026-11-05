// Premium Design Tokens for SmartFace Web Portal
// Based on design.md specifications

import { extendTheme } from '@mui/material/styles';

const smartfaceTheme = extendTheme({
  palette: {
    primary: {
      main: '#3D4AB8', // primaryIndigo from design.md
      light: '#6366F1', // primaryBright
      dark: '#3730A3', // primaryDark
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4F46E5', // primary from design.md
      light: '#818CF8', // primaryLight
      dark: '#4338CA', // darker variant
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#E8EAF6', // pageBg light mode
      paper: '#FFFFFF', // cardBg light mode
      surface: '#F8FAFF', // surfaceLight
    },
    text: {
      primary: '#1A1A3A', // textHeading
      secondary: '#3D4260', // textBody
      disabled: '#A0A0B8', // textLabel
      hint: '#C8C8D8', // textPlaceholder
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
    success: {
      main: '#10B981',
    },
  },
  typography: {
    fontFamily: [
      'Poppins', // Display & Headings
      'Inter', // Body, Labels & Forms
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Poppins',
      fontSize: '2.5rem',
      fontWeight: 800,
      letterSpacing: '-0.5px',
      color: '#1A1A3A',
    },
    h2: {
      fontFamily: 'Poppins',
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.2px',
      color: '#1A1A3A',
    },
    h3: {
      fontFamily: 'Poppins',
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#3D4260',
    },
    body1: {
      fontFamily: 'Inter',
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#3D4260',
    },
    body2: {
      fontFamily: 'Inter',
      fontSize: '0.875rem',
      fontWeight: 400,
      color: '#3D4260',
    },
    button: {
      fontFamily: 'Poppins',
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.8px',
    },
  },
  shape: {
    borderRadius: 12, // input radius from design.md
  },
  shadows: {
    // Add custom shadows for cards, buttons, etc.
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    button: '0 4px 6px -1px rgba(37, 99, 235, 0.25), 0 2px 4px -1px rgba(37, 99, 235, 0.15)',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          background: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)',
          boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
          '&:hover': {
            background: 'linear-gradient(90deg, #818CF8 0%, #6366F1 100%)',
            boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.45)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          border: '1px solid #E5E7F0',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#F8FAFF',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4F46E5',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4F46E5',
              borderWidth: 1.5,
            },
          },
        },
      },
    },
  },
});

export default smartfaceTheme;
import { createTheme } from '@mui/material/styles';

// الألوان المستخرجة من ملف الشعار
const brandColors = {
  primary: {
    main: '#115072',
    light: '#1a6e9a',
    dark: '#0d3e5a',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#1d7a85',
    light: '#2a9aa8',
    dark: '#156069',
    contrastText: '#ffffff',
  },
  accent: {
    main: '#ec444c', 
    light: '#ff5f67',
    dark: '#c4343b',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f5f7f9',
    paper: '#ffffff',
    dark: '#f0f2f5',
  },
};

// إنشاء ثيم فاتح
export const lightTheme = createTheme({
  direction: 'ltr',
  palette: {
    mode: 'light',
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    error: {
      main: brandColors.accent.main,
    },
    background: brandColors.background,
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: brandColors.primary.light,
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: brandColors.secondary.light,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

// إنشاء ثيم داكن
export const darkTheme = createTheme({
  direction: 'ltr',
  palette: {
    mode: 'dark',
    primary: {
      main: '#1a6e9a', // نسخة أفتح قليلاً للوضع الداكن
      light: '#247faf',
      dark: '#0d3e5a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2a9aa8',
      light: '#3cbac8',
      dark: '#156069',
      contrastText: '#ffffff',
    },
    error: {
      main: brandColors.accent.light,
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#29b6f6',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// إنشاء ثيم للواجهة العربية
export const lightThemeAr = createTheme({
  ...lightTheme,
  direction: 'rtl',
  typography: {
    ...lightTheme.typography,
    fontFamily: [
      'Noto Sans Arabic',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

export const darkThemeAr = createTheme({
  ...darkTheme,
  direction: 'rtl',
  typography: {
    ...darkTheme.typography,
    fontFamily: [
      'Noto Sans Arabic',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
}); 
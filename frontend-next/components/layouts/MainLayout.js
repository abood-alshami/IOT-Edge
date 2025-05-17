import React from 'react';
import { Box, Container, Toolbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import AppHeader from '../common/AppHeader';

// مكون الحاوية المخصص مع التأثيرات
const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
  transition: 'background-color 0.3s ease',
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.background.default 
    : theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  position: 'relative',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: theme.palette.mode === 'dark'
      ? 'radial-gradient(circle at 10% 10%, rgba(29, 122, 133, 0.05) 0%, transparent 70%)'
      : 'radial-gradient(circle at 10% 10%, rgba(17, 80, 114, 0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  }
}));

const MainLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* الشريط العلوي */}
      <AppHeader />
      
      {/* توفير مساحة للشريط العلوي */}
      <Toolbar />
      
      {/* المحتوى الرئيسي */}
      <StyledContainer maxWidth="xl">
        {children}
      </StyledContainer>
    </Box>
  );
};

export default MainLayout; 
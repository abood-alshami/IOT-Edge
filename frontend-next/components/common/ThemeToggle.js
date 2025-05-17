import React from 'react';
import { IconButton, Tooltip, Box, Menu, MenuItem, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';

// مكون متقدم للأيقونة مع تأثيرات حركية
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.primary.main,
  transition: 'transform 0.3s ease, background-color 0.3s ease',
  padding: theme.spacing(1),
  borderRadius: '50%',
  '&:hover': {
    transform: 'rotate(12deg) scale(1.1)',
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.05)',
  },
}));

const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode, language, changeLanguage } = useTheme();
  const [languageMenu, setLanguageMenu] = React.useState(null);

  const handleLanguageMenuOpen = (event) => {
    setLanguageMenu(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenu(null);
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    handleLanguageMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* زر تبديل الوضع الداكن/الفاتح */}
      <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
        <StyledIconButton onClick={toggleDarkMode} aria-label="toggle theme">
          {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </StyledIconButton>
      </Tooltip>

      {/* زر تغيير اللغة */}
      <Tooltip title="Change Language">
        <StyledIconButton 
          onClick={handleLanguageMenuOpen} 
          aria-label="change language"
          aria-controls="language-menu"
          aria-haspopup="true"
        >
          <LanguageIcon />
        </StyledIconButton>
      </Tooltip>

      {/* قائمة اللغات */}
      <Menu
        id="language-menu"
        anchorEl={languageMenu}
        keepMounted
        open={Boolean(languageMenu)}
        onClose={handleLanguageMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
          sx={{ minWidth: 120 }}
        >
          <Typography variant="body2">English</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('ar')}
          selected={language === 'ar'}
          sx={{ minWidth: 120 }}
        >
          <Typography variant="body2">العربية</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ThemeToggle; 
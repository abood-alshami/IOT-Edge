import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  useMediaQuery,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  Avatar
} from '@mui/material';
import { styled, useTheme as useMuiTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Sensors as SensorsIcon,
  Devices as DevicesIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

// شريط التطبيق المتقدم
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.background.paper 
    : '#ffffff',
  color: theme.palette.mode === 'dark' 
    ? theme.palette.text.primary 
    : theme.palette.primary.main,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.drawer + 1,
}));

// شريط الأدوات المخصص
const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.5rem 1rem',
});

// مكون لشريط التطبيق
const AppHeader = () => {
  const { language, isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // التحقق من حجم الشاشة
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  // إدارة القائمة الجانبية
  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  // عناصر القائمة الجانبية
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Sensors', icon: <SensorsIcon />, path: '/sensors' },
    { text: 'Devices', icon: <DevicesIcon />, path: '/devices' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // محتوى القائمة الجانبية
  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar
          src="/logo-icon.png"
          alt="IOT Edge"
          sx={{ width: 60, height: 60, mb: 1 }}
        />
        <Typography variant="h6" color="primary">IOT-Edge Platform</Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            href={item.path}
            selected={router.pathname === item.path}
            sx={{
              borderRadius: '0 20px 20px 0',
              mr: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: muiTheme.palette.primary.main + '20',
                color: muiTheme.palette.primary.main,
                '& .MuiListItemIcon-root': {
                  color: muiTheme.palette.primary.main,
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <StyledAppBar>
        <Container maxWidth="xl" disableGutters>
          <StyledToolbar>
            {/* زر القائمة (يظهر فقط على الشاشات الصغيرة) */}
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* الشعار */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1
              }}
            >
              <Box sx={{ position: 'relative', width: 120, height: 40 }}>
                <Image
                  src="/logo.svg"
                  alt="IOT Edge"
                  fill
                  sizes="120px"
                  style={{ objectFit: 'contain' }}
                />
              </Box>
            </Box>

            {/* أزرار تبديل الثيم واللغة */}
            <ThemeToggle />
          </StyledToolbar>
        </Container>
      </StyledAppBar>
      
      {/* القائمة الجانبية */}
      <Drawer
        anchor={language === 'ar' ? 'right' : 'left'}
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default AppHeader; 
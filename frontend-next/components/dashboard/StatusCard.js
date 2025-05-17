import React from 'react';
import { Paper, Box, Typography, Avatar } from '@mui/material';

const StatusCard = ({ title, value, icon, color, onClick }) => {
  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        } : {},
      }}
      onClick={onClick}
    >
      <Avatar
        sx={{
          bgcolor: color,
          width: 56,
          height: 56,
          mr: 2,
        }}
      >
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Paper>
  );
};

export default StatusCard; 
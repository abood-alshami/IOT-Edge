import React from 'react';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';

const InfoCard = ({ title, value, icon, subtitle, footer }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && (
            <Box sx={{ mr: 2, color: 'primary.main' }}>
              {icon}
            </Box>
          )}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h4" component="div" sx={{ my: 2 }}>
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
      
      {footer && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            {footer}
          </Box>
        </>
      )}
    </Card>
  );
};

export default InfoCard; 
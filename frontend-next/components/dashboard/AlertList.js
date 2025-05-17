import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const AlertList = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No alerts at this time
        </Typography>
      </Box>
    );
  }

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <List>
      {alerts.map((alert, index) => (
        <React.Fragment key={alert.id}>
          <ListItem alignItems="flex-start">
            <ListItemIcon sx={{ minWidth: 40 }}>
              {getAlertIcon(alert.severity)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" component="span">
                    {alert.title}
                  </Typography>
                  <Chip
                    label={alert.severity}
                    size="small"
                    color={
                      alert.severity === 'critical'
                        ? 'error'
                        : alert.severity === 'warning'
                        ? 'warning'
                        : 'info'
                    }
                  />
                </Box>
              }
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {alert.message}
                  </Typography>
                  <Typography component="div" variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {getTimeAgo(alert.timestamp)}
                  </Typography>
                </>
              }
            />
          </ListItem>
          {index < alerts.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default AlertList; 
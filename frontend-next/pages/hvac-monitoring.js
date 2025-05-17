import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Paper, CircularProgress, Card, CardContent, Tabs, Tab, Button, Divider } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { hvacService } from '../api/hvacService';
import useSocket from '../hooks/useSocket';

// Components will be imported from a layout component in a real app
const InfoCard = ({ title, value }) => (
  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography variant="body2" color="text.secondary">{title}</Typography>
    <Typography variant="h5">{value}</Typography>
  </Paper>
);

const StatusCard = ({ title, value, status }) => (
  <Paper sx={{ p: 2, textAlign: 'center', height: '100%', 
    borderLeft: `4px solid ${
      status === 'error' ? '#f44336' : 
      status === 'warning' ? '#ff9800' : '#4caf50'
    }` 
  }}>
    <Typography variant="body2" color="text.secondary">{title}</Typography>
    <Typography variant="h5">{value}</Typography>
  </Paper>
);

const AlertList = ({ alerts }) => (
  <Box>
    {alerts.length > 0 ? (
      <Box>
        {alerts.map((alert, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2, borderLeft: `4px solid ${
            alert.severity === 'critical' ? '#f44336' : 
            alert.severity === 'warning' ? '#ff9800' : '#4caf50'
          }` }}>
            <Typography variant="body2" color="text.secondary">
              {new Date(alert.timestamp).toLocaleString()}
            </Typography>
            <Typography variant="body1">{alert.message}</Typography>
          </Paper>
        ))}
      </Box>
    ) : (
      <Box textAlign="center" py={3}>
        <Typography variant="body1" color="text.secondary">No alerts found</Typography>
      </Box>
    )}
  </Box>
);

export default function HvacMonitoring() {
  const [hvacSystems, setHvacSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();
  
  // Set up real-time data updates
  const { data: lastMessage } = useSocket('/api/stream/hvac-systems');
  
  // Fetch HVAC systems on component mount
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;
    
    const fetchHvacSystems = async () => {
      try {
        const data = await hvacService.getHvacSystems();
        setHvacSystems(data);
        if (data.length > 0) {
          setSelectedSystem(data[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch HVAC systems:', error);
        setLoading(false);
      }
    };
    
    fetchHvacSystems();
  }, []);
  
  // When selected system changes, fetch its performance data and alerts
  useEffect(() => {
    if (!selectedSystem || typeof window === 'undefined') return;
    
    const fetchSystemData = async () => {
      try {
        const [performanceData, alertsData] = await Promise.all([
          hvacService.getHvacPerformance(selectedSystem.id, timeRange),
          hvacService.getHvacAlerts(selectedSystem.id)
        ]);
        
        setPerformanceData(performanceData);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Failed to fetch HVAC system data:', error);
      }
    };
    
    fetchSystemData();
  }, [selectedSystem, timeRange]);
  
  // Update data when receiving real-time messages
  useEffect(() => {
    if (!lastMessage || !selectedSystem) return;
    
    try {
      const data = JSON.parse(lastMessage);
      
      // Update the selected system's real-time data if it matches
      if (data.id === selectedSystem.id) {
        setSelectedSystem(prevSystem => ({
          ...prevSystem,
          temperature: data.temperature,
          humidity: data.humidity,
          status: data.status,
          power: data.power,
          efficiency: data.efficiency,
          lastUpdated: new Date().toISOString()
        }));
        
        // Add new data point to performance chart
        setPerformanceData(prevData => {
          const newData = [...prevData];
          if (newData.length > 20) newData.shift(); // Keep only the last 20 points
          
          newData.push({
            time: new Date().toLocaleTimeString(),
            temperature: data.temperature,
            humidity: data.humidity,
            power: data.power,
            efficiency: data.efficiency
          });
          
          return newData;
        });
      }
      
      // If there's a new alert for this system, add it
      if (data.alert && data.id === selectedSystem?.id) {
        setAlerts(prevAlerts => [data.alert, ...prevAlerts].slice(0, 10));
      }
    } catch (error) {
      console.error('Error parsing WebSocket data:', error);
    }
  }, [lastMessage, selectedSystem]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleSystemChange = (system) => {
    setSelectedSystem(system);
  };
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <>
      <Head>
        <title>HVAC Systems Monitoring | IOT-Edge Platform</title>
      </Head>
      
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          HVAC Systems Monitoring
        </Typography>
        
        <Grid container spacing={3}>
          {/* HVAC Systems List */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Systems List
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {hvacSystems.map((system) => (
                <Card 
                  key={system.id}
                  sx={{ 
                    mb: 2, 
                    cursor: 'pointer',
                    border: selectedSystem?.id === system.id ? '2px solid #1976d2' : 'none'
                  }}
                  onClick={() => handleSystemChange(system)}
                >
                  <CardContent>
                    <Typography variant="h6">{system.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Location: {system.location}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: system.status === 'online' ? 'success.main' : 
                              system.status === 'warning' ? 'warning.main' : 'error.main'
                      }}
                    >
                      {system.status}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>
          
          {/* HVAC System Details */}
          <Grid item xs={12} md={9}>
            {selectedSystem ? (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatusCard 
                      title="Temperature"
                      value={`${selectedSystem.temperature}°C`}
                      status={
                        selectedSystem.temperature > 30 ? 'error' :
                        selectedSystem.temperature > 25 ? 'warning' : 'success'
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatusCard 
                      title="Humidity"
                      value={`${selectedSystem.humidity}%`}
                      status={
                        selectedSystem.humidity > 70 ? 'error' :
                        selectedSystem.humidity < 30 ? 'warning' : 'success'
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoCard 
                      title="Power"
                      value={`${selectedSystem.power} kW`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InfoCard 
                      title="Efficiency"
                      value={`${selectedSystem.efficiency}%`}
                    />
                  </Grid>
                </Grid>
                
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                      <Tab label="Performance" />
                      <Tab label="Alerts" />
                    </Tabs>
                  </Box>
                  
                  {tabValue === 0 && (
                    <>
                      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                        <Button 
                          variant={timeRange === '24h' ? 'contained' : 'outlined'} 
                          size="small"
                          onClick={() => handleTimeRangeChange('24h')}
                        >
                          Last 24 Hours
                        </Button>
                        <Button 
                          variant={timeRange === '7d' ? 'contained' : 'outlined'} 
                          size="small"
                          onClick={() => handleTimeRangeChange('7d')}
                        >
                          Last 7 Days
                        </Button>
                        <Button 
                          variant={timeRange === '30d' ? 'contained' : 'outlined'} 
                          size="small"
                          onClick={() => handleTimeRangeChange('30d')}
                        >
                          Last 30 Days
                        </Button>
                      </Box>
                      
                      <Box sx={{ height: 400 }}>
                        {performanceData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip />
                              <Legend />
                              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#8884d8" name="Temperature" />
                              <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#82ca9d" name="Humidity" />
                              <Line yAxisId="right" type="monotone" dataKey="power" stroke="#ff7300" name="Power" />
                              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#0088FE" name="Efficiency" />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <Typography variant="body1" color="text.secondary">
                              No data available
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </>
                  )}
                  
                  {tabValue === 1 && (
                    <AlertList alerts={alerts} />
                  )}
                </Paper>
                
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    System Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Model
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedSystem.model || '-'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Serial Number
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedSystem.serialNumber || '-'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Installation Date
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedSystem.installDate || '-'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Maintenance
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedSystem.maintenanceDate || '-'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Coverage Area
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedSystem.coverageArea ? `${selectedSystem.coverageArea} m²` : '-'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {selectedSystem.lastUpdated ? new Date(selectedSystem.lastUpdated).toLocaleString() : '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Select a system to view details
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </>
  );
} 
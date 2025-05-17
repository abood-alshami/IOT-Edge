import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Chip,
  Alert,
  useTheme as useMuiTheme,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Sensors as SensorsIcon,
  Devices as DevicesIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AcUnit as ColdRoomIcon,
  ElectricalServices as ElectricalIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import StatusCard from '../components/dashboard/StatusCard';
import InfoCard from '../components/dashboard/InfoCard';
import AlertList from '../components/dashboard/AlertList';
import MainLayout from '../components/layouts/MainLayout';
import { useTheme } from '../context/ThemeContext';
import axios from '../api/axiosConfig';
import { API_URL } from '../config';

// Dynamically import Chart components with SSR disabled
const Line = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  { ssr: false }
);

const Bar = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Bar),
  { ssr: false }
);

// تحسين مكونات الواجهة
const DashboardPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(3),
  height: '100%',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  },
  overflow: 'hidden',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.08)}, transparent 70%)`,
    borderRadius: '0 16px 0 50%',
    zIndex: 0,
  },
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  height: 300,
  marginTop: theme.spacing(2),
  position: 'relative',
  zIndex: 1,
}));

const SectionHeading = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
}));

// Register ChartJS components dynamically on client side
const registerChartJs = () => {
  if (typeof window !== 'undefined') {
    const { 
      Chart, 
      CategoryScale, 
      LinearScale, 
      PointElement, 
      LineElement, 
      BarElement, 
      Title, 
      Tooltip, 
      Legend,
      TimeScale 
    } = require('chart.js');
    
    Chart.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      BarElement,
      Title,
      Tooltip,
      Legend,
      TimeScale
    );
  }
};

const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const muiTheme = useMuiTheme();
  const { isDarkMode } = useTheme();
  
  const [dashboardData, setDashboardData] = useState({
    sensorCount: 0,
    deviceCount: 0,
    alertCount: 0,
    notificationCount: 0,
    coldRoomsCount: 0,
    electricalSystemsCount: 0,
    sensorData: [],
    alerts: [],
    coldRooms: [],
    electricalSystems: [],
  });

  // Register Chart.js components on client side
  useEffect(() => {
    registerChartJs();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: In a real implementation, we would fetch actual data from the API
        // For now, we'll use mock data
        
        // Mock API call
        // const response = await axios.get(`${API_URL}/dashboard`);
        // setDashboardData(response.data);
        
        // Mock data
        setTimeout(() => {
          setDashboardData({
            sensorCount: 48,
            deviceCount: 24,
            alertCount: 3,
            notificationCount: 7,
            coldRoomsCount: 6,
            electricalSystemsCount: 4,
            sensorData: [
              { date: '2023-01-01', value: 22 },
              { date: '2023-01-02', value: 23 },
              { date: '2023-01-03', value: 24 },
              { date: '2023-01-04', value: 21 },
              { date: '2023-01-05', value: 25 },
              { date: '2023-01-06', value: 26 },
              { date: '2023-01-07', value: 23 },
            ],
            alerts: [
              { id: 1, title: 'Temperature Alert', message: 'Cold Room #3 temperature above threshold', severity: 'critical', timestamp: '2023-01-07T10:24:32Z' },
              { id: 2, title: 'Power Usage Alert', message: 'Electrical System #2 power usage at 92% of capacity', severity: 'warning', timestamp: '2023-01-07T08:12:18Z' },
              { id: 3, title: 'Sensor Offline', message: 'Temperature Sensor #12 is offline', severity: 'warning', timestamp: '2023-01-06T22:45:55Z' },
            ],
            coldRooms: [
              { id: 1, name: 'Cold Room #1', temperature: -18.5, status: 'operational', capacity: '80%' },
              { id: 2, name: 'Cold Room #2', temperature: -20.1, status: 'operational', capacity: '65%' },
              { id: 3, name: 'Cold Room #3', temperature: -15.2, status: 'warning', capacity: '90%' },
            ],
            electricalSystems: [
              { id: 1, name: 'Electrical System #1', powerUsage: 75, status: 'operational' },
              { id: 2, name: 'Electrical System #2', powerUsage: 92, status: 'warning' },
            ],
          });
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const lineChartData = {
    labels: dashboardData.sensorData.map(item => item.date),
    datasets: [
      {
        label: 'Average Temperature',
        data: dashboardData.sensorData.map(item => item.value),
        borderColor: muiTheme.palette.primary.main,
        backgroundColor: alpha(muiTheme.palette.primary.main, 0.1),
        tension: 0.4,
        fill: true,
        pointBackgroundColor: muiTheme.palette.primary.main,
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
          color: muiTheme.palette.mode === 'dark' 
            ? alpha(muiTheme.palette.common.white, 0.1) 
            : alpha(muiTheme.palette.common.black, 0.1),
        },
        ticks: {
          color: muiTheme.palette.text.secondary,
        },
      },
      y: {
        grid: {
          color: muiTheme.palette.mode === 'dark' 
            ? alpha(muiTheme.palette.common.white, 0.1) 
            : alpha(muiTheme.palette.common.black, 0.1),
        },
        ticks: {
          color: muiTheme.palette.text.secondary,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: muiTheme.palette.text.primary,
          font: {
            family: muiTheme.typography.fontFamily,
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: muiTheme.palette.background.paper,
        titleColor: muiTheme.palette.text.primary,
        bodyColor: muiTheme.palette.text.secondary,
        borderColor: muiTheme.palette.divider,
        borderWidth: 1,
      },
    },
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress color="primary" sx={{ borderRadius: 1 }} />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
            Loading dashboard data...
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert severity="error" sx={{ mt: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Monitor your IoT devices and sensor data in real-time
        </Typography>
      </Box>
      
      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Sensors"
            value={dashboardData.sensorCount}
            icon={<SensorsIcon fontSize="large" />}
            color={muiTheme.palette.primary.main}
            onClick={() => router.push('/sensors')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Devices"
            value={dashboardData.deviceCount}
            icon={<DevicesIcon fontSize="large" />}
            color={muiTheme.palette.secondary.main}
            onClick={() => router.push('/devices')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Alerts"
            value={dashboardData.alertCount}
            icon={<WarningIcon fontSize="large" />}
            color={muiTheme.palette.error.main}
            onClick={() => router.push('/notifications')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Notifications"
            value={dashboardData.notificationCount}
            icon={<InfoIcon fontSize="large" />}
            color={muiTheme.palette.warning.main}
            onClick={() => router.push('/notifications')}
          />
        </Grid>
      </Grid>

      {/* Charts & Lists */}
      <Grid container spacing={3}>
        {/* Temperature Chart */}
        <Grid item xs={12} md={8}>
          <DashboardPaper>
            <SectionHeading>
              <TrendingUpIcon />
              <Typography variant="h6">Temperature Trends</Typography>
            </SectionHeading>
            
            <ChartContainer>
              {typeof window !== 'undefined' && <Line data={lineChartData} options={lineChartOptions} />}
            </ChartContainer>
          </DashboardPaper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <DashboardPaper>
            <SectionHeading>
              <WarningIcon />
              <Typography variant="h6">Recent Alerts</Typography>
            </SectionHeading>
            
            <AlertList alerts={dashboardData.alerts} />
          </DashboardPaper>
        </Grid>

        {/* Cold Rooms */}
        <Grid item xs={12} md={6}>
          <DashboardPaper>
            <SectionHeading>
              <ColdRoomIcon />
              <Typography variant="h6">Cold Room Monitoring</Typography>
            </SectionHeading>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {dashboardData.coldRooms.map((room) => (
                <Grid item xs={12} sm={6} key={room.id}>
                  <Card 
                    variant="outlined" 
                    sx={{
                      borderRadius: 2,
                      borderColor: room.status === 'warning' 
                        ? alpha(muiTheme.palette.warning.main, 0.5) 
                        : alpha(muiTheme.palette.success.main, 0.5),
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      },
                    }}
                  >
                    <CardContent>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between' 
                        }}
                      >
                        {room.name}
                        <Chip 
                          label={room.status} 
                          color={room.status === 'operational' ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </Typography>
                      
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          my: 2, 
                          fontWeight: 600,
                          color: room.status === 'warning' 
                            ? muiTheme.palette.warning.main 
                            : muiTheme.palette.text.primary
                        }}
                      >
                        {room.temperature}°C
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Capacity:
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={parseInt(room.capacity)} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4, 
                              mt: 0.5,
                              bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ ml: 2, fontWeight: 500 }}>
                          {room.capacity}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DashboardPaper>
        </Grid>

        {/* Electrical Systems */}
        <Grid item xs={12} md={6}>
          <DashboardPaper>
            <SectionHeading>
              <ElectricalIcon />
              <Typography variant="h6">Electrical Systems</Typography>
            </SectionHeading>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {dashboardData.electricalSystems.map((system) => (
                <Grid item xs={12} sm={6} key={system.id}>
                  <Card 
                    variant="outlined" 
                    sx={{
                      borderRadius: 2,
                      borderColor: system.status === 'warning' 
                        ? alpha(muiTheme.palette.warning.main, 0.5) 
                        : alpha(muiTheme.palette.success.main, 0.5),
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      },
                    }}
                  >
                    <CardContent>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between' 
                        }}
                      >
                        {system.name}
                        <Chip 
                          label={system.status} 
                          color={system.status === 'operational' ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                        <Box 
                          sx={{ 
                            position: 'relative', 
                            width: 120, 
                            height: 120, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                        >
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              width: '100%', 
                              height: '100%',
                              borderRadius: '50%',
                              background: `conic-gradient(
                                ${system.powerUsage > 90 
                                  ? muiTheme.palette.error.main 
                                  : system.powerUsage > 75 
                                    ? muiTheme.palette.warning.main 
                                    : muiTheme.palette.success.main} 
                                ${system.powerUsage}%, 
                                ${alpha(muiTheme.palette.divider, 0.2)} 0
                              )`,
                              transform: 'rotate(-90deg)',
                            }}
                          />
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              width: '80%',
                              height: '80%',
                              borderRadius: '50%',
                              backgroundColor: muiTheme.palette.background.paper,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                            }}
                          >
                            <Typography 
                              variant="h4" 
                              sx={{ 
                                fontWeight: 600,
                                color: system.powerUsage > 90 
                                  ? muiTheme.palette.error.main 
                                  : system.powerUsage > 75 
                                    ? muiTheme.palette.warning.main 
                                    : muiTheme.palette.success.main
                              }}
                            >
                              {system.powerUsage}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Power Usage
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: 1 
                        }}
                      >
                        <SpeedIcon 
                          fontSize="small" 
                          color={system.powerUsage > 90 ? 'error' : system.powerUsage > 75 ? 'warning' : 'success'} 
                        />
                        <Typography 
                          variant="body2" 
                          color={system.powerUsage > 90 
                            ? 'error.main' 
                            : system.powerUsage > 75 
                              ? 'warning.main' 
                              : 'success.main'
                          }
                        >
                          {system.powerUsage > 90 
                            ? 'Critical Load' 
                            : system.powerUsage > 75 
                              ? 'High Load' 
                              : 'Normal Operation'
                          }
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DashboardPaper>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default Dashboard; 
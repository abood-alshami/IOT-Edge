import React, { createContext, useState, useEffect } from 'react';
import { arSA, enUS } from '@mui/material/locale';
import { useRouter } from 'next/router';

// Translations
const translations = {
  en: {
    dashboard: 'Dashboard',
    sensors: 'Sensors',
    sensorData: 'Sensor Data',
    devices: 'Devices',
    monitoring: 'Monitoring',
    coldRooms: 'Cold Rooms',
    electricalSystems: 'Electrical Systems',
    notifications: 'Notifications',
    reports: 'Reports',
    settings: 'Settings',
    profile: 'Profile',
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    language: 'Language',
    english: 'English',
    arabic: 'Arabic',
    temperature: 'Temperature',
    humidity: 'Humidity',
    pressure: 'Pressure',
    status: 'Status',
    operational: 'Operational',
    warning: 'Warning',
    critical: 'Critical',
    noData: 'No data available',
    filterByDate: 'Filter by Date',
    startDate: 'Start Date',
    endDate: 'End Date',
    applyFilter: 'Apply Filter',
    clearFilter: 'Clear Filter',
    fetchData: 'Fetch Data',
    viewAll: 'View All',
    summary: 'Summary',
    minimum: 'Minimum',
    maximum: 'Maximum',
    average: 'Average',
    dataPoints: 'Data Points',
    dateRange: 'Date Range',
    sfda: 'SFDA Compliance',
    compliant: 'Compliant',
    nonCompliant: 'Non-Compliant',
    ai: 'AI Predictions',
    predictive: 'Predictive Maintenance',
    anomalyDetection: 'Anomaly Detection',
    energyOptimization: 'Energy Optimization',
    hvac: 'HVAC',
    lng: 'LNG Monitoring',
    solar: 'Solar Power',
    powerGeneration: 'Power Generation',
    refrigerators: 'Refrigerators',
    lab: 'Lab',
    pharmacy: 'Pharmacy',
    calibration: 'Calibration',
    maintenanceSchedule: 'Maintenance Schedule',
    apiKeys: 'API Keys',
    mfa: 'Multi-Factor Authentication',
    enable: 'Enable',
    disable: 'Disable',
    twoFactorAuth: '2FA',
    scan: 'Scan QR Code',
    verify: 'Verify Code',
    enterCode: 'Enter Authentication Code',
    // HVAC specific translations
    hvac: {
      title: 'HVAC Systems Monitoring',
      systemsList: 'Systems List',
      selectSystem: 'Select a system to view details',
      temperature: 'Temperature',
      humidity: 'Humidity',
      power: 'Power Consumption',
      efficiency: 'Energy Efficiency',
      performance: 'Performance',
      alerts: 'Alerts',
      details: 'System Details',
      model: 'Model',
      serialNumber: 'Serial Number',
      installDate: 'Installation Date',
      maintenanceDate: 'Last Maintenance',
      coverageArea: 'Coverage Area',
      lastUpdated: 'Last Updated',
      location: 'Location'
    },
    status: {
      online: 'Online',
      offline: 'Offline',
      warning: 'Warning',
      error: 'Error'
    },
    timeRange: {
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days'
    },
    common: {
      noDataAvailable: 'No data available'
    },
    // LNG specific translations
    lng: {
      title: 'Liquid Nitrogen Generator Monitoring',
      systemsList: 'Systems List',
      selectSystem: 'Select a system to view details',
      purity: 'Nitrogen Purity',
      pressure: 'Pressure',
      production: 'Production Rate',
      uptime: 'System Uptime',
      parameters: 'System Parameters',
      parameter: 'Parameter',
      value: 'Value',
      unit: 'Unit',
      status: 'Status',
      maintenance: 'Maintenance',
      upcomingMaintenance: 'Upcoming Maintenance',
      maintenanceHistory: 'Maintenance History',
      maintenanceType: 'Type',
      scheduledDate: 'Scheduled Date',
      completionDate: 'Completion Date',
      performedBy: 'Performed By',
      priority: 'Priority',
      alerts: 'Alerts',
      details: 'System Details',
      model: 'Model',
      serialNumber: 'Serial Number',
      installDate: 'Installation Date',
      lastMaintenance: 'Last Maintenance',
      capacity: 'Capacity',
      lastUpdated: 'Last Updated',
      location: 'Location'
    },
    // Solar power specific translations
    solar: {
      title: 'Solar Power Monitoring',
      systemsList: 'Systems List',
      selectSystem: 'Select a system to view details',
      currentProduction: 'Current Production',
      dailyTotal: 'Daily Total',
      efficiency: 'Efficiency',
      co2Saved: 'CO₂ Saved',
      production: 'Production',
      consumption: 'Consumption',
      panels: 'Solar Panels',
      alerts: 'Alerts',
      details: 'System Details',
      weatherConditions: 'Weather Conditions',
      irradiance: 'Irradiance',
      cloudCover: 'Cloud Cover',
      humidity: 'Humidity',
      windSpeed: 'Wind Speed',
      forecastToday: 'Today\'s Forecast',
      totalConsumption: 'Total Consumption',
      fromGrid: 'From Grid',
      fromSolar: 'From Solar',
      energyDistribution: 'Energy Distribution',
      panelProduction: 'Panel Production',
      gridConsumption: 'Grid Consumption',
      batteryUsage: 'Battery Usage',
      excess: 'Excess Production',
      panelStatus: 'Panel Status',
      panel: 'Panel',
      currentOutput: 'Current Output',
      temperature: 'Temperature',
      installedCapacity: 'Installed Capacity',
      panelCount: 'Number of Panels',
      inverterModel: 'Inverter Model',
      orientation: 'Orientation',
      installDate: 'Installation Date',
      lastMaintenance: 'Last Maintenance',
      expectedLifespan: 'Expected Lifespan',
      years: 'Years',
      lastUpdated: 'Last Updated',
      location: 'Location',
      capacity: 'Capacity',
      noWeatherData: 'No weather data available',
      panelStatus: {
        optimal: 'Optimal',
        degraded: 'Degraded Performance',
        error: 'Error'
      }
    },
    // API Key Management translations
    apiKeys: {
      title: 'API Key Management',
      yourKeys: 'Your API Keys',
      createNew: 'Create New Key',
      name: 'Name',
      description: 'Description',
      created: 'Created',
      expires: 'Expires',
      status: 'Status',
      actions: 'Actions',
      noKeysFound: 'No API keys found',
      selectKeyPrompt: 'Select an API Key',
      selectKeyDescription: 'Click on an API key to view its details and usage statistics',
      newlyCreatedKey: 'Newly Created API Key',
      saveKeyWarning: 'Copy this key now. You won\'t be able to see it again!',
      apiKey: 'API Key',
      done: 'Done',
      lastUsed: 'Last Used',
      permissions: 'Permissions',
      noPermissions: 'No permissions assigned',
      usageStatistics: 'Usage Statistics',
      requests: 'Requests',
      noUsageData: 'No usage data available',
      createNewKey: 'Create New API Key',
      expiration: 'Expiration',
      expiration7Days: '7 days',
      expiration30Days: '30 days',
      expiration90Days: '90 days',
      expiration180Days: '180 days',
      expiration365Days: '365 days',
      expirationNever: 'Never expires',
      create: 'Create',
      confirmDelete: 'Confirm Delete',
      deleteWarning: 'Are you sure you want to delete the API key "{name}"? This action cannot be undone.',
      delete: 'Delete',
      copiedToClipboard: 'Copied to clipboard',
      errorCopying: 'Error copying to clipboard',
      keyCreatedSuccess: 'API key created successfully',
      keyDeletedSuccess: 'API key deleted successfully',
      errorCreatingKey: 'Error creating API key',
      errorDeletingKey: 'Error deleting API key',
      errorFetchingKeys: 'Error fetching API keys',
      errorFetchingUsage: 'Error fetching usage data',
      noExpiration: 'Never expires',
      expired: 'Expired',
      status: {
        active: 'Active',
        expiring: 'Expiring Soon',
        expired: 'Expired'
      },
      permissions: {
        sensorsRead: 'Read Sensors',
        sensorsWrite: 'Modify Sensors',
        devicesRead: 'Read Devices',
        devicesWrite: 'Modify Devices',
        reportsRead: 'Access Reports',
        monitoringRead: 'Access Monitoring'
      }
    },
    common: {
      cancel: 'Cancel',
      noDataAvailable: 'No data available'
    }
  },
  ar: {
    dashboard: 'لوحة التحكم',
    sensors: 'المستشعرات',
    sensorData: 'بيانات المستشعرات',
    devices: 'الأجهزة',
    monitoring: 'المراقبة',
    coldRooms: 'الغرف الباردة',
    electricalSystems: 'الأنظمة الكهربائية',
    notifications: 'الإشعارات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    theme: 'السمة',
    dark: 'داكن',
    light: 'فاتح',
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    temperature: 'درجة الحرارة',
    humidity: 'الرطوبة',
    pressure: 'الضغط',
    status: 'الحالة',
    operational: 'تشغيلي',
    warning: 'تحذير',
    critical: 'حرج',
    noData: 'لا توجد بيانات متاحة',
    // Rest of Arabic translations...
  }
};

// MUI locale definitions
const localeMap = {
  en: enUS,
  ar: arSA,
};

// Create language context
export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  
  useEffect(() => {
    // Initialize language from Next.js locale or localStorage
    const savedLanguage = localStorage.getItem('language');
    const initialLanguage = savedLanguage || router.locale || 'en';
    setLanguage(initialLanguage);
  }, [router.locale]);

  useEffect(() => {
    // Set document direction
    document.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    // Save language preference
    localStorage.setItem('language', language);
    
    // Add required CSS for RTL support if Arabic
    if (language === 'ar') {
      if (!document.getElementById('rtl-styles')) {
        const style = document.createElement('style');
        style.id = 'rtl-styles';
        style.innerHTML = `
          body { font-family: 'Noto Sans Arabic', 'Roboto', sans-serif; }
        `;
        document.head.appendChild(style);
      }
    } else {
      const rtlStyles = document.getElementById('rtl-styles');
      if (rtlStyles) {
        rtlStyles.remove();
      }
    }
    
    // Update Next.js locale
    router.push(router.pathname, router.asPath, { locale: language });
  }, [language, router]);

  // Get translated text
  const t = (key) => {
    if (!translations[language]) {
      return key;
    }
    
    return translations[language][key] || translations.en[key] || key;
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        t,
        toggleLanguage,
        isRTL: language === 'ar',
        locale: localeMap[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}; 
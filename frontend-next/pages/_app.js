import React, { useEffect } from 'react';
import Head from 'next/head';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../utils/createEmotionCache';
import { ThemeProvider } from '../context/ThemeContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/globals.css';

// تهيئة كاش Emotion للجانب العميل، يشترك به الجلسة بأكملها
const clientSideEmotionCache = createEmotionCache();

// مكون ThemeWrapper لتطبيق الثيم من سياق الثيم
const ThemeWrapper = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  useEffect(() => {
    // إزالة CSS المضمن من جانب الخادم
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <title>IOT-Edge Platform</title>
      </Head>
      <ThemeProvider>
        <ThemeWrapper>
          <Component {...pageProps} />
        </ThemeWrapper>
      </ThemeProvider>
    </CacheProvider>
  );
} 
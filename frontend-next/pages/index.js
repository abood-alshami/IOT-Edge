import { useEffect } from 'react';
import { useRouter } from 'next/router';
import storage from '../utils/storage';
import logger from '../utils/logger';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    logger.info('Home page - checking authentication');
    
    // Check if user is already logged in
    const token = storage.getItem('token');
    const user = storage.getItem('user');
    
    if (token && user) {
      logger.info('User is already logged in, redirecting to dashboard');
      router.push('/dashboard');
    } else {
      logger.info('User is not logged in, redirecting to login');
      router.push('/login');
    }
  }, [router]);

  // Return empty div as this page will redirect immediately
  return <div />;
} 
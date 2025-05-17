import createCache from '@emotion/cache';

// On the client side, Create a custom emotion cache to prepend <style> elements
export default function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
} 
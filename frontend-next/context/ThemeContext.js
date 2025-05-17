import { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme, lightThemeAr, darkThemeAr } from '../utils/theme';

// القيم الافتراضية للسياق
const defaultContextData = {
  theme: lightTheme,
  isDarkMode: false,
  toggleDarkMode: () => {},
  language: 'en',
  changeLanguage: () => {},
};

const ThemeContext = createContext(defaultContextData);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // تحقق مما إذا كان المتصفح يفضل الوضع الداكن
  const prefersDarkMode = typeof window !== 'undefined' && window.matchMedia 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

  // حفظ الوضع ولغة التطبيق في state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  // تحميل التفضيلات المحفوظة من localStorage عند بدء التطبيق
  useEffect(() => {
    // لا يمكن استخدام localStorage إلا على جانب العميل
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode');
      const savedLanguage = localStorage.getItem('language');
      
      // استخدم التفضيلات المحفوظة أو القيم الافتراضية
      setIsDarkMode(savedDarkMode === 'true' || (savedDarkMode === null && prefersDarkMode));
      setLanguage(savedLanguage || 'en');
    }
  }, [prefersDarkMode]);

  // حفظ التفضيلات عند تغييرها
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', isDarkMode.toString());
      localStorage.setItem('language', language);
      
      // تحديث اتجاه الصفحة
      document.dir = language === 'ar' ? 'rtl' : 'ltr';
      
      // إضافة أو إزالة كلاس الوضع الداكن
      if (isDarkMode) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    }
  }, [isDarkMode, language]);

  // دالة لتبديل الوضع الداكن/الفاتح
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // دالة لتغيير اللغة
  const changeLanguage = (newLanguage) => {
    if (newLanguage === 'en' || newLanguage === 'ar') {
      setLanguage(newLanguage);
    }
  };

  // تحديد الثيم المناسب بناءً على اللغة والوضع
  const getTheme = () => {
    if (language === 'ar') {
      return isDarkMode ? darkThemeAr : lightThemeAr;
    }
    return isDarkMode ? darkTheme : lightTheme;
  };

  // قيمة السياق التي سيتم توفيرها للتطبيق
  const contextValue = {
    theme: getTheme(),
    isDarkMode,
    toggleDarkMode,
    language,
    changeLanguage,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}; 
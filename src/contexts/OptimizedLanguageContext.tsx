'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Locale, defaultLocale, loadLanguage } from '@/lib/i18n';

interface LanguageContextType {
  currentLanguage: Locale;
  changeLanguage: (locale: Locale) => Promise<void>;
  t: (key: string, options?: any) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function OptimizedLanguageProvider({ children }: LanguageProviderProps) {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Locale>(defaultLocale);
  const [isLoading, setIsLoading] = useState(false);

  // 初始化语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Locale;
    if (savedLanguage && savedLanguage !== defaultLocale) {
      changeLanguage(savedLanguage);
    }
  }, []);

  // 优化的语言切换函数
  const changeLanguage = useCallback(async (locale: Locale) => {
    if (locale === currentLanguage) return;
    
    setIsLoading(true);
    try {
      await loadLanguage(locale);
      setCurrentLanguage(locale);
      localStorage.setItem('language', locale);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  // 优化的翻译函数
  const optimizedT = useCallback((key: string, options?: any) => {
    return t(key, options);
  }, [t]);

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    t: optimizedT,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useOptimizedLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useOptimizedLanguage must be used within an OptimizedLanguageProvider');
  }
  return context;
}

// 高阶组件，用于包装需要翻译的组件
export function withTranslation<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => {
    const { t } = useOptimizedLanguage();
    return <Component {...props} t={t} />;
  };
  
  WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default OptimizedLanguageProvider;

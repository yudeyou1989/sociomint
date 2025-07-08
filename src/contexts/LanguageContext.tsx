'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Locale, defaultLocale } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // 从localStorage恢复语言设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('language') as Locale;
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh')) {
        setLocaleState(savedLocale);
        i18n.changeLanguage(savedLocale);
      }
    }
  }, [i18n]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    i18n.changeLanguage(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLocale);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

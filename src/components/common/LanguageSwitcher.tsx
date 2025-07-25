'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  // 切换语言
  const toggleLanguage = () => {
    const newLanguage = locale === 'zh' ? 'en' : 'zh';
    setLocale(newLanguage);
  };

  // 显示当前语言标签
  const displayLabel = locale === 'zh' ? '中/EN' : 'ZH/en';

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center px-2 py-1 text-sm rounded-md hover:bg-gray-800 transition-colors"
      aria-label="切换语言/Switch Language"
    >
      <span className="font-medium">{displayLabel}</span>
    </button>
  );
} 
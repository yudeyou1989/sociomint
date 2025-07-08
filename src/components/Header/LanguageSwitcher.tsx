import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { locale, setLocale } = useLanguage();

  // 语言名称映射
  const languageNames: Record<string, string> = {
    zh: '中文',
    en: 'English'
  };

  return (
    <div className={`language-switcher ${className || ''}`}>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'en' | 'zh')}
        className="bg-black/70 border border-gray-700 rounded-md py-1 px-2 text-sm font-medium text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#0de5ff] focus:border-[#0de5ff]"
      >
        <option value="zh">{languageNames.zh}</option>
        <option value="en">{languageNames.en}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher; 
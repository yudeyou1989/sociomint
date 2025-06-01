import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 导入翻译文件 - 在服务器端渲染中使用
import zhJSON from '../locales/zh.json';
import enJSON from '../locales/en.json';

// 只保留中英文资源
const resources = {
  en: { translation: enJSON },
  zh: { translation: zhJSON }
};

i18n
  // 加载语言文件
  .use(Backend)
  // 检测用户语言
  .use(LanguageDetector)
  // 将i18n实例传递给react-i18next
  .use(initReactI18next)
  // 初始化i18n
  .init({
    resources,
    fallbackLng: 'zh',  // 默认语言设为中文
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // 不需要对React应用进行HTML转义
    },
    
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: true,
    },
  });

// 清空缓存中可能存在的错误配置
if (typeof window !== 'undefined') {
  const savedLang = localStorage.getItem('i18nextLng');
  if (savedLang && !['en', 'zh'].includes(savedLang)) {
    localStorage.setItem('i18nextLng', 'en');
    i18n.changeLanguage('en');
  }
}

export default i18n; 
export const defaultLocale = 'en';
export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];

export const translations = {
  en: {
    common: {
      connect: 'Connect Wallet',
      disconnect: 'Disconnect',
      balance: 'Balance',
      exchange: 'Exchange',
      loading: 'Loading...',
    },
  },
  zh: {
    common: {
      connect: '连接钱包',
      disconnect: '断开连接',
      balance: '余额',
      exchange: '兑换',
      loading: '加载中...',
    },
  },
};

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

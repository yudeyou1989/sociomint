'use client';

import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

// 动态导入以避免SSR问题
const PresaleDashboard = dynamic(() => import('@/components/presale/PresaleDashboard'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
  </div>
});

export default function PresalePage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-10 text-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text">
        {t('presale.title')}
      </h1>
      <p className="text-xl text-gray-300 mb-12 text-center max-w-3xl mx-auto">
        {t('presale.subtitle')}
      </p>

      <PresaleDashboard />
    </div>
  );
}
'use client';

import PresaleDashboard from '@/components/presale/PresaleDashboard';
import { useTranslation } from 'react-i18next';

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
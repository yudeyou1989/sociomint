'use client';

import dynamic from 'next/dynamic';

// 动态导入以避免SSR问题
const ExchangeContent = dynamic(() => import('@/components/exchange/ExchangeContent'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
  </div>
});

export default function ExchangePage() {
  return <ExchangeContent />;
}

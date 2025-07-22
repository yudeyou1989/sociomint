'use client';

import { Suspense, memo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { FaClipboard, FaSync } from 'react-icons/fa';
import { BsShop, BsBriefcase } from 'react-icons/bs';
import dynamic from 'next/dynamic';

// 动态导入组件，添加加载状态
const SMExchangeInfo = dynamic(() => import('../components/SMExchangeInfo'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800/50 rounded-lg h-32" />
});

const ExchangeSection = dynamic(() => import('../components/home/ExchangeSection'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800/50 rounded-lg h-32" />
});

// 骨架屏组件
const HeroSkeleton = memo(() => (
  <div className="animate-pulse text-center mb-12 max-w-5xl">
    <div className="h-16 bg-gray-800/50 rounded-lg mb-6" />
    <div className="h-6 bg-gray-800/50 rounded-lg mb-8 max-w-2xl mx-auto" />
    <div className="flex flex-wrap justify-center gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-12 w-32 bg-gray-800/50 rounded-lg" />
      ))}
    </div>
  </div>
));

const StatsSkeleton = memo(() => (
  <div className="w-full max-w-5xl mb-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse bg-gray-800/50 rounded-xl p-6">
          <div className="h-6 bg-gray-700/50 rounded mb-2" />
          <div className="h-10 bg-gray-700/50 rounded" />
        </div>
      ))}
    </div>
  </div>
));

// 主要内容组件
const HeroSection = memo(() => {
  const { t } = useTranslation();

  return (
    <section className="text-center mb-12 max-w-5xl">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
        <div className="bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
          {t('home.heroTitle.line1')}
        </div>
        <div className="bg-clip-text text-transparent bg-gradient-to-r from-[#8b3dff] to-[#0de5ff] mt-2">
          {t('home.heroTitle.line2')}
        </div>
      </h1>
      <p className="text-xl text-gray-300 mb-8">
        {t('home.heroSubtitle')}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/tasks" prefetch={false}>
          <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] text-white font-medium hover:from-[#0bc9e0] hover:to-[#7a35e0] transition-all flex items-center">
            📋
            {t('home.exploreTasks')}
          </button>
        </Link>
        <Link href="/exchange" prefetch={false}>
          <button className="px-6 py-3 rounded-lg bg-gradient-to-l from-[#0de5ff] to-[#8b3dff] text-white font-medium hover:from-[#0bc9e0] hover:to-[#7a35e0] transition-all flex items-center">
            🔄
            {t('exchange.title')}
          </button>
        </Link>
        <Link href="/market" prefetch={false}>
          <button className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 text-white font-medium transition-colors flex items-center">
            🏪
            {t('home.visitMarket')}
          </button>
        </Link>
      </div>
    </section>
  );
});

const StatsSection = memo(() => {
  const { t } = useTranslation();

  return (
    <section className="w-full max-w-5xl mb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-800/50 rounded-xl p-6 text-center">
          <h3 className="text-lg text-gray-300 mb-2">{t('home.stats.verifications')}</h3>
          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
            10,000+
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6 text-center">
          <h3 className="text-lg text-gray-300 mb-2">{t('home.stats.rewards')}</h3>
          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
            50,000+ SM
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6 text-center">
          <h3 className="text-lg text-gray-300 mb-2">{t('home.stats.tasks')}</h3>
          <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
            100+
          </p>
        </div>
      </div>
    </section>
  );
});

export default function Home() {
  return (
    <main className="flex flex-col items-center py-8 px-4">
      {/* Hero Section */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* Stats Section */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Exchange Section */}
      <Suspense fallback={<div className="animate-pulse w-full max-w-5xl mb-16 h-64 bg-gray-800/50 rounded-lg" />}>
        <section className="w-full max-w-5xl mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <div className="flex items-center mb-4">
                🔄
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8b3dff] to-[#0de5ff]">
                  SM 代币兑换
                </h2>
              </div>
              <SMExchangeInfo />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center mb-4">
                💼
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
                  兑换中心
                </h2>
              </div>
              <ExchangeSection />
            </div>
          </div>
        </section>
      </Suspense>

      {/* Call to Action - Exchange Section */}
      <Suspense fallback={<div className="animate-pulse w-full max-w-5xl h-32 bg-gray-800/50 rounded-xl mb-16" />}>
        <CallToActionSection />
      </Suspense>
    </main>
  );
}

// CTA组件
const CallToActionSection = memo(() => {
  const { t } = useTranslation();

  return (
    <section className="w-full max-w-5xl p-6 bg-gray-800/30 rounded-xl border border-gray-700 mb-16">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
          <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
            {t('exchange.title')}
          </h2>
          <p className="text-gray-300 mb-4">
            {t('common.exchangeDescription')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-gray-700/50 px-3 py-1 rounded-full text-sm">
              1 BNB = 100 SM
            </div>
            <div className="bg-gray-700/50 px-3 py-1 rounded-full text-sm">
              <span className="text-yellow-400">5%</span> {t('exchange.feeWarning', { percentage: 5 })}
            </div>
          </div>
        </div>
        <div className="md:w-1/3 flex justify-center">
          <Link href="/exchange" prefetch={false}>
            <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] text-white font-medium hover:from-[#0bc9e0] hover:to-[#7a35e0] transition-all flex items-center">
              🔄
              {t('exchange.title')}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
});

'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { FaTasks, FaStore, FaExchangeAlt, FaWallet, FaHistory, FaExchange } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// 动态导入组件，避免SSR问题
const UserBalanceDisplay = dynamic(() => import('../UserBalanceDisplay'), { ssr: false });
const TransactionHistory = dynamic(() => import('../TransactionHistory'), { ssr: false });
const XiaohonghuaExchange = dynamic(() => import('../XiaohonghuaExchange'), { ssr: false });

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-col items-center py-8 px-4">
      {/* Hero Section */}
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
          <Link href="/tasks">
            <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] text-white font-medium hover:from-[#0bc9e0] hover:to-[#7a35e0] transition-all flex items-center">
              <FaTasks className="mr-2" />
              {t('home.exploreTasks')}
            </button>
          </Link>
          <Link href="/exchange">
            <button className="px-6 py-3 rounded-lg bg-gradient-to-l from-[#0de5ff] to-[#8b3dff] text-white font-medium hover:from-[#0bc9e0] hover:to-[#7a35e0] transition-all flex items-center">
              <FaExchangeAlt className="mr-2" />
              {t('exchange.title')}
            </button>
          </Link>
          <Link href="/market">
            <button className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 text-white font-medium transition-colors flex items-center">
              <FaStore className="mr-2" />
              {t('home.visitMarket')}
            </button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
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

      {/* User Balance, Transaction History, and Exchange Section */}
      <section className="w-full max-w-5xl mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <FaWallet className="text-[#0de5ff] mr-2" />
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
                用户资产
              </h2>
            </div>
            <UserBalanceDisplay className="flex-grow" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <FaExchange className="text-[#8b3dff] mr-2" />
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8b3dff] to-[#0de5ff]">
                小红花兑换
              </h2>
            </div>
            <XiaohonghuaExchange className="flex-grow" onExchangeComplete={() => {
              // 刷新页面或重新加载数据
              window.location.reload();
            }} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <FaHistory className="text-[#0de5ff] mr-2" />
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
                交易历史
              </h2>
            </div>
            <TransactionHistory className="flex-grow" maxItems={5} />
          </div>
        </div>
      </section>

      {/* Call to Action - Exchange Section */}
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
            <Link href="/exchange">
              <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] text-white font-medium hover:from-[#0bc9e0] hover:to-[#7a35e0] transition-all flex items-center">
                <FaExchangeAlt className="mr-2" />
                {t('exchange.title')}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

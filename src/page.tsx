'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSMExchange } from '@/hooks/useSMExchange';
import { formatEther } from 'viem';

export default function Home() {
  const { t } = useTranslation();
  const { 
    totalTokensSold, 
    totalTokensRemaining, 
    currentPrice, 
    totalBnbRaised,
    isConnected 
  } = useSMExchange();

  return (
    <main className="flex-grow">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="md:max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('home.title', 'SocioMint 代币交易平台')}
            </h1>
            <p className="text-xl mb-8">
              {t('home.subtitle', '安全、便捷地参与SM代币交易，连接区块链世界的桥梁')}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/exchange" 
                className="btn btn-primary px-8 py-3 text-lg"
              >
                {t('home.buyTokens', '购买代币')}
              </Link>
              <Link 
                href="/verify" 
                className="btn bg-white text-blue-700 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                {t('home.verifyAccount', '验证账户')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 代币统计信息 */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('home.tokenStats', '代币销售统计')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 dark:text-gray-300 mb-2">{t('home.currentPrice', '当前价格')}</p>
              <p className="text-3xl font-bold">{currentPrice ? formatEther(currentPrice) : '0'} BNB</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 dark:text-gray-300 mb-2">{t('home.tokensSold', '已售代币')}</p>
              <p className="text-3xl font-bold">{totalTokensSold ? formatEther(totalTokensSold) : '0'} SM</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 dark:text-gray-300 mb-2">{t('home.tokensRemaining', '剩余代币')}</p>
              <p className="text-3xl font-bold">{totalTokensRemaining ? formatEther(totalTokensRemaining) : '0'} SM</p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 dark:text-gray-300 mb-2">{t('home.totalRaised', '已筹集资金')}</p>
              <p className="text-3xl font-bold">{totalBnbRaised ? formatEther(totalBnbRaised) : '0'} BNB</p>
            </div>
          </div>
        </div>
      </section>

      {/* 特色介绍 */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('home.features', '平台特点')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full p-4 inline-flex mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('home.securityTitle', '安全可靠')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('home.securityDesc', '智能合约经过审计，确保代币交易的安全性和可靠性')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full p-4 inline-flex mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('home.verificationTitle', '身份验证')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('home.verificationDesc', '通过简单的身份验证流程，确保合规并防止欺诈行为')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 rounded-full p-4 inline-flex mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">{t('home.transparentTitle', '透明追踪')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('home.transparentDesc', '实时查看交易历史和价格走势，保持市场透明度')}
            </p>
          </div>
        </div>
      </section>

      {/* 快速开始 */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('home.getStarted', '快速开始')}
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center mb-12">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold flex-shrink-0 mb-4 md:mb-0 md:mr-6">1</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('home.step1Title', '连接钱包')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('home.step1Desc', '使用MetaMask或其他兼容的钱包连接到BSC测试网络')}</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center mb-12">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold flex-shrink-0 mb-4 md:mb-0 md:mr-6">2</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('home.step2Title', '验证身份')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('home.step2Desc', '完成简单的身份验证程序，以获得购买权限')}</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold flex-shrink-0 mb-4 md:mb-0 md:mr-6">3</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('home.step3Title', '购买代币')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('home.step3Desc', '使用BNB购买SM代币，并实时跟踪您的交易')}</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/exchange" 
              className="btn btn-primary px-8 py-3 text-lg"
            >
              {t('home.startNow', '立即开始')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

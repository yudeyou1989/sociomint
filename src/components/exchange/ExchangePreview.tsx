'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
// // import { "➡️", "🔄" } from 'react-icons/fa'; // 临时注释以修复构建 // 临时注释以修复构建
import { usePresaleContract } from '../../hooks/contracts/usePresaleContracts';
import { formatEther } from 'viem';
import { useEffect, useState } from 'react';

export default function ExchangePreview() {
  const { t } = useTranslation();
  
  // 预售合约状态
  const { 
    currentPrice = BigInt(0),
    soldTokens = BigInt(0),
    totalPresaleTokens = BigInt(0)
  } = usePresaleContract() as any;

  const [exchangeRate, setExchangeRate] = useState('0');
  const [presaleProgress, setPresaleProgress] = useState(0);

  // 计算兑换率
  useEffect(() => {
    if (currentPrice > BigInt(0)) {
      try {
        const rate = Number(formatEther(currentPrice));
        setExchangeRate(rate.toLocaleString());
      } catch (error) {
        console.error("计算兑换率错误:", error);
      }
    }
  }, [currentPrice]);

  // 计算预售进度
  useEffect(() => {
    if (soldTokens > BigInt(0) && totalPresaleTokens > BigInt(0)) {
      try {
        const sold = Number(formatEther(soldTokens));
        const total = Number(formatEther(totalPresaleTokens));
        const progress = (sold / total) * 100;
        setPresaleProgress(Math.min(progress, 100));
      } catch (error) {
        console.error("计算进度错误:", error);
      }
    }
  }, [soldTokens, totalPresaleTokens]);

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-6 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0de5ff] to-[#8b3dff]">
            {t('presale.title')}
          </h3>
          <p className="text-gray-300 text-sm md:text-base">{t('common.exchangeDescription')}</p>
        </div>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          🔄
          <span className="text-white">
            1 BNB = <span className="text-primary font-medium">{exchangeRate}</span> SM
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">{t('presale.progress')}</span>
          <span className="font-medium">{presaleProgress.toFixed(2)}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-primary rounded-full h-full transition-all duration-500"
            style={{ width: `${presaleProgress}%` }}
          ></div>
        </div>
      </div>

      {/* 预售统计 */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">{t('presale.soldTokens')}</div>
          <div className="text-xl font-medium">
            {Number(formatEther(soldTokens)).toLocaleString()} SM
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">{t('presale.totalSupply')}</div>
          <div className="text-xl font-medium">
            {Number(formatEther(totalPresaleTokens)).toLocaleString()} SM
          </div>
        </div>
      </div>

      {/* 链接到完整兑换页面 */}
      <div className="mt-6 flex justify-end">
        <Link href="/presale">
          <button className="flex items-center space-x-2 bg-gradient-to-r from-[#0de5ff] to-[#8b3dff] px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity">
            <span>{t('presale.purchaseButton')}</span>
            ➡️
          </button>
        </Link>
      </div>
    </div>
  );
} 
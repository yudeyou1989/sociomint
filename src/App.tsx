/**
 * 主应用组件
 * 整合所有功能模块
 */

import React from 'react';
import { WalletProvider } from '@/contexts/WalletContext';
import { ExchangeSection } from '@/components/home/ExchangeSection';
import { StatsSection } from '@/components/home/StatsSection';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* 统计信息区域 */}
          <section className="mb-8">
            <StatsSection />
          </section>
          
          {/* 代币交换区域 */}
          <section className="mb-8">
            <ExchangeSection />
          </section>
          
          {/* 功能介绍区域 */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-center mb-6">SocioMint 平台特色</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">代币交换</h3>
                  <p className="text-gray-600">使用BNB购买SM代币，享受早期投资优势</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">社交任务</h3>
                  <p className="text-gray-600">完成社交媒体任务，获得小红花奖励</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">空投奖励</h3>
                  <p className="text-gray-600">参与小红花空投池，获得额外代币奖励</p>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </WalletProvider>
  );
}

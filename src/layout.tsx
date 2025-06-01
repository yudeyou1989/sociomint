'use client';

import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { WagmiProvider } from '@/components/providers/WagmiProvider';
import I18nProvider from '@/components/providers/I18nProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wagmi提供器确保区块链功能在客户端正确工作 */}
        <WagmiProvider>
          {/* 国际化提供器支持中英文切换 */}
          <I18nProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </I18nProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}

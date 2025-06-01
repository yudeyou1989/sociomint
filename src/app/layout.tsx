import './globals.css';
import '../lib/polyfills';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { WalletProvider } from '@/contexts/WalletContext';
import { GlobalStateProvider } from '@/contexts/GlobalStateContext';
import { Inter } from 'next/font/google';
import { I18nProvider } from './I18nProvider';
import Web3Provider from '@/providers/Web3Provider';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorMonitoringProvider from '@/providers/ErrorMonitoringProvider';
import BlockchainMonitorProvider from '@/providers/BlockchainMonitorProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SocioMint - 社交媒体与区块链的结合',
  description: '通过社交媒体互动任务获取小红花，参与SM生态的创新平台。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ErrorMonitoringProvider>
          <ErrorBoundary componentName="RootLayout">
            <I18nProvider>
              <Web3Provider>
                <BlockchainMonitorProvider>
                  <GlobalStateProvider>
                    <WalletProvider>
                      <PageLayout>{children}</PageLayout>
                      <Toaster position="top-center" />
                    </WalletProvider>
                  </GlobalStateProvider>
                </BlockchainMonitorProvider>
              </Web3Provider>
            </I18nProvider>
          </ErrorBoundary>
        </ErrorMonitoringProvider>
      </body>
    </html>
  );
}

import './globals.css';
import '../lib/polyfills';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';
import PageLayout from '@/components/layout/PageLayout';
import { GlobalStateProvider } from '@/contexts/GlobalStateContext';
import { Inter } from 'next/font/google';
import { I18nProvider } from './I18nProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorMonitoringProvider from '@/providers/ErrorMonitoringProvider';
import ClientProviders from '@/components/providers/ClientProviders';
import PerformanceMonitor from '@/components/debug/PerformanceMonitor';
import ResourcePreloader from '@/components/common/ResourcePreloader';
import MobileOptimizer from '@/components/common/MobileOptimizer';
import { LoadingStateProvider, PageLoadingOverlay } from '@/components/common/LoadingStateManager';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

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
              <GlobalStateProvider>
                <LoadingStateProvider>
                  <ClientProviders>
                    <ResourcePreloader />
                    <MobileOptimizer />
                    <PageLayout>{children}</PageLayout>
                    <PageLoadingOverlay />
                    <Toaster position="top-center" />
                    <GoogleAnalytics />
                    {process.env.NODE_ENV === 'development' && (
                      <PerformanceMonitor />
                    )}
                  </ClientProviders>
                </LoadingStateProvider>
              </GlobalStateProvider>
            </I18nProvider>
          </ErrorBoundary>
        </ErrorMonitoringProvider>
      </body>
    </html>
  );
}

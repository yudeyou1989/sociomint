'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// 通用加载组件
const LoadingFallback = ({ message = '加载中...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-8">
    <div className="w-8 h-8 border-4 border-[#0de5ff] border-t-transparent rounded-full animate-spin"></div>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

const LoadingCard = () => (
  <div className="animate-pulse bg-gray-800/50 rounded-lg p-6">
    <div className="h-4 bg-gray-700/50 rounded mb-2"></div>
    <div className="h-4 bg-gray-700/50 rounded mb-2 w-3/4"></div>
    <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
  </div>
);

const LoadingTable = () => (
  <div className="animate-pulse">
    <div className="h-12 bg-gray-800/50 rounded-lg mb-4"></div>
    {[1, 2, 3].map(i => (
      <div key={i} className="h-16 bg-gray-800/50 rounded-lg mb-2"></div>
    ))}
  </div>
);

// 错误边界组件
const ErrorFallback = ({ error, retry }: { error: Error; retry?: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6">
    <div className="text-red-400 text-lg font-semibold">加载失败</div>
    <p className="text-gray-400 text-sm text-center">{error.message}</p>
    {retry && (
      <button
        onClick={retry}
        className="px-4 py-2 bg-[#0de5ff] text-white rounded-lg hover:bg-[#0bc9e0] transition-colors"
      >
        重试
      </button>
    )}
  </div>
);

// 高阶组件：为动态组件添加加载状态和错误处理
const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  loadingMessage?: string
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  );
};

// 懒加载的主要组件
export const LazyTokenExchange = dynamic(
  () => import('@/components/exchange/TokenExchange'),
  {
    loading: () => <LoadingFallback message="加载代币交换..." />,
    ssr: false
  }
);

export const LazySocialTaskList = dynamic(
  () => import('@/components/social/SocialTaskList'),
  {
    loading: () => <LoadingFallback message="加载社交任务..." />,
    ssr: false
  }
);

export const LazyReferralSystem = dynamic(
  () => import('@/components/social/ReferralSystem'),
  {
    loading: () => <LoadingFallback message="加载推荐系统..." />,
    ssr: false
  }
);

export const LazyWeeklyRewardStatus = dynamic(
  () => import('@/components/social/WeeklyRewardStatus'),
  {
    loading: () => <LoadingFallback message="加载奖励状态..." />,
    ssr: false
  }
);

// 页面级组件懒加载
export const LazyTasksPage = dynamic(() => import('@/app/tasks/page'), {
  loading: () => <LoadingFallback message="加载任务页面..." />,
  ssr: false
});

export const LazyExchangePage = dynamic(() => import('@/app/exchange/page'), {
  loading: () => <LoadingFallback message="加载兑换页面..." />,
  ssr: false
});

export const LazyMarketPage = dynamic(() => import('@/app/market/page'), {
  loading: () => <LoadingFallback message="加载市场页面..." />,
  ssr: false
});

export const LazyProfilePage = dynamic(() => import('@/app/profile/page'), {
  loading: () => <LoadingFallback message="加载个人资料..." />,
  ssr: false
});

export const LazyVaultPage = dynamic(() => import('@/app/vault/page'), {
  loading: () => <LoadingFallback message="加载金库页面..." />,
  ssr: false
});

export const LazySocialTasksPage = dynamic(() => import('@/app/social-tasks/page'), {
  loading: () => <LoadingFallback message="加载社交任务..." />,
  ssr: false
});

// 钱包相关组件
export const LazyWalletSelectModal = dynamic(() => import('@/components/wallet/WalletSelectModal'), {
  loading: () => <LoadingCard />,
  ssr: false
});

// 任务相关组件
export const LazyTaskCard = dynamic(() => import('@/components/tasks/TaskCard'), {
  loading: () => <LoadingCard />,
  ssr: false
});

// 注意：以下组件暂时注释，因为对应的文件不存在
// 在实际实现这些组件后，可以取消注释

// export const LazyAirdropPool = dynamic(
//   () => import('@/components/airdrop/AirdropPool'),
//   {
//     loading: () => <LoadingFallback message="加载空投池..." />,
//     ssr: false
//   }
// );

// export const LazyMarketOverview = dynamic(
//   () => import('@/components/market/MarketOverview'),
//   {
//     loading: () => <LoadingFallback message="加载市场概览..." />,
//     ssr: false
//   }
// );

// export const LazyAssetManagement = dynamic(
//   () => import('@/components/assets/AssetManagement'),
//   {
//     loading: () => <LoadingFallback message="加载资产管理..." />,
//     ssr: false
//   }
// );

// export const LazyVaultManagement = dynamic(
//   () => import('@/components/vault/VaultManagement'),
//   {
//     loading: () => <LoadingFallback message="加载金库管理..." />,
//     ssr: false
//   }
// );

// 图表组件懒加载
// export const LazyPriceChart = dynamic(
//   () => import('@/components/charts/PriceChart'),
//   {
//     loading: () => <LoadingFallback message="加载价格图表..." />,
//     ssr: false
//   }
// );

// export const LazyVolumeChart = dynamic(
//   () => import('@/components/charts/VolumeChart'),
//   {
//     loading: () => <LoadingFallback message="加载交易量图表..." />,
//     ssr: false
//   }
// );

// 管理面板组件懒加载
// export const LazyAdminPanel = dynamic(
//   () => import('@/components/admin/AdminPanel'),
//   {
//     loading: () => <LoadingFallback message="加载管理面板..." />,
//     ssr: false
//   }
// );

// 导出工具函数
export { withLazyLoading, LoadingFallback, ErrorFallback };

// 预加载函数
export const preloadComponents = {
  tokenExchange: () => import('@/components/exchange/TokenExchange'),
  socialTasks: () => import('@/components/social/SocialTaskList'),
  referralSystem: () => import('@/components/social/ReferralSystem'),
  // airdropPool: () => import('@/components/airdrop/AirdropPool'),
  // marketOverview: () => import('@/components/market/MarketOverview'),
  // assetManagement: () => import('@/components/assets/AssetManagement'),
  // vaultManagement: () => import('@/components/vault/VaultManagement'),
};

// 路由预加载钩子
export const useRoutePreload = () => {
  const preloadRoute = (routeName: keyof typeof preloadComponents) => {
    if (typeof window !== 'undefined') {
      preloadComponents[routeName]();
    }
  };

  return { preloadRoute };
};

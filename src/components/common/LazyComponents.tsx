'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// 通用加载组件
const LoadingFallback = ({ message = '加载中...' }: { message?: string }) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    minHeight="200px"
    gap={2}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// 错误边界组件
const ErrorFallback = ({ error, retry }: { error: Error; retry?: () => void }) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    minHeight="200px"
    gap={2}
    p={3}
  >
    <Typography variant="h6" color="error">
      加载失败
    </Typography>
    <Typography variant="body2" color="text.secondary" textAlign="center">
      {error.message}
    </Typography>
    {retry && (
      <button 
        onClick={retry}
        style={{
          padding: '8px 16px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        重试
      </button>
    )}
  </Box>
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

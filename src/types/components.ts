/**
 * 组件Props类型定义
 * 为所有React组件提供类型安全
 */

import React from 'react';
import { 
  WalletBalance, 
  Transaction, 
  SocialTask, 
  FlowerBalance, 
  AirdropPool,
  ExchangeStats,
  UserStats
} from './global';

// 基础组件Props
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
  id?: string;
}

// 布局组件Props
export interface HeaderProps extends BaseProps {
  showWalletButton?: boolean;
  showLanguageSwitch?: boolean;
  onMenuToggle?: () => void;
}

export interface FooterProps extends BaseProps {
  showSocialLinks?: boolean;
  showLegalLinks?: boolean;
}

export interface PageLayoutProps extends BaseProps {
  title?: string;
  description?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

// 钱包组件Props
export interface WalletConnectButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  showBalance?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface WalletBalanceDisplayProps extends BaseProps {
  balance?: WalletBalance;
  showRefreshButton?: boolean;
  showQuickActions?: boolean;
  onRefresh?: () => void;
}

export interface WalletSelectorProps extends BaseProps {
  onSelect: (walletType: string) => void;
  availableWallets: Array<{
    type: string;
    name: string;
    icon: string;
    installed: boolean;
  }>;
}

// 交换组件Props
export interface ExchangeSectionProps extends BaseProps {
  stats?: ExchangeStats;
  onExchange?: (bnbAmount: string) => Promise<void>;
  isLoading?: boolean;
}

export interface TokenExchangeProps extends BaseProps {
  currentPrice?: string;
  minAmount?: string;
  maxAmount?: string;
  onExchange?: (amount: string) => Promise<void>;
}

export interface ExchangeFormProps extends BaseProps {
  onSubmit: (data: { bnbAmount: string; slippage: number }) => void;
  isLoading?: boolean;
  minAmount?: number;
  maxAmount?: number;
  currentPrice?: string;
}

// 统计组件Props
export interface StatsSectionProps extends BaseProps {
  stats?: ExchangeStats;
  userStats?: UserStats;
  refreshInterval?: number;
  onRefresh?: () => void;
}

export interface StatsCardProps extends BaseProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
}

// 交易组件Props
export interface TransactionHistoryProps extends BaseProps {
  transactions?: Transaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  pageSize?: number;
  showFilters?: boolean;
}

export interface TransactionItemProps extends BaseProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  showDetails?: boolean;
}

export interface TransactionFilterProps extends BaseProps {
  onFilterChange: (filters: {
    type?: string;
    status?: string;
    dateRange?: [number, number];
  }) => void;
  currentFilters?: any;
}

// 社交任务组件Props
export interface SocialTaskListProps extends BaseProps {
  tasks?: SocialTask[];
  isLoading?: boolean;
  onTaskClick?: (task: SocialTask) => void;
  onRefresh?: () => void;
  showCompleted?: boolean;
}

export interface SocialTaskCardProps extends BaseProps {
  task: SocialTask;
  onParticipate?: (taskId: string) => void;
  onViewDetails?: (taskId: string) => void;
  isParticipated?: boolean;
  isCompleted?: boolean;
}

export interface TaskSubmissionFormProps extends BaseProps {
  task: SocialTask;
  onSubmit: (data: {
    url?: string;
    screenshot?: File;
    proof?: string;
    content?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

// 小红花组件Props
export interface FlowerBalanceProps extends BaseProps {
  balance?: FlowerBalance;
  showHistory?: boolean;
  onRefresh?: () => void;
}

export interface FlowerExchangeProps extends BaseProps {
  flowerBalance?: number;
  smBalance?: string;
  exchangeRate?: {
    flowerToSm: number;
    smToFlower: number;
  };
  onExchange?: (amount: number, direction: 'flowerToSm' | 'smToFlower') => Promise<void>;
}

// 空投组件Props
export interface AirdropPoolListProps extends BaseProps {
  pools?: AirdropPool[];
  isLoading?: boolean;
  onPoolClick?: (pool: AirdropPool) => void;
  onRefresh?: () => void;
}

export interface AirdropPoolCardProps extends BaseProps {
  pool: AirdropPool;
  onParticipate?: (poolId: string, amount: number) => void;
  onViewDetails?: (poolId: string) => void;
  userParticipation?: {
    participated: boolean;
    amount?: number;
    reward?: string;
  };
}

export interface AirdropParticipationFormProps extends BaseProps {
  pool: AirdropPool;
  userFlowerBalance: number;
  onSubmit: (amount: number) => Promise<void>;
  isSubmitting?: boolean;
}

// 表单组件Props
export interface FormFieldProps extends BaseProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export interface InputFieldProps extends FormFieldProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'url';
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
}

export interface SelectFieldProps extends FormFieldProps {
  value?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export interface TextAreaFieldProps extends FormFieldProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  onChange?: (value: string) => void;
}

// UI组件Props
export interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface ModalProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  maskClosable?: boolean;
  footer?: React.ReactNode;
}

export interface TooltipProps extends BaseProps {
  content: string | React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  disabled?: boolean;
}

export interface LoadingProps extends BaseProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

export interface AlertProps extends BaseProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  closable?: boolean;
  onClose?: () => void;
  action?: React.ReactNode;
}

// 管理员组件Props
export interface AdminPanelProps extends BaseProps {
  onAction?: (action: string, data?: any) => void;
}

export interface AdminStatsProps extends BaseProps {
  stats?: {
    totalUsers: number;
    totalTransactions: number;
    totalVolume: string;
    activeTasks: number;
  };
  onRefresh?: () => void;
}

export interface UserManagementProps extends BaseProps {
  users?: Array<{
    id: string;
    address: string;
    isVerified: boolean;
    createdAt: number;
  }>;
  onUserAction?: (userId: string, action: 'verify' | 'ban' | 'unban') => void;
}

// 错误组件Props
export interface ErrorBoundaryProps extends BaseProps {
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorDisplayProps extends BaseProps {
  error: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

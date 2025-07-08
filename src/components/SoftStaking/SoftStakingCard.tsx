/**
 * 软质押持币验证卡片组件
 * 显示用户的软质押状态、奖励信息和持币统计
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  LinearProgress, 
  Chip,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  AccountBalanceWallet,
  TrendingUp,
  Schedule,
  LocalFlorist,
  Info,
  Refresh
} from '@mui/icons-material';
import { useAccount } from 'wagmi';
import { formatEther } from 'ethers';
import { toast } from 'react-hot-toast';
import SoftStakingService, { SoftStakingSession, SoftStakingConfig } from '@/lib/services/softStakingService';

interface SoftStakingStats {
  activeSession: SoftStakingSession | null;
  minBalance24h: string;
  isEligible: boolean;
  todayReward: string;
  totalRewards: number;
  avgDailyReward: number;
  config: SoftStakingConfig | null;
}

export default function SoftStakingCard() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<SoftStakingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载用户软质押统计
  const loadStats = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      const userStats = await SoftStakingService.getUserStats(address);
      setStats(userStats);
    } catch (error) {
      console.error('加载软质押统计失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    if (!address) return;

    try {
      setIsRefreshing(true);
      // 先记录当前余额快照
      await SoftStakingService.recordBalanceSnapshot(address);
      // 然后重新加载统计
      await loadStats();
      toast.success('数据已刷新');
    } catch (error) {
      console.error('刷新数据失败:', error);
      toast.error('刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 格式化数字
  const formatNumber = (num: number | string, decimals: number = 2): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return n.toLocaleString('zh-CN', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  // 格式化时间
  const formatDuration = (hours: number): string => {
    if (hours < 24) {
      return `${hours} 小时`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} 天 ${remainingHours} 小时`;
  };

  // 计算奖励进度
  const getRewardProgress = (): number => {
    if (!stats?.config) return 0;
    const minBalance = parseFloat(stats.minBalance24h);
    const threshold = parseFloat(stats.config.min_balance_threshold);
    return Math.min((minBalance / threshold) * 100, 100);
  };

  // 获取状态颜色
  const getStatusColor = (): 'success' | 'warning' | 'error' | 'info' => {
    if (!stats) return 'info';
    if (stats.isEligible) return 'success';
    if (stats.activeSession) return 'warning';
    return 'error';
  };

  // 获取状态文本
  const getStatusText = (): string => {
    if (!stats) return '加载中...';
    if (stats.isEligible) return '符合奖励条件';
    if (stats.activeSession) return '持币中，未达到奖励条件';
    return '未开始持币';
  };

  useEffect(() => {
    if (isConnected && address) {
      loadStats();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <AccountBalanceWallet sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            请连接钱包查看软质押状态
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            加载软质押数据中...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        {/* 标题和刷新按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            软质押持币奖励
          </Typography>
          <Tooltip title="刷新数据">
            <IconButton onClick={handleRefresh} disabled={isRefreshing}>
              <Refresh sx={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 状态指示 */}
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={getStatusText()}
            color={getStatusColor()}
            icon={<LocalFlorist />}
            sx={{ mb: 2 }}
          />
          
          {stats?.config && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                持币满 {stats.config.min_holding_hours} 小时且余额不低于 {formatNumber(stats.config.min_balance_threshold)} SM 即可获得每日奖励
              </Typography>
            </Alert>
          )}
        </Box>

        {/* 核心数据 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {formatNumber(stats?.minBalance24h || '0')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                24小时最低余额 (SM)
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="secondary">
                {formatNumber(stats?.todayReward || '0')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今日可获得奖励 (小红花)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* 奖励进度条 */}
        {stats?.config && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">奖励进度</Typography>
              <Typography variant="body2">
                {formatNumber(getRewardProgress(), 1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getRewardProgress()} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              需要至少 {formatNumber(stats.config.min_balance_threshold)} SM 才能获得奖励
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 活跃会话信息 */}
        {stats?.activeSession && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Schedule sx={{ mr: 1 }} />
              当前持币会话
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">持币时长</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatDuration(stats.activeSession.duration_hours)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">最低余额</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatNumber(stats.activeSession.min_balance)} SM
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">最高余额</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatNumber(stats.activeSession.max_balance)} SM
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">平均余额</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatNumber(stats.activeSession.avg_balance)} SM
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* 奖励统计 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 1 }} />
            奖励统计 (最近7天)
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">累计奖励</Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatNumber(stats?.totalRewards || 0)} 小红花
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">平均每日</Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatNumber(stats?.avgDailyReward || 0)} 小红花
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* 说明信息 */}
        <Alert severity="info" icon={<Info />}>
          <Typography variant="body2">
            软质押无需锁定代币，系统每小时记录您的余额快照。
            只要24小时内最低余额达到要求，即可获得每日小红花奖励。
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  LocalFlorist,
  AccessTime,
  TrendingUp,
  EmojiEvents,
  AccountBalanceWallet,
  Refresh,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { useAccount, useContractWrite, useContractRead } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { useDailyReward } from '@/hooks/useDailyReward';
import { formatNumber, formatTimeRemaining } from '@/utils/format';

interface DailyFlowerCardProps {
  className?: string;
}

export const DailyFlowerCard: React.FC<DailyFlowerCardProps> = ({ className }) => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 自定义 Hook
  const {
    userRewardInfo,
    canClaim,
    nextClaimTime,
    isLoadingData,
    refetch
  } = useDailyReward(refreshKey);
  
  // 自动刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // 每30秒刷新一次
    
    return () => clearInterval(interval);
  }, []);
  
  // 合约写入
  const { writeAsync: claimDailyFlowers } = useContractWrite({
    address: process.env.NEXT_PUBLIC_SM_TOKEN_EXCHANGE_ADDRESS as `0x${string}`,
    abi: [
      {
        name: 'claimDailyFlowers',
        type: 'function',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable'
      }
    ],
    functionName: 'claimDailyFlowers'
  });
  
  // 处理领取每日奖励
  const handleClaimDailyReward = async () => {
    if (!isConnected || !address) {
      toast.error(t('wallet.connectFirst'));
      return;
    }
    
    if (!canClaim) {
      toast.error(t('dailyReward.alreadyClaimed'));
      return;
    }
    
    if (!userRewardInfo?.dailyFlowers || userRewardInfo.dailyFlowers === 0) {
      toast.error(t('dailyReward.noRewardAvailable'));
      return;
    }
    
    try {
      setIsLoading(true);
      
      const tx = await claimDailyFlowers();
      
      toast.success(t('dailyReward.claimSubmitted'));
      
      // 等待交易确认
      // await waitForTransaction({ hash: tx.hash });
      
      toast.success(t('dailyReward.claimConfirmed'));
      refetch();
      
    } catch (error: any) {
      console.error('Daily reward claim error:', error);
      toast.error(error.message || t('dailyReward.claimFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // 计算倒计时
  const getCountdownText = () => {
    if (!nextClaimTime) return '';
    
    const now = Date.now() / 1000;
    const remaining = nextClaimTime - now;
    
    if (remaining <= 0) {
      return t('dailyReward.canClaimNow');
    }
    
    return formatTimeRemaining(remaining);
  };
  
  // 计算持币奖励比例
  const getRewardRatio = () => {
    if (!userRewardInfo?.smBalance) return 0;
    
    const smBalance = parseFloat(formatEther(userRewardInfo.smBalance));
    const maxRewardSm = 10000; // 最大奖励对应的 SM 数量
    
    return Math.min((smBalance / maxRewardSm) * 100, 100);
  };
  
  // 渲染状态指示器
  const renderStatusIndicator = () => {
    if (!isConnected) {
      return (
        <Chip 
          label={t('wallet.notConnected')} 
          color="default" 
          size="small"
          icon={<AccountBalanceWallet />}
        />
      );
    }
    
    if (canClaim && userRewardInfo?.dailyFlowers > 0) {
      return (
        <Chip 
          label={t('dailyReward.canClaim')} 
          color="success" 
          size="small"
          icon={<CheckCircle />}
        />
      );
    }
    
    if (!canClaim) {
      return (
        <Chip 
          label={t('dailyReward.alreadyClaimed')} 
          color="info" 
          size="small"
          icon={<Schedule />}
        />
      );
    }
    
    return (
      <Chip 
        label={t('dailyReward.noReward')} 
        color="warning" 
        size="small"
        icon={<LocalFlorist />}
      />
    );
  };
  
  if (isLoadingData) {
    return (
      <Card className={className}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        className={className}
        sx={{
          background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
          color: 'white',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* 背景装饰 */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0
          }}
        />
        
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          {/* 头部 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <LocalFlorist />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {t('dailyReward.title')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {t('dailyReward.subtitle')}
                </Typography>
              </Box>
            </Box>
            
            <Button
              size="small"
              onClick={() => refetch()}
              sx={{ color: 'white', minWidth: 'auto' }}
            >
              <Refresh />
            </Button>
          </Box>
          
          {/* 状态指示器 */}
          <Box sx={{ mb: 3 }}>
            {renderStatusIndicator()}
          </Box>
          
          {/* 用户持币信息 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary.light">
                {userRewardInfo ? formatNumber(parseFloat(formatEther(userRewardInfo.smBalance))) : '0'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {t('dailyReward.smBalance')}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="secondary.light">
                {userRewardInfo ? formatNumber(userRewardInfo.dailyFlowers) : '0'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {t('dailyReward.dailyFlowers')}
              </Typography>
            </Box>
          </Box>
          
          {/* 奖励进度条 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {t('dailyReward.rewardProgress')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {getRewardRatio().toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getRewardRatio()} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)'
                }
              }} 
            />
            <Typography variant="caption" sx={{ opacity: 0.6, mt: 1, display: 'block' }}>
              {t('dailyReward.maxReward', { amount: '200' })}
            </Typography>
          </Box>
          
          {/* 倒计时信息 */}
          {!canClaim && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '& .MuiAlert-icon': { color: 'white' }
              }}
            >
              <Typography variant="body2">
                {t('dailyReward.nextClaimIn')}: {getCountdownText()}
              </Typography>
            </Alert>
          )}
          
          {/* 领取按钮 */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleClaimDailyReward}
            disabled={isLoading || !isConnected || !canClaim || !userRewardInfo?.dailyFlowers}
            sx={{
              background: canClaim && userRewardInfo?.dailyFlowers > 0 
                ? 'linear-gradient(45deg, #FFD700, #FFA500)' 
                : 'rgba(255, 255, 255, 0.3)',
              fontWeight: 'bold',
              py: 1.5,
              mb: 2,
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : canClaim && userRewardInfo?.dailyFlowers > 0 ? (
              t('dailyReward.claimButton')
            ) : (
              t('dailyReward.cannotClaim')
            )}
          </Button>
          
          {/* 统计信息 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                {t('dailyReward.totalClaimed')}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {userRewardInfo ? formatNumber(userRewardInfo.totalClaimed) : '0'}
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                {t('dailyReward.formula')}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                500 SM = 10 🌸
              </Typography>
            </Box>
          </Box>
          
          {/* 提示信息 */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              💡 {t('dailyReward.tip')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

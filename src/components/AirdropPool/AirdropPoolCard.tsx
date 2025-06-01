'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Box, 
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  Alert
} from '@mui/material';
import { 
  LocalFlorist, 
  AccessTime, 
  TrendingUp, 
  EmojiEvents,
  AccountBalanceWallet,
  Refresh
} from '@mui/icons-material';
import { useAccount, useContractWrite, useContractRead } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { useAirdropPool } from '@/hooks/useAirdropPool';
import { formatNumber, formatTimeRemaining } from '@/utils/format';

interface AirdropPoolCardProps {
  className?: string;
}

export const AirdropPoolCard: React.FC<AirdropPoolCardProps> = ({ className }) => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  
  // 状态管理
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 自定义 Hook
  const {
    currentRound,
    userDeposit,
    userBalance,
    poolConfig,
    isLoadingData,
    refetch
  } = useAirdropPool(refreshKey);
  
  // 自动刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 5000); // 每5秒刷新一次
    
    return () => clearInterval(interval);
  }, []);
  
  // 合约写入
  const { writeAsync: depositFlowers } = useContractWrite({
    address: process.env.NEXT_PUBLIC_AIRDROP_POOL_ADDRESS as `0x${string}`,
    abi: [
      {
        name: 'depositFlowers',
        type: 'function',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable'
      }
    ],
    functionName: 'depositFlowers'
  });
  
  // 处理投入小红花
  const handleDeposit = async () => {
    if (!isConnected || !address) {
      toast.error(t('wallet.connectFirst'));
      return;
    }
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error(t('airdrop.invalidAmount'));
      return;
    }
    
    const amount = parseEther(depositAmount);
    
    // 验证金额范围
    if (poolConfig) {
      if (amount < poolConfig.minDeposit) {
        toast.error(t('airdrop.belowMinimum', { min: formatEther(poolConfig.minDeposit) }));
        return;
      }
      if (amount > poolConfig.maxDeposit) {
        toast.error(t('airdrop.aboveMaximum', { max: formatEther(poolConfig.maxDeposit) }));
        return;
      }
    }
    
    // 检查余额
    if (userBalance && amount > userBalance.redFlower) {
      toast.error(t('airdrop.insufficientBalance'));
      return;
    }
    
    // 检查是否已投入
    if (userDeposit && userDeposit.amount > 0) {
      toast.error(t('airdrop.alreadyDeposited'));
      return;
    }
    
    try {
      setIsLoading(true);
      
      const tx = await depositFlowers({
        args: [amount]
      });
      
      toast.success(t('airdrop.depositSubmitted'));
      
      // 等待交易确认
      // await waitForTransaction({ hash: tx.hash });
      
      toast.success(t('airdrop.depositConfirmed'));
      setDepositAmount('');
      refetch();
      
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || t('airdrop.depositFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // 计算预期奖励
  const calculateExpectedReward = () => {
    if (!currentRound || !depositAmount || !poolConfig) return 0;
    
    const userAmount = parseFloat(depositAmount);
    const totalDeposits = parseFloat(formatEther(currentRound.totalDeposits)) + userAmount;
    const weeklyReward = parseFloat(formatEther(poolConfig.weeklySmAmount));
    
    return (userAmount / totalDeposits) * weeklyReward;
  };
  
  // 渲染倒计时
  const renderCountdown = () => {
    if (!currentRound) return null;
    
    const now = Date.now() / 1000;
    const endTime = Number(currentRound.endTime);
    const remaining = endTime - now;
    
    if (remaining <= 0) {
      return (
        <Chip 
          label={t('airdrop.roundEnded')} 
          color="error" 
          size="small"
          icon={<AccessTime />}
        />
      );
    }
    
    return (
      <Chip 
        label={formatTimeRemaining(remaining)} 
        color="primary" 
        size="small"
        icon={<AccessTime />}
      />
    );
  };
  
  // 渲染进度条
  const renderProgress = () => {
    if (!currentRound || !poolConfig) return null;
    
    const totalDeposits = parseFloat(formatEther(currentRound.totalDeposits));
    const maxCapacity = parseFloat(formatEther(poolConfig.weeklySmAmount)) * 100; // 假设最大容量
    const progress = Math.min((totalDeposits / maxCapacity) * 100, 100);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('airdrop.poolProgress')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)'
            }
          }} 
        />
      </Box>
    );
  };
  
  if (isLoadingData) {
    return (
      <Card className={className}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <LinearProgress sx={{ width: '100%' }} />
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            top: -50,
            right: -50,
            width: 150,
            height: 150,
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
                  {t('airdrop.title')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {t('airdrop.subtitle')}
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
          
          {/* 倒计时 */}
          <Box sx={{ mb: 3 }}>
            {renderCountdown()}
          </Box>
          
          {/* 统计信息 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary.light">
                {currentRound ? formatNumber(parseFloat(formatEther(currentRound.totalDeposits))) : '0'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {t('airdrop.totalDeposits')}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="secondary.light">
                {currentRound ? currentRound.participantCount.toString() : '0'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {t('airdrop.participants')}
              </Typography>
            </Box>
          </Box>
          
          {/* 进度条 */}
          {renderProgress()}
          
          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          
          {/* 用户信息 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.8 }}>
              {t('airdrop.myBalance')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalFlorist color="primary" />
              <Typography variant="h6" fontWeight="bold">
                {userBalance ? formatNumber(parseFloat(formatEther(userBalance.redFlower))) : '0'}
              </Typography>
            </Box>
          </Box>
          
          {/* 当前投入 */}
          {userDeposit && userDeposit.amount > 0 && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '& .MuiAlert-icon': { color: 'white' }
              }}
            >
              {t('airdrop.currentDeposit', { 
                amount: formatNumber(parseFloat(formatEther(userDeposit.amount))) 
              })}
            </Alert>
          )}
          
          {/* 投入表单 */}
          {(!userDeposit || userDeposit.amount === 0) && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label={t('airdrop.depositAmount')}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                type="number"
                placeholder="0"
                disabled={isLoading}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: 'white' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
              
              {depositAmount && (
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                  {t('airdrop.expectedReward', { 
                    amount: formatNumber(calculateExpectedReward()) 
                  })}
                </Typography>
              )}
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleDeposit}
                disabled={isLoading || !isConnected || !depositAmount}
                sx={{
                  background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                  fontWeight: 'bold',
                  py: 1.5
                }}
              >
                {isLoading ? t('common.loading') : t('airdrop.depositButton')}
              </Button>
            </Box>
          )}
          
          {/* 底部信息 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              {t('airdrop.nextRound')}
            </Typography>
            <Chip 
              label={poolConfig ? `${formatNumber(parseFloat(formatEther(poolConfig.weeklySmAmount)))} SM` : '0 SM'}
              size="small"
              icon={<EmojiEvents />}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

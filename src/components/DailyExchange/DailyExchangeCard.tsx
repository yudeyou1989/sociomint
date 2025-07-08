/**
 * 每日限量兑换卡片组件
 * 实现每日50万SM的限量兑换功能
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField,
  LinearProgress, 
  Chip,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  SwapHoriz,
  TrendingUp,
  Schedule,
  LocalFlorist,
  Info,
  Refresh,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import DailyExchangeService, { 
  DailyExchangePool, 
  ExchangeRecord,
  ExchangeEligibility 
} from '@/lib/services/dailyExchangeService';

interface ExchangeStats {
  pool: DailyExchangePool | null;
  utilizationRate: number;
  remainingPercentage: number;
  estimatedHoursToSellOut: number;
  currentRate: string;
  rateChanges: number;
  avgParticipation: number;
}

export default function DailyExchangeCard() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<ExchangeStats | null>(null);
  const [todayExchange, setTodayExchange] = useState<ExchangeRecord | null>(null);
  const [flowersAmount, setFlowersAmount] = useState('');
  const [eligibility, setEligibility] = useState<ExchangeEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载兑换统计和用户数据
  const loadData = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      const [exchangeStats, userTodayExchange] = await Promise.all([
        DailyExchangeService.getExchangeStats(),
        DailyExchangeService.getUserTodayExchange(address)
      ]);
      
      setStats(exchangeStats);
      setTodayExchange(userTodayExchange);
    } catch (error) {
      console.error('加载兑换数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 检查兑换资格
  const checkEligibility = async (amount: string) => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      setEligibility(null);
      return;
    }

    try {
      const result = await DailyExchangeService.checkEligibility(address, amount);
      setEligibility(result);
    } catch (error) {
      console.error('检查兑换资格失败:', error);
      setEligibility({ eligible: false, reason: 'check_failed' });
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadData();
      if (flowersAmount) {
        await checkEligibility(flowersAmount);
      }
      toast.success('数据已刷新');
    } catch (error) {
      console.error('刷新数据失败:', error);
      toast.error('刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 执行兑换
  const handleExchange = async () => {
    if (!address || !flowersAmount || !eligibility?.eligible) {
      toast.error('兑换条件不满足');
      return;
    }

    try {
      setIsExchanging(true);
      
      // 这里应该先调用智能合约扣除小红花
      // 然后再调用后端记录兑换
      const result = await DailyExchangeService.executeExchange(
        address,
        flowersAmount
      );

      if (result.success) {
        toast.success(`兑换成功！获得 ${result.sm_amount} SM代币`);
        setFlowersAmount('');
        setEligibility(null);
        await loadData();
      } else {
        toast.error(`兑换失败: ${result.error}`);
      }
    } catch (error) {
      console.error('兑换失败:', error);
      toast.error('兑换失败');
    } finally {
      setIsExchanging(false);
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

  // 获取状态颜色
  const getStatusColor = (): 'success' | 'warning' | 'error' | 'info' => {
    if (!stats?.pool) return 'info';
    if (todayExchange) return 'success';
    if (stats.remainingPercentage < 10) return 'error';
    if (stats.remainingPercentage < 30) return 'warning';
    return 'info';
  };

  // 获取状态文本
  const getStatusText = (): string => {
    if (!stats?.pool) return '加载中...';
    if (todayExchange) return '今日已兑换';
    if (stats.remainingPercentage < 1) return '今日额度已用完';
    return `剩余 ${formatNumber(stats.remainingPercentage, 1)}%`;
  };

  // 处理输入变化
  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFlowersAmount(value);
    
    // 防抖检查资格
    const timeoutId = setTimeout(() => {
      checkEligibility(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  useEffect(() => {
    if (isConnected && address) {
      loadData();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <SwapHoriz sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            请连接钱包使用每日兑换功能
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
            加载兑换数据中...
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
            每日限量兑换
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
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              每日限量 50万 SM代币，先到先得！当前兑换比例：1 SM = {stats?.currentRate || '100'} 小红花
            </Typography>
          </Alert>
        </Box>

        {/* 兑换池状态 */}
        {stats?.pool && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">今日进度</Typography>
              <Typography variant="body2">
                {formatNumber(stats.pool.sm_exchanged)} / {formatNumber(stats.pool.total_sm_available)} SM
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.utilizationRate * 100} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              参与人数: {stats.pool.total_participants} | 当前比例: {stats.currentRate} 小红花/SM
            </Typography>
          </Box>
        )}

        {/* 今日兑换记录 */}
        {todayExchange && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              今日已兑换: {formatNumber(todayExchange.flowers_amount)} 小红花 → {formatNumber(todayExchange.sm_amount)} SM
            </Typography>
          </Alert>
        )}

        {/* 兑换表单 */}
        {!todayExchange && stats?.pool?.is_active && parseFloat(stats.pool.sm_remaining) > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              兑换小红花
            </Typography>
            
            <TextField
              fullWidth
              label="小红花数量"
              value={flowersAmount}
              onChange={handleAmountChange}
              type="number"
              inputProps={{ min: 100, step: 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">小红花</InputAdornment>
              }}
              sx={{ mb: 2 }}
              helperText="最少 100 小红花起兑"
            />

            {/* 兑换预览 */}
            {eligibility && (
              <Box sx={{ mb: 2 }}>
                {eligibility.eligible ? (
                  <Alert severity="success" icon={<CheckCircle />}>
                    <Typography variant="body2">
                      预计获得: {formatNumber(eligibility.required_sm || '0')} SM代币
                      {eligibility.bonus_multiplier && parseFloat(eligibility.bonus_multiplier) > 1 && (
                        <span> (含 {((parseFloat(eligibility.bonus_multiplier) - 1) * 100).toFixed(1)}% 等级奖励)</span>
                      )}
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="error" icon={<Warning />}>
                    <Typography variant="body2">
                      {eligibility.reason === 'below_minimum' && `最少需要 ${eligibility.min_required} 小红花`}
                      {eligibility.reason === 'already_exchanged' && '今日已兑换，请明天再来'}
                      {eligibility.reason === 'insufficient_pool_balance' && `池中余额不足，仅剩 ${eligibility.available_sm} SM`}
                      {eligibility.reason === 'exceeds_daily_flowers_limit' && `超出每日小红花限额 ${eligibility.max_allowed}`}
                      {eligibility.reason === 'exceeds_daily_sm_limit' && `超出每日SM限额 ${eligibility.max_allowed}`}
                      {!['below_minimum', 'already_exchanged', 'insufficient_pool_balance', 'exceeds_daily_flowers_limit', 'exceeds_daily_sm_limit'].includes(eligibility.reason || '') && '兑换条件不满足'}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            {/* 兑换按钮 */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleExchange}
              disabled={isExchanging || !eligibility?.eligible || !flowersAmount}
              sx={{
                background: eligibility?.eligible 
                  ? 'linear-gradient(45deg, #FF6B6B, #4ECDC4)' 
                  : 'rgba(255, 255, 255, 0.3)',
                fontWeight: 'bold',
                py: 1.5,
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              {isExchanging ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : eligibility?.eligible ? (
                '确认兑换'
              ) : (
                '请输入有效数量'
              )}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 统计信息 */}
        {stats && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">当前比例</Typography>
              <Typography variant="h6" fontWeight="bold">
                {stats.currentRate} 小红花/SM
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">剩余数量</Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatNumber(stats.pool?.sm_remaining || '0')} SM
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">参与人数</Typography>
              <Typography variant="h6" fontWeight="bold">
                {stats.pool?.total_participants || 0} 人
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">比例调整</Typography>
              <Typography variant="h6" fontWeight="bold">
                {stats.rateChanges} 次
              </Typography>
            </Grid>
          </Grid>
        )}

        {/* 说明信息 */}
        <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
          <Typography variant="body2">
            每日限量兑换，兑换比例根据需求动态调整。
            用户等级越高，可享受更优惠的兑换比例和更高的每日限额。
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * 小红花兑换卡片组件（升级版）
 * 支持动态兑换比例、分层奖励、每日限额等新功能
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
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  LocalFlorist,
  Info,
  Refresh,
  Warning,
  CheckCircle,
  Star,
  ExpandMore,
  History
} from '@mui/icons-material';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import RedFlowerExchangeService, { 
  RedFlowerBalance, 
  UserTier,
  ExchangeConfig,
  DailyExchangeStats,
  RedFlowerTransaction
} from '@/lib/services/redFlowerExchangeService';

interface UserInfo {
  balance: RedFlowerBalance | null;
  tier: UserTier | null;
  config: ExchangeConfig | null;
  dailyStats: DailyExchangeStats | null;
  recentTransactions: RedFlowerTransaction[];
  summary: {
    canExchange: boolean | null;
    tierLevel: string;
    dailyRemaining: string;
  };
}

export default function RedFlowerExchangeCard() {
  const { address, isConnected } = useAccount();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [flowersAmount, setFlowersAmount] = useState('');
  const [exchangeEstimate, setExchangeEstimate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载用户信息
  const loadUserInfo = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      const info = await RedFlowerExchangeService.getUserInfo(address);
      if (info) {
        setUserInfo(info);
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取兑换预估
  const getExchangeEstimate = async (amount: string) => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      setExchangeEstimate(null);
      return;
    }

    try {
      const estimate = await RedFlowerExchangeService.getExchangeEstimate(address, amount);
      setExchangeEstimate(estimate);
    } catch (error) {
      console.error('获取兑换预估失败:', error);
      setExchangeEstimate({ success: false, error: 'estimation_failed' });
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadUserInfo();
      if (flowersAmount) {
        await getExchangeEstimate(flowersAmount);
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
    if (!address || !flowersAmount || !exchangeEstimate?.success) {
      toast.error('兑换条件不满足');
      return;
    }

    try {
      setIsExchanging(true);
      
      const result = await RedFlowerExchangeService.executeExchange(
        address,
        flowersAmount,
        `兑换 ${flowersAmount} 小红花为 SM 代币`
      );

      if (result.success) {
        toast.success(`兑换成功！获得 ${result.sm_amount} SM代币`);
        setFlowersAmount('');
        setExchangeEstimate(null);
        await loadUserInfo();
      } else {
        const errorMessages = {
          insufficient_balance: '余额不足',
          below_minimum: `最少需要 ${result.min_required} 小红花`,
          exceeds_daily_limit: `超出每日限额 ${result.daily_limit}，今日已兑换 ${result.already_exchanged}`,
          user_balance_not_found: '用户余额记录不存在',
          exchange_config_not_found: '兑换配置不存在'
        };
        
        const errorMessage = errorMessages[result.error as keyof typeof errorMessages] || `兑换失败: ${result.error}`;
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('兑换失败:', error);
      toast.error('兑换失败');
    } finally {
      setIsExchanging(false);
    }
  };

  // 处理输入变化
  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFlowersAmount(value);
    
    // 防抖获取预估
    const timeoutId = setTimeout(() => {
      getExchangeEstimate(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // 格式化数字
  const formatNumber = (num: number | string, decimals: number = 2): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return n.toLocaleString('zh-CN', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  // 获取等级颜色
  const getTierColor = (tier: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    const colors = {
      basic: 'default' as const,
      verified: 'primary' as const,
      vip: 'secondary' as const,
      premium: 'warning' as const
    };
    return colors[tier as keyof typeof colors] || 'default';
  };

  // 获取等级标签
  const getTierLabel = (tier: string): string => {
    const labels = {
      basic: '基础用户',
      verified: '认证用户',
      vip: 'VIP用户',
      premium: '高级用户'
    };
    return labels[tier as keyof typeof labels] || tier;
  };

  useEffect(() => {
    if (isConnected && address) {
      loadUserInfo();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <LocalFlorist sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            请连接钱包使用小红花兑换功能
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
            加载小红花数据中...
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
            小红花兑换
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

        {/* 用户等级和余额 */}
        {userInfo && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Chip
                  label={getTierLabel(userInfo.summary.tierLevel)}
                  color={getTierColor(userInfo.summary.tierLevel)}
                  icon={<Star />}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  用户等级
                </Typography>
              </Box>

              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {formatNumber(userInfo.balance?.available_balance || '0')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  可用小红花
                </Typography>
              </Box>
            </Box>

            {/* 每日限额进度 */}
            {userInfo.config && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">今日兑换进度</Typography>
                  <Typography variant="body2">
                    {formatNumber(userInfo.dailyStats?.flowers_exchanged || '0')} / {formatNumber(userInfo.config.max_daily_exchange)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={userInfo.dailyStats ? 
                    (parseFloat(userInfo.dailyStats.flowers_exchanged) / parseFloat(userInfo.config.max_daily_exchange)) * 100 : 0
                  } 
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* 兑换表单 */}
        {userInfo?.summary.canExchange && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              兑换 SM 代币
            </Typography>
            
            <TextField
              fullWidth
              label="小红花数量"
              value={flowersAmount}
              onChange={handleAmountChange}
              type="number"
              slotProps={{
                htmlInput: {
                  min: userInfo.config?.min_exchange_amount || 100,
                  step: 1
                },
                input: {
                  endAdornment: <InputAdornment position="end">小红花</InputAdornment>
                }
              }}
              sx={{ mb: 2 }}
              helperText={`最少 ${userInfo.config?.min_exchange_amount || 100} 小红花起兑`}
            />

            {/* 兑换预览 */}
            {exchangeEstimate && (
              <Box sx={{ mb: 2 }}>
                {exchangeEstimate.success ? (
                  <Alert severity="success" icon={<CheckCircle />}>
                    <Typography variant="body2">
                      预计获得: <strong>{formatNumber(exchangeEstimate.estimated_sm)} SM</strong>
                    </Typography>
                    <Typography variant="body2">
                      兑换比例: {formatNumber(exchangeEstimate.exchange_rate)} 小红花/SM
                      {parseFloat(exchangeEstimate.bonus_multiplier) > 1 && (
                        <span> (含 {((parseFloat(exchangeEstimate.bonus_multiplier) - 1) * 100).toFixed(1)}% 等级奖励)</span>
                      )}
                    </Typography>
                    {parseFloat(exchangeEstimate.fee_amount) > 0 && (
                      <Typography variant="body2">
                        手续费: {formatNumber(exchangeEstimate.fee_amount)} 小红花
                      </Typography>
                    )}
                  </Alert>
                ) : (
                  <Alert severity="error" icon={<Warning />}>
                    <Typography variant="body2">
                      {exchangeEstimate.error === 'insufficient_balance' && `余额不足，可用: ${exchangeEstimate.available_balance} 小红花`}
                      {exchangeEstimate.error === 'below_minimum' && `最少需要 ${exchangeEstimate.min_required} 小红花`}
                      {exchangeEstimate.error === 'exceeds_daily_limit' && `超出每日限额，今日已兑换: ${exchangeEstimate.already_exchanged}`}
                      {!['insufficient_balance', 'below_minimum', 'exceeds_daily_limit'].includes(exchangeEstimate.error) && '兑换条件不满足'}
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
              disabled={isExchanging || !exchangeEstimate?.success || !flowersAmount}
              sx={{
                background: exchangeEstimate?.success 
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
              ) : exchangeEstimate?.success ? (
                '确认兑换'
              ) : (
                '请输入有效数量'
              )}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 统计信息 */}
        {userInfo && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">累计获得</Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatNumber(userInfo.balance?.total_earned || '0')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">累计消费</Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatNumber(userInfo.balance?.total_spent || '0')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">今日剩余额度</Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatNumber(userInfo.summary.dailyRemaining)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">今日兑换次数</Typography>
              <Typography variant="h6" fontWeight="bold">
                {userInfo.dailyStats?.exchange_count || 0}
              </Typography>
            </Box>
          </Box>
        )}

        {/* 交易历史 */}
        {userInfo?.recentTransactions && userInfo.recentTransactions.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1 }} />
                最近交易记录
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {userInfo.recentTransactions.slice(0, 5).map((tx) => (
                  <Box key={tx.id} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {tx.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(tx.created_at).toLocaleString('zh-CN')}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={tx.transaction_type === 'earn' ? 'success.main' : 'error.main'}
                        >
                          {tx.transaction_type === 'earn' ? '+' : '-'}{formatNumber(tx.amount)}
                        </Typography>
                        <Chip
                          label={tx.transaction_type === 'earn' ? '获得' : '消费'}
                          size="small"
                          color={tx.transaction_type === 'earn' ? 'success' : 'error'}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* 说明信息 */}
        <Alert severity="info" icon={<Info />} sx={{ mt: 2 }}>
          <Typography variant="body2">
            小红花兑换采用动态比例和分层奖励机制。
            用户等级越高，可享受更优惠的兑换比例和更高的每日限额。
            升级等级请完成社交平台认证和KYC验证。
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}

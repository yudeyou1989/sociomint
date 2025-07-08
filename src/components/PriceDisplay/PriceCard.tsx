/**
 * 价格显示卡片组件
 * 显示SM代币的实时价格、趋势图表和技术指标
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ShowChart,
  Info,
  Refresh,
  Timeline,
  Assessment
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { toast } from 'react-hot-toast';
import PriceDiscoveryService, { 
  PriceStats, 
  PriceTrend,
  PricePrediction 
} from '@/lib/services/priceDiscoveryService';

type TimePeriod = '1h' | '24h' | '7d' | '30d';

export default function PriceCard() {
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [priceTrend, setPriceTrend] = useState<PriceTrend | null>(null);
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载价格数据
  const loadPriceData = async (period: TimePeriod = selectedPeriod) => {
    try {
      setIsLoading(true);
      
      const [stats, trend, prediction, chartPoints] = await Promise.all([
        PriceDiscoveryService.getCurrentPriceStats(),
        PriceDiscoveryService.getPriceTrend(period),
        PriceDiscoveryService.getPricePrediction(),
        PriceDiscoveryService.getPriceChartData(period)
      ]);
      
      setPriceStats(stats);
      setPriceTrend(trend);
      setPricePrediction(prediction);
      setChartData(chartPoints);
    } catch (error) {
      console.error('加载价格数据失败:', error);
      toast.error('加载价格数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadPriceData();
      toast.success('价格数据已刷新');
    } catch (error) {
      console.error('刷新价格数据失败:', error);
      toast.error('刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 切换时间周期
  const handlePeriodChange = (event: React.MouseEvent<HTMLElement>, newPeriod: TimePeriod) => {
    if (newPeriod !== null) {
      setSelectedPeriod(newPeriod);
      loadPriceData(newPeriod);
    }
  };

  // 格式化数字
  const formatNumber = (num: number | string, decimals: number = 6): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n < 0.001) {
      return n.toExponential(2);
    }
    return n.toLocaleString('zh-CN', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  // 格式化百分比
  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  // 获取趋势图标和颜色
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp sx={{ color: 'success.main' }} />;
    if (change < 0) return <TrendingDown sx={{ color: 'error.main' }} />;
    return <TrendingFlat sx={{ color: 'text.secondary' }} />;
  };

  const getTrendColor = (change: number): 'success' | 'error' | 'default' => {
    if (change > 0) return 'success';
    if (change < 0) return 'error';
    return 'default';
  };

  // 格式化图表数据
  const formatChartData = (data: any[]) => {
    return data.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      price: point.price,
      volume: point.volume
    }));
  };

  // 获取时间周期标签
  const getPeriodLabel = (period: TimePeriod): string => {
    const labels = {
      '1h': '1小时',
      '24h': '24小时',
      '7d': '7天',
      '30d': '30天'
    };
    return labels[period];
  };

  useEffect(() => {
    loadPriceData();
    
    // 设置定时刷新（每30秒）
    const interval = setInterval(() => {
      loadPriceData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading && !priceStats) {
    return (
      <Card sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            加载价格数据中...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
      <CardContent>
        {/* 标题和刷新按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            SM 代币价格
          </Typography>
          <Tooltip title="刷新价格数据">
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

        {/* 当前价格显示 */}
        {priceStats && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    ${formatNumber(priceStats.current_price_usd, 6)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTrendIcon(priceStats.price_change_percentage)}
                    <Chip 
                      label={formatPercentage(priceStats.price_change_percentage)}
                      color={getTrendColor(priceStats.price_change_percentage)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      24小时变化
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">BNB价格</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(priceStats.current_price_bnb, 8)} BNB
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">市值</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      ${formatNumber(priceStats.market_cap_usd, 0)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">总销售</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatNumber(priceStats.total_sm_sold, 0)} SM
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">募集资金</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      ${formatNumber(priceStats.total_usd_raised, 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 时间周期选择 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={selectedPeriod}
            exclusive
            onChange={handlePeriodChange}
            size="small"
          >
            <ToggleButton value="1h">1小时</ToggleButton>
            <ToggleButton value="24h">24小时</ToggleButton>
            <ToggleButton value="7d">7天</ToggleButton>
            <ToggleButton value="30d">30天</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* 价格图表 */}
        {chartData.length > 0 && (
          <Box sx={{ mb: 3, height: 300 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <ShowChart sx={{ mr: 1 }} />
              价格走势 ({getPeriodLabel(selectedPeriod)})
            </Typography>
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formatChartData(chartData)}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" />
                <YAxis 
                  tickFormatter={(value) => `$${formatNumber(value, 6)}`}
                />
                <CartesianGrid strokeDasharray="3 3" />
                <RechartsTooltip 
                  formatter={(value: any) => [`$${formatNumber(value, 6)}`, '价格']}
                  labelFormatter={(label) => `时间: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* 趋势统计 */}
        {priceTrend && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Timeline sx={{ mr: 1 }} />
              {getPeriodLabel(selectedPeriod)}统计
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">平均价格</Typography>
                <Typography variant="body1" fontWeight="bold">
                  ${formatNumber(priceTrend.avg_price, 6)}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">最高价格</Typography>
                <Typography variant="body1" fontWeight="bold">
                  ${formatNumber(priceTrend.max_price, 6)}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">最低价格</Typography>
                <Typography variant="body1" fontWeight="bold">
                  ${formatNumber(priceTrend.min_price, 6)}
                </Typography>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">交易次数</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {priceTrend.transactions_count}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* 价格预测 */}
        {pricePrediction && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1 }} />
              价格预测
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                下次解锁目标价格: <strong>${formatNumber(pricePrediction.next_unlock_target_price, 6)}</strong>
              </Typography>
              <Typography variant="body2">
                预计达成时间: <strong>{Math.round(pricePrediction.estimated_time_to_target / 24)} 天</strong>
              </Typography>
              <Typography variant="body2">
                预测可信度: <strong>{pricePrediction.confidence_level}%</strong>
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">价格趋势</Typography>
                <Chip 
                  label={
                    pricePrediction.factors.current_trend === 'bullish' ? '看涨' :
                    pricePrediction.factors.current_trend === 'bearish' ? '看跌' : '中性'
                  }
                  color={
                    pricePrediction.factors.current_trend === 'bullish' ? 'success' :
                    pricePrediction.factors.current_trend === 'bearish' ? 'error' : 'default'
                  }
                  size="small"
                />
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">交易量趋势</Typography>
                <Chip 
                  label={
                    pricePrediction.factors.volume_trend === 'increasing' ? '增长' :
                    pricePrediction.factors.volume_trend === 'decreasing' ? '下降' : '稳定'
                  }
                  color={
                    pricePrediction.factors.volume_trend === 'increasing' ? 'success' :
                    pricePrediction.factors.volume_trend === 'decreasing' ? 'error' : 'default'
                  }
                  size="small"
                />
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">持有者增长</Typography>
                <Chip 
                  label={
                    pricePrediction.factors.holder_growth === 'growing' ? '增长' :
                    pricePrediction.factors.holder_growth === 'declining' ? '下降' : '稳定'
                  }
                  color={
                    pricePrediction.factors.holder_growth === 'growing' ? 'success' :
                    pricePrediction.factors.holder_growth === 'declining' ? 'error' : 'default'
                  }
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* 说明信息 */}
        <Alert severity="info" icon={<Info />}>
          <Typography variant="body2">
            价格数据基于BNB兑换记录实时计算。由于没有流动性池，价格反映实际兑换成本。
            预测仅供参考，实际价格可能因市场条件而变化。
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}

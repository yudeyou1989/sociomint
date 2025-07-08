/**
 * 无流动性价格发现服务
 * 基于BNB兑换数据实现价格发现和显示，包括实时价格、历史趋势、预期价格
 */

import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// 环境变量
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface PricePoint {
  timestamp: string;
  price_bnb: string;
  price_usd: string;
  sm_sold: string;
  bnb_received: string;
  transaction_hash: string;
  block_number: number;
}

export interface PriceStats {
  current_price_bnb: string;
  current_price_usd: string;
  initial_price_bnb: string;
  initial_price_usd: string;
  price_change_24h: number;
  price_change_percentage: number;
  total_sm_sold: string;
  total_bnb_raised: string;
  total_usd_raised: string;
  market_cap_usd: string;
  holders_count: number;
  last_updated: string;
}

export interface PriceTrend {
  period: '1h' | '24h' | '7d' | '30d';
  price_points: PricePoint[];
  avg_price: string;
  min_price: string;
  max_price: string;
  volume_sm: string;
  volume_bnb: string;
  transactions_count: number;
}

export interface PricePrediction {
  next_unlock_target_price: string;
  estimated_time_to_target: number; // hours
  confidence_level: number; // 0-100
  factors: {
    current_trend: 'bullish' | 'bearish' | 'neutral';
    volume_trend: 'increasing' | 'decreasing' | 'stable';
    holder_growth: 'growing' | 'declining' | 'stable';
  };
}

export class PriceDiscoveryService {
  /**
   * 记录价格数据点
   */
  static async recordPricePoint(
    smAmount: string,
    bnbAmount: string,
    transactionHash: string,
    blockNumber: number,
    bnbPriceUsd: number = 660 // 默认BNB价格，实际应该从预言机获取
  ): Promise<boolean> {
    try {
      // 计算SM价格
      const pricePerSmBnb = parseFloat(bnbAmount) / parseFloat(smAmount);
      const pricePerSmUsd = pricePerSmBnb * bnbPriceUsd;

      const { error } = await supabase
        .from('price_history')
        .insert({
          timestamp: new Date().toISOString(),
          price_bnb: pricePerSmBnb.toString(),
          price_usd: pricePerSmUsd.toString(),
          sm_sold: smAmount,
          bnb_received: bnbAmount,
          transaction_hash: transactionHash,
          block_number: blockNumber
        });

      if (error) {
        console.error('记录价格数据失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('记录价格数据异常:', error);
      return false;
    }
  }

  /**
   * 获取当前价格统计
   */
  static async getCurrentPriceStats(): Promise<PriceStats | null> {
    try {
      // 获取最新价格
      const { data: latestPrice, error: latestError } = await supabase
        .from('price_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('获取最新价格失败:', latestError);
        return null;
      }

      // 获取初始价格
      const { data: initialPrice, error: initialError } = await supabase
        .from('price_history')
        .select('*')
        .order('timestamp', { ascending: true })
        .limit(1)
        .single();

      if (initialError) {
        console.error('获取初始价格失败:', initialError);
        return null;
      }

      // 获取24小时前价格
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: price24hAgo } = await supabase
        .from('price_history')
        .select('*')
        .lte('timestamp', twentyFourHoursAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      // 计算24小时价格变化
      let priceChange24h = 0;
      let priceChangePercentage = 0;
      
      if (price24hAgo) {
        priceChange24h = parseFloat(latestPrice.price_usd) - parseFloat(price24hAgo.price_usd);
        priceChangePercentage = (priceChange24h / parseFloat(price24hAgo.price_usd)) * 100;
      }

      // 获取总计数据
      const { data: totals } = await supabase
        .from('price_history')
        .select('sm_sold, bnb_received')
        .then(({ data }) => {
          if (!data) return { data: null };
          
          const totalSmSold = data.reduce((sum, item) => sum + parseFloat(item.sm_sold), 0);
          const totalBnbRaised = data.reduce((sum, item) => sum + parseFloat(item.bnb_received), 0);
          
          return {
            data: {
              total_sm_sold: totalSmSold.toString(),
              total_bnb_raised: totalBnbRaised.toString(),
              total_usd_raised: (totalBnbRaised * 660).toString() // 使用当前BNB价格
            }
          };
        });

      // 计算市值（假设总供应量10亿）
      const totalSupply = 1000000000; // 10亿
      const marketCapUsd = (totalSupply * parseFloat(latestPrice.price_usd)).toString();

      // 获取持有者数量（这里需要从链上数据获取，暂时使用模拟数据）
      const holdersCount = Math.floor(Math.random() * 1000) + 100; // 模拟数据

      return {
        current_price_bnb: latestPrice.price_bnb,
        current_price_usd: latestPrice.price_usd,
        initial_price_bnb: initialPrice.price_bnb,
        initial_price_usd: initialPrice.price_usd,
        price_change_24h: priceChange24h,
        price_change_percentage: priceChangePercentage,
        total_sm_sold: totals?.data?.total_sm_sold || '0',
        total_bnb_raised: totals?.data?.total_bnb_raised || '0',
        total_usd_raised: totals?.data?.total_usd_raised || '0',
        market_cap_usd: marketCapUsd,
        holders_count: holdersCount,
        last_updated: latestPrice.timestamp
      };
    } catch (error) {
      console.error('获取价格统计异常:', error);
      return null;
    }
  }

  /**
   * 获取价格趋势数据
   */
  static async getPriceTrend(period: '1h' | '24h' | '7d' | '30d'): Promise<PriceTrend | null> {
    try {
      // 计算时间范围
      const now = new Date();
      const startTime = new Date();
      
      switch (period) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case '24h':
          startTime.setHours(startTime.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(startTime.getDate() - 30);
          break;
      }

      const { data: pricePoints, error } = await supabase
        .from('price_history')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', now.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('获取价格趋势失败:', error);
        return null;
      }

      if (!pricePoints || pricePoints.length === 0) {
        return {
          period,
          price_points: [],
          avg_price: '0',
          min_price: '0',
          max_price: '0',
          volume_sm: '0',
          volume_bnb: '0',
          transactions_count: 0
        };
      }

      // 计算统计数据
      const prices = pricePoints.map(p => parseFloat(p.price_usd));
      const avgPrice = (prices.reduce((sum, price) => sum + price, 0) / prices.length).toString();
      const minPrice = Math.min(...prices).toString();
      const maxPrice = Math.max(...prices).toString();
      
      const volumeSm = pricePoints.reduce((sum, p) => sum + parseFloat(p.sm_sold), 0).toString();
      const volumeBnb = pricePoints.reduce((sum, p) => sum + parseFloat(p.bnb_received), 0).toString();

      return {
        period,
        price_points: pricePoints,
        avg_price: avgPrice,
        min_price: minPrice,
        max_price: maxPrice,
        volume_sm: volumeSm,
        volume_bnb: volumeBnb,
        transactions_count: pricePoints.length
      };
    } catch (error) {
      console.error('获取价格趋势异常:', error);
      return null;
    }
  }

  /**
   * 获取价格预测
   */
  static async getPricePrediction(): Promise<PricePrediction | null> {
    try {
      const currentStats = await this.getCurrentPriceStats();
      if (!currentStats) return null;

      const trend24h = await this.getPriceTrend('24h');
      const trend7d = await this.getPriceTrend('7d');
      
      if (!trend24h || !trend7d) return null;

      // 计算下次解锁目标价格（当前价格的2倍）
      const currentPrice = parseFloat(currentStats.current_price_usd);
      const nextUnlockTargetPrice = (currentPrice * 2).toString();

      // 分析趋势
      const recentPrices = trend24h.price_points.slice(-5).map(p => parseFloat(p.price_usd));
      const olderPrices = trend24h.price_points.slice(0, 5).map(p => parseFloat(p.price_usd));
      
      let currentTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (recentPrices.length > 0 && olderPrices.length > 0) {
        const recentAvg = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
        const olderAvg = olderPrices.reduce((sum, p) => sum + p, 0) / olderPrices.length;
        
        if (recentAvg > olderAvg * 1.05) currentTrend = 'bullish';
        else if (recentAvg < olderAvg * 0.95) currentTrend = 'bearish';
      }

      // 分析交易量趋势
      let volumeTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      const recent24hVolume = parseFloat(trend24h.volume_bnb);
      const previous24hVolume = parseFloat(trend7d.volume_bnb) / 7; // 平均每日交易量
      
      if (recent24hVolume > previous24hVolume * 1.2) volumeTrend = 'increasing';
      else if (recent24hVolume < previous24hVolume * 0.8) volumeTrend = 'decreasing';

      // 估算到达目标价格的时间
      let estimatedTimeToTarget = 0;
      let confidenceLevel = 50;

      if (currentTrend === 'bullish' && volumeTrend === 'increasing') {
        estimatedTimeToTarget = 168; // 7天
        confidenceLevel = 75;
      } else if (currentTrend === 'bullish') {
        estimatedTimeToTarget = 336; // 14天
        confidenceLevel = 60;
      } else if (currentTrend === 'neutral') {
        estimatedTimeToTarget = 720; // 30天
        confidenceLevel = 40;
      } else {
        estimatedTimeToTarget = 1440; // 60天
        confidenceLevel = 25;
      }

      return {
        next_unlock_target_price: nextUnlockTargetPrice,
        estimated_time_to_target: estimatedTimeToTarget,
        confidence_level: confidenceLevel,
        factors: {
          current_trend: currentTrend,
          volume_trend: volumeTrend,
          holder_growth: 'stable' // 这里需要实际的持有者增长数据
        }
      };
    } catch (error) {
      console.error('获取价格预测异常:', error);
      return null;
    }
  }

  /**
   * 获取价格图表数据
   */
  static async getPriceChartData(
    period: '1h' | '24h' | '7d' | '30d',
    interval: number = 10 // 数据点间隔（分钟）
  ) {
    try {
      const trend = await this.getPriceTrend(period);
      if (!trend || trend.price_points.length === 0) return [];

      // 根据时间间隔采样数据点
      const sampledPoints = [];
      const totalPoints = trend.price_points.length;
      const sampleInterval = Math.max(1, Math.floor(totalPoints / 50)); // 最多50个数据点

      for (let i = 0; i < totalPoints; i += sampleInterval) {
        const point = trend.price_points[i];
        sampledPoints.push({
          timestamp: new Date(point.timestamp).getTime(),
          price: parseFloat(point.price_usd),
          volume: parseFloat(point.sm_sold)
        });
      }

      return sampledPoints;
    } catch (error) {
      console.error('获取价格图表数据异常:', error);
      return [];
    }
  }

  /**
   * 计算技术指标
   */
  static async getTechnicalIndicators(period: '24h' | '7d' = '24h') {
    try {
      const trend = await this.getPriceTrend(period);
      if (!trend || trend.price_points.length < 10) return null;

      const prices = trend.price_points.map(p => parseFloat(p.price_usd));
      
      // 简单移动平均线 (SMA)
      const sma5 = this.calculateSMA(prices, 5);
      const sma10 = this.calculateSMA(prices, 10);
      
      // 相对强弱指数 (RSI)
      const rsi = this.calculateRSI(prices, 14);
      
      // 布林带
      const bollingerBands = this.calculateBollingerBands(prices, 20, 2);

      return {
        sma5: sma5[sma5.length - 1],
        sma10: sma10[sma10.length - 1],
        rsi: rsi[rsi.length - 1],
        bollingerBands: {
          upper: bollingerBands.upper[bollingerBands.upper.length - 1],
          middle: bollingerBands.middle[bollingerBands.middle.length - 1],
          lower: bollingerBands.lower[bollingerBands.lower.length - 1]
        }
      };
    } catch (error) {
      console.error('计算技术指标异常:', error);
      return null;
    }
  }

  // 辅助函数：计算简单移动平均线
  private static calculateSMA(prices: number[], period: number): number[] {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  // 辅助函数：计算RSI
  private static calculateRSI(prices: number[], period: number): number[] {
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  // 辅助函数：计算布林带
  private static calculateBollingerBands(prices: number[], period: number, multiplier: number) {
    const sma = this.calculateSMA(prices, period);
    const upper = [];
    const middle = [];
    const lower = [];

    for (let i = 0; i < sma.length; i++) {
      const dataIndex = i + period - 1;
      const slice = prices.slice(dataIndex - period + 1, dataIndex + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      middle.push(mean);
      upper.push(mean + (stdDev * multiplier));
      lower.push(mean - (stdDev * multiplier));
    }

    return { upper, middle, lower };
  }
}

export default PriceDiscoveryService;

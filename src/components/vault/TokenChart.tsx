import { useState, useEffect } from 'react';
import { FaChartLine, FaCalendarAlt } from 'react-icons/fa';

// 价格数据点类型
interface PriceDataPoint {
  date: string;
  price: number;
  volume: number;
}

// 图表时间范围类型
type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

// 通证价格历史图表组件
const TokenChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 生成模拟价格数据
  useEffect(() => {
    setIsLoading(true);

    // 模拟API请求延迟
    const timer = setTimeout(() => {
      // 根据所选时间范围确定数据点数量
      const dataPoints =
        timeRange === '24h'
          ? 24
          : timeRange === '7d'
            ? 7
            : timeRange === '30d'
              ? 30
              : timeRange === '90d'
                ? 90
                : 180;

      // 生成基础价格和随机波动
      const basePrice = 12.5;
      const volatility =
        timeRange === '24h'
          ? 0.05
          : timeRange === '7d'
            ? 0.1
            : timeRange === '30d'
              ? 0.2
              : timeRange === '90d'
                ? 0.3
                : 0.5;

      // 生成日期和价格数据
      const now = new Date();
      const data: PriceDataPoint[] = [];

      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(now);

        if (timeRange === '24h') {
          date.setHours(date.getHours() - (dataPoints - i));
        } else {
          date.setDate(date.getDate() - (dataPoints - i));
        }

        // 添加随机波动
        const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
        const price = basePrice * randomFactor;

        // 生成随机交易量
        const volume = Math.floor(Math.random() * 10000) + 5000;

        data.push({
          date: date.toISOString(),
          price: parseFloat(price.toFixed(2)),
          volume,
        });
      }

      setPriceData(data);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [timeRange]);

  // 计算价格变化百分比
  const calculatePriceChange = () => {
    if (priceData.length < 2) return 0;

    const firstPrice = priceData[0].price;
    const lastPrice = priceData[priceData.length - 1].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;

    return parseFloat(change.toFixed(2));
  };

  // 获取最高价和最低价
  const getHighLowPrices = () => {
    if (priceData.length === 0) return { high: 0, low: 0 };

    const prices = priceData.map((p) => p.price);
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  };

  const priceChange = calculatePriceChange();
  const { high, low } = getHighLowPrices();

  // 绘制简单的价格图表
  const renderChart = () => {
    if (priceData.length === 0) return null;

    // 获取最高和最低价格，用于计算比例
    const prices = priceData.map((p) => p.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const range = maxPrice - minPrice;

    // 计算每个数据点的高度百分比
    const points = priceData.map((point, index) => {
      const heightPercent =
        range > 0 ? ((point.price - minPrice) / range) * 100 : 50;

      // 将数据点映射到0-100的范围上
      const x = (index / (priceData.length - 1)) * 100;
      const y = 100 - heightPercent;

      return { x, y, ...point };
    });

    // 生成SVG路径
    const pathData = points
      .map(
        (point, index) => (index === 0 ? 'M' : 'L') + point.x + ',' + point.y,
      )
      .join(' ');

    // 生成填充区域
    const areaPathData = pathData + ' L100,100 L0,100 Z';

    return (
      <div className="relative h-64 w-full">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* 填充区域 */}
          <path
            d={areaPathData}
            fill={
              priceChange >= 0
                ? 'rgba(52, 211, 153, 0.1)'
                : 'rgba(239, 68, 68, 0.1)'
            }
            stroke="none"
          />

          {/* 价格线 */}
          <path
            d={pathData}
            fill="none"
            stroke={priceChange >= 0 ? 'rgb(52, 211, 153)' : 'rgb(239, 68, 68)'}
            strokeWidth="0.5"
          />

          {/* 数据点 */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="0.5"
              fill={priceChange >= 0 ? 'rgb(52, 211, 153)' : 'rgb(239, 68, 68)'}
              className="opacity-0 hover:opacity-100 transition-opacity"
            />
          ))}
        </svg>

        {/* 价格标签 */}
        <div className="absolute top-0 right-0 text-xs text-gray-400">
          {maxPrice.toFixed(2)} SM
        </div>
        <div className="absolute bottom-0 right-0 text-xs text-gray-400">
          {minPrice.toFixed(2)} SM
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-md p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium flex items-center">
          <FaChartLine className="mr-2 text-primary" />
          通证价格历史
        </h3>

        <div className="flex space-x-1 text-xs">
          {(['24h', '7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 rounded ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {priceData.length > 0
                    ? priceData[priceData.length - 1].price.toFixed(2)
                    : '0.00'}{' '}
                  SM
                </div>
                <div
                  className={`text-sm flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange)}%
                  <span className="text-gray-500 ml-1">
                    (
                    {timeRange === '24h'
                      ? '24小时'
                      : timeRange === '7d'
                        ? '7天'
                        : timeRange === '30d'
                          ? '30天'
                          : timeRange === '90d'
                            ? '90天'
                            : '全部'}
                    )
                  </span>
                </div>
              </div>

              <div className="text-right text-sm">
                <div className="text-gray-400">
                  最高: <span className="text-white">{high.toFixed(2)} SM</span>
                </div>
                <div className="text-gray-400">
                  最低: <span className="text-white">{low.toFixed(2)} SM</span>
                </div>
              </div>
            </div>
          </div>

          {renderChart()}

          <div className="mt-4 text-xs text-gray-500 flex items-center justify-center">
            <FaCalendarAlt className="mr-1" />
            数据更新时间: {new Date().toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default TokenChart;

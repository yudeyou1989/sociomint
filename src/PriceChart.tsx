import React, { useEffect, useRef } from 'react';
import { ethers } from 'ethers';

// 图表数据接口
interface ChartData {
  round: number;
  price: number;
}

interface PriceChartProps {
  currentRound: number;
  initialPrice: number;
  priceIncrement: number;
  totalRounds?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  currentRound,
  initialPrice,
  priceIncrement,
  totalRounds = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 生成图表数据
  const generateChartData = (): ChartData[] => {
    const data: ChartData[] = [];
    
    // 生成历史数据和未来预测
    for (let round = 1; round <= totalRounds; round++) {
      const price = initialPrice + (priceIncrement * (round - 1));
      data.push({ round, price });
    }
    
    return data;
  };
  
  // 绘制图表
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 生成数据
    const data = generateChartData();
    
    // 设置画布尺寸
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // 计算图表区域
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 找到价格的最大值和最小值
    const minPrice = data[0].price;
    const maxPrice = data[data.length - 1].price;
    
    // 绘制坐标轴
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.strokeStyle = '#ced4da';
    ctx.stroke();
    
    // 绘制Y轴标签
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#495057';
    ctx.font = '10px sans-serif';
    
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartHeight / ySteps) * i;
      const yValue = maxPrice - ((maxPrice - minPrice) / ySteps) * i;
      
      ctx.beginPath();
      ctx.moveTo(padding.left - 5, y);
      ctx.lineTo(padding.left, y);
      ctx.stroke();
      
      ctx.fillText((yValue / 1e12).toFixed(12), padding.left - 10, y);
      
      // 绘制网格线
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.strokeStyle = 'rgba(222, 226, 230, 0.5)';
      ctx.stroke();
    }
    
    // 绘制X轴标签
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const xSteps = Math.min(10, totalRounds);
    for (let i = 0; i <= xSteps; i++) {
      const x = padding.left + (chartWidth / xSteps) * i;
      const roundValue = Math.floor(1 + (totalRounds / xSteps) * i);
      
      ctx.beginPath();
      ctx.moveTo(x, height - padding.bottom);
      ctx.lineTo(x, height - padding.bottom + 5);
      ctx.strokeStyle = '#ced4da';
      ctx.stroke();
      
      ctx.fillText(`轮次 ${roundValue}`, x, height - padding.bottom + 10);
    }
    
    // 绘制价格线
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (totalRounds - 1)) * (point.round - 1);
      const y = padding.top + chartHeight - (chartHeight * (point.price - minPrice) / (maxPrice - minPrice));
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = '#339af0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制当前轮次的标记
    const currentIndex = currentRound - 1;
    if (currentIndex >= 0 && currentIndex < data.length) {
      const point = data[currentIndex];
      const x = padding.left + (chartWidth / (totalRounds - 1)) * (point.round - 1);
      const y = padding.top + chartHeight - (chartHeight * (point.price - minPrice) / (maxPrice - minPrice));
      
      // 绘制圆点
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fa5252';
      ctx.fill();
      
      // 绘制标签
      ctx.fillStyle = '#212529';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = '12px sans-serif';
      ctx.fillText(`当前：${(point.price / 1e12).toFixed(12)} BNB/SM`, x, y - 10);
    }
    
    // 添加图表标题
    ctx.fillStyle = '#343a40';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SM 代币价格趋势图', width / 2, 5);
  };
  
  // 当数据变化时重新绘制图表
  useEffect(() => {
    drawChart();
    
    // 当窗口大小变化时重新绘制图表
    const handleResize = () => {
      drawChart();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentRound, initialPrice, priceIncrement, totalRounds]);
  
  return (
    <div className="price-chart-container">
      <canvas 
        ref={canvasRef} 
        className="price-chart"
      />
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#339af0' }}></span>
          <span className="legend-text">价格曲线</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#fa5252' }}></span>
          <span className="legend-text">当前价格</span>
        </div>
      </div>
      <style>
        {`
        .price-chart-container {
          border-radius: 12px;
          background-color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 16px;
          margin: 24px 0;
        }
        
        .price-chart {
          width: 100%;
          height: 300px;
          display: block;
        }
        
        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 16px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #495057;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
        
        .legend-text {
          font-weight: 500;
        }
        `}
      </style>
    </div>
  );
};

export default PriceChart; 
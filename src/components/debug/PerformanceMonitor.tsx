'use client';

import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  domNodes: number;
  eventListeners: number;
}

/**
 * 性能监控组件
 * 用于监控和显示应用性能指标
 */
const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    domNodes: 0,
    eventListeners: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const renderStartTime = useRef<number>(0);

  // 获取内存使用情况
  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  };

  // 获取DOM节点数量
  const getDOMNodeCount = (): number => {
    return document.querySelectorAll('*').length;
  };

  // 估算事件监听器数量（简化版本）
  const getEventListenerCount = (): number => {
    // 这是一个简化的估算，实际数量可能更多
    const elements = document.querySelectorAll('*');
    let count = 0;
    
    // 检查常见的事件监听器
    elements.forEach(element => {
      const events = ['click', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'keydown', 'keyup', 'scroll', 'resize'];
      events.forEach(event => {
        if ((element as any)[`on${event}`]) {
          count++;
        }
      });
    });
    
    return count;
  };

  // 测量渲染时间
  const measureRenderTime = () => {
    renderStartTime.current = performance.now();
    
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({ ...prev, renderTime: Math.round(renderTime * 100) / 100 }));
    });
  };

  // 更新性能指标
  const updateMetrics = () => {
    const newMetrics: PerformanceMetrics = {
      memoryUsage: getMemoryUsage(),
      cpuUsage: 0, // CPU使用率较难准确测量，暂时设为0
      renderTime: metrics.renderTime,
      domNodes: getDOMNodeCount(),
      eventListeners: getEventListenerCount()
    };
    
    setMetrics(newMetrics);
    measureRenderTime();
  };

  // 开始/停止监控
  const toggleMonitoring = () => {
    if (isMonitoring) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsMonitoring(false);
    } else {
      updateMetrics();
      intervalRef.current = setInterval(updateMetrics, 2000); // 每2秒更新一次
      setIsMonitoring(true);
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 获取性能等级颜色
  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 z-50"
        title="显示性能监控"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm z-50 text-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold">性能监控</h3>
        <div className="flex gap-2">
          <button
            onClick={toggleMonitoring}
            className={`px-2 py-1 rounded text-xs ${
              isMonitoring 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? '停止' : '开始'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
          >
            隐藏
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-300">内存使用:</span>
          <span className={getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })}>
            {metrics.memoryUsage} MB
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-300">渲染时间:</span>
          <span className={getPerformanceColor(metrics.renderTime, { good: 16, warning: 33 })}>
            {metrics.renderTime} ms
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-300">DOM节点:</span>
          <span className={getPerformanceColor(metrics.domNodes, { good: 1000, warning: 2000 })}>
            {metrics.domNodes}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-300">事件监听器:</span>
          <span className={getPerformanceColor(metrics.eventListeners, { good: 50, warning: 100 })}>
            {metrics.eventListeners}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <div>🟢 良好 🟡 警告 🔴 危险</div>
          <div className="mt-1">
            状态: {isMonitoring ? '监控中...' : '已停止'}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <button
          onClick={updateMetrics}
          className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          立即更新
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitor;

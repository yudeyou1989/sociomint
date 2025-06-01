'use client';

import { useEffect, useRef, memo } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  // 添加邻居列表，避免每帧都计算所有粒子对
  neighbors: number[];
}

// 使用空间分区优化粒子连线计算
class SpatialGrid {
  private grid: Map<string, number[]>;
  private cellSize: number;

  constructor(cellSize: number) {
    this.grid = new Map();
    this.cellSize = cellSize;
  }

  // 获取粒子所在的网格坐标
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  // 添加粒子到网格
  addParticle(index: number, x: number, y: number): void {
    const key = this.getCellKey(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)?.push(index);
  }

  // 清空网格
  clear(): void {
    this.grid.clear();
  }

  // 获取可能的邻居粒子
  getPotentialNeighbors(x: number, y: number): number[] {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const neighbors: number[] = [];

    // 检查当前网格和周围8个网格
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const key = `${cellX + i},${cellY + j}`;
        const cellParticles = this.grid.get(key);
        if (cellParticles) {
          neighbors.push(...cellParticles);
        }
      }
    }

    return neighbors;
  }
}

function BackgroundEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const gridRef = useRef<SpatialGrid>(new SpatialGrid(100)); // 网格大小等于连线距离

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // 设置canvas尺寸为窗口大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // 重新初始化粒子
      initParticles();
    };

    // 使用节流函数处理resize事件
    let resizeTimeout: NodeJS.Timeout;
    const throttledResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 200);
    };

    window.addEventListener('resize', throttledResize);

    // 颜色预计算，避免每帧重新创建颜色字符串
    const colors = [
      'rgba(105, 60, 255, 0.5)', // 紫色 (primary)
      'rgba(0, 180, 216, 0.5)', // 青色 (secondary)
      'rgba(255, 255, 255, 0.3)', // 白色
    ];

    // 预计算连线透明度
    const lineOpacities: number[] = [];
    for (let i = 0; i <= 100; i++) {
      lineOpacities[i] = 0.1 * (1 - i / 100);
    }

    // 初始化粒子
    const initParticles = () => {
      const particles: Particle[] = [];
      // 根据屏幕大小调整粒子数量，但设置上限以保持性能
      const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 20000), 60);

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
          neighbors: []
        });
      }

      particlesRef.current = particles;
    };

    // 更新空间网格
    const updateGrid = () => {
      const grid = gridRef.current;
      const particles = particlesRef.current;

      grid.clear();

      // 将粒子添加到网格
      particles.forEach((particle, index) => {
        grid.addParticle(index, particle.x, particle.y);
      });

      // 更新每个粒子的邻居列表
      particles.forEach((particle, index) => {
        particle.neighbors = grid.getPotentialNeighbors(particle.x, particle.y)
          .filter(i => i !== index);
      });
    };

    // 绘制粒子
    const drawParticles = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // 每10帧更新一次网格和邻居关系
      if (frameCount % 10 === 0) {
        updateGrid();
      }

      // 绘制粒子和连线
      particles.forEach((particle, index) => {
        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // 更新粒子位置
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // 边界检查 - 使用模运算简化代码
        particle.x = (particle.x + canvas.width) % canvas.width;
        particle.y = (particle.y + canvas.height) % canvas.height;

        // 只连接预计算的邻居粒子
        particle.neighbors.forEach(neighborIndex => {
          const neighbor = particles[neighborIndex];
          const dx = particle.x - neighbor.x;
          const dy = particle.y - neighbor.y;

          // 使用曼哈顿距离作为初步筛选，减少计算量
          if (Math.abs(dx) < 100 && Math.abs(dy) < 100) {
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              const opacityIndex = Math.floor(distance);
              ctx.beginPath();
              ctx.strokeStyle = `rgba(120, 120, 255, ${lineOpacities[opacityIndex]})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(neighbor.x, neighbor.y);
              ctx.stroke();
            }
          }
        });
      });

      frameCount++;
      animationRef.current = requestAnimationFrame(drawParticles);
    };

    // 初始化
    let frameCount = 0;
    resizeCanvas();
    drawParticles();

    // 清理函数
    return () => {
      window.removeEventListener('resize', throttledResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ opacity: 0.6 }}
    />
  );
}

// 使用memo包装组件，避免不必要的重新渲染
export default memo(BackgroundEffect);

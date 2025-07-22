/**
 * 优化图片组件
 * 提供图片懒加载、占位符、错误处理等功能
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  showPlaceholder?: boolean;
  placeholderColor?: string;
  webpSupport?: boolean;
  avifSupport?: boolean;
  lazyBoundary?: string;
  unoptimized?: boolean;
}

// 默认占位符SVG
const createPlaceholderSVG = (width: number, height: number, color: string = '#f3f4f6') => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
        ${width}×${height}
      </text>
    </svg>
  `)}`;
};

// 生成模糊占位符
const createBlurPlaceholder = (width: number, height: number) => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
    </svg>
  `)}`;
};

export default function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  placeholder = 'blur',
  blurDataURL,
  priority = false,
  quality = 75,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  showPlaceholder = true,
  placeholderColor = '#f3f4f6',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // 生成占位符
  const placeholderSrc = blurDataURL || 
    (placeholder === 'blur' ? createBlurPlaceholder(width, height) : createPlaceholderSVG(width, height, placeholderColor));

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // 处理图片加载完成
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // 处理图片加载错误
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    
    // 尝试使用备用图片
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
      return;
    }
    
    onError?.();
  };

  // 错误状态显示
  if (hasError && !fallbackSrc) {
    return (
      <div 
        ref={imgRef}
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
      >
        <div className="text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">图片加载失败</p>
        </div>
      </div>
    );
  }

  // 如果还没有进入视口且不是优先加载，显示占位符
  if (!isInView && showPlaceholder) {
    return (
      <div 
        ref={imgRef}
        className={`bg-gray-100 ${className}`}
        style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
      >
        <img
          src={placeholderSrc}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* 加载状态覆盖层 */}
      {isLoading && showPlaceholder && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* 实际图片 */}
      <Image
        src={currentSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={placeholderSrc}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          objectFit: fill ? objectFit : undefined,
          objectPosition: fill ? objectPosition : undefined,
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        {...props}
      />
    </div>
  );
}

// 预设的优化图片组件
export const AvatarImage = React.forwardRef<HTMLDivElement, Omit<OptimizedImageProps, 'width' | 'height' | 'objectFit'> & { size?: number }>((
  { size = 40, className = '', ...props }, ref
) => (
  <div ref={ref} className={`rounded-full overflow-hidden ${className}`}>
    <OptimizedImage
      {...props}
      width={size}
      height={size}
      objectFit="cover"
      className="w-full h-full"
    />
  </div>
));

export const CardImage = React.forwardRef<HTMLDivElement, Omit<OptimizedImageProps, 'objectFit'>>((
  { className = '', ...props }, ref
) => (
  <OptimizedImage
    {...props}
    ref={ref}
    objectFit="cover"
    className={`rounded-lg ${className}`}
  />
));

export const HeroImage = React.forwardRef<HTMLDivElement, Omit<OptimizedImageProps, 'priority' | 'loading'>>((
  { className = '', ...props }, ref
) => (
  <OptimizedImage
    {...props}
    ref={ref}
    priority={true}
    loading="eager"
    className={className}
  />
));

AvatarImage.displayName = 'AvatarImage';
CardImage.displayName = 'CardImage';
HeroImage.displayName = 'HeroImage';

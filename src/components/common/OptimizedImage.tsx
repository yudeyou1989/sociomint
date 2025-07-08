'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  sizes?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  lazy = true,
  sizes = '100vw',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 懒加载观察器
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority, isInView]);

  // 图片加载处理
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // 生成响应式图片URL
  const generateSrcSet = (baseSrc: string) => {
    const sizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    return sizes
      .map((size) => `${baseSrc}?w=${size}&q=${quality} ${size}w`)
      .join(', ');
  };

  // 如果还没有进入视口且启用了懒加载，显示占位符
  if (!isInView && lazy && !priority) {
    return (
      <Box
        ref={imgRef}
        sx={{
          width: width || '100%',
          height: height || 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
        }}
        className={className}
      >
        <Skeleton
          variant="rectangular"
          width={width || '100%'}
          height={height || 200}
          animation="wave"
        />
      </Box>
    );
  }

  // 错误状态
  if (hasError) {
    return (
      <Box
        sx={{
          width: width || '100%',
          height: height || 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          color: 'text.secondary',
          fontSize: '0.875rem',
        }}
        className={className}
      >
        图片加载失败
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        overflow: 'hidden',
      }}
      className={className}
    >
      {/* 加载状态 */}
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={height || 200}
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      )}

      {/* 模糊占位符 */}
      {placeholder === 'blur' && blurDataURL && isLoading && (
        <img
          src={blurDataURL}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(10px)',
            zIndex: 0,
          }}
        />
      )}

      {/* 主图片 */}
      <img
        ref={imgRef}
        src={`${src}?w=${width || 1200}&q=${quality}`}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoading ? 0 : 1,
        }}
      />
    </Box>
  );
};

// 头像组件优化版本
export const OptimizedAvatar: React.FC<{
  src: string;
  alt: string;
  size?: number;
  className?: string;
}> = ({ src, alt, size = 40, className = '' }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      quality={90}
      priority={false}
      lazy={true}
    />
  );
};

// 背景图片组件
export const OptimizedBackgroundImage: React.FC<{
  src: string;
  alt: string;
  children: React.ReactNode;
  className?: string;
  overlay?: boolean;
}> = ({ src, alt, children, className = '', overlay = false }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
      className={className}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        priority={true}
        quality={80}
        lazy={false}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {overlay && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1,
          }}
        />
      )}
      
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default OptimizedImage;

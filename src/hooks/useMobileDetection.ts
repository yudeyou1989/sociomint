/**
 * 移动端检测和适配Hook
 * 提供设备检测、屏幕尺寸监听和移动端优化功能
 */

import { useState, useEffect, useCallback } from 'react';

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 操作系统类型
export type OSType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

// 浏览器类型
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';

// 设备信息接口
export interface DeviceInfo {
  deviceType: DeviceType;
  os: OSType;
  browser: BrowserType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
  isRetina: boolean;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  hasNotch: boolean;
  supportsHover: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
}

// 断点配置
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
};

// 检测设备类型
const detectDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
};

// 检测操作系统
const detectOS = (): OSType => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  if (/windows/.test(userAgent)) return 'windows';
  if (/macintosh|mac os x/.test(userAgent)) return 'macos';
  if (/linux/.test(userAgent)) return 'linux';
  
  return 'unknown';
};

// 检测浏览器
const detectBrowser = (): BrowserType => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) return 'chrome';
  if (/firefox/.test(userAgent)) return 'firefox';
  if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) return 'safari';
  if (/edge/.test(userAgent)) return 'edge';
  if (/opera/.test(userAgent)) return 'opera';
  
  return 'unknown';
};

// 检测是否为触摸设备
const detectTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         (navigator as any).msMaxTouchPoints > 0;
};

// 检测是否为Retina屏幕
const detectRetina = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.devicePixelRatio > 1;
};

// 检测是否有刘海屏
const detectNotch = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 检测CSS环境变量支持
  const testEl = document.createElement('div');
  testEl.style.paddingTop = 'env(safe-area-inset-top)';
  document.body.appendChild(testEl);
  const hasNotch = getComputedStyle(testEl).paddingTop !== '0px';
  document.body.removeChild(testEl);
  
  return hasNotch;
};

// 检测是否支持hover
const detectHoverSupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(hover: hover)').matches;
};

// 检测动画偏好
const detectReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// 检测暗色模式偏好
const detectDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// 获取屏幕方向
const getOrientation = (width: number, height: number): 'portrait' | 'landscape' => {
  return width > height ? 'landscape' : 'portrait';
};

// 移动端检测Hook
export const useMobileDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        os: 'unknown',
        browser: 'unknown',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isIOS: false,
        isAndroid: false,
        isTouchDevice: false,
        isRetina: false,
        screenWidth: 1920,
        screenHeight: 1080,
        viewportWidth: 1920,
        viewportHeight: 1080,
        orientation: 'landscape',
        pixelRatio: 1,
        hasNotch: false,
        supportsHover: true,
        prefersReducedMotion: false,
        prefersDarkMode: false
      };
    }

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const deviceType = detectDeviceType(viewportWidth);
    const os = detectOS();

    return {
      deviceType,
      os,
      browser: detectBrowser(),
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isIOS: os === 'ios',
      isAndroid: os === 'android',
      isTouchDevice: detectTouchDevice(),
      isRetina: detectRetina(),
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      orientation: getOrientation(viewportWidth, viewportHeight),
      pixelRatio: window.devicePixelRatio || 1,
      hasNotch: detectNotch(),
      supportsHover: detectHoverSupport(),
      prefersReducedMotion: detectReducedMotion(),
      prefersDarkMode: detectDarkMode()
    };
  });

  // 更新设备信息
  const updateDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') return;

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const deviceType = detectDeviceType(viewportWidth);

    setDeviceInfo(prev => ({
      ...prev,
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      deviceType,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      orientation: getOrientation(viewportWidth, viewportHeight),
      pixelRatio: window.devicePixelRatio || 1,
      supportsHover: detectHoverSupport(),
      prefersReducedMotion: detectReducedMotion(),
      prefersDarkMode: detectDarkMode()
    }));
  }, []);

  // 监听窗口大小变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      // 防抖处理
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDeviceInfo, 100);
    };

    const handleOrientationChange = () => {
      // 延迟处理方向变化，等待浏览器更新尺寸
      setTimeout(updateDeviceInfo, 200);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // 监听媒体查询变化
    const hoverQuery = window.matchMedia('(hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleMediaChange = () => updateDeviceInfo();

    hoverQuery.addListener(handleMediaChange);
    motionQuery.addListener(handleMediaChange);
    darkModeQuery.addListener(handleMediaChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      hoverQuery.removeListener(handleMediaChange);
      motionQuery.removeListener(handleMediaChange);
      darkModeQuery.removeListener(handleMediaChange);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
};

// 响应式断点Hook
export const useBreakpoint = () => {
  const { viewportWidth } = useMobileDetection();

  return {
    isMobile: viewportWidth < BREAKPOINTS.mobile,
    isTablet: viewportWidth >= BREAKPOINTS.mobile && viewportWidth < BREAKPOINTS.tablet,
    isDesktop: viewportWidth >= BREAKPOINTS.tablet,
    isLarge: viewportWidth >= BREAKPOINTS.desktop,
    current: viewportWidth < BREAKPOINTS.mobile ? 'mobile' : 
             viewportWidth < BREAKPOINTS.tablet ? 'tablet' : 'desktop'
  };
};

// 移动端优化Hook
export const useMobileOptimization = () => {
  const deviceInfo = useMobileDetection();

  // 防止iOS缩放
  const preventIOSZoom = useCallback(() => {
    if (!deviceInfo.isIOS) return;

    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }
  }, [deviceInfo.isIOS]);

  // 优化触摸滚动
  const optimizeTouchScrolling = useCallback(() => {
    if (!deviceInfo.isTouchDevice) return;

    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.overflowScrolling = 'touch';
  }, [deviceInfo.isTouchDevice]);

  // 禁用长按菜单
  const disableLongPressMenu = useCallback(() => {
    if (!deviceInfo.isTouchDevice) return;

    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      input, textarea {
        -webkit-user-select: text;
        -khtml-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
    `;
    document.head.appendChild(style);
  }, [deviceInfo.isTouchDevice]);

  // 应用移动端优化
  const applyMobileOptimizations = useCallback(() => {
    if (deviceInfo.isMobile) {
      preventIOSZoom();
      optimizeTouchScrolling();
      disableLongPressMenu();
    }
  }, [deviceInfo.isMobile, preventIOSZoom, optimizeTouchScrolling, disableLongPressMenu]);

  useEffect(() => {
    applyMobileOptimizations();
  }, [applyMobileOptimizations]);

  return {
    preventIOSZoom,
    optimizeTouchScrolling,
    disableLongPressMenu,
    applyMobileOptimizations
  };
};

// 安全区域Hook
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0
      });
    };

    updateSafeArea();
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
};

export default {
  useMobileDetection,
  useBreakpoint,
  useMobileOptimization,
  useSafeArea
};

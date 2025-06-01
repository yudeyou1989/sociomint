"use client";

import React, { createContext, useContext, useReducer, ReactNode, Dispatch, useMemo, useCallback, useEffect } from 'react';

// 定义全局状态类型
interface GlobalState {
  theme: 'light' | 'dark';
  language: 'zh' | 'en' | 'ko' | 'ja' | 'ru'; // 扩展支持更多语言
  notifications: Notification[];
  isLoading: boolean;
  loadingTasks: Record<string, boolean>; // 跟踪多个加载任务
  lastUpdated: number;
  cache: Record<string, any>; // 通用缓存存储
  errors: Record<string, string>; // 错误存储
}

// 通知类型
interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  createdAt: number;
  read: boolean;
  actionUrl?: string; // 可选的操作URL
  autoClose?: boolean; // 是否自动关闭
}

// 定义 Action 类型
type Action =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LANGUAGE'; payload: 'zh' | 'en' | 'ko' | 'ja' | 'ru' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'createdAt' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'START_LOADING_TASK'; payload: string }
  | { type: 'FINISH_LOADING_TASK'; payload: string }
  | { type: 'SET_CACHE_ITEM'; payload: { key: string, value: any, expiresIn?: number } }
  | { type: 'CLEAR_CACHE_ITEM'; payload: string }
  | { type: 'CLEAR_CACHE' }
  | { type: 'SET_ERROR'; payload: { key: string, message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' };

// 初始状态
const initialState: GlobalState = {
  theme: 'light',
  language: 'zh',
  notifications: [],
  isLoading: false,
  loadingTasks: {},
  lastUpdated: Date.now(),
  cache: {},
  errors: {},
};

// 创建上下文
const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: Dispatch<Action>;
} | undefined>(undefined);

// 按功能拆分reducer以提高可维护性
const themeReducer = (state: GlobalState, action: Action): GlobalState => {
  if (action.type === 'SET_THEME') {
    localStorage.setItem('theme', action.payload);
    return { ...state, theme: action.payload, lastUpdated: Date.now() };
  }
  return state;
};

const languageReducer = (state: GlobalState, action: Action): GlobalState => {
  if (action.type === 'SET_LANGUAGE') {
    localStorage.setItem('language', action.payload);
    return { ...state, language: action.payload, lastUpdated: Date.now() };
  }
  return state;
};

const notificationReducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        read: false,
        ...action.payload,
      };
      
      // 如果通知数量过多，移除最旧的
      const maxNotifications = 50;
      const updatedNotifications = [newNotification, ...state.notifications];
      if (updatedNotifications.length > maxNotifications) {
        updatedNotifications.length = maxNotifications;
      }
      
      return {
        ...state,
        notifications: updatedNotifications,
        lastUpdated: Date.now(),
      };
      
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        lastUpdated: Date.now(),
      };
      
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], lastUpdated: Date.now() };
      
    default:
      return state;
  }
};

const loadingReducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, lastUpdated: Date.now() };
      
    case 'START_LOADING_TASK':
      return { 
        ...state, 
        loadingTasks: { ...state.loadingTasks, [action.payload]: true },
        isLoading: true, // 任何任务加载中都设置全局加载状态
        lastUpdated: Date.now() 
      };
      
    case 'FINISH_LOADING_TASK':
      const newLoadingTasks = { ...state.loadingTasks };
      delete newLoadingTasks[action.payload];
      
      // 如果没有任何任务加载中，则设置全局加载状态为false
      const stillLoading = Object.values(newLoadingTasks).some(Boolean);
      
      return { 
        ...state, 
        loadingTasks: newLoadingTasks,
        isLoading: stillLoading,
        lastUpdated: Date.now() 
      };
      
    default:
      return state;
  }
};

const cacheReducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'SET_CACHE_ITEM':
      const { key, value, expiresIn } = action.payload as { key: string, value: any, expiresIn?: number };
      const item = {
        value,
        timestamp: Date.now(),
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      };
      
      return {
        ...state,
        cache: { ...state.cache, [key]: item },
        lastUpdated: Date.now(),
      };
      
    case 'CLEAR_CACHE_ITEM':
      const newCache = { ...state.cache };
      delete newCache[action.payload];
      
      return {
        ...state,
        cache: newCache,
        lastUpdated: Date.now(),
      };
      
    case 'CLEAR_CACHE':
      return { ...state, cache: {}, lastUpdated: Date.now() };
      
    default:
      return state;
  }
};

const errorReducer = (state: GlobalState, action: Action): GlobalState => {
  switch (action.type) {
    case 'SET_ERROR':
      const { key, message } = action.payload as { key: string, message: string };
      return {
        ...state,
        errors: { ...state.errors, [key]: message },
        lastUpdated: Date.now(),
      };
      
    case 'CLEAR_ERROR':
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      
      return {
        ...state,
        errors: newErrors,
        lastUpdated: Date.now(),
      };
      
    case 'CLEAR_ALL_ERRORS':
      return { ...state, errors: {}, lastUpdated: Date.now() };
      
    default:
      return state;
  }
};

// 合并所有reducer
function rootReducer(state: GlobalState, action: Action): GlobalState {
  return [
    themeReducer,
    languageReducer,
    notificationReducer,
    loadingReducer,
    cacheReducer,
    errorReducer
  ].reduce((currentState, reducer) => reducer(currentState, action), state);
}

// Provider 组件
export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 从本地存储初始化状态
  const getInitialState = (): GlobalState => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const savedLanguage = localStorage.getItem('language') as 'zh' | 'en' | 'ko' | 'ja' | 'ru' | null;
      
      return {
        ...initialState,
        theme: savedTheme || initialState.theme,
        language: savedLanguage ? (savedLanguage as any) : initialState.language,
      };
    }
    return initialState;
  };
  
  const [state, dispatch] = useReducer(rootReducer, getInitialState());

  // 自动清理过期的缓存
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      let hasExpired = false;
      
      // 检查是否有过期的缓存项
      Object.entries(state.cache).forEach(([key, item]) => {
        if (item.expiresAt && item.expiresAt < now) {
          dispatch({ type: 'CLEAR_CACHE_ITEM', payload: key });
          hasExpired = true;
        }
      });
      
      return hasExpired;
    };
    
    // 每分钟清理一次过期缓存
    const interval = setInterval(cleanup, 60000);
    
    return () => clearInterval(interval);
  }, [state.cache]);

  // 使用useMemo避免重复创建context值
  const contextValue = useMemo(() => ({
    state,
    dispatch
  }), [state]);

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// 钩子函数用于组件中访问状态和调度器
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState 必须在 GlobalStateProvider 内部使用');
  }
  return context;
};

// 帮助函数
export const useTheme = () => {
  const { state, dispatch } = useGlobalState();
  
  // 使用useCallback避免重复创建函数
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, [dispatch]);
  
  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  }, [dispatch, state.theme]);

  return {
    theme: state.theme,
    setTheme,
    toggleTheme,
  };
};

export const useLanguage = () => {
  const { state, dispatch } = useGlobalState();
  
  const setLanguage = useCallback((language: 'zh' | 'en' | 'ko' | 'ja' | 'ru') => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  }, [dispatch]);
  
  // 语言切换现在支持多种语言
  const nextLanguage = useCallback(() => {
    const languages: ('zh' | 'en' | 'ko' | 'ja' | 'ru')[] = ['zh', 'en', 'ko', 'ja', 'ru'];
    const currentIndex = languages.indexOf(state.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    dispatch({ type: 'SET_LANGUAGE', payload: languages[nextIndex] });
  }, [dispatch, state.language]);

  return {
    language: state.language,
    setLanguage,
    nextLanguage,
  };
};

export const useNotifications = () => {
  const { state, dispatch } = useGlobalState();
  
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // 如果设置了自动关闭，则在指定时间后标记为已读
    if (notification.autoClose) {
      setTimeout(() => {
        // 获取最新添加的通知ID
        const latestNotification = state.notifications[0];
        if (latestNotification) {
          dispatch({ type: 'MARK_NOTIFICATION_READ', payload: latestNotification.id });
        }
      }, 5000);
    }
  }, [dispatch, state.notifications]);
  
  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  }, [dispatch]);
  
  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, [dispatch]);

  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    clearNotifications,
  };
};

export const useLoading = () => {
  const { state, dispatch } = useGlobalState();
  
  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, [dispatch]);
  
  const startTask = useCallback((taskId: string) => {
    dispatch({ type: 'START_LOADING_TASK', payload: taskId });
    return taskId; // 返回taskId以便后续使用
  }, [dispatch]);
  
  const finishTask = useCallback((taskId: string) => {
    dispatch({ type: 'FINISH_LOADING_TASK', payload: taskId });
  }, [dispatch]);

  return {
    isLoading: state.isLoading,
    loadingTasks: state.loadingTasks,
    setLoading,
    startTask,
    finishTask,
  };
};

// 新增：缓存hook
export const useStateCache = () => {
  const { state, dispatch } = useGlobalState();
  
  const setCache = useCallback((key: string, value: any, expiresIn?: number) => {
    dispatch({ type: 'SET_CACHE_ITEM', payload: { key, value, expiresIn } });
  }, [dispatch]);
  
  const getCache = useCallback((key: string): any => {
    const item = state.cache[key];
    if (!item) return null;
    
    // 检查是否过期
    if (item.expiresAt && item.expiresAt < Date.now()) {
      dispatch({ type: 'CLEAR_CACHE_ITEM', payload: key });
      return null;
    }
    
    return item.value;
  }, [state.cache, dispatch]);
  
  const clearCache = useCallback((key?: string) => {
    if (key) {
      dispatch({ type: 'CLEAR_CACHE_ITEM', payload: key });
    } else {
      dispatch({ type: 'CLEAR_CACHE' });
    }
  }, [dispatch]);

  return {
    setCache,
    getCache,
    clearCache,
  };
};

// 新增：错误管理hook
export const useStateErrors = () => {
  const { state, dispatch } = useGlobalState();
  
  const setError = useCallback((key: string, message: string) => {
    dispatch({ type: 'SET_ERROR', payload: { key, message } });
  }, [dispatch]);
  
  const clearError = useCallback((key: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: key });
  }, [dispatch]);
  
  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, [dispatch]);

  return {
    errors: state.errors,
    hasErrors: Object.keys(state.errors).length > 0,
    setError,
    clearError,
    clearAllErrors,
  };
}; 
/**
 * 日志服务
 * 
 * 该服务提供统一的日志记录功能，支持不同级别的日志记录和格式化。
 * 在开发环境中，日志会输出到控制台；在生产环境中，可以将日志发送到后端服务。
 */

import { createClient } from '@supabase/supabase-js';

// 环境变量
const ENVIRONMENT = process.env.NEXT_PUBLIC_APP_ENV || 'development';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL || 'info';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 日志级别映射
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

// 当前日志级别
const CURRENT_LOG_LEVEL = LOG_LEVEL_MAP[LOG_LEVEL.toLowerCase()] || LogLevel.INFO;

// 日志上下文接口
export interface LogContext {
  userId?: string;
  walletAddress?: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

// 日志条目接口
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
  environment: string;
}

/**
 * 获取日志级别名称
 */
const getLogLevelName = (level: LogLevel): string => {
  switch (level) {
    case LogLevel.DEBUG:
      return 'DEBUG';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.ERROR:
      return 'ERROR';
    default:
      return 'UNKNOWN';
  }
};

/**
 * 格式化日志消息
 */
const formatLogMessage = (entry: LogEntry): string => {
  const { level, message, timestamp, context } = entry;
  const levelName = getLogLevelName(level);
  
  let formattedMessage = `[${levelName}] ${message}`;
  
  if (context.component) {
    formattedMessage = `[${context.component}] ${formattedMessage}`;
  }
  
  if (context.action) {
    formattedMessage = `[${context.action}] ${formattedMessage}`;
  }
  
  return formattedMessage;
};

/**
 * 输出日志到控制台
 */
const logToConsole = (entry: LogEntry): void => {
  const { level, message, context } = entry;
  const formattedMessage = formatLogMessage(entry);
  
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage, context.additionalData || '');
      break;
    case LogLevel.INFO:
      console.info(formattedMessage, context.additionalData || '');
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage, context.additionalData || '');
      break;
    case LogLevel.ERROR:
      console.error(formattedMessage, context.additionalData || '');
      break;
    default:
      console.log(formattedMessage, context.additionalData || '');
  }
};

/**
 * 将日志发送到后端API
 */
const sendToApi = async (entry: LogEntry): Promise<void> => {
  try {
    await supabase.from('application_logs').insert([entry]);
  } catch (error) {
    console.error('Failed to send log to API:', error);
  }
};

/**
 * 创建日志条目
 */
const createLogEntry = (
  level: LogLevel,
  message: string,
  context: LogContext = {}
): LogEntry => {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    environment: ENVIRONMENT,
  };
};

/**
 * 记录日志
 */
const log = async (
  level: LogLevel,
  message: string,
  context: LogContext = {}
): Promise<void> => {
  // 检查日志级别
  if (level < CURRENT_LOG_LEVEL) {
    return;
  }
  
  // 创建日志条目
  const entry = createLogEntry(level, message, context);
  
  // 输出到控制台
  logToConsole(entry);
  
  // 在生产环境中发送到API
  if (ENVIRONMENT === 'production' && level >= LogLevel.INFO) {
    await sendToApi(entry);
  }
};

/**
 * 记录调试日志
 */
export const debug = (message: string, context: LogContext = {}): void => {
  log(LogLevel.DEBUG, message, context);
};

/**
 * 记录信息日志
 */
export const info = (message: string, context: LogContext = {}): void => {
  log(LogLevel.INFO, message, context);
};

/**
 * 记录警告日志
 */
export const warn = (message: string, context: LogContext = {}): void => {
  log(LogLevel.WARN, message, context);
};

/**
 * 记录错误日志
 */
export const error = (message: string, context: LogContext = {}): void => {
  log(LogLevel.ERROR, message, context);
};

/**
 * 创建带有上下文的日志记录器
 */
export const createContextLogger = (defaultContext: LogContext) => {
  return {
    debug: (message: string, context: LogContext = {}) => 
      debug(message, { ...defaultContext, ...context }),
    info: (message: string, context: LogContext = {}) => 
      info(message, { ...defaultContext, ...context }),
    warn: (message: string, context: LogContext = {}) => 
      warn(message, { ...defaultContext, ...context }),
    error: (message: string, context: LogContext = {}) => 
      error(message, { ...defaultContext, ...context }),
  };
};

/**
 * 日志服务
 */
const Logger = {
  debug,
  info,
  warn,
  error,
  createContextLogger,
  LogLevel,
};

export default Logger;

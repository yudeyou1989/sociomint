/**
 * 错误提示组件
 * 用于显示用户友好的错误信息
 */

import React from 'react';
import { AlertTriangle, X, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { ErrorType, ErrorSeverity } from '@/lib/errorHandler';

interface ErrorAlertProps {
  error: {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    code?: string;
    retryable?: boolean;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const getSeverityStyles = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-800';
      case ErrorSeverity.HIGH:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ErrorSeverity.LOW:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColor = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'text-red-500';
      case ErrorSeverity.HIGH:
        return 'text-orange-500';
      case ErrorSeverity.MEDIUM:
        return 'text-yellow-500';
      case ErrorSeverity.LOW:
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getActionSuggestions = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return [
          '检查网络连接',
          '刷新页面重试',
          '稍后再试',
        ];
      case ErrorType.WALLET:
        return [
          '检查钱包是否已连接',
          '确认钱包网络设置',
          '重新连接钱包',
        ];
      case ErrorType.BLOCKCHAIN:
        return [
          '检查交易参数',
          '增加Gas费重试',
          '确认账户余额充足',
        ];
      case ErrorType.AUTHENTICATION:
        return [
          '重新登录',
          '清除浏览器缓存',
          '检查账户状态',
        ];
      case ErrorType.VALIDATION:
        return [
          '检查输入数据格式',
          '确认必填字段',
          '重新填写表单',
        ];
      default:
        return [
          '刷新页面重试',
          '清除浏览器缓存',
          '联系技术支持',
        ];
    }
  };

  const getHelpLink = () => {
    switch (error.type) {
      case ErrorType.WALLET:
        return 'https://docs.sociomint.top/wallet-help';
      case ErrorType.BLOCKCHAIN:
        return 'https://docs.sociomint.top/transaction-help';
      default:
        return 'https://docs.sociomint.top/troubleshooting';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getSeverityStyles()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${getIconColor()}`} />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {error.type === ErrorType.NETWORK && '网络连接问题'}
              {error.type === ErrorType.WALLET && '钱包连接问题'}
              {error.type === ErrorType.BLOCKCHAIN && '区块链交易问题'}
              {error.type === ErrorType.AUTHENTICATION && '身份验证问题'}
              {error.type === ErrorType.VALIDATION && '数据验证问题'}
              {error.type === ErrorType.AUTHORIZATION && '权限问题'}
              {error.type === ErrorType.RATE_LIMIT && '请求频率限制'}
              {error.type === ErrorType.UNKNOWN && '未知错误'}
            </h3>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-2 inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="mt-2 text-sm">
            <p>{error.userMessage}</p>
            
            {error.code && (
              <p className="mt-1 text-xs opacity-75">
                错误代码: {error.code}
              </p>
            )}
          </div>

          {/* 操作建议 */}
          <div className="mt-3">
            <p className="text-xs font-medium mb-2">建议解决方案:</p>
            <ul className="text-xs space-y-1">
              {getActionSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1 h-1 bg-current rounded-full mr-2"></span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {error.retryable && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                重试
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              刷新页面
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(getHelpLink(), '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              获取帮助
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;

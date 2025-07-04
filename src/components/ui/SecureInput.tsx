/**
 * 安全输入组件
 * 提供输入验证、XSS防护等安全功能
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { Input } from './Input';
import { InputValidator, XSSProtection, SecurityConfig } from '@/lib/security';

export interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validationType?: 'number' | 'walletAddress' | 'url' | 'email' | 'username' | 'hashtag';
  minValue?: number;
  maxValue?: number;
  maxLength?: number;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  sanitizeInput?: boolean;
  showValidationIcon?: boolean;
}

export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ 
    validationType,
    minValue,
    maxValue,
    maxLength,
    onValidationChange,
    sanitizeInput = true,
    showValidationIcon = true,
    onChange,
    className,
    ...props 
  }, ref) => {
    const [isValid, setIsValid] = useState<boolean>(true);
    const [validationError, setValidationError] = useState<string>('');

    // 验证输入值
    const validateInput = useCallback((value: string): { isValid: boolean; error?: string } => {
      if (!value) {
        return { isValid: true }; // 空值通常是有效的，除非是必填字段
      }

      // 长度验证
      if (maxLength && value.length > maxLength) {
        return { isValid: false, error: `输入长度不能超过${maxLength}个字符` };
      }

      // 根据验证类型进行验证
      switch (validationType) {
        case 'number':
          if (!InputValidator.validateNumber(value)) {
            return { isValid: false, error: '请输入有效的数字' };
          }
          const numValue = parseFloat(value);
          if (minValue !== undefined && numValue < minValue) {
            return { isValid: false, error: `数值不能小于${minValue}` };
          }
          if (maxValue !== undefined && numValue > maxValue) {
            return { isValid: false, error: `数值不能大于${maxValue}` };
          }
          break;

        case 'walletAddress':
          if (!InputValidator.validateWalletAddress(value)) {
            return { isValid: false, error: '请输入有效的钱包地址' };
          }
          break;

        case 'url':
          if (!InputValidator.validateUrl(value)) {
            return { isValid: false, error: '请输入有效的URL地址' };
          }
          break;

        case 'email':
          if (!InputValidator.validateEmail(value)) {
            return { isValid: false, error: '请输入有效的邮箱地址' };
          }
          break;

        case 'username':
          if (!InputValidator.validateUsername(value)) {
            return { isValid: false, error: '用户名只能包含字母、数字和下划线，长度3-20位' };
          }
          break;

        case 'hashtag':
          if (!InputValidator.validateHashtag(value)) {
            return { isValid: false, error: '请输入有效的话题标签（以#开头）' };
          }
          break;

        default:
          break;
      }

      return { isValid: true };
    }, [validationType, minValue, maxValue, maxLength]);

    // 处理输入变化
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // 清理输入（防止XSS）
      if (sanitizeInput) {
        value = XSSProtection.sanitizeInput(value);
      }

      // 验证输入
      const validation = validateInput(value);
      setIsValid(validation.isValid);
      setValidationError(validation.error || '');

      // 通知父组件验证结果
      if (onValidationChange) {
        onValidationChange(validation.isValid, validation.error);
      }

      // 更新输入值
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: value
        }
      };

      if (onChange) {
        onChange(syntheticEvent);
      }
    }, [validateInput, sanitizeInput, onValidationChange, onChange]);

    // 构建CSS类名
    const inputClassName = [
      className,
      !isValid ? 'border-red-500 focus:ring-red-500' : '',
      isValid && props.value ? 'border-green-500' : ''
    ].filter(Boolean).join(' ');

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          onChange={handleChange}
          className={inputClassName}
          maxLength={maxLength || SecurityConfig.maxInputLength.content}
        />
        
        {/* 验证图标 */}
        {showValidationIcon && props.value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
        
        {/* 错误消息 */}
        {!isValid && validationError && (
          <p className="mt-1 text-sm text-red-600">
            {validationError}
          </p>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

// 预设的安全输入组件
export const WalletAddressInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>((props, ref) => (
  <SecureInput {...props} ref={ref} validationType="walletAddress" placeholder="0x..." />
));

export const NumberInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>((props, ref) => (
  <SecureInput {...props} ref={ref} validationType="number" placeholder="0.00" />
));

export const UrlInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>((props, ref) => (
  <SecureInput {...props} ref={ref} validationType="url" placeholder="https://..." />
));

export const EmailInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>((props, ref) => (
  <SecureInput {...props} ref={ref} validationType="email" placeholder="user@example.com" />
));

export const UsernameInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>((props, ref) => (
  <SecureInput {...props} ref={ref} validationType="username" placeholder="username" />
));

export const HashtagInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>((props, ref) => (
  <SecureInput {...props} ref={ref} validationType="hashtag" placeholder="#hashtag" />
));

WalletAddressInput.displayName = 'WalletAddressInput';
NumberInput.displayName = 'NumberInput';
UrlInput.displayName = 'UrlInput';
EmailInput.displayName = 'EmailInput';
UsernameInput.displayName = 'UsernameInput';
HashtagInput.displayName = 'HashtagInput';

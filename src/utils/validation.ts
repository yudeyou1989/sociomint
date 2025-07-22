/**
 * 输入验证和清理工具
 * 提供全面的输入验证、清理和安全检查
 */

import DOMPurify from 'dompurify';

// 验证规则类型
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  sanitize?: boolean;
}

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

// 常用正则表达式
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  walletAddress: /^0x[a-fA-F0-9]{40}$/,
  transactionHash: /^0x[a-fA-F0-9]{64}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  amount: /^\d+(\.\d{1,18})?$/,
  positiveNumber: /^[1-9]\d*$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  noSpecialChars: /^[a-zA-Z0-9\s\-_]+$/,
  safeText: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
};

// 输入清理函数
export const sanitizeInput = {
  // 清理HTML内容
  html: (input: string): string => {
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
    }
    // 服务端简单清理
    return input.replace(/<[^>]*>/g, '');
  },

  // 清理用户名
  username: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20);
  },

  // 清理数字输入
  number: (input: string): string => {
    return input.replace(/[^0-9.]/g, '');
  },

  // 清理金额输入
  amount: (input: string): string => {
    const cleaned = input.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  },

  // 清理URL
  url: (input: string): string => {
    try {
      const url = new URL(input);
      return url.toString();
    } catch {
      return '';
    }
  },

  // 清理文本内容
  text: (input: string): string => {
    return input.replace(/[<>\"'&]/g, '').trim();
  },

  // 清理搜索查询
  searchQuery: (input: string): string => {
    return input.replace(/[<>\"'&%]/g, '').trim().substring(0, 100);
  }
};

// 验证函数
export const validate = {
  // 验证邮箱
  email: (email: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = sanitizeInput.text(email);

    if (!sanitized) {
      errors.push('邮箱地址不能为空');
    } else if (!VALIDATION_PATTERNS.email.test(sanitized)) {
      errors.push('邮箱地址格式不正确');
    } else if (sanitized.length > 254) {
      errors.push('邮箱地址过长');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  },

  // 验证钱包地址
  walletAddress: (address: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = address.trim();

    if (!sanitized) {
      errors.push('钱包地址不能为空');
    } else if (!VALIDATION_PATTERNS.walletAddress.test(sanitized)) {
      errors.push('钱包地址格式不正确');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  },

  // 验证交易哈希
  transactionHash: (hash: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = hash.trim();

    if (!sanitized) {
      errors.push('交易哈希不能为空');
    } else if (!VALIDATION_PATTERNS.transactionHash.test(sanitized)) {
      errors.push('交易哈希格式不正确');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  },

  // 验证金额
  amount: (amount: string, min?: number, max?: number): ValidationResult => {
    const errors: string[] = [];
    const sanitized = sanitizeInput.amount(amount);

    if (!sanitized) {
      errors.push('金额不能为空');
    } else if (!VALIDATION_PATTERNS.amount.test(sanitized)) {
      errors.push('金额格式不正确');
    } else {
      const numValue = parseFloat(sanitized);
      if (isNaN(numValue)) {
        errors.push('金额必须是有效数字');
      } else if (numValue <= 0) {
        errors.push('金额必须大于0');
      } else if (min !== undefined && numValue < min) {
        errors.push(`金额不能小于${min}`);
      } else if (max !== undefined && numValue > max) {
        errors.push(`金额不能大于${max}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  },

  // 验证用户名
  username: (username: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = sanitizeInput.username(username);

    if (!sanitized) {
      errors.push('用户名不能为空');
    } else if (sanitized.length < 3) {
      errors.push('用户名至少需要3个字符');
    } else if (sanitized.length > 20) {
      errors.push('用户名不能超过20个字符');
    } else if (!VALIDATION_PATTERNS.username.test(sanitized)) {
      errors.push('用户名只能包含字母、数字和下划线');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  },

  // 验证URL
  url: (url: string): ValidationResult => {
    const errors: string[] = [];
    const sanitized = url.trim();

    if (!sanitized) {
      errors.push('URL不能为空');
    } else if (!VALIDATION_PATTERNS.url.test(sanitized)) {
      errors.push('URL格式不正确');
    } else if (sanitized.length > 2048) {
      errors.push('URL过长');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  },

  // 验证文本内容
  text: (text: string, minLength = 0, maxLength = 1000): ValidationResult => {
    const errors: string[] = [];
    const sanitized = sanitizeInput.html(text).trim();

    if (minLength > 0 && !sanitized) {
      errors.push('内容不能为空');
    } else if (sanitized.length < minLength) {
      errors.push(`内容至少需要${minLength}个字符`);
    } else if (sanitized.length > maxLength) {
      errors.push(`内容不能超过${maxLength}个字符`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }
};

// 通用验证器
export const validateField = (value: any, rules: ValidationRule): ValidationResult => {
  const errors: string[] = [];
  let sanitizedValue = value;

  // 清理输入
  if (rules.sanitize && typeof value === 'string') {
    sanitizedValue = sanitizeInput.html(value);
  }

  // 必填验证
  if (rules.required && (!sanitizedValue || sanitizedValue.toString().trim() === '')) {
    errors.push('此字段为必填项');
    return { isValid: false, errors, sanitizedValue };
  }

  // 如果值为空且非必填，直接返回有效
  if (!sanitizedValue || sanitizedValue.toString().trim() === '') {
    return { isValid: true, errors: [], sanitizedValue };
  }

  const stringValue = sanitizedValue.toString();

  // 长度验证
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(`至少需要${rules.minLength}个字符`);
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(`不能超过${rules.maxLength}个字符`);
  }

  // 模式验证
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push('格式不正确');
  }

  // 自定义验证
  if (rules.custom) {
    const customError = rules.custom(sanitizedValue);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
};

// 批量验证
export const validateForm = (data: Record<string, any>, rules: Record<string, ValidationRule>): {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: Record<string, any>;
} => {
  const errors: Record<string, string[]> = {};
  const sanitizedData: Record<string, any> = {};
  let isValid = true;

  for (const [field, rule] of Object.entries(rules)) {
    const result = validateField(data[field], rule);
    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }
    sanitizedData[field] = result.sanitizedValue;
  }

  return { isValid, errors, sanitizedData };
};

// XSS防护
export const preventXSS = (input: string): string => {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(input);
  }
  // 服务端简单防护
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// SQL注入防护（用于客户端验证）
export const preventSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/,
    /(\bOR\b|\bAND\b).*?[=<>]/i
  ];

  return !sqlPatterns.some(pattern => pattern.test(input));
};

export default {
  validate,
  sanitizeInput,
  validateField,
  validateForm,
  preventXSS,
  preventSQLInjection,
  VALIDATION_PATTERNS
};

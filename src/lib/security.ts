/**
 * 安全工具库
 * 提供输入验证、XSS防护、CSRF保护等安全功能
 */

import DOMPurify from 'isomorphic-dompurify';

// 输入验证规则
export const ValidationRules = {
  // 钱包地址验证
  walletAddress: /^0x[a-fA-F0-9]{40}$/,
  // 数字验证（支持小数）
  number: /^\d*\.?\d*$/,
  // 正整数验证
  positiveInteger: /^\d+$/,
  // URL验证
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  // 邮箱验证
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 用户名验证（字母数字下划线，3-20位）
  username: /^[a-zA-Z0-9_]{3,20}$/,
  // 哈希标签验证
  hashtag: /^#[a-zA-Z0-9_]+$/,
};

/**
 * 输入验证器
 */
export class InputValidator {
  /**
   * 验证钱包地址
   */
  static validateWalletAddress(address: string): boolean {
    return ValidationRules.walletAddress.test(address);
  }

  /**
   * 验证数字输入
   */
  static validateNumber(value: string): boolean {
    return ValidationRules.number.test(value) && !isNaN(parseFloat(value));
  }

  /**
   * 验证正整数
   */
  static validatePositiveInteger(value: string): boolean {
    return ValidationRules.positiveInteger.test(value) && parseInt(value) > 0;
  }

  /**
   * 验证URL
   */
  static validateUrl(url: string): boolean {
    return ValidationRules.url.test(url);
  }

  /**
   * 验证邮箱
   */
  static validateEmail(email: string): boolean {
    return ValidationRules.email.test(email);
  }

  /**
   * 验证用户名
   */
  static validateUsername(username: string): boolean {
    return ValidationRules.username.test(username);
  }

  /**
   * 验证哈希标签
   */
  static validateHashtag(hashtag: string): boolean {
    return ValidationRules.hashtag.test(hashtag);
  }

  /**
   * 验证数值范围
   */
  static validateRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * 验证字符串长度
   */
  static validateLength(str: string, min: number, max: number): boolean {
    return str.length >= min && str.length <= max;
  }
}

/**
 * XSS防护工具
 */
export class XSSProtection {
  /**
   * 清理HTML内容，防止XSS攻击
   */
  static sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  }

  /**
   * 转义HTML特殊字符
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 清理用户输入
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // 移除尖括号
      .replace(/javascript:/gi, '') // 移除javascript协议
      .replace(/on\w+=/gi, '') // 移除事件处理器
      .trim();
  }
}

/**
 * CSRF保护工具
 */
export class CSRFProtection {
  private static tokenKey = 'csrf_token';

  /**
   * 生成CSRF令牌
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 设置CSRF令牌
   */
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }

  /**
   * 获取CSRF令牌
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(this.tokenKey);
    }
    return null;
  }

  /**
   * 验证CSRF令牌
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  /**
   * 为请求添加CSRF令牌
   */
  static addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    return headers;
  }
}

/**
 * 安全的数据处理工具
 */
export class SecureDataHandler {
  /**
   * 安全地解析JSON
   */
  static safeJsonParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  /**
   * 安全地格式化数字
   */
  static safeFormatNumber(value: string | number, decimals: number = 2): string {
    try {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '0';
      return num.toFixed(decimals);
    } catch {
      return '0';
    }
  }

  /**
   * 安全地截断字符串
   */
  static safeTruncate(str: string, maxLength: number): string {
    if (!str || typeof str !== 'string') return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }

  /**
   * 安全地获取对象属性
   */
  static safeGet<T>(obj: any, path: string, fallback: T): T {
    try {
      const keys = path.split('.');
      let result = obj;
      for (const key of keys) {
        if (result === null || result === undefined) return fallback;
        result = result[key];
      }
      return result !== undefined ? result : fallback;
    } catch {
      return fallback;
    }
  }
}

/**
 * 速率限制工具
 */
export class RateLimiter {
  private static requests = new Map<string, number[]>();

  /**
   * 检查是否超过速率限制
   */
  static isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // 清理过期的请求记录
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return true;
    }
    
    // 记录新请求
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return false;
  }

  /**
   * 清理过期的记录
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < 60000); // 保留1分钟内的记录
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

/**
 * 安全配置
 */
export const SecurityConfig = {
  // 输入长度限制
  maxInputLength: {
    username: 20,
    email: 100,
    url: 500,
    description: 1000,
    content: 5000,
  },
  
  // 数值限制
  numberLimits: {
    minAmount: 0.000001,
    maxAmount: 1000000,
    maxDecimals: 18,
  },
  
  // 速率限制
  rateLimits: {
    api: { maxRequests: 100, windowMs: 60000 }, // 每分钟100次
    wallet: { maxRequests: 10, windowMs: 60000 }, // 每分钟10次
    submit: { maxRequests: 5, windowMs: 60000 }, // 每分钟5次
  },
};

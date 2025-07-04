/**
 * 安全HTTP客户端
 * 提供CSRF保护、速率限制、输入验证等安全功能
 */

import { CSRFProtection, RateLimiter } from './security';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  rateLimitKey?: string;
  skipCSRF?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

class SecureHttpClient {
  private baseURL: string;
  private defaultTimeout: number = 10000; // 10秒超时
  private defaultRetries: number = 3;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  /**
   * 发送安全的HTTP请求
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      rateLimitKey,
      skipCSRF = false
    } = config;

    // 速率限制检查
    if (rateLimitKey) {
      if (RateLimiter.isRateLimited(rateLimitKey, 10, 60000)) {
        return {
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        };
      }
    }

    // 构建完整URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    // 准备请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // 添加CSRF令牌（对于非GET请求）
    if (!skipCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = CSRFProtection.getToken();
      if (csrfToken) {
        requestHeaders['X-CSRF-Token'] = csrfToken;
      } else {
        // 如果没有CSRF令牌，先获取一个
        try {
          await this.refreshCSRFToken();
          const newToken = CSRFProtection.getToken();
          if (newToken) {
            requestHeaders['X-CSRF-Token'] = newToken;
          }
        } catch (error) {
          console.warn('Failed to get CSRF token:', error);
        }
      }
    }

    // 准备请求体
    let requestBody: string | undefined;
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        requestBody = JSON.stringify(body);
      } catch (error) {
        return {
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        };
      }
    }

    // 执行请求（带重试机制）
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 解析响应
        const result = await this.parseResponse<T>(response);

        // 如果是CSRF错误，尝试刷新令牌并重试
        if (!result.success && result.code === 'CSRF_TOKEN_INVALID' && attempt === 0) {
          try {
            await this.refreshCSRFToken();
            continue; // 重试请求
          } catch (error) {
            console.warn('Failed to refresh CSRF token:', error);
          }
        }

        return result;

      } catch (error) {
        console.error(`Request attempt ${attempt + 1} failed:`, error);

        // 如果是最后一次尝试，返回错误
        if (attempt === retries) {
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              return {
                success: false,
                error: 'Request timeout',
                code: 'TIMEOUT'
              };
            }
            return {
              success: false,
              error: error.message,
              code: 'NETWORK_ERROR'
            };
          }
          return {
            success: false,
            error: 'Unknown error occurred',
            code: 'UNKNOWN_ERROR'
          };
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      code: 'MAX_RETRIES_EXCEEDED'
    };
  }

  /**
   * 解析响应
   */
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (response.ok) {
          return {
            success: true,
            data: data.data || data,
            message: data.message
          };
        } else {
          return {
            success: false,
            error: data.error || `HTTP ${response.status}`,
            code: data.code || `HTTP_${response.status}`,
            message: data.message
          };
        }
      } else {
        const text = await response.text();
        
        if (response.ok) {
          return {
            success: true,
            data: text as any
          };
        } else {
          return {
            success: false,
            error: text || `HTTP ${response.status}`,
            code: `HTTP_${response.status}`
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse response',
        code: 'PARSE_ERROR'
      };
    }
  }

  /**
   * 刷新CSRF令牌
   */
  private async refreshCSRFToken(): Promise<void> {
    try {
      const response = await fetch('/api/security/csrf', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          CSRFProtection.setToken(data.token);
        }
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
      throw error;
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST请求
   */
  async post<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * PUT请求
   */
  async put<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }
}

// 创建默认实例
export const secureHttpClient = new SecureHttpClient();

// 导出类以便创建自定义实例
export { SecureHttpClient };

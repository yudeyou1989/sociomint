/**
 * 前端多级缓存策略
 * 包含内存缓存、IndexedDB存储和Service Worker缓存三个层级
 */

type CacheItem<T> = {
  value: T;
  expires: number;
};

// 配置选项
interface CacheOptions {
  memory: {
    enabled: boolean;
    maxItems: number;
    ttl: number; // 毫秒
  };
  indexedDB: {
    enabled: boolean;
    dbName: string;
    storeName: string;
    ttl: number; // 毫秒
  };
  serviceWorker: {
    enabled: boolean;
    cacheName: string;
    ttl: number; // 毫秒
  };
}

// 默认配置
const DEFAULT_OPTIONS: CacheOptions = {
  memory: {
    enabled: true,
    maxItems: 100,
    ttl: 5 * 60 * 1000, // 5分钟
  },
  indexedDB: {
    enabled: true,
    dbName: 'sociomint-cache',
    storeName: 'cache-store',
    ttl: 24 * 60 * 60 * 1000, // 24小时
  },
  serviceWorker: {
    enabled: true,
    cacheName: 'sociomint-sw-cache',
    ttl: 7 * 24 * 60 * 60 * 1000, // 7天
  },
};

// 内存缓存实现
class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private timestamps = new Map<string, number>();
  private config: CacheOptions['memory'];

  constructor(config: CacheOptions['memory']) {
    this.config = config;
    
    // 定期清理过期缓存
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
    }
  }

  get(key: string): T | null {
    if (!this.config.enabled || !this.cache.has(key)) return null;
    
    const item = this.cache.get(key)!;
    if (Date.now() > item.expires) {
      this.delete(key);
      return null;
    }
    
    // 更新访问时间
    this.timestamps.set(key, Date.now());
    return item.value;
  }

  set(key: string, value: T, ttl = this.config.ttl): void {
    if (!this.config.enabled) return;
    
    // 如果超出限制，删除最早访问的项
    if (this.cache.size >= this.config.maxItems) {
      const oldest = [...this.timestamps.entries()]
        .sort((a, b) => a[1] - b[1])[0][0];
      this.delete(oldest);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
    this.timestamps.set(key, Date.now());
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.delete(key);
      }
    }
  }
}

// IndexedDB 缓存实现
class IndexedDBCache<T = any> {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private config: CacheOptions['indexedDB'];

  constructor(config: CacheOptions['indexedDB']) {
    this.config = config;
    
    if (typeof window !== 'undefined' && this.config.enabled) {
      this.initDB();
      
      // 定期清理过期缓存
      setInterval(() => this.cleanup(), 15 * 60 * 1000); // 每15分钟清理一次
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(this.config.dbName, 1);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName, { keyPath: 'key' });
        }
      };
    });
    
    return this.dbPromise;
  }

  async get(key: string): Promise<T | null> {
    if (!this.config.enabled || typeof window === 'undefined') return null;
    
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.config.storeName, 'readonly');
        const store = transaction.objectStore(this.config.storeName);
        const request = store.get(key);
        
        request.onerror = () => {
          reject(request.error);
        };
        
        request.onsuccess = () => {
          if (!request.result) {
            resolve(null);
            return;
          }
          
          const item = request.result as unknown as { key: string, item: CacheItem<T> };
          if (Date.now() > item.item.expires) {
            this.delete(key);
            resolve(null);
            return;
          }
          
          resolve(item.item.value);
        };
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  async set(key: string, value: T, ttl = this.config.ttl): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined') return;
    
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.config.storeName, 'readwrite');
        const store = transaction.objectStore(this.config.storeName);
        const request = store.put({
          key,
          item: {
            value,
            expires: Date.now() + ttl,
          },
        });
        
        request.onerror = () => {
          reject(request.error);
        };
        
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('IndexedDB set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined') return;
    
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.config.storeName, 'readwrite');
        const store = transaction.objectStore(this.config.storeName);
        const request = store.delete(key);
        
        request.onerror = () => {
          reject(request.error);
        };
        
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('IndexedDB delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined') return;
    
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.config.storeName, 'readwrite');
        const store = transaction.objectStore(this.config.storeName);
        const request = store.clear();
        
        request.onerror = () => {
          reject(request.error);
        };
        
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }

  private async cleanup(): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined') return;
    
    try {
      const db = await this.initDB();
      const transaction = db.transaction(this.config.storeName, 'readwrite');
      const store = transaction.objectStore(this.config.storeName);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item = cursor.value;
          if (Date.now() > item.item.expires) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('IndexedDB cleanup error:', error);
    }
  }
}

// Service Worker 缓存实现
class ServiceWorkerCache {
  private config: CacheOptions['serviceWorker'];

  constructor(config: CacheOptions['serviceWorker']) {
    this.config = config;
    
    if (typeof window !== 'undefined' && this.config.enabled) {
      // 注册 Service Worker
      this.registerServiceWorker();
      
      // 定期清理过期缓存
      setInterval(() => this.cleanup(), 60 * 60 * 1000); // 每小时清理一次
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async get(url: string): Promise<Response | null> {
    if (!this.config.enabled || typeof window === 'undefined' || !('caches' in window)) {
      return null;
    }
    
    try {
      const cache = await caches.open(this.config.cacheName);
      const response = await cache.match(url);
      
      if (!response) return null;
      
      // 检查是否过期
      const expires = response.headers.get('sw-cache-expires');
      if (expires && Date.now() > parseInt(expires, 10)) {
        await this.delete(url);
        return null;
      }
      
      return response;
    } catch (error) {
      console.error('ServiceWorker cache get error:', error);
      return null;
    }
  }

  async set(url: string, response: Response, ttl = this.config.ttl): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined' || !('caches' in window)) {
      return;
    }
    
    try {
      const cache = await caches.open(this.config.cacheName);
      
      // 克隆响应并添加过期时间
      const expires = Date.now() + ttl;
      const headers = new Headers(response.headers);
      headers.set('sw-cache-expires', expires.toString());
      
      const clonedResponse = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      
      await cache.put(url, clonedResponse);
    } catch (error) {
      console.error('ServiceWorker cache set error:', error);
    }
  }

  async delete(url: string): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined' || !('caches' in window)) {
      return;
    }
    
    try {
      const cache = await caches.open(this.config.cacheName);
      await cache.delete(url);
    } catch (error) {
      console.error('ServiceWorker cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined' || !('caches' in window)) {
      return;
    }
    
    try {
      await caches.delete(this.config.cacheName);
    } catch (error) {
      console.error('ServiceWorker cache clear error:', error);
    }
  }

  private async cleanup(): Promise<void> {
    if (!this.config.enabled || typeof window === 'undefined' || !('caches' in window)) {
      return;
    }
    
    try {
      const cache = await caches.open(this.config.cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (!response) continue;
        
        const expires = response.headers.get('sw-cache-expires');
        if (expires && Date.now() > parseInt(expires, 10)) {
          await cache.delete(request);
        }
      }
    } catch (error) {
      console.error('ServiceWorker cache cleanup error:', error);
    }
  }
}

// 主缓存类，整合所有缓存策略
class CacheStrategy<T = any> {
  private memoryCache: MemoryCache<T>;
  private indexedDBCache: IndexedDBCache<T>;
  private serviceWorkerCache: ServiceWorkerCache;
  private config: CacheOptions;

  constructor(options: Partial<CacheOptions> = {}) {
    this.config = {
      memory: { ...DEFAULT_OPTIONS.memory, ...options.memory },
      indexedDB: { ...DEFAULT_OPTIONS.indexedDB, ...options.indexedDB },
      serviceWorker: { ...DEFAULT_OPTIONS.serviceWorker, ...options.serviceWorker },
    };
    
    this.memoryCache = new MemoryCache<T>(this.config.memory);
    this.indexedDBCache = new IndexedDBCache<T>(this.config.indexedDB);
    this.serviceWorkerCache = new ServiceWorkerCache(this.config.serviceWorker);
  }

  async get(key: string, options?: { skipMemory?: boolean }): Promise<T | null> {
    // 1. 先从内存缓存获取
    if (!options?.skipMemory) {
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult !== null) {
        return memoryResult;
      }
    }
    
    // 2. 尝试从 IndexedDB 缓存获取
    const indexedDBResult = await this.indexedDBCache.get(key);
    if (indexedDBResult !== null) {
      // 回填内存缓存
      this.memoryCache.set(key, indexedDBResult);
      return indexedDBResult;
    }
    
    // 3. 对于 URL 类型的 key，尝试从 Service Worker 缓存获取
    if (key.startsWith('http')) {
      const swResponse = await this.serviceWorkerCache.get(key);
      if (swResponse) {
        try {
          // 假设 T 是 JSON 数据
          const data = await swResponse.json() as T;
          // 回填其他级别缓存
          this.memoryCache.set(key, data);
          await this.indexedDBCache.set(key, data);
          return data;
        } catch (error) {
          console.error('Error parsing SW cache response:', error);
        }
      }
    }
    
    return null;
  }

  async set(key: string, value: T, options?: {
    memoryTTL?: number;
    indexedDBTTL?: number;
    serviceWorkerTTL?: number;
  }): Promise<void> {
    // 设置内存缓存
    this.memoryCache.set(key, value, options?.memoryTTL);
    
    // 设置 IndexedDB 缓存
    await this.indexedDBCache.set(key, value, options?.indexedDBTTL);
    
    // 对于 URL 类型的 key，设置 Service Worker 缓存
    if (key.startsWith('http') && typeof window !== 'undefined' && ('Response' in window)) {
      const response = new Response(JSON.stringify(value), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      await this.serviceWorkerCache.set(key, response, options?.serviceWorkerTTL);
    }
  }

  async delete(key: string): Promise<void> {
    // 清除所有缓存级别
    this.memoryCache.delete(key);
    await this.indexedDBCache.delete(key);
    
    if (key.startsWith('http')) {
      await this.serviceWorkerCache.delete(key);
    }
  }

  async clear(): Promise<void> {
    // 清除所有缓存
    this.memoryCache.clear();
    await this.indexedDBCache.clear();
    await this.serviceWorkerCache.clear();
  }

  // 仅清除特定缓存级别
  async clearLevel(level: 'memory' | 'indexedDB' | 'serviceWorker'): Promise<void> {
    if (level === 'memory') {
      this.memoryCache.clear();
    } else if (level === 'indexedDB') {
      await this.indexedDBCache.clear();
    } else if (level === 'serviceWorker') {
      await this.serviceWorkerCache.clear();
    }
  }
}

// 导出默认全局缓存实例
export const globalCache = new CacheStrategy();

// 导出自定义缓存创建函数
export function createCache<T = any>(options?: Partial<CacheOptions>): CacheStrategy<T> {
  return new CacheStrategy<T>(options);
}

// 导出主类，允许完全自定义
export { CacheStrategy, MemoryCache, IndexedDBCache, ServiceWorkerCache }; 
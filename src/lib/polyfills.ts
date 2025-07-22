/**
 * Polyfills for browser and Node.js environments
 * 解决跨环境依赖问题
 */

// 解决"self is not defined"错误
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global;
}

// 解决"window is not defined"错误
if (typeof global !== 'undefined' && typeof global.window === 'undefined') {
  global.window = global as any;
}

// Polyfill global fetch for environments where it might be missing
if (typeof window !== 'undefined') {
  // Browser environment
  if (!window.fetch) {
    import('cross-fetch').then(({ default: fetch }) => {
      window.fetch = fetch;
    });
  }
} else {
  // Node.js environment
  if (typeof global !== 'undefined' && !global.fetch) {
    import('cross-fetch').then(({ default: fetch }) => {
      global.fetch = fetch;
    });
  }
}

export {}; 
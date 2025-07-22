import * as Sentry from '@sentry/nextjs';

// 请求错误处理钩子
export const onRequestError = Sentry.captureRequestError;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 服务器端Sentry初始化
    const { init } = await import('@sentry/nextjs');
    
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
      debug: false,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      initialScope: {
        tags: {
          component: 'server',
          platform: 'web3',
        },
      },
      beforeSend(event, hint) {
        if (event.exception) {
          const error = hint.originalException;
          
          if (error && typeof error === 'object' && 'message' in error) {
            const message = error.message as string;
            
            if (
              message.includes('ECONNRESET') ||
              message.includes('ENOTFOUND') ||
              message.includes('timeout')
            ) {
              return null;
            }
          }
        }
        
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge运行时Sentry初始化
    const { init } = await import('@sentry/nextjs');
    
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
      debug: false,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      initialScope: {
        tags: {
          component: 'edge',
          platform: 'web3',
        },
      },
    });
  }
}

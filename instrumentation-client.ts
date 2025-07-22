// This file configures the initialization of Sentry on the browser/client side
import * as Sentry from '@sentry/nextjs';

// 导出路由转换钩子
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  replaysOnErrorSampleRate: 1.0,
  
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,
  
  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Performance Monitoring
  beforeSend(event, hint) {
    // Filter out some errors that are not useful
    if (event.exception) {
      const error = hint.originalException;
      
      // Filter out network errors
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        if (
          message.includes('Network Error') ||
          message.includes('Failed to fetch') ||
          message.includes('Load failed')
        ) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Additional tags
  initialScope: {
    tags: {
      component: 'client',
      platform: 'web3',
    },
  },
});

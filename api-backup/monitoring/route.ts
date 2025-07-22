/**
 * 监控数据收集API
 * 接收前端发送的错误、性能、用户行为数据
 */

import { NextRequest, NextResponse } from 'next/server';

// 配置为动态路由以支持静态导出
export const dynamic = 'force-dynamic';

interface MonitoringEvent {
  type: 'error' | 'performance' | 'user_event';
  data: any;
  timestamp: number;
  sessionId: string;
  userId?: string;
  environment: string;
}

/**
 * 接收监控数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, environment, timestamp } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      );
    }

    // 处理每个事件
    for (const event of events) {
      await processMonitoringEvent(event, environment);
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error processing monitoring data:', error);
    
    return NextResponse.json(
      { error: 'Failed to process monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * 处理单个监控事件
 */
async function processMonitoringEvent(event: any, environment: string): Promise<void> {
  try {
    // 根据事件类型进行不同处理
    if (isErrorEvent(event)) {
      await processErrorEvent(event, environment);
    } else if (isPerformanceEvent(event)) {
      await processPerformanceEvent(event, environment);
    } else if (isUserEvent(event)) {
      await processUserEvent(event, environment);
    }
  } catch (error) {
    console.error('Error processing individual event:', error);
  }
}

/**
 * 处理错误事件
 */
async function processErrorEvent(event: any, environment: string): Promise<void> {
  const errorData = {
    message: event.message,
    stack: event.stack,
    url: event.url,
    userAgent: event.userAgent,
    timestamp: event.timestamp,
    userId: event.userId,
    sessionId: event.sessionId,
    environment,
    buildId: event.buildId,
  };

  // 记录到控制台
  console.error('Frontend Error:', errorData);

  // 这里可以发送到外部监控服务
  // 例如：Sentry, LogRocket, DataDog 等
  if (process.env.SENTRY_DSN) {
    // await sendToSentry(errorData);
  }

  // 存储到数据库（如果需要）
  if (shouldStoreError(errorData)) {
    await storeErrorToDatabase(errorData);
  }

  // 发送告警（严重错误）
  if (isCriticalError(errorData)) {
    await sendErrorAlert(errorData);
  }
}

/**
 * 处理性能事件
 */
async function processPerformanceEvent(event: any, environment: string): Promise<void> {
  const performanceData = {
    name: event.name,
    value: event.value,
    unit: event.unit,
    timestamp: event.timestamp,
    tags: event.tags,
    environment,
  };

  // 记录性能指标
  console.log('Performance Metric:', performanceData);

  // 发送到性能监控服务
  if (process.env.PERFORMANCE_MONITORING_ENDPOINT) {
    // await sendToPerformanceService(performanceData);
  }

  // 检查性能阈值
  if (isPerformanceIssue(performanceData)) {
    await handlePerformanceIssue(performanceData);
  }
}

/**
 * 处理用户事件
 */
async function processUserEvent(event: any, environment: string): Promise<void> {
  const userEventData = {
    type: event.type,
    action: event.action,
    category: event.category,
    label: event.label,
    value: event.value,
    properties: event.properties,
    timestamp: event.timestamp,
    userId: event.userId,
    sessionId: event.sessionId,
    environment,
  };

  // 记录用户行为
  console.log('User Event:', userEventData);

  // 发送到分析服务
  if (process.env.ANALYTICS_ENDPOINT) {
    // await sendToAnalyticsService(userEventData);
  }

  // 更新用户行为统计
  await updateUserBehaviorStats(userEventData);
}

/**
 * 判断是否为错误事件
 */
function isErrorEvent(event: any): boolean {
  return event.message && (event.stack || event.componentStack);
}

/**
 * 判断是否为性能事件
 */
function isPerformanceEvent(event: any): boolean {
  return event.name && typeof event.value === 'number' && event.unit;
}

/**
 * 判断是否为用户事件
 */
function isUserEvent(event: any): boolean {
  return event.type && event.action && event.category;
}

/**
 * 判断是否应该存储错误
 */
function shouldStoreError(errorData: any): boolean {
  // 过滤掉一些不重要的错误
  const ignoredErrors = [
    'Script error',
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
  ];

  return !ignoredErrors.some(ignored => 
    errorData.message.includes(ignored)
  );
}

/**
 * 判断是否为严重错误
 */
function isCriticalError(errorData: any): boolean {
  const criticalKeywords = [
    'ChunkLoadError',
    'TypeError: Cannot read property',
    'ReferenceError',
    'wallet',
    'transaction',
    'contract',
  ];

  return criticalKeywords.some(keyword => 
    errorData.message.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 判断是否为性能问题
 */
function isPerformanceIssue(performanceData: any): boolean {
  const thresholds = {
    page_load_time: 3000, // 3秒
    dom_content_loaded: 2000, // 2秒
    resource_load_time: 1000, // 1秒
  };

  const threshold = thresholds[performanceData.name as keyof typeof thresholds];
  return threshold && performanceData.value > threshold;
}

/**
 * 存储错误到数据库
 */
async function storeErrorToDatabase(errorData: any): Promise<void> {
  // 这里可以存储到 Supabase 或其他数据库
  try {
    // const { error } = await supabase
    //   .from('error_logs')
    //   .insert([errorData]);
    
    // if (error) throw error;
  } catch (error) {
    console.error('Failed to store error to database:', error);
  }
}

/**
 * 发送错误告警
 */
async function sendErrorAlert(errorData: any): Promise<void> {
  // 这里可以发送到 Slack、Discord、邮件等
  try {
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Error in ${errorData.environment}`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Message', value: errorData.message, short: false },
              { title: 'URL', value: errorData.url, short: true },
              { title: 'User Agent', value: errorData.userAgent, short: true },
              { title: 'Timestamp', value: new Date(errorData.timestamp).toISOString(), short: true },
            ],
          }],
        }),
      });
    }
  } catch (error) {
    console.error('Failed to send error alert:', error);
  }
}

/**
 * 处理性能问题
 */
async function handlePerformanceIssue(performanceData: any): Promise<void> {
  console.warn('Performance Issue Detected:', performanceData);
  
  // 这里可以触发性能优化建议或告警
  if (process.env.PERFORMANCE_ALERT_WEBHOOK) {
    try {
      await fetch(process.env.PERFORMANCE_ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_issue',
          data: performanceData,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }
}

/**
 * 更新用户行为统计
 */
async function updateUserBehaviorStats(userEventData: any): Promise<void> {
  // 这里可以更新用户行为统计数据
  try {
    // 例如：页面浏览量、点击热力图、用户路径分析等
    if (userEventData.type === 'view') {
      // 更新页面浏览统计
    } else if (userEventData.type === 'click') {
      // 更新点击统计
    } else if (userEventData.type === 'transaction') {
      // 更新交易统计
    }
  } catch (error) {
    console.error('Failed to update user behavior stats:', error);
  }
}

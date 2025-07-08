# SocioMint API 文档

## 📋 概述

SocioMint 提供了一套完整的 RESTful API，用于处理代币交换、社交任务、空投池等功能。

## 🔐 认证

大部分 API 端点需要用户认证。认证方式：

### 钱包签名认证
```javascript
// 前端示例
const message = `Login to SocioMint at ${timestamp}`;
const signature = await signer.signMessage(message);

// 请求头
headers: {
  'Authorization': `Wallet ${walletAddress}:${signature}:${timestamp}`
}
```

## 📡 API 端点

### 1. 社交任务 API

#### 获取任务列表
```http
GET /api/social-tasks
```

**查询参数：**
- `platform` (可选): twitter | telegram | discord
- `status` (可选): active | completed | expired
- `limit` (可选): 数量限制，默认 20
- `offset` (可选): 偏移量，默认 0

**响应示例：**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_123",
        "title": "关注 Twitter 账号",
        "description": "关注 @SocioMint 官方账号",
        "platform": "twitter",
        "reward_amount": "100",
        "reward_type": "red_flowers",
        "status": "active",
        "requirements": {
          "action": "follow",
          "target": "@SocioMint"
        },
        "created_at": "2024-01-01T00:00:00Z",
        "expires_at": "2024-12-31T23:59:59Z"
      }
    ],
    "total": 50,
    "has_more": true
  }
}
```

#### 提交任务完成
```http
POST /api/social-tasks/submit
```

**请求体：**
```json
{
  "task_id": "task_123",
  "proof": {
    "screenshot_url": "https://example.com/proof.jpg",
    "social_link": "https://twitter.com/username",
    "additional_data": {}
  }
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "submission_id": "sub_456",
    "status": "pending_review",
    "estimated_review_time": "24h"
  }
}
```

### 2. 空投池 API

#### 获取空投池列表
```http
GET /api/airdrop-pools
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "pools": [
      {
        "id": "pool_123",
        "name": "Weekly SM Token Airdrop",
        "description": "每周 SM 代币空投",
        "total_amount": "10000",
        "remaining_amount": "7500",
        "participants_count": 150,
        "max_participants": 1000,
        "entry_cost": "100",
        "entry_cost_type": "red_flowers",
        "distribution_type": "random",
        "status": "active",
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-01-07T23:59:59Z",
        "distribution_time": "2024-01-08T00:00:00Z"
      }
    ]
  }
}
```

#### 参与空投池
```http
POST /api/airdrop-pools/participate
```

**请求体：**
```json
{
  "pool_id": "pool_123",
  "entry_amount": "100"
}
```

### 3. 软质押 API

#### 获取用户软质押统计
```http
GET /api/soft-staking?wallet=0x123...&action=stats
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "user_wallet": "0x123...",
    "current_balance": "1000.5",
    "total_rewards_earned": "250.75",
    "current_holding_period": {
      "start_time": "2024-01-01T00:00:00Z",
      "duration_hours": 168,
      "min_balance": "1000.0",
      "is_qualified": true
    },
    "daily_reward_status": {
      "last_claim_date": "2024-01-07",
      "available_rewards": "10",
      "next_claim_available": "2024-01-08T00:00:00Z"
    }
  }
}
```

#### 领取每日奖励
```http
POST /api/soft-staking
```

**请求体：**
```json
{
  "action": "claim_daily_reward",
  "wallet": "0x123...",
  "current_balance": "1000.5"
}
```

### 4. 监控 API

#### 提交错误报告
```http
POST /api/monitoring
```

**请求体：**
```json
{
  "type": "error",
  "data": {
    "message": "Transaction failed",
    "stack": "Error stack trace...",
    "user_agent": "Mozilla/5.0...",
    "url": "/exchange",
    "timestamp": "2024-01-01T12:00:00Z",
    "severity": "high"
  }
}
```

#### 提交性能指标
```http
POST /api/monitoring
```

**请求体：**
```json
{
  "type": "performance",
  "data": {
    "fcp": 1200,
    "lcp": 2500,
    "fid": 50,
    "cls": 0.1,
    "ttfb": 300,
    "page": "/exchange"
  }
}
```

### 5. 安全 API

#### 获取 CSRF Token
```http
GET /api/security/csrf
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "csrf_token": "abc123...",
    "expires_at": "2024-01-01T13:00:00Z"
  }
}
```

## 🚨 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "INVALID_WALLET_ADDRESS",
    "message": "提供的钱包地址格式无效",
    "details": {
      "field": "wallet",
      "provided_value": "invalid_address"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 常见错误代码

| 错误代码 | HTTP 状态 | 描述 |
|---------|----------|------|
| `INVALID_WALLET_ADDRESS` | 400 | 钱包地址格式无效 |
| `INSUFFICIENT_BALANCE` | 400 | 余额不足 |
| `TASK_NOT_FOUND` | 404 | 任务不存在 |
| `TASK_ALREADY_COMPLETED` | 409 | 任务已完成 |
| `POOL_FULL` | 409 | 空投池已满 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

## 🔄 速率限制

| 端点类型 | 限制 | 时间窗口 |
|---------|------|----------|
| 一般 API | 100 请求 | 1 分钟 |
| 认证 API | 50 请求 | 1 分钟 |
| 敏感操作 | 20 请求 | 1 分钟 |

超出限制时返回 429 状态码，响应头包含：
- `X-RateLimit-Limit`: 限制数量
- `X-RateLimit-Remaining`: 剩余请求数
- `X-RateLimit-Reset`: 重置时间戳
- `Retry-After`: 重试等待秒数

## 📝 请求/响应示例

### 完整的请求示例
```javascript
const response = await fetch('/api/social-tasks', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Wallet 0x123...:signature:timestamp',
    'X-CSRF-Token': 'csrf_token_here'
  }
});

const data = await response.json();
if (data.success) {
  console.log('任务列表:', data.data.tasks);
} else {
  console.error('错误:', data.error.message);
}
```

## 🔧 开发工具

### API 测试
推荐使用以下工具测试 API：
- Postman
- Insomnia
- curl
- 浏览器开发者工具

### SDK 和库
```javascript
// 官方 JavaScript SDK (计划中)
import { SocioMintAPI } from '@sociomint/sdk';

const api = new SocioMintAPI({
  baseURL: 'https://sociomint.top/api',
  wallet: walletInstance
});

const tasks = await api.socialTasks.list();
```

## 📊 API 状态监控

实时 API 状态：https://status.sociomint.top

### 健康检查端点
```http
GET /api/health
```

**响应示例：**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "services": {
    "database": "healthy",
    "blockchain": "healthy",
    "external_apis": "healthy"
  },
  "version": "1.0.0"
}
```

## 🔄 版本控制

API 使用语义化版本控制。当前版本：`v1`

### 版本兼容性
- 主版本更新：可能包含破坏性变更
- 次版本更新：向后兼容的新功能
- 补丁版本：向后兼容的错误修复

### 弃用政策
- 弃用功能将提前 3 个月通知
- 旧版本将在新版本发布后支持 6 个月
- 关键安全更新将立即应用于所有支持版本

# SocioMint API 文档

## 概述

SocioMint API 提供了完整的社交任务、空投池和监控功能。所有API端点都支持JSON格式的请求和响应。

## 基础信息

- **Base URL**: `https://sociomint.top/api`
- **Content-Type**: `application/json`
- **认证**: 部分端点需要钱包签名认证

## 错误处理

所有API响应都遵循统一的错误格式：

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 常见错误码

- `VALIDATION_ERROR` - 输入验证失败
- `AUTHENTICATION_REQUIRED` - 需要身份认证
- `RATE_LIMIT_EXCEEDED` - 请求频率超限
- `INTERNAL_ERROR` - 服务器内部错误

## API 端点

### 1. 社交任务 API

#### GET /api/social-tasks

获取社交任务列表

**查询参数**:
- `platform` (可选): 平台筛选 (`twitter`, `discord`, `telegram`)
- `status` (可选): 状态筛选 (`active`, `completed`, `expired`)
- `limit` (可选): 返回数量限制 (默认: 20)
- `offset` (可选): 偏移量 (默认: 0)

**响应示例**:
```json
{
  "success": true,
  "tasks": [
    {
      "id": "task_123",
      "title": "关注Twitter账户",
      "description": "关注 @SocioMint 官方Twitter账户",
      "platform": "twitter",
      "reward_flowers": 10,
      "requirements": {
        "action": "follow",
        "target": "@SocioMint"
      },
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-12-31T23:59:59Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

#### POST /api/social-tasks

创建新的社交任务 (管理员功能)

**请求体**:
```json
{
  "title": "任务标题",
  "description": "任务描述",
  "platform": "twitter",
  "reward_flowers": 10,
  "requirements": {
    "action": "follow",
    "target": "@SocioMint"
  },
  "expires_at": "2024-12-31T23:59:59Z"
}
```

**响应示例**:
```json
{
  "success": true,
  "task": {
    "id": "task_124",
    "title": "任务标题",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/social-tasks/submit

提交任务完成证明

**请求体**:
```json
{
  "task_id": "task_123",
  "user_address": "0x...",
  "proof": {
    "screenshot_url": "https://...",
    "social_profile": "@username"
  },
  "signature": "0x..."
}
```

**响应示例**:
```json
{
  "success": true,
  "submission": {
    "id": "submission_456",
    "status": "pending",
    "submitted_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. 空投池 API

#### GET /api/airdrop-pools

获取空投池列表

**查询参数**:
- `status` (可选): 状态筛选 (`active`, `ended`, `upcoming`)
- `sort` (可选): 排序方式 (`created_at`, `end_time`, `total_reward`)

**响应示例**:
```json
{
  "success": true,
  "pools": [
    {
      "id": "pool_789",
      "title": "新年空投池",
      "description": "庆祝新年的特别空投",
      "total_reward": "1000",
      "participants_count": 150,
      "min_flowers": 100,
      "start_time": "2024-01-01T00:00:00Z",
      "end_time": "2024-01-31T23:59:59Z",
      "status": "active"
    }
  ]
}
```

#### POST /api/airdrop-pools

创建新的空投池 (管理员功能)

**请求体**:
```json
{
  "title": "空投池标题",
  "description": "空投池描述",
  "total_reward": "1000",
  "min_flowers": 100,
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-31T23:59:59Z"
}
```

#### POST /api/airdrop-pools/participate

参与空投池

**请求体**:
```json
{
  "pool_id": "pool_789",
  "user_address": "0x...",
  "flower_amount": 150,
  "signature": "0x..."
}
```

**响应示例**:
```json
{
  "success": true,
  "participation": {
    "id": "participation_101",
    "pool_id": "pool_789",
    "flower_amount": 150,
    "estimated_reward": "10.5",
    "participated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3. 监控 API

#### POST /api/monitoring

提交监控数据

**请求体**:
```json
{
  "events": [
    {
      "type": "error",
      "message": "错误信息",
      "stack": "错误堆栈",
      "url": "https://sociomint.top/page",
      "timestamp": 1704067200000,
      "sessionId": "session_123"
    }
  ],
  "environment": "production"
}
```

**响应示例**:
```json
{
  "success": true,
  "processed": 1,
  "timestamp": 1704067200000
}
```

### 4. 安全 API

#### GET /api/security/csrf

获取CSRF令牌

**响应示例**:
```json
{
  "success": true,
  "token": "csrf_token_abc123",
  "expires_at": "2024-01-01T01:00:00Z"
}
```

## 认证

### 钱包签名认证

某些API端点需要钱包签名认证。签名消息格式：

```
SocioMint Authentication
Address: {user_address}
Timestamp: {timestamp}
Nonce: {random_nonce}
```

### 请求头

需要认证的请求应包含以下头部：

```
Authorization: Wallet {address}:{signature}:{timestamp}:{nonce}
```

## 速率限制

- **默认限制**: 每分钟100请求
- **认证用户**: 每分钟200请求
- **管理员**: 每分钟500请求

超出限制时返回 `429 Too Many Requests`。

## SDK 示例

### JavaScript/TypeScript

```typescript
import { SocioMintAPI } from '@sociomint/sdk';

const api = new SocioMintAPI({
  baseURL: 'https://sociomint.top/api',
  wallet: walletInstance
});

// 获取社交任务
const tasks = await api.socialTasks.list({
  platform: 'twitter',
  status: 'active'
});

// 参与空投池
const participation = await api.airdropPools.participate({
  poolId: 'pool_789',
  flowerAmount: 150
});
```

### cURL 示例

```bash
# 获取社交任务
curl -X GET "https://sociomint.top/api/social-tasks?platform=twitter" \
  -H "Content-Type: application/json"

# 参与空投池 (需要认证)
curl -X POST "https://sociomint.top/api/airdrop-pools/participate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Wallet 0x...:0x...:1704067200:abc123" \
  -d '{
    "pool_id": "pool_789",
    "user_address": "0x...",
    "flower_amount": 150,
    "signature": "0x..."
  }'
```

## 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `429` - 请求过于频繁
- `500` - 服务器错误

## 更新日志

### v1.0.0 (2024-01-01)
- 初始API版本
- 社交任务功能
- 空投池功能
- 监控功能
- 安全认证

## 支持

如有API相关问题，请联系：
- 技术支持: support@sociomint.top
- 文档反馈: docs@sociomint.top

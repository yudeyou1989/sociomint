# Supabase 部署指南

*更新日期: 2025年4月28日*

本指南提供了将 SocioMint 项目部署到生产环境的详细说明，特别是 Supabase 数据库部分。

## 目录

1. [环境要求](#环境要求)
2. [部署前准备](#部署前准备)
3. [数据库迁移](#数据库迁移)
4. [环境变量配置](#环境变量配置)
5. [前端部署](#前端部署)
6. [部署后检查](#部署后检查)
7. [备份与恢复](#备份与恢复)
8. [故障排除](#故障排除)

## 环境要求

### 最低要求

- Node.js v16 或更高版本
- npm v7 或更高版本
- Supabase 项目（生产环境）
- 支持 HTTPS 的 Web 服务器（例如 Nginx、Apache）

### 推荐配置

- Node.js v18 LTS
- npm v8 或更高版本
- Supabase Pro 计划（用于更好的性能和更多功能）
- 托管在 Vercel、Netlify 或 AWS 上的前端

## 部署前准备

1. **确认所有测试通过**
   
   在部署到生产环境之前，请确保所有权限控制测试通过：
   
   ```bash
   node scripts/test-permissions.js
   ```

2. **检查迁移脚本**
   
   确保所有迁移文件已经过验证，并且在测试环境中成功应用：
   
   ```bash
   node scripts/verify-migration.js
   ```

3. **生成构建版本**
   
   为应用程序创建优化的生产构建：
   
   ```bash
   npm run build
   ```

## 数据库迁移

将数据库迁移应用到生产环境的 Supabase 项目中，有两种方法：

### 方法 1: 使用迁移脚本（推荐）

1. 在生产环境中设置正确的 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 环境变量
2. 执行以下命令：

   ```bash
   NODE_ENV=production node scripts/apply-migrations.js
   ```

3. 验证迁移是否成功应用：

   ```bash
   NODE_ENV=production node scripts/verify-migration.js
   ```

### 方法 2: 手动 SQL 执行

1. 登录到 [Supabase 控制台](https://app.supabase.io)
2. 选择您的生产项目
3. 导航到 "SQL Editor" 部分
4. 创建新查询，并按以下顺序执行迁移文件：
   - `20250421000000_user_profiles_schema.sql`
   - `20250421000001_task_system_schema.sql`
   - `20250421000002_blockchain_sync_schema.sql`
   - `20250421000003_auth_functions.sql`
   - `20230815000000_treasure_box_schema.sql`

## 环境变量配置

以下是部署到生产环境所需的环境变量：

| 环境变量 | 描述 | 示例值 |
|----------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://kiyyhitozmezuppziomx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_KEY` | Supabase 服务角色密钥（仅后端使用） | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NODE_ENV` | 环境类型 | `production` |
| `APP_URL` | 应用程序 URL | `https://sociomint.example.com` |

### 环境变量设置方式

**Vercel:**
1. 进入项目设置 → 环境变量
2. 添加上述每个环境变量

**Netlify:**
1. 转到站点设置 → 构建与部署 → 环境
2. 添加上述每个环境变量

**自托管服务器:**
1. 创建 `.env.production` 文件
2. 添加上述环境变量
3. 在启动服务器前加载环境变量

## 前端部署

### Vercel（推荐）

1. 将项目连接到 GitHub/GitLab/Bitbucket 仓库
2. 设置环境变量
3. 部署：

```bash
vercel --prod
```

### Netlify

1. 将项目连接到 Git 仓库
2. 设置构建命令：`npm run build`
3. 设置发布目录：`build` 或 `out`（取决于您的框架）
4. 设置环境变量
5. 点击部署

### 自托管

1. 构建项目：

```bash
npm run build
```

2. 将构建文件夹复制到 Web 服务器

```bash
scp -r build/* user@server:/var/www/sociomint
```

3. 配置 Nginx 或 Apache 服务器，指向构建文件夹

## 部署后检查

部署完成后，请执行以下检查：

1. **功能测试**
   - 用户认证是否正常工作
   - 宝箱系统是否可用
   - 任务管理功能是否正常

2. **权限验证**
   - 确认不同用户角色的权限限制是否正确应用
   - 测试公开/私有资源访问

3. **性能检查**
   - 页面加载时间
   - API 响应时间
   - 数据库查询性能

4. **安全审查**
   - 确认所有 RLS 策略生效
   - 检查 CORS 设置
   - 验证 API 密钥权限

## 备份与恢复

### 自动备份

Supabase 提供自动备份功能，但需要使用付费计划。建议为生产环境开启此功能。

### 手动备份

使用我们的备份脚本定期备份数据：

```bash
# 创建完整备份
node scripts/backup-database.js

# 仅备份某些表
node scripts/backup-database.js --tables=profiles,tasks
```

备份文件将保存在 `backups` 目录中。

### 备份计划

建议的备份计划：

- **每日备份**：使用 cron 作业自动备份关键表
- **每周备份**：完整数据库备份
- **每月备份**：完整备份包括模式和数据，保留至少 6 个月

### 恢复流程

如需从备份恢复：

1. 确定要恢复的备份文件
2. 运行恢复脚本：

```bash
node scripts/restore-database.js --file=backups/backup_2025-04-21.json
```

## 故障排除

### 常见问题

1. **迁移失败**
   - 检查 Supabase API 密钥是否正确
   - 验证 SQL 语法是否与 PostgreSQL 版本兼容
   - 依次手动应用各个迁移文件

2. **权限错误**
   - 检查 RLS 策略是否正确应用
   - 验证用户角色权限

3. **性能问题**
   - 检查复杂查询并考虑添加索引
   - 使用 Supabase 查询分析工具识别瓶颈

### 联系支持

如遇到无法解决的问题，请联系：

- **技术支持**：support@sociomint.example.com
- **紧急问题**：emergency@sociomint.example.com

## 版本历史

- **2025-04-28**: 初始版本 
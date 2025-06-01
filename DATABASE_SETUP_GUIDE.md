# SocioMint 数据库设置指南

## 🎯 概述

本指南将帮助您设置 SocioMint 项目的 Supabase 数据库。由于 Supabase 的安全限制，需要手动在 Supabase Dashboard 中执行 SQL 脚本。

## 📋 前置条件

1. ✅ Supabase 项目已创建
2. ✅ 环境变量已配置
3. ✅ 具有 Supabase 项目的管理员权限

## 🚀 设置步骤

### 步骤 1: 访问 Supabase Dashboard

1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目: `kiyyhitozmezuppziomx`
3. 点击左侧菜单的 "SQL Editor"

### 步骤 2: 执行数据库迁移

按以下顺序执行 SQL 文件：

#### 2.1 核心表结构
```sql
-- 复制并执行 supabase/migrations/001_core_tables.sql 的内容
```

#### 2.2 行级安全策略
```sql
-- 复制并执行 supabase/migrations/002_rls_policies.sql 的内容
```

#### 2.3 函数和触发器
```sql
-- 复制并执行 supabase/migrations/003_functions_triggers.sql 的内容
```

#### 2.4 视图和索引
```sql
-- 复制并执行 supabase/migrations/004_views_indexes.sql 的内容
```

### 步骤 3: 插入种子数据（可选）

如果需要测试数据：

```sql
-- 复制并执行 supabase/seed.sql 的内容
```

## 📊 验证设置

执行以下查询验证数据库设置：

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 检查视图是否创建成功
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';

-- 检查函数是否创建成功
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- 检查种子数据
SELECT COUNT(*) as user_count FROM user_profiles;
SELECT COUNT(*) as task_count FROM social_tasks;
SELECT COUNT(*) as merchant_count FROM merchants;
```

## 🔧 自动化脚本

虽然不能自动执行 SQL，但您可以使用以下脚本来显示需要执行的 SQL：

```bash
# 显示所有迁移 SQL
npm run db:deploy

# 检查数据库连接
npm run db:status
```

## 📁 文件结构

```
supabase/
├── migrations/
│   ├── 001_core_tables.sql      # 核心表结构
│   ├── 002_rls_policies.sql     # 行级安全策略
│   ├── 003_functions_triggers.sql # 函数和触发器
│   └── 004_views_indexes.sql    # 视图和索引
├── seed.sql                     # 种子数据
└── config.toml                  # Supabase 配置
```

## 🛡️ 安全注意事项

1. **RLS 策略**: 所有表都启用了行级安全策略
2. **用户权限**: 用户只能访问自己的数据
3. **服务角色**: 后端服务使用 service_role 密钥
4. **API 密钥**: 前端使用 anon 密钥

## 🔍 常见问题

### Q: 执行 SQL 时出现权限错误？
A: 确保您使用的是项目所有者账号，并且在正确的项目中执行。

### Q: 表已存在错误？
A: 使用 `DROP TABLE IF EXISTS` 或检查表是否已经创建。

### Q: 函数创建失败？
A: 检查 PostgreSQL 版本兼容性，确保语法正确。

### Q: RLS 策略不生效？
A: 确保表已启用 RLS：`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

## 📞 获取帮助

如果遇到问题：

1. 检查 Supabase Dashboard 的日志
2. 查看 SQL 编辑器的错误信息
3. 参考 [Supabase 文档](https://supabase.com/docs)
4. 联系项目维护者

## ✅ 完成检查清单

- [ ] 核心表创建完成
- [ ] RLS 策略设置完成
- [ ] 函数和触发器创建完成
- [ ] 视图和索引创建完成
- [ ] 种子数据插入完成（可选）
- [ ] 验证查询执行成功
- [ ] 应用可以连接数据库
- [ ] 用户注册和登录功能正常

## 🎉 下一步

数据库设置完成后：

1. 启动开发服务器：`npm run dev`
2. 运行测试：`npm test`
3. 检查 API 集成：`npm run test:integration`
4. 部署到生产环境

---

**注意**: 这是一次性设置过程。一旦数据库结构建立，后续的更改可以通过迁移脚本管理。

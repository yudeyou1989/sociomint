# Supabase SQL 执行指南

## 概述

本指南将帮助您在 Supabase 控制台中执行 SQL 脚本，以设置数据库表和函数。

## 步骤

1. 登录 Supabase 控制台：https://app.supabase.io
2. 选择您的项目
3. 点击左侧菜单中的 "SQL 编辑器"
4. 创建一个新的查询
5. 将以下 SQL 脚本复制粘贴到编辑器中
6. 点击 "运行" 按钮执行脚本

## SQL 脚本

```sql
-- 创建 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建用户表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  xiaohonghua_balance INTEGER DEFAULT 0,
  sm_balance_offchain NUMERIC DEFAULT 0,
  is_wallet_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户表更新时间触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建多签钱包交易表
CREATE TABLE IF NOT EXISTS public.multisig_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id INTEGER NOT NULL,
  destination TEXT NOT NULL,
  value TEXT NOT NULL,
  data TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建多签钱包交易表更新时间触发器
DROP TRIGGER IF EXISTS update_multisig_transactions_updated_at ON public.multisig_transactions;
CREATE TRIGGER update_multisig_transactions_updated_at
BEFORE UPDATE ON public.multisig_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建小红花兑换表
CREATE TABLE IF NOT EXISTS public.xiaohonghua_exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  xiaohonghua_amount INTEGER NOT NULL,
  sm_amount NUMERIC NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  status TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建小红花兑换表更新时间触发器
DROP TRIGGER IF EXISTS update_xiaohonghua_exchanges_updated_at ON public.xiaohonghua_exchanges;
CREATE TRIGGER update_xiaohonghua_exchanges_updated_at
BEFORE UPDATE ON public.xiaohonghua_exchanges
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建错误日志表
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  stack TEXT,
  severity TEXT NOT NULL,
  context JSONB,
  error_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建错误日志表索引
CREATE INDEX IF NOT EXISTS error_logs_severity_idx ON public.error_logs (severity);
CREATE INDEX IF NOT EXISTS error_logs_error_id_idx ON public.error_logs (error_id);
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON public.error_logs (created_at);

-- 创建应用日志表
CREATE TABLE IF NOT EXISTS public.application_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  environment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建应用日志表索引
CREATE INDEX IF NOT EXISTS application_logs_level_idx ON public.application_logs (level);
CREATE INDEX IF NOT EXISTS application_logs_created_at_idx ON public.application_logs (created_at);

-- 创建区块链事件表
CREATE TABLE IF NOT EXISTS public.blockchain_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建区块链事件表索引
CREATE INDEX IF NOT EXISTS blockchain_events_event_type_idx ON public.blockchain_events (event_type);
CREATE INDEX IF NOT EXISTS blockchain_events_transaction_hash_idx ON public.blockchain_events (transaction_hash);
CREATE INDEX IF NOT EXISTS blockchain_events_contract_address_idx ON public.blockchain_events (contract_address);
CREATE INDEX IF NOT EXISTS blockchain_events_created_at_idx ON public.blockchain_events (created_at);

-- 创建任务表
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  action TEXT NOT NULL,
  reward INTEGER NOT NULL,
  total INTEGER NOT NULL,
  creator_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建任务完成表
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id),
  user_id TEXT NOT NULL,
  proof TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建任务表更新时间触发器
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建任务完成表更新时间触发器
DROP TRIGGER IF EXISTS update_task_completions_updated_at ON public.task_completions;
CREATE TRIGGER update_task_completions_updated_at
BEFORE UPDATE ON public.task_completions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建任务表索引
CREATE INDEX IF NOT EXISTS tasks_platform_idx ON public.tasks (platform);
CREATE INDEX IF NOT EXISTS tasks_action_idx ON public.tasks (action);
CREATE INDEX IF NOT EXISTS tasks_creator_id_idx ON public.tasks (creator_id);
CREATE INDEX IF NOT EXISTS task_completions_task_id_idx ON public.task_completions (task_id);
CREATE INDEX IF NOT EXISTS task_completions_user_id_idx ON public.task_completions (user_id);
CREATE INDEX IF NOT EXISTS task_completions_status_idx ON public.task_completions (status);

-- 创建兑换率表
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  xiaohonghua_to_sm_rate NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建兑换率表更新时间触发器
DROP TRIGGER IF EXISTS update_exchange_rates_updated_at ON public.exchange_rates;
CREATE TRIGGER update_exchange_rates_updated_at
BEFORE UPDATE ON public.exchange_rates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 插入默认兑换率
INSERT INTO public.exchange_rates (xiaohonghua_to_sm_rate, is_active)
VALUES (10, TRUE)
ON CONFLICT DO NOTHING;

-- 创建平台验证表
CREATE TABLE IF NOT EXISTS public.platform_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- 创建平台验证表更新时间触发器
DROP TRIGGER IF EXISTS update_platform_verifications_updated_at ON public.platform_verifications;
CREATE TRIGGER update_platform_verifications_updated_at
BEFORE UPDATE ON public.platform_verifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建平台验证表索引
CREATE INDEX IF NOT EXISTS platform_verifications_user_id_idx ON public.platform_verifications (user_id);
CREATE INDEX IF NOT EXISTS platform_verifications_platform_idx ON public.platform_verifications (platform);

-- 设置行级安全策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xiaohonghua_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_verifications ENABLE ROW LEVEL SECURITY;

-- 创建用户表策略
CREATE POLICY "用户可以查看自己的数据" ON public.users
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "用户可以更新自己的数据" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建小红花兑换表策略
CREATE POLICY "用户可以查看自己的兑换记录" ON public.xiaohonghua_exchanges
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "用户可以创建自己的兑换记录" ON public.xiaohonghua_exchanges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建任务表策略
CREATE POLICY "所有人可以查看任务" ON public.tasks
  FOR SELECT USING (true);
  
CREATE POLICY "创建者可以更新自己的任务" ON public.tasks
  FOR UPDATE USING (auth.uid() = creator_id);
  
CREATE POLICY "创建者可以创建任务" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 创建任务完成表策略
CREATE POLICY "用户可以查看自己的任务完成记录" ON public.task_completions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "用户可以创建自己的任务完成记录" ON public.task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "用户可以更新自己的任务完成记录" ON public.task_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建平台验证表策略
CREATE POLICY "用户可以查看自己的平台验证记录" ON public.platform_verifications
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "用户可以创建自己的平台验证记录" ON public.platform_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "用户可以更新自己的平台验证记录" ON public.platform_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建任务提交审批函数
CREATE OR REPLACE FUNCTION approve_task_submission(
  task_completion_id UUID,
  new_status TEXT DEFAULT 'approved'
) RETURNS VOID AS $$
DECLARE
  task_record RECORD;
  user_record RECORD;
BEGIN
  -- 获取任务完成记录
  SELECT tc.*, t.reward, t.creator_id
  INTO task_record
  FROM public.task_completions tc
  JOIN public.tasks t ON tc.task_id = t.id
  WHERE tc.id = task_completion_id;
  
  -- 检查记录是否存在
  IF task_record.id IS NULL THEN
    RAISE EXCEPTION '任务完成记录不存在';
  END IF;
  
  -- 检查是否为任务创建者
  IF auth.uid() != task_record.creator_id THEN
    RAISE EXCEPTION '只有任务创建者可以审批任务提交';
  END IF;
  
  -- 更新任务完成状态
  UPDATE public.task_completions
  SET status = new_status,
      updated_at = NOW()
  WHERE id = task_completion_id;
  
  -- 如果审批通过，增加用户小红花余额
  IF new_status = 'approved' THEN
    -- 获取用户记录
    SELECT * INTO user_record
    FROM public.users
    WHERE user_id = task_record.user_id;
    
    -- 更新用户小红花余额
    UPDATE public.users
    SET xiaohonghua_balance = xiaohonghua_balance + task_record.reward,
        updated_at = NOW()
    WHERE user_id = task_record.user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

```

## 验证

执行完成后，您可以通过以下方式验证表是否创建成功：

1. 点击左侧菜单中的 "表编辑器"
2. 检查是否存在以下表：
   - users
   - multisig_transactions
   - xiaohonghua_exchanges
   - error_logs
   - application_logs
   - blockchain_events
   - tasks
   - task_completions
   - exchange_rates
   - platform_verifications

## 注意事项

- 如果执行过程中遇到错误，请检查错误信息并解决问题
- 某些语句可能会因为表或函数已存在而失败，这是正常的
- 确保您有足够的权限执行这些 SQL 语句

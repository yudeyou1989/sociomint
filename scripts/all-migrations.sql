-- =====================================================
-- 迁移文件: 20250421000000_user_profiles_schema.sql
-- =====================================================

-- 用户资料系统表结构定义
-- 创建于: 2025-04-21
-- 描述: 用户资料相关的数据表结构，包括用户配置、钱包连接和社交账号绑定

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  username TEXT,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 添加唯一约束
  UNIQUE(user_id),
  UNIQUE(username)
);

-- 为profiles表启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS策略：任何人可以查看资料
CREATE POLICY "profiles_public_view" ON profiles
  FOR SELECT USING (true);

-- RLS策略：只有本人可以修改自己的资料
CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS策略：只有本人可以删除自己的资料
CREATE POLICY "profiles_owner_delete" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS策略：只有已认证用户可以创建资料，且只能创建自己的资料
CREATE POLICY "profiles_authenticated_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建钱包连接表
CREATE TABLE IF NOT EXISTS wallet_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 添加唯一约束，确保一个钱包地址在同一链上只关联一个用户
  UNIQUE(wallet_address, chain_id)
);

-- 为wallet_connections表启用RLS
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

-- RLS策略：用户只能查看自己的钱包连接
CREATE POLICY "wallet_connections_owner_select" ON wallet_connections
  FOR SELECT USING (auth.uid() = user_id);

-- RLS策略：用户只能添加自己的钱包连接
CREATE POLICY "wallet_connections_owner_insert" ON wallet_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS策略：用户只能修改自己的钱包连接
CREATE POLICY "wallet_connections_owner_update" ON wallet_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS策略：用户只能删除自己的钱包连接
CREATE POLICY "wallet_connections_owner_delete" ON wallet_connections
  FOR DELETE USING (auth.uid() = user_id);

-- 创建社交连接表
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  platform TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  platform_username TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 添加唯一约束，确保一个平台账号只关联一个用户
  UNIQUE(platform, platform_id)
);

-- 为social_connections表启用RLS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- RLS策略：用户只能查看自己的社交连接
CREATE POLICY "social_connections_owner_select" ON social_connections
  FOR SELECT USING (auth.uid() = user_id);

-- RLS策略：用户只能添加自己的社交连接
CREATE POLICY "social_connections_owner_insert" ON social_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS策略：用户只能修改自己的社交连接
CREATE POLICY "social_connections_owner_update" ON social_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS策略：用户只能删除自己的社交连接
CREATE POLICY "social_connections_owner_delete" ON social_connections
  FOR DELETE USING (auth.uid() = user_id);

-- 为表添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS wallet_connections_user_id_idx ON wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS wallet_connections_address_idx ON wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS social_connections_user_id_idx ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS social_connections_platform_idx ON social_connections(platform); 

-- =====================================================
-- 迁移文件: 20250421000001_task_system_schema.sql
-- =====================================================

-- 任务系统表结构定义
-- 创建于: 2025-04-21
-- 描述: 任务系统相关的数据表结构，包括任务配置、任务提交记录等

-- 任务状态枚举
CREATE TYPE IF NOT EXISTS task_status AS ENUM (
  'draft',      -- 草稿
  'open',       -- 公开可接受
  'assigned',   -- 已分配
  'in_progress', -- 进行中
  'submitted',  -- 已提交
  'completed',  -- 已完成
  'cancelled',  -- 已取消
  'dispute'     -- 有争议
);

-- 如果存在旧的任务表，先删除其外键约束以避免冲突
ALTER TABLE IF EXISTS task_submissions DROP CONSTRAINT IF EXISTS task_submissions_task_id_fkey;

-- 创建/调整任务表
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id),
  worker_id UUID REFERENCES auth.users(id),
  status task_status DEFAULT 'open',
  reward_amount NUMERIC,
  reward_token TEXT, -- 代币合约地址
  deadline TIMESTAMP WITH TIME ZONE,
  category TEXT,
  tags TEXT[],
  requirements TEXT,
  visibility TEXT DEFAULT 'public', -- public, private, invite_only
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  external_id TEXT, -- 链上任务ID
  chain_id INTEGER, -- 链ID
  metadata JSONB -- 存储任务的额外信息
);

-- 创建任务提交记录表
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  submitter_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  attachments TEXT[],
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  feedback TEXT,
  rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  transaction_hash TEXT, -- 链上交易哈希
  metadata JSONB -- 存储提交的额外信息
);

-- 创建任务应用表（记录用户申请接任务的信息）
CREATE TABLE IF NOT EXISTS task_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) NOT NULL,
  proposal TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 确保一个用户只能对一个任务提交一次申请
  UNIQUE(task_id, applicant_id)
);

-- 为tasks表启用RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS策略：公开任务可以被任何人查看
CREATE POLICY "tasks_public_view" ON tasks
  FOR SELECT USING (visibility = 'public');

-- RLS策略：私有任务只能被创建者和工作者查看
CREATE POLICY "tasks_private_view" ON tasks
  FOR SELECT USING (
    visibility = 'private' AND
    (auth.uid() = creator_id OR auth.uid() = worker_id)
  );

-- RLS策略：已认证用户可以创建任务
CREATE POLICY "tasks_authenticated_insert" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- RLS策略：任务创建者可以修改任务
CREATE POLICY "tasks_creator_update" ON tasks
  FOR UPDATE USING (auth.uid() = creator_id);

-- RLS策略：任务创建者可以删除任务
CREATE POLICY "tasks_creator_delete" ON tasks
  FOR DELETE USING (auth.uid() = creator_id);

-- 为task_submissions表启用RLS
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- RLS策略：任务创建者和提交者可以查看提交记录
CREATE POLICY "task_submissions_view" ON task_submissions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
      UNION
      SELECT submitter_id FROM task_submissions WHERE id = task_submissions.id
    )
  );

-- RLS策略：已认证用户可以为自己的任务提交记录
CREATE POLICY "task_submissions_insert" ON task_submissions
  FOR INSERT WITH CHECK (auth.uid() = submitter_id);

-- RLS策略：提交者可以更新自己的提交
CREATE POLICY "task_submissions_submitter_update" ON task_submissions
  FOR UPDATE USING (auth.uid() = submitter_id);

-- RLS策略：任务创建者可以更新提交状态
CREATE POLICY "task_submissions_creator_update" ON task_submissions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- 为task_applications表启用RLS
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

-- RLS策略：任务创建者可以查看所有申请
CREATE POLICY "task_applications_creator_view" ON task_applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- RLS策略：申请者可以查看自己的申请
CREATE POLICY "task_applications_applicant_view" ON task_applications
  FOR SELECT USING (auth.uid() = applicant_id);

-- RLS策略：已认证用户可以为任务申请
CREATE POLICY "task_applications_insert" ON task_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- RLS策略：申请者可以更新自己的申请
CREATE POLICY "task_applications_applicant_update" ON task_applications
  FOR UPDATE USING (auth.uid() = applicant_id);

-- RLS策略：任务创建者可以更新申请状态
CREATE POLICY "task_applications_creator_update" ON task_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- 为表添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS tasks_creator_id_idx ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS tasks_worker_id_idx ON tasks(worker_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at);
CREATE INDEX IF NOT EXISTS tasks_category_idx ON tasks(category);
CREATE INDEX IF NOT EXISTS tasks_visibility_idx ON tasks(visibility);

CREATE INDEX IF NOT EXISTS task_submissions_task_id_idx ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS task_submissions_submitter_id_idx ON task_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS task_submissions_status_idx ON task_submissions(status);

CREATE INDEX IF NOT EXISTS task_applications_task_id_idx ON task_applications(task_id);
CREATE INDEX IF NOT EXISTS task_applications_applicant_id_idx ON task_applications(applicant_id);
CREATE INDEX IF NOT EXISTS task_applications_status_idx ON task_applications(status); 

-- =====================================================
-- 迁移文件: 20250421000002_blockchain_sync_schema.sql
-- =====================================================

-- 区块链数据同步系统表结构定义
-- 创建于: 2025-04-21
-- 描述: 用于跟踪和同步区块链事件的数据表结构

-- 创建事件处理记录表
CREATE TABLE IF NOT EXISTS blockchain_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  log_index INTEGER NOT NULL,
  event_data JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 添加唯一约束，防止重复处理同一事件
  UNIQUE(chain_id, transaction_hash, log_index)
);

-- 添加索引以加速查询
CREATE INDEX IF NOT EXISTS blockchain_events_contract_idx 
ON blockchain_events(contract_address, event_name);

CREATE INDEX IF NOT EXISTS blockchain_events_block_idx 
ON blockchain_events(chain_id, block_number);

CREATE INDEX IF NOT EXISTS blockchain_events_processed_idx 
ON blockchain_events(processed);

-- 创建同步状态表，记录每个合约的同步状态
CREATE TABLE IF NOT EXISTS sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  last_block BIGINT DEFAULT 0,
  last_sync_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active', -- active, paused, error
  error TEXT,
  sync_interval INTEGER DEFAULT 60, -- 同步间隔，单位秒
  
  -- 添加唯一约束
  UNIQUE(chain_id, contract_address, event_name)
);

-- 为blockchain_events表启用RLS
ALTER TABLE blockchain_events ENABLE ROW LEVEL SECURITY;

-- RLS策略：只有服务账户可以查看和修改事件
CREATE POLICY "blockchain_events_service_select" ON blockchain_events
  FOR SELECT USING (
    -- 仅服务账户可查看，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

CREATE POLICY "blockchain_events_service_insert" ON blockchain_events
  FOR INSERT WITH CHECK (
    -- 仅服务账户可插入，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

CREATE POLICY "blockchain_events_service_update" ON blockchain_events
  FOR UPDATE USING (
    -- 仅服务账户可更新，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

-- 为sync_status表启用RLS
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- RLS策略：只有服务账户可以查看和修改同步状态
CREATE POLICY "sync_status_service_select" ON sync_status
  FOR SELECT USING (
    -- 仅服务账户可查看，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

CREATE POLICY "sync_status_service_insert" ON sync_status
  FOR INSERT WITH CHECK (
    -- 仅服务账户可插入，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

CREATE POLICY "sync_status_service_update" ON sync_status
  FOR UPDATE USING (
    -- 仅服务账户可更新，在实际应用中需要补充服务账户验证逻辑
    current_user = 'service_role' OR
    current_user = 'postgres'
  );

-- 创建仅可查询视图，供前端使用的事件统计信息
CREATE OR REPLACE VIEW event_statistics AS
SELECT
  chain_id,
  contract_address,
  event_name,
  COUNT(*) AS total_events,
  SUM(CASE WHEN processed THEN 1 ELSE 0 END) AS processed_events,
  SUM(CASE WHEN NOT processed AND error IS NULL THEN 1 ELSE 0 END) AS pending_events,
  SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) AS error_events,
  MAX(block_number) AS latest_block,
  MAX(created_at) AS latest_event_time
FROM blockchain_events
GROUP BY chain_id, contract_address, event_name;

-- 用于验证钱包地址的函数
CREATE OR REPLACE FUNCTION validate_wallet_address(address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- 简单验证地址格式（以太坊地址示例）
  RETURN address ~ '^0x[a-fA-F0-9]{40}$';
END;
$$ LANGUAGE plpgsql; 

-- =====================================================
-- 迁移文件: 20250421000003_auth_functions.sql
-- =====================================================

-- 用户认证系统的辅助函数和触发器
-- 创建于: 2025-04-21
-- 描述: 用于支持钱包登录和用户配置文件自动创建的函数和触发器

-- 创建触发器函数，在新用户注册时自动创建配置文件
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, avatar, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'preferred_username', 'user_' || FLOOR(RANDOM() * 1000000)::TEXT),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为auth.users表创建触发器，在插入新用户时自动创建配置文件
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建函数，根据钱包地址获取用户ID
CREATE OR REPLACE FUNCTION public.get_user_id_from_wallet(wallet_address TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT wc.user_id INTO user_id
  FROM public.wallet_connections wc
  WHERE wc.wallet_address = get_user_id_from_wallet.wallet_address;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数，验证消息签名并登录用户（模拟实现）
-- 注意：实际的签名验证应在应用层实现，此处仅为示例
CREATE OR REPLACE FUNCTION public.login_with_wallet(wallet_address TEXT, signature TEXT, message TEXT)
RETURNS JSONB AS $$
DECLARE
  user_id UUID;
  result JSONB;
BEGIN
  -- 获取与钱包地址关联的用户ID
  user_id := public.get_user_id_from_wallet(wallet_address);
  
  -- 如果找到用户，返回成功
  IF user_id IS NOT NULL THEN
    -- 注意：实际应用中应该验证签名
    -- 此处仅为示例，假设签名有效
    
    result := jsonb_build_object(
      'success', true,
      'user_id', user_id
    );
    RETURN result;
  END IF;
  
  -- 未找到用户，返回失败
  result := jsonb_build_object(
    'success', false,
    'message', '未找到与该钱包地址关联的用户'
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数，根据社交账号信息获取用户ID
CREATE OR REPLACE FUNCTION public.get_user_id_from_social(platform TEXT, platform_id TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT sc.user_id INTO user_id
  FROM public.social_connections sc
  WHERE sc.platform = get_user_id_from_social.platform
    AND sc.platform_id = get_user_id_from_social.platform_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数，验证用户是否有管理员权限
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- 此处应查询实际的管理员表或角色表
  -- 本示例仅使用一个预设的管理员ID列表
  RETURN user_id IN (
    -- 添加实际管理员ID
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::UUID
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
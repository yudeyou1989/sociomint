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
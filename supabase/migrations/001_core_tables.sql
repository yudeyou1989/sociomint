-- SocioMint 核心数据库表结构
-- 基于合约逻辑和业务需求设计
-- 创建时间: 2024-12-19

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 用户资料表
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    
    -- 社交账号绑定
    twitter_username TEXT,
    twitter_verified BOOLEAN DEFAULT FALSE,
    discord_username TEXT,
    discord_verified BOOLEAN DEFAULT FALSE,
    telegram_username TEXT,
    telegram_verified BOOLEAN DEFAULT FALSE,
    
    -- 用户统计
    total_tasks_completed INTEGER DEFAULT 0,
    total_rewards_earned DECIMAL(20,8) DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    
    -- 用户状态
    is_verified BOOLEAN DEFAULT FALSE,
    is_merchant BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 代币余额表
CREATE TABLE user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- SM 代币余额
    sm_balance DECIMAL(20,8) DEFAULT 0,
    sm_staked DECIMAL(20,8) DEFAULT 0,
    
    -- 小红花余额
    red_flower_balance DECIMAL(20,8) DEFAULT 0,
    red_flower_earned_total DECIMAL(20,8) DEFAULT 0,
    
    -- BNB 余额（缓存）
    bnb_balance DECIMAL(20,8) DEFAULT 0,
    
    -- 更新时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 交易记录表
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 交易基本信息
    tx_hash TEXT,
    tx_type TEXT NOT NULL, -- 'exchange', 'stake', 'unstake', 'reward', 'transfer'
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    
    -- 交易金额
    amount_bnb DECIMAL(20,8),
    amount_sm DECIMAL(20,8),
    amount_red_flower DECIMAL(20,8),
    
    -- 交易详情
    from_address TEXT,
    to_address TEXT,
    gas_fee DECIMAL(20,8),
    exchange_rate DECIMAL(20,8),
    round_number INTEGER,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_transactions_user_id (user_id),
    INDEX idx_transactions_tx_hash (tx_hash),
    INDEX idx_transactions_type (tx_type),
    INDEX idx_transactions_status (status)
);

-- 社交任务表
CREATE TABLE social_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 任务基本信息
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    task_type TEXT NOT NULL, -- 'follow', 'retweet', 'comment', 'create_content', 'join_group'
    platform TEXT NOT NULL, -- 'twitter', 'discord', 'telegram'
    
    -- 任务配置
    target_url TEXT,
    required_action TEXT,
    verification_method TEXT DEFAULT 'manual', -- 'manual', 'automatic', 'api'
    
    -- 奖励设置
    reward_amount DECIMAL(20,8) NOT NULL,
    reward_type TEXT DEFAULT 'red_flower', -- 'red_flower', 'sm_token', 'nft'
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    
    -- 任务状态
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'cancelled'
    priority INTEGER DEFAULT 0,
    
    -- 时间设置
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_social_tasks_creator (creator_id),
    INDEX idx_social_tasks_type (task_type),
    INDEX idx_social_tasks_platform (platform),
    INDEX idx_social_tasks_status (status)
);

-- 任务完成记录表
CREATE TABLE task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES social_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 完成信息
    status TEXT DEFAULT 'submitted', -- 'submitted', 'verified', 'rejected', 'rewarded'
    submission_data JSONB, -- 用户提交的证明数据
    verification_data JSONB, -- 验证相关数据
    
    -- 奖励信息
    reward_amount DECIMAL(20,8),
    reward_type TEXT,
    reward_tx_hash TEXT,
    
    -- 时间戳
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    rewarded_at TIMESTAMP WITH TIME ZONE,
    
    -- 唯一约束：每个用户每个任务只能完成一次
    UNIQUE(task_id, user_id),
    
    -- 索引
    INDEX idx_task_completions_task (task_id),
    INDEX idx_task_completions_user (user_id),
    INDEX idx_task_completions_status (status)
);

-- 宝箱系统表
CREATE TABLE treasure_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 宝箱信息
    box_type TEXT NOT NULL, -- 'normal', 'rare', 'epic', 'legendary', 'crazy'
    source_type TEXT NOT NULL, -- 'task_completion', 'daily_login', 'special_event'
    source_id UUID, -- 关联的任务ID或事件ID
    
    -- 宝箱状态
    status TEXT DEFAULT 'unopened', -- 'unopened', 'opened'
    
    -- 奖励内容（开启后填充）
    reward_content JSONB,
    total_value DECIMAL(20,8),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opened_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_treasure_boxes_user (user_id),
    INDEX idx_treasure_boxes_type (box_type),
    INDEX idx_treasure_boxes_status (status)
);

-- 商人系统表
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 商人信息
    merchant_name TEXT NOT NULL,
    merchant_type TEXT DEFAULT 'individual', -- 'individual', 'business'
    business_license TEXT,
    
    -- 质押信息
    staked_amount DECIMAL(20,8) NOT NULL,
    stake_tx_hash TEXT,
    
    -- 商人统计
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    total_volume DECIMAL(20,8) DEFAULT 0,
    reputation_score DECIMAL(4,2) DEFAULT 5.0,
    
    -- 状态
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'banned'
    verification_level TEXT DEFAULT 'basic', -- 'basic', 'verified', 'premium'
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id),
    
    -- 索引
    INDEX idx_merchants_status (status),
    INDEX idx_merchants_verification (verification_level)
);

-- 市场交易表
CREATE TABLE market_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 交易信息
    trade_type TEXT NOT NULL, -- 'red_flower_to_sm', 'sm_to_red_flower', 'service'
    
    -- 交易金额
    sell_amount DECIMAL(20,8) NOT NULL,
    sell_currency TEXT NOT NULL, -- 'red_flower', 'sm_token', 'bnb'
    buy_amount DECIMAL(20,8) NOT NULL,
    buy_currency TEXT NOT NULL,
    
    -- 交易状态
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'completed', 'cancelled', 'disputed'
    
    -- 交易详情
    description TEXT,
    terms TEXT,
    escrow_amount DECIMAL(20,8),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_market_trades_seller (seller_id),
    INDEX idx_market_trades_buyer (buyer_id),
    INDEX idx_market_trades_type (trade_type),
    INDEX idx_market_trades_status (status)
);

-- 质押记录表
CREATE TABLE staking_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 质押信息
    staked_amount DECIMAL(20,8) NOT NULL,
    stake_type TEXT DEFAULT 'flexible', -- 'flexible', 'fixed_30d', 'fixed_90d', 'fixed_365d'
    
    -- 奖励信息
    reward_rate DECIMAL(8,4), -- 年化收益率
    accumulated_rewards DECIMAL(20,8) DEFAULT 0,
    last_reward_claim TIMESTAMP WITH TIME ZONE,
    
    -- 状态
    status TEXT DEFAULT 'active', -- 'active', 'unstaking', 'completed'
    
    -- 时间戳
    staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unstaked_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_staking_records_user (user_id),
    INDEX idx_staking_records_type (stake_type),
    INDEX idx_staking_records_status (status)
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_tasks_updated_at BEFORE UPDATE ON social_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

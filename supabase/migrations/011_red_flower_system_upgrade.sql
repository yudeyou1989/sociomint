-- SocioMint 小红花系统升级数据库架构
-- 创建时间: 2025-01-04
-- 版本: 2.0.0

-- 小红花余额表（升级版）
CREATE TABLE IF NOT EXISTS red_flower_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL UNIQUE,
    available_balance NUMERIC(18, 6) NOT NULL DEFAULT 0, -- 可用余额
    locked_balance NUMERIC(18, 6) NOT NULL DEFAULT 0, -- 锁定余额
    total_earned NUMERIC(18, 6) NOT NULL DEFAULT 0, -- 累计获得
    total_spent NUMERIC(18, 6) NOT NULL DEFAULT 0, -- 累计消费
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_red_flower_balances_wallet (user_wallet),
    INDEX idx_red_flower_balances_available (available_balance),
    INDEX idx_red_flower_balances_updated (last_updated),
    
    -- 约束
    CONSTRAINT positive_available_balance CHECK (available_balance >= 0),
    CONSTRAINT positive_locked_balance CHECK (locked_balance >= 0),
    CONSTRAINT positive_total_earned CHECK (total_earned >= 0),
    CONSTRAINT positive_total_spent CHECK (total_spent >= 0)
);

-- 小红花交易记录表（升级版）
CREATE TABLE IF NOT EXISTS red_flower_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'earn', 'spend', 'lock', 'unlock', 'transfer'
    amount NUMERIC(18, 6) NOT NULL,
    balance_before NUMERIC(18, 6) NOT NULL, -- 交易前余额
    balance_after NUMERIC(18, 6) NOT NULL, -- 交易后余额
    source_type TEXT NOT NULL, -- 'daily_reward', 'social_task', 'airdrop', 'exchange', 'manual'
    source_id TEXT, -- 来源ID
    description TEXT, -- 交易描述
    metadata JSONB, -- 额外元数据
    tx_hash TEXT, -- 链上交易哈希（如果有）
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_red_flower_tx_wallet (user_wallet),
    INDEX idx_red_flower_tx_type (transaction_type),
    INDEX idx_red_flower_tx_source (source_type),
    INDEX idx_red_flower_tx_status (status),
    INDEX idx_red_flower_tx_created (created_at),
    INDEX idx_red_flower_tx_amount (amount),
    
    -- 约束
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT positive_balance_before CHECK (balance_before >= 0),
    CONSTRAINT positive_balance_after CHECK (balance_after >= 0),
    CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('earn', 'spend', 'lock', 'unlock', 'transfer')),
    CONSTRAINT valid_source_type CHECK (source_type IN ('daily_reward', 'social_task', 'airdrop', 'exchange', 'manual', 'soft_staking')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);

-- 用户等级配置表
CREATE TABLE IF NOT EXISTS user_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    tier_level TEXT NOT NULL DEFAULT 'basic', -- 'basic', 'verified', 'vip', 'premium'
    tier_points INTEGER NOT NULL DEFAULT 0, -- 等级积分
    social_verifications JSONB DEFAULT '{}', -- 社交平台验证状态
    kyc_status TEXT DEFAULT 'none', -- 'none', 'pending', 'verified', 'rejected'
    referral_count INTEGER DEFAULT 0, -- 推荐人数
    total_sm_held NUMERIC(36, 18) DEFAULT 0, -- 持有的SM总量
    tier_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_user_tiers_wallet (user_wallet),
    INDEX idx_user_tiers_level (tier_level),
    INDEX idx_user_tiers_points (tier_points),
    INDEX idx_user_tiers_kyc (kyc_status),
    
    -- 约束
    CONSTRAINT unique_user_tier UNIQUE(user_wallet),
    CONSTRAINT valid_tier_level CHECK (tier_level IN ('basic', 'verified', 'vip', 'premium')),
    CONSTRAINT positive_tier_points CHECK (tier_points >= 0),
    CONSTRAINT positive_referral_count CHECK (referral_count >= 0),
    CONSTRAINT positive_total_sm_held CHECK (total_sm_held >= 0),
    CONSTRAINT valid_kyc_status CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected'))
);

-- 小红花兑换配置表（升级版）
CREATE TABLE IF NOT EXISTS red_flower_exchange_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_name TEXT NOT NULL UNIQUE,
    tier_level TEXT NOT NULL,
    min_exchange_amount NUMERIC(18, 6) NOT NULL DEFAULT 100, -- 最小兑换数量
    max_daily_exchange NUMERIC(18, 6) NOT NULL DEFAULT 10000, -- 每日最大兑换数量
    base_exchange_rate NUMERIC(18, 6) NOT NULL DEFAULT 100, -- 基础兑换比例 (小红花:SM)
    bonus_multiplier NUMERIC(8, 4) NOT NULL DEFAULT 1.0, -- 等级奖励倍数
    fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0, -- 手续费百分比
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_exchange_config_tier (tier_level),
    INDEX idx_exchange_config_active (is_active),
    INDEX idx_exchange_config_effective (effective_date),
    
    -- 约束
    CONSTRAINT positive_min_exchange CHECK (min_exchange_amount > 0),
    CONSTRAINT positive_max_daily_exchange CHECK (max_daily_exchange > 0),
    CONSTRAINT positive_base_rate CHECK (base_exchange_rate > 0),
    CONSTRAINT positive_bonus_multiplier CHECK (bonus_multiplier > 0),
    CONSTRAINT valid_fee_percentage CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
    CONSTRAINT valid_tier_level_config CHECK (tier_level IN ('basic', 'verified', 'vip', 'premium'))
);

-- 插入默认兑换配置
INSERT INTO red_flower_exchange_config (config_name, tier_level, min_exchange_amount, max_daily_exchange, base_exchange_rate, bonus_multiplier, fee_percentage) VALUES
('basic_tier', 'basic', 100, 5000, 100, 1.0, 5.0),
('verified_tier', 'verified', 100, 10000, 100, 1.1, 3.0),
('vip_tier', 'vip', 50, 20000, 100, 1.2, 1.0),
('premium_tier', 'premium', 50, 50000, 100, 1.5, 0.0)
ON CONFLICT (config_name) DO NOTHING;

-- 每日兑换统计表
CREATE TABLE IF NOT EXISTS daily_exchange_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_date DATE NOT NULL,
    user_wallet TEXT NOT NULL,
    flowers_exchanged NUMERIC(18, 6) NOT NULL DEFAULT 0, -- 当日兑换的小红花数量
    sm_received NUMERIC(36, 18) NOT NULL DEFAULT 0, -- 当日获得的SM数量
    exchange_count INTEGER NOT NULL DEFAULT 0, -- 兑换次数
    average_rate NUMERIC(18, 6) NOT NULL DEFAULT 0, -- 平均兑换比例
    total_fees NUMERIC(18, 6) NOT NULL DEFAULT 0, -- 总手续费
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_daily_exchange_stats_date (stat_date),
    INDEX idx_daily_exchange_stats_wallet (user_wallet),
    INDEX idx_daily_exchange_stats_date_wallet (stat_date, user_wallet),
    
    -- 约束
    CONSTRAINT unique_daily_exchange_stat UNIQUE(stat_date, user_wallet),
    CONSTRAINT positive_flowers_exchanged CHECK (flowers_exchanged >= 0),
    CONSTRAINT positive_sm_received CHECK (sm_received >= 0),
    CONSTRAINT positive_exchange_count CHECK (exchange_count >= 0),
    CONSTRAINT positive_average_rate CHECK (average_rate >= 0),
    CONSTRAINT positive_total_fees CHECK (total_fees >= 0)
);

-- 创建函数：获取或创建用户小红花余额
CREATE OR REPLACE FUNCTION get_or_create_red_flower_balance(
    p_user_wallet TEXT
) RETURNS UUID AS $$
DECLARE
    balance_id UUID;
BEGIN
    -- 尝试获取现有余额记录
    SELECT id INTO balance_id
    FROM red_flower_balances
    WHERE user_wallet = p_user_wallet;
    
    -- 如果不存在，创建新记录
    IF balance_id IS NULL THEN
        INSERT INTO red_flower_balances (user_wallet)
        VALUES (p_user_wallet)
        RETURNING id INTO balance_id;
    END IF;
    
    RETURN balance_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取用户等级信息
CREATE OR REPLACE FUNCTION get_user_tier_info(
    p_user_wallet TEXT
) RETURNS TABLE(
    tier_level TEXT,
    tier_points INTEGER,
    kyc_status TEXT,
    social_verifications JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.tier_level,
        ut.tier_points,
        ut.kyc_status,
        ut.social_verifications
    FROM user_tiers ut
    WHERE ut.user_wallet = p_user_wallet;
    
    -- 如果用户不存在，返回默认值
    IF NOT FOUND THEN
        INSERT INTO user_tiers (user_wallet) VALUES (p_user_wallet);
        RETURN QUERY
        SELECT 
            'basic'::TEXT as tier_level,
            0 as tier_points,
            'none'::TEXT as kyc_status,
            '{}'::JSONB as social_verifications;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取用户兑换配置
CREATE OR REPLACE FUNCTION get_user_exchange_config(
    p_user_wallet TEXT
) RETURNS TABLE(
    min_exchange_amount NUMERIC(18, 6),
    max_daily_exchange NUMERIC(18, 6),
    base_exchange_rate NUMERIC(18, 6),
    bonus_multiplier NUMERIC(8, 4),
    fee_percentage NUMERIC(5, 2)
) AS $$
DECLARE
    user_tier TEXT;
BEGIN
    -- 获取用户等级
    SELECT tier_level INTO user_tier
    FROM user_tiers
    WHERE user_wallet = p_user_wallet;
    
    -- 如果用户不存在，使用基础等级
    IF user_tier IS NULL THEN
        user_tier := 'basic';
    END IF;
    
    -- 返回对应等级的配置
    RETURN QUERY
    SELECT 
        rec.min_exchange_amount,
        rec.max_daily_exchange,
        rec.base_exchange_rate,
        rec.bonus_multiplier,
        rec.fee_percentage
    FROM red_flower_exchange_config rec
    WHERE rec.tier_level = user_tier
    AND rec.is_active = TRUE
    AND rec.effective_date <= CURRENT_DATE
    ORDER BY rec.effective_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：执行小红花兑换
CREATE OR REPLACE FUNCTION execute_red_flower_exchange(
    p_user_wallet TEXT,
    p_flowers_amount NUMERIC(18, 6),
    p_description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    user_balance RECORD;
    exchange_config RECORD;
    daily_stats RECORD;
    actual_rate NUMERIC(18, 6);
    fee_amount NUMERIC(18, 6);
    net_flowers NUMERIC(18, 6);
    sm_amount NUMERIC(36, 18);
    transaction_id UUID;
    result JSONB;
BEGIN
    -- 获取用户余额
    SELECT * INTO user_balance
    FROM red_flower_balances
    WHERE user_wallet = p_user_wallet;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'user_balance_not_found');
    END IF;
    
    -- 检查余额是否足够
    IF user_balance.available_balance < p_flowers_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
    END IF;
    
    -- 获取用户兑换配置
    SELECT * INTO exchange_config
    FROM get_user_exchange_config(p_user_wallet);
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'exchange_config_not_found');
    END IF;
    
    -- 检查最小兑换数量
    IF p_flowers_amount < exchange_config.min_exchange_amount THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'below_minimum',
            'min_required', exchange_config.min_exchange_amount
        );
    END IF;
    
    -- 获取今日兑换统计
    SELECT * INTO daily_stats
    FROM daily_exchange_stats
    WHERE user_wallet = p_user_wallet
    AND stat_date = CURRENT_DATE;
    
    -- 检查每日限额
    IF daily_stats.flowers_exchanged IS NOT NULL AND 
       daily_stats.flowers_exchanged + p_flowers_amount > exchange_config.max_daily_exchange THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'exceeds_daily_limit',
            'daily_limit', exchange_config.max_daily_exchange,
            'already_exchanged', daily_stats.flowers_exchanged
        );
    END IF;
    
    -- 计算实际兑换比例（包含等级奖励）
    actual_rate := exchange_config.base_exchange_rate / exchange_config.bonus_multiplier;
    
    -- 计算手续费
    fee_amount := p_flowers_amount * exchange_config.fee_percentage / 100;
    net_flowers := p_flowers_amount - fee_amount;
    
    -- 计算获得的SM数量
    sm_amount := net_flowers / actual_rate;
    
    -- 更新用户余额
    UPDATE red_flower_balances
    SET 
        available_balance = available_balance - p_flowers_amount,
        total_spent = total_spent + p_flowers_amount,
        last_updated = NOW()
    WHERE user_wallet = p_user_wallet;
    
    -- 记录交易
    INSERT INTO red_flower_transactions (
        user_wallet,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        source_type,
        description,
        metadata
    ) VALUES (
        p_user_wallet,
        'spend',
        p_flowers_amount,
        user_balance.available_balance,
        user_balance.available_balance - p_flowers_amount,
        'exchange',
        COALESCE(p_description, '兑换SM代币'),
        jsonb_build_object(
            'sm_amount', sm_amount,
            'exchange_rate', actual_rate,
            'fee_amount', fee_amount,
            'bonus_multiplier', exchange_config.bonus_multiplier
        )
    ) RETURNING id INTO transaction_id;
    
    -- 更新每日统计
    INSERT INTO daily_exchange_stats (
        stat_date,
        user_wallet,
        flowers_exchanged,
        sm_received,
        exchange_count,
        average_rate,
        total_fees
    ) VALUES (
        CURRENT_DATE,
        p_user_wallet,
        p_flowers_amount,
        sm_amount,
        1,
        actual_rate,
        fee_amount
    ) ON CONFLICT (stat_date, user_wallet) DO UPDATE SET
        flowers_exchanged = daily_exchange_stats.flowers_exchanged + EXCLUDED.flowers_exchanged,
        sm_received = daily_exchange_stats.sm_received + EXCLUDED.sm_received,
        exchange_count = daily_exchange_stats.exchange_count + 1,
        average_rate = (daily_exchange_stats.average_rate * daily_exchange_stats.exchange_count + actual_rate) / (daily_exchange_stats.exchange_count + 1),
        total_fees = daily_exchange_stats.total_fees + EXCLUDED.total_fees,
        updated_at = NOW();
    
    -- 返回成功结果
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', transaction_id,
        'sm_amount', sm_amount,
        'exchange_rate', actual_rate,
        'fee_amount', fee_amount,
        'net_flowers', net_flowers,
        'bonus_multiplier', exchange_config.bonus_multiplier
    );
END;
$$ LANGUAGE plpgsql;

-- 创建函数：添加小红花余额
CREATE OR REPLACE FUNCTION add_red_flower_balance(
    p_user_wallet TEXT,
    p_amount NUMERIC(18, 6),
    p_source_type TEXT,
    p_source_id TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    balance_id UUID;
    current_balance NUMERIC(18, 6);
    transaction_id UUID;
BEGIN
    -- 获取或创建用户余额记录
    balance_id := get_or_create_red_flower_balance(p_user_wallet);

    -- 获取当前余额
    SELECT available_balance INTO current_balance
    FROM red_flower_balances
    WHERE id = balance_id;

    -- 更新余额
    UPDATE red_flower_balances
    SET
        available_balance = available_balance + p_amount,
        total_earned = total_earned + p_amount,
        last_updated = NOW()
    WHERE id = balance_id;

    -- 记录交易
    INSERT INTO red_flower_transactions (
        user_wallet,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        source_type,
        source_id,
        description
    ) VALUES (
        p_user_wallet,
        'earn',
        p_amount,
        current_balance,
        current_balance + p_amount,
        p_source_type,
        p_source_id,
        COALESCE(p_description, '获得小红花奖励')
    ) RETURNING id INTO transaction_id;

    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：升级用户等级
CREATE OR REPLACE FUNCTION upgrade_user_tier(
    p_user_wallet TEXT,
    p_new_tier TEXT,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_tier TEXT;
BEGIN
    -- 获取当前等级
    SELECT tier_level INTO current_tier
    FROM user_tiers
    WHERE user_wallet = p_user_wallet;

    -- 如果用户不存在，先创建
    IF current_tier IS NULL THEN
        INSERT INTO user_tiers (user_wallet, tier_level)
        VALUES (p_user_wallet, p_new_tier);
        RETURN TRUE;
    END IF;

    -- 更新等级
    UPDATE user_tiers
    SET
        tier_level = p_new_tier,
        tier_updated_at = NOW()
    WHERE user_wallet = p_user_wallet;

    -- 记录等级变更日志（可选）
    INSERT INTO red_flower_transactions (
        user_wallet,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        source_type,
        description,
        metadata
    ) VALUES (
        p_user_wallet,
        'unlock',
        0,
        0,
        0,
        'manual',
        COALESCE(p_reason, '等级升级: ' || current_tier || ' -> ' || p_new_tier),
        jsonb_build_object('old_tier', current_tier, 'new_tier', p_new_tier)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新时间戳
CREATE OR REPLACE FUNCTION update_red_flower_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_red_flower_balance_timestamp
    BEFORE UPDATE ON red_flower_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_red_flower_timestamp();

CREATE TRIGGER trigger_update_daily_exchange_stats_timestamp
    BEFORE UPDATE ON daily_exchange_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_red_flower_timestamp();

-- 创建注释
COMMENT ON TABLE red_flower_balances IS '小红花余额表，记录用户的小红花余额信息';
COMMENT ON TABLE red_flower_transactions IS '小红花交易记录表，记录所有小红花的收入和支出';
COMMENT ON TABLE user_tiers IS '用户等级表，管理用户的等级和权益';
COMMENT ON TABLE red_flower_exchange_config IS '小红花兑换配置表，不同等级用户的兑换规则';
COMMENT ON TABLE daily_exchange_stats IS '每日兑换统计表，记录用户每日的兑换情况';

COMMENT ON FUNCTION get_or_create_red_flower_balance IS '获取或创建用户小红花余额记录';
COMMENT ON FUNCTION get_user_tier_info IS '获取用户等级信息';
COMMENT ON FUNCTION get_user_exchange_config IS '获取用户对应等级的兑换配置';
COMMENT ON FUNCTION execute_red_flower_exchange IS '执行小红花兑换SM代币操作';
COMMENT ON FUNCTION add_red_flower_balance IS '为用户添加小红花余额';

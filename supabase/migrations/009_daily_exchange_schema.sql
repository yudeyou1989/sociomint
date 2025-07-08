-- SocioMint 每日限量兑换系统数据库架构
-- 创建时间: 2025-01-04
-- 版本: 1.0.0

-- 每日兑换池配置表
CREATE TABLE IF NOT EXISTS daily_exchange_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_date DATE NOT NULL UNIQUE, -- 兑换日期
    total_sm_available NUMERIC(36, 18) NOT NULL DEFAULT 500000, -- 当日可兑换的SM总量
    sm_exchanged NUMERIC(36, 18) NOT NULL DEFAULT 0, -- 已兑换的SM数量
    sm_remaining NUMERIC(36, 18) NOT NULL DEFAULT 500000, -- 剩余可兑换的SM数量
    base_exchange_rate NUMERIC(18, 6) NOT NULL DEFAULT 100, -- 基础兑换比例 (小红花:SM)
    current_exchange_rate NUMERIC(18, 6) NOT NULL DEFAULT 100, -- 当前兑换比例
    rate_adjustment_factor NUMERIC(8, 4) NOT NULL DEFAULT 1.0, -- 比例调整因子
    total_participants INTEGER NOT NULL DEFAULT 0, -- 参与人数
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- 是否激活
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_daily_exchange_pools_date (pool_date),
    INDEX idx_daily_exchange_pools_active (is_active),
    
    -- 约束
    CONSTRAINT positive_total_sm_available CHECK (total_sm_available > 0),
    CONSTRAINT positive_sm_exchanged CHECK (sm_exchanged >= 0),
    CONSTRAINT positive_sm_remaining CHECK (sm_remaining >= 0),
    CONSTRAINT positive_base_exchange_rate CHECK (base_exchange_rate > 0),
    CONSTRAINT positive_current_exchange_rate CHECK (current_exchange_rate > 0),
    CONSTRAINT valid_sm_amounts CHECK (sm_exchanged + sm_remaining = total_sm_available),
    CONSTRAINT positive_participants CHECK (total_participants >= 0)
);

-- 用户每日兑换记录表
CREATE TABLE IF NOT EXISTS daily_exchange_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    pool_date DATE NOT NULL,
    flowers_amount NUMERIC(18, 6) NOT NULL, -- 消耗的小红花数量
    sm_amount NUMERIC(36, 18) NOT NULL, -- 获得的SM数量
    exchange_rate NUMERIC(18, 6) NOT NULL, -- 兑换时的比例
    transaction_hash TEXT, -- 交易哈希
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_daily_exchange_records_wallet (user_wallet),
    INDEX idx_daily_exchange_records_date (pool_date),
    INDEX idx_daily_exchange_records_status (status),
    INDEX idx_daily_exchange_records_wallet_date (user_wallet, pool_date),
    
    -- 约束
    CONSTRAINT unique_user_daily_exchange UNIQUE(user_wallet, pool_date),
    CONSTRAINT positive_flowers_amount CHECK (flowers_amount > 0),
    CONSTRAINT positive_sm_amount CHECK (sm_amount > 0),
    CONSTRAINT positive_exchange_rate CHECK (exchange_rate > 0),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- 兑换比例历史表
CREATE TABLE IF NOT EXISTS exchange_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_date DATE NOT NULL,
    old_rate NUMERIC(18, 6) NOT NULL, -- 调整前比例
    new_rate NUMERIC(18, 6) NOT NULL, -- 调整后比例
    adjustment_reason TEXT, -- 调整原因
    sm_exchanged_at_time NUMERIC(36, 18) NOT NULL, -- 调整时已兑换数量
    participants_at_time INTEGER NOT NULL, -- 调整时参与人数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_exchange_rate_history_date (pool_date),
    INDEX idx_exchange_rate_history_time (created_at),
    
    -- 约束
    CONSTRAINT positive_old_rate CHECK (old_rate > 0),
    CONSTRAINT positive_new_rate CHECK (new_rate > 0),
    CONSTRAINT positive_sm_exchanged_at_time CHECK (sm_exchanged_at_time >= 0),
    CONSTRAINT positive_participants_at_time CHECK (participants_at_time >= 0)
);

-- 用户兑换限额配置表
CREATE TABLE IF NOT EXISTS user_exchange_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_tier TEXT NOT NULL DEFAULT 'basic', -- 'basic', 'verified', 'vip'
    min_flowers_per_exchange NUMERIC(18, 6) NOT NULL DEFAULT 100, -- 最小兑换数量
    max_flowers_per_day NUMERIC(18, 6) NOT NULL DEFAULT 10000, -- 每日最大兑换数量
    max_sm_per_day NUMERIC(36, 18) NOT NULL DEFAULT 1000, -- 每日最大获得SM数量
    bonus_rate_multiplier NUMERIC(8, 4) NOT NULL DEFAULT 1.0, -- 奖励比例倍数
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_user_exchange_limits_tier (user_tier),
    INDEX idx_user_exchange_limits_effective_date (effective_date),
    INDEX idx_user_exchange_limits_active (is_active),
    
    -- 约束
    CONSTRAINT positive_min_flowers CHECK (min_flowers_per_exchange > 0),
    CONSTRAINT positive_max_flowers CHECK (max_flowers_per_day > 0),
    CONSTRAINT positive_max_sm CHECK (max_sm_per_day > 0),
    CONSTRAINT positive_bonus_multiplier CHECK (bonus_rate_multiplier > 0),
    CONSTRAINT valid_user_tier CHECK (user_tier IN ('basic', 'verified', 'vip'))
);

-- 插入默认用户限额配置
INSERT INTO user_exchange_limits (user_tier, min_flowers_per_exchange, max_flowers_per_day, max_sm_per_day, bonus_rate_multiplier) VALUES
('basic', 100, 5000, 500, 1.0),
('verified', 100, 10000, 1000, 1.1),
('vip', 100, 20000, 2000, 1.2)
ON CONFLICT DO NOTHING;

-- 创建函数：获取或创建当日兑换池
CREATE OR REPLACE FUNCTION get_or_create_daily_pool(
    p_pool_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID AS $$
DECLARE
    pool_id UUID;
BEGIN
    -- 尝试获取现有池
    SELECT id INTO pool_id
    FROM daily_exchange_pools
    WHERE pool_date = p_pool_date;
    
    -- 如果不存在，创建新池
    IF pool_id IS NULL THEN
        INSERT INTO daily_exchange_pools (
            pool_date,
            total_sm_available,
            sm_remaining,
            base_exchange_rate,
            current_exchange_rate
        ) VALUES (
            p_pool_date,
            500000, -- 默认50万SM
            500000,
            100,    -- 默认100小红花兑换1SM
            100
        ) RETURNING id INTO pool_id;
    END IF;
    
    RETURN pool_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：计算动态兑换比例
CREATE OR REPLACE FUNCTION calculate_dynamic_exchange_rate(
    p_pool_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC(18, 6) AS $$
DECLARE
    pool_record RECORD;
    utilization_rate NUMERIC(8, 4);
    new_rate NUMERIC(18, 6);
BEGIN
    -- 获取池信息
    SELECT * INTO pool_record
    FROM daily_exchange_pools
    WHERE pool_date = p_pool_date;
    
    IF NOT FOUND THEN
        RETURN 100; -- 默认比例
    END IF;
    
    -- 计算利用率
    utilization_rate := pool_record.sm_exchanged / pool_record.total_sm_available;
    
    -- 动态调整比例：利用率越高，兑换比例越高（需要更多小红花）
    -- 基础比例 * (1 + 利用率 * 调整因子)
    new_rate := pool_record.base_exchange_rate * (1 + utilization_rate * pool_record.rate_adjustment_factor);
    
    -- 限制比例范围（50-500）
    new_rate := GREATEST(50, LEAST(500, new_rate));
    
    RETURN new_rate;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：检查用户兑换资格
CREATE OR REPLACE FUNCTION check_user_exchange_eligibility(
    p_user_wallet TEXT,
    p_flowers_amount NUMERIC(18, 6),
    p_pool_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    user_limits RECORD;
    existing_exchange RECORD;
    pool_record RECORD;
    required_sm NUMERIC(36, 18);
    result JSONB;
BEGIN
    -- 获取用户限额（默认basic级别）
    SELECT * INTO user_limits
    FROM user_exchange_limits
    WHERE user_tier = 'basic' -- 这里可以根据用户等级动态获取
    AND is_active = TRUE
    AND effective_date <= p_pool_date
    ORDER BY effective_date DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('eligible', false, 'reason', 'no_limits_config');
    END IF;
    
    -- 检查最小兑换数量
    IF p_flowers_amount < user_limits.min_flowers_per_exchange THEN
        RETURN jsonb_build_object(
            'eligible', false, 
            'reason', 'below_minimum',
            'min_required', user_limits.min_flowers_per_exchange
        );
    END IF;
    
    -- 检查用户今日是否已兑换
    SELECT * INTO existing_exchange
    FROM daily_exchange_records
    WHERE user_wallet = p_user_wallet
    AND pool_date = p_pool_date;
    
    IF FOUND THEN
        RETURN jsonb_build_object('eligible', false, 'reason', 'already_exchanged');
    END IF;
    
    -- 获取池信息
    SELECT * INTO pool_record
    FROM daily_exchange_pools
    WHERE pool_date = p_pool_date;
    
    IF NOT FOUND OR NOT pool_record.is_active THEN
        RETURN jsonb_build_object('eligible', false, 'reason', 'pool_not_available');
    END IF;
    
    -- 计算需要的SM数量
    required_sm := p_flowers_amount / pool_record.current_exchange_rate;
    
    -- 检查池中是否有足够的SM
    IF required_sm > pool_record.sm_remaining THEN
        RETURN jsonb_build_object(
            'eligible', false, 
            'reason', 'insufficient_pool_balance',
            'available_sm', pool_record.sm_remaining
        );
    END IF;
    
    -- 检查用户每日限额
    IF p_flowers_amount > user_limits.max_flowers_per_day THEN
        RETURN jsonb_build_object(
            'eligible', false, 
            'reason', 'exceeds_daily_flowers_limit',
            'max_allowed', user_limits.max_flowers_per_day
        );
    END IF;
    
    IF required_sm > user_limits.max_sm_per_day THEN
        RETURN jsonb_build_object(
            'eligible', false, 
            'reason', 'exceeds_daily_sm_limit',
            'max_allowed', user_limits.max_sm_per_day
        );
    END IF;
    
    -- 通过所有检查
    RETURN jsonb_build_object(
        'eligible', true,
        'required_sm', required_sm,
        'exchange_rate', pool_record.current_exchange_rate,
        'bonus_multiplier', user_limits.bonus_rate_multiplier
    );
END;
$$ LANGUAGE plpgsql;

-- 创建函数：执行兑换
CREATE OR REPLACE FUNCTION execute_daily_exchange(
    p_user_wallet TEXT,
    p_flowers_amount NUMERIC(18, 6),
    p_transaction_hash TEXT DEFAULT NULL,
    p_pool_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    eligibility_result JSONB;
    pool_record RECORD;
    required_sm NUMERIC(36, 18);
    exchange_rate NUMERIC(18, 6);
    new_rate NUMERIC(18, 6);
    record_id UUID;
BEGIN
    -- 检查兑换资格
    eligibility_result := check_user_exchange_eligibility(p_user_wallet, p_flowers_amount, p_pool_date);
    
    IF NOT (eligibility_result->>'eligible')::BOOLEAN THEN
        RETURN eligibility_result;
    END IF;
    
    -- 获取池信息
    SELECT * INTO pool_record
    FROM daily_exchange_pools
    WHERE pool_date = p_pool_date;
    
    required_sm := (eligibility_result->>'required_sm')::NUMERIC;
    exchange_rate := (eligibility_result->>'exchange_rate')::NUMERIC;
    
    -- 创建兑换记录
    INSERT INTO daily_exchange_records (
        user_wallet,
        pool_date,
        flowers_amount,
        sm_amount,
        exchange_rate,
        transaction_hash,
        status
    ) VALUES (
        p_user_wallet,
        p_pool_date,
        p_flowers_amount,
        required_sm,
        exchange_rate,
        p_transaction_hash,
        CASE WHEN p_transaction_hash IS NOT NULL THEN 'confirmed' ELSE 'pending' END
    ) RETURNING id INTO record_id;
    
    -- 更新池状态
    UPDATE daily_exchange_pools
    SET 
        sm_exchanged = sm_exchanged + required_sm,
        sm_remaining = sm_remaining - required_sm,
        total_participants = total_participants + 1,
        updated_at = NOW()
    WHERE pool_date = p_pool_date;
    
    -- 计算新的兑换比例
    new_rate := calculate_dynamic_exchange_rate(p_pool_date);
    
    -- 如果比例发生变化，记录历史并更新
    IF ABS(new_rate - pool_record.current_exchange_rate) > 0.01 THEN
        INSERT INTO exchange_rate_history (
            pool_date,
            old_rate,
            new_rate,
            adjustment_reason,
            sm_exchanged_at_time,
            participants_at_time
        ) VALUES (
            p_pool_date,
            pool_record.current_exchange_rate,
            new_rate,
            'dynamic_adjustment',
            pool_record.sm_exchanged + required_sm,
            pool_record.total_participants + 1
        );
        
        UPDATE daily_exchange_pools
        SET current_exchange_rate = new_rate
        WHERE pool_date = p_pool_date;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'record_id', record_id,
        'sm_amount', required_sm,
        'exchange_rate', exchange_rate,
        'new_rate', new_rate
    );
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新池的更新时间
CREATE OR REPLACE FUNCTION update_pool_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pool_timestamp
    BEFORE UPDATE ON daily_exchange_pools
    FOR EACH ROW
    EXECUTE FUNCTION update_pool_timestamp();

-- 创建注释
COMMENT ON TABLE daily_exchange_pools IS '每日兑换池配置表，管理每日可兑换的SM代币数量和比例';
COMMENT ON TABLE daily_exchange_records IS '用户每日兑换记录表';
COMMENT ON TABLE exchange_rate_history IS '兑换比例调整历史表';
COMMENT ON TABLE user_exchange_limits IS '用户兑换限额配置表';

COMMENT ON FUNCTION get_or_create_daily_pool IS '获取或创建指定日期的兑换池';
COMMENT ON FUNCTION calculate_dynamic_exchange_rate IS '根据利用率计算动态兑换比例';
COMMENT ON FUNCTION check_user_exchange_eligibility IS '检查用户是否符合兑换条件';
COMMENT ON FUNCTION execute_daily_exchange IS '执行用户兑换操作';

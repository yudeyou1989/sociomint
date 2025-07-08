-- SocioMint 软质押持币验证系统数据库架构
-- 创建时间: 2025-01-04
-- 版本: 1.0.0

-- 用户余额快照表（每小时记录）
CREATE TABLE IF NOT EXISTS user_balance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    sm_balance NUMERIC(36, 18) NOT NULL, -- SM代币余额
    snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 快照时间
    block_number BIGINT, -- 区块号
    tx_hash TEXT, -- 触发快照的交易哈希（如果有）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_balance_snapshots_wallet (user_wallet),
    INDEX idx_balance_snapshots_time (snapshot_time),
    INDEX idx_balance_snapshots_wallet_time (user_wallet, snapshot_time),
    INDEX idx_balance_snapshots_balance (sm_balance),
    
    -- 约束
    CONSTRAINT positive_sm_balance_snapshot CHECK (sm_balance >= 0)
);

-- 软质押持币记录表
CREATE TABLE IF NOT EXISTS soft_staking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 开始持币时间
    end_time TIMESTAMP WITH TIME ZONE, -- 结束持币时间（NULL表示仍在持币）
    min_balance NUMERIC(36, 18) NOT NULL, -- 期间最低余额
    max_balance NUMERIC(36, 18) NOT NULL, -- 期间最高余额
    avg_balance NUMERIC(36, 18) NOT NULL, -- 期间平均余额
    duration_hours INTEGER DEFAULT 0, -- 持币时长（小时）
    is_eligible_for_reward BOOLEAN DEFAULT FALSE, -- 是否符合奖励条件（≥24小时且≥500SM）
    reward_calculated BOOLEAN DEFAULT FALSE, -- 是否已计算奖励
    total_flowers_earned NUMERIC(18, 6) DEFAULT 0, -- 本次持币获得的小红花总数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_soft_staking_wallet (user_wallet),
    INDEX idx_soft_staking_start_time (start_time),
    INDEX idx_soft_staking_end_time (end_time),
    INDEX idx_soft_staking_eligible (is_eligible_for_reward),
    INDEX idx_soft_staking_active (user_wallet, end_time) WHERE end_time IS NULL,
    
    -- 约束
    CONSTRAINT positive_min_balance CHECK (min_balance >= 0),
    CONSTRAINT positive_max_balance CHECK (max_balance >= 0),
    CONSTRAINT positive_avg_balance CHECK (avg_balance >= 0),
    CONSTRAINT valid_balance_range CHECK (min_balance <= max_balance),
    CONSTRAINT positive_duration CHECK (duration_hours >= 0),
    CONSTRAINT positive_flowers_earned CHECK (total_flowers_earned >= 0)
);

-- 软质押奖励发放记录表
CREATE TABLE IF NOT EXISTS soft_staking_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    session_id UUID REFERENCES soft_staking_sessions(id) ON DELETE CASCADE,
    reward_date DATE NOT NULL, -- 奖励日期
    sm_balance NUMERIC(36, 18) NOT NULL, -- 当日有效余额
    flowers_amount NUMERIC(18, 6) NOT NULL, -- 奖励小红花数量
    calculation_method TEXT NOT NULL, -- 计算方法（'daily_snapshot', 'minimum_balance', 'average_balance'）
    is_distributed BOOLEAN DEFAULT FALSE, -- 是否已发放
    distribution_tx_hash TEXT, -- 发放交易哈希
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    distributed_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_soft_staking_rewards_wallet (user_wallet),
    INDEX idx_soft_staking_rewards_date (reward_date),
    INDEX idx_soft_staking_rewards_session (session_id),
    INDEX idx_soft_staking_rewards_distributed (is_distributed),
    
    -- 约束
    CONSTRAINT unique_user_session_date UNIQUE(user_wallet, session_id, reward_date),
    CONSTRAINT positive_sm_balance_reward CHECK (sm_balance >= 0),
    CONSTRAINT positive_flowers_amount_reward CHECK (flowers_amount >= 0)
);

-- 软质押配置表
CREATE TABLE IF NOT EXISTS soft_staking_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_holding_hours INTEGER NOT NULL DEFAULT 24, -- 最低持币时长（小时）
    min_balance_threshold NUMERIC(36, 18) NOT NULL DEFAULT 500, -- 最低余额阈值
    flowers_per_500_sm NUMERIC(18, 6) NOT NULL DEFAULT 10, -- 每500 SM对应的小红花数量
    max_daily_flowers NUMERIC(18, 6) NOT NULL DEFAULT 200, -- 每日最大奖励
    snapshot_interval_hours INTEGER NOT NULL DEFAULT 1, -- 快照间隔（小时）
    tolerance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 5.0, -- 余额波动容忍度（百分比）
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 生效日期
    is_active BOOLEAN DEFAULT TRUE, -- 是否激活
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_soft_staking_config_effective_date (effective_date),
    INDEX idx_soft_staking_config_active (is_active),
    
    -- 约束
    CONSTRAINT positive_min_holding_hours CHECK (min_holding_hours > 0),
    CONSTRAINT positive_min_balance_threshold CHECK (min_balance_threshold >= 0),
    CONSTRAINT positive_flowers_per_500_sm CHECK (flowers_per_500_sm >= 0),
    CONSTRAINT positive_max_daily_flowers CHECK (max_daily_flowers >= 0),
    CONSTRAINT positive_snapshot_interval CHECK (snapshot_interval_hours > 0),
    CONSTRAINT valid_tolerance_percentage CHECK (tolerance_percentage >= 0 AND tolerance_percentage <= 100)
);

-- 插入默认配置
INSERT INTO soft_staking_config (
    min_holding_hours,
    min_balance_threshold,
    flowers_per_500_sm,
    max_daily_flowers,
    snapshot_interval_hours,
    tolerance_percentage
) VALUES (
    24,    -- 24小时最低持币时长
    500,   -- 500 SM最低余额
    10,    -- 每500 SM获得10小红花
    200,   -- 每日最大200小红花
    1,     -- 每小时快照
    5.0    -- 5%波动容忍度
) ON CONFLICT DO NOTHING;

-- 创建函数：记录余额快照
CREATE OR REPLACE FUNCTION record_balance_snapshot(
    p_user_wallet TEXT,
    p_sm_balance NUMERIC(36, 18),
    p_block_number BIGINT DEFAULT NULL,
    p_tx_hash TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
BEGIN
    INSERT INTO user_balance_snapshots (
        user_wallet,
        sm_balance,
        snapshot_time,
        block_number,
        tx_hash
    ) VALUES (
        p_user_wallet,
        p_sm_balance,
        NOW(),
        p_block_number,
        p_tx_hash
    ) RETURNING id INTO snapshot_id;
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取用户24小时最低余额
CREATE OR REPLACE FUNCTION get_user_24h_min_balance(
    p_user_wallet TEXT,
    p_check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS NUMERIC(36, 18) AS $$
DECLARE
    min_balance NUMERIC(36, 18);
BEGIN
    SELECT COALESCE(MIN(sm_balance), 0)
    INTO min_balance
    FROM user_balance_snapshots
    WHERE user_wallet = p_user_wallet
    AND snapshot_time >= (p_check_time - INTERVAL '24 hours')
    AND snapshot_time <= p_check_time;
    
    RETURN min_balance;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：检查用户是否符合软质押奖励条件
CREATE OR REPLACE FUNCTION check_soft_staking_eligibility(
    p_user_wallet TEXT,
    p_check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS BOOLEAN AS $$
DECLARE
    min_balance NUMERIC(36, 18);
    config_record RECORD;
BEGIN
    -- 获取当前配置
    SELECT * INTO config_record
    FROM soft_staking_config
    WHERE is_active = TRUE
    AND effective_date <= CURRENT_DATE
    ORDER BY effective_date DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 获取24小时最低余额
    min_balance := get_user_24h_min_balance(p_user_wallet, p_check_time);
    
    -- 检查是否满足条件
    RETURN min_balance >= config_record.min_balance_threshold;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：计算软质押奖励
CREATE OR REPLACE FUNCTION calculate_soft_staking_reward(
    p_user_wallet TEXT,
    p_reward_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC(18, 6) AS $$
DECLARE
    min_balance NUMERIC(36, 18);
    config_record RECORD;
    reward_amount NUMERIC(18, 6);
BEGIN
    -- 获取当前配置
    SELECT * INTO config_record
    FROM soft_staking_config
    WHERE is_active = TRUE
    AND effective_date <= p_reward_date
    ORDER BY effective_date DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- 获取当日最低余额
    min_balance := get_user_24h_min_balance(
        p_user_wallet, 
        (p_reward_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
    );
    
    -- 计算奖励
    reward_amount := FLOOR(min_balance / config_record.min_balance_threshold) * config_record.flowers_per_500_sm;
    
    -- 应用最大限制
    reward_amount := LEAST(reward_amount, config_record.max_daily_flowers);
    
    RETURN reward_amount;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新软质押会话
CREATE OR REPLACE FUNCTION update_soft_staking_session() RETURNS TRIGGER AS $$
DECLARE
    current_session_id UUID;
    min_balance NUMERIC(36, 18);
    max_balance NUMERIC(36, 18);
    avg_balance NUMERIC(36, 18);
    duration_hours INTEGER;
    config_record RECORD;
BEGIN
    -- 获取当前配置
    SELECT * INTO config_record
    FROM soft_staking_config
    WHERE is_active = TRUE
    AND effective_date <= CURRENT_DATE
    ORDER BY effective_date DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- 查找用户当前活跃的软质押会话
    SELECT id INTO current_session_id
    FROM soft_staking_sessions
    WHERE user_wallet = NEW.user_wallet
    AND end_time IS NULL
    ORDER BY start_time DESC
    LIMIT 1;
    
    -- 如果没有活跃会话且余额大于0，创建新会话
    IF current_session_id IS NULL AND NEW.sm_balance > 0 THEN
        INSERT INTO soft_staking_sessions (
            user_wallet,
            start_time,
            min_balance,
            max_balance,
            avg_balance
        ) VALUES (
            NEW.user_wallet,
            NEW.snapshot_time,
            NEW.sm_balance,
            NEW.sm_balance,
            NEW.sm_balance
        );
    -- 如果有活跃会话，更新会话信息
    ELSIF current_session_id IS NOT NULL THEN
        -- 计算统计数据
        SELECT 
            MIN(sm_balance),
            MAX(sm_balance),
            AVG(sm_balance),
            EXTRACT(EPOCH FROM (MAX(snapshot_time) - MIN(snapshot_time))) / 3600
        INTO min_balance, max_balance, avg_balance, duration_hours
        FROM user_balance_snapshots
        WHERE user_wallet = NEW.user_wallet
        AND snapshot_time >= (
            SELECT start_time FROM soft_staking_sessions WHERE id = current_session_id
        );
        
        -- 如果余额降为0，结束会话
        IF NEW.sm_balance = 0 THEN
            UPDATE soft_staking_sessions
            SET 
                end_time = NEW.snapshot_time,
                min_balance = min_balance,
                max_balance = max_balance,
                avg_balance = avg_balance,
                duration_hours = duration_hours,
                is_eligible_for_reward = (duration_hours >= config_record.min_holding_hours AND min_balance >= config_record.min_balance_threshold),
                updated_at = NOW()
            WHERE id = current_session_id;
        ELSE
            -- 更新会话统计
            UPDATE soft_staking_sessions
            SET 
                min_balance = min_balance,
                max_balance = max_balance,
                avg_balance = avg_balance,
                duration_hours = duration_hours,
                is_eligible_for_reward = (duration_hours >= config_record.min_holding_hours AND min_balance >= config_record.min_balance_threshold),
                updated_at = NOW()
            WHERE id = current_session_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_soft_staking_session
    AFTER INSERT ON user_balance_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_soft_staking_session();

-- 创建注释
COMMENT ON TABLE user_balance_snapshots IS '用户余额快照表，每小时记录用户SM代币余额';
COMMENT ON TABLE soft_staking_sessions IS '软质押持币会话表，记录用户持币期间的统计信息';
COMMENT ON TABLE soft_staking_rewards IS '软质押奖励发放记录表';
COMMENT ON TABLE soft_staking_config IS '软质押系统配置表';

COMMENT ON FUNCTION record_balance_snapshot IS '记录用户余额快照';
COMMENT ON FUNCTION get_user_24h_min_balance IS '获取用户24小时内最低余额';
COMMENT ON FUNCTION check_soft_staking_eligibility IS '检查用户是否符合软质押奖励条件';
COMMENT ON FUNCTION calculate_soft_staking_reward IS '计算用户软质押奖励数量';
COMMENT ON FUNCTION update_soft_staking_session IS '自动更新软质押会话信息';

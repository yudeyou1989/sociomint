-- SocioMint 小红花空投池数据库架构
-- 创建时间: 2024-12-19
-- 版本: 1.0.0

-- 空投池轮次表
CREATE TABLE IF NOT EXISTS airdrop_rounds (
    id BIGSERIAL PRIMARY KEY,
    round_id BIGINT UNIQUE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_deposits NUMERIC(36, 18) DEFAULT 0,
    total_rewards NUMERIC(36, 18) DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    is_distributed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户空投池投入记录表
CREATE TABLE IF NOT EXISTS airdrop_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    round_id BIGINT NOT NULL REFERENCES airdrop_rounds(round_id),
    deposited_flowers NUMERIC(36, 18) NOT NULL,
    expected_reward NUMERIC(36, 18) DEFAULT 0,
    actual_reward NUMERIC(36, 18) DEFAULT 0,
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT unique_user_round UNIQUE(user_id, round_id),
    CONSTRAINT positive_deposit CHECK (deposited_flowers > 0),
    CONSTRAINT valid_reward CHECK (actual_reward >= 0)
);

-- 空投池配置表
CREATE TABLE IF NOT EXISTS airdrop_pool_config (
    id SERIAL PRIMARY KEY,
    weekly_sm_amount NUMERIC(36, 18) NOT NULL DEFAULT 5000000,
    round_duration_hours INTEGER NOT NULL DEFAULT 168, -- 7天 = 168小时
    min_deposit NUMERIC(36, 18) NOT NULL DEFAULT 10,
    max_deposit NUMERIC(36, 18) NOT NULL DEFAULT 10000,
    is_active BOOLEAN DEFAULT TRUE,
    contract_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户空投统计表
CREATE TABLE IF NOT EXISTS user_airdrop_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    total_deposits NUMERIC(36, 18) DEFAULT 0,
    total_rewards NUMERIC(36, 18) DEFAULT 0,
    total_rounds_participated INTEGER DEFAULT 0,
    total_rounds_claimed INTEGER DEFAULT 0,
    first_participation_at TIMESTAMP WITH TIME ZONE,
    last_participation_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT unique_user_stats UNIQUE(user_id)
);

-- 空投池事件日志表
CREATE TABLE IF NOT EXISTS airdrop_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'deposit', 'claim', 'distribute', 'round_start', 'round_end'
    user_id UUID REFERENCES user_profiles(id),
    round_id BIGINT REFERENCES airdrop_rounds(round_id),
    amount NUMERIC(36, 18),
    tx_hash TEXT,
    block_number BIGINT,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_airdrop_events_type (event_type),
    INDEX idx_airdrop_events_user (user_id),
    INDEX idx_airdrop_events_round (round_id),
    INDEX idx_airdrop_events_time (created_at)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_airdrop_rounds_round_id ON airdrop_rounds(round_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_rounds_time ON airdrop_rounds(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_airdrop_rounds_status ON airdrop_rounds(is_distributed);

CREATE INDEX IF NOT EXISTS idx_airdrop_deposits_user ON airdrop_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_deposits_round ON airdrop_deposits(round_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_deposits_wallet ON airdrop_deposits(wallet_address);
CREATE INDEX IF NOT EXISTS idx_airdrop_deposits_claimed ON airdrop_deposits(is_claimed);
CREATE INDEX IF NOT EXISTS idx_airdrop_deposits_time ON airdrop_deposits(created_at);

CREATE INDEX IF NOT EXISTS idx_user_airdrop_stats_user ON user_airdrop_stats(user_id);

-- 创建视图：当前活跃轮次
CREATE OR REPLACE VIEW current_airdrop_round AS
SELECT 
    ar.*,
    EXTRACT(EPOCH FROM (ar.end_time - NOW())) AS seconds_remaining,
    CASE 
        WHEN NOW() < ar.start_time THEN 'pending'
        WHEN NOW() BETWEEN ar.start_time AND ar.end_time THEN 'active'
        WHEN NOW() > ar.end_time AND NOT ar.is_distributed THEN 'ended'
        ELSE 'distributed'
    END AS status
FROM airdrop_rounds ar
WHERE ar.round_id = (SELECT MAX(round_id) FROM airdrop_rounds);

-- 创建视图：用户空投详情
CREATE OR REPLACE VIEW user_airdrop_details AS
SELECT 
    up.id as user_id,
    up.wallet_address,
    up.username,
    uas.total_deposits,
    uas.total_rewards,
    uas.total_rounds_participated,
    uas.total_rounds_claimed,
    uas.first_participation_at,
    uas.last_participation_at,
    -- 当前轮次投入
    COALESCE(current_deposit.deposited_flowers, 0) as current_round_deposit,
    COALESCE(current_deposit.expected_reward, 0) as current_round_expected_reward,
    current_deposit.is_claimed as current_round_claimed,
    -- 排名信息
    RANK() OVER (ORDER BY uas.total_deposits DESC) as deposit_rank,
    RANK() OVER (ORDER BY uas.total_rewards DESC) as reward_rank
FROM user_profiles up
LEFT JOIN user_airdrop_stats uas ON up.id = uas.user_id
LEFT JOIN (
    SELECT ad.* 
    FROM airdrop_deposits ad
    INNER JOIN current_airdrop_round car ON ad.round_id = car.round_id
) current_deposit ON up.id = current_deposit.user_id;

-- 创建视图：轮次排行榜
CREATE OR REPLACE VIEW round_leaderboard AS
SELECT 
    ad.round_id,
    up.username,
    up.wallet_address,
    ad.deposited_flowers,
    ad.actual_reward,
    ad.is_claimed,
    RANK() OVER (PARTITION BY ad.round_id ORDER BY ad.deposited_flowers DESC) as rank,
    (ad.deposited_flowers * 100.0 / ar.total_deposits) as deposit_percentage
FROM airdrop_deposits ad
JOIN user_profiles up ON ad.user_id = up.id
JOIN airdrop_rounds ar ON ad.round_id = ar.round_id
WHERE ar.total_deposits > 0;

-- 创建函数：计算用户奖励
CREATE OR REPLACE FUNCTION calculate_user_reward(
    p_user_id UUID,
    p_round_id BIGINT
) RETURNS NUMERIC AS $$
DECLARE
    user_deposit NUMERIC;
    total_deposits NUMERIC;
    total_rewards NUMERIC;
    user_reward NUMERIC;
BEGIN
    -- 获取用户投入
    SELECT deposited_flowers INTO user_deposit
    FROM airdrop_deposits
    WHERE user_id = p_user_id AND round_id = p_round_id;
    
    IF user_deposit IS NULL OR user_deposit = 0 THEN
        RETURN 0;
    END IF;
    
    -- 获取轮次总投入和总奖励
    SELECT total_deposits, total_rewards INTO total_deposits, total_rewards
    FROM airdrop_rounds
    WHERE round_id = p_round_id AND is_distributed = TRUE;
    
    IF total_deposits IS NULL OR total_deposits = 0 THEN
        RETURN 0;
    END IF;
    
    -- 计算用户奖励：(用户投入 / 总投入) * 总奖励
    user_reward := (user_deposit * total_rewards) / total_deposits;
    
    RETURN user_reward;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：更新用户统计
CREATE OR REPLACE FUNCTION update_user_airdrop_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 插入或更新用户统计
    INSERT INTO user_airdrop_stats (
        user_id,
        total_deposits,
        total_rewards,
        total_rounds_participated,
        total_rounds_claimed,
        first_participation_at,
        last_participation_at
    )
    SELECT 
        NEW.user_id,
        COALESCE(SUM(deposited_flowers), 0),
        COALESCE(SUM(actual_reward), 0),
        COUNT(*),
        COUNT(*) FILTER (WHERE is_claimed = TRUE),
        MIN(created_at),
        MAX(created_at)
    FROM airdrop_deposits
    WHERE user_id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        total_deposits = EXCLUDED.total_deposits,
        total_rewards = EXCLUDED.total_rewards,
        total_rounds_participated = EXCLUDED.total_rounds_participated,
        total_rounds_claimed = EXCLUDED.total_rounds_claimed,
        first_participation_at = EXCLUDED.first_participation_at,
        last_participation_at = EXCLUDED.last_participation_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_user_airdrop_stats
    AFTER INSERT OR UPDATE ON airdrop_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_airdrop_stats();

-- 创建函数：自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加更新时间戳触发器
CREATE TRIGGER trigger_airdrop_rounds_updated_at
    BEFORE UPDATE ON airdrop_rounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_airdrop_deposits_updated_at
    BEFORE UPDATE ON airdrop_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_airdrop_pool_config_updated_at
    BEFORE UPDATE ON airdrop_pool_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_airdrop_stats_updated_at
    BEFORE UPDATE ON user_airdrop_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入初始配置
INSERT INTO airdrop_pool_config (
    weekly_sm_amount,
    round_duration_hours,
    min_deposit,
    max_deposit,
    is_active
) VALUES (
    5000000,  -- 500万 SM
    168,      -- 7天
    10,       -- 最小10小红花
    10000,    -- 最大10000小红花
    TRUE
) ON CONFLICT DO NOTHING;

-- 启用行级安全
ALTER TABLE airdrop_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrop_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrop_pool_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_airdrop_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrop_events ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 轮次信息：所有人可读
CREATE POLICY "airdrop_rounds_select" ON airdrop_rounds
    FOR SELECT USING (true);

-- 用户投入：用户只能查看自己的记录
CREATE POLICY "airdrop_deposits_select" ON airdrop_deposits
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "airdrop_deposits_insert" ON airdrop_deposits
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "airdrop_deposits_update" ON airdrop_deposits
    FOR UPDATE USING (
        auth.uid()::text = user_id::text OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 配置：只有服务角色可以修改
CREATE POLICY "airdrop_pool_config_select" ON airdrop_pool_config
    FOR SELECT USING (true);

CREATE POLICY "airdrop_pool_config_modify" ON airdrop_pool_config
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 用户统计：用户只能查看自己的统计
CREATE POLICY "user_airdrop_stats_select" ON user_airdrop_stats
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 事件日志：只有服务角色可以写入，用户可以查看自己的
CREATE POLICY "airdrop_events_select" ON airdrop_events
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "airdrop_events_insert" ON airdrop_events
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 创建注释
COMMENT ON TABLE airdrop_rounds IS '空投池轮次信息表';
COMMENT ON TABLE airdrop_deposits IS '用户空投池投入记录表';
COMMENT ON TABLE airdrop_pool_config IS '空投池配置表';
COMMENT ON TABLE user_airdrop_stats IS '用户空投统计表';
COMMENT ON TABLE airdrop_events IS '空投池事件日志表';

COMMENT ON VIEW current_airdrop_round IS '当前活跃轮次视图';
COMMENT ON VIEW user_airdrop_details IS '用户空投详情视图';
COMMENT ON VIEW round_leaderboard IS '轮次排行榜视图';

COMMENT ON FUNCTION calculate_user_reward(UUID, BIGINT) IS '计算用户在指定轮次的奖励';
COMMENT ON FUNCTION update_user_airdrop_stats() IS '更新用户空投统计的触发器函数';

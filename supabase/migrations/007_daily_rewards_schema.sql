-- SocioMint 每日持币奖励数据库架构
-- 创建时间: 2024-12-19
-- 版本: 1.0.0

-- 每日奖励领取记录表
CREATE TABLE IF NOT EXISTS daily_reward_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    claim_date DATE NOT NULL, -- 领取日期（YYYY-MM-DD）
    sm_balance NUMERIC(36, 18) NOT NULL, -- 领取时的 SM 余额
    flowers_amount NUMERIC(36, 18) NOT NULL, -- 领取的小红花数量
    tx_hash TEXT NOT NULL, -- 交易哈希
    block_number BIGINT, -- 区块号
    gas_used BIGINT, -- 消耗的 Gas
    claim_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_daily_claims_wallet (user_wallet),
    INDEX idx_daily_claims_date (claim_date),
    INDEX idx_daily_claims_timestamp (claim_timestamp),
    INDEX idx_daily_claims_tx_hash (tx_hash),
    
    -- 约束
    CONSTRAINT unique_user_daily_claim UNIQUE(user_wallet, claim_date),
    CONSTRAINT positive_sm_balance CHECK (sm_balance >= 0),
    CONSTRAINT positive_flowers_amount CHECK (flowers_amount > 0)
);

-- 用户每日奖励统计表
CREATE TABLE IF NOT EXISTS user_daily_reward_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT UNIQUE NOT NULL,
    total_claims INTEGER DEFAULT 0, -- 总领取次数
    total_flowers_claimed NUMERIC(36, 18) DEFAULT 0, -- 总领取小红花数量
    first_claim_date DATE, -- 首次领取日期
    last_claim_date DATE, -- 最后领取日期
    current_streak INTEGER DEFAULT 0, -- 当前连续领取天数
    max_streak INTEGER DEFAULT 0, -- 最大连续领取天数
    average_daily_flowers NUMERIC(18, 6) DEFAULT 0, -- 平均每日领取数量
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_user_daily_stats_wallet (user_wallet),
    INDEX idx_user_daily_stats_total_claims (total_claims),
    INDEX idx_user_daily_stats_total_flowers (total_flowers_claimed),
    INDEX idx_user_daily_stats_streak (current_streak),
    
    -- 约束
    CONSTRAINT positive_total_claims CHECK (total_claims >= 0),
    CONSTRAINT positive_total_flowers CHECK (total_flowers_claimed >= 0),
    CONSTRAINT positive_current_streak CHECK (current_streak >= 0),
    CONSTRAINT positive_max_streak CHECK (max_streak >= 0)
);

-- 每日奖励排行榜表（每日快照）
CREATE TABLE IF NOT EXISTS daily_reward_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    user_wallet TEXT NOT NULL,
    username TEXT, -- 用户名（如果有）
    sm_balance NUMERIC(36, 18) NOT NULL, -- SM 余额
    flowers_claimed NUMERIC(36, 18) NOT NULL, -- 当日领取的小红花
    rank INTEGER NOT NULL, -- 排名
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_leaderboard_date (snapshot_date),
    INDEX idx_leaderboard_rank (snapshot_date, rank),
    INDEX idx_leaderboard_wallet (user_wallet),
    INDEX idx_leaderboard_flowers (snapshot_date, flowers_claimed DESC),
    
    -- 约束
    CONSTRAINT unique_user_daily_leaderboard UNIQUE(snapshot_date, user_wallet),
    CONSTRAINT positive_rank CHECK (rank > 0),
    CONSTRAINT positive_sm_balance_lb CHECK (sm_balance >= 0),
    CONSTRAINT positive_flowers_claimed_lb CHECK (flowers_claimed >= 0)
);

-- 每日奖励配置历史表
CREATE TABLE IF NOT EXISTS daily_reward_config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flowers_per_500_sm NUMERIC(18, 6) NOT NULL, -- 每 500 SM 对应的小红花数量
    max_daily_flowers_per_user NUMERIC(18, 6) NOT NULL, -- 每日最大领取数量
    effective_date DATE NOT NULL, -- 生效日期
    tx_hash TEXT, -- 配置更新的交易哈希
    updated_by TEXT, -- 更新者地址
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_config_history_date (effective_date),
    INDEX idx_config_history_tx_hash (tx_hash)
);

-- 创建视图：用户每日奖励详情
CREATE OR REPLACE VIEW user_daily_reward_details AS
SELECT 
    udrs.user_wallet,
    up.username,
    udrs.total_claims,
    udrs.total_flowers_claimed,
    udrs.first_claim_date,
    udrs.last_claim_date,
    udrs.current_streak,
    udrs.max_streak,
    udrs.average_daily_flowers,
    -- 今日是否已领取
    CASE 
        WHEN udrs.last_claim_date = CURRENT_DATE THEN TRUE 
        ELSE FALSE 
    END as claimed_today,
    -- 连续领取状态
    CASE 
        WHEN udrs.last_claim_date = CURRENT_DATE THEN 'active'
        WHEN udrs.last_claim_date = CURRENT_DATE - INTERVAL '1 day' THEN 'can_continue'
        ELSE 'broken'
    END as streak_status,
    -- 排名信息
    RANK() OVER (ORDER BY udrs.total_flowers_claimed DESC) as total_flowers_rank,
    RANK() OVER (ORDER BY udrs.current_streak DESC) as streak_rank
FROM user_daily_reward_stats udrs
LEFT JOIN user_profiles up ON udrs.user_wallet = up.wallet_address;

-- 创建视图：每日奖励概览
CREATE OR REPLACE VIEW daily_reward_overview AS
SELECT 
    claim_date,
    COUNT(*) as total_claimers,
    SUM(flowers_amount) as total_flowers_distributed,
    AVG(flowers_amount) as average_flowers_per_user,
    MIN(flowers_amount) as min_flowers_claimed,
    MAX(flowers_amount) as max_flowers_claimed,
    SUM(sm_balance) as total_sm_held,
    AVG(sm_balance) as average_sm_per_user
FROM daily_reward_claims
GROUP BY claim_date
ORDER BY claim_date DESC;

-- 创建视图：当前排行榜（今日）
CREATE OR REPLACE VIEW current_daily_leaderboard AS
SELECT 
    drl.*,
    up.username,
    up.twitter_username,
    up.discord_username
FROM daily_reward_leaderboard drl
LEFT JOIN user_profiles up ON drl.user_wallet = up.wallet_address
WHERE drl.snapshot_date = CURRENT_DATE
ORDER BY drl.rank ASC;

-- 创建函数：更新用户每日奖励统计
CREATE OR REPLACE FUNCTION update_user_daily_reward_stats()
RETURNS TRIGGER AS $$
DECLARE
    yesterday_claimed BOOLEAN;
    new_streak INTEGER;
BEGIN
    -- 检查昨天是否领取了奖励
    SELECT EXISTS(
        SELECT 1 FROM daily_reward_claims 
        WHERE user_wallet = NEW.user_wallet 
        AND claim_date = NEW.claim_date - INTERVAL '1 day'
    ) INTO yesterday_claimed;
    
    -- 计算新的连续天数
    IF yesterday_claimed THEN
        new_streak := COALESCE((
            SELECT current_streak FROM user_daily_reward_stats 
            WHERE user_wallet = NEW.user_wallet
        ), 0) + 1;
    ELSE
        new_streak := 1; -- 重新开始计算
    END IF;
    
    -- 插入或更新用户统计
    INSERT INTO user_daily_reward_stats (
        user_wallet,
        total_claims,
        total_flowers_claimed,
        first_claim_date,
        last_claim_date,
        current_streak,
        max_streak,
        average_daily_flowers
    )
    SELECT 
        NEW.user_wallet,
        COUNT(*),
        SUM(flowers_amount),
        MIN(claim_date),
        MAX(claim_date),
        new_streak,
        GREATEST(new_streak, COALESCE(MAX(udrs.max_streak), 0)),
        AVG(flowers_amount)
    FROM daily_reward_claims drc
    LEFT JOIN user_daily_reward_stats udrs ON drc.user_wallet = udrs.user_wallet
    WHERE drc.user_wallet = NEW.user_wallet
    ON CONFLICT (user_wallet) DO UPDATE SET
        total_claims = EXCLUDED.total_claims,
        total_flowers_claimed = EXCLUDED.total_flowers_claimed,
        last_claim_date = EXCLUDED.last_claim_date,
        current_streak = EXCLUDED.current_streak,
        max_streak = EXCLUDED.max_streak,
        average_daily_flowers = EXCLUDED.average_daily_flowers,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新用户统计
CREATE TRIGGER trigger_update_user_daily_reward_stats
    AFTER INSERT ON daily_reward_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_user_daily_reward_stats();

-- 创建函数：生成每日排行榜快照
CREATE OR REPLACE FUNCTION generate_daily_leaderboard_snapshot(snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    record_count INTEGER;
BEGIN
    -- 删除当日已存在的快照
    DELETE FROM daily_reward_leaderboard WHERE snapshot_date = snapshot_date;
    
    -- 生成新的排行榜快照
    INSERT INTO daily_reward_leaderboard (
        snapshot_date,
        user_wallet,
        username,
        sm_balance,
        flowers_claimed,
        rank
    )
    SELECT 
        snapshot_date,
        drc.user_wallet,
        up.username,
        drc.sm_balance,
        drc.flowers_amount,
        ROW_NUMBER() OVER (ORDER BY drc.flowers_amount DESC, drc.claim_timestamp ASC)
    FROM daily_reward_claims drc
    LEFT JOIN user_profiles up ON drc.user_wallet = up.wallet_address
    WHERE drc.claim_date = snapshot_date;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    RETURN record_count;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：检查用户是否可以领取每日奖励
CREATE OR REPLACE FUNCTION can_claim_daily_reward(p_user_wallet TEXT, p_claim_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
BEGIN
    -- 检查当日是否已经领取过
    RETURN NOT EXISTS(
        SELECT 1 FROM daily_reward_claims 
        WHERE user_wallet = p_user_wallet 
        AND claim_date = p_claim_date
    );
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取用户连续领取天数
CREATE OR REPLACE FUNCTION get_user_streak(p_user_wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    has_claim BOOLEAN;
BEGIN
    -- 从今天开始往前检查连续天数
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM daily_reward_claims 
            WHERE user_wallet = p_user_wallet 
            AND claim_date = check_date
        ) INTO has_claim;
        
        IF has_claim THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- 创建自动更新时间戳触发器
CREATE TRIGGER trigger_user_daily_reward_stats_updated_at
    BEFORE UPDATE ON user_daily_reward_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全
ALTER TABLE daily_reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_reward_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reward_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reward_config_history ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 每日奖励领取记录：用户只能查看自己的记录
CREATE POLICY "daily_reward_claims_user_access" ON daily_reward_claims
    FOR SELECT USING (
        auth.uid()::text = user_wallet OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "daily_reward_claims_service_manage" ON daily_reward_claims
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 用户统计：用户只能查看自己的统计
CREATE POLICY "user_daily_reward_stats_user_access" ON user_daily_reward_stats
    FOR SELECT USING (
        auth.uid()::text = user_wallet OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "user_daily_reward_stats_service_manage" ON user_daily_reward_stats
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 排行榜：所有人可以查看
CREATE POLICY "daily_reward_leaderboard_public_read" ON daily_reward_leaderboard
    FOR SELECT USING (true);

CREATE POLICY "daily_reward_leaderboard_service_manage" ON daily_reward_leaderboard
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 配置历史：所有人可以查看
CREATE POLICY "daily_reward_config_history_public_read" ON daily_reward_config_history
    FOR SELECT USING (true);

CREATE POLICY "daily_reward_config_history_service_manage" ON daily_reward_config_history
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 插入初始配置记录
INSERT INTO daily_reward_config_history (
    flowers_per_500_sm,
    max_daily_flowers_per_user,
    effective_date
) VALUES (
    10,    -- 每 500 SM 获得 10 小红花
    200,   -- 每日最多 200 小红花
    CURRENT_DATE
) ON CONFLICT DO NOTHING;

-- 创建注释
COMMENT ON TABLE daily_reward_claims IS '每日奖励领取记录表';
COMMENT ON TABLE user_daily_reward_stats IS '用户每日奖励统计表';
COMMENT ON TABLE daily_reward_leaderboard IS '每日奖励排行榜表';
COMMENT ON TABLE daily_reward_config_history IS '每日奖励配置历史表';

COMMENT ON VIEW user_daily_reward_details IS '用户每日奖励详情视图';
COMMENT ON VIEW daily_reward_overview IS '每日奖励概览视图';
COMMENT ON VIEW current_daily_leaderboard IS '当前每日排行榜视图';

COMMENT ON FUNCTION update_user_daily_reward_stats() IS '更新用户每日奖励统计的触发器函数';
COMMENT ON FUNCTION generate_daily_leaderboard_snapshot(DATE) IS '生成每日排行榜快照';
COMMENT ON FUNCTION can_claim_daily_reward(TEXT, DATE) IS '检查用户是否可以领取每日奖励';
COMMENT ON FUNCTION get_user_streak(TEXT) IS '获取用户连续领取天数';

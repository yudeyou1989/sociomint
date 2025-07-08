-- SocioMint 价格发现系统数据库架构
-- 创建时间: 2025-01-04
-- 版本: 1.0.0

-- 价格历史表
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    price_bnb NUMERIC(36, 18) NOT NULL, -- SM代币的BNB价格
    price_usd NUMERIC(36, 18) NOT NULL, -- SM代币的USD价格
    sm_sold NUMERIC(36, 18) NOT NULL, -- 本次交易售出的SM数量
    bnb_received NUMERIC(36, 18) NOT NULL, -- 本次交易收到的BNB数量
    transaction_hash TEXT NOT NULL UNIQUE, -- 交易哈希
    block_number BIGINT NOT NULL, -- 区块号
    exchange_type TEXT NOT NULL DEFAULT 'bnb_exchange', -- 交易类型
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_price_history_timestamp (timestamp),
    INDEX idx_price_history_block_number (block_number),
    INDEX idx_price_history_tx_hash (transaction_hash),
    INDEX idx_price_history_exchange_type (exchange_type),
    INDEX idx_price_history_price_usd (price_usd),
    
    -- 约束
    CONSTRAINT positive_price_bnb CHECK (price_bnb > 0),
    CONSTRAINT positive_price_usd CHECK (price_usd > 0),
    CONSTRAINT positive_sm_sold CHECK (sm_sold > 0),
    CONSTRAINT positive_bnb_received CHECK (bnb_received > 0),
    CONSTRAINT positive_block_number CHECK (block_number > 0)
);

-- 价格统计缓存表（用于快速查询）
CREATE TABLE IF NOT EXISTS price_stats_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_date DATE NOT NULL UNIQUE,
    opening_price_usd NUMERIC(36, 18) NOT NULL, -- 开盘价
    closing_price_usd NUMERIC(36, 18) NOT NULL, -- 收盘价
    highest_price_usd NUMERIC(36, 18) NOT NULL, -- 最高价
    lowest_price_usd NUMERIC(36, 18) NOT NULL, -- 最低价
    volume_sm NUMERIC(36, 18) NOT NULL DEFAULT 0, -- SM交易量
    volume_bnb NUMERIC(36, 18) NOT NULL DEFAULT 0, -- BNB交易量
    volume_usd NUMERIC(36, 18) NOT NULL DEFAULT 0, -- USD交易量
    transactions_count INTEGER NOT NULL DEFAULT 0, -- 交易次数
    unique_buyers INTEGER NOT NULL DEFAULT 0, -- 独立买家数
    market_cap_usd NUMERIC(36, 18), -- 市值
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_price_stats_cache_date (stat_date),
    INDEX idx_price_stats_cache_closing_price (closing_price_usd),
    INDEX idx_price_stats_cache_volume (volume_usd),
    
    -- 约束
    CONSTRAINT positive_opening_price CHECK (opening_price_usd > 0),
    CONSTRAINT positive_closing_price CHECK (closing_price_usd > 0),
    CONSTRAINT positive_highest_price CHECK (highest_price_usd > 0),
    CONSTRAINT positive_lowest_price CHECK (lowest_price_usd > 0),
    CONSTRAINT valid_price_range CHECK (lowest_price_usd <= highest_price_usd),
    CONSTRAINT positive_volume_sm CHECK (volume_sm >= 0),
    CONSTRAINT positive_volume_bnb CHECK (volume_bnb >= 0),
    CONSTRAINT positive_volume_usd CHECK (volume_usd >= 0),
    CONSTRAINT positive_transactions_count CHECK (transactions_count >= 0),
    CONSTRAINT positive_unique_buyers CHECK (unique_buyers >= 0)
);

-- BNB价格缓存表（从外部API获取）
CREATE TABLE IF NOT EXISTS bnb_price_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    price_usd NUMERIC(18, 6) NOT NULL, -- BNB的USD价格
    source TEXT NOT NULL DEFAULT 'coingecko', -- 价格来源
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_bnb_price_cache_timestamp (timestamp),
    INDEX idx_bnb_price_cache_active (is_active),
    INDEX idx_bnb_price_cache_source (source),
    
    -- 约束
    CONSTRAINT positive_bnb_price_usd CHECK (price_usd > 0)
);

-- 价格预警配置表
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- 'price_above', 'price_below', 'price_change_percent'
    target_value NUMERIC(36, 18) NOT NULL, -- 目标价格或百分比
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    notification_method TEXT NOT NULL DEFAULT 'email', -- 'email', 'webhook', 'telegram'
    notification_address TEXT, -- 邮箱地址或webhook URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_price_alerts_user_wallet (user_wallet),
    INDEX idx_price_alerts_active (is_active),
    INDEX idx_price_alerts_triggered (is_triggered),
    INDEX idx_price_alerts_type (alert_type),
    
    -- 约束
    CONSTRAINT valid_alert_type CHECK (alert_type IN ('price_above', 'price_below', 'price_change_percent')),
    CONSTRAINT positive_target_value CHECK (target_value > 0),
    CONSTRAINT valid_notification_method CHECK (notification_method IN ('email', 'webhook', 'telegram'))
);

-- 插入初始BNB价格数据
INSERT INTO bnb_price_cache (price_usd, source) VALUES (660.00, 'manual') ON CONFLICT DO NOTHING;

-- 创建函数：获取最新BNB价格
CREATE OR REPLACE FUNCTION get_latest_bnb_price() RETURNS NUMERIC(18, 6) AS $$
DECLARE
    latest_price NUMERIC(18, 6);
BEGIN
    SELECT price_usd INTO latest_price
    FROM bnb_price_cache
    WHERE is_active = TRUE
    ORDER BY timestamp DESC
    LIMIT 1;
    
    RETURN COALESCE(latest_price, 660.00); -- 默认价格
END;
$$ LANGUAGE plpgsql;

-- 创建函数：记录价格数据
CREATE OR REPLACE FUNCTION record_price_data(
    p_sm_amount NUMERIC(36, 18),
    p_bnb_amount NUMERIC(36, 18),
    p_transaction_hash TEXT,
    p_block_number BIGINT,
    p_exchange_type TEXT DEFAULT 'bnb_exchange'
) RETURNS UUID AS $$
DECLARE
    price_id UUID;
    bnb_price_usd NUMERIC(18, 6);
    sm_price_bnb NUMERIC(36, 18);
    sm_price_usd NUMERIC(36, 18);
BEGIN
    -- 获取当前BNB价格
    bnb_price_usd := get_latest_bnb_price();
    
    -- 计算SM价格
    sm_price_bnb := p_bnb_amount / p_sm_amount;
    sm_price_usd := sm_price_bnb * bnb_price_usd;
    
    -- 插入价格记录
    INSERT INTO price_history (
        price_bnb,
        price_usd,
        sm_sold,
        bnb_received,
        transaction_hash,
        block_number,
        exchange_type
    ) VALUES (
        sm_price_bnb,
        sm_price_usd,
        p_sm_amount,
        p_bnb_amount,
        p_transaction_hash,
        p_block_number,
        p_exchange_type
    ) RETURNING id INTO price_id;
    
    RETURN price_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取价格统计
CREATE OR REPLACE FUNCTION get_price_stats(
    p_period_hours INTEGER DEFAULT 24
) RETURNS TABLE(
    current_price_usd NUMERIC(36, 18),
    price_change_24h NUMERIC(36, 18),
    price_change_percentage NUMERIC(8, 4),
    volume_sm NUMERIC(36, 18),
    volume_bnb NUMERIC(36, 18),
    volume_usd NUMERIC(36, 18),
    transactions_count BIGINT,
    highest_price NUMERIC(36, 18),
    lowest_price NUMERIC(36, 18)
) AS $$
DECLARE
    start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    start_time := NOW() - (p_period_hours || ' hours')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        (SELECT ph.price_usd FROM price_history ph ORDER BY ph.timestamp DESC LIMIT 1) as current_price_usd,
        (SELECT ph.price_usd FROM price_history ph ORDER BY ph.timestamp DESC LIMIT 1) - 
        (SELECT ph.price_usd FROM price_history ph WHERE ph.timestamp <= start_time ORDER BY ph.timestamp DESC LIMIT 1) as price_change_24h,
        CASE 
            WHEN (SELECT ph.price_usd FROM price_history ph WHERE ph.timestamp <= start_time ORDER BY ph.timestamp DESC LIMIT 1) > 0 THEN
                ((SELECT ph.price_usd FROM price_history ph ORDER BY ph.timestamp DESC LIMIT 1) - 
                 (SELECT ph.price_usd FROM price_history ph WHERE ph.timestamp <= start_time ORDER BY ph.timestamp DESC LIMIT 1)) /
                (SELECT ph.price_usd FROM price_history ph WHERE ph.timestamp <= start_time ORDER BY ph.timestamp DESC LIMIT 1) * 100
            ELSE 0
        END as price_change_percentage,
        COALESCE(SUM(ph.sm_sold), 0) as volume_sm,
        COALESCE(SUM(ph.bnb_received), 0) as volume_bnb,
        COALESCE(SUM(ph.bnb_received * get_latest_bnb_price()), 0) as volume_usd,
        COUNT(*) as transactions_count,
        COALESCE(MAX(ph.price_usd), 0) as highest_price,
        COALESCE(MIN(ph.price_usd), 0) as lowest_price
    FROM price_history ph
    WHERE ph.timestamp >= start_time;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：更新每日价格统计缓存
CREATE OR REPLACE FUNCTION update_daily_price_stats(
    p_stat_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
    stats_record RECORD;
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
BEGIN
    start_time := p_stat_date::TIMESTAMP WITH TIME ZONE;
    end_time := start_time + INTERVAL '1 day';
    
    -- 计算当日统计数据
    SELECT 
        (SELECT ph.price_usd FROM price_history ph WHERE ph.timestamp >= start_time AND ph.timestamp < end_time ORDER BY ph.timestamp ASC LIMIT 1) as opening_price,
        (SELECT ph.price_usd FROM price_history ph WHERE ph.timestamp >= start_time AND ph.timestamp < end_time ORDER BY ph.timestamp DESC LIMIT 1) as closing_price,
        COALESCE(MAX(ph.price_usd), 0) as highest_price,
        COALESCE(MIN(ph.price_usd), 0) as lowest_price,
        COALESCE(SUM(ph.sm_sold), 0) as volume_sm,
        COALESCE(SUM(ph.bnb_received), 0) as volume_bnb,
        COALESCE(SUM(ph.bnb_received * get_latest_bnb_price()), 0) as volume_usd,
        COUNT(*) as transactions_count,
        COUNT(DISTINCT SUBSTRING(ph.transaction_hash, 1, 42)) as unique_buyers -- 简化的买家计数
    INTO stats_record
    FROM price_history ph
    WHERE ph.timestamp >= start_time AND ph.timestamp < end_time;
    
    -- 插入或更新统计缓存
    INSERT INTO price_stats_cache (
        stat_date,
        opening_price_usd,
        closing_price_usd,
        highest_price_usd,
        lowest_price_usd,
        volume_sm,
        volume_bnb,
        volume_usd,
        transactions_count,
        unique_buyers,
        updated_at
    ) VALUES (
        p_stat_date,
        COALESCE(stats_record.opening_price, 0),
        COALESCE(stats_record.closing_price, 0),
        stats_record.highest_price,
        stats_record.lowest_price,
        stats_record.volume_sm,
        stats_record.volume_bnb,
        stats_record.volume_usd,
        stats_record.transactions_count,
        stats_record.unique_buyers,
        NOW()
    ) ON CONFLICT (stat_date) DO UPDATE SET
        opening_price_usd = EXCLUDED.opening_price_usd,
        closing_price_usd = EXCLUDED.closing_price_usd,
        highest_price_usd = EXCLUDED.highest_price_usd,
        lowest_price_usd = EXCLUDED.lowest_price_usd,
        volume_sm = EXCLUDED.volume_sm,
        volume_bnb = EXCLUDED.volume_bnb,
        volume_usd = EXCLUDED.volume_usd,
        transactions_count = EXCLUDED.transactions_count,
        unique_buyers = EXCLUDED.unique_buyers,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 创建函数：检查价格预警
CREATE OR REPLACE FUNCTION check_price_alerts() RETURNS INTEGER AS $$
DECLARE
    alert_record RECORD;
    current_price NUMERIC(36, 18);
    triggered_count INTEGER := 0;
BEGIN
    -- 获取当前价格
    SELECT price_usd INTO current_price
    FROM price_history
    ORDER BY timestamp DESC
    LIMIT 1;
    
    IF current_price IS NULL THEN
        RETURN 0;
    END IF;
    
    -- 检查所有活跃的价格预警
    FOR alert_record IN 
        SELECT * FROM price_alerts 
        WHERE is_active = TRUE AND is_triggered = FALSE
    LOOP
        CASE alert_record.alert_type
            WHEN 'price_above' THEN
                IF current_price >= alert_record.target_value THEN
                    UPDATE price_alerts 
                    SET is_triggered = TRUE, triggered_at = NOW()
                    WHERE id = alert_record.id;
                    triggered_count := triggered_count + 1;
                END IF;
            WHEN 'price_below' THEN
                IF current_price <= alert_record.target_value THEN
                    UPDATE price_alerts 
                    SET is_triggered = TRUE, triggered_at = NOW()
                    WHERE id = alert_record.id;
                    triggered_count := triggered_count + 1;
                END IF;
            -- price_change_percent 需要更复杂的逻辑，这里简化处理
        END CASE;
    END LOOP;
    
    RETURN triggered_count;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新价格统计缓存
CREATE OR REPLACE FUNCTION trigger_update_price_stats() RETURNS TRIGGER AS $$
BEGIN
    -- 异步更新当日统计（在实际应用中可能需要使用队列）
    PERFORM update_daily_price_stats(NEW.timestamp::DATE);
    
    -- 检查价格预警
    PERFORM check_price_alerts();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_price_history_update
    AFTER INSERT ON price_history
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_price_stats();

-- 创建注释
COMMENT ON TABLE price_history IS '价格历史记录表，存储每次BNB兑换SM的价格数据';
COMMENT ON TABLE price_stats_cache IS '价格统计缓存表，用于快速查询日K线数据';
COMMENT ON TABLE bnb_price_cache IS 'BNB价格缓存表，存储从外部API获取的BNB价格';
COMMENT ON TABLE price_alerts IS '价格预警配置表，用户可设置价格提醒';

COMMENT ON FUNCTION get_latest_bnb_price IS '获取最新的BNB价格';
COMMENT ON FUNCTION record_price_data IS '记录价格数据到历史表';
COMMENT ON FUNCTION get_price_stats IS '获取指定时间段的价格统计数据';
COMMENT ON FUNCTION update_daily_price_stats IS '更新每日价格统计缓存';
COMMENT ON FUNCTION check_price_alerts IS '检查并触发价格预警';

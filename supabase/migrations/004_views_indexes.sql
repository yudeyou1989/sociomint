-- SocioMint 视图和索引优化
-- 提供便捷的数据查询和性能优化
-- 创建时间: 2024-12-19

-- 用户完整信息视图
CREATE VIEW user_complete_info AS
SELECT 
    up.id,
    up.wallet_address,
    up.username,
    up.email,
    up.avatar_url,
    up.bio,
    up.twitter_username,
    up.twitter_verified,
    up.discord_username,
    up.discord_verified,
    up.telegram_username,
    up.telegram_verified,
    up.total_tasks_completed,
    up.total_rewards_earned,
    up.reputation_score,
    up.is_verified,
    up.is_merchant,
    up.is_banned,
    up.created_at,
    up.updated_at,
    up.last_login_at,
    ub.sm_balance,
    ub.sm_staked,
    ub.red_flower_balance,
    ub.red_flower_earned_total,
    ub.bnb_balance,
    m.merchant_name,
    m.verification_level,
    m.reputation_score as merchant_reputation,
    m.total_trades,
    m.successful_trades
FROM user_profiles up
LEFT JOIN user_balances ub ON up.id = ub.user_id
LEFT JOIN merchants m ON up.id = m.user_id AND m.status = 'active';

-- 活跃任务视图
CREATE VIEW active_tasks_view AS
SELECT 
    st.id,
    st.title,
    st.description,
    st.task_type,
    st.platform,
    st.target_url,
    st.required_action,
    st.reward_amount,
    st.reward_type,
    st.max_participants,
    st.current_participants,
    st.priority,
    st.start_time,
    st.end_time,
    st.created_at,
    up.username as creator_username,
    up.avatar_url as creator_avatar,
    m.merchant_name,
    m.verification_level,
    CASE 
        WHEN st.max_participants > 0 THEN 
            ROUND((st.current_participants::DECIMAL / st.max_participants) * 100, 2)
        ELSE 0 
    END as completion_percentage
FROM social_tasks st
JOIN user_profiles up ON st.creator_id = up.id
LEFT JOIN merchants m ON up.id = m.user_id AND m.status = 'active'
WHERE st.status = 'active' 
    AND (st.start_time IS NULL OR st.start_time <= NOW())
    AND (st.end_time IS NULL OR st.end_time > NOW())
    AND (st.max_participants IS NULL OR st.current_participants < st.max_participants);

-- 用户任务完成统计视图
CREATE VIEW user_task_stats AS
SELECT 
    up.id as user_id,
    up.username,
    up.wallet_address,
    COUNT(tc.id) as total_submissions,
    COUNT(CASE WHEN tc.status = 'verified' THEN 1 END) as verified_completions,
    COUNT(CASE WHEN tc.status = 'rewarded' THEN 1 END) as rewarded_completions,
    COUNT(CASE WHEN tc.status = 'rejected' THEN 1 END) as rejected_submissions,
    SUM(CASE WHEN tc.status = 'rewarded' THEN tc.reward_amount ELSE 0 END) as total_earned,
    ROUND(
        CASE 
            WHEN COUNT(tc.id) > 0 THEN 
                (COUNT(CASE WHEN tc.status = 'verified' OR tc.status = 'rewarded' THEN 1 END)::DECIMAL / COUNT(tc.id)) * 100
            ELSE 0 
        END, 2
    ) as success_rate
FROM user_profiles up
LEFT JOIN task_completions tc ON up.id = tc.user_id
GROUP BY up.id, up.username, up.wallet_address;

-- 商人交易统计视图
CREATE VIEW merchant_trade_stats AS
SELECT 
    m.id as merchant_id,
    m.user_id,
    up.username,
    up.wallet_address,
    m.merchant_name,
    m.verification_level,
    m.staked_amount,
    m.total_trades,
    m.successful_trades,
    m.total_volume,
    m.reputation_score,
    COUNT(mt.id) as active_trades,
    COUNT(CASE WHEN mt.status = 'pending' THEN 1 END) as pending_trades,
    COUNT(CASE WHEN mt.status = 'completed' THEN 1 END) as completed_trades,
    AVG(CASE WHEN mt.status = 'completed' THEN mt.sell_amount END) as avg_trade_amount,
    ROUND(
        CASE 
            WHEN m.total_trades > 0 THEN 
                (m.successful_trades::DECIMAL / m.total_trades) * 100
            ELSE 0 
        END, 2
    ) as success_rate_percentage
FROM merchants m
JOIN user_profiles up ON m.user_id = up.id
LEFT JOIN market_trades mt ON (m.user_id = mt.seller_id OR m.user_id = mt.buyer_id)
WHERE m.status = 'active'
GROUP BY m.id, m.user_id, up.username, up.wallet_address, m.merchant_name, 
         m.verification_level, m.staked_amount, m.total_trades, m.successful_trades, 
         m.total_volume, m.reputation_score;

-- 宝箱统计视图
CREATE VIEW treasure_box_stats AS
SELECT 
    up.id as user_id,
    up.username,
    up.wallet_address,
    COUNT(tb.id) as total_boxes,
    COUNT(CASE WHEN tb.status = 'unopened' THEN 1 END) as unopened_boxes,
    COUNT(CASE WHEN tb.status = 'opened' THEN 1 END) as opened_boxes,
    COUNT(CASE WHEN tb.box_type = 'normal' THEN 1 END) as normal_boxes,
    COUNT(CASE WHEN tb.box_type = 'rare' THEN 1 END) as rare_boxes,
    COUNT(CASE WHEN tb.box_type = 'epic' THEN 1 END) as epic_boxes,
    COUNT(CASE WHEN tb.box_type = 'legendary' THEN 1 END) as legendary_boxes,
    COUNT(CASE WHEN tb.box_type = 'crazy' THEN 1 END) as crazy_boxes,
    SUM(CASE WHEN tb.status = 'opened' THEN tb.total_value ELSE 0 END) as total_value_earned
FROM user_profiles up
LEFT JOIN treasure_boxes tb ON up.id = tb.user_id
GROUP BY up.id, up.username, up.wallet_address;

-- 平台统计视图
CREATE VIEW platform_stats AS
SELECT 
    (SELECT COUNT(*) FROM user_profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
    (SELECT COUNT(*) FROM user_profiles WHERE last_login_at >= CURRENT_DATE - INTERVAL '1 day') as daily_active_users,
    (SELECT COUNT(*) FROM user_profiles WHERE last_login_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_active_users,
    (SELECT COUNT(*) FROM social_tasks WHERE status = 'active') as active_tasks,
    (SELECT COUNT(*) FROM task_completions WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') as daily_task_completions,
    (SELECT COUNT(*) FROM treasure_boxes WHERE status = 'unopened') as unopened_boxes,
    (SELECT COUNT(*) FROM merchants WHERE status = 'active') as active_merchants,
    (SELECT COUNT(*) FROM market_trades WHERE status IN ('pending', 'accepted')) as active_trades,
    (SELECT SUM(sm_balance) FROM user_balances) as total_sm_in_circulation,
    (SELECT SUM(red_flower_balance) FROM user_balances) as total_red_flowers,
    (SELECT SUM(staked_amount) FROM staking_records WHERE status = 'active') as total_staked_amount;

-- 性能优化索引

-- 用户相关索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_merchant ON user_profiles(is_merchant) WHERE is_merchant = true;

-- 交易相关索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type_status ON transactions(tx_type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash) WHERE tx_hash IS NOT NULL;

-- 任务相关索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_tasks_active ON social_tasks(status, start_time, end_time) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_tasks_creator_status ON social_tasks(creator_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_tasks_platform_type ON social_tasks(platform, task_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_tasks_reward ON social_tasks(reward_amount DESC);

-- 任务完成相关索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_completions_user_status ON task_completions(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_completions_task_status ON task_completions(task_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_completions_submitted ON task_completions(submitted_at DESC);

-- 宝箱相关索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treasure_boxes_user_status ON treasure_boxes(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treasure_boxes_type_created ON treasure_boxes(box_type, created_at DESC);

-- 商人相关索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_status_verification ON merchants(status, verification_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_reputation ON merchants(reputation_score DESC) WHERE status = 'active';

-- 市场交易相关索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_trades_seller_status ON market_trades(seller_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_trades_buyer_status ON market_trades(buyer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_trades_type_status ON market_trades(trade_type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_trades_created ON market_trades(created_at DESC);

-- 质押相关索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staking_records_user_status ON staking_records(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staking_records_type_status ON staking_records(stake_type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staking_records_reward_claim ON staking_records(last_reward_claim) WHERE status = 'active';

-- 复合索引优化查询性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_composite ON user_profiles(is_verified, is_merchant, is_banned, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_tasks_composite ON social_tasks(status, platform, task_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_completions_composite ON task_completions(status, submitted_at DESC, reward_amount);

-- 部分索引优化存储空间
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_pending ON transactions(user_id, created_at) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_with_rewards ON social_tasks(reward_amount DESC, created_at DESC) WHERE status = 'active' AND reward_amount > 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_merchants ON merchants(reputation_score DESC, total_trades DESC) WHERE status = 'active';

-- 全文搜索索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_tasks_search ON social_tasks USING gin(to_tsvector('english', title || ' ' || description)) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_search ON user_profiles USING gin(to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(bio, '')));

-- 统计信息更新
ANALYZE user_profiles;
ANALYZE user_balances;
ANALYZE transactions;
ANALYZE social_tasks;
ANALYZE task_completions;
ANALYZE treasure_boxes;
ANALYZE merchants;
ANALYZE market_trades;
ANALYZE staking_records;

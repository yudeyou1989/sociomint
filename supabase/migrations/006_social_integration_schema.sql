-- SocioMint 社交平台集成数据库架构
-- 创建时间: 2024-12-19
-- 版本: 1.0.0

-- 社交平台令牌存储表
CREATE TABLE IF NOT EXISTS social_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'twitter', 'discord', 'telegram'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT unique_user_platform UNIQUE(user_wallet, platform),
    CONSTRAINT valid_platform CHECK (platform IN ('twitter', 'discord', 'telegram'))
);

-- 用户社交行为记录表
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'twitter', 'discord', 'telegram'
    action_type TEXT NOT NULL, -- 'follow', 'like', 'retweet', 'join_guild', 'message', etc.
    target_id TEXT NOT NULL, -- 目标ID（推文ID、用户ID、服务器ID等）
    target_url TEXT, -- 目标URL（可选）
    reward_amount NUMERIC(18, 2) DEFAULT 0,
    metadata JSONB, -- 额外的行为数据
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_user_actions_wallet (user_wallet),
    INDEX idx_user_actions_platform (platform),
    INDEX idx_user_actions_type (action_type),
    INDEX idx_user_actions_target (target_id),
    INDEX idx_user_actions_time (created_at),
    INDEX idx_user_actions_verified (verified),
    
    -- 约束
    CONSTRAINT valid_platform_action CHECK (platform IN ('twitter', 'discord', 'telegram')),
    CONSTRAINT positive_reward CHECK (reward_amount >= 0)
);

-- 小红花奖励记录表
CREATE TABLE IF NOT EXISTS red_flower_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    source_type TEXT NOT NULL, -- 'social_action', 'task_completion', 'airdrop', 'manual'
    source_id TEXT, -- 来源ID（行为ID、任务ID等）
    platform TEXT, -- 来源平台
    action_type TEXT, -- 行为类型
    description TEXT, -- 奖励描述
    tx_hash TEXT, -- 链上交易哈希（如果有）
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引
    INDEX idx_red_flower_rewards_wallet (user_wallet),
    INDEX idx_red_flower_rewards_source (source_type, source_id),
    INDEX idx_red_flower_rewards_platform (platform),
    INDEX idx_red_flower_rewards_status (status),
    INDEX idx_red_flower_rewards_time (created_at),
    
    -- 约束
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_source_type CHECK (source_type IN ('social_action', 'task_completion', 'airdrop', 'manual')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'failed'))
);

-- DAO 社区组织表
CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id TEXT UNIQUE NOT NULL, -- 外部平台的组织ID
    platform TEXT NOT NULL, -- 'discord', 'telegram'
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    invite_url TEXT,
    owner_wallet TEXT,
    member_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    reward_multiplier NUMERIC(3, 2) DEFAULT 1.0, -- 奖励倍数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_guilds_platform (platform),
    INDEX idx_guilds_verified (is_verified),
    INDEX idx_guilds_active (is_active),
    
    -- 约束
    CONSTRAINT valid_guild_platform CHECK (platform IN ('discord', 'telegram')),
    CONSTRAINT positive_multiplier CHECK (reward_multiplier > 0)
);

-- 用户社区成员关系表
CREATE TABLE IF NOT EXISTS guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_wallet TEXT NOT NULL,
    platform_user_id TEXT NOT NULL, -- 平台用户ID
    username TEXT,
    roles JSONB, -- 用户在社区中的角色
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    total_rewards NUMERIC(18, 2) DEFAULT 0,
    
    -- 索引
    INDEX idx_guild_members_guild (guild_id),
    INDEX idx_guild_members_wallet (user_wallet),
    INDEX idx_guild_members_platform_user (platform_user_id),
    INDEX idx_guild_members_active (is_active),
    
    -- 约束
    CONSTRAINT unique_guild_member UNIQUE(guild_id, user_wallet)
);

-- OAuth 认证状态临时表
CREATE TABLE IF NOT EXISTS auth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state TEXT UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    platform TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_auth_states_state (state),
    INDEX idx_auth_states_wallet (wallet_address),
    INDEX idx_auth_states_expires (expires_at)
);

-- 社交任务模板表
CREATE TABLE IF NOT EXISTS social_task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    action_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_amount NUMERIC(18, 2) NOT NULL,
    requirements JSONB, -- 任务要求
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 索引
    INDEX idx_social_task_templates_platform (platform),
    INDEX idx_social_task_templates_type (action_type),
    INDEX idx_social_task_templates_active (is_active)
);

-- 创建视图：用户社交统计
CREATE OR REPLACE VIEW user_social_stats AS
SELECT 
    ua.user_wallet,
    ua.platform,
    COUNT(*) as total_actions,
    SUM(ua.reward_amount) as total_rewards,
    COUNT(*) FILTER (WHERE ua.verified = TRUE) as verified_actions,
    COUNT(DISTINCT ua.action_type) as unique_action_types,
    MAX(ua.created_at) as last_action_at,
    MIN(ua.created_at) as first_action_at
FROM user_actions ua
GROUP BY ua.user_wallet, ua.platform;

-- 创建视图：平台活跃度统计
CREATE OR REPLACE VIEW platform_activity_stats AS
SELECT 
    platform,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as daily_actions,
    COUNT(DISTINCT user_wallet) as active_users,
    SUM(reward_amount) as daily_rewards
FROM user_actions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY platform, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- 创建视图：社区排行榜
CREATE OR REPLACE VIEW guild_leaderboard AS
SELECT 
    g.id,
    g.name,
    g.platform,
    g.member_count,
    COUNT(gm.id) as active_members,
    SUM(gm.total_rewards) as total_guild_rewards,
    AVG(gm.total_rewards) as avg_member_rewards,
    RANK() OVER (PARTITION BY g.platform ORDER BY SUM(gm.total_rewards) DESC) as rank
FROM guilds g
LEFT JOIN guild_members gm ON g.id = gm.guild_id AND gm.is_active = TRUE
WHERE g.is_active = TRUE
GROUP BY g.id, g.name, g.platform, g.member_count;

-- 创建函数：更新用户余额
CREATE OR REPLACE FUNCTION update_user_balance(
    p_wallet_address TEXT,
    p_red_flower_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
    -- 更新用户余额表
    INSERT INTO user_balances (user_id, red_flower_balance, red_flower_earned_total, updated_at)
    SELECT 
        up.id,
        COALESCE(ub.red_flower_balance, 0) + p_red_flower_amount,
        COALESCE(ub.red_flower_earned_total, 0) + p_red_flower_amount,
        NOW()
    FROM user_profiles up
    LEFT JOIN user_balances ub ON up.id = ub.user_id
    WHERE up.wallet_address = p_wallet_address
    ON CONFLICT (user_id) DO UPDATE SET
        red_flower_balance = user_balances.red_flower_balance + p_red_flower_amount,
        red_flower_earned_total = user_balances.red_flower_earned_total + p_red_flower_amount,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 创建函数：验证社交行为
CREATE OR REPLACE FUNCTION verify_social_action(
    p_user_wallet TEXT,
    p_platform TEXT,
    p_action_type TEXT,
    p_target_id TEXT,
    p_reward_amount NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    action_exists BOOLEAN;
BEGIN
    -- 检查行为是否已存在
    SELECT EXISTS(
        SELECT 1 FROM user_actions 
        WHERE user_wallet = p_user_wallet 
        AND platform = p_platform 
        AND action_type = p_action_type 
        AND target_id = p_target_id
    ) INTO action_exists;
    
    IF action_exists THEN
        RETURN FALSE;
    END IF;
    
    -- 插入新行为记录
    INSERT INTO user_actions (
        user_wallet, platform, action_type, target_id, 
        reward_amount, verified, verified_at
    ) VALUES (
        p_user_wallet, p_platform, p_action_type, p_target_id,
        p_reward_amount, TRUE, NOW()
    );
    
    -- 更新用户余额
    PERFORM update_user_balance(p_user_wallet, p_reward_amount);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表添加更新时间戳触发器
CREATE TRIGGER trigger_social_tokens_updated_at
    BEFORE UPDATE ON social_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_guilds_updated_at
    BEFORE UPDATE ON guilds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_social_task_templates_updated_at
    BEFORE UPDATE ON social_task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建触发器：自动清理过期的认证状态
CREATE OR REPLACE FUNCTION cleanup_expired_auth_states()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM auth_states WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_auth_states
    AFTER INSERT ON auth_states
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_expired_auth_states();

-- 启用行级安全
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE red_flower_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_task_templates ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- 社交令牌：用户只能访问自己的令牌
CREATE POLICY "social_tokens_user_access" ON social_tokens
    FOR ALL USING (
        auth.uid()::text = user_wallet OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 用户行为：用户可以查看自己的行为，服务角色可以管理所有
CREATE POLICY "user_actions_user_access" ON user_actions
    FOR SELECT USING (
        auth.uid()::text = user_wallet OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "user_actions_service_manage" ON user_actions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 小红花奖励：用户可以查看自己的奖励
CREATE POLICY "red_flower_rewards_user_access" ON red_flower_rewards
    FOR SELECT USING (
        auth.uid()::text = user_wallet OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "red_flower_rewards_service_manage" ON red_flower_rewards
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 社区：所有人可以查看，服务角色可以管理
CREATE POLICY "guilds_public_read" ON guilds
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "guilds_service_manage" ON guilds
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 社区成员：用户可以查看自己的成员关系
CREATE POLICY "guild_members_user_access" ON guild_members
    FOR SELECT USING (
        auth.uid()::text = user_wallet OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "guild_members_service_manage" ON guild_members
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 认证状态：用户只能访问自己的状态
CREATE POLICY "auth_states_user_access" ON auth_states
    FOR ALL USING (
        auth.uid()::text = wallet_address OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 社交任务模板：所有人可以查看活跃的模板
CREATE POLICY "social_task_templates_public_read" ON social_task_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "social_task_templates_service_manage" ON social_task_templates
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 插入初始社交任务模板
INSERT INTO social_task_templates (platform, action_type, title, description, reward_amount, requirements) VALUES
('twitter', 'follow', 'Follow SocioMint', 'Follow our official Twitter account @SocioMint', 50, '{"target_username": "SocioMint"}'),
('twitter', 'like', 'Like Tweet', 'Like our latest announcement tweet', 10, '{}'),
('twitter', 'retweet', 'Retweet', 'Retweet our latest announcement', 25, '{}'),
('twitter', 'reply', 'Reply to Tweet', 'Reply to our tweet with your thoughts', 30, '{"min_length": 10}'),
('discord', 'join_guild', 'Join Discord', 'Join our official Discord server', 100, '{"guild_id": "your_guild_id"}'),
('discord', 'message', 'Send Message', 'Send a message in our Discord server', 15, '{"min_length": 5}'),
('discord', 'reaction', 'Add Reaction', 'React to messages in our Discord', 5, '{}'),
('telegram', 'join_channel', 'Join Telegram', 'Join our official Telegram channel', 75, '{"channel_id": "your_channel_id"}'),
('telegram', 'message', 'Send Message', 'Send a message in our Telegram group', 20, '{"min_length": 5}');

-- 创建注释
COMMENT ON TABLE social_tokens IS '社交平台访问令牌存储表';
COMMENT ON TABLE user_actions IS '用户社交行为记录表';
COMMENT ON TABLE red_flower_rewards IS '小红花奖励记录表';
COMMENT ON TABLE guilds IS 'DAO 社区组织表';
COMMENT ON TABLE guild_members IS '用户社区成员关系表';
COMMENT ON TABLE auth_states IS 'OAuth 认证状态临时表';
COMMENT ON TABLE social_task_templates IS '社交任务模板表';

COMMENT ON VIEW user_social_stats IS '用户社交统计视图';
COMMENT ON VIEW platform_activity_stats IS '平台活跃度统计视图';
COMMENT ON VIEW guild_leaderboard IS '社区排行榜视图';

COMMENT ON FUNCTION update_user_balance(TEXT, NUMERIC) IS '更新用户小红花余额';
COMMENT ON FUNCTION verify_social_action(TEXT, TEXT, TEXT, TEXT, NUMERIC) IS '验证并记录社交行为';

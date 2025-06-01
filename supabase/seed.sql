-- SocioMint 种子数据
-- 用于开发和测试环境的初始数据
-- 创建时间: 2024-12-19

-- 插入测试用户
INSERT INTO user_profiles (
    id, wallet_address, username, email, bio,
    twitter_username, twitter_verified,
    discord_username, discord_verified,
    telegram_username, telegram_verified,
    is_verified, is_merchant
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440001',
    '0x1234567890123456789012345678901234567890',
    'alice_crypto',
    'alice@example.com',
    'Crypto enthusiast and early adopter of SocioMint',
    'alice_crypto',
    true,
    'alice#1234',
    true,
    'alice_crypto',
    true,
    true,
    false
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    '0x2345678901234567890123456789012345678901',
    'bob_merchant',
    'bob@example.com',
    'Professional merchant on SocioMint platform',
    'bob_merchant',
    true,
    'bob#5678',
    false,
    'bob_merchant',
    true,
    true,
    true
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '0x3456789012345678901234567890123456789012',
    'charlie_dev',
    'charlie@example.com',
    'Developer and blockchain enthusiast',
    'charlie_dev',
    false,
    'charlie#9999',
    true,
    null,
    false,
    false,
    false
);

-- 插入商人记录
INSERT INTO merchants (
    id, user_id, merchant_name, merchant_type,
    staked_amount, status, verification_level,
    reputation_score, total_trades, successful_trades
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'Bob''s Crypto Services',
    'business',
    1000.0,
    'active',
    'verified',
    4.8,
    25,
    23
);

-- 插入社交任务
INSERT INTO social_tasks (
    id, creator_id, title, description, task_type, platform,
    target_url, required_action, reward_amount, reward_type,
    max_participants, status, priority, start_time, end_time
) VALUES 
(
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'Follow SocioMint on Twitter',
    'Follow our official Twitter account @SocioMint and get rewarded with red flowers!',
    'follow',
    'twitter',
    'https://twitter.com/SocioMint',
    'Follow the account and screenshot your follow confirmation',
    50.0,
    'red_flower',
    1000,
    'active',
    1,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'Join SocioMint Discord',
    'Join our Discord community and participate in discussions',
    'join_group',
    'discord',
    'https://discord.gg/sociomint',
    'Join the Discord server and introduce yourself in #general',
    75.0,
    'red_flower',
    500,
    'active',
    2,
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '15 days'
),
(
    '770e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    'Create SocioMint Content',
    'Create original content about SocioMint and share it on social media',
    'create_content',
    'twitter',
    null,
    'Create a tweet or thread about SocioMint with #SocioMint hashtag',
    200.0,
    'red_flower',
    100,
    'active',
    3,
    NOW(),
    NOW() + INTERVAL '7 days'
);

-- 插入任务完成记录
INSERT INTO task_completions (
    id, task_id, user_id, status, submission_data,
    reward_amount, reward_type, submitted_at, verified_at, rewarded_at
) VALUES 
(
    '880e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'rewarded',
    '{"screenshot_url": "https://example.com/screenshot1.png", "twitter_username": "alice_crypto"}',
    50.0,
    'red_flower',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '30 minutes'
),
(
    '880e8400-e29b-41d4-a716-446655440002',
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'verified',
    '{"discord_username": "alice#1234", "introduction_message": "Hello everyone!"}',
    75.0,
    'red_flower',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '30 minutes',
    null
),
(
    '880e8400-e29b-41d4-a716-446655440003',
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    'submitted',
    '{"screenshot_url": "https://example.com/screenshot2.png", "twitter_username": "charlie_dev"}',
    50.0,
    'red_flower',
    NOW() - INTERVAL '30 minutes',
    null,
    null
);

-- 插入宝箱
INSERT INTO treasure_boxes (
    id, user_id, box_type, source_type, source_id, status
) VALUES 
(
    '990e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'normal',
    'task_completion',
    '880e8400-e29b-41d4-a716-446655440001',
    'unopened'
),
(
    '990e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'rare',
    'daily_login',
    null,
    'unopened'
),
(
    '990e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    'epic',
    'special_event',
    null,
    'opened'
);

-- 更新已开启宝箱的奖励内容
UPDATE treasure_boxes 
SET 
    reward_content = '{"red_flower": 150, "sm_token": 5}',
    total_value = 155,
    opened_at = NOW() - INTERVAL '1 hour'
WHERE id = '990e8400-e29b-41d4-a716-446655440003';

-- 插入交易记录
INSERT INTO transactions (
    id, user_id, tx_type, status, amount_bnb, amount_sm, amount_red_flower,
    from_address, to_address, tx_hash
) VALUES 
(
    'aa0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'exchange',
    'confirmed',
    0.1,
    120.48,
    null,
    '0x1234567890123456789012345678901234567890',
    '0xd7d7dd989642222B6f685aF0220dc0065F489ae0',
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
),
(
    'aa0e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'reward',
    'confirmed',
    null,
    null,
    50.0,
    'task_system',
    '0x1234567890123456789012345678901234567890',
    null
),
(
    'aa0e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    'exchange',
    'confirmed',
    0.05,
    60.24,
    null,
    '0x2345678901234567890123456789012345678901',
    '0xd7d7dd989642222B6f685aF0220dc0065F489ae0',
    '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
);

-- 插入市场交易
INSERT INTO market_trades (
    id, seller_id, buyer_id, trade_type, sell_amount, sell_currency,
    buy_amount, buy_currency, status, description
) VALUES 
(
    'bb0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'red_flower_to_sm',
    1000.0,
    'red_flower',
    10.0,
    'sm_token',
    'completed',
    'Exchange red flowers for SM tokens at favorable rate'
),
(
    'bb0e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    null,
    'service',
    500.0,
    'red_flower',
    1.0,
    'service_hour',
    'pending',
    'Social media management service - 1 hour consultation'
);

-- 插入质押记录
INSERT INTO staking_records (
    id, user_id, staked_amount, stake_type, reward_rate, status
) VALUES 
(
    'cc0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    100.0,
    'flexible',
    5.0,
    'active'
),
(
    'cc0e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    1000.0,
    'fixed_90d',
    12.0,
    'active'
);

-- 更新用户统计（通过触发器自动计算，这里手动设置初始值）
UPDATE user_profiles 
SET 
    total_tasks_completed = 2,
    total_rewards_earned = 125.0
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE user_profiles 
SET 
    total_tasks_completed = 0,
    total_rewards_earned = 0.0
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE user_profiles 
SET 
    total_tasks_completed = 0,
    total_rewards_earned = 0.0
WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- 插入初始余额（通过触发器自动创建，这里更新实际余额）
UPDATE user_balances 
SET 
    sm_balance = 120.48,
    red_flower_balance = 75.0,
    red_flower_earned_total = 125.0,
    bnb_balance = 0.5
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE user_balances 
SET 
    sm_balance = 60.24,
    red_flower_balance = 500.0,
    red_flower_earned_total = 500.0,
    bnb_balance = 1.0,
    sm_staked = 1000.0
WHERE user_id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE user_balances 
SET 
    sm_balance = 0.0,
    red_flower_balance = 155.0,
    red_flower_earned_total = 155.0,
    bnb_balance = 0.1
WHERE user_id = '550e8400-e29b-41d4-a716-446655440003';

-- 刷新统计信息
ANALYZE user_profiles;
ANALYZE user_balances;
ANALYZE transactions;
ANALYZE social_tasks;
ANALYZE task_completions;
ANALYZE treasure_boxes;
ANALYZE merchants;
ANALYZE market_trades;
ANALYZE staking_records;

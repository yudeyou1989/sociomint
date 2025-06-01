-- SocioMint 数据库函数和触发器
-- 实现业务逻辑和数据一致性
-- 创建时间: 2024-12-19

-- 创建用户资料时自动创建余额记录
CREATE OR REPLACE FUNCTION create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_balances (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_balance
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_balance();

-- 更新用户统计信息
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 当任务完成状态变为 'rewarded' 时更新用户统计
    IF NEW.status = 'rewarded' AND OLD.status != 'rewarded' THEN
        UPDATE user_profiles 
        SET 
            total_tasks_completed = total_tasks_completed + 1,
            total_rewards_earned = total_rewards_earned + COALESCE(NEW.reward_amount, 0)
        WHERE id = NEW.user_id;
        
        -- 更新用户余额
        IF NEW.reward_type = 'red_flower' THEN
            UPDATE user_balances 
            SET 
                red_flower_balance = red_flower_balance + COALESCE(NEW.reward_amount, 0),
                red_flower_earned_total = red_flower_earned_total + COALESCE(NEW.reward_amount, 0)
            WHERE user_id = NEW.user_id;
        ELSIF NEW.reward_type = 'sm_token' THEN
            UPDATE user_balances 
            SET sm_balance = sm_balance + COALESCE(NEW.reward_amount, 0)
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
    AFTER UPDATE ON task_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- 更新任务参与者数量
CREATE OR REPLACE FUNCTION update_task_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE social_tasks 
        SET current_participants = current_participants + 1
        WHERE id = NEW.task_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE social_tasks 
        SET current_participants = current_participants - 1
        WHERE id = OLD.task_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_participants
    AFTER INSERT OR DELETE ON task_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_task_participants();

-- 更新商人统计信息
CREATE OR REPLACE FUNCTION update_merchant_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 更新卖家统计
        UPDATE merchants 
        SET 
            total_trades = total_trades + 1,
            successful_trades = successful_trades + 1,
            total_volume = total_volume + NEW.sell_amount
        WHERE user_id = NEW.seller_id;
        
        -- 更新买家统计（如果买家也是商人）
        UPDATE merchants 
        SET 
            total_trades = total_trades + 1,
            successful_trades = successful_trades + 1
        WHERE user_id = NEW.buyer_id;
        
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- 取消的交易只增加总交易数，不增加成功交易数
        UPDATE merchants 
        SET total_trades = total_trades + 1
        WHERE user_id = NEW.seller_id;
        
        UPDATE merchants 
        SET total_trades = total_trades + 1
        WHERE user_id = NEW.buyer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_merchant_stats
    AFTER UPDATE ON market_trades
    FOR EACH ROW
    EXECUTE FUNCTION update_merchant_stats();

-- 计算质押奖励
CREATE OR REPLACE FUNCTION calculate_staking_rewards(
    staking_id UUID,
    current_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS DECIMAL AS $$
DECLARE
    staking_record RECORD;
    time_diff INTERVAL;
    annual_seconds CONSTANT DECIMAL := 365.25 * 24 * 3600;
    reward_amount DECIMAL;
BEGIN
    SELECT * INTO staking_record 
    FROM staking_records 
    WHERE id = staking_id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- 计算从上次奖励领取到现在的时间差
    time_diff := current_time - COALESCE(staking_record.last_reward_claim, staking_record.staked_at);
    
    -- 计算奖励：质押金额 * 年化利率 * 时间比例
    reward_amount := staking_record.staked_amount * 
                    (staking_record.reward_rate / 100) * 
                    (EXTRACT(EPOCH FROM time_diff) / annual_seconds);
    
    RETURN GREATEST(reward_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- 领取质押奖励
CREATE OR REPLACE FUNCTION claim_staking_rewards(
    user_wallet_address TEXT,
    staking_id UUID
)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    staking_record RECORD;
    reward_amount DECIMAL;
    result JSONB;
BEGIN
    -- 验证用户
    SELECT * INTO user_record 
    FROM user_profiles 
    WHERE wallet_address = user_wallet_address;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- 验证质押记录
    SELECT * INTO staking_record 
    FROM staking_records 
    WHERE id = staking_id AND user_id = user_record.id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Staking record not found');
    END IF;
    
    -- 计算奖励
    reward_amount := calculate_staking_rewards(staking_id);
    
    IF reward_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No rewards to claim');
    END IF;
    
    -- 更新质押记录
    UPDATE staking_records 
    SET 
        accumulated_rewards = accumulated_rewards + reward_amount,
        last_reward_claim = NOW()
    WHERE id = staking_id;
    
    -- 更新用户余额
    UPDATE user_balances 
    SET red_flower_balance = red_flower_balance + reward_amount
    WHERE user_id = user_record.id;
    
    -- 记录交易
    INSERT INTO transactions (
        user_id, tx_type, status, amount_red_flower, 
        from_address, to_address
    ) VALUES (
        user_record.id, 'reward', 'confirmed', reward_amount,
        'staking_system', user_wallet_address
    );
    
    result := jsonb_build_object(
        'success', true,
        'reward_amount', reward_amount,
        'total_accumulated', staking_record.accumulated_rewards + reward_amount
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 开启宝箱函数
CREATE OR REPLACE FUNCTION open_treasure_box(
    user_wallet_address TEXT,
    box_id UUID
)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    box_record RECORD;
    reward_content JSONB;
    total_value DECIMAL := 0;
    red_flower_reward DECIMAL;
    sm_token_reward DECIMAL;
BEGIN
    -- 验证用户
    SELECT * INTO user_record 
    FROM user_profiles 
    WHERE wallet_address = user_wallet_address;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- 验证宝箱
    SELECT * INTO box_record 
    FROM treasure_boxes 
    WHERE id = box_id AND user_id = user_record.id AND status = 'unopened';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Box not found or already opened');
    END IF;
    
    -- 根据宝箱类型生成随机奖励
    CASE box_record.box_type
        WHEN 'normal' THEN
            red_flower_reward := (random() * 50 + 10)::DECIMAL(20,8); -- 10-60 小红花
        WHEN 'rare' THEN
            red_flower_reward := (random() * 100 + 50)::DECIMAL(20,8); -- 50-150 小红花
        WHEN 'epic' THEN
            red_flower_reward := (random() * 200 + 100)::DECIMAL(20,8); -- 100-300 小红花
            sm_token_reward := (random() * 10 + 5)::DECIMAL(20,8); -- 5-15 SM代币
        WHEN 'legendary' THEN
            red_flower_reward := (random() * 500 + 200)::DECIMAL(20,8); -- 200-700 小红花
            sm_token_reward := (random() * 50 + 20)::DECIMAL(20,8); -- 20-70 SM代币
        WHEN 'crazy' THEN
            red_flower_reward := (random() * 1000 + 500)::DECIMAL(20,8); -- 500-1500 小红花
            sm_token_reward := (random() * 100 + 50)::DECIMAL(20,8); -- 50-150 SM代币
        ELSE
            red_flower_reward := 10;
    END CASE;
    
    -- 构建奖励内容
    reward_content := jsonb_build_object(
        'red_flower', COALESCE(red_flower_reward, 0),
        'sm_token', COALESCE(sm_token_reward, 0),
        'opened_at', NOW()
    );
    
    total_value := COALESCE(red_flower_reward, 0) + COALESCE(sm_token_reward, 0);
    
    -- 更新宝箱状态
    UPDATE treasure_boxes 
    SET 
        status = 'opened',
        reward_content = reward_content,
        total_value = total_value,
        opened_at = NOW()
    WHERE id = box_id;
    
    -- 更新用户余额
    UPDATE user_balances 
    SET 
        red_flower_balance = red_flower_balance + COALESCE(red_flower_reward, 0),
        sm_balance = sm_balance + COALESCE(sm_token_reward, 0)
    WHERE user_id = user_record.id;
    
    -- 记录交易
    IF red_flower_reward > 0 THEN
        INSERT INTO transactions (
            user_id, tx_type, status, amount_red_flower,
            from_address, to_address
        ) VALUES (
            user_record.id, 'reward', 'confirmed', red_flower_reward,
            'treasure_box', user_wallet_address
        );
    END IF;
    
    IF sm_token_reward > 0 THEN
        INSERT INTO transactions (
            user_id, tx_type, status, amount_sm,
            from_address, to_address
        ) VALUES (
            user_record.id, 'reward', 'confirmed', sm_token_reward,
            'treasure_box', user_wallet_address
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'rewards', reward_content,
        'total_value', total_value
    );
END;
$$ LANGUAGE plpgsql;

-- 获取用户统计信息
CREATE OR REPLACE FUNCTION get_user_stats(user_wallet_address TEXT)
RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    balance_record RECORD;
    stats JSONB;
BEGIN
    -- 获取用户信息
    SELECT * INTO user_record 
    FROM user_profiles 
    WHERE wallet_address = user_wallet_address;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- 获取余额信息
    SELECT * INTO balance_record 
    FROM user_balances 
    WHERE user_id = user_record.id;
    
    -- 构建统计信息
    stats := jsonb_build_object(
        'success', true,
        'user_id', user_record.id,
        'username', user_record.username,
        'total_tasks_completed', user_record.total_tasks_completed,
        'total_rewards_earned', user_record.total_rewards_earned,
        'reputation_score', user_record.reputation_score,
        'balances', jsonb_build_object(
            'sm_balance', COALESCE(balance_record.sm_balance, 0),
            'sm_staked', COALESCE(balance_record.sm_staked, 0),
            'red_flower_balance', COALESCE(balance_record.red_flower_balance, 0),
            'red_flower_earned_total', COALESCE(balance_record.red_flower_earned_total, 0),
            'bnb_balance', COALESCE(balance_record.bnb_balance, 0)
        ),
        'social_accounts', jsonb_build_object(
            'twitter', jsonb_build_object(
                'username', user_record.twitter_username,
                'verified', user_record.twitter_verified
            ),
            'discord', jsonb_build_object(
                'username', user_record.discord_username,
                'verified', user_record.discord_verified
            ),
            'telegram', jsonb_build_object(
                'username', user_record.telegram_username,
                'verified', user_record.telegram_verified
            )
        ),
        'status', jsonb_build_object(
            'is_verified', user_record.is_verified,
            'is_merchant', user_record.is_merchant,
            'is_banned', user_record.is_banned
        )
    );
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

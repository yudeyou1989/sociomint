-- SocioMint 行级安全策略 (RLS)
-- 确保数据安全和用户隐私
-- 创建时间: 2024-12-19

-- 启用所有表的 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasure_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_records ENABLE ROW LEVEL SECURITY;

-- 用户资料表策略
-- 用户只能查看和更新自己的资料
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = wallet_address OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = wallet_address);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

-- 公开查看用户基本信息（用于显示用户名等）
CREATE POLICY "Public profiles viewable" ON user_profiles
    FOR SELECT USING (true);

-- 用户余额表策略
-- 用户只能查看自己的余额
CREATE POLICY "Users can view own balance" ON user_balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = user_balances.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can update own balance" ON user_balances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = user_balances.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
    );

CREATE POLICY "Service can manage balances" ON user_balances
    FOR ALL USING (auth.role() = 'service_role');

-- 交易记录表策略
-- 用户只能查看自己的交易记录
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = transactions.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Service can manage transactions" ON transactions
    FOR ALL USING (auth.role() = 'service_role');

-- 社交任务表策略
-- 所有用户都可以查看活跃的任务
CREATE POLICY "Anyone can view active tasks" ON social_tasks
    FOR SELECT USING (status = 'active' OR auth.role() = 'service_role');

-- 任务创建者可以管理自己的任务
CREATE POLICY "Creators can manage own tasks" ON social_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = social_tasks.creator_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
        OR auth.role() = 'service_role'
    );

-- 商人可以创建任务
CREATE POLICY "Merchants can create tasks" ON social_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            JOIN merchants ON merchants.user_id = user_profiles.id
            WHERE user_profiles.wallet_address = auth.uid()::text
            AND merchants.status = 'active'
        )
        OR auth.role() = 'service_role'
    );

-- 任务完成记录策略
-- 用户可以查看自己的任务完成记录
CREATE POLICY "Users can view own completions" ON task_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = task_completions.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
        OR auth.role() = 'service_role'
    );

-- 用户可以提交任务完成
CREATE POLICY "Users can submit completions" ON task_completions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = task_completions.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
    );

-- 任务创建者可以查看自己任务的完成情况
CREATE POLICY "Task creators can view completions" ON task_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM social_tasks 
            JOIN user_profiles ON user_profiles.id = social_tasks.creator_id
            WHERE social_tasks.id = task_completions.task_id
            AND user_profiles.wallet_address = auth.uid()::text
        )
        OR auth.role() = 'service_role'
    );

-- 服务角色可以更新验证状态
CREATE POLICY "Service can verify completions" ON task_completions
    FOR UPDATE USING (auth.role() = 'service_role');

-- 宝箱系统策略
-- 用户只能查看和操作自己的宝箱
CREATE POLICY "Users can view own boxes" ON treasure_boxes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = treasure_boxes.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Users can open own boxes" ON treasure_boxes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = treasure_boxes.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
        AND status = 'unopened'
    );

CREATE POLICY "Service can manage boxes" ON treasure_boxes
    FOR ALL USING (auth.role() = 'service_role');

-- 商人系统策略
-- 用户可以查看所有活跃商人的基本信息
CREATE POLICY "Anyone can view active merchants" ON merchants
    FOR SELECT USING (status = 'active' OR auth.role() = 'service_role');

-- 用户可以申请成为商人
CREATE POLICY "Users can apply to be merchant" ON merchants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = merchants.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
    );

-- 商人可以更新自己的信息
CREATE POLICY "Merchants can update own info" ON merchants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = merchants.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
    );

-- 服务角色可以管理商人状态
CREATE POLICY "Service can manage merchants" ON merchants
    FOR ALL USING (auth.role() = 'service_role');

-- 市场交易策略
-- 用户可以查看所有活跃的交易
CREATE POLICY "Anyone can view active trades" ON market_trades
    FOR SELECT USING (status IN ('pending', 'accepted') OR auth.role() = 'service_role');

-- 用户可以查看自己参与的所有交易
CREATE POLICY "Users can view own trades" ON market_trades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.id = market_trades.seller_id OR user_profiles.id = market_trades.buyer_id)
            AND user_profiles.wallet_address = auth.uid()::text
        )
        OR auth.role() = 'service_role'
    );

-- 用户可以创建交易
CREATE POLICY "Users can create trades" ON market_trades
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = market_trades.seller_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
    );

-- 用户可以更新自己参与的交易
CREATE POLICY "Users can update own trades" ON market_trades
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE (user_profiles.id = market_trades.seller_id OR user_profiles.id = market_trades.buyer_id)
            AND user_profiles.wallet_address = auth.uid()::text
        )
    );

-- 质押记录策略
-- 用户只能查看自己的质押记录
CREATE POLICY "Users can view own staking" ON staking_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = staking_records.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
        OR auth.role() = 'service_role'
    );

-- 用户可以创建质押记录
CREATE POLICY "Users can create staking" ON staking_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = staking_records.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
    );

-- 用户可以更新自己的质押记录
CREATE POLICY "Users can update own staking" ON staking_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = staking_records.user_id 
            AND user_profiles.wallet_address = auth.uid()::text
        )
    );

-- 服务角色可以管理所有质押记录
CREATE POLICY "Service can manage staking" ON staking_records
    FOR ALL USING (auth.role() = 'service_role');
